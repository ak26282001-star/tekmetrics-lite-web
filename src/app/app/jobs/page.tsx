import type { Metadata } from "next";

import { PendingJobs, type Filter } from "@/components/shop/pending-jobs";
import { computeTotals } from "@/lib/shop/money";
import { getUnpaidInvoiceTotals, listPendingJobs } from "@/lib/shop/queries";

export const metadata: Metadata = {
  title: "Pending jobs",
};

const FILTERS: Filter[] = ["all", "in_progress", "completed"];

export default async function PendingJobsPage({ searchParams }: PageProps<"/app/jobs">) {
  const { status } = await searchParams;
  const initialFilter = FILTERS.find((f) => f === status) ?? "all";
  const [jobs, unpaid] = await Promise.all([listPendingJobs(), getUnpaidInvoiceTotals()]);
  const unpaidTotal = unpaid.reduce(
    (sum, inv) => sum + computeTotals(inv.jobs.flatMap((j) => j.items), inv.taxRate).total,
    0,
  );

  return (
    <PendingJobs
      jobs={jobs}
      unpaidTotal={unpaidTotal}
      unpaidCount={unpaid.length}
      now={new Date().toISOString()}
      initialFilter={initialFilter}
    />
  );
}
