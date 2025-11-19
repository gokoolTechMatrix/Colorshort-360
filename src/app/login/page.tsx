"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getRoleFromEmail } from "@/lib/role-map";

const superAdminEmail =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ??
  "admin@qube.com";

const slugifyRole = (role?: string | null) =>
  role?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ??
  "";

export default function LoginPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!email || !password) {
      setStatus({
        type: "error",
        message: "Enter both email and password.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }
      const { data: userData } = await supabase.auth.getUser();
      const mappedRole = getRoleFromEmail(userData.user?.email);
      const role =
        userData.user?.user_metadata?.role ??
        mappedRole ??
        (await fetchRole(userData.user?.id));
      const slug = slugifyRole(role);
      if (
        userData.user?.email?.toLowerCase() === superAdminEmail ||
        slug === "super_admin"
      ) {
        router.push("/dashboard/admin");
      } else if (slug) {
        router.push(`/dashboard/${slug}`);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in.";
      const roleSlug = getRoleFromEmail(email);
      if (
        roleSlug &&
        typeof message === "string" &&
        message.toLowerCase().includes("invalid login credentials")
      ) {
        const ensured = await ensureUser(email, password);
        if (ensured) {
          await handleSubmit(event);
          return;
        }
      }
      setStatus({
        type: "error",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRole = async (userId?: string) => {
    if (!userId) return "";
    try {
      const response = await fetch("/api/user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        return "";
      }
      const payload = (await response.json()) as { role?: string | null };
      return payload.role ?? "";
    } catch {
      return "";
    }
  };

  const ensureUser = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/ensure-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      return response.ok && payload?.ok;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-white via-slate-50 to-indigo-50">
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <section className="space-y-6 text-slate-700">
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">
            Colorsort360
          </p>
          <h1 className="text-4xl font-semibold text-slate-900">
            Welcome back. Access the operational dashboard securely.
          </h1>
        </section>

        <section className="rounded-[32px] border border-slate-100 bg-white/90 p-10 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="mb-8 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">
              Secure login
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Sign in to your workspace
            </h2>
            <p className="text-sm text-slate-500">
              Email should always be the phone number you registered with +{" "}
              <strong>@gmail.com</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value.trim())}
                placeholder="e.g. 9876543210@gmail.com"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {status && (
            <p
              className={`mt-6 rounded-2xl px-4 py-3 text-sm font-semibold ${
                status.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {status.message}
            </p>
          )}

          <p className="mt-8 text-center text-sm text-slate-500">
            Need a new invite?{" "}
            <Link href="/user-creation" className="font-semibold text-indigo-500">
              Contact an admin
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
