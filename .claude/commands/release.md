---
description: Record a confirmed removal or unassignment
---

# Record a confirmed removal or unassignment

Run:

```bash
npm run licences -- release "Assignment ID" --evidence="Confirmed removal reference" --by="Operator"
```

Replace example names and dates with the operator's actual records. Read before writing. Read the assignment and its history first. Require the operator to supply actual removal or unassignment evidence. A stale scan, retirement or lack of use is not proof. This records a confirmed action. It never uninstalls software.

Use `--json` for machine-readable results. Names match without case sensitivity and IDs can be shortened. An ambiguous match exits with candidates. Ask the operator to choose.
