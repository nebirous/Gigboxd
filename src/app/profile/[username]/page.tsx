import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { User } from "lucide-react";
import { toggleFollow } from "./actions";

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
      <nav className="border-b border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-md sticky top-0">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <a href="/profile" className="text-xl font-bold text-white font-outfit">Gigboxd</a>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl p-4 pt-8">
        <div className="flex items-center justify-between pb-8 border-b border-zinc-900">
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 text-zinc-500 overflow-hidden border-2 border-fuchsia-500">
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
            <div>
              <h2 className="text-3xl font-bold text-white font-outfit">
                {profile.full_name || profile.username}
              </h2>
              <p className="text-zinc-400">@{profile.username}</p>
            </div>
          </div>

          {!isOwnProfile && (
            <form action={handleFollowToggle}>
              <button
                type="submit"
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isFollowing
                    ? "border border-zinc-700 bg-transparent text-white hover:bg-zinc-800"
                    : "bg-white text-zinc-950 hover:bg-zinc-200"
                }`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            </form>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 py-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
            <span className="block text-2xl font-bold text-white">{concertsCount}</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Concerts</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
            <span className="block text-2xl font-bold text-white">0</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Bands</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
            <span className="block text-2xl font-bold text-white">{festivalsCount}</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Festivals</span>
          </div>
        </div>

        {/* Diary Feed */}
        <div className="mt-4 border-t border-zinc-900 pt-8">
          <h3 className="text-xl font-bold text-white font-outfit mb-6">Diary</h3>
          {logs && logs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logs.map((log: any) => {
                const event = log.events;
                if (!event) return null;
                const location = event.venues?.city ? `${event.venues.name}, ${event.venues.city}` : event.venues?.name || "Unknown Venue";

                return (
                  <div key={log.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col gap-3 transition-colors hover:border-neon-cyan/50">
                    <div className="flex gap-4 items-start">
                      {event.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.image_url} alt={event.title} className="w-16 h-16 rounded-lg object-cover bg-zinc-800 shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-zinc-800 shrink-0" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-white truncate font-outfit">{event.title}</h4>
                          {log.rating && (
                            <span className="text-xs font-bold text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-full shrink-0">
                              ★ {log.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 truncate mb-1">{location}</p>
                        <p className="text-[10px] text-zinc-600 uppercase font-medium">Logged on {new Date(log.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {log.review_text && (
                      <p className="text-sm text-zinc-300 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 mt-1 italic">
                        &quot;{log.review_text}&quot;
                      </p>
                    )}
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
