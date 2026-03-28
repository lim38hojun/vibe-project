import Link from "next/link";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "아직 작성한 일기가 없어요",
  description = "오늘 하루를 짧게라도 남겨 보세요.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <p className="text-lg font-medium text-zinc-800 dark:text-zinc-100">{title}</p>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      <Link
        href="/diary/new"
        className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        새 일기 작성
      </Link>
    </div>
  );
}
