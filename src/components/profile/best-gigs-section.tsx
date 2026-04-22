"use client";

import { useState, useTransition } from "react";
import { Plus, X, Pencil } from "lucide-react";
import { BestGigsModal, type LogWithEvent } from "./best-gigs-modal";
import { removeBestGig } from "@/app/profile/[username]/actions";
import { useRouter } from "next/navigation";

export interface BestGigEntry {
  id: string;
  event_id: string;
  position: number;
  events: {
    id: string;
    title: string;
    date: string;
    image_url: string | null;
    is_festival: boolean;
  } | null;
}

interface BestGigsSectionProps {
  bestGigs: BestGigEntry[];
  logs: LogWithEvent[];
  isOwnProfile: boolean;
}

export function BestGigsSection({
  bestGigs,
  logs,
  isOwnProfile,
}: BestGigsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [modalPosition, setModalPosition] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Build a map of position -> bestGig for quick lookup
  const gigsByPosition: Record<number, BestGigEntry> = {};
  bestGigs.forEach((bg) => {
    gigsByPosition[bg.position] = bg;
  });

  // Collect event IDs already used as best gigs
  const existingEventIds = bestGigs.map((bg) => bg.event_id);

  const handleOpenModal = (position: number) => {
    setModalPosition(position);
  };

  const handleRemove = (bestGigId: string) => {
    startTransition(async () => {
      await removeBestGig(bestGigId);
      router.refresh();
    });
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          Best Gigs
        </h3>
        <div className="flex items-center gap-3">
          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1 text-xs uppercase tracking-wider font-bold transition-colors ${
                isEditing
                  ? "text-neon-cyan"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              <Pencil size={11} />
              {isEditing ? "Done" : "Edit"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => {
          const bestGig = gigsByPosition[i];

          if (bestGig && bestGig.events) {
            // Populated slot
            return (
              <div key={i} className="relative group">
                <div className="rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-500 transition-colors cursor-pointer aspect-[2/3]">
                  {bestGig.events.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bestGig.events.image_url}
                      alt={bestGig.events.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 text-center bg-zinc-800">
                      <span className="text-[10px] text-zinc-500 font-bold leading-tight">
                        {bestGig.events.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Delete button - shown in edit mode */}
                {isEditing && isOwnProfile && (
                  <button
                    onClick={() => handleRemove(bestGig.id)}
                    disabled={isPending}
                    className="absolute -top-1.5 -right-1.5 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-400 transition-all hover:scale-110 disabled:opacity-50"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                )}
              </div>
            );
          }

          // Empty slot - show + button only if own profile
          if (isOwnProfile) {
            return (
              <div
                key={i}
                onClick={() => handleOpenModal(i)}
                className="relative group rounded-md overflow-hidden bg-zinc-900/40 border border-zinc-800 border-dashed hover:border-zinc-500 transition-colors cursor-pointer aspect-[2/3] flex items-center justify-center"
              >
                <div className="w-8 h-8 rounded-full bg-neon-fuchsia text-white flex items-center justify-center glow-fuchsia group-hover:scale-110 transition-transform">
                  <Plus size={16} strokeWidth={3} />
                </div>
              </div>
            );
          }

          // Not own profile, empty slot - show empty placeholder
          return (
            <div
              key={i}
              className="rounded-md overflow-hidden bg-zinc-900/20 border border-zinc-800/50 aspect-[2/3]"
            />
          );
        })}
      </div>

      {/* Best Gigs Modal */}
      {modalPosition !== null && (
        <BestGigsModal
          isOpen={true}
          onClose={() => setModalPosition(null)}
          position={modalPosition}
          logs={logs}
          existingEventIds={existingEventIds}
        />
      )}
    </div>
  );
}
