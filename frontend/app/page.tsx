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
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">이동 중…</p>
    </div>
  );
}
