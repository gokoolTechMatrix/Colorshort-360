"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type TrustFlag = "gold" | "silver" | "bronze";

type CompanySettings = {
  id: string;
  company_name: string;
  logo_url: string;
  registered_address: string;
  operational_address: string;
  gst_number: string;
  pan_number: string;
  industry_type: string;
  contact_email: string;
  contact_phone: string;
  contact_website: string;
  description: string;
  financial_year_start: string;
  financial_year_end: string;
};

type TeamMember = {
  id?: string;
  name: string;
  employee_id: string;
  role: string;
  trust_flag: TrustFlag;
};

const EMPTY_SETTINGS: CompanySettings = {
  id: "company",
  company_name: "",
  logo_url: "",
  registered_address: "",
  operational_address: "",
  gst_number: "",
  pan_number: "",
  industry_type: "",
  contact_email: "",
  contact_phone: "",
  contact_website: "",
  description: "",
  financial_year_start: "",
  financial_year_end: "",
};

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ?? "admin@qube.com";

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
  const [settings, setSettings] = useState<CompanySettings>(EMPTY_SETTINGS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const [isEditingTeam] = useState(true);
  const [justSavedTeam, setJustSavedTeam] = useState(false);
  const [isSavingTeamAll, setIsSavingTeamAll] = useState(false);
  const [isRefreshingTeam, setIsRefreshingTeam] = useState(false);
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/image.png");
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const settingsDirtyRef = useRef(false);
  const persistTeamMember = (index: number) => {
    const member = teamMembers[index];
    if (!member) return;
    void upsertTeamMember(member);
  };
  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      router.push("/");
    }
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const fetchCompanyData = async () => {
    setIsLoadingSettings(true);
    try {
      const response = await fetch("/api/company-settings", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Unable to load settings.");
      }
      const payload = (await response.json()) as {
        settings: CompanySettings | null;
        team: TeamMember[];
      };
      const incomingSettings = payload.settings ?? EMPTY_SETTINGS;
      if (incomingSettings.logo_url) {
        setCompanyLogo(incomingSettings.logo_url);
      }
      setSettings((prev) =>
        settingsDirtyRef.current
          ? { ...incomingSettings, ...prev }
          : incomingSettings,
      );
      setTeamMembers(payload.team ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load settings.";
      setStatus({
        type: "error",
        message,
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;
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
      await fetchCompanyData();
      setIsCheckingAuth(false);
    }

    return () => {
      isMounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleSettingsChange = <K extends keyof CompanySettings>(
    key: K,
    value: CompanySettings[K],
  ) => {
    settingsDirtyRef.current = true;
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSettingsSave = async () => {
    setStatus(null);
    setIsSavingSettings(true);
    try {
      const response = await fetch("/api/company-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.message ?? "Unable to save settings.");
      }
      setStatus({
        type: "success",
        message: "Company settings saved.",
      });
      settingsDirtyRef.current = false;
      setJustSaved(true);
      setIsEditingSettings(false);
      await fetchCompanyData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save settings.";
      setStatus({
        type: "error",
        message,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setStatus(null);
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/company-settings/logo", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.message ?? "Logo upload failed.");
      }
      handleSettingsChange("logo_url", payload.url as string);
      setStatus({
        type: "success",
        message: "Logo uploaded.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Logo upload failed.";
      setStatus({
        type: "error",
        message,
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const upsertTeamMember = async (member: TeamMember) => {
    setStatus(null);
    setSavingMemberId(member.id ?? "new");
    try {
      const response = await fetch("/api/company-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMember: member }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to save member.");
      }
      await fetchCompanyData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save member.";
      setStatus({
        type: "error",
        message,
      });
    } finally {
      setSavingMemberId(null);
    }
  };

  const saveAllTeamMembers = async () => {
    setIsSavingTeamAll(true);
    setStatus(null);
    try {
      await Promise.all(
        teamMembers.map(async (member) => {
          const response = await fetch("/api/company-settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamMember: member }),
          });
          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload?.message ?? "Unable to save team member.");
          }
        }),
      );
      setStatus({
        type: "success",
        message: "Team saved.",
      });
      setToastMessage("Team saved and synced");
      setJustSavedTeam(true);
      await fetchCompanyData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save team.";
      setStatus({
        type: "error",
        message,
      });
    } finally {
      setIsSavingTeamAll(false);
    }
  };

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
      setToastMessage("Password updated. Sign out to use the new password.");
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

  const logoSrc = settings.logo_url || "/image.png";


  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-sm font-semibold text-slate-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        companyLogo={logoSrc}
        onLogout={handleLogout}
        isSigningOut={isSigningOut}
        activeHref="/admin-settings"
        showSettings
        showUserCreation
      />

      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner shadow-slate-200">
                <img
                  src={logoSrc}
                  alt="Company logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-indigo-400">
                  Admin only
                </p>
                <h1 className="text-3xl font-semibold text-slate-900">
                  Settings
                </h1>
                <p className="text-sm text-slate-600">
                  Company profile, compliance, team, and security.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.back()}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-100"
              >
                Back
              </button>
              <button
                onClick={() => {
                  settingsDirtyRef.current = false;
                  setIsRefreshing(true);
                  void fetchCompanyData().finally(() => setIsRefreshing(false));
                }}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M4 4v6h6M20 20v-6h-6" />
                  <path d="M5 13a7 7 0 0 0 12 3M19 11A7 7 0 0 0 7.05 8.05" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

        {status && (
          <p
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {status.message}
          </p>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">
                  Company
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  Profile & Branding
                </h2>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  disabled={logoUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleLogoUpload(file);
                    }
                  }}
                />
                <span>{logoUploading ? "Uploading..." : "Upload logo"}</span>
              </label>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700">
                Company name
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(event) =>
                    handleSettingsChange("company_name", event.target.value)
                  }
                  disabled={!isEditingSettings}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Industry type
                <input
                  type="text"
                  value={settings.industry_type}
                  onChange={(event) =>
                    handleSettingsChange("industry_type", event.target.value)
                  }
                  disabled={!isEditingSettings}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Company description
                <textarea
                  rows={4}
                  value={settings.description}
                  onChange={(event) =>
                    handleSettingsChange("description", event.target.value)
                  }
                  disabled={!isEditingSettings}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </label>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleSettingsSave}
                disabled={isSavingSettings || isLoadingSettings || !isEditingSettings}
                className={`rounded-full px-6 py-3 text-sm font-semibold shadow-md shadow-indigo-200 transition ${
                  isEditingSettings
                    ? "bg-indigo-600 text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {isSavingSettings
                  ? "Saving..."
                  : isEditingSettings
                    ? "Save company details"
                    : (
                      <span className="inline-flex items-center gap-2">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Saved
                      </span>
                    )}
              </button>
              {!isEditingSettings && (
                <button
                  onClick={() => {
                    setIsEditingSettings(true);
                    setJustSaved(false);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-100">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">
              Addresses
            </p>
            <label className="text-sm font-semibold text-slate-700">
              Registered address
              <textarea
                rows={3}
                value={settings.registered_address}
                onChange={(event) =>
                  handleSettingsChange("registered_address", event.target.value)
                }
                disabled={!isEditingSettings}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Operational address
              <textarea
                rows={3}
                value={settings.operational_address}
                onChange={(event) =>
                  handleSettingsChange("operational_address", event.target.value)
                }
                disabled={!isEditingSettings}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </label>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-100 lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">
                  Compliance
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  Company details
                </h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-semibold text-slate-700">
                GSTIN / Tax number
                <input
                  type="text"
                  value={settings.gst_number}
                  onChange={(event) =>
                    handleSettingsChange("gst_number", event.target.value)
                  }
                  disabled={!isEditingSettings}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                PAN card
                <input
                  type="text"
                  value={settings.pan_number}
                  onChange={(event) =>
                    handleSettingsChange("pan_number", event.target.value)
                  }
                  disabled={!isEditingSettings}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Contact email
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(event) =>
                    handleSettingsChange("contact_email", event.target.value)
                  }
                  disabled={!isEditingSettings}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Phone number
                <input
                  type="tel"
                  value={settings.contact_phone}
                  onChange={(event) =>
                    handleSettingsChange("contact_phone", event.target.value)
                  }
                  disabled={!isEditingSettings}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Company website
                <input
                  type="url"
                  value={settings.contact_website}
                  onChange={(event) =>
                    handleSettingsChange("contact_website", event.target.value)
                  }
                  disabled={!isEditingSettings}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </label>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleSettingsSave}
                disabled={isSavingSettings || isLoadingSettings || !isEditingSettings}
                className={`rounded-full px-6 py-3 text-sm font-semibold shadow-md shadow-indigo-200 transition ${
                  isEditingSettings
                    ? "bg-indigo-600 text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {isSavingSettings
                  ? "Saving..."
                  : isEditingSettings
                    ? "Save settings"
                    : (
                      <span className="inline-flex items-center gap-2">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Saved
                      </span>
                    )}
              </button>
              {!isEditingSettings && (
                <button
                  onClick={() => {
                    setIsEditingSettings(true);
                    setJustSaved(false);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-100">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">
              Financial year
            </p>
            <div className="grid gap-4">
              <label className="text-sm font-semibold text-slate-700">
                Start date
                <input
                  type="date"
                  value={settings.financial_year_start}
                  onChange={(event) =>
                    handleSettingsChange(
                      "financial_year_start",
                      event.target.value,
                    )
                  }
                  disabled={!isEditingSettings}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                End date
                <input
                  type="date"
                  value={settings.financial_year_end}
                  onChange={(event) =>
                    handleSettingsChange(
                      "financial_year_end",
                      event.target.value,
                    )
                  }
                  disabled={!isEditingSettings}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-3xl border border-indigo-100/70 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6 shadow-lg shadow-indigo-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500">
                Team management
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Employees & badges
              </h2>
              <p className="text-sm text-slate-600">
                Edit details inline — changes auto-save on blur. Use actions to refresh or sync all.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setIsRefreshingTeam(true);
                  void fetchCompanyData().finally(() => setIsRefreshingTeam(false));
                }}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 text-slate-500 ${isRefreshingTeam ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M4 4v6h6M20 20v-6h-6" />
                  <path d="M5 13a7 7 0 0 0 12 3M19 11A7 7 0 0 0 7.05 8.05" />
                </svg>
                Refresh
              </button>
              <button
                onClick={saveAllTeamMembers}
                disabled={isSavingTeamAll || savingMemberId !== null || isRefreshingTeam}
                className={`rounded-full px-5 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(79,70,229,0.18)] transition ${
                  isEditingTeam
                    ? "bg-indigo-600 text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {isSavingTeamAll
                  ? "Saving..."
                  : "Save team"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              <span>Roster</span>
              <span className="text-[11px] text-indigo-500">Auto-save on blur</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {teamMembers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm text-slate-500 shadow-inner">
                  No team members yet.
                </div>
              )}
              {teamMembers.map((member, index) => (
                <div
                  key={member.id ?? `temp-${index}`}
                  className="group relative rounded-2xl border border-white/60 bg-white/80 px-4 py-4 shadow-md shadow-indigo-100 backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">
                      Member
                    </span>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                      {member.role || "Set role"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3">
                    <label className="text-xs font-semibold text-slate-600">
                      Name
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                        disabled={isSavingTeamAll || isRefreshingTeam}
                        value={member.name}
                        onChange={(event) =>
                          setTeamMembers((prev) =>
                            prev.map((row, idx) =>
                              idx === index
                                ? { ...row, name: event.target.value }
                                : row,
                            ),
                          )
                        }
                        onBlur={() => persistTeamMember(index)}
                        placeholder="Full name"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Employee ID
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                        disabled={isSavingTeamAll || isRefreshingTeam}
                        value={member.employee_id}
                        onChange={(event) =>
                          setTeamMembers((prev) =>
                            prev.map((row, idx) =>
                              idx === index
                                ? { ...row, employee_id: event.target.value }
                                : row,
                            ),
                          )
                        }
                        onBlur={() => persistTeamMember(index)}
                        placeholder="ID"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Role
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                        disabled={isSavingTeamAll || isRefreshingTeam}
                        value={member.role}
                        onChange={(event) =>
                          setTeamMembers((prev) =>
                            prev.map((row, idx) =>
                              idx === index
                                ? { ...row, role: event.target.value }
                                : row,
                            ),
                          )
                        }
                        onBlur={() => persistTeamMember(index)}
                        placeholder="Role"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-100">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">
              High security
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Rotate super admin password
            </h2>
            <p className="text-sm text-slate-500">
              This updates the password for {SUPER_ADMIN_EMAIL}. A logout is
              required for the new password to take effect in the current
              session.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-2 space-y-6">
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
        </section>
      </div>
      {toastMessage && <Toast message={toastMessage} />}
      </main>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center">
      <div
        className="mt-10 rounded-3xl bg-gradient-to-r from-cyan-200 via-cyan-300 to-sky-300 px-6 py-4 text-sm font-semibold text-slate-900 shadow-[0_15px_40px_rgba(14,165,233,0.35)] backdrop-blur"
        style={{
          animation: "toastPop 220ms ease, toastFade 320ms ease 2.7s forwards",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-base font-bold text-indigo-600 shadow-inner shadow-indigo-100">
            ✓
          </span>
          <p className="text-base font-semibold leading-snug">{message}</p>
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
  );
}
