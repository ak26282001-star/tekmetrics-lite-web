import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InvoiceView } from "@/components/shop/invoice-view";
import { getInvoice } from "@/lib/shop/queries";

export const metadata: Metadata = {
  title: "Invoice",
};

export default async function InvoicePage({ params }: PageProps<"/app/invoices/[id]">) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  return <InvoiceView invoice={invoice} />;
}
