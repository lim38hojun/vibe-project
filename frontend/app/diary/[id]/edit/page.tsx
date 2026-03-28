"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { entryFromRow } from "@/lib/entries";
import { getMoodEmoji, getMoodLabel, MOOD_OPTIONS } from "@/lib/mood";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Entry, MoodCode } from "@/types";

function DiaryEditForm({ entry, userId }: { entry: Entry; userId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.body);
  const [mood, setMood] = useState<MoodCode>(entry.mood);
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
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase
        .from("entries")
        .update({
          title: t,
          body: b,
          mood,
        })
        .eq("id", entry.id)
        .eq("user_id", userId)
        .select()
        .single();
      if (updateError) {
        setError(updateError.message);
        return;
      }
      if (data) {
        router.push(`/diary/${entry.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-title" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          제목
        </label>
        <input
          id="edit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-body" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          본문
        </label>
        <textarea
          id="edit-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
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
          href={`/diary/${entry.id}`}
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
  );
}

export default function DiaryEditPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const [entry, setEntry] = useState<Entry | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("entries").select("*").eq("id", id).single();
      if (cancelled) return;
      if (error) {
        setEntry(undefined);
        setLoadError(error.code === "PGRST116" ? null : error.message);
        setLoading(false);
        return;
      }
      const mapped = entryFromRow(
        data as {
          id: string;
          user_id: string;
          title: string;
          body: string;
          mood: string;
          created_at: string;
          updated_at: string;
        },
      );
      if (!mapped || mapped.user_id !== user.id) {
        setEntry(undefined);
      } else {
        setEntry(mapped);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  if (!user) {
    return null;
  }

  if (!id) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-12 sm:px-6">
        <p className="text-center text-zinc-600 dark:text-zinc-400">일기를 찾을 수 없습니다.</p>
        <Link
          href="/diary"
          className="mt-6 text-center text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          목록으로
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-12 sm:px-6">
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">불러오는 중…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-12 sm:px-6">
        <p className="text-center text-sm text-red-600 dark:text-red-400" role="alert">
          {loadError}
        </p>
        <Link
          href="/diary"
          className="mt-6 text-center text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          목록으로
        </Link>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-12 sm:px-6">
        <p className="text-center text-lg font-medium text-zinc-800 dark:text-zinc-200">
          일기를 찾을 수 없습니다
        </p>
        <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
          삭제되었거나 주소가 잘못되었을 수 있어요.
        </p>
        <Link
          href="/diary"
          className="mt-8 text-center text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          일기 수정
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          내용을 고친 뒤 저장하세요.
        </p>
      </div>

      <DiaryEditForm key={entry.id} entry={entry} userId={user.id} />
    </div>
  );
}
