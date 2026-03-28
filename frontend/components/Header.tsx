"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const homeHref = isLoggedIn ? "/diary" : "/";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 shadow-[0_1px_0_rgb(0,0,0,0.03)] backdrop-blur-md dark:border-slate-800/80 dark:bg-[#022c28]/95">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <Link
          href={homeHref}
          className="text-lg font-semibold tracking-tight text-sequence-teal dark:text-[#5ee9b5]"
        >
          나만의 일기장
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {isLoggedIn ? (
            <>
              {pathname !== "/diary" && (
                <Link
                  href="/diary"
                  className="font-medium text-slate-500 transition hover:text-sequence-teal dark:text-slate-400 dark:hover:text-[#5ee9b5]"
                >
                  목록
                </Link>
              )}
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={
                  pathname === "/login"
                    ? "font-semibold text-sequence-teal dark:text-[#5ee9b5]"
                    : "font-medium text-slate-500 transition hover:text-sequence-teal dark:text-slate-400 dark:hover:text-[#5ee9b5]"
                }
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-sequence-mint px-3 py-2 text-sm font-semibold text-sequence-teal shadow-sm transition hover:brightness-95"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
