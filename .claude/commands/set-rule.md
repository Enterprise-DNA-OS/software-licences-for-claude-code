---
description: Record reviewed device or user terms
---

# Record reviewed device or user terms

Run:

```bash
npm run licences -- set-rule "Product" --metric=device --source="Signed agreement section and reference" --by="Reviewer"
```

Replace example names and dates with the operator's actual records. Read before writing. Read the signed product-specific terms. Only record device or user metrics after the operator confirms the interpretation and evidence. Leave core, processor, virtualisation, bundles, concurrent and indirect use as review. Never assume a rule from the product name.

Use `--json` for machine-readable results. Names match without case sensitivity and IDs can be shortened. An ambiguous match exits with candidates. Ask the operator to choose.
