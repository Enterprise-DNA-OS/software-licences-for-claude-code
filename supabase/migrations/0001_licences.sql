create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table applications (
 id uuid primary key default gen_random_uuid(), name text not null unique check(length(trim(name))>0), publisher text not null,
 metric text not null default 'review' check(metric in ('device','user','review')),
 terms_source text, reviewed_by text, reviewed_on date, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(metric='review' or (nullif(trim(terms_source),'') is not null and nullif(trim(reviewed_by),'') is not null and reviewed_on is not null))
);
create unique index applications_name_ci on applications(lower(name));
create table consumers (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0),
 kind text not null check(kind in ('device','user')), department text not null default 'Unassigned',
 state text not null default 'active' check(state in ('active','retired')), last_seen date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(kind,name)
);
create unique index consumers_name_ci on consumers(kind,lower(name));
create table entitlements (
 id uuid primary key default gen_random_uuid(), reference text not null unique, application_id uuid not null references applications(id),
 metric text not null check(metric in ('device','user','review')), quantity integer not null check(quantity>0),
 starts_on date not null, ends_on date, evidence_ref text, verified_by text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_on is null or ends_on>=starts_on)
);
create table deployments (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references applications(id), consumer_id uuid not null references consumers(id),
 state text not null default 'active' check(state in ('active','released')), observed_on date not null, last_used date,
 release_evidence text, released_by text, released_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(application_id,consumer_id),
 check(last_used is null or last_used<=observed_on),
 check(state!='released' or (nullif(trim(release_evidence),'') is not null and nullif(trim(released_by),'') is not null and released_on is not null))
);
create table events (
 id uuid primary key default gen_random_uuid(), application_id uuid references applications(id), actor text not null,
 action text not null, detail jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table import_batches (
 id uuid primary key default gen_random_uuid(), digest text not null unique, source text not null, actor text not null,
 row_count integer not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table import_rows (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references import_batches(id), row_number integer not null, raw jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(batch_id,row_number)
);
create table policy (
 id uuid primary key default gen_random_uuid(), key text not null unique, days integer not null check(days>0), note text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into policy(key,days,note) values ('stale_days',30,'Internal inventory freshness policy, not a law'),('unused_days',90,'Review candidate only, never an automatic release'),('renewal_days',60,'Internal renewal review horizon');
create view v_position as
with purchased as (
 select application_id,
 sum(quantity) filter(where starts_on<=current_date and (ends_on is null or ends_on>=current_date) and e.metric=a.metric) as purchased,
 sum(quantity) filter(where starts_on<=current_date and (ends_on is null or ends_on>=current_date) and nullif(trim(evidence_ref),'') is not null and nullif(trim(verified_by),'') is not null and e.metric=a.metric) as evidenced
 from entitlements e join applications a on a.id=e.application_id group by application_id
), demand as (
 select d.application_id,count(*)::int as required,
 count(*) filter(where c.kind!=a.metric)::int as mismatches,
 count(*) filter(where c.last_seen is null or c.last_seen<current_date-(select days from policy where key='stale_days') or d.observed_on<current_date-(select days from policy where key='stale_days'))::int as stale
 from deployments d join consumers c on c.id=d.consumer_id join applications a on a.id=d.application_id where d.state='active' group by d.application_id
)
select a.id,a.name,a.publisher,a.metric,coalesce(p.purchased,0)::int as purchased,coalesce(p.evidenced,0)::int as evidenced,
coalesce(d.required,0)::int as required,coalesce(d.stale,0)::int as stale,
case when a.metric='review' or coalesce(d.mismatches,0)>0 or not exists(select 1 from deployments x where x.application_id=a.id) then null else (coalesce(p.evidenced,0)-coalesce(d.required,0))::int end as balance,
case when a.metric='review' or coalesce(d.mismatches,0)>0 then 'UNASSESSED'
 when not exists(select 1 from deployments x where x.application_id=a.id) then 'NO INVENTORY'
 when coalesce(p.evidenced,0)<coalesce(d.required,0) then 'SHORTFALL'
 when coalesce(d.stale,0)>0 then 'PROVISIONAL' else 'RECORDED COVERAGE' end as assessment
from applications a left join purchased p on p.application_id=a.id left join demand d on d.application_id=a.id;
create view v_renewals as select e.id,a.name,e.reference,e.metric,e.quantity,e.ends_on,(e.ends_on-current_date)::int as days_left,
case when nullif(trim(e.evidence_ref),'') is null or nullif(trim(e.verified_by),'') is null then 'PROOF MISSING' else 'PROOF RECORDED' end as proof
from entitlements e join applications a on a.id=e.application_id where e.ends_on is not null and e.ends_on<=current_date+(select days from policy where key='renewal_days');
create view v_reclaim as select d.id,a.name,c.name as consumer,c.kind,c.department,c.state as consumer_state,d.last_used,
case when c.state='retired' then 'Retired consumer still assigned' when d.last_used is null then 'Usage unknown, investigate' else 'No recent recorded use' end as reason
from deployments d join applications a on a.id=d.application_id join consumers c on c.id=d.consumer_id
where d.state='active' and (c.state='retired' or d.last_used is null or d.last_used<current_date-(select days from policy where key='unused_days'));
create view v_evidence as select e.id,a.name,e.reference,e.quantity,e.metric,e.evidence_ref,e.verified_by,
case when nullif(trim(e.evidence_ref),'') is null then 'Missing purchase proof' when nullif(trim(e.verified_by),'') is null then 'Proof awaiting review'
when e.metric!=a.metric or a.metric='review' then 'Metric needs review' else 'Evidence recorded' end as finding
from entitlements e join applications a on a.id=e.application_id;
create view v_attention as
select 'high' as priority,name,assessment as issue,('Required '||required||', evidenced '||evidenced)::text as detail from v_position where assessment in ('SHORTFALL','UNASSESSED','NO INVENTORY')
union all select 'medium',name,'STALE INVENTORY',stale||' assignments need refreshed evidence' from v_position where stale>0
union all select 'medium',name,'RENEWAL',reference||': '||days_left||' days remaining' from v_renewals
union all select 'medium',name,'RECLAIM REVIEW',consumer||': '||reason from v_reclaim
union all select 'high',name,'PURCHASE EVIDENCE',reference||': '||finding from v_evidence where finding!='Evidence recorded';
create view v_departments as select a.name,c.department,c.kind,count(*)::int as assigned,
count(*) filter(where c.state='retired')::int as retired_assigned from deployments d join applications a on a.id=d.application_id join consumers c on c.id=d.consumer_id where d.state='active' group by a.name,c.department,c.kind;
-- Tables are for the database owner through the CLI. No public API access.
do $$ declare t text; begin foreach t in array array['applications','consumers','entitlements','deployments','events','import_batches','import_rows','policy'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t); execute format('revoke all on %I from public',t);
end loop; end $$;
revoke all on v_position,v_renewals,v_reclaim,v_evidence,v_attention,v_departments from public;
