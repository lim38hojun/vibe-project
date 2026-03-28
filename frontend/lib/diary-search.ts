const MAX_TERM_LEN = 200;

/**
 * PostgREST `.or()` 필터와 `ilike` 패턴을 안전하게 쓰기 위해 검색어를 정리합니다.
 */
export function sanitizeDiarySearchTerm(raw: string): string {
  return raw
    .trim()
    .slice(0, MAX_TERM_LEN)
    .replace(/[%*_]/g, "")
    .replace(/,/g, " ")
    .replace(/"/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
