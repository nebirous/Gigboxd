import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/ui/bottom-nav";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gigboxd — Your Live Music Diary",
  description:
    "Log, rate, and review every concert and festival you attend. The Letterboxd for live music.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${geistMono.variable} font-sans antialiased bg-[#0a0a0a] text-zinc-200`}
      >
        <div className="min-h-screen pb-20 md:pb-0 md:pl-64">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
