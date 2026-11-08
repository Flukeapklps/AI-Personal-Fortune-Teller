import { Suspense } from "react";
import { CompareScreen } from "@/components/fortune/compare-screen";
import { LoadingCard } from "@/components/fortune/states";

export const metadata = { title: "เปรียบเทียบคำทำนาย" };

export default function ComparePage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <CompareScreen />
    </Suspense>
  );
}
