import { Suspense } from "react";
import { ResultScreen } from "@/components/fortune/result-screen";
import { LoadingCard } from "@/components/fortune/states";

export const metadata = { title: "ผลคำทำนาย" };

export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <ResultScreen />
    </Suspense>
  );
}
