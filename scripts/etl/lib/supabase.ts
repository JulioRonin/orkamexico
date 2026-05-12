import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set them in .env.local)');
}

export const sb: SupabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
});

export async function batchInsert<T>(
    table: string,
    rows: T[],
    batchSize = 500,
    onConflict?: string
): Promise<{ inserted: number; errors: any[] }> {
    let inserted = 0;
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const q = sb.from(table).insert(batch);
        const { error } = onConflict
            ? await sb.from(table).upsert(batch, { onConflict, ignoreDuplicates: false })
            : await q;

        if (error) {
            errors.push({ batch: i / batchSize, error: error.message, sample: batch[0] });
            console.error(`  Batch ${i / batchSize} failed: ${error.message}`);
        } else {
            inserted += batch.length;
        }

        if ((i / batchSize) % 10 === 0 && i > 0) {
            console.log(`  Progress: ${inserted}/${rows.length} (${((inserted / rows.length) * 100).toFixed(1)}%)`);
        }
    }

    return { inserted, errors };
}
