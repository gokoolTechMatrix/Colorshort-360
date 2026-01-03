"use client";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";
import {
  clearLocalSession,
  getLocalSession,
  resolveRoleFromEmail,
  saveLocalSession,
  shouldUseLocalAuth,
  tryLocalSignIn,
} from "../local-auth";

// Force offline/local auth to avoid network fetch failures by default.
const forceLocalAuth = true;

let browserClient: SupabaseClient | undefined;

export const getSupabaseBrowserClient = () => {
  if (browserClient) {
    return browserClient;
  }

  let supabase: SupabaseClient | null = null;
  if (!forceLocalAuth) {
    try {
      const { url, anonKey } = getSupabaseConfig();
      supabase = createClient(url, anonKey, {
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
          flowType: "pkce",
          storageKey: "supabase-auth",
          autoRefreshToken: true,
        },
      });
    } catch (error) {
      // If env vars are missing, fall back to local auth only
      console.warn("[supabase] Falling back to local auth:", error);
    }
  }

  const authWithFallback = {
    async signInWithPassword(credentials: { email: string; password: string }) {
      if (forceLocalAuth || !supabase) {
        return tryLocalSignIn(credentials.email, credentials.password) as any;
      }
      try {
        const result = await supabase.auth.signInWithPassword(credentials as any);
        if (!result.error && result.data?.user) {
          const mappedRole =
            resolveRoleFromEmail(result.data.user.email) ??
            (result.data.user.user_metadata as any)?.role;
          if (mappedRole) {
            result.data.user.user_metadata = {
              ...(result.data.user.user_metadata ?? {}),
              role: mappedRole,
            };
          }
          saveLocalSession({ user: result.data.user } as any);
          return result;
        }
        if (shouldUseLocalAuth(result.error)) {
          return tryLocalSignIn(credentials.email, credentials.password) as any;
        }
        return result;
      } catch (error) {
        const fallback = tryLocalSignIn(credentials.email, credentials.password);
        return (fallback ?? { data: { session: null, user: null }, error }) as any;
      }
    },
    async getSession() {
      if (forceLocalAuth || !supabase) {
        return { data: { session: getLocalSession() }, error: null } as any;
      }
      try {
        const result = await supabase.auth.getSession();
        if (result.data?.session) {
          return result;
        }
      } catch {
        // ignore and fall back
      }
      return { data: { session: getLocalSession() }, error: null } as any;
    },
    async signOut(options?: any) {
      if (!forceLocalAuth && supabase) {
        try {
          await supabase.auth.signOut(options);
        } catch {
          // ignore sign-out failures when offline
        }
      }
      clearLocalSession();
      return { error: null } as any;
    },
    onAuthStateChange(callback: any) {
      if (forceLocalAuth || !supabase) {
        const session = getLocalSession();
        callback(session ? "SIGNED_IN" : "SIGNED_OUT", { session });
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        };
      }
      return supabase.auth.onAuthStateChange(callback);
    },
  };

  browserClient = (supabase
    ? { ...supabase, auth: authWithFallback }
    : { auth: authWithFallback }) as SupabaseClient;

  // Handle refresh token errors by clearing invalid sessions
  browserClient.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED" && !session) {
      // If token refresh failed, clear the stored session
      browserClient?.auth.signOut({ scope: "local" });
    }
  });

  // Clear any invalid sessions on initialization
  browserClient.auth.getSession().catch(() => {
    browserClient?.auth.signOut({ scope: "local" });
  });

  return browserClient as SupabaseClient;
};

export const supabaseBrowserClient = getSupabaseBrowserClient();
