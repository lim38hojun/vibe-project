"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResult =
  | { ok: true }
  | { ok: false; message: string };

type AuthContextValue = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  ready: boolean;
  signup: (email: string, password: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(user: SupabaseUser): AuthUser | null {
  const email = (user.email ?? "").trim();
  if (!email) {
    return null;
  }
  return { id: user.id, email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data: { user: u } }) => {
        setUser(u ? toAuthUser(u) : null);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAuthUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signup = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (password.length === 0) {
      return { ok: false, message: "비밀번호를 입력해 주세요." };
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const trimmed = email.trim();
    if (trimmed.length === 0) {
      return { ok: false, message: "이메일을 입력해 주세요." };
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
      ready,
      signup,
      login,
      logout,
    }),
    [user, ready, signup, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
