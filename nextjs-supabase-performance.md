# Next.js + Supabase 성능 감사 리포트

**범위**: `frontend/` (Next.js App Router, Supabase 브라우저 클라이언트)  
**기준**: 프로젝트 스킬 `nextjs-supabase-performance-audit` (정적 코드·구조 검토)  
**가정**: 프로덕션 빌드 기준으로 서술하되, React Strict Mode는 개발 환경에서 페칭·이펙트 중복을 가중할 수 있음.

---

| 일련번호 | 심각도 | 파일 | 위치 | 문제 | 권고사항 |
|---|---|---|---|---|---|
| 1 | High | `frontend/app/diary/page.tsx` | 53–55행 `.select("*")` | 목록 UI는 제목·날짜·기분 위주인데 `body`와 `drawing`(대용량 base64 가능)까지 매 행마다 조회한다. JSON 디코딩·전송·메모리 사용이 불필요하게 커진다. | 목록 전용으로 필요한 컬럼만 `select` (예: `id,title,mood,created_at,updated_at`). 본문·그림은 상세·편집 화면에서만 조회한다. |
| 2 | High | `frontend/lib/supabase/client.ts` | `createClient` 함수 본문 | 호출할 때마다 `createBrowserClient`로 **새 인스턴스**를 만든다. 이펙트·핸들러·페이지 곳곳에서 반복 호출되면 내부 구독·리소스가 중복될 여지가 있다. | 브라우저에서는 **모듈 단일 인스턴스**(lazy singleton)로 재사용하거나, 공식 문서가 권장하는 `@supabase/ssr` 브라우저 패턴을 따른다. |
| 3 | Medium | `frontend/app/diary/page.tsx` | 38–94행 `useEffect` 의존성 `[user, debouncedSearch]` | `user`는 `AuthContext`에서 객체로 내려오며, 동일 `id`라도 참조가 바뀌면 이펙트가 다시 돌아 **목록 쿼리가 재실행**될 수 있다. | 의존성을 `user?.id` 등 **안정적인 원시 키**로 좁히고, Supabase 호출에는 해당 id만 사용한다. |
| 4 | Medium | `frontend/app/diary/page.tsx`, `frontend/app/diary/[id]/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx` | 각 페이지의 클라이언트 `useEffect` 페칭 | Next `fetch` 캐시·`revalidate`, SWR/React Query 등 **데이터 캐시 계층 없이** 라우트 진입마다 Supabase를 직접 호출한다. 목록↔상세 이동이 잦을수록 동일 데이터를 반복 요청하기 쉽다. | 자주 재방문하는 목록/상세에 **stale-time 있는 클라이언트 캐시**를 두거나, 초기 데이터는 **서버 컴포넌트·Route Handler**에서 넘기는 방식을 검토한다. |
| 5 | Medium | `frontend/app/diary/new/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx` | `insert`/`update` 후 `.select()` · `.select().single()` | 응답으로 **전 컬럼**을 돌려받는다. `drawing`이 크면 저장 직후 응답 페이로드만 과도해진다. | 리다이렉트에 필요한 최소 필드만 `.select('id')` 등으로 제한한다. |
| 6 | Medium | `frontend/app/diary/[id]/page.tsx` | 173–177행 그림 `<img>` | `data:image/png;base64,...`는 CDN 최적화 이점이 제한적이나, **고정 intrinsic 치수** 없이 `max-h`·`w-full`만 두면 디코딩 전후 **레이아웃 변동(CLS)** 여지가 있다. | `width`/`height` 또는 `aspect-ratio`·고정 높이 플레이스홀더로 공간을 예약하고, 필요 시 `next/image`의 `unoptimized` 등 정책을 문서화한다. |
| 7 | Medium | `frontend/app/layout.tsx` | 9–13행 `Noto_Sans_KR` | 한글 UI인데 `subsets: ["latin"]`만 지정되어 있다. 한글 글리프·서브셋 분할 전략이 기대와 다를 수 있다. | `korean`(및 필요 시 `latin`) 서브셋을 명시하고, `display: "swap"` 등 로딩 정책을 맞춘다. |
| 8 | Medium | `frontend/app/diary/new/page.tsx`, `frontend/app/diary/[id]/edit/page.tsx` | 상단 `import { DrawingPad }` | 작성·수정 진입 시 **캔버스·터치 로직**이 항상 해당 라우트 초기 번들에 포함된다. | `next/dynamic`으로 `DrawingPad`를 지연 로드하고 짧은 로딩 폴백을 둔다. |
| 9 | Medium | `frontend/contexts/AuthContext.tsx` | 47–61행 초기 세션 | `getUser().then`과 `onAuthStateChange`가 연속으로 `setUser`를 호출해 **렌더가 여러 번** 일어나고, 하위 페이지 이펙트가 `user` 전체에 묶여 있으면 **연쇄 페칭**이 생기기 쉽다. 개발 모드 Strict Mode는 이중 마운트로 한층 두드러진다. | 초기 세션 확정 경로를 단순화하거나, 데이터 페칭 이펙트는 `user.id` 같은 안정 키에만 반응하도록 맞춘다(3번과 연계). |

---

**요약**: N+1 형태의 목록+항목별 반복 쿼리나 대형 라이브러리 남용은 발견되지 않았다. 다만 **목록에서 `select *`로 `drawing`/`body`까지 가져오는 것**과 **브라우저 Supabase 클라이언트의 반복 생성**은 데이터량·규모가 커질수록 병목으로 바로 드러날 수 있어 High로 표시했다. 나머지는 캐싱·의존성·폰트 서브셋·이미지 레이아웃·코드 스플릿 등 **중간 우선순위 개선**으로 분류했다.
