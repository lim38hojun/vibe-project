"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/contexts/AuthContext";

type ProtectedRouteProps = {
  children: ReactNode;
};

/** 미들웨어와 함께 사용 — 클라이언트 하이드레이션 시 백업 리다이렉트 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { ready, isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !isLoggedIn) {
      router.replace("/login");
    }
  }, [ready, isLoggedIn, router]);

  if (!ready || !isLoggedIn) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">로그인이 필요합니다…</p>
      </div>
    );
  }

  return <>{children}</>;
}
