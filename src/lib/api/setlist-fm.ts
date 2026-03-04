/**
 * Setlist.fm API Service
 * Role: The "Holy Grail" for past concert data — community-validated setlists.
 * Rate limit: 2 requests/second.
 *
 * Docs: https://api.setlist.fm/docs/1.0/index.html
 */

const SETLIST_FM_BASE = "https://api.setlist.fm/rest/1.0";

function getHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "x-api-key": process.env.SETLIST_FM_API_KEY!,
  };
}

export interface SetlistSong {
  name: string;
  encore?: boolean;
}

export interface SetlistEvent {
  setlist_fm_id: string;
  title: string; // e.g. "Radiohead at Madison Square Garden"
  date: string; // ISO date YYYY-MM-DD
  artist_name: string;
  venue: {
    name: string;
    city: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  setlist: SetlistSong[];
  tour_name: string | null;
}

/**
 * Search for past setlists by artist name.
 */
export async function searchSetlists(
  artistName: string,
  options: { page?: number } = {}
): Promise<{ setlists: SetlistEvent[]; totalPages: number }> {
  try {
    const params = new URLSearchParams({
      artistName,
      p: String(options.page || 1),
    });

    const response = await fetch(
      `${SETLIST_FM_BASE}/search/setlists?${params}`,
      {
        headers: getHeaders(),
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error(`Setlist.fm search failed: ${response.status}`);
      return { setlists: [], totalPages: 0 };
    }

    const data = await response.json();

    if (!data.setlist) {
      return { setlists: [], totalPages: 0 };
    }

    const setlists: SetlistEvent[] = data.setlist.map(normalizeSetlist);

    return {
      setlists,
      totalPages: Math.ceil((data.total || 0) / (data.itemsPerPage || 20)),
    };
  } catch (error) {
    console.error("Setlist.fm searchSetlists error:", error);
    return { setlists: [], totalPages: 0 };
  }
}

/**
 * Get a specific setlist by its Setlist.fm ID.
 */
export async function getSetlistById(
  setlistId: string
): Promise<SetlistEvent | null> {
  try {
    const response = await fetch(
      `${SETLIST_FM_BASE}/setlist/${setlistId}`,
      {
        headers: getHeaders(),
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      console.error(`Setlist.fm getSetlist failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return normalizeSetlist(data);
  } catch (error) {
    console.error("Setlist.fm getSetlistById error:", error);
    return null;
  }
}

/**
 * Normalize a raw Setlist.fm API response into our standard format.
 */
function normalizeSetlist(raw: any): SetlistEvent {
  // Setlist.fm dates are in "dd-MM-yyyy" format
  const rawDate = raw.eventDate || "";
  const [day, month, year] = rawDate.split("-");
  const isoDate = year && month && day ? `${year}-${month}-${day}` : "";

  const venue = raw.venue;
  const city = venue?.city;

  // Extract songs from all sets (including encores)
  const songs: SetlistSong[] = [];
  const sets = raw.sets?.set || [];
  for (const set of sets) {
    const isEncore = set.encore !== undefined;
    for (const song of set.song || []) {
      if (song.name) {
        songs.push({ name: song.name, encore: isEncore });
      }
    }
  }

  return {
    setlist_fm_id: raw.id,
    title: `${raw.artist?.name || "Unknown"} at ${venue?.name || "Unknown Venue"}`,
    date: isoDate,
    artist_name: raw.artist?.name || "Unknown",
    venue: venue
      ? {
          name: venue.name || "",
          city: city?.name || "",
          country: city?.country?.name || "",
          latitude: city?.coords?.lat ? parseFloat(city.coords.lat) : null,
          longitude: city?.coords?.long ? parseFloat(city.coords.long) : null,
        }
      : null,
    setlist: songs,
    tour_name: raw.tour?.name || null,
  };
}
