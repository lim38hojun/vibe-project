"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { getMoodEmoji, getMoodLabel, MOOD_OPTIONS } from "@/lib/mood";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { MoodCode } from "@/types";

export default function DiaryNewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<MoodCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) {
      setError("제목과 본문을 모두 입력해 주세요.");
      return;
    }
    if (!mood) {
      setError("오늘의 기분을 선택해 주세요.");
      return;
    }
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("entries")
        .insert({
          user_id: user.id,
          title: t,
          body: b,
          mood,
        })
        .select()
        .single();
      if (insertError) {
        setError(insertError.message);
        return;
      }
      if (data?.id) {
        router.push(`/diary/${data.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-50">
          새 일기
        </h1>
        <p className="mt-1.5 text-sm text-slate-400 dark:text-slate-500">
          제목, 본문, 기분을 남겨 보세요.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800 dark:bg-[#022c28]/70"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="new-title" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            제목
          </label>
          <input
            id="new-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sequence-teal/35 focus:ring-2 focus:ring-sequence-teal/15 dark:border-slate-600 dark:bg-[#021a18] dark:text-slate-100 dark:focus:border-[#5ee9b5]/50 dark:focus:ring-[#5ee9b5]/20"
            placeholder="한 줄 제목"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="new-body" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            본문
          </label>
          <textarea
            id="new-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sequence-teal/35 focus:ring-2 focus:ring-sequence-teal/15 dark:border-slate-600 dark:bg-[#021a18] dark:text-slate-100 dark:focus:border-[#5ee9b5]/50 dark:focus:ring-[#5ee9b5]/20"
            placeholder="오늘 있었던 일을 적어 보세요."
          />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">기분</legend>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((code) => {
              const selected = mood === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setMood(code)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition",
                    selected
                      ? "border-sequence-mint bg-sequence-mint text-sequence-teal shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-[#021a18] dark:text-slate-200 dark:hover:border-slate-500",
                  )}
                >
                  <span aria-hidden>{getMoodEmoji(code)}</span>
                  {getMoodLabel(code)}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error ? (
          <p className="text-sm font-medium text-red-500 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link
            href="/diary"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-sequence-mint px-5 py-2.5 text-sm font-semibold text-sequence-teal shadow-sm transition hover:brightness-95 disabled:opacity-60"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
