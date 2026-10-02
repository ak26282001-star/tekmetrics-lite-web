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

## Structure

```
src/
  app/
    globals.css       # Theme tokens (shadcn CSS variables, ignition-orange brand)
    layout.tsx        # Fonts, metadata, dark theme
    page.tsx          # Composes the landing sections
  components/
    ui/               # shadcn/ui primitives (button, card, badge, tabs, accordion…)
    landing/          # Page sections: navbar, hero, features, pricing, faq, footer…
  lib/utils.ts        # cn() helper
```

Add more shadcn components with `npx shadcn@latest add <component>`.
