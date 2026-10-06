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

**Everyday flow:** press **New job order** (top right, on every page) → pick the vehicle by plate, VIN or customer name, or add a new one → enter the job. When the work is done, mark it complete and press **Invoice** (on Pending jobs, or **Create invoice** on the Invoices page).


- **Vehicle finder** (`/app`) — search by license plate or VIN (partial matches, e.g. last 6 of the VIN). Add a new vehicle when there's no match; **Decode** fills year/make/model from the VIN via the free [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/).
- **Pending jobs** (`/app/jobs`) — every job not yet invoiced, across all vehicles, oldest first. Filter by status or technician, search by plate/customer, mark jobs complete or invoice them in one click.
- **Vehicle page** (`/app/vehicles/[id]`) — customer details and job history. Add jobs with labor and parts lines, mark them complete, then select completed jobs to **create an invoice**.
- **Order parts** — on any working job (vehicle page or Pending jobs), opens your parts vendors with that job's vehicle filled in, copies the VIN for the vendor's lookup, and tracks the job's parts: **Needs parts → Parts ordered (vendor, PO/ETA) → Received**. Pending jobs has a **Waiting on parts** filter.
- **Parts vendors** (`/app/vendors`) — your dealers' websites, account numbers, phones and reps, plus a search across all of them. To let the app fill in the vehicle and part automatically, search the vendor's site for `brakepads` and paste the resulting link into the vendor's **Search link**; the app turns it into a template (placeholders: `{q}` = vehicle + part, `{part}`, `{year}`, `{make}`, `{model}`, `{vin}`). Vendor sites open in a new tab — they can't be embedded.
- **Invoices** (`/app/invoices`) — list with payment status; each invoice is printable / savable as PDF and can be marked paid.

> ⚠️ There is no login yet — anyone who can reach the site can see and change shop data. Add authentication before deploying publicly.

## Database

The backend uses [Drizzle ORM](https://orm.drizzle.team) with SQLite (libSQL). Pages read data on the server (`src/lib/shop/queries.ts`) and changes go through Server Actions (`src/app/app/actions.ts`), which validate every input.

- **Local:** nothing to set up. On first request the app creates `data/shop.db`, runs migrations and loads a few sample vehicles. Delete `data/` to start over.
- **Hosted (e.g. Vercel):** serverless hosts can't keep a local file, so create a free database at [turso.tech](https://turso.tech) and set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` (see `.env.example`). Migrations run automatically; sample data is never added to a hosted database.

Changing the schema (`src/db/schema.ts`):

```bash
npm run db:generate   # create a new migration in drizzle/
npm run db:studio     # browse the data
```

Shop name, address, labor rate and tax rate live in `src/lib/shop/settings.ts`.

## Structure

```
src/
  app/
    globals.css       # Theme tokens (shadcn CSS variables, ignition-orange brand)
    layout.tsx        # Fonts, metadata, dark theme
    page.tsx          # Composes the landing sections
    app/              # Shop app routes + Server Actions (actions.ts)
drizzle/              # SQL migrations
  components/
    ui/               # shadcn/ui primitives (button, card, badge, tabs, accordion…)
    landing/          # Page sections: navbar, hero, features, pricing, faq, footer…
    shop/             # Shop app: finder, pending jobs, vehicle page, job dialog, invoices
  db/                 # Drizzle schema + database connection
  lib/
    shop/             # Shop data: types, queries, money, VIN helpers, sample data
    utils.ts          # cn() helper
```

Add more shadcn components with `npx shadcn@latest add <component>`.
