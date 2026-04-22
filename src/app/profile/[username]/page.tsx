import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { User } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { toggleFollow } from "./actions";
import { BestGigsSection } from "@/components/profile/best-gigs-section";

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

  const isOwnProfile = currentUserId === profile.id;

  // Check follow status
  let isFollowing = false;
  if (!isOwnProfile) {
    const { data: followRecord } = await supabase
      .from("follows")
      .select("*")
      .match({ follower_id: currentUserId, following_id: profile.id })
      .single();

    isFollowing = !!followRecord;
  }

  // Fetch the target user's logs (Diary entries)
  const { data: logs } = await supabase
    .from("logs")
    .select(
      `
      *,
      events (
        *,
        venues (*)
      )
    `
    )
    .eq("user_id", profile.id)
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

  // Calculate live stats from logs
  let concertsCount = 0;
  let festivalsCount = 0;
  
  if (logs) {
    logs.forEach((log: any) => {
      concertsCount++;
      if (log.events?.is_festival) {
        festivalsCount++;
      }
    });
  }

  // Toggle function via form action
  const handleFollowToggle = toggleFollow.bind(null, profile.id, isFollowing);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <main className="mx-auto max-w-4xl p-4 pt-10">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-6">
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 text-zinc-500 overflow-hidden border border-zinc-700">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={40} />
              )}
            </div>
            <div className="flex flex-col pb-1">
              <h2 className="text-2xl font-bold text-white font-outfit">
                {profile.full_name || profile.username}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {!isOwnProfile && (
                  <form action={handleFollowToggle}>
                    <button
                      type="submit"
                      className={`text-[10px] uppercase font-bold border rounded px-2 py-0.5 transition-colors ${
                        isFollowing
                          ? "border-zinc-700 text-zinc-400 hover:text-white"
                          : "border-neon-cyan text-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan/20"
                      }`}
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </button>
                  </form>
                )}
                <span className="text-xs text-zinc-400">@{profile.username}</span>
              </div>
            </div>
          </div>

          {/* Stats aligned to the right */}
          <div className="flex items-center gap-6 md:gap-8 pb-1">
            <div className="text-center">
              <span className="block text-xl font-bold text-white leading-none mb-1">{concertsCount}</span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Concerts</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-white leading-none mb-1">0</span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Bands</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-white leading-none mb-1">{festivalsCount}</span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Festivals</span>
            </div>
          </div>
        </div>

        {/* Profile Subnav */}
        <div className="flex items-center justify-center md:justify-start gap-6 border-b border-zinc-800 pb-[10px] mb-8">
          <button className="text-xs font-bold text-white uppercase tracking-wider border-b-2 border-neon-cyan pb-2 -mb-[12px]">Profile</button>
          <button className="text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider pb-2">Activity</button>
          <button className="text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider pb-2">Diary</button>
          <button className="text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider pb-2">Network</button>
        </div>

        {/* Best Gigs */}
        <BestGigsSection
          bestGigs={bestGigs || []}
          logs={logs || []}
          isOwnProfile={isOwnProfile}
        />

        {/* Latest Gigs */}
        <div className="mt-2">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Latest Gigs</h3>
            <span className="text-xs text-zinc-500 hover:text-white cursor-pointer uppercase tracking-wider">All</span>
          </div>
          {logs && logs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {logs.map((log: any) => {
                const event = log.events;
                if (!event) return null;

                return (
                  <div key={log.id} className="flex flex-col gap-1.5">
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
            <span className="text-xs text-zinc-500 hover:text-white cursor-pointer uppercase tracking-wider">All</span>
          </div>
          {logs && logs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {logs.filter((log: any) => log.events?.is_festival).map((log: any) => {
                const event = log.events;
                if (!event) return null;

                return (
                  <div key={log.id} className="flex flex-col gap-1.5">
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

