"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) => e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q),
    );
  }, [entries, searchQuery]);

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
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-16 sm:px-8">
        <p className="text-center text-sm font-medium text-slate-400 dark:text-slate-500">불러오는 중…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-16 sm:px-8">
        <p className="text-center text-sm font-medium text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-10 sm:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-50">
            내 일기
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 dark:text-slate-500">
            기록을 시간순으로 모아 두었어요.
          </p>
        </div>
        <Link
          href="/diary/new"
          className="hidden shrink-0 rounded-lg bg-sequence-mint px-5 py-2.5 text-sm font-semibold text-sequence-teal shadow-sm transition hover:brightness-95 sm:inline-flex"
        >
          새 일기 작성
        </Link>
      </div>

      <div className="mb-6">
        <label htmlFor="diary-search" className="sr-only">
          일기 검색
        </label>
        <input
          id="diary-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="제목이나 내용으로 검색…"
          autoComplete="off"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] outline-none placeholder:text-slate-400 focus:border-sequence-teal/35 focus:ring-2 focus:ring-sequence-teal/15 dark:border-slate-600 dark:bg-[#022c28]/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#5ee9b5]/50 dark:focus:ring-[#5ee9b5]/20"
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState />
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white px-6 py-14 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800 dark:bg-[#022c28]/40">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            &quot;{searchQuery.trim()}&quot;에 맞는 일기가 없어요.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-sm font-semibold text-sequence-teal underline decoration-sequence-teal/30 underline-offset-2 dark:text-[#5ee9b5] dark:decoration-[#5ee9b5]/40"
          >
            검색 지우기
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {filteredEntries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/diary/${entry.id}`}
                className="block rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition hover:border-sequence-teal/15 hover:shadow-[0_12px_40px_rgb(0,75,68,0.08)] dark:border-slate-800 dark:bg-[#022c28]/60 dark:hover:border-[#5ee9b5]/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">
                    {entry.title}
                  </h2>
                  <MoodBadge mood={entry.mood} />
                </div>
                <p className="mt-3 text-sm tabular-nums text-slate-400 dark:text-slate-500">
                  {formatDate(entry.created_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/diary/new"
        className="fixed bottom-8 right-6 z-20 inline-flex items-center justify-center rounded-full bg-sequence-mint px-6 py-3.5 text-sm font-semibold text-sequence-teal shadow-[0_8px_30px_rgb(0,245,160,0.35)] transition hover:brightness-95 sm:hidden"
        aria-label="새 일기 작성"
      >
        새 일기
      </Link>
    </div>
  );
}
