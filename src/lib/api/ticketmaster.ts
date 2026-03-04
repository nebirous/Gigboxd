/**
 * Ticketmaster Discovery API Service
 * Role: Primary source for FUTURE events — concerts, tours, and festivals.
 * Provides high-quality promotional images and ticketing links.
 *
 * Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */

export interface TicketmasterEvent {
  ticketmaster_id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  image_url: string | null;
  venue: {
    name: string;
    city: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    ticketmaster_id: string;
  } | null;
  artists: string[]; // Artist names from the event
  is_festival: boolean;
}

/**
 * Search for upcoming events by artist name or keyword.
 */
export async function searchEvents(
  query: string,
  options: { page?: number; size?: number } = {}
): Promise<{ events: TicketmasterEvent[]; totalPages: number }> {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY!;
    const params = new URLSearchParams({
      apikey: apiKey,
      keyword: query,
      classificationName: "music",
      sort: "date,asc",
      size: String(options.size || 10),
      page: String(options.page || 0),
    });

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
      { next: { revalidate: 1800 } } // Cache for 30 minutes
    );

    if (!response.ok) {
      console.error(`Ticketmaster search failed: ${response.status}`);
      return { events: [], totalPages: 0 };
    }

    const data = await response.json();

    if (!data._embedded?.events) {
      return { events: [], totalPages: 0 };
    }

    const events: TicketmasterEvent[] = data._embedded.events.map(
      (event: any) => {
        const venue = event._embedded?.venues?.[0];
        const attractions = event._embedded?.attractions || [];

        return {
          ticketmaster_id: event.id,
          title: event.name,
          date: event.dates?.start?.localDate || "",
          image_url: getBestImage(event.images),
          venue: venue
            ? {
                name: venue.name,
                city: venue.city?.name || "",
                country: venue.country?.name || "",
                latitude: venue.location?.latitude
                  ? parseFloat(venue.location.latitude)
                  : null,
                longitude: venue.location?.longitude
                  ? parseFloat(venue.location.longitude)
                  : null,
                ticketmaster_id: venue.id,
              }
            : null,
          artists: attractions.map((a: any) => a.name),
          is_festival:
            event.classifications?.some(
              (c: any) => c.subGenre?.name === "Festival" || c.genre?.name === "Festival"
            ) || false,
        };
      }
    );

    return {
      events,
      totalPages: data.page?.totalPages || 0,
    };
  } catch (error) {
    console.error("Ticketmaster searchEvents error:", error);
    return { events: [], totalPages: 0 };
  }
}

/**
 * Get a specific event by Ticketmaster ID.
 */
export async function getEventById(
  eventId: string
): Promise<TicketmasterEvent | null> {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY!;

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events/${eventId}.json?apikey=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      console.error(`Ticketmaster getEvent failed: ${response.status}`);
      return null;
    }

    const event = await response.json();
    const venue = event._embedded?.venues?.[0];
    const attractions = event._embedded?.attractions || [];

    return {
      ticketmaster_id: event.id,
      title: event.name,
      date: event.dates?.start?.localDate || "",
      image_url: getBestImage(event.images),
      venue: venue
        ? {
            name: venue.name,
            city: venue.city?.name || "",
            country: venue.country?.name || "",
            latitude: venue.location?.latitude
              ? parseFloat(venue.location.latitude)
              : null,
            longitude: venue.location?.longitude
              ? parseFloat(venue.location.longitude)
              : null,
            ticketmaster_id: venue.id,
          }
        : null,
      artists: attractions.map((a: any) => a.name),
      is_festival:
        event.classifications?.some(
          (c: any) => c.subGenre?.name === "Festival" || c.genre?.name === "Festival"
        ) || false,
    };
  } catch (error) {
    console.error("Ticketmaster getEventById error:", error);
    return null;
  }
}

/**
 * Pick the highest-quality 16:9 image from Ticketmaster's image array.
 */
function getBestImage(images: any[] | undefined): string | null {
  if (!images || images.length === 0) return null;

  // Prefer 16_9 ratio images, sorted by width descending
  const sorted = [...images]
    .filter((img) => img.ratio === "16_9")
    .sort((a, b) => (b.width || 0) - (a.width || 0));

  return sorted[0]?.url || images[0]?.url || null;
}
