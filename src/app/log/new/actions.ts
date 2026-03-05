"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function createLogEntry(formData: FormData) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect("/login");
  }

  const userId = data.claims.sub;

  const eventId = formData.get("eventId") as string;
  const status = formData.get("status") as string;
  const rawRating = formData.get("rating") as string;
  const reviewText = formData.get("reviewText") as string;

  const rating = rawRating ? parseFloat(rawRating) : null;

  // Insert or update (upsert) the log entry
  const { error } = await supabase
    .from("logs")
    .upsert(
      {
        user_id: userId,
        event_id: eventId,
        status: status,
        rating: rating,
        review_text: reviewText || null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,event_id" }
    );

  if (error) {
    console.error("Failed to save log entry:", error);
    // You could return an error object here, but for simplicity we redirect back
    redirect(`/event/${eventId}?error=Failed+to+save`);
  }

  revalidatePath("/profile");
  revalidatePath(`/profile/[username]`, "page");
  revalidatePath(`/event/${eventId}`);
  
  redirect("/profile");
}
