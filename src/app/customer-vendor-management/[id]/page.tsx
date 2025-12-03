"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getRoleFromEmail } from "@/lib/role-map";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  type DocumentHealth,
  type MasterRecord,
  type MasterStatus,
  MASTER_SEED,
} from "../master-data";

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ?? "admin@qube.com";

const formatCurrency = (value: number, currency: string) =>
  Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export default function MasterDetailPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/image.png");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileRole, setProfileRole] = useState<"admin" | "super_admin" | null>(
    null,
  );
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [record, setRecord] = useState<MasterRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const masterId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const user = data.session.user;
      const derivedRole =
        (user.user_metadata?.role as string | undefined) ??
        getRoleFromEmail(user.email) ??
        (await fetchRole(user.id));
      const slug =
        derivedRole
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") ?? "";
      const isSuperAdmin =
        user.email?.toLowerCase() === SUPER_ADMIN_EMAIL || slug === "super_admin";
      const isAdmin = slug === "admin";

      if (!isSuperAdmin && !isAdmin) {
        setAccessDenied(true);
        setIsCheckingAuth(false);
        return;
      }

      setProfileRole(isSuperAdmin ? "super_admin" : "admin");
      setIsCheckingAuth(false);
      setRecord(MASTER_SEED.find((item) => item.id === masterId) ?? null);
    };

    const fetchRole = async (userId: string) => {
      try {
        const response = await fetch("/api/user-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

    hydrate();
    return () => {
      active = false;
    };
  }, [masterId, router, supabase]);

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
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  };

  const handleStatusChange = (status: MasterStatus) => {
    setRecord((prev) =>
      prev ? { ...prev, status, lastUpdated: new Date().toISOString() } : prev,
    );
    setToast(`Status updated to ${status}`);
  };

  const handleDocsHealthy = () => {
    setRecord((prev) =>
      prev
        ? {
          ...prev,
          documents: prev.documents.map((doc) => ({
            ...doc,
            status: "valid" as DocumentHealth,
          })),
          tags: Array.from(new Set([...(prev.tags ?? []), "compliant"])),
          lastUpdated: new Date().toISOString(),
        }
        : prev,
    );
    setToast("Compliance marked as valid");
  };

  const handleExport = () => setToast("Exporting record to CSV");

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
        Checking access...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="max-w-lg rounded-3xl border border-rose-200 bg-white p-10 shadow-xl shadow-rose-100">
          <p className="text-xs uppercase tracking-[0.35em] text-rose-400">
            Restricted
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Admin access required
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            This master is available to admin and super admin roles only.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-md shadow-slate-100">
          <h1 className="text-xl font-semibold text-slate-900">Master not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            The requested record does not exist. Please return to the list.
          </p>
          <button
            onClick={() => router.push("/customer-vendor-management")}
            className="mt-6 rounded-full bg-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-cyan-200 transition hover:bg-cyan-500"
          >
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        companyLogo={companyLogo}
        onLogout={handleLogout}
        isSigningOut={isSigningOut}
        activeHref="/customer-vendor-management"
        showSettings={profileRole === "super_admin"}
        showUserCreation={profileRole === "super_admin"}
        showLeadManagement
        showCustomerVendorManagement
      />
      <main className="flex-1 px-6 py-8">
        <header className="relative mb-8 overflow-hidden rounded-[32px] bg-[linear-gradient(120deg,#2f80ed_0%,#6a5af9_100%)] p-6 text-white shadow-xl shadow-cyan-200/60">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          </div>
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                Master detail
              </p>
              <h1 className="text-3xl font-semibold leading-tight text-white">
                {record.name}
              </h1>
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-white/20 px-3 py-1 text-white backdrop-blur">
                  {record.code}
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-white backdrop-blur">
                  {record.industry}
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-white backdrop-blur">
                  {record.type}
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-white backdrop-blur">
                  Status: {record.status}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {record.status !== "active" && (
                <button
                  onClick={() => handleStatusChange("active")}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-500"
                >
                  Mark active
                </button>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-100 lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">
                Owner: {record.accountOwner}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {record.city}, {record.country}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1">
                Risk: {record.risk}
              </span>
              {record.tags.map((tag) => (
                <span
                  key={`${record.id}-${tag}`}
                  className="rounded-full bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-100"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-cyan-100 via-cyan-50 to-sky-200 p-4 shadow-inner shadow-cyan-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Identity & tax
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {record.industry}
                </p>
                <p className="text-sm text-slate-700">
                  Tax ID: {record.taxId} ({record.taxCountry})
                </p>
                <p className="text-sm text-slate-700">Bank: {record.bankMask}</p>
                <p className="text-sm text-slate-700">
                  Payment: {record.paymentMethods.join(", ")}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-200 p-4 shadow-inner shadow-amber-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Financials
                </p>
                <p className="font-semibold text-slate-900">
                  Credit limit: {formatCurrency(record.creditLimit, record.currency)}
                </p>
                <p className="text-sm text-slate-700">
                  Outstanding: {formatCurrency(record.outstanding, record.currency)}
                </p>
                <p className="text-sm text-slate-700">
                  Billing terms: {record.billingTerms}
                </p>
                <p className="text-xs text-slate-500">
                  Updated {new Date(record.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-rose-100 via-rose-50 to-pink-200 p-4 shadow-inner shadow-rose-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Primary contact
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {record.primaryContact.name}
                </p>
                <p className="text-sm text-slate-700">{record.primaryContact.role}</p>
                <p className="text-sm text-slate-700">{record.primaryContact.email}</p>
                <p className="text-sm text-slate-700">{record.primaryContact.phone}</p>
                <p className="text-xs text-slate-500">
                  Prefers {record.primaryContact.preferredCommunication}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-emerald-100 via-emerald-50 to-green-200 p-4 shadow-inner shadow-emerald-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Address
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {record.address.label}
                </p>
                <p className="text-sm text-slate-700">{record.address.line1}</p>
                <p className="text-sm text-slate-700">
                  {record.address.city}, {record.address.state} {record.address.postalCode}
                </p>
                <p className="text-xs text-slate-500">
                  {record.address.isPrimary ? "Primary" : "Secondary"} address
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-100 via-indigo-50 to-violet-200 p-4 shadow-inner shadow-indigo-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Compliance
                </p>
                <div className="space-y-2">
                  {record.documents.map((doc) => (
                    <div
                      key={`${record.id}-detail-${doc.type}`}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs font-semibold shadow-sm"
                    >
                      <span className="text-slate-700">{doc.type}</span>
                      <span
                        className={`rounded-full px-2 py-1 ${
                          doc.status === "valid"
                            ? "bg-emerald-50 text-emerald-600"
                            : doc.status === "expiring"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <button
                    onClick={handleDocsHealthy}
                    className="rounded-full bg-indigo-600 px-4 py-2 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500"
                  >
                    Mark compliant
                  </button>
                  <button
                    onClick={() =>
                      handleStatusChange(record.status === "active" ? "inactive" : "active")
                    }
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Toggle active
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Actions
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <button
                onClick={() => router.push("/customer-vendor-management")}
                className="w-full rounded-2xl bg-cyan-600 px-4 py-2 text-white shadow-sm shadow-cyan-200 transition hover:bg-cyan-500"
              >
                Back to list
              </button>
              {record.status !== "active" && (
                <button
                  onClick={() => handleStatusChange("active")}
                  className="w-full rounded-2xl bg-emerald-600 px-4 py-2 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-500"
                >
                  Mark active
                </button>
              )}
              {record.status !== "suspended" && (
                <button
                  onClick={() => handleStatusChange("suspended")}
                  className="w-full rounded-2xl bg-rose-500 px-4 py-2 text-white shadow-sm shadow-rose-200 transition hover:bg-rose-400"
                >
                  Suspend
                </button>
              )}
              <button
                onClick={handleDocsHealthy}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-2 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500"
              >
                Docs OK
              </button>
              <button
                onClick={handleExport}
                className="w-full rounded-2xl bg-slate-100 px-4 py-2 text-slate-700 shadow-sm transition hover:bg-slate-200"
              >
                Export
              </button>
            </div>
          </div>
        </section>
      </main>
      {toast && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center">
          <div
            className="mt-10 rounded-3xl bg-gradient-to-r from-cyan-200 via-cyan-300 to-sky-300 px-6 py-4 text-sm font-semibold text-slate-900 shadow-[0_15px_40px_rgba(14,165,233,0.35)] backdrop-blur"
            style={{
              animation: "toastPop 220ms ease, toastFade 320ms ease 2.4s forwards",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-base font-bold text-cyan-700 shadow-inner shadow-cyan-100">
                *
              </span>
              <p className="text-base font-semibold leading-snug">{toast}</p>
            </div>
          </div>
          <style jsx>{`
            @keyframes toastPop {
              from {
                opacity: 0;
                transform: translateY(-10px) scale(0.97);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            @keyframes toastFade {
              from {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
              to {
                opacity: 0;
                transform: translateY(-6px) scale(0.99);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
