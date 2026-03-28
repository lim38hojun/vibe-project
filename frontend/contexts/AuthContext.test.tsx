import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./AuthContext";

const createClientMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => createClientMock(),
}));

function SessionProbe({ children }: { children: (ctx: ReturnType<typeof useAuth>) => ReactNode }) {
  const ctx = useAuth();
  return <>{children(ctx)}</>;
}

describe("AuthContext — 보안·논리 취약점 대응용 Red 스펙", () => {
  let onAuthStateChangeImpl: (
    cb: (event: string, session: { user: { id: string; email: string | null } } | null) => void,
  ) => { data: { subscription: { unsubscribe: () => void } } };

  beforeEach(() => {
    onAuthStateChangeImpl = () => ({
      data: {
        subscription: { unsubscribe: vi.fn() },
      },
    });
    createClientMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * 1) getUser() Promise 거부: .catch 없음 → ready가 영구 false, 미처리 거부 가능(가용성·논리).
   */
  it("getUser가 거부되어도 ready는 true가 되어 UI가 복구 가능해야 한다", async () => {
    // Given: 초기 세션 조회가 거부됨
    createClientMock.mockImplementation(() => ({
      auth: {
        getUser: () => Promise.reject(new Error("network")),
        onAuthStateChange: onAuthStateChangeImpl,
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
      },
    }));

    // When: Provider 마운트
    render(
      <AuthProvider>
        <SessionProbe>
          {(ctx) => <span data-testid="ready">{String(ctx.ready)}</span>}
        </SessionProbe>
      </AuthProvider>,
    );

    // Then: 로딩이 풀려 비로그인 상태로라도 진행되어야 함 (BVA: 실패 경로에서도 ready 경계는 true)
    await waitFor(
      () => {
        expect(screen.getByTestId("ready")).toHaveTextContent("true");
      },
      { timeout: 2000 },
    );
  });

  /**
   * 2) signOut 오류 무시: 세션 잔존과 UI 불일치(보안·논리).
   */
  it("logout은 signOut이 실패하면 거부되어 호출자가 실패를 알 수 있어야 한다", async () => {
    // Given: signOut이 Supabase 에러 객체 반환
    const signOut = vi.fn().mockResolvedValue({ error: { message: "Sign out failed" } });
    createClientMock.mockImplementation(() => ({
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: onAuthStateChangeImpl,
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut,
      },
    }));

    function LogoutProbe() {
      const { logout, ready } = useAuth();
      const [err, setErr] = useState<string | null>(null);
      return (
        <div>
          <span data-testid="ready">{String(ready)}</span>
          <span data-testid="logout-error">{err ?? ""}</span>
          <button
            type="button"
            onClick={async () => {
              try {
                await logout();
                setErr("");
              } catch (e) {
                setErr(e instanceof Error ? e.message : "rejected");
              }
            }}
          >
            logout
          </button>
        </div>
      );
    }

    const user = userEvent.setup();

    // When: Provider 마운트 후 초기 getUser가 끝날 때까지 대기
    render(
      <AuthProvider>
        <LogoutProbe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("ready")).toHaveTextContent("true"));

    // When: 로그아웃 버튼 클릭
    await user.click(screen.getByRole("button", { name: "logout" }));

    // Then: 오류가 호출자에게 전달되어야 함
    await waitFor(() => {
      const msg = screen.getByTestId("logout-error").textContent ?? "";
      expect(msg.length).toBeGreaterThan(0);
    });
    expect(signOut).toHaveBeenCalled();
  });

  /**
   * 3) email이 null인 JWT/사용자를 ""로 매핑하고 isLoggedIn true → 식별자 부재를 로그인으로 취급(논리·보안).
   */
  it("Supabase 사용자에 email이 없으면 isLoggedIn은 false여야 한다", async () => {
    // Given: OAuth 등으로 email 필드가 null인 user
    const userNoEmail = { id: "u1", email: null as string | null };
    createClientMock.mockImplementation(() => ({
      auth: {
        getUser: () =>
          Promise.resolve({
            data: { user: userNoEmail as { id: string; email: string | null } },
            error: null,
          }),
        onAuthStateChange: onAuthStateChangeImpl,
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
      },
    }));

    // When: Provider 마운트 후 getUser가 email=null 사용자를 반환함
    render(
      <AuthProvider>
        <SessionProbe>
          {(ctx) => (
            <>
              <span data-testid="ready">{String(ctx.ready)}</span>
              <span data-testid="isLoggedIn">{String(ctx.isLoggedIn)}</span>
            </>
          )}
        </SessionProbe>
      </AuthProvider>,
    );

    // Then: 초기값(false)이 아니라 초기화 완료 후에도 빈 이메일은 로그인으로 치지 않음 (BVA: null ↔ 빈 문자열 혼동 방지)
    await waitFor(() => expect(screen.getByTestId("ready")).toHaveTextContent("true"));
    expect(screen.getByTestId("isLoggedIn")).toHaveTextContent("false");
  });

  /**
   * 4) 공백 전용 이메일: trim 후 빈 문자열로 API 호출, 클라이언트 검증 없음(논리·남용).
   */
  it("공백만 있는 이메일로는 signInWithPassword를 호출하지 않고 검증 실패를 반환해야 한다", async () => {
    // Given
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockImplementation(() => ({
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: onAuthStateChangeImpl,
        signUp: vi.fn(),
        signInWithPassword,
        signOut: vi.fn(),
      },
    }));

    function LoginWhitespaceProbe() {
      const { login, ready } = useAuth();
      return (
        <div>
          <span data-testid="ready">{String(ready)}</span>
          <button
            type="button"
            onClick={async () => {
              await login("   \t  ", "password");
            }}
          >
            run-login
          </button>
        </div>
      );
    }

    const user = userEvent.setup();

    // When: Provider 마운트 및 초기화 완료
    render(
      <AuthProvider>
        <LoginWhitespaceProbe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("ready")).toHaveTextContent("true"));

    // When: trim 결과 길이 0인 이메일로 login 호출 (BVA: 공백만 → 빈 문자열 경계)
    await user.click(screen.getByRole("button", { name: "run-login" }));

    // Then: 원격 호출 전에 차단
    await waitFor(() => {
      expect(signInWithPassword).not.toHaveBeenCalled();
    });
  });

  /**
   * 5) 비밀번호 길이 BVA(0자): 클라이언트에서 차단하지 않으면 불필요한 요청·오해 소지.
   */
  it("비밀번호가 빈 문자열이면 signUp을 호출하지 않고 검증 실패를 반환해야 한다", async () => {
    // Given
    const signUp = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockImplementation(() => ({
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: onAuthStateChangeImpl,
        signUp,
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
      },
    }));

    function SignupEmptyPasswordProbe() {
      const { signup, ready } = useAuth();
      return (
        <div>
          <span data-testid="ready">{String(ready)}</span>
          <button
            type="button"
            onClick={async () => {
              await signup("valid@example.com", "");
            }}
          >
            run-signup
          </button>
        </div>
      );
    }

    const user = userEvent.setup();

    // When: Provider 마운트 및 초기화 완료
    render(
      <AuthProvider>
        <SignupEmptyPasswordProbe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("ready")).toHaveTextContent("true"));

    // When: 비밀번호 길이 0 (BVA 하한)
    await user.click(screen.getByRole("button", { name: "run-signup" }));

    // Then: signUp이 호출되지 않아야 함
    await waitFor(() => {
      expect(signUp).not.toHaveBeenCalled();
    });
  });
});
