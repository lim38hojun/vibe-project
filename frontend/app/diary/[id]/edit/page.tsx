"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { DrawingPad, type DrawingPadHandle } from "@/components/DrawingPad";
import { useAuth } from "@/contexts/AuthContext";
import { entryFromRow } from "@/lib/entries";
import { getMoodEmoji, getMoodLabel, MOOD_OPTIONS } from "@/lib/mood";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Entry, MoodCode } from "@/types";

const MAX_DRAWING_BASE64_LEN = 1_500_000;

function DiaryEditForm({ entry, userId }: { entry: Entry; userId: string }) {
  const router = useRouter();
  const drawingPadRef = useRef<DrawingPadHandle>(null);
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
    const drawingPng = drawingPadRef.current?.getPngBase64OrNull() ?? null;
    if (drawingPng && drawingPng.length > MAX_DRAWING_BASE64_LEN) {
      setError("그림 용량이 너무 큽니다. 전체 지우기 후 다시 그려 주세요.");
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
          drawing: drawingPng,
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
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex flex-col gap-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800 dark:bg-[#022c28]/70"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="edit-title" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          제목
        </label>
        <input
          id="edit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sequence-teal/35 focus:ring-2 focus:ring-sequence-teal/15 dark:border-slate-600 dark:bg-[#021a18] dark:text-slate-100 dark:focus:border-[#5ee9b5]/50 dark:focus:ring-[#5ee9b5]/20"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="edit-body" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          본문
        </label>
        <textarea
          id="edit-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sequence-teal/35 focus:ring-2 focus:ring-sequence-teal/15 dark:border-slate-600 dark:bg-[#021a18] dark:text-slate-100 dark:focus:border-[#5ee9b5]/50 dark:focus:ring-[#5ee9b5]/20"
        />
      </div>

      <DrawingPad ref={drawingPadRef} initialPngBase64={entry.drawing} />

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
          href={`/diary/${entry.id}`}
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
          drawing?: string | null;
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
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-16 sm:px-8">
        <p className="text-center text-slate-500 dark:text-slate-400">일기를 찾을 수 없습니다.</p>
        <Link
          href="/diary"
          className="mt-6 text-center text-sm font-semibold text-sequence-teal underline decoration-sequence-teal/30 underline-offset-2 dark:text-[#5ee9b5] dark:decoration-[#5ee9b5]/40"
        >
          목록으로
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-16 sm:px-8">
        <p className="text-center text-sm font-medium text-slate-400 dark:text-slate-500">불러오는 중…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-16 sm:px-8">
        <p className="text-center text-sm font-medium text-red-500 dark:text-red-400" role="alert">
          {loadError}
        </p>
        <Link
          href="/diary"
          className="mt-6 text-center text-sm font-semibold text-sequence-teal underline decoration-sequence-teal/30 underline-offset-2 dark:text-[#5ee9b5] dark:decoration-[#5ee9b5]/40"
        >
          목록으로
        </Link>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-16 sm:px-8">
        <p className="text-center text-lg font-medium text-slate-800 dark:text-slate-200">
          일기를 찾을 수 없습니다
        </p>
        <p className="mt-2 text-center text-sm text-slate-400 dark:text-slate-500">
          삭제되었거나 주소가 잘못되었을 수 있어요.
        </p>
        <Link
          href="/diary"
          className="mt-8 text-center text-sm font-semibold text-sequence-teal underline decoration-sequence-teal/30 underline-offset-2 dark:text-[#5ee9b5] dark:decoration-[#5ee9b5]/40"
        >
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-50">
          일기 수정
        </h1>
        <p className="mt-1.5 text-sm text-slate-400 dark:text-slate-500">
          내용을 고친 뒤 저장하세요.
        </p>
      </div>

      <DiaryEditForm key={entry.id} entry={entry} userId={user.id} />
    </div>
  );
}
