# Software Licences for Claude Code: operating instructions

This file is the brain. Claude Code reads it at the start of every session. It says who this is for, how work gets done, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR BUSINESS]
- **Operator:** [YOUR NAME], [your role]
- **What matters most:** [the one or two outcomes you care about]

Fill this in once. A worker with context knows. A worker without it guesses.

## How to work

1. **Take a brief, not a script.** The operator describes the outcome. You run the right command and present the answer.
2. **Read before you write.** Before drafting anything about a record, read its full history first.
3. **Plain language.** Short sentences. No filler. Numbers in tables.
4. **Silent success, loud problems.** No play-by-play. Say what broke and what you did about it.
5. **Stop at the line.** Anything that sends, deletes, or faces a customer waits for a yes in this session.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
|---|---|
| List commands | `/help` |
| Products and reviewed licence rules | `/applications` |
| Devices and named users | `/consumers` |
| Reconcile evidenced rights against recorded demand | `/position` |
| Prioritised exceptions | `/attention` |
| Evidence checks with source rules | `/compliance` |
| Expired rights and upcoming renewals | `/renewals` |
| Unused and retired assignments for review | `/reclaim` |
| Recorded installations and assignments | `/inventory` |
| Purchased rights and dates | `/entitlements` |
| Purchase proof and review gaps | `/evidence` |
| Demand by department | `/departments` |
| Recorded actions | `/history` |
| One product, its position and source terms | `/application` |
| Register a product for review | `/add-application` |
| Register a device or user | `/add-consumer` |
| Record reviewed device or user terms | `/set-rule` |
| Record a purchase | `/add-entitlement` |
| Record checked purchase evidence | `/verify-entitlement` |
| Record an installation or named-user assignment | `/assign` |
| Record a confirmed removal or unassignment | `/release` |
| Record retired or active status without releasing licences | `/set-consumer` |
| Record a note | `/log` |
| Import Snow report CSVs atomically | `/import` |
| Export every business record | `/export` |
| Draft the weekly licence review | `/weekly-review` |
| Draft a renewal evidence request | `/draft-renewal` |
| Answer ten licence desk questions | `/insights` |
| Change a field or rule | `/customise` |
| Add a read-only report | `/new-view` |

If an ask fits nothing here, run the CLI directly (`npm run licences -- help`) and then propose a new command for it.

## Hard rules

- Never send email or messages from here. Draft to `drafts/`, a person sends.
- Never delete records without an explicit yes in this session. Prefer marking closed or archived.
- Never invent a record. If a name is ambiguous, list the candidates and ask.
- The database is the source of truth. If the answer is not in it, say so.

## Where things live

- `scripts/` the CLI. `scripts/lib/db.mjs` picks `DATABASE_URL` (Postgres, Supabase) or the embedded database in `.data/`.
- `supabase/migrations/` the schema, plain SQL. `npm run migrate` applies it.
- `.claude/commands/` the slash commands. Add one every time the same ask comes twice.
- `docs/` the thesis and the guide for moving off Snow License Manager.

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/instead-of/snow-license-manager

## Licence desk rules

Read docs/compliance.md before interpreting a position. Recorded coverage is not a compliance certificate. No discovery, automatic removal or inferred publisher rights. Imported metrics remain under review until a person checks the agreement. Missing proof never counts as evidenced coverage. Never store licence keys or passwords. Every record change names the operator with --by. Use an empty database with npm run migrate for real records; the seed is fictional.
