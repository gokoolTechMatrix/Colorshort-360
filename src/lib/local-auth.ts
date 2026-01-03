"use client";

import { getRoleFromEmail } from "./role-map";

type LocalStorageSession = {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
  };
};

const LOCAL_SESSION_KEY = "colorsort-local-session";
const superAdminEmail =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ?? "admin@qube.com";
const allowLocalAuth = process.env.NEXT_PUBLIC_ALLOW_LOCAL_AUTH !== "false";
const localAuthPassword =
  process.env.NEXT_PUBLIC_LOCAL_AUTH_PASSWORD ?? "password";
const defaultRole =
  process.env.NEXT_PUBLIC_DEFAULT_ROLE?.toLowerCase() ?? "sales-executive";

const getStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const resolveRoleFromEmail = (email?: string | null): string => {
  const normalized = (email ?? "").toLowerCase();
  if (!normalized) return defaultRole;
  if (normalized === superAdminEmail) return "admin";
  return getRoleFromEmail(normalized) ?? defaultRole;
};

export const readLocalSession = (): LocalStorageSession | null => {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(LOCAL_SESSION_KEY);
    return raw ? (JSON.parse(raw) as LocalStorageSession) : null;
  } catch {
    return null;
  }
};

export const saveLocalSession = (session: LocalStorageSession) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  } catch {
    // best effort only
  }
};

export const clearLocalSession = () => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(LOCAL_SESSION_KEY);
  } catch {
    // best effort only
  }
};

const createLocalSession = (email: string, role: string) => {
  const session: LocalStorageSession = {
    user: {
      id: `local-${role}`,
      email,
      user_metadata: { role, fallbackAuth: true },
    },
  };
  saveLocalSession(session);
  return session;
};

export const tryLocalSignIn = (email?: string, password?: string) => {
  if (!allowLocalAuth || !email) return null;
  const role = resolveRoleFromEmail(email);
  if (password !== localAuthPassword) {
    return {
      data: { session: null, user: null },
      error: new Error("Invalid login credentials"),
      meta: { fallbackAuth: true },
    };
  }
  const session = createLocalSession(email, role);
  return {
    data: { session, user: session.user },
    error: null,
    meta: { fallbackAuth: true },
  };
};

export const shouldUseLocalAuth = (error: unknown) => {
  if (!allowLocalAuth) return false;
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const lower = message.toString().toLowerCase();
  return (
    lower.includes("failed to fetch") ||
    lower.includes("getaddrinfo") ||
    lower.includes("dns") ||
    lower.includes("network") ||
    lower.includes("fetch")
  );
};

export const getLocalSession = () => readLocalSession();
