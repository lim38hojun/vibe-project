# Next.js + TypeScript 유지보수 점검 리포트

**범위**: `frontend/` 이하 App Router 애플리케이션(`app/`, `components/`, `contexts/`, `lib/`, `types/`).  
**가정**: Supabase 스키마는 `entries` 테이블 중심이며, 감사는 정적 코드 읽기·검색·ESLint 1회 실행에 기반한다. `any` 키워드는 TypeScript 소스에서 검색 결과가 없었다.

---

| 일련번호 | 우선순위 | 파일 | 위치 | 문제 | 권고사항 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | High | `frontend/lib/entries.ts`, `frontend/app/diary/page.tsx`, `frontend/app/diary/[id]/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx` | `entryFromRow` 인자 타입 vs 각 파일 72~81·37~46·173~182행 근처 | DB 행 스키마가 `entryFromRow`와 동일한 객체 리터럴 타입으로 **세 페이지에서 반복 캐스팅**되어 단일 진실 공급원이 없음 | `EntryRow`(또는 동일 의미의 타입)를 `entries.ts`에서 export하고 `entryFromRow`·`select` 결과 매핑에만 사용; 가능하면 Supabase CLI 생성 타입과 연동 |
| 2 | High | `frontend/app/diary/[id]/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx` | `useEffect` 내 단건 조회·`PGRST116` 처리·`entryFromRow`·소유자 검증 (각 약 23~58행·159~194행) | **동일한 클라이언트 페칭·에러 분기**가 두 라우트에 복제되어 변경 시 이중 수정 위험 | `useDiaryEntry(id)` 등 커스텀 훅 또는 공유 데이터 레이어로 추출 |
| 3 | Medium | `frontend/app/diary/new/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx` (`DiaryEditForm`) | 폼 전체·`MOOD_OPTIONS` 맵·`DrawingPad`·`MAX_DRAWING_BASE64_LEN`·유사 `className` | **새 일기 / 수정 폼**이 구조·검증·스타일 면에서 대량 중복 | 공통 `DiaryForm`(또는 필드·기분·액션 바 분리)로 모드(`create` \| `edit`)만 분기 |
| 4 | Medium | `frontend/app/diary/[id]/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx` | 로딩·에러·없음 시 `목록으로` 링크가 있는 블록 (여러 분기) | **동일 UX 패턴**이 긴 JSX로 반복 | `DiaryStatusPanel` 등 소형 컴포넌트로 메시지·링크만 props화 |
| 5 | Medium | `frontend/app/diary/page.tsx` | 전체(약 17~213행) | **목록 조회·디바운스·첫 로드 플래그·검색·리스트 UI**가 한 컴포넌트에 집중되어 50줄 기준을 크게 초과, SRP 흐림 | `useDiaryListQuery(debouncedSearch)` 등 훅 분리 및 프레젠테이션 컴포넌트(`DiaryListToolbar`, `DiaryList`)로 쪼개기 |
| 6 | Medium | `frontend/app/diary/[id]/edit/page.tsx` | `DiaryEditForm` (약 17~148행) | 폼 상태·검증·Supabase `update`·무드 UI가 **한 덩어리**로 50줄 이상 | 별도 파일(`DiaryEditForm.tsx`) 분리 또는 필드 그룹 컴포넌트·제출 로직 훅으로 분리 |
| 7 | Medium | `frontend/app/diary/page.tsx` | `useEffect` 의존 `user?.id` (약 27~31행) | ESLint `react-hooks/set-state-in-effect` **오류**: effect 본문에서 동기 `setState`로 연쇄 렌더 유발 가능 | 초기화를 이벤트·키ed 리듀서·쿼리 키 기반 로딩으로 재구성하거나, 규칙과 합의된 패턴으로 정리 |
| 8 | Medium | `frontend/lib/supabase/server.ts` | 모듈 전체 | 프로젝트 내 **import가 없음**(클라이언트 `createClient`만 사용) | 서버 컴포넌트·Route Handler에서 쓸 계획이면 첫 사용처를 추가하고, 없으면 제거해 데드 코드를 없앰 |
| 9 | Medium | `frontend/app/diary/[id]/page.tsx` | 173~177행 (`<img>`) | Next 권고(`@next/next/no-img-element`): **최적화·LCP** 관점에서 유지보수·성능 이슈 | `next/image` 또는 정책상 data URL이면 로더·`unoptimized` 등 팀 규칙 문서화 |
| 10 | Low | 여러 diary·auth 페이지 | `error` vs `loadError` vs `qError` 등 | **에러 상태 변수명**이 파일마다 달라 동일 패턴 파악이 느림 | `fetchError`·`queryError` 등 역할별 접두사를 팀 단위로 통일 |
| 11 | Low | `frontend/app/layout.tsx` | 9~13행 (`Noto_Sans_KR` → `--font-geist-sans`) | CSS 변수명이 **Geist**를 가리키나 실제 폰트는 Noto | `--font-sans` 등 실제 폰트와 일치하는 토큰명으로 변경 |
| 12 | Low | `frontend/app/login/page.tsx`, `frontend/app/signup/page.tsx` | 폼 래퍼·필드 스타일 | 레이아웃·입력 필드 클래스가 **거의 동일** | 선택적으로 `AuthFormShell` 등으로 래퍼만 추출(과도한 추상화는 지양) |
| 13 | Low | `frontend/components/DrawingPad.tsx` | 153행 `style={{ aspectRatio: ... }}` | 프로젝트는 Tailwind 우틸 우선 가이드; **인라인 스타일** 소량 | 가능하면 Tailwind arbitrary property 등으로 이전 검토(캔버스 비율 제약이 까다로우면 현상 유지도 타당) |
| 14 | Low | `frontend/app/login/page.tsx` 등 | `onSubmit={handleSubmit}` vs 타 페이지 `void handleSubmit` | async 핸들러 전달 방식이 **파일마다 미세하게 상이** | `onSubmit={(e) => void handleSubmit(e)}` 등 한 가지 패턴으로 통일 |

---

**적용 스킬**: `.cursor/skills/senior-nextjs-architect-maintainability-audit/SKILL.md`
