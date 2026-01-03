import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertServiceRoleKey, getSupabaseConfig } from "./config";

const forceLocalSupabase = process.env.FORCE_LOCAL_SUPABASE !== "false";

// Minimal no-op client to avoid network calls when running offline
const createMockClient = (): SupabaseClient => {
  const ok = { data: null, error: null } as any;

  const chain = () => {
    const self: any = {
      select: () => self,
      insert: () => ok,
      update: () => ok,
      upsert: () => ok,
      delete: () => ok,
      order: () => self,
      eq: () => self,
      limit: () => self,
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: null }),
    };
    return self;
  };

  const admin = {
    createUser: async () => ok,
    updateUserById: async () => ok,
    getUserById: async () => ({ data: null, error: null }),
    listUsers: async () => ({ data: { users: [] }, error: null }),
    deleteUser: async () => ok,
  };

  const storage = {
    from: () => ({
      upload: async () => ok,
      remove: async () => ok,
      getPublicUrl: () => ({ data: { publicUrl: "" }, error: null }),
    }),
  };

  return {
    from: chain,
    rpc: async () => ok,
    storage,
    auth: { admin },
  } as unknown as SupabaseClient;
};

export const createSupabaseServerClient = (
  accessToken?: string,
): SupabaseClient => {
  if (forceLocalSupabase) {
    return createMockClient();
  }
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
  if (forceLocalSupabase) {
    return createMockClient();
  }
  const { url } = getSupabaseConfig();
  const serviceRoleKey = assertServiceRoleKey();
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
