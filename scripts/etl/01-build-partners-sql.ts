/**
 * ETL Step 1 (offline mode): Generate SQL for partners.
 * Reads CSVs locally and writes /tmp/etl-orka/01-partners.sql
 * which is then applied via Supabase MCP.
 */

import path from 'path';
import fs from 'fs';
import { readCsv, parseCurrency, cleanString } from './lib/csv.js';

interface ClientRow {
    Name: string;
    'Payment terms'?: string;
    'Days of Credit'?: string;
    'Credit Limit'?: string;
    Status?: string;
}
interface SaleRow { CLIENT?: string; CARRIER?: string }

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const OUT_DIR = '/tmp/etl-orka';
fs.mkdirSync(OUT_DIR, { recursive: true });

function sanitizeRfc(name: string, prefix = 'LEG'): string {
    // Use full uppercase alphanumeric — no truncation, no collision
    const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `${prefix}_${clean || 'EMPTY'}`;
}

function uniqueRfc(rfc: string, used: Set<string>): string {
    if (!used.has(rfc)) { used.add(rfc); return rfc; }
    let i = 2;
    while (used.has(`${rfc}_${i}`)) i++;
    const out = `${rfc}_${i}`;
    used.add(out);
    return out;
}

function sqlEscape(s: string | null | undefined): string {
    if (s === null || s === undefined) return 'NULL';
    return `'${String(s).replace(/'/g, "''")}'`;
}

function main() {
    console.log('=== Build Partners SQL ===\n');

    const clientsCsv = readCsv<ClientRow>(path.join(PUBLIC_DIR, 'Client List-Grid view.csv'));
    console.log(`Client List rows: ${clientsCsv.length}`);

    const salesCsv = readCsv<SaleRow>(path.join(PUBLIC_DIR, 'Sales & Costs-HUGO REPORT (1).csv'));
    console.log(`Sales rows: ${salesCsv.length}`);

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

    const usedRfcs = new Set<string>();
    const clientPartners = new Map<string, any>();

    for (const row of clientsCsv) {
        const name = cleanString(row.Name);
        if (!name) continue;
        const creditLimit = parseCurrency(row['Credit Limit']);
        clientPartners.set(name, {
            name, type: 'Client', rfc: uniqueRfc(sanitizeRfc(name, 'CLI'), usedRfcs),
            credit_limit: creditLimit, is_active: true,
        });
    }
    for (const name of clientsFromSales) {
        if (!clientPartners.has(name)) {
            clientPartners.set(name, {
                name, type: 'Client', rfc: uniqueRfc(sanitizeRfc(name, 'CLI'), usedRfcs),
                credit_limit: 0, is_active: true,
            });
        }
    }

    const carrierPartners = new Map<string, any>();
    for (const name of carriersFromSales) {
        carrierPartners.set(name, {
            name, type: 'Carrier', rfc: uniqueRfc(sanitizeRfc(name, 'CAR'), usedRfcs),
            credit_limit: 0, is_active: true,
        });
    }

    const allPartners = [...clientPartners.values(), ...carrierPartners.values()];
    console.log(`\nTotal partners to insert: ${allPartners.length}`);
    console.log(`  Clients: ${clientPartners.size}`);
    console.log(`  Carriers: ${carrierPartners.size}`);

    // Helper: chunk an INSERT into N smaller files
    function writeInsertChunks(filePrefix: string, rows: any[], chunkSize: number) {
        const numChunks = Math.ceil(rows.length / chunkSize);
        for (let c = 0; c < numChunks; c++) {
            const chunk = rows.slice(c * chunkSize, (c + 1) * chunkSize);
            const lines: string[] = [];
            lines.push(`-- ${filePrefix} chunk ${c + 1}/${numChunks} (${chunk.length} rows)`);
            lines.push(`INSERT INTO partners (company_id, name, type, rfc, credit_limit, credit_available, is_active) VALUES`);
            lines.push(chunk.map(p =>
                `((SELECT id FROM companies WHERE type = 'ORKA_MX'), ` +
                `${sqlEscape(p.name)}, ${sqlEscape(p.type)}::partner_type, ` +
                `${sqlEscape(p.rfc)}, ${p.credit_limit}, ${p.credit_limit}, ${p.is_active})`
            ).join(',\n'));
            lines.push(`ON CONFLICT (company_id, rfc) DO UPDATE SET`);
            lines.push(`  name = EXCLUDED.name,`);
            lines.push(`  type = EXCLUDED.type,`);
            lines.push(`  credit_limit = EXCLUDED.credit_limit,`);
            lines.push(`  is_active = EXCLUDED.is_active,`);
            lines.push(`  updated_at = CURRENT_TIMESTAMP;`);
            const p = path.join(OUT_DIR, `${filePrefix}-${String(c + 1).padStart(3, '0')}.sql`);
            fs.writeFileSync(p, lines.join('\n'));
            console.log(`  Wrote ${p} (${(fs.statSync(p).size / 1024).toFixed(1)} KB)`);
        }
    }

    // Fix ALPHA rfc first (compatible with new format)
    const alphaRfc = clientPartners.get('ALPHA')?.rfc || sanitizeRfc('ALPHA', 'CLI');
    fs.writeFileSync(
        path.join(OUT_DIR, '01a-fix-alpha-rfc.sql'),
        `UPDATE partners SET rfc = ${sqlEscape(alphaRfc)}\n  WHERE name = 'ALPHA' AND company_id = (SELECT id FROM companies WHERE type = 'ORKA_MX');\n`
    );
    console.log(`  Wrote 01a-fix-alpha-rfc.sql (ALPHA rfc: ${alphaRfc})`);

    // Chunk clients (150 per chunk)
    writeInsertChunks('01b-clients', [...clientPartners.values()], 150);
    // Chunk carriers (150 per chunk)
    writeInsertChunks('01c-carriers', [...carrierPartners.values()], 150);

    // Also write name→rfc mapping for next steps (split by type)
    const partnerMap = {
        clients: {} as Record<string, string>,
        carriers: {} as Record<string, string>,
    };
    for (const p of clientPartners.values()) partnerMap.clients[p.name] = p.rfc;
    for (const p of carrierPartners.values()) partnerMap.carriers[p.name] = p.rfc;
    fs.writeFileSync(
        path.join(OUT_DIR, 'partner-rfc-map.json'),
        JSON.stringify(partnerMap, null, 2)
    );
    console.log(`Wrote partner-rfc-map.json (clients: ${Object.keys(partnerMap.clients).length}, carriers: ${Object.keys(partnerMap.carriers).length})`);
}

main();
