# ORKA ETL Scripts

Scripts to migrate the historical data from CSV files into the Supabase ORKA ERP database.

## Current state in Supabase (post-MCP load)

| Entity | Count | Notes |
|---|---|---|
| Companies | 2 | ORKA_MX, ORKA_OLEO |
| Products | 8 | 4 per company (ULSD, ETHANOL, NAPHTHA, GASOLINE) |
| Terminals | 4 | BLUEWING, SUNOCO, MOTUS, TITAN (MX) |
| Partners | 452 | 141 clients + 311 carriers |
| Sales (ALPHA) | 145 | 45 monthly aggregates + 100 most-recent detail |
| Payments (ALPHA) | 42 | 21 monthly aggregates + 20 detail + 1 adjustments roll-up |
| **Balance ALPHA** | **$762,710.25** | MATCH CSV ✓ |

The ALPHA load was done in **summary form** because the sandbox environment
where Claude Code ran blocks outbound TCP/HTTPS to Supabase, forcing the use of
the MCP tool which is rate-limited per query. The data is **financially correct**
(every dollar tied), but operational detail (every single BOL) only covers the
last 100 sales — older operations live as monthly aggregates.

To **load the full 9,266 ALPHA sales and 1,441 payments with full detail**, run
the bulk script locally (see below) on a machine with internet access to Supabase.

## Files

| File | Purpose |
|---|---|
| `lib/supabase.ts` | Supabase client using service_role key (env `SUPABASE_SERVICE_ROLE_KEY`) |
| `lib/csv.ts` | CSV parsing + currency/date helpers |
| `01-build-partners-sql.ts` | Generates SQL chunks for partners (clients + carriers) |
| `01-load-partners.ts` | Direct loader (requires unblocked Supabase access) |
| `02-build-alpha-sales-sql.ts` | Generates ALPHA sales SQL (aggregates + detail) |
| `03-build-alpha-payments-sql.ts` | Generates ALPHA payments SQL |
| `99-bulk-load-full.ts` | **Full bulk loader** — runs the entire CSV ingest in one pass against Supabase |

## How to do the full bulk load (after the MCP-based partial load)

> ⚠️ This will load 9,266 ALPHA sales individually and 1,441 payments, then
> re-apply FIFO. It replaces the monthly aggregates with the detailed transactions.

```bash
# 1. Ensure .env.local has SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
cat .env.local

# 2. From the project root, run the full loader
npx tsx scripts/etl/99-bulk-load-full.ts

# 3. Verify the balance still matches CSV
npx tsx scripts/etl/verify-alpha.ts
```

Expected output:
```
ALPHA balance: $762,710.25 ✓
Sales: 9,266 (detail) + 0 aggregates
Payments: 1,441 (detail) + 1 adjustments
```

## Architecture notes

- All ETL operations are **idempotent** via `ON CONFLICT (company_id, ...) DO NOTHING/UPDATE`
- Partners use deterministic placeholder RFCs (`CLI_<NAME>`, `CAR_<NAME>`); replace with real RFCs via the Partners UI
- Status of historical sales = `DONE` (closed operations); only recent sales carry their real workflow state
- The `legacy_external_id` column on `sales` and `payments` carries the original CSV ID for traceability
