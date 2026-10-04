import type { Metadata } from "next";

import { InvoiceList } from "@/components/shop/invoice-list";

export const metadata: Metadata = {
  title: "Invoices",
};

export default function InvoicesPage() {
  return <InvoiceList />;
}
