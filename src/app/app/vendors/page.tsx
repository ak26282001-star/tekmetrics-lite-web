import type { Metadata } from "next";

import { VendorsManager } from "@/components/shop/vendors-manager";
import { listVendors } from "@/lib/shop/queries";

export const metadata: Metadata = {
  title: "Parts vendors",
};

export default async function VendorsPage() {
  const vendors = await listVendors();
  return <VendorsManager vendors={vendors} />;
}
