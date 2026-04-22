"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Search, Calendar, MapPin } from "lucide-react";
import { addBestGig } from "@/app/profile/[username]/actions";
import { useRouter } from "next/navigation";

export interface LogWithEvent {
  id: string;
  event_id: string;
  rating: number | null;
  created_at: string;
  events: {
    id: string;
    title: string;
    date: string;
    image_url: string | null;
    is_festival: boolean;
    venues: {
      name: string;
      city: string;
      country: string;
    } | null;
  } | null;
}

interface BestGigsModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: number;
  logs: LogWithEvent[];
  existingEventIds: string[];
}

export function BestGigsModal({
  isOpen,
  onClose,
  position,
  logs,
  existingEventIds,
}: BestGigsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) setSearchQuery("");
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter logs that haven't already been selected as best gigs (except the current position slot)
  const availableLogs = logs.filter((log) => {
    if (!log.events) return false;
    // Allow events that aren't already best gigs
    return !existingEventIds.includes(log.event_id);
  });

  // Apply search filter
  const filteredLogs = availableLogs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const event = log.events!;
    const titleMatch = event.title.toLowerCase().includes(q);
    const venueMatch = event.venues?.name.toLowerCase().includes(q) || false;
    const cityMatch = event.venues?.city.toLowerCase().includes(q) || false;
    return titleMatch || venueMatch || cityMatch;
  });

  const handleSelect = (eventId: string) => {
    startTransition(async () => {
      const result = await addBestGig(eventId, position);
      if (result?.error) {
        console.error("Failed to add best gig:", result.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold font-outfit text-white tracking-tight">
              Pick a <span className="text-neon-fuchsia">Best Gig</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Choose from your attended gigs
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-zinc-800/50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search by event, venue, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {isPending && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-neon-fuchsia border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isPending && filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-zinc-500 text-sm">
                {searchQuery
                  ? "No matching gigs found."
                  : "No attended gigs available."}
              </p>
            </div>
          )}

          {!isPending &&
            filteredLogs.map((log) => {
              const event = log.events!;
              return (
                <button
                  key={log.id}
                  onClick={() => handleSelect(event.id)}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-900/80 transition-all group text-left disabled:opacity-50"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-16 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-700/50 group-hover:border-zinc-600 transition-colors">
                    {event.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[8px] text-zinc-600 font-bold text-center px-1 leading-tight">
                          {event.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate transition-colors">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Calendar size={10} />
                        {new Date(event.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {event.venues && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500 truncate">
                          <MapPin size={10} />
                          {event.venues.name}, {event.venues.city}
                        </span>
                      )}
                    </div>
                    {event.is_festival && (
                      <span className="inline-block mt-1 text-[9px] font-bold text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Festival
                      </span>
                    )}
                  </div>

                  {/* Rating if exists */}
                  {log.rating && (
                    <span className="text-xs text-neon-cyan font-bold flex-shrink-0">
                      ★ {log.rating}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
