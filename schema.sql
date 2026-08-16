-- Users (Extends Supabase Auth Auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  favorite_genres TEXT[] NOT NULL DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT profiles_username_format CHECK (username ~ '^[a-z0-9_]{3,24}$')
);

CREATE UNIQUE INDEX profiles_username_lower_unique ON public.profiles (lower(username));

-- Artists
CREATE TABLE public.artists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  spotify_id TEXT UNIQUE NOT NULL, -- The Rosetta Stone
  name TEXT NOT NULL,
  image_url TEXT,
  genres TEXT[],
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Venues
CREATE TABLE public.venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  songkick_id TEXT UNIQUE,
  ticketmaster_id TEXT UNIQUE
);

-- Events (Concerts/Festivals)
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  venue_id UUID REFERENCES public.venues(id),
  ticketmaster_id TEXT UNIQUE, -- Primary for future events
  setlist_fm_id TEXT UNIQUE,   -- Primary for past events
  image_url TEXT,
  is_festival BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Event Artists (Many-to-Many)
CREATE TABLE public.event_artists (
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
  is_headliner BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (event_id, artist_id)
);

-- Logs & Ratings (The "Diary" Entry)
CREATE TABLE public.logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Attended', 'Going')) NOT NULL,
  rating DECIMAL(2,1) CHECK (rating >= 1.0 AND rating <= 5.0),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, event_id)
);

-- Follows (Social Graph)
CREATE TABLE public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

-- Best Gigs (up to six pinned favourite events per user profile)
CREATE TABLE public.best_gigs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0 AND position <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, position),
  UNIQUE(user_id, event_id)
);

-- RLS: Row-Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.best_gigs ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read, only users can update their own
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Artists, Venues, Events, Event_Artists: Public read, Service key write
CREATE POLICY "Public read access for artists." ON public.artists FOR SELECT USING (true);
CREATE POLICY "Public read access for venues." ON public.venues FOR SELECT USING (true);
CREATE POLICY "Public read access for events." ON public.events FOR SELECT USING (true);
CREATE POLICY "Public read access for event_artists." ON public.event_artists FOR SELECT USING (true);

-- Allow authenticated users to insert dynamically created venues, events, artists
CREATE POLICY "Users can insert venues." ON public.venues FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert events." ON public.events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert artists." ON public.artists FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert event_artists." ON public.event_artists FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Logs: Public read, User write
CREATE POLICY "Public read access for logs." ON public.logs FOR SELECT USING (true);
CREATE POLICY "Users can insert own logs." ON public.logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs." ON public.logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs." ON public.logs FOR DELETE USING (auth.uid() = user_id);

-- Follows: Public read, User write
CREATE POLICY "Public read access for follows." ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others." ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow." ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Best Gigs: Public read, owners can manage their pinned events
CREATE POLICY "Public read access for best_gigs." ON public.best_gigs FOR SELECT USING (true);
CREATE POLICY "Users can insert own best_gigs." ON public.best_gigs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own best_gigs." ON public.best_gigs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own best_gigs." ON public.best_gigs FOR DELETE USING (auth.uid() = user_id);

-- Profile images are public; users may only manage files in their own folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text))
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

-- Create a Trigger to Automatically Create Profile upon Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    'user_' || substring(replace(new.id::text, '-', '') from 1 for 18),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.set_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_profile_updated_at();
