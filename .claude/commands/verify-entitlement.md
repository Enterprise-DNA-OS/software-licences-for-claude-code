---
description: Record checked purchase evidence
---

# Record checked purchase evidence

Run:

```bash
npm run licences -- verify-entitlement "Purchase reference" --metric=device --evidence="Checked grant and invoice" --by="Reviewer"
```

Replace example names and dates with the operator's actual records. Read before writing. Read the purchase and source agreement. Confirm the quantity, metric and dates, including whether a blank end date truly means perpetual rights. Record only evidence the operator has checked. Verification is not a legal certification.

Use `--json` for machine-readable results. Names match without case sensitivity and IDs can be shortened. An ambiguous match exits with candidates. Ask the operator to choose.
