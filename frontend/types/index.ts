export const MOOD_MAP = {
  happy: { label: "행복", emoji: "😊" },
  sad: { label: "슬픔", emoji: "😢" },
  angry: { label: "화남", emoji: "😠" },
  calm: { label: "평온", emoji: "😌" },
  tired: { label: "피곤", emoji: "😴" },
} as const;

export type MoodCode = keyof typeof MOOD_MAP;

export interface Entry {
  id: string;
  user_id: string;
  title: string;
  body: string;
  mood: MoodCode;
  created_at: string;
  updated_at: string;
}
