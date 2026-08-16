"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Calendar, MapPin, Music, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Rating } from "./ui/rating";
import { ArtistAutocomplete } from "./ui/artist-autocomplete";
import { EventAutocomplete, type EventMatch } from "./ui/event-autocomplete";
import { VenueAutocomplete } from "./ui/venue-autocomplete";
import { logGig } from "@/app/actions/log-gig";
import { useRouter } from "next/navigation";

interface LogGigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogGigModal({ isOpen, onClose }: LogGigModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venueCountry, setVenueCountry] = useState("");
  const [bands, setBands] = useState<{ name: string; isHeadliner: boolean }[]>([
    { name: "", isHeadliner: true }
  ]);
  const [isLockedEvent, setIsLockedEvent] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [status, setStatus] = useState("Attended");
  const router = useRouter();

  const addBand = () => {
    if (bands.length < 5) {
      setBands([...bands, { name: "", isHeadliner: false }]);
    }
  };

  const removeBand = (index: number) => {
    setBands(bands.filter((_, i) => i !== index));
  };

  const updateBand = (index: number, field: "name" | "isHeadliner", value: string | boolean) => {
    const newBands = [...bands];
    newBands[index] = { ...newBands[index], [field]: value };
    setBands(newBands);
  };

  const handleEventSelect = (event: EventMatch) => {
    setTitle(event.title);
    setDate(event.date);
    if (event.image_url) setImageUrl(event.image_url);
    if (event.venues) {
      setVenueName(event.venues.name);
      setVenueCity(event.venues.city);
      setVenueCountry(event.venues.country);
    }
    if (event.event_artists && event.event_artists.length > 0) {
      setBands(event.event_artists.map(ea => ({
        name: ea.artists.name,
        isHeadliner: ea.is_headliner
      })));
    }
    setIsLockedEvent(true);
  };

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    setError(null);

    const requiredFields = [
      ["title", "an event name"],
      ["date", "a date"],
      ["venueName", "a venue"],
      ["venueCity", "a city"],
      ["venueCountry", "a country"],
    ] as const;
    const missingField = requiredFields.find(([field]) => !String(formData.get(field) || "").trim());

    if (missingField) {
      setError(`Please add ${missingField[1]} before saving.`);
      return;
    }

    startTransition(async () => {
      const result = await logGig(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setTitle("");
        setDate("");
        setVenueName("");
        setVenueCity("");
        setVenueCountry("");
        setBands([{ name: "", isHeadliner: true }]);
        setImageUrl("");
        setIsLockedEvent(false);
        setRating(0);
        setStatus("Attended");
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-zinc-400 hover:text-white hover:bg-black/80 transition-all"
        >
          <X size={18} />
        </button>

        {/* LEFT COLUMN: Form Fields */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full md:w-1/2 flex flex-col max-h-[50vh] md:max-h-none custom-scrollbar">
          <div className="mb-6">
            <h2 className="text-2xl font-bold font-outfit text-white tracking-tight">
              Log a <span className="text-neon-fuchsia">Gig</span>
            </h2>
            <p className="text-sm text-zinc-400 mt-1">Add a concert or festival to your diary.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form action={handleSubmit} noValidate className="space-y-4 flex flex-col flex-1">
            <div className="space-y-4 flex-1">
              {/* Hidden Inputs for Form Submission */}
              <input type="hidden" name="title" value={title} />
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="venueName" value={venueName} />
              <input type="hidden" name="venueCity" value={venueCity} />
              <input type="hidden" name="venueCountry" value={venueCountry} />

              {/* Event Details */}
              <div className="space-y-3">
                <EventAutocomplete
                  placeholder="Event Name (e.g. A Moon Shaped Pool Tour)"
                  value={title}
                  onChange={setTitle}
                  onSelect={handleEventSelect}
                  disabled={isLockedEvent}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all disabled:opacity-50"
                />

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Calendar size={16} />
                  </div>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isLockedEvent}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all hover:cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Venue Info */}
              <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <MapPin size={12} /> Venue Details
                </h4>
                
                <VenueAutocomplete
                  placeholder="Venue Name"
                  value={venueName}
                  onChange={setVenueName}
                  disabled={isLockedEvent}
                  onSelect={(v) => {
                    setVenueName(v.name);
                    setVenueCity(v.city);
                    setVenueCountry(v.country);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all disabled:opacity-50"
                />
                
                <div className="flex gap-3">
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={venueCity}
                    onChange={(e) => setVenueCity(e.target.value)}
                    disabled={isLockedEvent}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all disabled:opacity-50"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Country"
                    value={venueCountry}
                    onChange={(e) => setVenueCountry(e.target.value)}
                    disabled={isLockedEvent}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Bands Info */}
              <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Music size={12} /> Bands / Artists
                  </h4>
                  {bands.length < 5 && !isLockedEvent && (
                    <button 
                      type="button" 
                      onClick={addBand}
                      className="text-[10px] uppercase font-bold text-neon-cyan hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} strokeWidth={3} /> Add
                    </button>
                  )}
                </div>

                <input type="hidden" name="bands" value={JSON.stringify(bands)} />
                
                {bands.map((band, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <ArtistAutocomplete
                      placeholder={index === 0 ? "Headliner Name" : "Support Band Name"}
                      value={band.name}
                      onChange={(val) => updateBand(index, "name", val)}
                      disabled={isLockedEvent}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all disabled:opacity-50"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-400 font-medium whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={band.isHeadliner}
                        disabled={isLockedEvent}
                        onChange={(e) => updateBand(index, "isHeadliner", e.target.checked)}
                        className="accent-neon-cyan shrink-0 disabled:opacity-50"
                      />
                      Headliner
                    </label>
                    {index > 0 && !isLockedEvent ? (
                      <button 
                        type="button" 
                        onClick={() => removeBand(index)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <div className="w-[22px] shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Poster URL (updates right panel) */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <ImageIcon size={16} />
                </div>
                <input
                  type="url"
                  name="imageUrl"
                  value={imageUrl}
                  disabled={isLockedEvent}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Event Image URL (Optional)"
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all disabled:opacity-50"
                />
              </div>

              {/* Review and Rating */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Status</label>
                    <select 
                      name="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 text-white rounded text-sm p-1 focus:outline-none focus:border-neon-cyan"
                    >
                      <option value="Attended">Attended</option>
                      <option value="Going">Going</option>
                    </select>
                  </div>
                  
                  <div className={`flex flex-col gap-1 items-end mt-[-8px] ${status === 'Going' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Rating</label>
                    <Rating value={status === 'Going' ? 0 : rating} onChange={setRating} size={20} />
                    <input type="hidden" name="rating" value={status === 'Going' ? "" : (rating || "")} />
                  </div>
                </div>

                <textarea
                  name="reviewText"
                  placeholder="Add a review or some notes about the gig... (Optional)"
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all resize-none"
                ></textarea>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/50 flex justify-end">
              <Button 
                type="submit" 
                variant="neon" 
                disabled={isPending}
                className="w-full sm:w-auto px-8"
              >
                {isPending ? "SAVE..." : "SAVE GIG"}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Image Preview */}
        <div className="w-full md:w-1/2 bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 flex items-center justify-center p-8 relative overflow-hidden min-h-[250px] md:min-h-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/50 to-zinc-900">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={imageUrl} 
              alt="Gig preview" 
              className="max-w-full max-h-full object-contain rounded-md shadow-2xl relative z-10 aspect-[2/3] md:auto"
              onError={() => setImageUrl("")}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-600 gap-3">
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
                <ImageIcon size={32} />
              </div>
              <p className="text-sm font-medium">Image Preview</p>
              <p className="text-xs text-zinc-500 max-w-[200px] text-center">
                Add an image URL on the left to see the gig poster here.
              </p>
            </div>
          )}
          
          {/* Subtle background blur if image exists */}
          {imageUrl && (
            <div 
              className="absolute inset-0 z-0 opacity-20 blur-3xl scale-125 bg-center bg-cover"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          )}

        </div>
      </div>
    </div>
  );
}
