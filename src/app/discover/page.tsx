"use client";

import { useState, useEffect } from "react";
import { Search as SearchIcon, Music, MapPin, Calendar, ArrowRight } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

type SearchResultItem = {
  type: "artist" | "event";
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  href: string;
};

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    async function searchCombined() {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);

      try {
        // Fetch artists and events in parallel
        const [artistsRes, eventsRes] = await Promise.all([
          fetch(`/api/search/artists?q=${encodeURIComponent(debouncedQuery)}`),
          fetch(
            `/api/search/events?q=${encodeURIComponent(
              debouncedQuery
            )}&type=future`
          ),
        ]);

        const artistsData = await artistsRes.json();
        const eventsData = await eventsRes.json();

        const combinedResults: SearchResultItem[] = [];

        // Format Artists
        if (artistsData.artists) {
          artistsData.artists.slice(0, 5).forEach((artist: any) => {
            combinedResults.push({
              type: "artist",
              id: artist.spotify_id || artist.id,
              title: artist.name,
              subtitle: "Artist",
              imageUrl: artist.image_url,
              href: `/artist/${artist.id}`, // We'll use our internal ID
            });
          });
        }

        // Format Events
        if (eventsData.events) {
          eventsData.events.slice(0, 10).forEach((event: any) => {
            // Local fallback if structure is different
            const venueName = event.venues?.[0]?.name || "Unknown Venue";
            
            combinedResults.push({
              type: "event",
              id: event.ticketmaster_id || event.id,
              title: event.title,
              subtitle: `${new Date(event.date).toLocaleDateString()} • ${venueName}`,
              imageUrl: event.image_url,
              href: `/event/${event.id}`,
            });
          });
        }

        setResults(combinedResults);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }

    searchCombined();
  }, [debouncedQuery]);

  return (
    <div className="min-h-screen p-4 pt-8 md:p-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-outfit text-white mb-2">
          Discover
        </h1>
        <p className="text-zinc-400">Search for artists, tours, and festivals.</p>
      </header>

      {/* Search Bar */}
      <div className="relative mb-8 group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-zinc-500 group-focus-within:text-neon-cyan transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bands, artists, or specific concerts..."
          className="w-full h-14 pl-12 pr-4 bg-zinc-900/50 border border-zinc-700/50 rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 glass transition-all"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <div className="w-5 h-5 border-2 border-zinc-500 border-t-neon-cyan rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.length > 0 ? (
          <div className="flex flex-col gap-3">
            {results.map((result) => (
              <Link key={`${result.type}-${result.id}`} href={result.href}>
                <Card className="hover:border-neon-cyan/30 group transition-all">
                  <CardContent className="p-3 flex items-center gap-4">
                    {/* Image Thumbnail */}
                    <div
                      className={`h-16 w-16 bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center ${
                        result.type === "artist" ? "rounded-full" : "rounded-xl"
                      }`}
                    >
                      {result.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={result.imageUrl}
                          alt={result.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="text-zinc-500" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">
                        {result.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-zinc-400">
                        {result.type === "artist" ? (
                          <UserIcon className="w-3.5 h-3.5" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5" />
                        )}
                        <span className="truncate">{result.subtitle}</span>
                      </div>
                    </div>

                    {/* Arrow action */}
                    <div className="pr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight className="text-neon-cyan w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          query.length >= 2 &&
          !isLoading && (
            <div className="text-center py-12 text-zinc-500">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No results found for &quot;{query}&quot;</p>
            </div>
          )
        )}

        {query.length === 0 && (
          <div className="text-center py-12">
            <h3 className="font-outfit text-xl text-zinc-300 mb-2">
              Trending Now
            </h3>
            <p className="text-sm text-zinc-500">
              Start typing to search the global event catalog.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper icon component since 'User' was conflicting with imported type somewhere else
function UserIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
