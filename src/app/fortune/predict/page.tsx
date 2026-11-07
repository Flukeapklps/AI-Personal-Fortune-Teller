import { PredictionSelector } from "@/components/fortune/prediction-selector";
import { requireBirthProfile } from "@/lib/fortune/page-data";

export const metadata = { title: "เลือกดูดวง" };

export default async function PredictPage() {
  await requireBirthProfile("/fortune/predict");
  return <PredictionSelector />;
}
