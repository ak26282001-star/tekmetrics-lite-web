import type { Metadata } from "next";

import { VehicleFinder } from "@/components/shop/vehicle-finder";
import { listVehicles } from "@/lib/shop/queries";

export const metadata: Metadata = {
  title: "Vehicle finder",
};

export default async function FinderPage() {
  const vehicles = await listVehicles();
  return <VehicleFinder vehicles={vehicles} />;
}
