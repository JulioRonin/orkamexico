/**
 * ETL Step 1: Load Partners (Clients + Carriers)
 *
 * Strategy:
 * - Read Client List (manually curated list with credit limits)
 * - Also extract unique CLIENT and CARRIER from Sales & Costs (catch all)
 * - Generate placeholder RFCs (XAXX010101000-style) — user can fix later
 * - All loaded under ORKA_MX company (for now). MX/USA split happens via UI later.
 *
 * Idempotent: uses ON CONFLICT(company_id, rfc) DO UPDATE.
 */

import path from 'path';
import { sb } from './lib/supabase.js';
import { readCsv, parseCurrency, cleanString } from './lib/csv.js';

interface ClientRow {
    Name: string;
    'Payment terms'?: string;
    'Days of Credit'?: string;
    'Credit Limit'?: string;
    Status?: string;
}

interface SaleRow {
    CLIENT?: string;
    CARRIER?: string;
}

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function sanitizeRfc(name: string): string {
    // Generate a deterministic placeholder RFC from name
    const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 12);
    return `LEG${clean.padEnd(10, '0').substring(0, 10)}`;
}

async function main() {
    console.log('=== ETL 01: Load Partners ===\n');

    // 1. Get ORKA_MX company_id
    const { data: companies, error: cErr } = await sb
        .from('companies')
        .select('id, type')
        .eq('type', 'ORKA_MX')
        .single();

    if (cErr || !companies) throw new Error(`Cannot find ORKA_MX company: ${cErr?.message}`);
    const companyId = companies.id;
    console.log(`ORKA_MX company_id: ${companyId}\n`);

    // 2. Read Client List
    const clientsCsv = readCsv<ClientRow>(path.join(PUBLIC_DIR, 'Client List-Grid view.csv'));
    console.log(`Read ${clientsCsv.length} rows from Client List`);

    // 3. Read Sales & Costs to extract unique CLIENT + CARRIER not in Client List
    const salesCsv = readCsv<SaleRow>(path.join(PUBLIC_DIR, 'Sales & Costs-HUGO REPORT (1).csv'));
    console.log(`Read ${salesCsv.length} rows from Sales & Costs`);

    const clientsFromSales = new Set<string>();
    const carriersFromSales = new Set<string>();
    for (const row of salesCsv) {
        const c = cleanString(row.CLIENT);
        if (c) clientsFromSales.add(c);
        const car = cleanString(row.CARRIER);
        if (car) carriersFromSales.add(car);
    }
    console.log(`Unique clients in sales: ${clientsFromSales.size}`);
    console.log(`Unique carriers in sales: ${carriersFromSales.size}`);

    // 4. Merge: clients from Client List (with metadata) + clients from sales (no metadata)
    const clientPartners = new Map<string, any>();

    // First pass: Client List has metadata
    for (const row of clientsCsv) {
        const name = cleanString(row.Name);
        if (!name) continue;
        const creditLimit = parseCurrency(row['Credit Limit']);
        clientPartners.set(name, {
            company_id: companyId,
            name,
            type: 'Client',
            rfc: sanitizeRfc(name),
            credit_limit: creditLimit,
            credit_available: creditLimit, // will be recalculated by view
            is_active: cleanString(row.Status) !== 'Inactive',
        });
    }

    // Second pass: clients in sales but not in Client List
    for (const name of clientsFromSales) {
        if (!clientPartners.has(name)) {
            clientPartners.set(name, {
                company_id: companyId,
                name,
                type: 'Client',
                rfc: sanitizeRfc(name),
                credit_limit: 0,
                credit_available: 0,
                is_active: true,
            });
        }
    }

    // 5. Carriers
    const carrierPartners = new Map<string, any>();
    for (const name of carriersFromSales) {
        carrierPartners.set(name, {
            company_id: companyId,
            name,
            type: 'Carrier',
            rfc: sanitizeRfc(`CAR_${name}`),
            credit_limit: 0,
            is_active: true,
        });
    }

    console.log(`\nTotal partners to insert:`);
    console.log(`  Clients: ${clientPartners.size}`);
    console.log(`  Carriers: ${carrierPartners.size}`);

    // 6. Upsert. ALPHA already exists with its rfc 'ALPHA000000000' - we need to handle that
    // Strategy: delete the placeholder ALPHA first if rfc differs
    const { data: alphaExisting } = await sb
        .from('partners')
        .select('id, name, rfc')
        .eq('company_id', companyId)
        .eq('name', 'ALPHA')
        .single();

    if (alphaExisting && alphaExisting.rfc === 'ALPHA000000000') {
        console.log(`\nUpdating existing ALPHA rfc to deterministic value...`);
        await sb
            .from('partners')
            .update({ rfc: sanitizeRfc('ALPHA') })
            .eq('id', alphaExisting.id);
    }

    const allPartners = [...clientPartners.values(), ...carrierPartners.values()];
    console.log(`\nUpserting ${allPartners.length} partners in batches...`);

    const BATCH = 200;
    let inserted = 0;
    let errors = 0;
    for (let i = 0; i < allPartners.length; i += BATCH) {
        const batch = allPartners.slice(i, i + BATCH);
        const { error, data } = await sb
            .from('partners')
            .upsert(batch, { onConflict: 'company_id,rfc', ignoreDuplicates: false })
            .select('id');
        if (error) {
            console.error(`  Batch ${i / BATCH} failed: ${error.message}`);
            errors++;
        } else {
            inserted += data?.length ?? batch.length;
        }
    }

    console.log(`\nResult: ${inserted} partners upserted, ${errors} batch errors`);

    // 7. Verify
    const { count: clientCount } = await sb
        .from('partners')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('type', 'Client');
    const { count: carrierCount } = await sb
        .from('partners')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('type', 'Carrier');

    console.log(`\nFinal counts in DB for ORKA_MX:`);
    console.log(`  Clients: ${clientCount}`);
    console.log(`  Carriers: ${carrierCount}`);

    // Verify ALPHA
    const { data: alpha } = await sb
        .from('partners')
        .select('id, name, rfc, credit_limit')
        .eq('company_id', companyId)
        .eq('name', 'ALPHA')
        .single();
    console.log(`\nALPHA verification:`, alpha);
}

main().catch((e) => {
    console.error('FATAL:', e);
    process.exit(1);
});
