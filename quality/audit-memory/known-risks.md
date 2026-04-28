# Known risks

## Visual

- Dashboard cards can become uneven when new metrics are added.
- Dashboard can feel over-zoomed on laptops if metrics fall back to two columns or hero typography uses desktop-large sizes too early.
- Dashboard can accidentally become a landing page if hero/card spacing grows; first viewport must stay dense enough for operations.
- Dashboard gutters can drift if each row creates its own independent grid; keep dashboard content on a shared 12-column grid.
- Dashboard rows can create visible beige gaps when one column is taller than the other; keep paired cards stretched and bottom-aligned.
- The multi-calendar can overflow horizontally on laptop widths if the dense 12-column dashboard layout activates too early.
- Sidebar scrolling can show unwanted native scrollbars.
- Dark command-center cards can introduce contrast issues if text opacity is too low.
- Spanish copy with accented characters must be checked because mojibake has appeared in several files.

## Functional

- Supabase Auth depends on seeded `auth.identities`, not only `auth.users`.
- Server Actions must redirect or revalidate after writes so the UI visibly updates.
- Playwright E2E needs Supabase local and `apps/web/.env.local`.
- Vitest must exclude Playwright specs.
- Full edit forms for reservations, tasks and incidents must keep Server Actions and PATCH Route Handlers aligned so web and future mobile clients do not diverge.
- Settings profile tests mutate the demo operator phone; tests must assert stable fields such as email/name and avoid changing demo identity labels used by visual checks.
- Calendar data must exclude archived test properties; otherwise E2E-created archived assets can push real demo assets out of the visible matrix.

## Data

- Seed IDs use deterministic UUID-like values accepted by Postgres; validators should use `z.guid()` for route IDs.
- Dashboard data has fallback demo mode, so tests that require real writes should assert API/UI results after login.

## Future AI

- AI recommendations must remain advisory and auditable.
- Any automated action needs human override and event logging.
