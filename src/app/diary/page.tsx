import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function DiaryPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect("/login?next=/diary");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", data.claims.sub)
    .single();

  if (!profile?.username) {
    redirect("/profile");
  }

  redirect(`/profile/${profile.username}/gigs`);
}
