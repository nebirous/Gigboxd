"use client";

import { useState, useEffect, useRef } from "react";
import { searchVenues } from "@/app/actions/search-venues";
import { MapPin } from "lucide-react";

interface Venue {
  id: string;
  name: string;
  city: string;
  country: string;
}

interface VenueAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (venue: Venue) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function VenueAutocomplete({ value, onChange, onSelect, placeholder, className, disabled }: VenueAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Venue[]>([]);
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
        const data = await searchVenues(query);
        setResults(data);
        setIsLoading(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isOpen, disabled]);

  const handleSelect = (venue: Venue) => {
    setQuery(venue.name);
    onChange(venue.name);
    setIsOpen(false);
    onSelect(venue);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
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
            results.map((venue) => (
              <li
                key={venue.id}
                onClick={() => handleSelect(venue)}
                className="flex flex-col gap-0.5 px-3 py-2 cursor-pointer hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-zinc-500 shrink-0" />
                  <span className="text-sm text-zinc-200 font-medium truncate">{venue.name}</span>
                </div>
                <span className="text-xs text-zinc-500 pl-5 truncate">{venue.city}, {venue.country}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
