"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getRoleFromEmail } from "@/lib/role-map";
import { resolveRoleFromEmail } from "@/lib/local-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ??
  "admin@qube.com";

const slugifyRole = (role?: string | null) =>
  role?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ??
  "";

export default function DashboardRouter() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [message, setMessage] = useState("Preparing your dashboard…");

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (!data.session) {
          router.replace("/login");
          return;
        }
        const user = data.session.user;
        const role =
          (user.user_metadata?.role as string | undefined) ??
          getRoleFromEmail(user.email) ??
          resolveRoleFromEmail(user.email);
        const slug = slugifyRole(role);

        if (
          user.email?.toLowerCase() === SUPER_ADMIN_EMAIL ||
          slug === "super_admin"
        ) {
          router.replace("/dashboard/admin");
          return;
        }

        if (!slug) {
          setMessage("No dashboard is configured for this account.");
          return;
        }
        router.replace(`/dashboard/${slug}`);
      } catch (error) {
        if (!isMounted) return;
        setMessage("Unable to load your dashboard. Please retry or sign in again.");
      }
    };

    hydrate();
    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
      {message}
    </div>
  );
}
