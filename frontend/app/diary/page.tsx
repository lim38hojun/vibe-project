"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { MoodBadge } from "@/components/MoodBadge";
import { useAuth } from "@/contexts/AuthContext";
import { entryFromRow } from "@/lib/entries";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Entry } from "@/types";

export default function DiaryListPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error: qError } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (qError) {
        setError(qError.message);
        setEntries([]);
      } else {
        const rows = (data ?? []) as Array<{
          id: string;
          user_id: string;
          title: string;
          body: string;
          mood: string;
          created_at: string;
          updated_at: string;
        }>;
        setEntries(rows.map(entryFromRow).filter((e): e is Entry => e !== null));
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6">
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">불러오는 중…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6">
        <p className="text-center text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            내 일기
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            기록을 시간순으로 모아 두었어요.
          </p>
        </div>
        <Link
          href="/diary/new"
          className="hidden shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 sm:inline-flex dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          새 일기 작성
        </Link>
      </div>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/diary/${entry.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                    {entry.title}
                  </h2>
                  <MoodBadge mood={entry.mood} />
                </div>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDate(entry.created_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/diary/new"
        className="fixed bottom-6 right-4 z-20 inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-zinc-800 sm:hidden dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        aria-label="새 일기 작성"
      >
        새 일기
      </Link>
    </div>
  );
}
