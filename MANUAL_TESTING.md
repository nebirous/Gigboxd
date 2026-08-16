# Manual QA with seed data

This checklist verifies the current MVP without calling external event APIs. It uses the sample artists and events in `seed.sql`.

## Setup

1. In a new Supabase project, run `schema.sql` once.
2. Run `seed.sql` once in the Supabase SQL editor.
3. Start the app with `npm run dev` and create a new email account.

The seed includes these event IDs:

| Event | URL |
| --- | --- |
| A Moon Shaped Pool Tour | `/event/e1111111-1111-1111-1111-111111111111` |
| Future Nostalgia Tour | `/event/e2222222-2222-2222-2222-222222222222` |
| The Big Steppers Tour | `/event/e3333333-3333-3333-3333-333333333333` |

## Checklist

### Authentication and navigation

- Visit `/`: unauthenticated users must be sent to `/login`.
- Submit invalid credentials: an inline error must appear on the login page.
- Create an account. If email confirmation is enabled, a confirmation message must appear instead of redirecting to a broken profile.
- After signing in, visit `/diary`: it must redirect to `/profile/<username>/gigs`.

### Search and event pages

- Open `/discover` and search for `Radiohead`. The locally seeded artist/event should be returned even if external APIs are unavailable.
- Search for a random string. Confirm the no-results state suggests a next action.
- Open each seeded event URL above. Confirm that title, date, venue and the **Log this show** action are visible.

### Logging and diary

- On the Radiohead event page, choose **Log this show**, select **Attended**, a rating, and a short review; save.
- Repeat with the Dua Lipa event using **Going** and no rating.
- Open `/diary` and verify both entries can be filtered by status; the attended entry can also be found by review status and text search.
- Return to `/profile`: the attended event appears under Latest Gigs and its rating is shown.
- Open the log modal from the navigation and submit once with a required field empty; the inline validation message must be shown. Submit an already logged event and confirm the duplicate-entry message.

### Best Gigs and empty states

- On the profile, add the attended Radiohead entry to a Best Gigs slot, refresh the page, then remove it.
- With a new account that has no logs, verify the profile shows the empty concert/festival states and the diary shows its empty filtered-results state.

## Cleanup

Run `unseed.sql` to delete sample artists, venues, and events. Delete the test user and its logs from Supabase Auth/database if the environment is shared.

## Known test boundary

The checklist intentionally does not require Spotify, Ticketmaster, or Setlist.fm. It validates the local database fallback. External search should be tested separately with valid API credentials and network access.
