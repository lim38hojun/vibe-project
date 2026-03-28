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
  /** PNG 바이너리를 base64로 인코딩한 문자열(data: 접두어 없음). 없으면 null */
  drawing: string | null;
  created_at: string;
  updated_at: string;
}
