---
description: Import Snow report CSVs atomically
---

# Import Snow report CSVs atomically

Run:

```bash
npm run licences -- import snow-license-manager --deployments=imports/applications-per-computer.csv --licenses=imports/licenses.csv --dry-run --by="Operator"
```

Replace example names and dates with the operator's actual records. Read before writing. Read docs/replace-snow-license-manager.md. Show counts from the dry run, then repeat without --dry-run when the operator asks to apply. Never discard unknown columns or assume missing rows mean removals. Reconcile report counts after import.

Use `--json` for machine-readable results. Names match without case sensitivity and IDs can be shortened. An ambiguous match exits with candidates. Ask the operator to choose.
