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

    revalidatePath("/profile/[username]", "page");
    revalidatePath("/diary");
    return { success: true };
  } catch (err: any) {
    console.error("Action Error logGig:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}
