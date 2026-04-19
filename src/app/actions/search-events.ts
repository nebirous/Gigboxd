"use server";

import { createClient } from "@/utils/supabase/server";

export async function searchEvents(query: string) {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(`
      id, title, date, image_url,
      venues ( id, name, city, country ),
      event_artists (
        is_headliner,
        artists ( id, name )
      )
    `)
    .ilike("title", `%${query.trim()}%`)
    .limit(5);

  if (error) {
    console.error("Error searching events:", error);
    return [];
  }

  return data || [];
}
