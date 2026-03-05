"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { clsx } from "clsx";

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
}

export function Rating({ value, onChange, readonly = false, size = 28 }: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (readonly || !onChange) return;
    
    // Very rudimentary haptic feedback attempt (vibrate on star change)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
       navigator.vibrate(10);
    }

    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;
    
    // Calculate out of 5 stars, rounding to nearest 0.5
    const rawValue = percent * 5;
    const rounded = Math.ceil(rawValue * 2) / 2;
    const clamped = Math.max(0.5, Math.min(5, rounded));
    
    setHoverValue(clamped);
  };

  const handlePointerLeave = () => {
    setHoverValue(null);
  };

  const handleClick = () => {
    if (readonly || !onChange || hoverValue === null) return;
    onChange(hoverValue);
  };

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1",
        !readonly && "cursor-pointer touch-none"
      )}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        // Full star if displayValue >= starIndex (e.g. 4 >= 4)
        // Half star if displayValue is 0.5 below starIndex (e.g. 3.5 is half of star 4)
        const isFull = displayValue >= starIndex;
        const isHalf = displayValue === starIndex - 0.5;
        const isActive = isFull || isHalf;

        return (
          <div key={starIndex} className="relative">
            {/* Base empty star */}
            <Star
              size={size}
              strokeWidth={1.5}
              className="text-zinc-700"
            />
            
            {/* Active filled star overlay */}
            {isActive && (
              <div
                className={clsx(
                  "absolute top-0 left-0 overflow-hidden text-neon-cyan drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all",
                )}
                style={{ width: isHalf ? "50%" : "100%" }}
              >
                <Star
                  size={size}
                  fill="currentColor"
                  strokeWidth={1.5}
                  className="text-neon-cyan"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
