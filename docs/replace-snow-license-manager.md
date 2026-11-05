# Move licence records from Snow License Manager

## Export once, keep the original files

In Snow, open Reports, choose a report, show the current report, then use Export and CSV. The vendor documents this in [Manage reports](https://docs.flexera.com/snow-license-manager-ui/reports/manage-reports) and the [Snow License Manager 9.9 user guide, report exports](https://docs.snowsoftware.com/documentation-resources/snow-license-manager/SLM99_UserGuide_UserInterface.pdf), checked 2026-11-05. Export related documents separately using Show related documents and keep them in your controlled evidence store.

Export Applications per computer with `Computer name`, `Application`, `Application manufacturer`, `Last scanned`, `Last used` and `Organisation`. Snow reports are configurable. Localised headers and custom columns need mapping before import. The sample fixture is synthetic and demonstrates the accepted English headers, not a customer export. [Licenseware's documented Snow report preparation](https://help.licenseware.io/how-to-get-and-use-snow-data-for-microsoft-deployment-manager) corroborates these report columns.

The optional licence file needs `License ID`, `Application name`, `Manufacturer`, `Quantity`, `Purchase date`, and optionally `Subscription expiration date`. Select or map those columns in your licence report. Where Snow exposes `Id`, `ApplicationName`, `ManufacturerName` and `PurchaseDate`, those aliases also work. A missing stable licence ID stops the import. These are an explicit import contract, not a claim that every default Snow licence report has identical columns. Dates must be ISO YYYY-MM-DD; convert local date formats first.

## One import command

Start with an empty database: `npm run migrate`. The demo seed is for evaluation, not production. Store exports under the ignored `imports/` directory.

```bash
npm run licences -- import snow-license-manager --deployments=imports/applications-per-computer.csv --licenses=imports/licenses.csv --dry-run --by="Licence owner"
npm run licences -- import snow-license-manager --deployments=imports/applications-per-computer.csv --licenses=imports/licenses.csv --by="Licence owner"
```

Both files are one transaction. A malformed row, missing identifier or impossible date rolls everything back. The trial performs the same validations and rolls back all changes. Exact repeat files are skipped by content fingerprint. A changed deployment report updates matching product/device pairs without duplicates. A changed licence report with an existing licence ID stops for reconciliation instead of silently replacing checked purchasing evidence. Original rows, including unmapped custom fields, are retained with the import batch and row number.

## What comes across

| Source | Destination |
|---|---|
| Application plus manufacturer | Separate product/version name; rules start unassessed |
| Computer name | Device consumer, matched without case sensitivity |
| Organisation | Department for newly imported devices |
| Last scanned, Last used | Inventory observation and recorded usage date |
| License ID, quantity, dates | Purchase record with `snow:` reference and proof awaiting review |
| Other columns | Original import row retained for later mapping |

Existing department ownership is not overwritten by later imports. Missing rows never mean removal. Older observations cannot overwrite newer or released assignments. A newer observation can show a previously removed product has returned. Unknown usage stays unknown.

## Review the rights before relying on a position

`Default metric` and a purchase count are not proof of use rights. Read the contract, then set the product rule and verify each purchase:

```bash
npm run licences -- set-rule "Imported Drawing Tool" --metric=device --source="Signed agreement section 4, device grant" --by="Licence owner"
npm run licences -- verify-entitlement snow:DEMO-LIC-01 --metric=device --evidence="Checked invoice and agreement, evidence store reference" --by="Licence owner"
npm run licences -- position
npm run licences -- evidence
```

Use your real reference and product, not the demo ones. Named-user assignments are recorded separately with `assign`; a device's most frequent user is not converted into an assignment. Confirm dates and whether a missing end date truly means perpetual rights before verifying a purchase.

Match imported product, device, deployment and purchase counts against the exports. Review all rejected rows and duplicate names. Render the working papers and have the licence owner compare a sample with the original contracts before switching daily work.

## Work that needs a custom version

Discovery agents, software recognition libraries, publisher use-right libraries, automatic uninstall, vendor portals and historical metering are separate systems. This free desk starts with exported records. Complex processor, core, bundle, downgrade, virtualisation and concurrent licensing remains unassessed. Enterprise DNA can connect discovery feeds and build agreed rules into your version after checking the contracts. There is no claim of full Snow feature parity.

## Take your data out

`npm run licences -- export --out=exports/licences` writes all eight business registers as CSV and one lossless JSON archive, including original imports and events. Treat CSV values as text when opening untrusted imports in spreadsheets. Keep exports and generated documents private. Back up the database as well as these files.
