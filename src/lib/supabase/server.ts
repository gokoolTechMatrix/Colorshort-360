import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertServiceRoleKey, getSupabaseConfig } from "./config";

export const createSupabaseServerClient = (
  accessToken?: string,
): SupabaseClient => {
  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey, {
    auth: {
      detectSessionInUrl: false,
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });
};

export const getServiceRoleClient = (): SupabaseClient => {
  const { url } = getSupabaseConfig();
  const serviceRoleKey = assertServiceRoleKey();
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
