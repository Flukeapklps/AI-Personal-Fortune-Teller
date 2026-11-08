"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProfile, type ProfileResponse } from "@/lib/fortune/client";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ProfileResponse };

/**
 * Loads the user's birth profile. With `require: true`, users without one are
 * sent to the onboarding form.
 */
export function useBirthProfile({ require = false } = {}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    getProfile()
      .then((data) => {
        if (!alive) return;
        if (require && !data.profile) router.replace("/fortune/profile?onboarding=1");
        else setState({ status: "ready", data });
      })
      .catch((e) => alive && setState({ status: "error", message: e instanceof Error ? e.message : "โหลดไม่สำเร็จ" }));
    return () => {
      alive = false;
    };
  }, [require, router]);

  return state;
}
