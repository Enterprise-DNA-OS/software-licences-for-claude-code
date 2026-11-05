# Licence evidence checks

This desk checks recorded evidence. It does not certify compliance, interpret every publisher agreement, discover installations or authorise removal. The demo publishers and licence terms are fictional. Review the actual contract before recording a rule.

## Supported metrics

One assigned device consumes one device right. One explicitly assigned named user consumes one user right. Exact product and version names are separate products. No pooling across products, upgrade or downgrade rights, secondary use, bundles, processors, cores, concurrent users, virtualisation, enterprise agreements or indirect access is inferred. Set these products to `review`; the position remains UNASSESSED. A device inventory row cannot prove a named-user assignment, even when it identifies a frequent user.

## Checks and sources

| Code | Record check | Source and limit |
|---|---|---|
| LIC-01 | Active assignments exceed current rights with checked evidence and a matching metric | [Microsoft Product Terms, Customer's Use Rights](https://www.microsoft.com/licensing/terms/product/ForallSoftware/all), checked 2026-11-05. Microsoft requires rights for each product and separately licensed functionality. This supports the evidence check, not a universal licensing formula. The actual publisher agreement decides the metric. |
| LIC-02 | Expired purchases, missing proof, unreviewed purchases and mismatched metrics do not provide evidenced coverage | [Snow application detail view](https://docs.flexera.com/snow-license-manager-ui/applications/application-detail-view), checked 2026-11-05. Snow describes incomplete, expired and adjusted rights. This desk implements a conservative exact-product subset and no use-right adjustments. |
| REVIEW-01 | Unsupported metrics and mismatched consumer types remain unassessed | The supported scope above. This is a product boundary, not a statutory rule. |
| DATA-01 | Unknown or old observations flag the position as provisional when there is otherwise enough recorded coverage | The internal policy below. Freshness does not prove completeness of the estate. |

## Internal policies

The database policy register sets a 30-day inventory freshness limit, 90-day unused review threshold and 60-day renewal horizon. These are demo office policies, not laws or publisher conditions. `/customise` changes them in a migration. Unknown use is an investigation item, never proof of disuse. A retired consumer still counts until a person records a confirmed release with evidence. Expired renewals remain visible for follow-up.

Every mutation records the operator and the supplied evidence. Application rules record their source, reviewer and review date. This is an operational history, not a tamper-proof audit log. Database owners can change it. Use database access controls, backups and your retention policy for a shared deployment. Do not store activation keys, passwords or full identity documents here.

The licence position working paper, renewal brief and removal evidence report are drafts for the licence owner. They are not vendor attestations. No document or message is sent by this code.
