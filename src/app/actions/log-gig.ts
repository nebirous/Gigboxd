"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function logGig(formData: FormData) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { error: "You must be logged in to log a gig." };
  }

  const userId = session.user.id;

  // Event inputs
  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const imageUrl = formData.get("imageUrl") as string | null;

  // Venue inputs
  const venueName = formData.get("venueName") as string;
  const venueCity = formData.get("venueCity") as string;
  const venueCountry = formData.get("venueCountry") as string;

  // Log inputs
  const status = formData.get("status") as string || "Attended"; // 'Attended' or 'Going'
  const ratingStr = formData.get("rating") as string;
  const rating = ratingStr ? parseFloat(ratingStr) : null;
  const reviewText = formData.get("reviewText") as string | null;

  // Bands input (JSON stringified array from the frontend)
  const bandsStr = formData.get("bands") as string;
  let bands: { name: string; isHeadliner: boolean }[] = [];
  try {
    if (bandsStr) {
      bands = JSON.parse(bandsStr);
    }
  } catch (e) {
    console.error("Failed to parse bands", e);
  }

  if (!title || !date || !venueName || !venueCity || !venueCountry) {
    return { error: "Missing required fields." };
  }

  try {
    // 1. Find or create the venue
    let venueId: string;

    // Check if venue exists (case-insensitive search loosely)
    const { data: existingVenues, error: venueSearchError } = await supabase
      .from("venues")
      .select("id")
      .ilike("name", venueName)
      .ilike("city", venueCity)
      .limit(1);

    if (venueSearchError) throw venueSearchError;

    if (existingVenues && existingVenues.length > 0) {
      venueId = existingVenues[0].id;
    } else {
      // Create new venue
      const { data: newVenue, error: venueCreateError } = await supabase
        .from("venues")
        .insert({
          name: venueName,
          city: venueCity,
          country: venueCountry,
        })
        .select("id")
        .single();

      if (venueCreateError) throw venueCreateError;
      venueId = newVenue.id;
    }

    // 2. Create the event
    const { data: newEvent, error: eventCreateError } = await supabase
      .from("events")
      .insert({
        title,
        date,
        venue_id: venueId,
        image_url: imageUrl || null,
        is_festival: false, // Default to false for now
      })
      .select("id")
      .single();

    if (eventCreateError) throw eventCreateError;

    // 3. Create the log
    const { error: logCreateError } = await supabase
      .from("logs")
      .insert({
        user_id: userId,
        event_id: newEvent.id,
        status,
        rating,
        review_text: reviewText || null,
      });

    if (logCreateError) {
      // If there's an error (like unique constraint violation), we throw it.
      if (logCreateError.code === "23505") { // Unique constraint violation usually
        throw new Error("You have already logged this specific entry.");
      }
      throw logCreateError;
    }

    // 4. Process Bands
    if (bands.length > 0) {
      for (const band of bands) {
        if (!band.name.trim()) continue;

        let artistId: string;

        // Try to find existing artist
        const { data: existingArtists, error: artistSearchError } = await supabase
          .from("artists")
          .select("id")
          .ilike("name", band.name.trim())
          .limit(1);

        if (artistSearchError) throw artistSearchError;

        if (existingArtists && existingArtists.length > 0) {
          artistId = existingArtists[0].id;
        } else {
          // Create new artist with a fake spotify_id
          const { data: newArtist, error: artistCreateError } = await supabase
            .from("artists")
            .insert({
              name: band.name.trim(),
              spotify_id: `custom-${crypto.randomUUID()}`,
              image_url: imageUrl || null, // Reuse event poster as requested
              genres: []
            })
            .select("id")
            .single();

          if (artistCreateError) throw artistCreateError;
          artistId = newArtist.id;
        }

        // Create mapping in event_artists
        const { error: eventArtistError } = await supabase
          .from("event_artists")
          .insert({
            event_id: newEvent.id,
            artist_id: artistId,
            is_headliner: band.isHeadliner,
          });

        if (eventArtistError) throw eventArtistError;
      }
    }

    revalidatePath("/profile/[username]", "page");
    revalidatePath("/diary");
    return { success: true };
  } catch (err: any) {
    console.error("Action Error logGig:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}
