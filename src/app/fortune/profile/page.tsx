import { Suspense } from "react";
import { ProfileScreen } from "@/components/fortune/profile-screen";
import { LoadingCard } from "@/components/fortune/states";

export const metadata = { title: "ข้อมูลวันเกิด" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <ProfileScreen />
    </Suspense>
  );
}
