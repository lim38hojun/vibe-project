# OWASP 기반 보안 감사 리포트

**범위**: `frontend/` (Next.js App Router, Supabase 클라이언트)  
**기준**: 프로젝트 스킬 `owasp-security-audit` (OWASP Top 10 정렬, 정적 코드 검토)  
**참고**: 저장소 내 **애플리케이션 코드에 `bcrypt` 호출 없음**. 비밀번호 저장·해싱은 **Supabase Auth**에 위임되므로 `saltRounds`는 이 코드베이스에서 검증 불가. 회원가입 UI는 **최소 6자**만 요구함(아래 표 참고).

---

| 일련번호 | 심각도 | 파일 | 위치 | 문제 | 권고사항 |
|---|---|---|---|---|---|
| 1 | High | `frontend/app/diary/page.tsx` | 59–61행 근처 (`useEffect` 내 쿼리 빌드) | 검색어로 만든 `pattern`을 `.or(\`title.ilike.${pattern},body.ilike.${pattern}\`)`에 **문자열 삽입**함. PostgREST 필터 문법 조작(예: 일부 특수문자) 가능성이 있어 전통적 SQLi와는 다르지만 **주입 계열 취약점**으로 분류됨. | RPC·서버 전용 쿼리로 이전하거나, SDK의 안전한 필터 API만 사용. 불가피하면 **화이트리스트·이스케이프**를 필터 문법에 맞게 정의하고 회귀 테스트로 고정할 것. |
| 2 | High | `frontend/contexts/AuthContext.tsx`, `frontend/app/diary/page.tsx`, `frontend/app/diary/[id]/page.tsx`, `frontend/app/diary/new/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx`, `frontend/app/login/page.tsx`, `frontend/app/signup/page.tsx` | `AuthContext` 71·83행; `diary/page` 68–69행; `diary/[id]/page` 32·67행; `diary/new` 63행; `diary/[id]/edit` 56·168행; 로그인·회원가입 `result.message` 표시 | Supabase·GoTrue 오류 시 **`error.message` / `result.message`를 사용자에게 그대로 노출**. 운영 환경에서 DB·스키마·정책 관련 힌트가 섞일 수 있음. | 사용자에게는 **고정 문구**(예: "요청을 처리할 수 없습니다")만 보이게 하고, 상세는 **서버 로그·모니터링**으로만 수집. 코드·환경별로 매핑 테이블을 두는 방식을 권장. |
| 3 | Medium | `frontend/lib/diary-search.ts` | `sanitizeDiarySearchTerm` | `diary/page`의 `.or()` 결합을 전제로 일부 메타문자를 제거하지만, **PostgREST 필터 파싱** 관점에서 필요한 전체 규칙이 여기에 명시·검증되어 있지 않음. | 1번 권고와 동일하게 **필터 문자열 조립을 제거**하는 설계가 가장 안전. 유지 시 필터 문법 문서와 일치하는 sanitize·단위 테스트를 추가할 것. |
| 4 | Medium | `frontend/app/signup/page.tsx` | 28–29행 근처 | 비밀번호를 **최소 6자**만 요구. OWASP/NIST 권고 수준의 길이·복잡도(또는 무의미한 길이 중심 정책)와 비교 시 **계정 탈취 저항**이 낮음. | 정책(최소 길이, 흔한 비밀번호 차단 등)을 조직 기준에 맞게 상향하고, 가능하면 **이중 인증**을 검토할 것. |
| 5 | Medium | `frontend/middleware.ts` | 40–48행 | 인증 리다이렉트가 **`pathname.startsWith("/diary")`** 로만 적용됨. 향후 `/settings` 등 보호 구역이 늘어날 때 미들웨어 갱신이 누락되면 **우회** 가능. | 보호 경로를 **허용 목록/거부 목록**으로 중앙 관리하고, 라우트 추가 시 체크리스트에 포함할 것. 현재 구조는 Supabase `getUser()`와 쿠키 동기화 패턴 자체는 일반적임. |
