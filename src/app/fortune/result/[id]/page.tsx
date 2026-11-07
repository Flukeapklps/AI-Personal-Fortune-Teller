import { notFound } from "next/navigation";
import { PredictionActions } from "@/components/fortune/prediction-actions";
import { PredictionView } from "@/components/fortune/prediction-view";
import { requireUser } from "@/lib/fortune/page-data";
import { getFortuneRepository } from "@/lib/fortune/repository";

export const metadata = { title: "ผลคำทำนาย" };

export default async function ResultPage({ params }: PageProps<"/fortune/result/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/fortune/result/${id}`);
  const prediction = await getFortuneRepository().getPrediction(user.id, id);
  if (!prediction) notFound();
  return (
    <div className="space-y-4">
      <PredictionActions prediction={prediction} />
      <PredictionView prediction={prediction} />
    </div>
  );
}
