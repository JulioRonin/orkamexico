-- WhatsApp bot: event log for incoming messages (nominations, BOL documents)
-- Every webhook delivery is logged here before/after AI processing.

create table if not exists public.whatsapp_events (
    id uuid primary key default gen_random_uuid(),
    wa_message_id text unique,              -- Meta message ID (dedupe across webhook retries)
    from_number text,                       -- sender phone (E.164, no +)
    sender_name text,                       -- WhatsApp profile name
    message_type text,                      -- text | image | document | other
    body text,                              -- raw text content (if any)
    media_id text,                          -- Meta media ID (if image/document)
    classification text,                    -- nomination | bol_document | other | error
    extraction jsonb,                       -- structured data extracted by Claude
    sale_ids uuid[],                        -- sales created or updated from this message
    status text not null default 'received',-- received | processed | needs_review | ignored | error
    error text,
    created_at timestamptz default now()
);

create index if not exists idx_whatsapp_events_status on public.whatsapp_events (status);
create index if not exists idx_whatsapp_events_created on public.whatsapp_events (created_at desc);

alter table public.whatsapp_events enable row level security;

-- Authenticated app users can read the event log (for a future monitor screen)
create policy "whatsapp_events_read" on public.whatsapp_events
    for select to authenticated using (true);

-- Storage bucket for BOL documents attached to sales
insert into storage.buckets (id, name, public)
values ('bols', 'bols', false)
on conflict (id) do nothing;
