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

        {/* Placeholder Stats */}
        <div className="py-8">
          <p className="text-zinc-500 italic">User stats and latest reviews will appear here.</p>
        </div>
      </main>
    </div>
  );
}
