/**
 * API Route: /api/search/events
 * Searches for events — both future (Ticketmaster) and past (Setlist.fm).
 */

import { NextRequest, NextResponse } from "next/server";
import { searchFutureEvents, searchPastEvents } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const type = request.nextUrl.searchParams.get("type") || "future"; // "future" | "past"

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing search query parameter 'q'" },
      { status: 400 }
    );
  }

  try {
    let events;

    if (type === "past") {
      events = await searchPastEvents(query);
    } else {
      events = await searchFutureEvents(query);
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Event search API error:", error);
    return NextResponse.json(
      { error: "Failed to search events" },
      { status: 500 }
    );
  }
}
