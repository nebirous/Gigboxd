"use client";

import { useState, Suspense } from "react";
import { Rating } from "@/components/ui/rating";
import { Button } from "@/components/ui/button";
import { createLogEntry } from "./actions";
import { Calendar, CheckCircle2, MapPin } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LogForm() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  
  const [rating, setRating] = useState<number>(0);
  const [status, setStatus] = useState<"Attended" | "Going">("Attended");

  if (!eventId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold font-outfit text-white mb-2">
          No Event Selected
        </h1>
        <p className="text-zinc-500 mb-6">
          Please select an event from the discover page first.
        </p>
        <Link href="/discover">
          <Button variant="outline">Search Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 pt-12 text-zinc-200">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-outfit text-white mb-2">
            Log Show
          </h1>
          <p className="text-zinc-400">
            Record your rating and write a review.
          </p>
        </div>

        <form action={createLogEntry} className="space-y-8 glass p-6 md:p-8 rounded-2xl border border-zinc-800/50 relative overflow-hidden">
          {/* subtle background glow */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-neon-fuchsia/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Hidden inputs to pass state to server action */}
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="rating" value={rating || ""} />
          <input type="hidden" name="status" value={status} />

          {/* Status Toggle */}
          <div className="space-y-3 relative z-10">
            <label className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              I am...
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStatus("Attended")}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                  status === "Attended"
                    ? "bg-zinc-800 text-white border-2 border-neon-cyan glow-cyan"
                    : "bg-zinc-900 border-2 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <CheckCircle2 size={18} className={status === "Attended" ? "text-neon-cyan" : ""} />
                Attended
              </button>
              <button
                type="button"
                onClick={() => setStatus("Going")}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                  status === "Going"
                    ? "bg-zinc-800 text-white border-2 border-neon-fuchsia glow-fuchsia"
                    : "bg-zinc-900 border-2 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <Calendar size={18} className={status === "Going" ? "text-neon-fuchsia" : ""} />
                Going
              </button>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3 relative z-10">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                My Rating
              </label>
              {rating > 0 && (
                <span className="text-lg font-bold font-outfit text-white">
                  {rating.toFixed(1)} / 5.0
                </span>
              )}
            </div>
            <div className="flex justify-center p-6 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
              <Rating value={rating} onChange={setRating} size={48} />
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-3 relative z-10">
            <label className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Review (Optional)
            </label>
            <textarea
              name="reviewText"
              rows={5}
              placeholder="How was the show? What was the highlight? Sound quality? Setlist?"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 resize-y transition-colors"
            />
          </div>

          <div className="pt-4 relative z-10">
            <Button variant="neon" type="submit" size="lg" className="w-full">
              Save Log Entry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LogNewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-neon-cyan">Loading...</div>}>
      <LogForm />
    </Suspense>
  );
}
