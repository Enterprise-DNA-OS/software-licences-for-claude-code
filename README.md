# Software Licences for Claude Code

Your software purchases, assignments, renewal dates and evidence in a database you own. See where the records show a shortfall, what needs proof and which removals need checking.

## Three ways to own it

- **Do it yourself:** free MIT code. Run it with Claude Code, Codex, OpenCode or Cursor. Hosting, agent subscriptions and your time are separate costs.
- **We customise it:** Enterprise DNA brings your Snow License Manager exports across, maps your terms, adds fields and connects discovery feeds or screens. We can build on a different stack if needed. One setup fee, then a retainer for ongoing work.
- **We run it for you:** installed, connected and operated through Omni by Enterprise DNA. One setup fee, then a monthly retainer.

[Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=snow-license-manager).

## Start with a fictional licence desk

Node 20 or newer. No database account required.

```bash
npm install
npm run demo
npm run licences -- position
npm run licences -- attention
npm run view
npm run docs
npm test
```

The demo has four fictional products. HarbourCAD Professional has three recorded installations and only one evidenced right. A second purchase has no proof. A retired device remains assigned. Kauri Documents has enough recorded rights but stale inventory. Southern Database uses complex terms that are explicitly unassessed. Every number comes from these demo records, not a customer or real publisher contract.

## What this replaces

The weekly reconciliation desk: product/version records, device and named-user assignments, purchased quantities, source agreements, evidence reviews, renewal decisions and draft working papers. It is a scoped alternative to the record-based licence desk in Snow License Manager. It does not claim full Snow feature parity. Snow's documented reports already cover many licence questions; this database lets you join those records to your own departments, evidence and decisions without a fixed report catalogue.

Snow prices are quoted privately. Its [legacy product metrics](https://www.flexera.com/sites/default/files/license-metrics.pdf) describe device-based licensing for the base technology package; the actual contract governs your bill. We do not publish a guessed price or promise savings.

## Ten questions to ask of your records

Run `npm run licences -- insights --json` for all ten answers. Each question has a working query today. These are useful checks, not a claim that Snow cannot report them.

1. Which products have more assignments than evidenced rights?
2. Which purchases have missing or unchecked proof?
3. Which rights expire in the renewal window?
4. Which retired users or devices still consume a recorded assignment?
5. Which assignments have no recorded use date?
6. Which products cannot yet be assessed?
7. Where is demand concentrated by department?
8. Which apparently covered products have stale evidence?
9. Which renewals also have a current shortfall?
10. Who last recorded a decision and what was the evidence?

## The week's rituals

Start with /attention, reconcile /position, gather /evidence, review /renewals and check /reclaim. /weekly-review writes a draft from three live queries. /draft-renewal prepares the evidence request. /compliance cites the rule behind each finding. /log records the decision with its operator.

30 slash commands ship with the desk, of which 28 call the CLI. The two authoring recipes add fields and reports.

| Command | Job |
|---|---|
| /help | List commands |
| /applications | Products and reviewed licence rules |
| /consumers | Devices and named users |
| /position | Reconcile evidenced rights against recorded demand |
| /attention | Prioritised exceptions |
| /compliance | Evidence checks with source rules |
| /renewals | Expired rights and upcoming renewals |
| /reclaim | Unused and retired assignments for review |
| /inventory | Recorded installations and assignments |
| /entitlements | Purchased rights and dates |
| /evidence | Purchase proof and review gaps |
| /departments | Demand by department |
| /history | Recorded actions |
| /application | One product, its position and source terms |
| /add-application | Register a product for review |
| /add-consumer | Register a device or user |
| /set-rule | Record reviewed device or user terms |
| /add-entitlement | Record a purchase |
| /verify-entitlement | Record checked purchase evidence |
| /assign | Record an installation or named-user assignment |
| /release | Record a confirmed removal or unassignment |
| /set-consumer | Record retired or active status without releasing licences |
| /log | Record a note |
| /import | Import Snow report CSVs atomically |
| /export | Export every business record |
| /weekly-review | Draft the weekly licence review |
| /draft-renewal | Draft a renewal evidence request |
| /insights | Answer ten licence desk questions |
| /customise | Add a field or change a rule through a tested migration |
| /new-view | Add a branded read-only report |

Every CLI command accepts `--json`. Writes require `--by="Operator"`. Names are case-insensitive, partial IDs work, and an ambiguous match lists candidates and exits 1. Run `npm run licences -- help` or open its command recipe for an example.

## Move from Snow

Export current Applications per computer and licence reports as CSV. Run one import command for both, first as a trial. Exact repeated files do not duplicate rows. Changed inventory updates matching assignments. Changed existing licence purchases stop for evidence reconciliation.

```bash
npm run licences -- import snow-license-manager --deployments=imports/applications-per-computer.csv --licenses=imports/licenses.csv --dry-run --by="Licence owner"
```

Remove `--dry-run` to apply. The [switch guide](docs/replace-snow-license-manager.md) gives required headers, ISO dates, retained columns, review steps and limitations. The importer preserves original rows. New products and purchases start unassessed; importing a number is not certifying a grant. Use `npm run migrate` without the demo seed for your real database.

## Licence rules and evidence

Device and explicit named-user metrics are supported after review. Different product versions are not pooled. Evidence-free, expired or not-yet-started purchases provide no coverage. Unsupported metrics stay UNASSESSED. Products without inventory evidence show NO INVENTORY. Stale observations flag an otherwise covered position as PROVISIONAL. A retired consumer counts until removal is confirmed; unknown usage is not inactivity. See [the checks and cited sources](docs/compliance.md).

No automatic discovery, uninstall, vendor audit submission or legal compliance certification. Complex core, processor, virtualisation, bundle, concurrent and downgrade rights need a specialist and a custom rule. Do not store licence keys or passwords.

## Paperwork and read-only views

`npm run docs` produces licence position working papers, renewal briefs and removal evidence papers. `npm run view` produces the weekly exceptions, licence positions and reclaim review. All use `brand.json` for business name, logo and colours. Generated HTML is private, ignored by Git and contains no action buttons. Open it locally or print to PDF. These are drafts, never vendor attestations.

Read [why there is no front end](docs/why-no-front-end.md). A phone app, screen, discovery integration or different stack is custom work Enterprise DNA can build into your version.

## Your first hour: ten things to ask for

1. Show the recorded shortfalls and the proof behind them.
2. Show renewals due in the next two months.
3. Find devices retired but still assigned software.
4. Explain why a position is provisional.
5. List purchases with missing invoices or agreements.
6. Draft the renewal evidence request for one product.
7. Prepare the weekly licence review and its next decisions.
8. Compare assignments by department.
9. Add a contract-owner field using /customise.
10. Add a report of unassessed products using /new-view.

## Storage and portability

The default PGlite database lives in `.data/db`. Set `DATABASE_URL` for PostgreSQL through the same adapter; private connection files stay outside Git. Each domain table has UUIDs, timestamps and an update trigger. Public roles have no table or view grants, and row level security is enabled. The CLI runs as the database owner. This is not a hosted multi-tenant access layer. Set access, retention and backups for your deployment. PGlite supports one operator process at a time.

`npm run licences -- export --out=exports/licences` writes all eight registers as CSV and a lossless JSON archive. Every import row and action is included. Use the JSON archive for lossless interchange and treat CSV cells as text when opening untrusted data in spreadsheets. Back up the database separately.

## Verification

`npm test` uses a temporary database, blocks operational connection settings and exercises every CLI command. It checks missing proof, stale observations, unsupported metrics, release evidence, repeat imports, full rollback, dates, ambiguous matches, history, exports, drafts and HTML output. Set `TEST_DATABASE_URL` only to an empty disposable PostgreSQL database for the same suite. The manual CI workflow covers Node 20 and 22 on Windows and Linux plus PostgreSQL 17.

## Licence

MIT. Built by Enterprise DNA. Snow License Manager is a Flexera product. This independent project is not affiliated with or endorsed by Flexera.
