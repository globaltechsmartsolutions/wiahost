# Product rules

These rules describe the quality bar WIAHost should preserve as the product grows.

## First viewport

- The first viewport must feel like a premium hospitality command center, not a generic SaaS dashboard.
- There should be one dominant headline/action area per page.
- Main CTAs must be visually clear; secondary CTAs must not compete.
- Desktop two-column blocks should align top and bottom unless there is a deliberate design reason.

## Layout

- Cards in the same grid should use equal row heights where the information hierarchy benefits from comparison.
- Dashboard modules must avoid random width jumps between rows.
- Dashboard content must use a shared column grid so gutters line up across rows, even when one row has 2 cards and another has 3 or 4.
- The amount of cards can change, but the gaps between cards must remain aligned to the same grid rhythm.
- Dashboard rows must not leave dead background gaps between modules; if two cards share a row on desktop, their top and bottom edges must align.
- If one card has more content than its neighbor, the neighbor should stretch as a card, not leave an external hole in the page background.
- Sidebar must never show a stray native scrollbar in normal desktop viewport.
- Multi-calendar must not leave awkward dead space below its rows.
- Mobile layouts must not create horizontal overflow.

## Forms

- Inputs need visible labels or accessible labels.
- Primary form submit buttons should be easy to find and use.
- Long forms should keep field groups visually scannable.

## Operations

- Reservation, task, incident and inbox actions should show a clear result: detail redirect, updated status or visible new message.
- Data writes must go through Supabase with RLS, not only local demo state.
- Demo fallback is acceptable for navigation, but real Supabase mode must remain the main product path.
