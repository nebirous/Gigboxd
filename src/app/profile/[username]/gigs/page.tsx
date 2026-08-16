import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Rating } from "@/components/ui/rating";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { DiaryFilters } from "@/components/profile/diary-filters";

interface GigsPageProps {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{
    page?: string;
    type?: string;
    search?: string;
    reviewed?: string;
    status?: string;
  }>;
}

export default async function GigsHistoryPage({ params, searchParams }: GigsPageProps) {
  const { username } = await params;
  const {
    page = "1",
    type = "all",
    search = "",
    reviewed = "all",
    status = "Attended"
  } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data) {
    redirect("/login");
  }

  // Fetch the target profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const currentPage = parseInt(page, 10);
  const limit = 50;
  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("logs")
    .select(
      `
      *,
      events!inner (
        id,
        title,
        date,
        image_url,
        is_festival
      )
    `,
      { count: "exact" }
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (type === "gig") {
    query = query.eq("events.is_festival", false);
  } else if (type === "festival") {
    query = query.eq("events.is_festival", true);
  }

  if (reviewed === "true") {
    query = query.not("review_text", "is", null);
  } else if (reviewed === "false") {
    query = query.is("review_text", null);
  }

  if (search) {
    // Basic search on event title
    query = query.ilike("events.title", `%${search}%`);
  }

  const { data: logs, count, error } = await query.range(from, to);

  if (error) {
    console.error("Error fetching logs:", error);
  }

  const totalPages = count ? Math.ceil(count / limit) : 1;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 pb-12">
      <main className="mx-auto max-w-4xl p-4 pt-10">
        <ProfileHeader username={username} currentPath={`/profile/${username}/gigs`} />

        <DiaryFilters
          initialSearch={search}
          initialType={type}
          initialReviewed={reviewed}
          initialStatus={status}
        />

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            We couldn’t load this diary. Refresh the page to try again.
          </div>
        )}

        {/* Results */}
        <div className="mb-4 text-sm text-zinc-400">
          Found <span className="text-white font-bold">{count || 0}</span> events.
        </div>

        {logs && logs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {logs.map((log: any) => {
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

                      {/* Optional Status indicator if not 'Attended' */}
                      {log.status === "Going" && (
                        <div className="absolute top-1 right-1 bg-neon-cyan text-zinc-900 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                          Going
                        </div>
                      )}
                    </div>
                  </Link>
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
          <div className="text-center py-20 bg-zinc-900/20 rounded-xl border border-zinc-800/50">
            <p className="text-zinc-500 text-lg">No events found matching your criteria.</p>
            <Link href={`/profile/${username}/gigs`} className="mt-3 inline-block text-sm font-medium text-neon-cyan hover:text-white">
              Clear filters
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            {currentPage > 1 ? (
              <Link
                href={`/profile/${username}/gigs?page=${currentPage - 1}&type=${type}&search=${search}&reviewed=${reviewed}&status=${status}`}
                className="flex items-center gap-1 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} /> Previous
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-sm font-bold text-zinc-700 cursor-not-allowed">
                <ChevronLeft size={16} /> Previous
              </span>
            )}

            <span className="text-sm font-medium text-zinc-500">
              Page <span className="text-white">{currentPage}</span> of {totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link
                href={`/profile/${username}/gigs?page=${currentPage + 1}&type=${type}&search=${search}&reviewed=${reviewed}&status=${status}`}
                className="flex items-center gap-1 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Next <ChevronRight size={16} />
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-sm font-bold text-zinc-700 cursor-not-allowed">
                Next <ChevronRight size={16} />
              </span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
