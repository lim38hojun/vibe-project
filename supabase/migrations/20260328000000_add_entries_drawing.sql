-- 일기에 그린 그림(PNG base64, data: 접두어 없음) 저장
ALTER TABLE public.entries
ADD COLUMN IF NOT EXISTS drawing text NULL;

COMMENT ON COLUMN public.entries.drawing IS 'Optional PNG as raw base64 (no data:image prefix)';
