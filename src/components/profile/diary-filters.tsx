"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";

interface DiaryFiltersProps {
  initialSearch: string;
  initialType: string;
  initialReviewed: string;
  initialStatus: string;
}

export function DiaryFilters({
  initialSearch,
  initialType,
  initialReviewed,
  initialStatus,
}: DiaryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    // When the debounced search changes, update the URL
    if (debouncedSearch !== initialSearch) {
      updateUrl("search", debouncedSearch);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const updateUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all" && value !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset page to 1 when filters change
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search event title..."
          className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
        />
      </div>

      <select
        value={initialType}
        onChange={(e) => updateUrl("type", e.target.value)}
        className="bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all w-full sm:w-auto"
      >
        <option value="all">All Events</option>
        <option value="gig">Concerts Only</option>
        <option value="festival">Festivals Only</option>
      </select>

      <select
        value={initialStatus}
        onChange={(e) => updateUrl("status", e.target.value)}
        className="bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all w-full sm:w-auto"
      >
        <option value="all">All Statuses</option>
        <option value="Attended">Attended</option>
        <option value="Going">Going</option>
      </select>

      <select
        value={initialReviewed}
        onChange={(e) => updateUrl("reviewed", e.target.value)}
        className="bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all w-full sm:w-auto"
      >
        <option value="all">Any Review Status</option>
        <option value="true">Reviewed</option>
        <option value="false">Not Reviewed</option>
      </select>
    </div>
  );
}
