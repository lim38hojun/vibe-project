"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.ok) {
        router.push("/diary");
        return;
      }
      setError(result.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12 sm:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-50">
          로그인
        </h1>
        <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
          이메일과 비밀번호로 들어올 수 있어요.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800 dark:bg-[#022c28]/70"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sequence-teal/35 focus:ring-2 focus:ring-sequence-teal/15 dark:border-slate-600 dark:bg-[#021a18] dark:text-slate-100 dark:focus:border-[#5ee9b5]/50 dark:focus:ring-[#5ee9b5]/20"
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="login-password"
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sequence-teal/35 focus:ring-2 focus:ring-sequence-teal/15 dark:border-slate-600 dark:bg-[#021a18] dark:text-slate-100 dark:focus:border-[#5ee9b5]/50 dark:focus:ring-[#5ee9b5]/20"
          />
        </div>
        {error ? (
          <p className="text-sm font-medium text-red-500 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-sequence-mint py-3 text-sm font-semibold text-sequence-teal shadow-sm transition hover:brightness-95 disabled:opacity-60"
        >
          로그인
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-400 dark:text-slate-500">
        계정이 없으신가요?{" "}
        <Link
          href="/signup"
          className="font-semibold text-sequence-teal underline decoration-sequence-teal/30 underline-offset-2 hover:decoration-sequence-teal dark:text-[#5ee9b5] dark:decoration-[#5ee9b5]/40"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}
