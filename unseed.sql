-- unseed.sql
-- Deletes the dummy data inserted by seed.sql based on their explicit UUIDs.
-- Because of 'ON DELETE CASCADE', deleting the events and artists will also remove the entries in 'event_artists'.

-- 1. Delete Events
DELETE FROM public.events
WHERE id IN (
  'e1111111-1111-1111-1111-111111111111',
  'e2222222-2222-2222-2222-222222222222',
  'e3333333-3333-3333-3333-333333333333'
);

-- 2. Delete Artists
DELETE FROM public.artists
WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);

-- 3. Delete Venues
DELETE FROM public.venues
WHERE id IN (
  'b1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'b3333333-3333-3333-3333-333333333333'
);
