/**
 * Full bulk ETL loader — run locally with direct Supabase access.
 *
 * Loads ALL 28,384 sales and 6,206 payments from CSVs into Supabase,
 * replacing the monthly aggregate placeholders with full detail.
 *
 * Usage:
 *   npx tsx scripts/etl/99-bulk-load-full.ts
 *
 * Requires:
 *   - .env.local with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   - Network access to *.supabase.co (NOT available in Claude Code sandbox)
 */

import path from 'path';
import { sb, batchInsert } from './lib/supabase.js';
import { readCsv, parseCurrency, parseNumber, parseDate, cleanString } from './lib/csv.js';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

interface SaleRow {
    ID?: string; DATE?: string; PROD?: string; TERMINAL?: string; CARRIER?: string;
    TRUCK?: string; TRAILER?: string; BOL?: string; Glls?: string;
    ' AP '?: string; AP?: string; CLIENT?: string;
    ' AR '?: string; AR?: string; ' REVENUE '?: string; REVENUE?: string;
}

interface PaymentRow {
    DATE?: string; CLIENT?: string;
    ' PAYMENT '?: string; PAYMENT?: string;
    ' Ajustes '?: string; Ajustes?: string; Notes?: string;
}

function mapProduct(prod: string | undefined): string {
    if (!prod) return 'ULSD';
    const p = prod.toUpperCase().trim();
    if (p.includes('ETHANOL')) return 'ETHANOL';
    if (p.includes('NAPHTHA')) return 'NAPHTHA';
    if (p.includes('GASOLINE') || p.includes('GASOLINA')) return 'GASOLINE';
    return 'ULSD';
}

async function main() {
    console.log('=== FULL BULK ETL: All sales + payments ===\n');
    console.log('⚠️  This will DELETE monthly aggregates and replace with full detail.');
    console.log('Press Ctrl+C in the next 5 seconds to abort...\n');
    await new Promise(r => setTimeout(r, 5000));

    // 1. Resolve company + ALPHA + product/partner UUIDs
    const { data: company } = await sb.from('companies').select('id').eq('type', 'ORKA_MX').single();
    if (!company) throw new Error('ORKA_MX company not found');
    const companyId = company.id;

    const { data: products } = await sb.from('products').select('id, code').eq('company_id', companyId);
    const productByCode = new Map((products ?? []).map(p => [p.code, p.id]));

    const { data: partners } = await sb.from('partners').select('id, name, type').eq('company_id', companyId);
    const clientByName = new Map((partners ?? []).filter(p => p.type === 'Client').map(p => [p.name, p.id]));
    const carrierByName = new Map((partners ?? []).filter(p => p.type === 'Carrier').map(p => [p.name, p.id]));

    console.log(`Loaded: ${products?.length} products, ${clientByName.size} clients, ${carrierByName.size} carriers\n`);

    // 2. Clear ALPHA monthly aggregates (we will replace with full detail)
    console.log('Clearing existing ALPHA aggregates...');
    await sb.from('sales').delete().like('legacy_external_id', 'MONTHLY_AGG_%');
    await sb.from('payments').delete().like('legacy_external_id', 'MONTHLY_PAY_%');
    await sb.from('payments').delete().eq('legacy_external_id', 'ADJUSTMENTS_ALPHA');

    // 3. Load all sales
    console.log('\nReading Sales & Costs CSV...');
    const salesAll = readCsv<SaleRow>(path.join(PUBLIC_DIR, 'Sales & Costs-HUGO REPORT (1).csv'));
    const validSales = salesAll
        .filter(s => cleanString(s.CLIENT))
        .map((s, i) => ({
            company_id: companyId,
            sale_date: parseDate(s.DATE),
            product_id: productByCode.get(mapProduct(cleanString(s.PROD))) ?? null,
            customer_id: clientByName.get(cleanString(s.CLIENT)!) ?? null,
            carrier_id: carrierByName.get(cleanString(s.CARRIER) || '') ?? null,
            truck_number: cleanString(s.TRUCK),
            trailer_number: cleanString(s.TRAILER),
            bol_number: cleanString(s.BOL) ? `${cleanString(s.BOL)}_${i}` : `NO_BOL_${i}`,
            gallons: parseNumber(s.Glls),
            rate: parseCurrency(s[' AR '] || s.AR),
            unit_cost: parseCurrency(s[' AP '] || s.AP),
            total_sale: parseCurrency(s[' REVENUE '] || s.REVENUE),
            status: 'DONE',
            legacy_external_id: cleanString(s.ID),
        }))
        .filter(s => s.sale_date && s.product_id && s.customer_id && s.gallons && s.total_sale !== 0);

    console.log(`Inserting ${validSales.length} sales...`);
    const salesResult = await batchInsert('sales', validSales, 500, 'company_id,bol_number');
    console.log(`  ✓ Inserted ${salesResult.inserted}, errors: ${salesResult.errors.length}`);

    // 4. Load all payments
    console.log('\nReading Payments CSV...');
    const paymentsAll = readCsv<PaymentRow>(path.join(PUBLIC_DIR, 'Payments from Clients-Grid view.csv'));
    const validPayments = paymentsAll
        .filter(p => cleanString(p.CLIENT))
        .map((p, i) => {
            const amt = -parseCurrency(p[' PAYMENT '] || p.PAYMENT); // CSV negatives = received
            const adj = parseCurrency(p[' Ajustes '] || p.Ajustes);
            return {
                company_id: companyId,
                customer_id: clientByName.get(cleanString(p.CLIENT)!) ?? null,
                payment_date: parseDate(p.DATE),
                amount: amt + adj,
                notes: cleanString(p.Notes),
                legacy_external_id: `BULK_PAY_${i}`,
            };
        })
        .filter(p => p.customer_id && p.payment_date && p.amount > 0);

    console.log(`Inserting ${validPayments.length} payments...`);
    const paymentsResult = await batchInsert('payments', validPayments, 500);
    console.log(`  ✓ Inserted ${paymentsResult.inserted}, errors: ${paymentsResult.errors.length}`);

    // 5. Verify ALPHA balance
    console.log('\n=== Verification ===');
    const { data: balance } = await sb
        .from('v_client_balances')
        .select('client_name, total_billed, total_paid, balance_due, credit_limit')
        .eq('client_name', 'ALPHA')
        .single();

    console.log('ALPHA Balance:', balance);
    const expected = 762710.25;
    const actual = Number(balance?.balance_due ?? 0);
    const diff = Math.abs(actual - expected);
    console.log(`Expected from CSV: $${expected}`);
    console.log(`Diff: $${diff.toFixed(2)} (${diff < 100 ? 'PASS ✓' : 'REVIEW ✗'})`);

    console.log('\n=== Bulk ETL complete ===');
}

main().catch(e => {
    console.error('FATAL:', e);
    process.exit(1);
});
