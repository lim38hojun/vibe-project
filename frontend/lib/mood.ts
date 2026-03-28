import { MOOD_MAP, type MoodCode } from "@/types";

export { MOOD_MAP, type MoodCode };

export const MOOD_OPTIONS = Object.keys(MOOD_MAP) as MoodCode[];

export function getMoodLabel(code: MoodCode): string {
  return MOOD_MAP[code].label;
}

export function getMoodEmoji(code: MoodCode): string {
  return MOOD_MAP[code].emoji;
}
