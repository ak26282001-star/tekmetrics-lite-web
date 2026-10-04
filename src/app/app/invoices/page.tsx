import type { Metadata } from "next";

import { InvoiceList } from "@/components/shop/invoice-list";
import { listInvoices } from "@/lib/shop/queries";

export const metadata: Metadata = {
  title: "Invoices",
};

export default async function InvoicesPage() {
  const invoices = await listInvoices();
  return <InvoiceList invoices={invoices} />;
}
