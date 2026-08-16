import { createClient } from "@/utils/supabase/server";
import { User } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { toggleFollow } from "@/app/profile/[username]/actions";

interface ProfileHeaderProps {
  userId?: string;
  username?: string;
  currentPath: string; // e.g. "/profile", "/profile/username", "/profile/username/gigs"
}

export async function ProfileHeader({ userId, username, currentPath }: ProfileHeaderProps) {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getClaims();
  const currentUserId = sessionData?.claims?.sub;

  let profile;
  if (userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    profile = data;
  } else if (username) {
    const { data } = await supabase.from("profiles").select("*").eq("username", username).single();
    profile = data;
  }

  if (!profile) {
    return null; // Or some fallback
  }

  const isOwnProfile = currentUserId === profile.id;

  // Check follow status
  let isFollowing = false;
  if (!isOwnProfile && currentUserId) {
    const { data: followRecord } = await supabase
      .from("follows")
      .select("*")
      .match({ follower_id: currentUserId, following_id: profile.id })
      .single();

    isFollowing = !!followRecord;
  }

  // Fetch followers/following counts
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  // Fetch logs for stats (only attended)
  const { data: logs } = await supabase
    .from("logs")
    .select(
      `
      *,
      events (
        *,
        event_artists (
          artist_id
        )
      )
    `
    )
    .eq("user_id", profile.id)
    .eq("status", "Attended");

  let concertsCount = 0;
  let festivalsCount = 0;
  const uniqueArtistIds = new Set<string>();

  if (logs) {
    logs.forEach((log: any) => {
      concertsCount++;
      if (log.events?.is_festival) {
        festivalsCount++;
      }
      if (log.events?.event_artists) {
        log.events.event_artists.forEach((ea: any) => {
          if (ea.artist_id) uniqueArtistIds.add(ea.artist_id);
        });
      }
    });
  }

  const bandsCount = uniqueArtistIds.size;
  const handleFollowToggle = toggleFollow.bind(null, profile.id, isFollowing);

  const isDiaryActive = currentPath.endsWith("/gigs");
  const isProfileActive = !isDiaryActive; // Simplified for now

  return (
    <>
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-6">
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 text-zinc-500 overflow-hidden border border-zinc-700 shrink-0">
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
              {!isOwnProfile ? (
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
              ) : (
                <form action={logout}>
                  <button className="text-[10px] uppercase font-bold text-zinc-400 hover:text-white border border-zinc-700 rounded px-2 py-0.5">
                    Edit Profile / Logout
                  </button>
                </form>
              )}
              <span className="text-xs text-zinc-400">@{profile.username}</span>
            </div>
          </div>
        </div>

        {/* Stats aligned to the right (Letterboxd style) */}
        <div className="flex items-center gap-4 sm:gap-6 md:gap-8 pb-1 flex-wrap justify-center sm:justify-end">
          <div className="text-center">
            <span className="block text-xl font-bold text-white leading-none mb-1">{concertsCount}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Concerts</span>
          </div>
          <div className="text-center">
            <span className="block text-xl font-bold text-white leading-none mb-1">{bandsCount}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Bands</span>
          </div>
          <div className="text-center">
            <span className="block text-xl font-bold text-white leading-none mb-1">{festivalsCount}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Festivals</span>
          </div>
          <div className="text-center hidden sm:block">
            <span className="block text-xl font-bold text-white leading-none mb-1">{followersCount ?? 0}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Followers</span>
          </div>
          <div className="text-center hidden sm:block">
            <span className="block text-xl font-bold text-white leading-none mb-1">{followingCount ?? 0}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Following</span>
          </div>
        </div>
      </div>

      {/* Profile Subnav */}
      <div className="flex items-center justify-center md:justify-start gap-6 border-b border-zinc-800 pb-[10px] mb-8">
        <Link
          href={isOwnProfile ? "/profile" : `/profile/${profile.username}`}
          className={`text-xs font-bold uppercase tracking-wider pb-2 block ${isProfileActive ? "text-white border-b-2 border-neon-cyan -mb-[12px]" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          Profile
        </Link>
        <button className="text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider pb-2">Activity</button>
        <Link
          href={`/profile/${profile.username}/gigs`}
          className={`text-xs font-bold uppercase tracking-wider pb-2 block ${isDiaryActive ? "text-white border-b-2 border-neon-cyan -mb-[12px]" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          Diary
        </Link>
        <button className="text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider pb-2">Network</button>
      </div>
    </>
  );
}
