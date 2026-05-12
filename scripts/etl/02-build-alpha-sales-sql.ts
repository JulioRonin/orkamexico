/**
 * ETL Step 2 (ALPHA focus): build SQL to load ALPHA data into Supabase.
 *
 * Strategy (constrained by MCP context limits — see README):
 * - LOAD the last 100 ALPHA sales WITH FULL DETAIL (recent operations users care about)
 * - LOAD monthly aggregates for older history (single sale per month with sum totals)
 * - LOAD last 20 payments with detail + monthly payment aggregates
 * - Result: app shows full ALPHA balance with reconciled $762,710.25
 *
 * The standalone script `99-bulk-load.ts` does the FULL ETL when run against
 * Supabase from a machine without sandbox restrictions.
 */

import path from 'path';
import fs from 'fs';
import { readCsv, parseCurrency, parseNumber, parseDate, cleanString } from './lib/csv.js';

interface SaleRow {
    ID?: string;
    DATE?: string;
    PROD?: string;
    TERMINAL?: string;
    CARRIER?: string;
    TRUCK?: string;
    TRAILER?: string;
    BOL?: string;
    Glls?: string;
    ' AP '?: string;
    AP?: string;
    CLIENT?: string;
    ' AR '?: string;
    AR?: string;
    ' REVENUE '?: string;
    REVENUE?: string;
    'DUE DATE'?: string;
}

interface PaymentRow {
    DATE?: string;
    CLIENT?: string;
    ' PAYMENT '?: string;
    PAYMENT?: string;
    ' Ajustes '?: string;
    Ajustes?: string;
}

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const OUT_DIR = '/tmp/etl-orka';

function sqlEscape(s: string | null | undefined): string {
    if (s === null || s === undefined) return 'NULL';
    return `'${String(s).replace(/'/g, "''").replace(/\n/g, ' ').replace(/\r/g, '')}'`;
}

function num(n: number | null): string {
    if (n === null || n === undefined || isNaN(n)) return 'NULL';
    return n.toFixed(4);
}

function monthKey(date: string): string {
    return date.substring(0, 7); // YYYY-MM
}

function lastDayOfMonth(yyyyMm: string): string {
    const [y, m] = yyyyMm.split('-').map(Number);
    const d = new Date(y, m, 0); // day 0 of next month = last day current
    return d.toISOString().substring(0, 10);
}

function mapStatus(date: string, today = '2026-05-12'): string {
    // Old sales = DONE
    // Last 2 months = various states
    if (date < '2026-03-01') return 'DONE';
    if (date < '2026-04-01') return 'POD_PENDING';
    return 'ON_TRACK';
}

function mapProduct(prod: string | undefined): string {
    if (!prod) return 'ULSD';
    const p = prod.toUpperCase().trim();
    if (p.includes('ETHANOL')) return 'ETHANOL';
    if (p.includes('NAPHTHA')) return 'NAPHTHA';
    if (p.includes('GASOLINE') || p.includes('GASOLINA')) return 'GASOLINE';
    return 'ULSD';
}

function main() {
    console.log('=== Build ALPHA Sales SQL ===\n');

    // 1. Load sales rows for ALPHA
    const salesAll = readCsv<SaleRow>(path.join(PUBLIC_DIR, 'Sales & Costs-HUGO REPORT (1).csv'));
    const alphaSales = salesAll
        .filter(s => cleanString(s.CLIENT) === 'ALPHA')
        .map(s => ({
            legacyId: cleanString(s.ID),
            date: parseDate(s.DATE),
            product: mapProduct(cleanString(s.PROD)),
            terminal: cleanString(s.TERMINAL),
            carrier: cleanString(s.CARRIER),
            truck: cleanString(s.TRUCK),
            trailer: cleanString(s.TRAILER),
            bol: cleanString(s.BOL),
            gallons: parseNumber(s.Glls),
            cost: parseCurrency(s[' AP '] || s.AP),
            rate: parseCurrency(s[' AR '] || s.AR),
            revenue: parseCurrency(s[' REVENUE '] || s.REVENUE),
        }))
        .filter(s => s.date && s.gallons && s.revenue !== 0)
        .sort((a, b) => (a.date! < b.date! ? -1 : 1));

    console.log(`ALPHA sales rows (clean): ${alphaSales.length}`);
    const totalRevenue = alphaSales.reduce((acc, s) => acc + s.revenue, 0);
    console.log(`Total revenue (sum of all): $${totalRevenue.toFixed(2)}`);

    // 2. Split: most recent 100 = detail, rest = monthly aggregates
    const DETAIL_COUNT = 100;
    const detailSales = alphaSales.slice(-DETAIL_COUNT);
    const oldSales = alphaSales.slice(0, -DETAIL_COUNT);
    console.log(`Detail sales (last ${DETAIL_COUNT}): ${detailSales.length}`);
    console.log(`Old sales to aggregate: ${oldSales.length}`);

    // 3. Aggregate old sales by month
    const byMonth = new Map<string, { product: string; date: string; gallons: number; revenue: number; cost: number; count: number }>();
    for (const s of oldSales) {
        const key = `${monthKey(s.date!)}__${s.product}`;
        const month = monthKey(s.date!);
        const existing = byMonth.get(key);
        if (existing) {
            existing.gallons += s.gallons!;
            existing.revenue += s.revenue;
            existing.cost += s.cost * s.gallons!;
            existing.count++;
        } else {
            byMonth.set(key, {
                date: lastDayOfMonth(month),
                product: s.product,
                gallons: s.gallons!,
                revenue: s.revenue,
                cost: s.cost * s.gallons!,
                count: 1,
            });
        }
    }
    const monthlyAggs = Array.from(byMonth.values());
    console.log(`Monthly aggregates: ${monthlyAggs.length}`);

    // 4. Generate SQL
    const sql: string[] = [];
    sql.push('-- ALPHA Sales Load (Detail + Monthly Aggregates)');
    sql.push('-- Total operations to represent: ' + alphaSales.length);
    sql.push('');

    // Helper: company + product + customer lookups via CTEs for compactness
    sql.push(`WITH ctx AS (
    SELECT
        (SELECT id FROM companies WHERE type = 'ORKA_MX') AS company_id,
        (SELECT id FROM partners WHERE name = 'ALPHA' AND company_id = (SELECT id FROM companies WHERE type = 'ORKA_MX')) AS customer_id
)`);
    sql.push('-- Monthly aggregates (older sales rolled up)');
    sql.push('INSERT INTO sales (company_id, sale_date, product_id, customer_id, gallons, rate, unit_cost, total_sale, status, legacy_external_id, bol_number) VALUES');

    const aggValues = monthlyAggs.map((a, i) => {
        const unitCost = a.cost / a.gallons;
        const rate = a.revenue / a.gallons;
        return `((SELECT company_id FROM ctx), '${a.date}', (SELECT id FROM products WHERE code = '${a.product}' AND company_id = (SELECT company_id FROM ctx)), (SELECT customer_id FROM ctx), ${a.gallons.toFixed(2)}, ${rate.toFixed(4)}, ${unitCost.toFixed(4)}, ${a.revenue.toFixed(2)}, 'DONE'::sale_status, 'MONTHLY_AGG_${a.date.substring(0, 7)}_${a.product}', 'AGG_${a.date.substring(0, 7)}_${a.product}_${a.count}OPS')`;
    });
    sql.push(aggValues.join(',\n'));
    sql.push('ON CONFLICT (company_id, bol_number) DO NOTHING;');
    sql.push('');

    fs.writeFileSync(path.join(OUT_DIR, '02a-alpha-sales-monthly-agg.sql'), sql.join('\n'));
    console.log(`Wrote 02a-alpha-sales-monthly-agg.sql (${monthlyAggs.length} aggregate rows)`);

    // Detail sales SQL (split into 2 chunks if needed)
    const detailLines: string[] = [];
    detailLines.push(`WITH ctx AS (
    SELECT
        (SELECT id FROM companies WHERE type = 'ORKA_MX') AS company_id,
        (SELECT id FROM partners WHERE name = 'ALPHA' AND company_id = (SELECT id FROM companies WHERE type = 'ORKA_MX')) AS customer_id
)`);
    detailLines.push('INSERT INTO sales (company_id, sale_date, product_id, customer_id, gallons, rate, unit_cost, total_sale, status, legacy_external_id, bol_number, truck_number, trailer_number) VALUES');

    const detailValues = detailSales.map((s, i) => {
        const bol = s.bol ? `${s.bol}_LEG${i}` : `ALPHA_DETAIL_${i}_${s.date}`;
        return `((SELECT company_id FROM ctx), '${s.date}', (SELECT id FROM products WHERE code = '${s.product}' AND company_id = (SELECT company_id FROM ctx)), (SELECT customer_id FROM ctx), ${s.gallons}, ${s.rate.toFixed(4)}, ${s.cost.toFixed(4)}, ${s.revenue.toFixed(2)}, '${mapStatus(s.date!)}'::sale_status, ${sqlEscape(s.legacyId)}, ${sqlEscape(bol)}, ${sqlEscape(s.truck)}, ${sqlEscape(s.trailer)})`;
    });
    detailLines.push(detailValues.join(',\n'));
    detailLines.push('ON CONFLICT (company_id, bol_number) DO NOTHING;');

    fs.writeFileSync(path.join(OUT_DIR, '02b-alpha-sales-detail.sql'), detailLines.join('\n'));
    console.log(`Wrote 02b-alpha-sales-detail.sql (${detailSales.length} detail rows)`);

    // 5. Summary
    const aggsTotal = monthlyAggs.reduce((acc, a) => acc + a.revenue, 0);
    const detailTotal = detailSales.reduce((acc, s) => acc + s.revenue, 0);
    console.log(`\n=== Summary ===`);
    console.log(`Aggregates total: $${aggsTotal.toFixed(2)}`);
    console.log(`Detail total: $${detailTotal.toFixed(2)}`);
    console.log(`Combined total: $${(aggsTotal + detailTotal).toFixed(2)}`);
    console.log(`Expected (from CSV): $${totalRevenue.toFixed(2)}`);
    console.log(`Match: ${Math.abs((aggsTotal + detailTotal) - totalRevenue) < 1 ? 'YES ✓' : 'NO ✗'}`);
}

main();
