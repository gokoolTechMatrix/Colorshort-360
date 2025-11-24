"use client";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

let browserClient: SupabaseClient | undefined;

export const getSupabaseBrowserClient = () => {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getSupabaseConfig();
  browserClient = createClient(url, anonKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      flowType: "pkce",
      storageKey: "supabase-auth",
      autoRefreshToken: true,
    },
  });

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

  return browserClient;
};

export const supabaseBrowserClient = getSupabaseBrowserClient();
