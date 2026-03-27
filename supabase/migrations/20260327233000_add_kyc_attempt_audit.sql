create table if not exists public.kyc_attempt_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('rg', 'cnh', 'passport')),
  approved boolean not null,
  failure_reasons jsonb not null default '[]'::jsonb,
  risk_indicators jsonb not null default '[]'::jsonb,
  document_confidence numeric(5,4),
  facial_confidence numeric(5,4),
  deepfake_confidence numeric(5,4),
  age_confidence numeric(5,4),
  deepfake_probability numeric(5,4),
  face_match_score numeric(5,4),
  liveness_score numeric(5,4),
  consistency_score numeric(5,4),
  estimated_age int,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_kyc_attempt_audit_user_id on public.kyc_attempt_audit(user_id);
create index if not exists idx_kyc_attempt_audit_created_at on public.kyc_attempt_audit(created_at desc);

alter table public.kyc_attempt_audit enable row level security;

drop policy if exists "Users can view own kyc audit" on public.kyc_attempt_audit;

create policy "Users can view own kyc audit"
on public.kyc_attempt_audit
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own kyc audit" on public.kyc_attempt_audit;

create policy "Users can insert own kyc audit"
on public.kyc_attempt_audit
for insert
to authenticated
with check (auth.uid() = user_id);
