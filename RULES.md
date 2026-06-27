# Deadline Rules — Legal Basis (v1: California only)

> ⚠️ **You must verify every rule below against the current statute before
> launch.** These are a best-effort starting point encoded as a plain config
> table in `src/lib/rules/states/ca.ts`. Each legal constant is marked in code
> with `// TODO: verify against current CA statute`. Laws change; do not rely on
> this file as legal advice.

The engine is pure config (no AI). It reads a lease's date fields and produces
deadlines. Reminders then count back from each deadline's `due_date` using the
landlord's lead times (default 60/30/7/1 days).

## California rules

| Deadline | When it's created | Due date | Statute (verify) |
|---|---|---|---|
| **Security deposit return** | A `move_out_date` is set | `move_out_date + 21 days` | CA Civ. Code §1950.5 |
| **Lease renewal** | A `lease_end` is set | `lease_end` | — (operational, not statutory) |
| **Rent-increase notice** | `rent_increase_notice_days` is set *and* `lease_end` is set | `lease_end − rent_increase_notice_days` | CA Civ. Code §827 |
| **Inspection** | An `inspection_date` is set | `inspection_date` | — (landlord-scheduled) |
| **Insurance renewal** | An `insurance_renewal_date` is set | `insurance_renewal_date` | — (policy-driven) |
| **License / registration renewal** | A `license_renewal_date` is set | `license_renewal_date` | — (local jurisdiction) |

### Rent-increase notice detail

California requires advance **written** notice of a rent increase
(CA Civ. Code §827):

- **30 days** for an increase of **≤ 10%** within a 12-month period.
- **90 days** for an increase **> 10%**.

These thresholds live in `CA_RENT_INCREASE` in `ca.ts` and are configurable. The
helper `requiredRentIncreaseNoticeDays(percent)` returns the correct window for a
planned increase percentage — use it in the UI to guide the landlord when they
set `rent_increase_notice_days`.

> Note: statewide rent-cap / just-cause rules (e.g. the Tenant Protection Act,
> AB 1482) and local rent-control ordinances may impose stricter limits. Out of
> scope for v1 — verify per property.

## Adding another state later

1. Create `src/lib/rules/states/<xx>.ts` exporting a `StateRuleSet`.
2. Register it in `STATE_RULES` in `src/lib/rules/index.ts`.
3. Add its citations to this file.

No engine logic changes — that's the design goal.
