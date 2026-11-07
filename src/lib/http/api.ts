import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { type AppUser, getCurrentUser } from "@/lib/auth/session";
import { FortuneError } from "@/lib/fortune/service";

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Wraps a route handler with auth + consistent error handling. */
export function withUser<A extends unknown[]>(handler: (user: AppUser, ...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      const user = await getCurrentUser();
      if (!user) return jsonError(401, "unauthorized", "กรุณาเข้าสู่ระบบ");
      return await handler(user, ...args);
    } catch (err) {
      if (err instanceof FortuneError) return jsonError(err.status, err.code, err.message);
      if (err instanceof ZodError) return jsonError(400, "invalid_input", err.issues.map((i) => i.message).join("; "));
      console.error("[fortune api]", err);
      return jsonError(500, "internal_error", "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };
}
