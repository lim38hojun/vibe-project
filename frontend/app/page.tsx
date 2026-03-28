"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isLoggedIn, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(isLoggedIn ? "/diary" : "/login");
  }, [isLoggedIn, ready, router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10">
      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">이동 중…</p>
    </div>
  );
}
