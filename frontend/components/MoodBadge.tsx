import { getMoodEmoji, getMoodLabel } from "@/lib/mood";
import type { MoodCode } from "@/types";

import { cn } from "@/lib/utils";

type MoodBadgeProps = {
  mood: MoodCode;
  className?: string;
};

export function MoodBadge({ mood, className }: MoodBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100",
        className,
      )}
    >
      <span aria-hidden>{getMoodEmoji(mood)}</span>
      <span>{getMoodLabel(mood)}</span>
    </span>
  );
}
