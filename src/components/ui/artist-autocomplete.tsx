"use client";

import { useState, useEffect, useRef } from "react";
import { searchArtists } from "@/app/actions/search-artists";
import { User } from "lucide-react";

interface Artist {
  id: string;
  name: string;
  image_url: string | null;
}

interface ArtistAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ArtistAutocomplete({ value, onChange, placeholder, className }: ArtistAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Artist[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal query state with external value if it changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2 && isOpen) {
        setIsLoading(true);
        const data = await searchArtists(query);
        setResults(data);
        setIsLoading(false);
      } else {
        setResults([]);
      }
    }, 300); // 300ms debounce

    // Sync upward so the parent always has the latest typed name, even if not selected
    onChange(query);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSelect = (artistName: string) => {
    setQuery(artistName);
    onChange(artistName);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <input
        type="text"
        required
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) setIsOpen(true);
        }}
        className={className}
      />

      {isOpen && (results.length > 0 || isLoading) && (
        <ul className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden custom-scrollbar max-h-60">
          {isLoading ? (
            <li className="px-4 py-3 text-xs text-zinc-500 text-center">Searching...</li>
          ) : (
            results.map((artist) => (
              <li
                key={artist.id}
                onClick={() => handleSelect(artist.name)}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                  {artist.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className="text-zinc-500" />
                  )}
                </div>
                <span className="text-sm text-zinc-200 font-medium truncate">{artist.name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
