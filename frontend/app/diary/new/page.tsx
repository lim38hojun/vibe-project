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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          새 일기
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          제목, 본문, 기분을 남겨 보세요.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-title" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            제목
          </label>
          <input
            id="new-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
            placeholder="한 줄 제목"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-body" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            본문
          </label>
          <textarea
            id="new-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
            placeholder="오늘 있었던 일을 적어 보세요."
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">기분</legend>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((code) => {
              const selected = mood === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setMood(code)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                    selected
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:border-zinc-600",
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
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/diary"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
