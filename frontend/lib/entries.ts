import type { Entry, MoodCode } from "@/types";
import { MOOD_MAP } from "@/types";

export function isMoodCode(value: string): value is MoodCode {
  return Object.prototype.hasOwnProperty.call(MOOD_MAP, value);
}

export function entryFromRow(row: {
  id: string;
  user_id: string;
  title: string;
  body: string;
  mood: string;
  drawing?: string | null;
  created_at: string;
  updated_at: string;
}): Entry | null {
  if (!isMoodCode(row.mood)) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    body: row.body,
    mood: row.mood,
    drawing: row.drawing ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
