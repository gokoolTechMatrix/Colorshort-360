"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  const [companyLogo, setCompanyLogo] = useState("/image.png");
  const [status, setStatus] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/company-settings")
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as {
          settings?: { logo_url?: string };
        };
        if (payload?.settings?.logo_url) {
          setCompanyLogo(payload.settings.logo_url);
        }
      })
      .catch(() => {
        // best-effort logo fetch
      });
  }, []);

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }
      const user = data.user;
      const mappedRole = getRoleFromEmail(user?.email);
      const roleFetch = fetchRole(user?.id);
      const role =
        user?.user_metadata?.role ?? mappedRole ?? (await roleFetch);
      const slug = slugifyRole(role);
      if (
        user?.email?.toLowerCase() === superAdminEmail ||
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
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="login-aurora" />
        <div className="login-aurora login-aurora--alt" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(86,162,255,0.32),transparent_26%),radial-gradient(circle_at_80%_10%,rgba(0,186,255,0.28),transparent_24%),radial-gradient(circle_at_40%_70%,rgba(0,215,209,0.26),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.35),transparent_22%)] mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(214,238,255,0.95),rgba(179,224,255,0.95),rgba(154,214,255,0.92))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.62),transparent_52%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-16 lg:px-10">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2">
          <section className="space-y-6">
            <div
              className="login-card-glass login-fade"
              style={{ animationDelay: "0.05s" }}
            >
              <p
                className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-bold uppercase tracking-[0.5em] text-cyan-700 shadow-sm"
                style={{ fontFamily: '"Segoe UI", Inter, sans-serif' }}
              >
                Colorsort360
              </p>
              <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-snug text-slate-900 md:text-4xl">
                Welcome back. Access the operational dashboard securely.
              </h1>
            </div>
          </section>

          <section
            className="login-panel login-fade"
            style={{ animationDelay: "0.25s" }}
          >
            <div className="mb-8 flex flex-col items-center gap-4">
              <div className="flex items-center justify-center">
                <img
                  src={companyLogo}
                  alt="Colorsort360 logo"
                  className="h-32 w-32 object-contain drop-shadow-[0_22px_40px_rgba(74,222,128,0.28)]"
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-700/80">
                  Secure login
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Sign in to your workspace
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div
                className="space-y-2 login-fade"
                style={{ animationDelay: "0.35s" }}
              >
                <label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600"
                >
                  Email
                </label>
                <div className="login-input-wrap">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value.trim())}
                    placeholder="e.g. 9876543210@gmail.com"
                    className="login-input"
                  />
                </div>
              </div>

              <div
                className="space-y-2 login-fade"
                style={{ animationDelay: "0.45s" }}
              >
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600"
                >
                  Password
                </label>
                <div className="login-input-wrap">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    className="login-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="login-cta login-fade"
                style={{ animationDelay: "0.55s" }}
              >
                <span>{isLoading ? "Signing in..." : "Sign in"}</span>
              </button>
            </form>

            {status && (
              <p
                className={`login-fade login-status ${
                  status.type === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
                style={{ animationDelay: "0.65s" }}
              >
                {status.message}
              </p>
            )}

            <p
              className="login-fade mt-8 text-center text-sm text-slate-600"
              style={{ animationDelay: "0.7s" }}
            >
              Need a new invite?{" "}
              <Link
                href="/user-creation"
                className="font-semibold text-cyan-700 hover:text-cyan-800"
              >
                Contact an admin
              </Link>
            </p>
          </section>
        </div>
      </div>

      <style jsx global>{`
        @keyframes auroraShift {
          0% {
            transform: translate3d(-10%, -6%, 0) scale(1);
            opacity: 0.75;
          }
          50% {
            transform: translate3d(12%, 8%, 0) scale(1.1);
            opacity: 0.9;
          }
          100% {
            transform: translate3d(-6%, 16%, 0) scale(1.05);
            opacity: 0.7;
          }
        }

        @keyframes loginFade {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
            filter: blur(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .login-aurora {
          position: absolute;
          inset: -25%;
          background: conic-gradient(
            from 80deg,
            rgba(0, 195, 255, 0.7),
            rgba(0, 204, 255, 0.62),
            rgba(59, 176, 255, 0.7),
            rgba(59, 226, 200, 0.62),
            rgba(0, 195, 255, 0.7)
          );
          filter: blur(120px);
          opacity: 0.7;
          animation: auroraShift 18s ease-in-out infinite alternate;
        }

        .login-aurora--alt {
          mix-blend-mode: screen;
          animation-duration: 22s;
          animation-direction: alternate-reverse;
          opacity: 0.55;
        }

        .login-card-glass {
          position: relative;
          border-radius: 28px;
          padding: 26px;
          background: radial-gradient(
              circle at 20% 20%,
              rgba(255, 255, 255, 0.2),
              transparent 30%
            ),
            rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(125, 211, 252, 0.5);
          box-shadow: 0 32px 80px rgba(59, 130, 246, 0.22),
            0 0 0 1px rgba(255, 255, 255, 0.7) inset;
          backdrop-filter: blur(16px) saturate(120%);
        }

        .login-pill {
          padding: 14px 18px;
          border-radius: 999px;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0.08),
            rgba(148, 163, 255, 0.12)
          );
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(12px) saturate(130%);
        }

        .login-panel {
          position: relative;
          border-radius: 30px;
          padding: 32px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(59, 130, 246, 0.35);
          box-shadow: 0 32px 80px rgba(59, 130, 246, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.7) inset,
            0 18px 48px rgba(59, 222, 200, 0.2);
          backdrop-filter: blur(18px) saturate(170%);
        }

        .login-input-wrap {
          position: relative;
          border-radius: 18px;
          padding: 2px;
          background: linear-gradient(
            135deg,
            rgba(59, 226, 200, 0.35),
            rgba(14, 165, 233, 0.3),
            rgba(99, 102, 241, 0.28)
          );
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35),
            0 10px 30px rgba(56, 189, 248, 0.12);
        }

        .login-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 16px;
          border: none;
          background: rgba(255, 255, 255, 0.92);
          color: #0f172a;
          font-weight: 600;
          font-size: 0.95rem;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
          transition: box-shadow 0.25s ease, transform 0.25s ease;
        }

        .login-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.2),
            0 15px 35px rgba(56, 189, 248, 0.32);
          transform: translateY(-1px);
        }

        .login-cta {
          width: 100%;
          position: relative;
          overflow: hidden;
          border: none;
          border-radius: 18px;
          padding: 14px 18px;
          font-size: 0.98rem;
          font-weight: 700;
          color: #0b132b;
          background: linear-gradient(
            120deg,
            #22d3ee 0%,
            #60a5fa 40%,
            #a78bfa 100%
          );
          box-shadow: 0 20px 50px rgba(96, 165, 250, 0.35),
            0 0 0 1px rgba(255, 255, 255, 0.12) inset;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.25s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .login-cta::after {
          content: "";
          position: absolute;
          inset: -120%;
          background: linear-gradient(
            120deg,
            transparent 35%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 65%
          );
          transform: rotate(10deg) translateX(-20%);
          transition: transform 0.6s ease;
        }

        .login-cta:hover::after {
          transform: rotate(10deg) translateX(55%);
        }

        .login-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 24px 60px rgba(96, 165, 250, 0.45),
            0 0 0 1px rgba(255, 255, 255, 0.18) inset;
        }

        .login-cta:disabled {
          opacity: 0.75;
          cursor: not-allowed;
          transform: none;
        }

        .login-status {
          margin-top: 24px;
          padding: 12px 14px;
          border-radius: 16px;
          font-weight: 700;
          border: 1px solid rgba(148, 163, 184, 0.25);
          background: rgba(255, 255, 255, 0.9);
        }

        .login-fade {
          opacity: 0;
          animation: loginFade 0.9s cubic-bezier(0.18, 0.8, 0.24, 1) forwards;
        }
      `}</style>
    </div>
  );
}
