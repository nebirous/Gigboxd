-- seed.sql
-- Dummy Data for Artists, Venues, Events, and Event Artists
-- IMPORTANT: Run this in your Supabase SQL Editor. 
-- Make sure to avoid running this on your production database more than once without truncating tables first if UUIDs match.

-- 1. Insert Mock Artists
INSERT INTO public.artists (id, spotify_id, name, image_url, genres) VALUES
('a1111111-1111-1111-1111-111111111111', '4Z8W4fZZB5yA23XkE73fbb', 'Radiohead', 'https://i.scdn.co/image/ab6761610000e5ebb1c4b76e23415c9f2024b06b', ARRAY['alternative rock', 'art rock', 'melancholy']),
('a2222222-2222-2222-2222-222222222222', '6M2wZ9GZgrQXHCFfjv46we', 'Dua Lipa', 'https://i.scdn.co/image/ab6761610000e5eb4293f9c3f4e15777bd3652f1', ARRAY['dance pop', 'pop', 'uk pop']),
('a3333333-3333-3333-3333-333333333333', '2YZyLoL8N0Wb9xBt1NhZWg', 'Kendrick Lamar', 'https://i.scdn.co/image/ab6761610000e5eb437b9e2a82505b3d93ff1022', ARRAY['conscious hip hop', 'hip hop', 'rap'])
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Mock Venues
INSERT INTO public.venues (id, name, city, country, latitude, longitude, songkick_id) VALUES
('b1111111-1111-1111-1111-111111111111', 'Madison Square Garden', 'New York', 'USA', 40.7505, -73.9934, '12345'),
('b2222222-2222-2222-2222-222222222222', 'The O2', 'London', 'UK', 51.5030, 0.0032, '67890'),
('b3333333-3333-3333-3333-333333333333', 'Wembley Stadium', 'London', 'UK', 51.5560, -0.2795, '11223')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Mock Events
INSERT INTO public.events (id, title, date, venue_id, image_url) VALUES
('e1111111-1111-1111-1111-111111111111', 'A Moon Shaped Pool Tour', '2016-07-26', 'b1111111-1111-1111-1111-111111111111', 'https://i.scdn.co/image/ab6761610000e5ebb1c4b76e23415c9f2024b06b'),
('e2222222-2222-2222-2222-222222222222', 'Future Nostalgia Tour', '2022-05-02', 'b2222222-2222-2222-2222-222222222222', 'https://i.scdn.co/image/ab6761610000e5eb4293f9c3f4e15777bd3652f1'),
('e3333333-3333-3333-3333-333333333333', 'The Big Steppers Tour', '2022-08-06', 'b1111111-1111-1111-1111-111111111111', 'https://i.scdn.co/image/ab6761610000e5eb437b9e2a82505b3d93ff1022')
ON CONFLICT (id) DO NOTHING;

-- 4. Link Artists to Events (Event Artists)
INSERT INTO public.event_artists (event_id, artist_id, is_headliner) VALUES
('e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', TRUE),
('e2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', TRUE),
('e3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', TRUE)
ON CONFLICT DO NOTHING;
