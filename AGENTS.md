# AGENTS.md — 프로젝트 규칙 (AI 코딩 지침)

이 저장소에서 코드를 작성·수정할 때 아래 규칙을 **반드시** 따른다. 초보 개발자가 매번 같은 설명을 반복하지 않도록 정리한 문서다.

---

## 기술 스택 (고정)

| 영역 | 선택 |
|------|------|
| 프레임워크 | **Next.js** — **App Router** (`app/` 디렉터리)만 사용 |
| 언어 | **TypeScript** (`.ts`, `.tsx`) |
| 스타일 | **Tailwind CSS** |
| 데이터베이스·백엔드(클라이언트 연동) | **Supabase** |

레거시 **Pages Router** (`pages/`)로 새 기능을 만들지 않는다.

---

## 반드시 지켜야 할 것 (DO)

- **App Router 규약**  
  - 라우트는 `app/` 아래 `page.tsx`, `layout.tsx`, `route.ts` 등 공식 패턴을 따른다.  
  - 서버/클라이언트 경계가 필요하면 `'use client'`를 **필요한 컴포넌트에만** 최소 범위로 둔다.

- **TypeScript**  
  - 새 파일은 기본적으로 `.ts` 또는 `.tsx`다.  
  - `any` 대신 구체적인 타입, `unknown`, 또는 Supabase 생성 타입을 사용한다.

- **Tailwind CSS**  
  - 스타일은 우선 유틸리티 클래스로 작성한다.  
  - 공통 패턴은 `@apply`나 컴포넌트 추출로 정리하되, **인라인 `style={{}}` 남용**은 피한다.

- **Supabase**  
  - DB 접근·인증·스토리지는 Supabase 클라이언트/SDK를 사용한다.  
  - 환경 변수(`NEXT_PUBLIC_*`, 서버 전용 시크릿)로 키를 관리하고, 키를 코드에 하드코딩하지 않는다.  
  - RLS(행 수준 보안) 정책을 전제로 한 쿼리 패턴을 유지한다.

- **Next.js 품질**  
  - 이미지는 가능하면 `next/image`, 링크는 `next/link`를 사용한다.  
  - 메타데이터는 App Router의 `metadata`/`generateMetadata` 패턴을 사용한다.

- **일관성**  
  - 기존 파일의 import 순서, 따옴표 스타일, 컴포넌트 분리 방식을 맞춘다.

---

## 하면 안 되는 것 (DON'T)

- **Pages Router**로 새 페이지·API를 추가하지 않는다 (`pages/` 신설 지양).

- **`@ts-ignore` / `@ts-expect-error` 남용**으로 타입 오류를 덮어쓰지 않는다.  
  - 정말 필요하면 이유를 주석으로 짧게 남긴다.

- **CSS-in-JS 라이브러리**(styled-components, Emotion 등)나 **일반 CSS 모듈**을 **기본 스타일 수단으로 새로 도입**하지 않는다.  
  - 이미 프로젝트에 없다면 Tailwind만 쓴다.

- **다른 BaaS/DB 클라이언트**(Firebase, PlanetScale 전용 SDK 등)를 **데이터 영속** 목적으로 끼워 넣지 않는다.  
  - Supabase가 담당한다.

- **민감 정보**를 소스·로그·클라이언트 번들에 넣지 않는다.

- **불필요한 `'use client'`**로 전체 레이아웃을 클라이언트 컴포넌트로 만들지 않는다.

- **요청 범위 밖의 대규모 리팩터**(폴더 구조 전면 변경, 스택 교체)를 임의로 수행하지 않는다.

---

## 요약 한 줄

**Next.js App Router + TypeScript + Tailwind + Supabase**만 사용하고, Pages Router·임의 DB·CSS-in-JS 기본 도입·타입 무시·시크릿 노출은 하지 않는다.
