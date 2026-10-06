import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VehicleDetail } from "@/components/shop/vehicle-detail";
import { getVehicleDetail, listVendors } from "@/lib/shop/queries";

export const metadata: Metadata = {
  title: "Vehicle",
};

export default async function VehiclePage({ params }: PageProps<"/app/vehicles/[id]">) {
  const { id } = await params;
  const [detail, vendors] = await Promise.all([getVehicleDetail(id), listVendors()]);
  if (!detail) notFound();
  return <VehicleDetail {...detail} vendors={vendors} />;
}
