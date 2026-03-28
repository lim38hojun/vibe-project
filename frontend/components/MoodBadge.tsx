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
        "inline-flex items-center gap-1.5 rounded-full border border-sequence-teal/15 bg-sequence-teal/[0.06] px-2.5 py-0.5 text-sm font-medium text-sequence-teal dark:border-[#5ee9b5]/25 dark:bg-[#5ee9b5]/10 dark:text-[#5ee9b5]",
        className,
      )}
    >
      <span aria-hidden>{getMoodEmoji(mood)}</span>
      <span>{getMoodLabel(mood)}</span>
    </span>
  );
}
