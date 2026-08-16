-- Best Gigs (User's pinned favourite gigs for their profile)
CREATE TABLE public.best_gigs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0 AND position <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, position),
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.best_gigs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for best_gigs." ON public.best_gigs FOR SELECT USING (true);
CREATE POLICY "Users can insert own best_gigs." ON public.best_gigs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own best_gigs." ON public.best_gigs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own best_gigs." ON public.best_gigs FOR DELETE USING (auth.uid() = user_id);
