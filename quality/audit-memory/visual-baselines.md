# Visual baselines

Current baseline strategy:

- Functional E2E remains deterministic and fast.
- Visual regression is opt-in through `pnpm test:visual`.
- Committed snapshots cover stable public/auth screens first.
- Dynamic dashboards are captured as run artifacts and checked for horizontal overflow, but not yet snapshotted because dates, SLA times and seed-relative values change.
- Dashboard grid gutters are tested directly: horizontal and vertical gaps must match the shared grid rhythm even when rows have different card counts.
- Dashboard responsive desktop sizes are tested at 1366, 1440, 1536 and 1920 pixels to prevent zoom-like cramped layouts and internal calendar scrollbars.
- Laptop scale is tested directly: hero title size is capped and the four metric cards must remain in one row on standard desktop laptop widths.
- First viewport density is tested by checking that calendar context starts early enough on laptop desktop widths.
- Property list/detail/edit routes are covered by artifact-only visual checks for laptop overflow until we can freeze dynamic data for strict screenshots.
- Operation list/detail/edit routes for reservations, tasks and incidents are covered by artifact-only visual checks for laptop overflow and responsive density.
- Automations, owners, payments and settings are covered by artifact-only visual checks for laptop overflow and responsive density.
- Calendar plus guest list/detail/edit are covered by artifact-only visual checks for laptop overflow and responsive density.
- Lighthouse CI writes public-route reports to `quality/reports/lighthouse` and runs in CI as a non-blocking early warning until we have enough history to make it a hard gate.

Promotion rule:

- A page can move from artifact-only visual audit to strict screenshot baseline once its dynamic fields can be frozen, masked or rendered deterministically.
