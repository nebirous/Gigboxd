# Gigboxd: AI Context & Documentation

This document provides a comprehensive overview of the Gigboxd codebase for AI coding assistants. It covers the project's mission, technical stack, architecture, and core patterns.

---

## 1. Project Mission
**Gigboxd** is a "Letterboxd for concerts"—a social platform for live music enthusiasts to log, rate, review, and track their concert and festival experiences. It acts as a personal musical diary and a social hub for concert-goers.

---

## 2. Technical Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components).
- **Frontend Library**: [React 19](https://react.dev/).
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (using `@tailwindcss/postcss`).
- **Icons**: [Lucide React](https://lucide.dev/).
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL) with Row-Level Security (RLS).
- **Authentication**: Supabase Auth (Email, Social providers).
- **Language**: [TypeScript](https://www.typescriptlang.org/).

---

## 3. Core Features
- **Concert Logging**: Mark concerts as "Attended" or "Going".
- **Rating System**: 1-5 star rating (including half-stars).
- **Personal Diary**: A chronological feed of a user's concert history.
- **"Best Gigs"**: Users can pin up to 6 favorite shows to their profile.
- **Artist & Event Pages**: Detailed information fetched from external APIs.
- **Social Graph**: Follow other users to see their logs and reviews.

---

## 4. Key Directory Structure
```text
/
├── migrations/          # SQL migration files for Supabase
├── public/              # Static assets
├── schema.sql           # Main database schema definition
├── seed.sql             # Sample data for development
├── src/
│   ├── app/             # Next.js App Router (pages and server actions)
│   │   ├── actions/     # Global server actions (logging, searching)
│   │   ├── api/         # Route handlers
│   │   ├── artist/      # Artist detail pages
│   │   ├── discover/    # Discovery page
│   │   ├── event/       # Event detail pages
│   │   ├── log/         # Logging flow
│   │   ├── login/       # Auth pages
│   │   ├── profile/     # User profile pages (inc. Best Gigs logic)
│   │   ├── globals.css  # Global Tailwind styles
│   │   └── layout.tsx   # Root layout
│   ├── components/      # React components
│   │   ├── profile/     # Profile-specific components (Best Gigs section/modal)
│   │   ├── ui/          # Reusable UI primitives
│   │   └── log-gig-modal.tsx # Main logging interface
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Core logic and API clients
│   │   ├── api/         # Third-party API wrappers (Ticketmaster, Spotify, Setlist.fm)
│   │   └── cache.ts     # Caching logic for API responses
│   └── utils/           # Helper functions
└── .context/            # Detailed product and architecture specifications
```

---

## 5. Database Schema
Defined in `schema.sql`. Core tables:
- `profiles`: User profiles linked to Supabase Auth.
- `artists`: Artist metadata (Primary key: `spotify_id`).
- `venues`: Concert venues.
- `events`: Specific concerts or festivals.
- `event_artists`: Many-to-many relationship linking artists to events.
- `logs`: User entries for events (Attended/Going, Rating, Review).
- `follows`: Social connections between users.
- `best_gigs`: User's pinned favorite shows for their profile.

---

## 6. API Integrations & Data Flow
Gigboxd uses a **Lazy-Loading (Search-Driven) Caching** strategy:
1. **Spotify API**: The "Rosetta Stone" for artist metadata and images (`spotify_id`).
2. **Setlist.fm API**: Primary source for historical data and community-validated setlists.
3. **Ticketmaster API**: Primary source for future events and tour imagery.

**Data Flow**:
Search -> Cache Check (Supabase) -> If not found, fetch from external API -> Normalize & Store in Supabase -> Serve to user.

---

## 7. Development Patterns
- **Server Components**: Prefer Server Components for data fetching.
- **Server Actions**: Use Server Actions (`src/app/actions`) for mutations (logging, following).
- **Responsive Design**: Mobile-first, following a "Letterboxd" aesthetic (dark theme, image-centric).
- **Type Safety**: Use TypeScript interfaces for all API responses and database entities.
- **Supabase Client**: Standard Supabase SSR client for auth and data access.

---

## 8. Key Coding Conventions
- **Naming**: `kebab-case` for file names, `PascalCase` for components.
- **State Management**: React `useState`/`useContext` and URL params.
- **Icons**: Use `lucide-react`.
- **CSS**: Tailwind CSS utility classes. Avoid inline styles.
- **Persistence**: All user-generated content must go through Supabase with appropriate RLS policies.

---

## 9. Current Development Context (April 2026)
- **Top Priority**: Refining the **"Best Gigs"** feature, which allowed users to select and pin their top 6 shows.
- **Recent Migrations**: Added `best_gigs` table for pinned favorited events.
- **Key Files**:
  - `src/components/profile/best-gigs-modal.tsx`: Selection and search logic.
  - `src/components/profile/best-gigs-section.tsx`: Display logic on the profile.
  - `src/app/profile/[username]/actions.ts`: Server actions for pinning/unpinning.
