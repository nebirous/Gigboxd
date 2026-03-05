import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, MapPin, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch event from DB
  const { data: event } = await supabase
    .from("events")
    .select("*, venues(*)")
    .eq("id", id)
    .single();

  if (!event) {
    notFound();
  }

  const isFuture = new Date(event.date) >= new Date();
  const venue = event.venues;
  const location = venue?.city
    ? `${venue.name}, ${venue.city}${venue.country ? `, ${venue.country}` : ""}`
    : venue?.name || "Unknown Venue";

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header / Hero Image */}
      <div className="relative h-64 md:h-80 w-full bg-zinc-900 border-b border-zinc-800">
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover opacity-50 mix-blend-luminosity"
          />
        ) : (
          <div className="w-full h-full bg-zinc-900" />
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
            Back
          </Link>

          {/* Title Area */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-black bg-white rounded">
                {isFuture ? "Upcoming" : "Past Event"}
              </span>
              {event.is_festival && (
                <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-neon-green border border-neon-green/30 bg-neon-green/10 rounded">
                  Festival
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white font-outfit tracking-tight drop-shadow-xl max-w-2xl leading-tight">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Meta Row */}
            <div className="flex flex-wrap gap-6 border-b border-zinc-800 pb-6 text-zinc-300">
              <div className="flex items-center gap-2">
                <Calendar className="text-neon-cyan w-5 h-5" />
                <span className="font-medium">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="text-neon-fuchsia w-5 h-5" />
                <span className="font-medium">{location}</span>
              </div>
            </div>

            {/* Description / Content */}
            <div className="prose prose-invert">
              <p className="text-zinc-400 leading-relaxed">
                Log this {event.is_festival ? "festival" : "concert"} to your diary to track your stats, record your rating, and write a review. Your logs are visible on your profile and help build your live music graph.
              </p>
            </div>
          </div>

          {/* Sidebar CTA */}
          <div className="md:col-span-1">
            <div className="glass p-6 rounded-2xl sticky top-24 border border-zinc-800/50">
              <h3 className="font-outfit font-bold text-white text-xl mb-4">
                Were you there?
              </h3>
              
              {/* This opens the Log Modal we will build next */}
              <Link href={`/log/new?eventId=${event.id}`}>
                <Button variant="neon" className="w-full h-12 text-lg">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Log this show
                </Button>
              </Link>
              
              <p className="text-xs text-zinc-500 text-center mt-4">
                Join the community and track your live music history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
