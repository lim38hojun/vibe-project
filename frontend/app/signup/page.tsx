"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!EMAIL_RE.test(email.trim())) {
      setError("올바른 이메일 형식을 입력해 주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await signup(email, password);
      if (result.ok) {
        router.push("/login");
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
          회원가입
        </h1>
        <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
          이메일로 간단히 시작할 수 있어요.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800 dark:bg-[#022c28]/70"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="signup-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            이메일
          </label>
          <input
            id="signup-email"
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
            htmlFor="signup-password"
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            비밀번호
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sequence-teal/35 focus:ring-2 focus:ring-sequence-teal/15 dark:border-slate-600 dark:bg-[#021a18] dark:text-slate-100 dark:focus:border-[#5ee9b5]/50 dark:focus:ring-[#5ee9b5]/20"
            placeholder="6자 이상"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="signup-confirm"
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            비밀번호 확인
          </label>
          <input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          가입하기
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-400 dark:text-slate-500">
        이미 계정이 있으신가요?{" "}
        <Link
          href="/login"
          className="font-semibold text-sequence-teal underline decoration-sequence-teal/30 underline-offset-2 hover:decoration-sequence-teal dark:text-[#5ee9b5] dark:decoration-[#5ee9b5]/40"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
