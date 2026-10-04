import type { Metadata } from "next";

import { PendingJobs } from "@/components/shop/pending-jobs";
import { computeTotals } from "@/lib/shop/money";
import { getUnpaidInvoiceTotals, listPendingJobs } from "@/lib/shop/queries";

export const metadata: Metadata = {
  title: "Pending jobs",
};

export default async function PendingJobsPage() {
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
    />
  );
}
