import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";

export const metadata: Metadata = {
  title: "BuySpace | Tokenize and lease airspace",
  description:
    "BuySpace lets owners tokenize urban airspace on Hedera and list time-bound leases indexed on Arkiv.",
};

export default function Home() {
  return <HomePage />;
}
