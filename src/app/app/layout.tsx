import type { Metadata } from "next";

import { AppHeader } from "@/components/shop/app-header";

export const metadata: Metadata = {
  title: {
    default: "Shop — Tekmetric Lite",
    template: "%s — Tekmetric Lite",
  },
};

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 print:p-0">
        {children}
      </main>
    </>
  );
}
