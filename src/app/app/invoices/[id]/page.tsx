import type { Metadata } from "next";

import { InvoiceView } from "@/components/shop/invoice-view";

export const metadata: Metadata = {
  title: "Invoice",
};

export default async function InvoicePage({ params }: PageProps<"/app/invoices/[id]">) {
  const { id } = await params;
  return <InvoiceView id={id} />;
}
