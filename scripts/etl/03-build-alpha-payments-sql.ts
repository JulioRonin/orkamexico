/**
 * ETL Step 3: ALPHA payments — monthly aggregates + last 20 detail
 */

import path from 'path';
import fs from 'fs';
import { readCsv, parseCurrency, parseDate, cleanString } from './lib/csv.js';

interface PaymentRow {
    DATE?: string;
    CLIENT?: string;
    ' PAYMENT '?: string;
    PAYMENT?: string;
    ' Ajustes '?: string;
    Ajustes?: string;
    Notes?: string;
}

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const OUT_DIR = '/tmp/etl-orka';

function monthKey(date: string): string { return date.substring(0, 7); }
function lastDayOfMonth(yyyyMm: string): string {
    const [y, m] = yyyyMm.split('-').map(Number);
    return new Date(y, m, 0).toISOString().substring(0, 10);
}

function main() {
    console.log('=== Build ALPHA Payments SQL ===\n');

    const paymentsAll = readCsv<PaymentRow>(path.join(PUBLIC_DIR, 'Payments from Clients-Grid view.csv'));
    const alpha = paymentsAll
        .filter(p => cleanString(p.CLIENT) === 'ALPHA')
        .map(p => ({
            date: parseDate(p.DATE),
            payment: parseCurrency(p[' PAYMENT '] || p.PAYMENT),  // negative = received
            ajuste: parseCurrency(p[' Ajustes '] || p.Ajustes),
            notes: cleanString(p.Notes),
        }))
        .filter(p => p.date && (p.payment !== 0 || p.ajuste !== 0))
        .sort((a, b) => (a.date! < b.date! ? -1 : 1));

    console.log(`ALPHA payment rows: ${alpha.length}`);

    // In the CSV, PAYMENT is negative when received (cash inflow). Flip sign.
    const totalReceived = -alpha.reduce((acc, p) => acc + p.payment, 0);
    const totalAjustes = alpha.reduce((acc, p) => acc + p.ajuste, 0);
    console.log(`Total received: $${totalReceived.toFixed(2)}`);
    console.log(`Total ajustes: $${totalAjustes.toFixed(2)}`);

    // Split: last 20 = detail, rest = monthly aggregates
    const DETAIL_COUNT = 20;
    const detailPayments = alpha.slice(-DETAIL_COUNT);
    const oldPayments = alpha.slice(0, -DETAIL_COUNT);

    // Monthly aggregates of payments
    const byMonth = new Map<string, { date: string; amount: number; ajustes: number; count: number }>();
    for (const p of oldPayments) {
        const month = monthKey(p.date!);
        const existing = byMonth.get(month);
        const amt = -p.payment; // positive = received
        if (existing) {
            existing.amount += amt;
            existing.ajustes += p.ajuste;
            existing.count++;
        } else {
            byMonth.set(month, {
                date: lastDayOfMonth(month),
                amount: amt,
                ajustes: p.ajuste,
                count: 1,
            });
        }
    }
    const monthlyAggs = Array.from(byMonth.values());
    console.log(`Monthly aggregates: ${monthlyAggs.length}`);
    console.log(`Detail payments: ${detailPayments.length}`);

    // Generate SQL
    const sql: string[] = [];
    sql.push('-- ALPHA Payments Load');
    sql.push('');
    sql.push(`WITH ctx AS (
    SELECT
        (SELECT id FROM companies WHERE type = 'ORKA_MX') AS company_id,
        (SELECT id FROM partners WHERE name = 'ALPHA' AND company_id = (SELECT id FROM companies WHERE type = 'ORKA_MX')) AS customer_id
)`);
    sql.push('INSERT INTO payments (company_id, customer_id, payment_date, amount, notes, legacy_external_id) VALUES');

    const allRows: string[] = [];
    for (const a of monthlyAggs) {
        if (a.amount > 0) {
            allRows.push(`((SELECT company_id FROM ctx), (SELECT customer_id FROM ctx), '${a.date}', ${a.amount.toFixed(2)}, 'Monthly aggregate ${a.date.substring(0, 7)} (${a.count} payments)', 'MONTHLY_PAY_${a.date.substring(0, 7)}')`);
        }
    }
    for (let i = 0; i < detailPayments.length; i++) {
        const p = detailPayments[i];
        const amt = -p.payment;
        if (amt > 0) {
            const notes = (p.notes || '').replace(/'/g, "''").substring(0, 200);
            allRows.push(`((SELECT company_id FROM ctx), (SELECT customer_id FROM ctx), '${p.date}', ${amt.toFixed(2)}, '${notes}', 'DETAIL_PAY_${p.date}_${i}')`);
        }
    }
    sql.push(allRows.join(',\n'));
    sql.push('ON CONFLICT DO NOTHING;');

    fs.writeFileSync(path.join(OUT_DIR, '03-alpha-payments.sql'), sql.join('\n'));
    console.log(`Wrote 03-alpha-payments.sql (${allRows.length} rows total)`);

    // Verification math
    const aggsTotal = monthlyAggs.reduce((acc, a) => acc + a.amount, 0);
    const detailTotal = detailPayments.reduce((acc, p) => acc + (-p.payment), 0);
    console.log(`\nAggregates: $${aggsTotal.toFixed(2)}`);
    console.log(`Detail: $${detailTotal.toFixed(2)}`);
    console.log(`Combined: $${(aggsTotal + detailTotal).toFixed(2)}`);
    console.log(`Expected received: $${totalReceived.toFixed(2)}`);
}

main();
