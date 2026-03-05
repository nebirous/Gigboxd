import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { searchFutureEvents, searchPastEvents } from "@/lib/cache";
import { ArrowLeft, MapPin, Calendar, Music } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ArtistPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch artist from DB
  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .single();

  if (!artist) {
    notFound();
  }

  // 2. Pre-fetch and cache events for this artist
  // We don't await these here, we could use Promise.all to trigger the cache populator
  const [futureEvents, pastEvents] = await Promise.all([
    searchFutureEvents(artist.name),
    searchPastEvents(artist.name),
  ]);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header / Hero Image */}
      <div className="relative h-64 md:h-80 w-full bg-zinc-900 border-b border-zinc-800">
        {artist.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.image_url}
            alt={artist.name}
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <Music size={64} className="text-zinc-800" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />

        {/* Content Positioning */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-8 max-w-4xl mx-auto w-full">
          {/* Back Button */}
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md w-fit border border-zinc-700/50"
          >
            <ArrowLeft size={16} />
            Back to Search
          </Link>

          {/* Title Area */}
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-white font-outfit tracking-tight drop-shadow-xl">
              {artist.name}
            </h1>
            {artist.genres && artist.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {artist.genres.slice(0, 3).map((genre: string) => (
                  <span
                    key={genre}
                    className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-neon-cyan border border-neon-cyan/30 bg-neon-cyan/5 rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
        {/* Future Events Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-outfit text-white">
              Upcoming Shows
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {futureEvents.length > 0 ? (
              futureEvents.slice(0, 4).map((event: any) => renderEventCard(event))
            ) : (
              <p className="text-zinc-500 text-sm">No upcoming shows found.</p>
            )}
          </div>
        </section>

        {/* Past Events Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-outfit text-white">
              Past Setlists
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastEvents.length > 0 ? (
              pastEvents.slice(0, 6).map((event: any) => renderEventCard(event))
            ) : (
              <p className="text-zinc-500 text-sm">No past setlists found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function renderEventCard(event: any) {
  const venueName = event.venues?.name || "Unknown Venue";
  const city = event.venues?.city;
  const location = city ? `${venueName}, ${city}` : venueName;

  return (
    <Link key={event.id} href={`/event/${event.id}`}>
      <Card className="hover:border-neon-fuchsia/30 group transition-all h-full">
        <CardContent className="p-4 flex gap-4 h-full">
          {/* Date Calendar Box */}
          <div className="flex flex-col items-center justify-center shrink-0 w-14 h-14 bg-zinc-950 rounded-lg border border-zinc-800 group-hover:border-neon-fuchsia/50 transition-colors">
            <span className="text-[10px] font-bold text-neon-fuchsia uppercase tracking-widest">
              {new Date(event.date).toLocaleDateString("en-US", {
                month: "short",
              })}
            </span>
            <span className="text-xl font-black text-white leading-none mt-0.5">
              {new Date(event.date).getDate()}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-white truncate font-outfit">
              {event.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-400">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            {event.is_festival && (
              <span className="inline-block mt-2 text-[10px] font-bold text-neon-green uppercase tracking-wider">
                Festival
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
