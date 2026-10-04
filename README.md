# Tekmetric Lite — Landing Page

Marketing site for **Tekmetric Lite**, a parts & inventory system for independent auto repair shops.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack, React 19)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) components (Radix primitives) in `src/components/ui`
- [lucide-react](https://lucide.dev) icons

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Shop app (`/app`)

A working demo of the shop workflow:

- **Vehicle finder** (`/app`) — search by license plate or VIN (partial matches, e.g. last 6 of the VIN). Add a new vehicle when there's no match; **Decode** fills year/make/model from the VIN via the free [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/).
- **Vehicle page** (`/app/vehicles/[id]`) — customer details and job history. Add jobs with labor and parts lines (quick-add presets included), mark them complete, then select completed jobs to **create an invoice**.
- **Invoices** (`/app/invoices`) — list with outstanding balance; each invoice is printable / savable as PDF and can be marked paid.

Data is stored in the browser's `localStorage` (no backend yet) and starts with sample vehicles. Shop name, address, labor rate and tax rate live in `src/lib/shop/settings.ts`. All data access goes through `src/lib/shop/store.ts`, so swapping in a real API later only touches that file.

## Structure

```
src/
  app/
    globals.css       # Theme tokens (shadcn CSS variables, ignition-orange brand)
    layout.tsx        # Fonts, metadata, dark theme
    page.tsx          # Composes the landing sections
    app/              # Shop app routes (/app, /app/vehicles/[id], /app/invoices)
  components/
    ui/               # shadcn/ui primitives (button, card, badge, tabs, accordion…)
    landing/          # Page sections: navbar, hero, features, pricing, faq, footer…
    shop/             # Shop app: finder, vehicle page, job dialog, invoices
  lib/
    shop/             # Shop data: types, store, money, VIN helpers, sample data
    utils.ts          # cn() helper
```

Add more shadcn components with `npx shadcn@latest add <component>`.
