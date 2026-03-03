-- Users (Extends Supabase Auth Auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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

-- RLS: Row-Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read, only users can update their own
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Artists, Venues, Events, Event_Artists: Public read, Service key write
CREATE POLICY "Public read access for artists." ON public.artists FOR SELECT USING (true);
CREATE POLICY "Public read access for venues." ON public.venues FOR SELECT USING (true);
CREATE POLICY "Public read access for events." ON public.events FOR SELECT USING (true);
CREATE POLICY "Public read access for event_artists." ON public.event_artists FOR SELECT USING (true);

-- Logs: Public read, User write
CREATE POLICY "Public read access for logs." ON public.logs FOR SELECT USING (true);
CREATE POLICY "Users can insert own logs." ON public.logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs." ON public.logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs." ON public.logs FOR DELETE USING (auth.uid() = user_id);

-- Follows: Public read, User write
CREATE POLICY "Public read access for follows." ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others." ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow." ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Create a Trigger to Automatically Create Profile upon Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
