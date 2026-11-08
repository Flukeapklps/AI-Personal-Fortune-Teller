"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { getPrediction } from "@/lib/fortune/client";
import type { PredictionRecord } from "@/lib/fortune/types";
import { PredictionActions } from "./prediction-actions";
import { PredictionView } from "./prediction-view";
import { ErrorCard, LoadingCard } from "./states";

type State = { status: "loading" } | { status: "missing" } | { status: "error"; message: string } | { status: "ready"; p: PredictionRecord };

export function ResultScreen() {
  const id = useSearchParams().get("id");
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no id means nothing to load
      setState({ status: "missing" });
      return;
    }
    setState({ status: "loading" });
    getPrediction(id)
      .then((p) => alive && setState(p ? { status: "ready", p } : { status: "missing" }))
      .catch((e) => alive && setState({ status: "error", message: e instanceof Error ? e.message : "โหลดไม่สำเร็จ" }));
    return () => {
      alive = false;
    };
  }, [id]);

  if (state.status === "loading") return <LoadingCard text="กำลังเปิดคำทำนาย…" />;
  if (state.status === "error") return <ErrorCard message={state.message} />;
  if (state.status === "missing") {
    return (
      <GlassCard className="text-center">
        <p className="text-white/70">ไม่พบคำทำนายนี้ อาจถูกลบไปแล้ว</p>
        <Button className="mt-4" asChild>
          <Link href="/fortune/history">ไปที่ประวัติ</Link>
        </Button>
      </GlassCard>
    );
  }
  return (
    <div className="space-y-4">
      <PredictionActions key={state.p.id} prediction={state.p} />
      <PredictionView prediction={state.p} />
    </div>
  );
}
