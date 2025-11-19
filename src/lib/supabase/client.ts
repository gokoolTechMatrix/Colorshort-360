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
    },
  });

  return browserClient;
};

export const supabaseBrowserClient = getSupabaseBrowserClient();
