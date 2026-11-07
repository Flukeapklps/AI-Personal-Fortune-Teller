import { BirthProfileForm } from "@/components/fortune/birth-profile-form";
import { requireUser } from "@/lib/fortune/page-data";
import { getFortuneRepository } from "@/lib/fortune/repository";

export const metadata = { title: "ข้อมูลวันเกิด" };

export default async function ProfilePage({ searchParams }: PageProps<"/fortune/profile">) {
  const user = await requireUser("/fortune/profile");
  const row = await getFortuneRepository().getBirthProfile(user.id);
  const { onboarding } = await searchParams;
  return (
    <BirthProfileForm
      initial={row ? { birthDate: row.birthDate, nickname: row.nickname } : null}
      onboarding={onboarding === "1" || !row}
    />
  );
}
