"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MoodBadge } from "@/components/MoodBadge";
import { useAuth } from "@/contexts/AuthContext";
import { entryFromRow } from "@/lib/entries";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Entry } from "@/types";

export default function DiaryDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const router = useRouter();
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

  async function handleDelete() {
    if (!user || !entry) return;
    const ok = window.confirm("이 일기를 삭제할까요? 삭제하면 되돌릴 수 없습니다.");
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("entries").delete().eq("id", entry.id);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.push("/diary");
  }

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
      <div className="mb-8 flex flex-col gap-6 rounded-2xl border border-slate-100 bg-sequence-teal p-8 text-white shadow-[0_8px_30px_rgb(0,75,68,0.2)] sm:flex-row sm:items-start sm:justify-between dark:border-slate-800 dark:shadow-none">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <MoodBadge mood={entry.mood} className="border-white/25 bg-white/10 text-white dark:border-white/25 dark:bg-white/10 dark:text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            {entry.title}
          </h1>
          <div className="mt-3 flex flex-col gap-1 text-xs font-medium tabular-nums text-white/70 sm:flex-row sm:gap-4">
            <span>작성 {formatDate(entry.created_at)}</span>
            <span>수정 {formatDate(entry.updated_at)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/diary/${entry.id}/edit`}
            className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            수정
          </Link>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="inline-flex items-center justify-center rounded-lg border border-red-300/50 bg-red-500/15 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/25"
          >
            삭제
          </button>
        </div>
      </div>

      <article>
        <div className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-white p-8 text-[15px] leading-relaxed text-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800 dark:bg-[#022c28]/70 dark:text-slate-200">
          {entry.body}
        </div>
      </article>

      <div className="mt-10">
        <Link
          href="/diary"
          className="text-sm font-semibold text-sequence-teal underline decoration-sequence-teal/30 underline-offset-2 dark:text-[#5ee9b5] dark:decoration-[#5ee9b5]/40"
        >
          ← 목록으로
        </Link>
      </div>
    </div>
  );
}
