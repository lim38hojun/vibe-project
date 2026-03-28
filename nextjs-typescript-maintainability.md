# Next.js + TypeScript 유지보수·구조 감사 리포트

**범위**: `frontend/` (Next.js App Router, TypeScript)  
**기준**: 프로젝트 스킬 `nextjs-typescript-maintainability-audit` (정적 코드·구조 검토)  
**가정**: 본 리포트는 소스 읽기·검색 기준이며, 빌드·린트 실행 결과는 포함하지 않음.

---

| 일련번호 | 우선순위 | 파일 | 위치 | 문제 | 권고사항 |
|---|---|---|---|---|---|
| 1 | High | `frontend/app/diary/[id]/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx` | 상세 `useEffect`(23–58행) vs 편집 `useEffect`(159–194행); 오류·로딩·미존재 UI(77–131행 vs 200–254행) | 단일 일기 `select`·`entryFromRow`·소유자 검증·취소 플래그 패턴과, `!id`/`loading`/`loadError`/`!entry` 분기 JSX가 **거의 동일하게 이중 정의**되어 있다. 한쪽 수정 시 다른 쪽 누락(버그) 위험이 크다. | `useDiaryEntry(id, userId)` 같은 **커스텀 훅**과 `DiaryEntryGate`(로딩·에러·빈 상태) **공통 컴포넌트**로 추출해 단일 출처로 맞춘다. |
| 2 | High | `frontend/app/diary/page.tsx`, `frontend/app/diary/[id]/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx` | 목록 72–81행; 상세 37–46행; 편집 173–182행 | Supabase 행 객체에 대한 **동일한 인라인 타입 + `as` 단언**이 세 파일에 반복된다. `entryFromRow`의 매개변수 형태와 중복되어 계약이 분산된다. | `lib/entries.ts`에 `EntryRow` 등 **한 번만 정의한 타입**을 두고 `entryFromRow(row)`에 넘기거나, `Parameters<typeof entryFromRow>[0]`로 재사용한다. |
| 3 | Medium | `frontend/app/diary/new/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx` 내 `DiaryEditForm` | 새 일기 폼(85–166행) vs 수정 폼(67–147행) | 제목·본문·그림 패드·기분 토글·에러·취소/저장 버튼·`handleSubmit` 검증(빈 필드, 그림 용량)이 **구조적으로 거의 같다**. 신규 필드 추가 시 두 곳을 동시에 고쳐야 한다. | `DiaryEntryForm` 등 공통 폼 컴포넌트에 `mode: 'create' \| 'update'`·초기값·제출 핸들러만 주입하는 방식으로 **한 컴포넌트로 통합**하거나, 필드·기분 선택 UI를 하위 컴포넌트로 쪼갠다. |
| 4 | Medium | `frontend/app/diary/page.tsx` | `DiaryListPage` 전체(17–212행) | 한 컴포넌트에 **인증 가드·디바운스·목록 페칭·검색 UI·빈 상태·리스트·FAB**가 모두 들어 있어 50줄 기준을 크게 넘고 SRP가 흐려진다. | 페칭+상태를 `useDiaryEntries` 훅으로, 검색 입력+결과 영역을 `DiaryListToolbar` / `DiaryEntryList` 등으로 **분리**한다. |
| 5 | Medium | `frontend/app/diary/[id]/edit/page.tsx` | `DiaryEditForm`(17–149행) | 폼 하나가 **상태·검증·Supabase update·라우팅**까지 담당하며 100줄을 넘긴다. | `handleSubmit`의 Supabase 호출을 `lib` 또는 `actions`로 옮기고, 폼은 **표현+로컬 상태**에 집중시킨다. |
| 6 | Medium | `frontend/app/login/page.tsx`, `frontend/app/signup/page.tsx` | 페이지 래퍼·카드 폼·입력 `className`·에러 `<p>`·하단 링크(34–101행 vs 51–137행) | 레이아웃과 스타일 클래스가 **거의 동일한 인증 폼 껍데기**로 복제되어 있다. | `AuthFormLayout`, `AuthTextField` 등 **공통 래퍼/필드**로 추출하거나, 공유 상수로 input 클래스 문자열을 한곳에서 관리한다. |
| 7 | Medium | `frontend/app/**/*.tsx` (다수) | 각 파일 상단 `"use client"` | 루트 `layout.tsx`는 서버 컴포넌트이나, 홈 리다이렉트·일기 목록·상세 등 **페이지 대부분이 클라이언트 전체**다. 유지보수 시 서버에서 할 수 있는 데이터 준비·리다이렉트와의 경계가 흐려진다. | 인터랙션이 필요한 최소 단위만 클라이언트로 두고, **가능한 부분은 서버 컴포넌트·서버 데이터 패칭**으로 옮기는 방향을 단계적으로 검토한다. |
| 8 | Low | `frontend/app/diary/new/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx` | `MAX_DRAWING_BASE64_LEN`(각 14–15행) | 동일 **매직 상수**가 두 파일에 중복 정의되어 있다. | `lib/constants.ts` 또는 `DrawingPad` 인접 모듈로 **한 곳에서 export**한다. |
| 9 | Low | `frontend/app/diary/page.tsx` vs 상세·편집 | 상태명 `error` vs `loadError` | 같은 개념(조회/목록 실패 메시지)인데 **이름이 파일마다 다르다**. | 팀 컨벤션으로 `fetchError` 등 **통일된 접두어**를 정하거나, 훅 반환 객체에 맞춘다. |
| 10 | Low | `frontend/app/layout.tsx` | `Noto_Sans_KR` → `variable: "--font-geist-sans"` | 폰트는 Noto Sans KR인데 CSS 변수명이 **Geist 계열**로 남아 있어 읽는 사람에게 혼동을 준다. | `--font-sans` 등 **실제 폰트와 일치하는 변수명**으로 바꾸고 `globals.css` 참조를 함께 정리한다. |

---

**요약**: `any` 사용은 확인되지 않았다. 가장 큰 유지보수 리스크는 **상세·편집 간 일기 로드·에러 UI 중복**과 **Supabase 행 타입의 삼중 복제**다. 그다음으로 **새 일기/수정 폼**·**로그인/회원가입 껍데기**의 구조적 중복, **일기 목록 페이지의 과대 컴포넌트**를 정리할 가치가 있다.
