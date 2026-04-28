# Visual baselines

Current baseline strategy:

- Functional E2E remains deterministic and fast.
- Visual regression is opt-in through `pnpm test:visual`.
- Committed snapshots cover stable public/auth screens first.
- Dynamic dashboards are captured as run artifacts and checked for horizontal overflow, but not yet snapshotted because dates, SLA times and seed-relative values change.
- Dashboard grid gutters are tested directly: horizontal and vertical gaps must match the shared grid rhythm even when rows have different card counts.

Promotion rule:

- A page can move from artifact-only visual audit to strict screenshot baseline once its dynamic fields can be frozen, masked or rendered deterministically.
