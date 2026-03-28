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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <MoodBadge mood={entry.mood} />
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {entry.title}
          </h1>
          <div className="mt-2 flex flex-col gap-0.5 text-sm text-zinc-500 dark:text-zinc-400 sm:flex-row sm:gap-3">
            <span>작성 {formatDate(entry.created_at)}</span>
            <span>수정 {formatDate(entry.updated_at)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/diary/${entry.id}/edit`}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            수정
          </Link>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
          >
            삭제
          </button>
        </div>
      </div>

      <article>
        <div className="whitespace-pre-wrap rounded-xl border border-zinc-200 bg-white p-5 text-[15px] leading-relaxed text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
          {entry.body}
        </div>
      </article>

      <div className="mt-10">
        <Link
          href="/diary"
          className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          ← 목록으로
        </Link>
      </div>
    </div>
  );
}
