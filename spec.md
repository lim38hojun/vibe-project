# 나만의 일기장 — 프로젝트 명세서 (Phase 1)

> 개인용 일기 작성·관리 웹 애플리케이션

---

## 1. 프로젝트 개요

| 항목       | 내용 |
|------------|------|
| **프로젝트명** | 나만의 일기장 |
| **목적**       | 사용자가 매일의 감정과 기록을 일기 형태로 작성·보관·관리할 수 있는 개인용 웹 앱 |
| **대상 사용자** | 이메일로 가입한 개인 사용자 (각 사용자는 본인의 일기만 접근 가능) |
| **Phase 1 범위** | 인증(회원가입/로그인/로그아웃), 일기 CRUD(작성/목록/상세/수정/삭제) |

---

## 2. 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | **Next.js (App Router)** | `app/` 디렉터리 기반, Pages Router 사용 금지 |
| 언어 | **TypeScript** | `.ts` / `.tsx` 전용 |
| 스타일링 | **Tailwind CSS** | 유틸리티 클래스 우선, CSS-in-JS 미사용 |
| 백엔드·인증·DB | **Supabase** | Auth(이메일+비밀번호), PostgreSQL, Storage |

### 환경 변수

| 변수명 | 용도 | 노출 범위 |
|--------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 클라이언트 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | 클라이언트 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 역할 키 (관리용) | 서버 전용 |

모든 키는 `.env.local`에서 관리하며 소스 코드에 하드코딩하지 않는다.

---

## 3. 기능별 상세

### 3.1 회원가입

| 항목 | 내용 |
|------|------|
| **페이지 경로** | `/signup` |
| **입력 필드** | 이메일, 비밀번호, 비밀번호 확인 |
| **동작** | Supabase Auth `signUp` 호출 → 성공 시 로그인 페이지로 이동 (이메일 확인 설정 시 안내 메시지 표시) |
| **유효성 검사** | 이메일 형식 확인, 비밀번호 최소 6자, 비밀번호·확인 일치 여부 |
| **에러 처리** | 이미 가입된 이메일 → 안내 메시지, 네트워크 오류 → 재시도 안내 |
| **Supabase 기능** | `supabase.auth.signUp({ email, password })` |

### 3.2 로그인

| 항목 | 내용 |
|------|------|
| **페이지 경로** | `/login` |
| **입력 필드** | 이메일, 비밀번호 |
| **동작** | Supabase Auth `signInWithPassword` 호출 → 성공 시 세션 생성, `/diary` (일기 목록)으로 이동 |
| **에러 처리** | 잘못된 자격 증명 → 안내 메시지 |
| **Supabase 기능** | `supabase.auth.signInWithPassword({ email, password })` |

### 3.3 로그아웃

| 항목 | 내용 |
|------|------|
| **위치** | 헤더 또는 내비게이션 영역의 로그아웃 버튼 |
| **동작** | `supabase.auth.signOut()` 호출 → 세션 제거 → `/login`으로 리다이렉트 |
| **Supabase 기능** | `supabase.auth.signOut()` |

### 3.4 일기 작성

| 항목 | 내용 |
|------|------|
| **페이지 경로** | `/diary/new` |
| **입력 필드** | 제목(`title`, 필수), 본문(`body`, 필수), 기분(`mood`, 필수 — 드롭다운 또는 아이콘 선택) |
| **기분 옵션** | `happy`(행복), `sad`(슬픔), `angry`(화남), `calm`(평온), `tired`(피곤) |
| **동작** | 폼 제출 → `entries` 테이블에 `INSERT` → 성공 시 작성된 일기 상세 페이지(`/diary/[id]`)로 이동 |
| **접근 제한** | 로그인 필수 (미인증 시 `/login`으로 리다이렉트) |
| **Supabase 기능** | `supabase.from('entries').insert({ title, body, mood, user_id })` — `user_id`는 `auth.uid()`로 자동 설정 |

### 3.5 일기 목록 조회

| 항목 | 내용 |
|------|------|
| **페이지 경로** | `/diary` |
| **동작** | 로그인한 사용자의 일기를 `created_at` 기준 **내림차순**(최신순)으로 표시 |
| **표시 항목** | 제목, 기분(이모지 또는 라벨), 작성일 |
| **항목 클릭** | 해당 일기 상세 페이지(`/diary/[id]`)로 이동 |
| **빈 상태** | 일기가 없을 때 "아직 작성된 일기가 없습니다" 안내 + 작성 버튼 |
| **접근 제한** | 로그인 필수 |
| **Supabase 기능** | `supabase.from('entries').select('*').eq('user_id', userId).order('created_at', { ascending: false })` |

### 3.6 일기 상세 조회

| 항목 | 내용 |
|------|------|
| **페이지 경로** | `/diary/[id]` |
| **동작** | URL 파라미터 `id`로 단건 조회 → 제목, 본문, 기분, 작성일, 수정일 표시 |
| **버튼** | 수정(`/diary/[id]/edit`로 이동), 삭제(확인 후 실행), 목록으로 돌아가기 |
| **에러 처리** | 존재하지 않는 ID 또는 타인의 일기 → 404 페이지 표시 |
| **접근 제한** | 로그인 필수, 본인 일기만 조회 가능 |
| **Supabase 기능** | `supabase.from('entries').select('*').eq('id', id).single()` |

### 3.7 일기 수정

| 항목 | 내용 |
|------|------|
| **페이지 경로** | `/diary/[id]/edit` |
| **동작** | 기존 일기 데이터를 폼에 프리필 → 수정 후 저장 → `UPDATE` 실행, `updated_at` 갱신 → 상세 페이지로 이동 |
| **입력 필드** | 제목, 본문, 기분 (작성과 동일) |
| **접근 제한** | 로그인 필수, 본인 일기만 수정 가능 |
| **Supabase 기능** | `supabase.from('entries').update({ title, body, mood, updated_at }).eq('id', id)` |

### 3.8 일기 삭제

| 항목 | 내용 |
|------|------|
| **진입 경로** | 상세 페이지(`/diary/[id]`)의 삭제 버튼 |
| **동작** | 삭제 확인 대화 상자(confirm) → 확인 시 `DELETE` 실행 → 목록(`/diary`)으로 이동 |
| **접근 제한** | 로그인 필수, 본인 일기만 삭제 가능 |
| **Supabase 기능** | `supabase.from('entries').delete().eq('id', id)` |

---

## 4. DB 스키마

### 4.1 `public.entries` 테이블

| 컬럼명 | 타입 | 제약조건 / 기본값 | 설명 |
|--------|------|-------------------|------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | 일기 고유 식별자 |
| `user_id` | `uuid` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | 작성자 ID (Supabase Auth) |
| `title` | `text` | `NOT NULL` | 일기 제목 |
| `body` | `text` | `NOT NULL` | 일기 본문 |
| `mood` | `text` | `NOT NULL`, `CHECK (mood IN ('happy','sad','angry','calm','tired'))` | 기분 코드 |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | 최초 작성 시각 |
| `updated_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | 마지막 수정 시각 |

### 4.2 인덱스

| 인덱스 | 대상 컬럼 | 목적 |
|--------|-----------|------|
| `idx_entries_user_created` | `(user_id, created_at DESC)` | 사용자별 일기 목록 조회 최적화 |

### 4.3 기분(`mood`) 매핑

| 코드 | 한글 라벨 | 이모지 (참고) |
|------|-----------|---------------|
| `happy` | 행복 | 😊 |
| `sad` | 슬픔 | 😢 |
| `angry` | 화남 | 😠 |
| `calm` | 평온 | 😌 |
| `tired` | 피곤 | 😴 |

---

## 5. 페이지 구조 (`app/` 디렉터리)

```
app/
├── layout.tsx                    # 루트 레이아웃 (폰트, 전역 스타일, Provider)
├── page.tsx                      # 랜딩 — 로그인 여부에 따라 /diary 또는 /login 리다이렉트
├── login/
│   └── page.tsx                  # 로그인 페이지
├── signup/
│   └── page.tsx                  # 회원가입 페이지
└── diary/
    ├── page.tsx                  # 일기 목록
    ├── new/
    │   └── page.tsx              # 일기 작성
    └── [id]/
        ├── page.tsx              # 일기 상세
        └── edit/
            └── page.tsx          # 일기 수정
```

### 라우트 요약

| 경로 | 파일 | 역할 | 인증 필요 |
|------|------|------|-----------|
| `/` | `app/page.tsx` | 랜딩 (리다이렉트 처리) | 아니오 |
| `/login` | `app/login/page.tsx` | 로그인 | 아니오 |
| `/signup` | `app/signup/page.tsx` | 회원가입 | 아니오 |
| `/diary` | `app/diary/page.tsx` | 일기 목록 | 예 |
| `/diary/new` | `app/diary/new/page.tsx` | 일기 작성 | 예 |
| `/diary/[id]` | `app/diary/[id]/page.tsx` | 일기 상세 | 예 |
| `/diary/[id]/edit` | `app/diary/[id]/edit/page.tsx` | 일기 수정 | 예 |

### 미들웨어

- `middleware.ts` (프로젝트 루트): `/diary` 하위 모든 경로에서 Supabase 세션을 확인하고, 미인증 사용자는 `/login`으로 리다이렉트한다.

---

## 6. 인증 흐름

```
[미인증 사용자]
    │
    ├─ /signup → 회원가입 → /login
    │
    └─ /login → 로그인 성공 → /diary (일기 목록)
                                  │
                                  ├─ 일기 작성 (/diary/new)
                                  ├─ 일기 상세 (/diary/[id])
                                  ├─ 일기 수정 (/diary/[id]/edit)
                                  ├─ 일기 삭제 (상세에서 실행)
                                  │
                                  └─ 로그아웃 → /login
```

- Supabase `createServerClient`로 서버 컴포넌트·미들웨어에서 세션 쿠키를 동기화한다.
- 클라이언트 컴포넌트에서는 `createBrowserClient`로 Supabase에 접근한다.

---

## 7. Phase 1 범위 밖 (향후 확장 고려)

- 소셜 로그인 (Google, GitHub 등)
- 일기 검색·필터링 (날짜 범위, 기분별)
- 이미지·파일 첨부 (Supabase Storage)
- 일기 공유·공개 설정
- 통계·대시보드 (기분 추이 그래프 등)
- 페이지네이션 또는 무한 스크롤
- 다크 모드

---

이 문서는 `AGENTS.md` 및 `.cursor/rules/`와 함께 구현 기준으로 사용한다.
