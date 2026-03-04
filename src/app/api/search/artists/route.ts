/**
 * API Route: /api/search/artists
 * Searches for artists using the lazy-loading cache (Spotify → DB).
 */

import { NextRequest, NextResponse } from "next/server";
import { searchArtists } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing search query parameter 'q'" },
      { status: 400 }
    );
  }

  try {
    const artists = await searchArtists(query);
    return NextResponse.json({ artists });
  } catch (error) {
    console.error("Artist search API error:", error);
    return NextResponse.json(
      { error: "Failed to search artists" },
      { status: 500 }
    );
  }
}
