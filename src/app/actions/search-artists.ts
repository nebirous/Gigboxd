"use server";

import { createClient } from "@/utils/supabase/server";

export async function searchArtists(query: string) {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createClient();

  // Search by name using ilike for case-insensitive partial match
  const { data, error } = await supabase
    .from("artists")
    .select("id, name, image_url")
    .ilike("name", `%${query.trim()}%`)
    .limit(5);

  if (error) {
    console.error("Error searching artists:", error);
    return [];
  }

  return data || [];
}
