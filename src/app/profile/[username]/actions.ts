"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleFollow(targetUserId: string, isFollowing: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Must be logged in to follow");
  }

  if (isFollowing) {
    // Unfollow
    await supabase
      .from("follows")
      .delete()
      .match({ follower_id: user.id, following_id: targetUserId });
  } else {
    // Follow
    await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetUserId });
  }

  revalidatePath("/profile/[username]", "page");
}

export async function addBestGig(eventId: string, position: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Must be logged in" };
  }

  if (position < 0 || position > 5) {
    return { error: "Invalid position" };
  }

  // Delete any existing entry at this position first (replace behavior)
  await supabase
    .from("best_gigs")
    .delete()
    .match({ user_id: user.id, position });

  // Also remove this event if it's already in another position
  await supabase
    .from("best_gigs")
    .delete()
    .match({ user_id: user.id, event_id: eventId });

  const { error } = await supabase
    .from("best_gigs")
    .insert({
      user_id: user.id,
      event_id: eventId,
      position,
    });

  if (error) {
    console.error("addBestGig error:", error);
    return { error: error.message };
  }

  revalidatePath("/profile/[username]", "page");
  return { success: true };
}

export async function removeBestGig(bestGigId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Must be logged in" };
  }

  const { error } = await supabase
    .from("best_gigs")
    .delete()
    .eq("id", bestGigId);

  if (error) {
    console.error("removeBestGig error:", error);
    return { error: error.message };
  }

  revalidatePath("/profile/[username]", "page");
  return { success: true };
}
