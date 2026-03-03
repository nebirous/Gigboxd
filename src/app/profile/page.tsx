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

        {/* Stats Section (Mocked for now) */}
        <div className="grid grid-cols-2 gap-4 py-8 md:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
            <span className="block text-2xl font-bold text-white">0</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Concerts</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
            <span className="block text-2xl font-bold text-white">0</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Bands</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
            <span className="block text-2xl font-bold text-white">0</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Festivals</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
            <span className="block text-2xl font-bold text-white">0</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Followers</span>
          </div>
        </div>
      </main>
    </div>
  );
}
