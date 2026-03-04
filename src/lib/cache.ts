/**
 * Lazy-Loading Cache Orchestrator
 *
 * Implements the data flow from data_architecture.md:
 * Phase 1: Check local Supabase DB
 * Phase 2: If stale/missing → fetch from third-party API
 * Phase 3: Normalize, save to DB, and return
 *
 * This ensures we only hit rate-limited APIs for NEW searches.
 */

import { createClient } from "@/utils/supabase/server";
import { searchArtist as spotifySearchArtist, getArtistById } from "./api/spotify";
import { searchEvents as tmSearchEvents } from "./api/ticketmaster";
import { searchSetlists as sfSearchSetlists } from "./api/setlist-fm";

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isStale(lastUpdated: string | null): boolean {
  if (!lastUpdated) return true;
  return Date.now() - new Date(lastUpdated).getTime() > STALE_THRESHOLD_MS;
}

// ─── Artist Cache ──────────────────────────────────────────────────

export async function getCachedArtist(spotifyId: string) {
  const supabase = await createClient();

  // Phase 1: Check local DB
  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("spotify_id", spotifyId)
    .single();

  if (artist && !isStale(artist.last_updated)) {
    return artist; // Fresh cache hit
  }

  // Phase 2: Fetch from Spotify
  const spotifyData = await getArtistById(spotifyId);
  if (!spotifyData) return artist; // Return stale data rather than nothing

  // Phase 3: Upsert to DB and return
  const { data: upserted } = await supabase
    .from("artists")
    .upsert(
      {
        spotify_id: spotifyData.spotify_id,
        name: spotifyData.name,
        image_url: spotifyData.image_url,
        genres: spotifyData.genres,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "spotify_id" }
    )
    .select()
    .single();

  return upserted || artist;
}

/**
 * Search artists — checks DB first, then falls back to Spotify API.
 */
export async function searchArtists(query: string) {
  const supabase = await createClient();

  // Phase 1: Check local DB for matching artists
  const { data: localArtists } = await supabase
    .from("artists")
    .select("*")
    .ilike("name", `%${query}%`)
    .limit(10);

  if (localArtists && localArtists.length >= 3) {
    return localArtists; // Enough local results
  }

  // Phase 2: Fetch from Spotify
  const spotifyResults = await spotifySearchArtist(query);

  if (spotifyResults.length === 0) {
    return localArtists || [];
  }

  // Phase 3: Upsert all results to DB
  const upsertData = spotifyResults.map((a) => ({
    spotify_id: a.spotify_id,
    name: a.name,
    image_url: a.image_url,
    genres: a.genres,
    last_updated: new Date().toISOString(),
  }));

  const { data: upserted } = await supabase
    .from("artists")
    .upsert(upsertData, { onConflict: "spotify_id" })
    .select();

  return upserted || spotifyResults;
}

// ─── Event Cache (Future — Ticketmaster) ───────────────────────────

export async function searchFutureEvents(query: string) {
  const supabase = await createClient();

  // Phase 1: Check local DB
  const { data: localEvents } = await supabase
    .from("events")
    .select("*, venues(*)")
    .gte("date", new Date().toISOString().split("T")[0])
    .ilike("title", `%${query}%`)
    .order("date", { ascending: true })
    .limit(10);

  if (localEvents && localEvents.length >= 3) {
    return localEvents;
  }

  // Phase 2: Fetch from Ticketmaster
  const { events: tmEvents } = await tmSearchEvents(query);

  if (tmEvents.length === 0) {
    return localEvents || [];
  }

  // Phase 3: Upsert venues and events
  const results = [];

  for (const tmEvent of tmEvents) {
    let venueId: string | null = null;

    if (tmEvent.venue) {
      const { data: venue } = await supabase
        .from("venues")
        .upsert(
          {
            name: tmEvent.venue.name,
            city: tmEvent.venue.city,
            country: tmEvent.venue.country,
            latitude: tmEvent.venue.latitude,
            longitude: tmEvent.venue.longitude,
            ticketmaster_id: tmEvent.venue.ticketmaster_id,
          },
          { onConflict: "ticketmaster_id" }
        )
        .select("id")
        .single();

      venueId = venue?.id || null;
    }

    const { data: event } = await supabase
      .from("events")
      .upsert(
        {
          title: tmEvent.title,
          date: tmEvent.date,
          venue_id: venueId,
          ticketmaster_id: tmEvent.ticketmaster_id,
          image_url: tmEvent.image_url,
          is_festival: tmEvent.is_festival,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "ticketmaster_id" }
      )
      .select("*, venues(*)")
      .single();

    if (event) results.push(event);
  }

  return results.length > 0 ? results : localEvents || [];
}

// ─── Event Cache (Past — Setlist.fm) ───────────────────────────────

export async function searchPastEvents(artistName: string) {
  const supabase = await createClient();

  // Phase 1: Check local DB for past events
  const { data: localEvents } = await supabase
    .from("events")
    .select("*, venues(*)")
    .lt("date", new Date().toISOString().split("T")[0])
    .ilike("title", `%${artistName}%`)
    .order("date", { ascending: false })
    .limit(10);

  if (localEvents && localEvents.length >= 3) {
    return localEvents;
  }

  // Phase 2: Fetch from Setlist.fm
  const { setlists } = await sfSearchSetlists(artistName);

  if (setlists.length === 0) {
    return localEvents || [];
  }

  // Phase 3: Upsert venues and events
  const results = [];

  for (const setlist of setlists) {
    let venueId: string | null = null;

    if (setlist.venue) {
      // Use a composite lookup since Setlist.fm doesn't provide a unique venue ID
      const { data: venue } = await supabase
        .from("venues")
        .upsert(
          {
            name: setlist.venue.name,
            city: setlist.venue.city,
            country: setlist.venue.country,
            latitude: setlist.venue.latitude,
            longitude: setlist.venue.longitude,
          },
          {
            onConflict: "name,city,country",
            ignoreDuplicates: false,
          }
        )
        .select("id")
        .single();

      // Fallback: if upsert fails (no unique constraint on name+city+country), try insert
      if (!venue) {
        const { data: existing } = await supabase
          .from("venues")
          .select("id")
          .eq("name", setlist.venue.name)
          .eq("city", setlist.venue.city)
          .eq("country", setlist.venue.country)
          .single();

        venueId = existing?.id || null;

        if (!venueId) {
          const { data: inserted } = await supabase
            .from("venues")
            .insert({
              name: setlist.venue.name,
              city: setlist.venue.city,
              country: setlist.venue.country,
              latitude: setlist.venue.latitude,
              longitude: setlist.venue.longitude,
            })
            .select("id")
            .single();

          venueId = inserted?.id || null;
        }
      } else {
        venueId = venue.id;
      }
    }

    const { data: event } = await supabase
      .from("events")
      .upsert(
        {
          title: setlist.title,
          date: setlist.date,
          venue_id: venueId,
          setlist_fm_id: setlist.setlist_fm_id,
          is_festival: false,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "setlist_fm_id" }
      )
      .select("*, venues(*)")
      .single();

    if (event) results.push(event);
  }

  return results.length > 0 ? results : localEvents || [];
}
