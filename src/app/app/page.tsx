import type { Metadata } from "next";

import { VehicleFinder } from "@/components/shop/vehicle-finder";

export const metadata: Metadata = {
  title: "Vehicle finder",
};

export default function FinderPage() {
  return <VehicleFinder />;
}
