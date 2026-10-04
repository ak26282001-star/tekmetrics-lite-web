import type { Metadata } from "next";

import { VehicleDetail } from "@/components/shop/vehicle-detail";

export const metadata: Metadata = {
  title: "Vehicle",
};

export default async function VehiclePage({ params }: PageProps<"/app/vehicles/[id]">) {
  const { id } = await params;
  return <VehicleDetail id={id} />;
}
