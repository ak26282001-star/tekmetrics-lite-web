import type { Metadata } from "next";
import { connection } from "next/server";

import { AppHeader } from "@/components/shop/app-header";
import { DbSetupNeeded } from "@/components/shop/db-setup-needed";
import { getDbConfigIssue, getDbUrlSource } from "@/db";

export const metadata: Metadata = {
  title: {
    default: "Shop — Tekmetric Lite",
    template: "%s — Tekmetric Lite",
  },
};

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  // Check the database configuration at request time (environment variables can change per deploy)
  await connection();
  const dbIssue = getDbConfigIssue();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 print:p-0">
        {dbIssue ? <DbSetupNeeded issue={dbIssue} source={getDbUrlSource()} /> : children}
      </main>
    </>
  );
}
