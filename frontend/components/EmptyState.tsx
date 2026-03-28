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
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-700 dark:bg-[#022c28]/40">
      <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{title}</p>
      <p className="max-w-sm text-sm leading-relaxed text-slate-400 dark:text-slate-500">{description}</p>
      <Link
        href="/diary/new"
        className="inline-flex items-center justify-center rounded-lg bg-sequence-mint px-5 py-2.5 text-sm font-semibold text-sequence-teal shadow-sm transition hover:brightness-95"
      >
        새 일기 작성
      </Link>
    </div>
  );
}
