-- WhatsApp bot: redesigned workflow with approval queue, payment receipts, and daily closures

-- ── Nominación queue: pending approval before creating sales ──────────────────
create table if not exists public.nomination_queue (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id),
    customer_id uuid not null references public.partners(id),
    product_id uuid not null references public.products(id),
    from_number text not null,              -- sender phone (E.164, no +)
    sender_name text,                       -- WhatsApp profile name
    quantity integer not null,              -- number of pipas/units
    terminal text,                          -- terminal for loading
    requested_date date,                    -- date in the nomination header (DD/MM/YYYY in group)
    event_id uuid references public.whatsapp_events(id), -- source message (several rows can share one message)
    status text not null default 'PENDING_APPROVAL', -- PENDING_APPROVAL | APPROVED | CANCELLED
    created_at timestamptz default now(),
    approved_at timestamptz,
    approved_by text                        -- username/contact who approved
);

create index if not exists idx_nomination_queue_status on public.nomination_queue (status);
create index if not exists idx_nomination_queue_customer on public.nomination_queue (customer_id);
alter table public.nomination_queue enable row level security;
create policy "nomination_queue_read" on public.nomination_queue
    for select to authenticated using (true);

-- ── Payment receipts: evidence of payment sent via WhatsApp ────────────────────
create table if not exists public.payment_receipts (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id),
    partner_id uuid references public.partners(id), -- nullable: cobranza lo asigna al registrar
    from_number text not null,              -- WhatsApp number that sent it
    sender_name text,
    amount_claimed numeric(12, 2),          -- amount mentioned in message (if any)
    currency text default 'MXN',
    receipt_type text,                      -- transfer | deposit | check | invoice_payment | etc
    storage_url text,                       -- path to image/PDF in storage bucket
    file_name text,
    file_size integer,
    event_id uuid references public.whatsapp_events(id), -- source message
    status text not null default 'RECEIVED', -- RECEIVED | REGISTERED | MATCHED_TO_INVOICE
    notes text,
    created_at timestamptz default now(),
    registered_at timestamptz,
    registered_by text                      -- user who confirmed amount in ERP
);

create index if not exists idx_payment_receipts_status on public.payment_receipts (status);
create index if not exists idx_payment_receipts_partner on public.payment_receipts (partner_id);
alter table public.payment_receipts enable row level security;
create policy "payment_receipts_read" on public.payment_receipts
    for select to authenticated using (true);

-- ── Daily closure snapshots: frozen balances at 7am each day ──────────────────
create table if not exists public.daily_closure_snapshots (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id),
    closure_date date not null,             -- date being frozen (previous day's balance)
    total_credits_outstanding numeric(14, 2), -- sum of all positive balances
    total_overpayments numeric(14, 2),     -- sum of all negative balances
    partner_balances jsonb,                 -- {partner_id: {name, balance, currency}}
    created_at timestamptz default now()
);

create unique index if not exists idx_daily_closure_company_date on public.daily_closure_snapshots (company_id, closure_date);
alter table public.daily_closure_snapshots enable row level security;
create policy "daily_closure_snapshots_read" on public.daily_closure_snapshots
    for select to authenticated using (true);

-- ── Modify whatsapp_events to track nominations ────────────────────────────────
alter table public.whatsapp_events
    add column if not exists nomination_ids uuid[],  -- nominations referenced by this event
    add column if not exists payment_receipt_ids uuid[]; -- payment receipts created from this event

-- ── Modify sales table to link back to nomination ─────────────────────────────
alter table public.sales
    add column if not exists nomination_id uuid references public.nomination_queue(id),
    add column if not exists approved_at timestamptz;
