"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ??
  "admin@qube.com";

export default function AdminSettingsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [password, setPassword] = useState("admin@123");
  const [passwordConfirm, setPasswordConfirm] = useState("admin@123");
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) {
        return;
      }
      await hydrate(data.session ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        await hydrate(session);
      },
    );

    async function hydrate(session: Session | null) {
      if (!session) {
        router.replace("/login");
        setIsCheckingAuth(false);
        return;
      }
      const metadata = session.user.user_metadata as {
        role?: string;
      };
      const roleIsAdmin =
        session.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL ||
        (metadata?.role ?? "super_admin").toLowerCase() === "super_admin";
      if (!roleIsAdmin) {
        router.replace("/login");
        setIsCheckingAuth(false);
        return;
      }
      setIsCheckingAuth(false);
    }

    return () => {
      isMounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (password !== passwordConfirm) {
      setStatus({
        type: "error",
        message: "Passwords do not match.",
      });
      return;
    }
    if (password.length < 8) {
      setStatus({
        type: "error",
        message: "Password must include at least 8 characters.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload?.message ?? "Unable to reset password.");
      }
      setStatus({
        type: "success",
        message: "Password updated. Sign out for changes to take effect.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to reset password.";
      setStatus({
        type: "error",
        message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-sm font-semibold text-slate-500">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-50">
      <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-16">
        <div className="mb-10 flex items-center gap-3">
          <Image
            src="/image.png"
            alt="Colorsort 360"
            width={120}
            height={120}
            className="rounded-[32px] bg-white/80 p-3 shadow-inner shadow-slate-200"
            priority
          />
        </div>
        <div className="mb-8 flex items-center gap-3 text-sm text-slate-500">
          <button
            onClick={() => router.back()}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-100"
          >
            Back
          </button>
          <span>/</span>
          <span>Change Password</span>
        </div>
        <section className="space-y-6 rounded-[40px] border border-slate-100 bg-white/90 p-10 shadow-[0_35px_120px_rgba(15,23,42,0.12)]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-500">
              High security
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Rotate super admin password
            </h1>
            <p className="text-sm text-slate-500">
              This updates the password for {SUPER_ADMIN_EMAIL}. A logout is
              required for the new password to take effect in the current
              session.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="new-password"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500"
                >
                  New password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pr-12 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M8.5 8.5C6.4 9.4 4.7 11 3 13c2.7 3.5 6 5.5 9 5.5 1.2 0 2.4-.3 3.5-.7" />
                        <path d="M17.9 17.9C19.8 16.5 21.4 14.7 23 13c-2.7-3.5-6-5.5-9-5.5-.6 0-1.3.1-1.9.2" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500"
                >
                  Confirm password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="confirm-password"
                    type={showPasswordConfirm ? "text" : "password"}
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pr-12 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((prev) => !prev)}
                    aria-label={
                      showPasswordConfirm ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPasswordConfirm ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M8.5 8.5C6.4 9.4 4.7 11 3 13c2.7 3.5 6 5.5 9 5.5 1.2 0 2.4-.3 3.5-.7" />
                        <path d="M17.9 17.9C19.8 16.5 21.4 14.7 23 13c-2.7-3.5-6-5.5-9-5.5-.6 0-1.3.1-1.9.2" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-[28px] bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_20px_40px_rgba(244,63,94,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isSaving ? "Updating..." : "Update password"}
            </button>
          </form>

          {status && (
            <p
              className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                status.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {status.message}
            </p>
          )}
        </section>
      </div>
      {/* Removed right-side logo */}
    </div>
  );
}
