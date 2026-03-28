# OWASP 기반 보안 감사 리포트

**범위**: `frontend/` (Next.js App Router, Supabase 클라이언트)  
**기준**: 프로젝트 스킬 `owasp-security-audit` (OWASP Top 10 정렬, 정적 코드 검토)  
**참고**: 저장소 내 **애플리케이션 코드에 `bcrypt` 호출 없음**. 비밀번호 저장·해싱은 **Supabase Auth**에 위임되므로 `saltRounds`는 이 코드베이스에서 검증 불가. 회원가입 UI는 **최소 6자**만 요구함(아래 표 참고).

---

| 일련번호 | 심각도 | 파일 | 위치 | 문제 | 권고사항 |
|---|---|---|---|---|---|
| 1 | High | `frontend/app/diary/page.tsx` | 59–61행 근처 (`useEffect` 내 쿼리 빌드) | 검색어는 `sanitizeDiarySearchTerm`(`frontend/lib/diary-search.ts`)을 거친 뒤 `%${term}%` 형태의 패턴을 만들어 `.or()` 인자 문자열에 **템플릿으로 삽입**함. PostgREST/Supabase 필터 문자열은 **쉼표·괄호·점(연산자 구분)** 등으로 조건이 쪼개지므로, 클라이언트 측 치환만으로는 **문법 탈출·조건 조각 추가** 위험을 완전히 없애기 어렵다. RLS로 **타 사용자 행 노출**은 막혀 있어도, **본인 데이터에 대한 의도치 않은 매칭·400 오류·부하** 등 **무결성·가용성** 측면에서 주입 계열(OWASP **A03:2021 Injection**에 근접)로 본다. | **권장**: (1) Postgres `SECURITY DEFINER` RPC 또는 Route Handler에서 **파라미터 바인딩**된 `ILIKE`/FTS만 사용. (2) 클라이언트에 문자열 필터를 남길 경우 PostgREST **값 인용·이스케이프 규칙**과 일치하는 전용 함수 + **단위·회귀 테스트**로 고정(3번 항목과 함께 정리). `.filter()` 등 SDK가 **값을 분리 전달**하는 경로가 있으면 `.or()` 원시 문자열 조립보다 우선 검토. |
| 2 | High | `frontend/contexts/AuthContext.tsx`, `frontend/app/diary/page.tsx`, `frontend/app/diary/[id]/page.tsx`, `frontend/app/diary/new/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx`, `frontend/app/login/page.tsx`, `frontend/app/signup/page.tsx` | `AuthContext` 71·83행; `diary/page` 68–69행; `diary/[id]/page` 32·67행; `diary/new` 63행; `diary/[id]/edit` 56·168행; 로그인·회원가입 `result.message` 표시 | Supabase·GoTrue 오류 시 **`error.message` / `result.message`를 사용자에게 그대로 노출**. 운영 환경에서 DB·스키마·정책 관련 힌트가 섞일 수 있음. | 사용자에게는 **고정 문구**(예: "요청을 처리할 수 없습니다")만 보이게 하고, 상세는 **서버 로그·모니터링**으로만 수집. 코드·환경별로 매핑 테이블을 두는 방식을 권장. |
| 3 | Medium | `frontend/lib/diary-search.ts` | `sanitizeDiarySearchTerm` | `diary/page`의 `.or()` 결합을 전제로 일부 메타문자를 제거하지만, **PostgREST 필터 파싱** 관점에서 필요한 전체 규칙이 여기에 명시·검증되어 있지 않음. | 1번 권고와 동일하게 **필터 문자열 조립을 제거**하는 설계가 가장 안전. 유지 시 필터 문법 문서와 일치하는 sanitize·단위 테스트를 추가할 것. |
| 4 | Medium | `frontend/app/signup/page.tsx` | 28–29행 근처 | 비밀번호를 **최소 6자**만 요구. OWASP/NIST 권고 수준의 길이·복잡도(또는 무의미한 길이 중심 정책)와 비교 시 **계정 탈취 저항**이 낮음. | 정책(최소 길이, 흔한 비밀번호 차단 등)을 조직 기준에 맞게 상향하고, 가능하면 **이중 인증**을 검토할 것. |
| 5 | Medium | `frontend/middleware.ts` | 40–48행 | 인증 리다이렉트가 **`pathname.startsWith("/diary")`** 로만 적용됨. 향후 `/settings` 등 보호 구역이 늘어날 때 미들웨어 갱신이 누락되면 **우회** 가능. | 보호 경로를 **허용 목록/거부 목록**으로 중앙 관리하고, 라우트 추가 시 체크리스트에 포함할 것. 현재 구조는 Supabase `getUser()`와 쿠키 동기화 패턴 자체는 일반적임. |
