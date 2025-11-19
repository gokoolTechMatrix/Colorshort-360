export type SupabaseRuntime = "browser" | "server" | "service-role";

const missingEnv = (key: string) =>
  new Error(`Missing required environment variable: ${key}`);

export const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) {
    throw missingEnv("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!anonKey) {
    throw missingEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    url,
    anonKey,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
};

export const assertServiceRoleKey = () => {
  const { serviceRoleKey } = getSupabaseConfig();
  if (!serviceRoleKey) {
    throw missingEnv("SUPABASE_SERVICE_ROLE_KEY");
  }
  return serviceRoleKey;
};
