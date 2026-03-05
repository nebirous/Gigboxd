import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "../login/actions";
import { User } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (!data) {
    redirect("/login");
  }

  const userId = data.claims.sub;

  // Fetch the public profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Fetch followers count (people who follow this user)
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  // Fetch following count (people this user follows)
  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);

  // Fetch the user's logs (Diary entries)
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
    .eq("user_id", userId)
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* Navbar skeleton */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-md sticky top-0">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-bold text-white font-outfit">Gigboxd</h1>
          <form action={logout}>
            <button className="text-sm font-medium text-zinc-400 hover:text-white">
              Log out
            </button>
          </form>
        </div>
      </nav>

      {/* Profile Header */}
      <main className="mx-auto max-w-4xl p-4 pt-8">
        <div className="flex items-center gap-6 pb-8 border-b border-zinc-900">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-full w-full rounded-full object-cover border-2 border-fuchsia-500"
              />
            ) : (
              <User size={40} />
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white font-outfit">
              {profile?.full_name || profile?.username || "User"}
            </h2>
            <p className="text-zinc-400">@{profile?.username || "user"}</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4 py-8 md:grid-cols-5">
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
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
            <span className="block text-2xl font-bold text-white">{followersCount ?? 0}</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Followers</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
            <span className="block text-2xl font-bold text-white">{followingCount ?? 0}</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Following</span>
          </div>
        </div>

        {/* Diary Feed */}
        <div className="mt-8 border-t border-zinc-900 pt-8">
          <h3 className="text-xl font-bold text-white font-outfit mb-6">Recent Diary Entries</h3>
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
