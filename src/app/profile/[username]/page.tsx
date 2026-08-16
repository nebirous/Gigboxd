import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Rating } from "@/components/ui/rating";
import { BestGigsSection } from "@/components/profile/best-gigs-section";
import Link from "next/link";
import { ProfileHeader } from "@/components/profile/profile-header";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Get current session using getClaims() for secure JWT validation
  const { data } = await supabase.auth.getClaims();

  if (!data) {
    redirect("/login");
  }

  const currentUserId = data.claims.sub;

  // Fetch the target profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch the target user's logs (Diary entries)
  const { data: logs } = await supabase
    .from("logs")
    .select(
      `
      *,
      events (
        *,
        venues (*),
        event_artists (
          artist_id,
          is_headliner,
          artists ( id, name )
        )
      )
    `
    )
    .eq("user_id", profile.id)
    .eq("status", "Attended")
    .order("created_at", { ascending: false });

  // Fetch the target user's best gigs
  const { data: bestGigs } = await supabase
    .from("best_gigs")
    .select(
      `
      *,
      events (
        id,
        title,
        date,
        image_url,
        is_festival
      )
    `
    )
    .eq("user_id", profile.id)
    .order("position", { ascending: true });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <main className="mx-auto max-w-4xl p-4 pt-10">
        <ProfileHeader username={username} currentPath={`/profile/${username}`} />

        {/* Best Gigs */}
        <BestGigsSection
          bestGigs={bestGigs || []}
          logs={logs || []}
          isOwnProfile={currentUserId === profile.id}
        />

        {/* Latest Gigs */}
        <div className="mt-2">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Latest Gigs</h3>
            <Link href={`/profile/${profile.username}/gigs?type=gig`} className="text-xs text-zinc-500 hover:text-white uppercase tracking-wider">All</Link>
          </div>
          {logs && logs.filter((log: any) => !log.events?.is_festival).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {logs.filter((log: any) => !log.events?.is_festival).slice(0, 4).map((log: any) => {
                const event = log.events;
                if (!event) return null;

                return (
                  <div key={log.id} className="flex flex-col gap-1.5">
                    <Link href={`/event/${event.id}`} className="block">
                      <div className="relative group rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-500 transition-colors cursor-pointer aspect-[2/3]">
                        {event.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4 text-center bg-zinc-800">
                            <span className="text-xs text-zinc-500 font-bold">{event.title}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    {/* Rating buttons below the poster */}
                    <div className="flex items-center h-4">
                      {log.rating > 0 && (
                        <Rating value={log.rating} readonly size={12} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-zinc-900/20 rounded-xl border border-zinc-800/50">
              <p className="text-zinc-500">No concerts logged yet.</p>
            </div>
          )}
        </div>
        {/* Festivals */}
        <div className="mt-2">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Festivals</h3>
            <Link href={`/profile/${profile.username}/gigs?type=festival`} className="text-xs text-zinc-500 hover:text-white uppercase tracking-wider">All</Link>
          </div>
          {logs && logs.filter((log: any) => log.events?.is_festival).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {logs.filter((log: any) => log.events?.is_festival).slice(0, 4).map((log: any) => {
                const event = log.events;
                if (!event) return null;

                return (
                  <div key={log.id} className="flex flex-col gap-1.5">
                    <Link href={`/event/${event.id}`} className="block">
                      <div className="relative group rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-500 transition-colors cursor-pointer aspect-[2/3]">
                        {event.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4 text-center bg-zinc-800">
                            <span className="text-xs text-zinc-500 font-bold">{event.title}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    {/* Rating buttons below the poster */}
                    <div className="flex items-center h-4">
                      {log.rating > 0 && (
                        <Rating value={log.rating} readonly size={12} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-zinc-900/20 rounded-xl border border-zinc-800/50">
              <p className="text-zinc-500">No concerts logged yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

