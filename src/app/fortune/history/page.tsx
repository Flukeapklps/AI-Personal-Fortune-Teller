import { HistoryList } from "@/components/fortune/history-list";
import { requireUser } from "@/lib/fortune/page-data";

export const metadata = { title: "ประวัติคำทำนาย" };

export default async function HistoryPage() {
  await requireUser("/fortune/history");
  return <HistoryList />;
}
