# 나만의 일기장 — API 명세 (Phase 1)

> 프론트엔드 ↔ Supabase 간 데이터 흐름 정리

이 프로젝트는 별도의 REST API 서버 없이 **Supabase 클라이언트 SDK**를 통해 직접 Auth·DB에 접근한다.
아래는 각 기능별로 프론트엔드가 보내는 요청과 돌아오는 응답을 정리한 문서다.

---

## 1. 인증 (Supabase Auth)

### 1.1 회원가입

**호출**

```typescript
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "mypassword123",
});
```

**요청 데이터**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `email` | `string` | O | 이메일 주소 |
| `password` | `string` | O | 비밀번호 (최소 6자) |

**성공 응답 예시**

```json
{
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "user@example.com",
      "created_at": "2026-03-27T12:00:00.000Z"
    },
    "session": null
  },
  "error": null
}
```

**실패 응답 예시**

```json
{
  "data": { "user": null, "session": null },
  "error": {
    "message": "User already registered",
    "status": 422
  }
}
```

---

### 1.2 로그인

**호출**

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "mypassword123",
});
```

**요청 데이터**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `email` | `string` | O | 이메일 주소 |
| `password` | `string` | O | 비밀번호 |

**성공 응답 예시**

```json
{
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "v1.MjA...",
      "expires_in": 3600
    }
  },
  "error": null
}
```

**실패 응답 예시**

```json
{
  "data": { "user": null, "session": null },
  "error": {
    "message": "Invalid login credentials",
    "status": 400
  }
}
```

---

### 1.3 로그아웃

**호출**

```typescript
const { error } = await supabase.auth.signOut();
```

**요청 데이터**: 없음

**성공 응답**: `error`가 `null`이면 성공. 세션 쿠키가 제거된다.

---

### 1.4 현재 사용자 조회

**호출**

```typescript
const { data: { user } } = await supabase.auth.getUser();
```

**성공 응답 예시**

```json
{
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "user@example.com"
    }
  },
  "error": null
}
```

---

## 2. 일기 CRUD (`entries` 테이블)

### 공통 타입 정의

```typescript
interface Entry {
  id: string;         // uuid
  user_id: string;    // uuid
  title: string;
  body: string;
  mood: "happy" | "sad" | "angry" | "calm" | "tired";
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
```

---

### 2.1 일기 작성 (INSERT)

**호출**

```typescript
const { data, error } = await supabase
  .from("entries")
  .insert({
    user_id: user.id,
    title: "봄나들이",
    body: "오늘 날씨가 좋아서 공원에 다녀왔다.",
    mood: "happy",
  })
  .select()
  .single();
```

**요청 데이터**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `user_id` | `string` | O | 로그인한 사용자 ID |
| `title` | `string` | O | 일기 제목 |
| `body` | `string` | O | 일기 본문 |
| `mood` | `string` | O | 기분 코드 (`happy`, `sad`, `angry`, `calm`, `tired` 중 하나) |

> `id`, `created_at`, `updated_at`은 DB 기본값으로 자동 생성된다.

**성공 응답 예시**

```json
{
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "봄나들이",
    "body": "오늘 날씨가 좋아서 공원에 다녀왔다.",
    "mood": "happy",
    "created_at": "2026-03-27T14:30:00.000Z",
    "updated_at": "2026-03-27T14:30:00.000Z"
  },
  "error": null
}
```

---

### 2.2 일기 목록 조회 (SELECT — 여러 건)

**호출**

```typescript
const { data, error } = await supabase
  .from("entries")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });
```

**요청 데이터**: 없음 (쿼리 파라미터로 필터링)

**성공 응답 예시**

```json
{
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "봄나들이",
      "body": "오늘 날씨가 좋아서 공원에 다녀왔다.",
      "mood": "happy",
      "created_at": "2026-03-27T14:30:00.000Z",
      "updated_at": "2026-03-27T14:30:00.000Z"
    },
    {
      "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
      "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "비 오는 날",
      "body": "하루 종일 비가 와서 집에만 있었다.",
      "mood": "calm",
      "created_at": "2026-03-26T10:00:00.000Z",
      "updated_at": "2026-03-26T10:00:00.000Z"
    }
  ],
  "error": null
}
```

**빈 목록 응답**

```json
{
  "data": [],
  "error": null
}
```

---

### 2.3 일기 상세 조회 (SELECT — 단건)

**호출**

```typescript
const { data, error } = await supabase
  .from("entries")
  .select("*")
  .eq("id", entryId)
  .single();
```

**요청 데이터**: URL 파라미터에서 `id`를 추출

**성공 응답 예시**

```json
{
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "봄나들이",
    "body": "오늘 날씨가 좋아서 공원에 다녀왔다.",
    "mood": "happy",
    "created_at": "2026-03-27T14:30:00.000Z",
    "updated_at": "2026-03-27T14:30:00.000Z"
  },
  "error": null
}
```

**존재하지 않는 ID 응답**

```json
{
  "data": null,
  "error": {
    "message": "JSON object requested, multiple (or no) rows returned",
    "code": "PGRST116"
  }
}
```

---

### 2.4 일기 수정 (UPDATE)

**호출**

```typescript
const { data, error } = await supabase
  .from("entries")
  .update({
    title: "봄나들이 (수정)",
    body: "오늘 날씨가 좋아서 공원에 다녀왔다. 벚꽃이 예뻤다!",
    mood: "happy",
    updated_at: new Date().toISOString(),
  })
  .eq("id", entryId)
  .select()
  .single();
```

**요청 데이터**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | `string` | O | 수정할 제목 |
| `body` | `string` | O | 수정할 본문 |
| `mood` | `string` | O | 수정할 기분 코드 |
| `updated_at` | `string` | O | 수정 시각 (ISO 8601) |

**성공 응답 예시**

```json
{
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "봄나들이 (수정)",
    "body": "오늘 날씨가 좋아서 공원에 다녀왔다. 벚꽃이 예뻤다!",
    "mood": "happy",
    "created_at": "2026-03-27T14:30:00.000Z",
    "updated_at": "2026-03-27T15:00:00.000Z"
  },
  "error": null
}
```

---

### 2.5 일기 삭제 (DELETE)

**호출**

```typescript
const { error } = await supabase
  .from("entries")
  .delete()
  .eq("id", entryId);
```

**요청 데이터**: 삭제할 일기의 `id`

**성공 응답**

```json
{
  "error": null
}
```

**실패 응답 예시** (존재하지 않는 ID)

```json
{
  "error": null
}
```

> DELETE는 대상이 없어도 에러를 반환하지 않는다. 삭제 전에 상세 조회로 존재 여부를 확인하거나, UI에서 이미 표시된 항목만 삭제 버튼을 노출하는 방식으로 처리한다.

---

## 3. 에러 응답 공통 형태

Supabase SDK는 모든 호출에서 `{ data, error }` 형태를 반환한다.

```typescript
interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    status?: number;
  } | null;
}
```

**프론트엔드 에러 처리 패턴**

```typescript
const { data, error } = await supabase.from("entries").select("*");

if (error) {
  // 사용자에게 에러 메시지 표시
  console.error(error.message);
  return;
}

// data 사용
```

---

## 4. 기분(mood) 코드 참조

프론트엔드에서 기분 코드를 한글 라벨·이모지로 변환할 때 사용한다.

```typescript
const MOOD_MAP = {
  happy: { label: "행복", emoji: "😊" },
  sad:   { label: "슬픔", emoji: "😢" },
  angry: { label: "화남", emoji: "😠" },
  calm:  { label: "평온", emoji: "😌" },
  tired: { label: "피곤", emoji: "😴" },
} as const;

type MoodCode = keyof typeof MOOD_MAP;
```

---

## 5. 요약 — 기능별 Supabase 호출 한눈에 보기

| 기능 | 메서드 | Supabase 호출 |
|------|--------|---------------|
| 회원가입 | Auth | `supabase.auth.signUp()` |
| 로그인 | Auth | `supabase.auth.signInWithPassword()` |
| 로그아웃 | Auth | `supabase.auth.signOut()` |
| 사용자 확인 | Auth | `supabase.auth.getUser()` |
| 일기 작성 | INSERT | `supabase.from('entries').insert().select().single()` |
| 일기 목록 | SELECT | `supabase.from('entries').select('*').eq().order()` |
| 일기 상세 | SELECT | `supabase.from('entries').select('*').eq().single()` |
| 일기 수정 | UPDATE | `supabase.from('entries').update().eq().select().single()` |
| 일기 삭제 | DELETE | `supabase.from('entries').delete().eq()` |
