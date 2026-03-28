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
    <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href={homeHref}
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          나만의 일기장
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {isLoggedIn ? (
            <>
              {pathname !== "/diary" && (
                <Link
                  href="/diary"
                  className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  목록
                </Link>
              )}
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
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
                    ? "font-medium text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
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
