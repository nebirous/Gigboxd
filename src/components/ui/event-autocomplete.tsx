"use client";

import { useState, useEffect, useRef } from "react";
import { searchEvents } from "@/app/actions/search-events";
import { Music, Calendar as CalendarIcon } from "lucide-react";

export interface EventMatch {
  id: string;
  title: string;
  date: string;
  image_url: string | null;
  venues: {
    id: string;
    name: string;
    city: string;
    country: string;
  };
  event_artists: {
    is_headliner: boolean;
    artists: {
      id: string;
      name: string;
    }
  }[];
}

interface EventAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (event: EventMatch) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function EventAutocomplete({ value, onChange, onSelect, placeholder, className, disabled }: EventAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<EventMatch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2 && isOpen && !disabled) {
        setIsLoading(true);
        const data = await searchEvents(query);
        setResults(data as any);
        setIsLoading(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isOpen, disabled]);

  const handleSelect = (eventMatch: EventMatch) => {
    setQuery(eventMatch.title);
    onChange(eventMatch.title);
    setIsOpen(false);
    onSelect(eventMatch);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 z-10 text-xl overflow-visible">
        <Music size={16} />
      </div>
      <input
        type="text"
        required
        placeholder={placeholder}
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2 && !disabled) setIsOpen(true);
        }}
        className={className}
      />

      {isOpen && (results.length > 0 || isLoading) && !disabled && (
        <ul className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden custom-scrollbar max-h-60">
          {isLoading ? (
            <li className="px-4 py-3 text-xs text-zinc-500 text-center">Searching...</li>
          ) : (
            results.map((eventMatch) => (
              <li
                key={eventMatch.id}
                onClick={() => handleSelect(eventMatch)}
                className="flex flex-col gap-0.5 px-3 py-2 cursor-pointer hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-zinc-200 font-medium truncate">{eventMatch.title}</span>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 shrink-0">
                    <CalendarIcon size={10} />
                    {eventMatch.date}
                  </div>
                </div>
                <span className="text-xs text-zinc-500 truncate">
                  {eventMatch.venues?.name} • {eventMatch.venues?.city}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
