# Sonex Platform

React + TypeScript SPA built with Vite, Tailwind CSS, and [shadcn/ui](https://ui.shadcn.com).

## Stack

- **UI:** React 19, Tailwind CSS v4, shadcn/ui (New York style, neutral theme)
- **Routing:** React Router v7 (`react-router`)
- **Data:** TanStack Query, Supabase JS client
- **Forms:** React Hook Form, Zod, `@hookform/resolvers`
- **Utilities:** Lucide React, `date-fns`, ExcelJS, `class-variance-authority`, `clsx`, `tailwind-merge`

## Getting started

```bash
npm install
cp .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
npm run dev
```

| Script          | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start dev server         |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Preview production build |
| `npm run lint`  | Run Oxlint               |

## Project layout

```
src/
  lib/
    supabase.ts   # Supabase client (env-driven)
    utils.ts      # cn() helper for Tailwind classes
  App.tsx         # App shell, router, query client
public/
  _redirects      # SPA fallback for static hosts
supabase/
  migrations/     # Database migrations (empty)
  functions/      # Edge functions (empty)
```

## shadcn/ui

Add components with:

```bash
npx shadcn@latest add <component>
```

Configuration lives in `components.json` at the project root.

## Deployment (Cloudflare Pages)

1. Connect the repo and set **Build command** to `npm run build` and **Build output** to `dist`.
2. Set environment variables in the Pages project (only `VITE_*` are exposed to the browser):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. `public/_redirects` is copied to `dist` with `/* /index.html 200` for SPA routing on Cloudflare Pages.
4. Apply Supabase migrations (including `20251124000001_public_access_rls.sql`).
5. Deploy the Edge Function `send-enquiry-email` and set secrets: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`.

The app is a static SPA (no Node server). Excel BOQ export uses client-side ExcelJS after download approval.