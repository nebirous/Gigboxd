"use server";

import { createClient } from "@/utils/supabase/server";

export async function searchVenues(query: string) {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createClient();

  // Search by name using ilike for case-insensitive partial match
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, city, country")
    .ilike("name", `%${query.trim()}%`)
    .limit(5);

  if (error) {
    console.error("Error searching venues:", error);
    return [];
  }

  return data || [];
}
