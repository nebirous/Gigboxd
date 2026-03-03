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
