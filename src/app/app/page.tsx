import type { Metadata } from "next";

import { VehicleFinder } from "@/components/shop/vehicle-finder";
import { listVehicles, listVendors } from "@/lib/shop/queries";

export const metadata: Metadata = {
  title: "Vehicle finder",
};

export default async function FinderPage() {
  const [vehicles, vendors] = await Promise.all([listVehicles(), listVendors()]);
  return <VehicleFinder vehicles={vehicles} vendors={vendors} />;
}
