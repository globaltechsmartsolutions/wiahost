# Known risks

## Visual

- Dashboard cards can become uneven when new metrics are added.
- Dashboard gutters can drift if each row creates its own independent grid; keep dashboard content on a shared 12-column grid.
- Dashboard rows can create visible beige gaps when one column is taller than the other; keep paired cards stretched and bottom-aligned.
- The multi-calendar can overflow horizontally on laptop widths.
- Sidebar scrolling can show unwanted native scrollbars.
- Dark command-center cards can introduce contrast issues if text opacity is too low.
- Spanish copy with accented characters must be checked because mojibake has appeared in several files.

## Functional

- Supabase Auth depends on seeded `auth.identities`, not only `auth.users`.
- Server Actions must redirect or revalidate after writes so the UI visibly updates.
- Playwright E2E needs Supabase local and `apps/web/.env.local`.
- Vitest must exclude Playwright specs.

## Data

- Seed IDs use deterministic UUID-like values accepted by Postgres; validators should use `z.guid()` for route IDs.
- Dashboard data has fallback demo mode, so tests that require real writes should assert API/UI results after login.

## Future AI

- AI recommendations must remain advisory and auditable.
- Any automated action needs human override and event logging.
