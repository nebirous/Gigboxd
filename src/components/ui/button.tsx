import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "neon";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-white text-zinc-950 hover:bg-zinc-200": variant === "primary",
            "bg-zinc-800 text-white hover:bg-zinc-700": variant === "secondary",
            "border border-zinc-700 bg-transparent text-white hover:bg-zinc-800":
              variant === "outline",
            "hover:bg-zinc-800/50 text-zinc-300 hover:text-white":
              variant === "ghost",
            "bg-neon-fuchsia text-white glow-fuchsia hover:brightness-110":
              variant === "neon",
            "h-9 px-4 py-2 text-xs": size === "sm",
            "h-11 px-6 py-2 text-sm": size === "md",
            "h-12 px-8 py-3 text-base": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
