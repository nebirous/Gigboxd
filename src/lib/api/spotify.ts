/**
 * Spotify API Service
 * Role: The "Rosetta Stone" — fetches artist metadata and provides
 * the canonical spotify_id used to link artists across all APIs.
 *
 * Uses Client Credentials flow (no user login required).
 * Docs: https://developer.spotify.com/documentation/web-api
 */

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 60s early
  };

  return cachedToken.token;
}

export interface SpotifyArtist {
  spotify_id: string;
  name: string;
  image_url: string | null;
  genres: string[];
}

/**
 * Search for an artist by name and return normalized data.
 */
export async function searchArtist(query: string): Promise<SpotifyArtist[]> {
  try {
    const token = await getAccessToken();
    const params = new URLSearchParams({
      q: query,
      type: "artist",
      limit: "10",
    });

    const response = await fetch(
      `https://api.spotify.com/v1/search?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error(`Spotify search failed: ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data.artists?.items || []).map((artist: any) => ({
      spotify_id: artist.id,
      name: artist.name,
      image_url: artist.images?.[0]?.url || null,
      genres: artist.genres || [],
    }));
  } catch (error) {
    console.error("Spotify searchArtist error:", error);
    return [];
  }
}

/**
 * Get a specific artist by Spotify ID.
 */
export async function getArtistById(
  spotifyId: string
): Promise<SpotifyArtist | null> {
  try {
    const token = await getAccessToken();

    const response = await fetch(
      `https://api.spotify.com/v1/artists/${spotifyId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      console.error(`Spotify getArtist failed: ${response.status}`);
      return null;
    }

    const artist = await response.json();

    return {
      spotify_id: artist.id,
      name: artist.name,
      image_url: artist.images?.[0]?.url || null,
      genres: artist.genres || [],
    };
  } catch (error) {
    console.error("Spotify getArtistById error:", error);
    return null;
  }
}
