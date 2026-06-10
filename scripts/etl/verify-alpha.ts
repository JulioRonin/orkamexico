/**
 * Quick verification script: print ALPHA balance details.
 */
import { sb } from './lib/supabase.js';

async function main() {
    const { data, error } = await sb
        .from('v_client_balances')
        .select('*')
        .eq('client_name', 'ALPHA')
        .single();

    if (error) throw error;

    console.log('\n=== ALPHA Balance ===');
    console.log(`Total billed:    $${data.total_billed}`);
    console.log(`Total paid:      $${data.total_paid}`);
    console.log(`Balance due:     $${data.balance_due}`);
    console.log(`Credit limit:    $${data.credit_limit}`);
    console.log(`Credit avail:    $${data.credit_available}`);
    console.log(`Last sale date:  ${data.last_sale_date}`);

    const expected = 762710.25;
    const diff = Math.abs(Number(data.balance_due) - expected);
    console.log(`\nExpected (CSV):  $${expected}`);
    console.log(`Match status:    ${diff < 1 ? '✓ MATCH' : `✗ DIFF $${diff.toFixed(2)}`}`);
}

main().catch(e => { console.error(e); process.exit(1); });
