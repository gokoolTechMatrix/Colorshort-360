"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getRoleFromEmail } from "@/lib/role-map";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ??
  "admin@qube.com";

const slugifyRole = (role?: string | null) =>
  role?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ??
  "";

type DashboardProps = { profileName: string };
type DashboardConfig = {
  title: string;
  Component: (props: DashboardProps) => ReactElement;
};

const dashboards: Record<string, DashboardConfig> = {
  "store-incharge": {
    title: "Store Incharge Dashboard",
    Component: StoreInchargeDashboard,
  },
  "zonal-manager": {
    title: "Zonal Manager Dashboard",
    Component: ZonalManagerDashboard,
  },
  "purchase-manager": {
    title: "Purchase Manager Dashboard",
    Component: PurchaseManagerDashboard,
  },
  "service-co-ordinator": {
    title: "Service Co-ordinator Dashboard",
    Component: ServiceCoordinatorDashboard,
  },
  hr: {
    title: "HR Dashboard",
    Component: HrDashboard,
  },
  "sales-manager": {
    title: "Sales Manager Dashboard",
    Component: SalesManagerDashboard,
  },
  "sales-co-ordinator": {
    title: "Sales Co-ordinator Dashboard",
    Component: SalesCoordinatorDashboard,
  },
  accountant: {
    title: "Accountant Dashboard",
    Component: AccountantDashboard,
  },
  "service-engineer": {
    title: "Service Engineer Dashboard",
    Component: ServiceEngineerDashboard,
  },
  "sales-executive": {
    title: "Sales Executive Dashboard",
    Component: SalesExecutiveDashboard,
  },
  "service-manager": {
    title: "Service Manager Dashboard",
    Component: ServiceManagerDashboard,
  },
};

export default function RoleDashboardPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const params = useParams<{ role: string }>();
  const requestedSlug = Array.isArray(params.role) ? params.role[0] : params.role;

  const [profileName, setProfileName] = useState("Team Member");
  const [roleSlug, setRoleSlug] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/image.png");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const leadNavRoles = new Set([
    "super_admin",
    "admin",
    "hr",
    "finance",
    "accountant",
    "sales-manager",
    "sales-co-ordinator",
    "sales-executive",
    "service-manager",
    "service-co-ordinator",
    "service-executive",
    "service-engineer",
    "zonal-manager",
  ]);

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
      const fetchedRole =
        (user.user_metadata?.role as string | undefined) ??
        getRoleFromEmail(user.email) ??
        (await fetchRole(user.id));
      const computedSlug = slugifyRole(fetchedRole);
      const isSuperAdmin =
        user.email?.toLowerCase() === SUPER_ADMIN_EMAIL ||
        computedSlug === "super_admin";

      setRoleSlug(computedSlug);
      const derivedName =
        (user.user_metadata?.full_name as string | undefined) ?? "Team Member";
      setProfileName(derivedName);

      if (isSuperAdmin) {
        router.replace("/dashboard/admin");
        return;
      }

      if (!computedSlug) {
        setIsChecking(false);
        return;
      }

      if (requestedSlug !== computedSlug) {
        router.replace(`/dashboard/${computedSlug}`);
        return;
      }

      setIsChecking(false);
    };

    const fetchRole = async (userId: string) => {
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

    hydrate();
    return () => {
      active = false;
    };
  }, [requestedSlug, router, supabase]);

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

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
        Loading dashboard…
      </div>
    );
  }

  if (!roleSlug) {
    return (
      <RestrictedView
        message="No dashboard configured for this account."
        onLogout={handleLogout}
      />
    );
  }

  const config = dashboards[roleSlug];

  if (!config) {
    return (
      <RestrictedView
        message="This dashboard is not available for your role."
        onLogout={handleLogout}
      />
    );
  }

  const { Component, title } = config;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-50">
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        companyLogo={companyLogo}
        onLogout={handleLogout}
        isSigningOut={isSigningOut}
        activeHref="/dashboard"
        showLeadManagement={leadNavRoles.has(roleSlug ?? "")}
      />

      <main className="flex-1 px-6 py-10">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">
            Secure workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
        </header>
        <Component profileName={profileName} />
      </main>
    </div>
  );
}

function RestrictedView({
  message,
  onLogout,
}: {
  message: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200">
        <p className="text-sm uppercase tracking-[0.4em] text-rose-400">
          Restricted
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Access denied
        </h1>
        <p className="mt-4 text-sm text-slate-600">{message}</p>
        <button
          onClick={onLogout}
          className="mt-8 w-full rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Return to login
        </button>
      </div>
    </div>
  );
}

function KpiGrid({
  items,
  palette,
}: {
  items: Array<{ label: string; value: string; subLabel?: string }>;
  palette?: string[];
}) {
  const gradients =
    palette ??
    [
      "bg-[#e8f0ff]",
      "bg-[#ffe9ee]",
      "bg-[#fff4d9]",
      "bg-[#e9fff2]",
    ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.label}
      className={`group rounded-3xl border border-white/60 bg-gradient-to-br ${gradients[index % gradients.length]} p-5 shadow-lg shadow-slate-100 transition hover:-translate-y-1 hover:shadow-xl`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
        {item.label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">
        {item.value}
      </p>
      {item.subLabel && (
        <p className="mt-1 text-sm font-semibold text-slate-700">
          {item.subLabel}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  variant = "plain",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: "plain" | "pastel";
}) {
  const baseClasses =
    "rounded-[32px] border border-slate-100 bg-white/90 p-6 shadow-[0_25px_85px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_30px_110px_rgba(15,23,42,0.12)]";
  const pastelClasses =
    "rounded-[32px] border border-indigo-50 bg-gradient-to-br from-white via-indigo-50/60 to-white p-6 shadow-[0_25px_85px_rgba(99,102,241,0.12)] transition hover:-translate-y-1 hover:shadow-[0_30px_120px_rgba(99,102,241,0.16)]";

  return (
    <section className={variant === "pastel" ? pastelClasses : baseClasses}>
      <div className="mb-4 space-y-1">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        {subtitle && (
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm text-slate-600">
      {items.map((item, index) => (
        <li
          key={index}
          className="rounded-2xl border border-white/70 bg-gradient-to-r from-slate-50 to-white px-4 py-3 shadow-sm shadow-slate-100"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function QuickActions({ actions }: { actions: string[] }) {
  const actionPalette = [
    "from-indigo-200 to-indigo-400 text-indigo-900",
    "from-rose-200 to-rose-400 text-rose-900",
    "from-amber-200 to-amber-400 text-amber-900",
    "from-emerald-200 to-emerald-400 text-emerald-900",
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((action, index) => (
        <button
          key={action}
          className={`rounded-2xl bg-gradient-to-r ${actionPalette[index % actionPalette.length]} px-4 py-3 text-sm font-semibold shadow-md shadow-slate-200 transition hover:-translate-y-[2px] hover:shadow-lg`}
        >
          {action}
        </button>
      ))}
    </div>
  );
}

function ZonalManagerDashboard({ profileName }: DashboardProps) {
  const kpis = [
    { label: "Total Leads in Zone", value: "1,280", subLabel: "+5.3% vs last week" },
    { label: "New Leads This Week", value: "112", subLabel: "+18 new leads since yesterday" },
    { label: "Pending Approvals", value: "34", subLabel: "Quotation approvals pending" },
    { label: "Hot Leads", value: "76", subLabel: "Actively moving leads" },
  ];

  const zoneSnapshot = [
    { label: "Leads Assigned Today", value: "54", delta: "+14 vs yesterday" },
    { label: "Follow-ups Due Today", value: "89", delta: "-12 vs yesterday" },
    { label: "Conversions Today", value: "7", delta: "+2 since yesterday" },
    { label: "Escalations Raised", value: "2", delta: "Zone-wide issues" },
  ];

  const aging = [
    { label: "0-7 days", value: "420 Leads", percent: 72, tone: "emerald" },
    { label: "8-15 days", value: "240 Leads", percent: 56, tone: "sky" },
    { label: "16-30 days", value: "140 Leads", percent: 38, tone: "amber" },
    { label: "30+ days", value: "80 Leads", percent: 22, tone: "rose" },
  ];

  const executives = [
    { name: "Ananya (South)", closed: "78 Leads Closed", fill: 82, tone: "emerald" },
    { name: "Rohan (West)", closed: "62 Leads Closed", fill: 68, tone: "sky" },
    { name: "Meera (North)", closed: "38 Leads Closed", fill: 46, tone: "amber" },
    { name: "Arjun (East)", closed: "24 Leads Closed", fill: 34, tone: "indigo" },
  ];

  const followUps = [
    { label: "Pending Follow-ups", value: "182", tone: "indigo" },
    { label: "High Priority (Today)", value: "36", tone: "amber" },
    { label: "Overdue Follow-ups", value: "54", tone: "rose" },
    { label: "Completed Today", value: "89", tone: "emerald" },
  ];

  const pendingTasks = [
    "Approve 14 quotations from executives",
    "Reassign leads for inactive executives",
    "Review escalated customer complaints",
    "Validate special commodity leads",
    "Audit overdue follow-ups",
  ];

  const quickActions = ["+ New Lead", "Reassign Leads", "View Special Leads", "Export Zone Report"];

  const toneMap: Record<string, string> = {
    emerald: "from-emerald-400 to-emerald-600",
    sky: "from-sky-400 to-blue-500",
    amber: "from-amber-400 to-amber-500",
    rose: "from-rose-400 to-rose-500",
    indigo: "from-indigo-400 to-indigo-600",
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1da1f2] via-[#0fd1c5] to-[#14dfbd] p-6 text-white shadow-[0_28px_90px_rgba(13,161,242,0.32)]">
        <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-6 bottom-6 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-4 h-24 w-24 rounded-full bg-white/15 blur-2xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-white/80">
              Zonal Manager Dashboard
            </p>
            <h2 className="text-3xl font-semibold">
              Hello {profileName}, your zone performance at a glance.
            </h2>
            <p className="max-w-2xl text-sm text-white/80">
              Track approvals, freshness of the funnel, and executive throughput across your region.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">South & West zones</span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">Live escalations: 2</span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">Hot leads: 76</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <button className="rounded-full border border-white/70 bg-white px-4 py-2 text-cyan-700 shadow-sm transition hover:-translate-y-[1px] hover:shadow-lg">
              + Assign Leads
            </button>
            <button className="rounded-full border border-white/70 px-4 py-2 text-white transition hover:bg-white/15">
              View Approvals
            </button>
            <button className="rounded-full border border-white/70 px-4 py-2 text-white transition hover:bg-white/15">
              Export Zone Report
            </button>
          </div>
        </div>
      </div>

      <KpiGrid
        palette={[
          "from-[#b6dcff] via-[#8ec2ff] to-[#5aa5ff]",
          "from-[#ffd3e4] via-[#ff9fc7] to-[#ff74ac]",
          "from-[#ffe7b8] via-[#ffd17a] to-[#ffb347]",
          "from-[#bff7e0] via-[#78e8c2] to-[#38dba5]",
        ]}
        items={kpis}
      />

      <Section title="Zone snapshot" subtitle="Today in your zone" variant="pastel">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {zoneSnapshot.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-indigo-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              <p className="text-xs font-semibold text-slate-500">{item.delta}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Lead aging" subtitle="Pipeline freshness by bucket">
        <div className="grid gap-3">
          {aging.map((bucket) => (
            <div
              key={bucket.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100"
            >
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>{bucket.label}</span>
                <span className="text-xs text-slate-500">{bucket.value}</span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${toneMap[bucket.tone]}`}
                  style={{ width: `${bucket.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Executive performance" subtitle="Top executives and closures">
        <div className="space-y-3">
          {executives.map((exec) => (
            <div
              key={exec.name}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100"
            >
              <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span>{exec.name}</span>
                </div>
                <button className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200">
                  View
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">{exec.closed}</p>
              <div className="mt-3 h-3 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${toneMap[exec.tone]}`}
                  style={{ width: `${exec.fill}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Follow-up summary" subtitle="What needs attention today" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {followUps.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm shadow-indigo-100"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              <div
                className={`mt-2 h-1.5 rounded-full bg-gradient-to-r ${toneMap[item.tone]}`}
                style={{ width: "100%" }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pending tasks" subtitle="Action queue">
        <div className="grid gap-3 lg:grid-cols-2">
          {pendingTasks.map((task) => (
            <div
              key={task}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-100"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-50 text-indigo-600 shadow-inner">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                <span>{task}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Action</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Quick actions" subtitle="Move faster" variant="pastel">
        <div className="rounded-3xl border border-cyan-100 bg-gradient-to-r from-[#e0f4ff] via-[#e0fff7] to-[#f3fff0] p-4 shadow-sm shadow-cyan-100">
          <QuickActions actions={quickActions} />
        </div>
      </Section>
    </div>
  );
}

function StoreInchargeDashboard({ profileName }: DashboardProps) {
  const kpis = [
    { label: "Total Stock Value", value: "Rs 12,40,000", subLabel: "+3.2% vs last week" },
    { label: "Low Stock Items", value: "8", subLabel: "3 critical" },
    { label: "Today GRNs", value: "3", subLabel: "2 pending QA" },
    { label: "Material Issues", value: "5", subLabel: "Service dept" },
  ];
  const buckets = [
    { label: "Raw Materials", value: "Rs 7,20,000", percent: 60 },
    { label: "Finished Goods", value: "Rs 4,10,000", percent: 34 },
    { label: "Others", value: "Rs 1,10,000", percent: 9 },
  ];
  const alerts = [
    "GRN received from Steel Traders (Rs 35,000)",
    "Issued bearings to Service Dept (WO-140)",
    "Received 20 lubrication cans from Vendor",
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Store incharge
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {profileName}, keep stock healthy and flowing.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Monitor valuations, inflow/outflow, and low stock in one glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              GRNs today: 3
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Issues: 5
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Low stock: 8
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-white px-4 py-2 text-indigo-700 transition hover:-translate-y-[1px] hover:shadow-sm">
            + Create GRN
          </button>
          <button className="rounded-2xl border border-white/60 bg-white/10 px-4 py-2 text-white transition hover:-translate-y-[1px] hover:bg-white/15">
            Issue material
          </button>
        </div>
      </div>

      <KpiGrid
        items={kpis}
        palette={[
          "bg-gradient-to-br from-[#7ab4ff] via-[#2f8cff] to-[#0067ff]",
          "bg-gradient-to-br from-[#ffa3cb] via-[#ff5b9b] to-[#ff2a7a]",
          "bg-gradient-to-br from-[#ffce70] via-[#ff9c2f] to-[#ff7600]",
          "bg-gradient-to-br from-[#96ffc9] via-[#3eea91] to-[#00c76a]",
        ]}
      />

      <Section subtitle={`Overview for ${profileName}`} title="Stock overview" variant="pastel">
        <div className="space-y-4 text-sm text-slate-600">
          {buckets.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600"
                  style={{ inlineSize: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's activities" variant="pastel">
        <List items={alerts} />
      </Section>

      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Create GRN",
            "+ Issue Material",
            "+ Add Stock",
            "+ Record Damage",
            "+ Export Inventory",
          ]}
        />
      </Section>
    </div>
  );
}

function PurchaseManagerDashboard({ profileName }: DashboardProps) {
  const spend = [
    { label: "Electrical", value: "₹ 1,60,000" },
    { label: "Mechanical", value: "₹ 1,10,000" },
    { label: "Consumables", value: "₹ 90,000" },
  ];
  const tasks = [
    "Approve PO-221 (Fasteners Ltd – ₹18,000)",
    "Create PO for Steel Rod (PR-112)",
    "Follow-up GRN from Lubricant Supplier",
    "Lock vendor shortlist for bearings",
  ];
  const actions = [
    "+ Create PO",
    "+ Add Vendor",
    "+ Review PR",
    "+ Price Comparison",
    "+ Request Quotes",
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Purchase control
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              {profileName}, streamline POs and GRNs.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Track approvals, inbound GRNs, and vendor spend in one view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Open PRs: 12
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              POs pending: 4
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              GRNs pending: 3
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-white px-4 py-2 text-indigo-700 transition hover:-translate-y-[1px] hover:shadow-sm">
            + Create PO
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:-translate-y-[1px] hover:bg-white/15">
            Review PRs
          </button>
        </div>
      </div>

      <KpiGrid
        items={[
          { label: "Open PRs", value: "12", subLabel: "4 urgent" },
          { label: "POs Pending Approval", value: "4", subLabel: "Avg age 6h" },
          { label: "GRNs Pending", value: "3", subLabel: "2 need QA" },
          { label: "Monthly Purchase Value", value: "₹ 4,20,000", subLabel: "+6% vs last month" },
        ]}
      />

      <Section title="Purchase overview" subtitle={`Spend split for ${profileName}`} variant="pastel">
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
          {spend.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/70 bg-white/90 px-4 py-4 shadow-sm shadow-indigo-50 transition hover:-translate-y-[2px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's tasks" variant="pastel">
        <List items={tasks} />
      </Section>

      <Section title="Quick actions">
        <QuickActions actions={actions} />
      </Section>
    </div>
  );
}

function ServiceCoordinatorDashboard({ profileName }: DashboardProps) {
  const queue = [
    { ticket: "T-312", issue: "Belt slippage", site: "Chennai", age: "28m", priority: "High" },
    { ticket: "T-305", issue: "Sensor fault", site: "Coimbatore", age: "1h 12m", priority: "Medium" },
    { ticket: "T-299", issue: "Motor vibration", site: "Madurai", age: "2h 05m", priority: "High" },
    { ticket: "T-295", issue: "HMI restart", site: "Trichy", age: "3h 42m", priority: "Low" },
  ];
  const engineers = [
    { name: "Aravind", zone: "North", jobs: 3, eta: "18m", status: "Onsite" },
    { name: "Meena", zone: "Central", jobs: 2, eta: "32m", status: "Enroute" },
    { name: "Karthik", zone: "South", jobs: 4, eta: "54m", status: "On call" },
    { name: "Rahul", zone: "West", jobs: 1, eta: "08m", status: "Wrapping" },
  ];
  const sla = [
    { label: "First Response", value: 86 },
    { label: "Resolution", value: 72 },
    { label: "Follow-up", value: 91 },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/80">
              Service control
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              Hi {profileName}, keep the tickets flowing.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Dispatch engineers faster, watch SLA health, and unblock high-priority calls.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              Live Tickets: 18
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              Field Engineers: 12
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              SLA: 92% on track
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
          <button className="rounded-2xl bg-white px-4 py-2 text-sky-700 shadow-lg shadow-sky-200 transition hover:-translate-y-[1px] hover:shadow-xl">
            + Dispatch engineer
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:bg-white/15">
            View escalations
          </button>
        </div>
      </div>

      <KpiGrid
        items={[
          { label: "New Complaints Today", value: "12", subLabel: "+4 vs yesterday" },
          { label: "Jobs Assigned", value: "18", subLabel: "5 awaiting dispatch" },
          { label: "Pending Jobs", value: "7", subLabel: "3 overdue" },
          { label: "Completed Today", value: "9", subLabel: "Avg TTR 56m" },
        ]}
      />
      <Section
        title="Service pipeline"
        subtitle={`Pipeline health for ${profileName}`}
        variant="pastel"
      >
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { stage: "Logged", value: 22, color: "from-indigo-200 to-indigo-400" },
            { stage: "Assigned", value: 18, color: "from-sky-200 to-sky-400" },
            { stage: "In Progress", value: 11, color: "from-amber-200 to-amber-400" },
            { stage: "Completed", value: 9, color: "from-emerald-200 to-emerald-400" },
          ].map((item) => (
            <div
              key={item.stage}
              className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-indigo-50 transition hover:-translate-y-[2px] hover:shadow-lg"
            >
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-2xl font-semibold text-slate-900 shadow-inner shadow-white`}
              >
                {item.value}
              </div>
              <p className="mt-3 text-center text-xs uppercase tracking-[0.3em] text-slate-500">
                {item.stage}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Live queue">
        <div className="grid gap-3 lg:grid-cols-2">
          {queue.map((ticket, index) => (
            <div
              key={ticket.ticket}
              className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="absolute inset-0 opacity-70 blur-2xl" style={{ background: `radial-gradient(circle at 30% 20%, rgba(59,130,246,0.12), transparent 35%), radial-gradient(circle at 70% 0%, rgba(16,185,129,0.12), transparent 30%)` }} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    {ticket.ticket} · {ticket.site}
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {ticket.issue}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Age: {ticket.age}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    ticket.priority === "High"
                      ? "bg-rose-50 text-rose-600"
                      : ticket.priority === "Medium"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {ticket.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Engineer utilization" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {engineers.map((engineer) => (
            <div
              key={engineer.name}
              className="rounded-2xl border border-indigo-50 bg-white/90 p-4 text-sm shadow-md shadow-indigo-100 transition hover:-translate-y-[2px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">
                  {engineer.name}
                </p>
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                  {engineer.zone}
                </span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                Status: {engineer.status}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Jobs: {engineer.jobs}
                </p>
                <p className="text-xs font-semibold text-emerald-600">
                  ETA {engineer.eta}
                </p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-emerald-400"
                  style={{ width: `${Math.min(engineer.jobs * 18 + 30, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="SLA health">
        <div className="grid gap-4 sm:grid-cols-3">
          {sla.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {metric.label}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-semibold text-slate-900">
                  {metric.value}%
                </p>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
                  Target 90%
                </span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's priority tasks">
        <List
          items={[
            "Dispatch engineer for motor overheating (Kumar Industries)",
            "Follow-up with Aravind on T-298 and update ETA",
            "Schedule site visit for conveyor fault at Sri Plastics",
            "Call back T-305 and confirm spare readiness",
          ]}
        />
      </Section>
    </div>
  );
}

function SalesCoordinatorDashboard({ profileName }: DashboardProps) {
  const router = useRouter();
  const deals = [
    { name: "Sri Plastics", value: "₹ 4,80,000", stage: "Negotiation", eta: "Close in 5d", tone: "amber" },
    { name: "North Mills", value: "₹ 3,25,000", stage: "Quote sent", eta: "Follow-up tomorrow", tone: "sky" },
    { name: "Summit Agro", value: "₹ 2,10,000", stage: "Contacted", eta: "Demo scheduled", tone: "indigo" },
    { name: "Arora Foods", value: "₹ 1,45,000", stage: "Won", eta: "PO received", tone: "emerald" },
  ];
  const funnel = [
    { stage: "New", value: 12, gradient: "from-indigo-200 via-indigo-300 to-indigo-400" },
    { stage: "Contacted", value: 20, gradient: "from-sky-200 via-sky-300 to-sky-400" },
    { stage: "Quotation Sent", value: 8, gradient: "from-amber-200 via-amber-300 to-amber-400" },
    { stage: "Negotiation", value: 6, gradient: "from-purple-200 via-purple-300 to-purple-400" },
    { stage: "Closed", value: 4, gradient: "from-emerald-200 via-emerald-300 to-emerald-400" },
  ];
  const actions = ["+ Add Lead", "+ Create Quotation", "+ Assign Lead", "+ Send Follow-up", "+ Schedule Demo", "+ Send Catalog"];
  const tasks = [
    "Assign 3 new leads to sales team",
    "Prepare quotation for Sri Plastics",
    "Follow-up pending quotation Q-142",
    "Send product catalogue to Star Metals",
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Sales coordination
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              {profileName}, keep the funnel moving.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Track leads, follow-ups, and conversion health at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Leads today: 12
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Quotes sent: 10
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Win rate: 24%
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-2xl bg-white px-4 py-2 text-indigo-700 transition hover:-translate-y-[1px] hover:shadow-sm"
            onClick={() => router.push("/dashboard/sales-co-ordinator/add-lead")}
          >
            + Add lead
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:-translate-y-[1px] hover:bg-white/15">
            Schedule demo
          </button>
        </div>
      </div>

      <KpiGrid
        items={[
          { label: "New Leads Today", value: "12" },
          { label: "Quotations Pending", value: "8" },
          { label: "Follow-ups Today", value: "6" },
          { label: "Orders Closed", value: "4" },
        ]}
      />
      <Section title="Lead pipeline summary" subtitle={`Focus areas for ${profileName}`} variant="pastel">
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-5">
          {funnel.map((item) => (
            <div
              key={item.stage}
              className={`rounded-2xl border border-white/70 bg-gradient-to-br ${item.gradient} p-4 text-center text-slate-900 shadow-md shadow-indigo-100 transition hover:-translate-y-[2px] hover:shadow-xl`}
            >
              <div className="text-3xl font-semibold">{item.value}</div>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-800">
                {item.stage}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Top opportunities" subtitle="Focus deals to close" variant="pastel">
        <div className="grid gap-3 lg:grid-cols-2">
          {deals.map((deal) => (
            <div
              key={deal.name}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{deal.name}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {deal.stage}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    deal.tone === "amber"
                      ? "bg-amber-50 text-amber-700"
                      : deal.tone === "sky"
                        ? "bg-sky-50 text-sky-700"
                        : deal.tone === "emerald"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {deal.value}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-600">
                {deal.eta}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's task list">
        <List items={tasks} />
      </Section>

      <Section title="Quick actions">
        <QuickActions actions={actions} />
      </Section>
    </div>
  );
}

function SalesManagerDashboard({ profileName }: DashboardProps) {
  const kpis = [
    { label: "Team Pipeline", value: "Rs 3.8 Cr", subLabel: "12 deals in focus" },
    { label: "Target Achievement", value: "76%", subLabel: "Tracking monthly quota" },
    { label: "Win Rate", value: "31%", subLabel: "+3 pts vs last month" },
    { label: "Follow-ups Due", value: "18", subLabel: "6 overdue today" },
  ];
  const leaderboard = [
    { name: "Anita Rao", pipeline: "Rs 92L", won: 6, followups: 3, score: 93, tone: "emerald" },
    { name: "Naveen Kumar", pipeline: "Rs 81L", won: 5, followups: 4, score: 88, tone: "indigo" },
    { name: "Farah Iqbal", pipeline: "Rs 74L", won: 4, followups: 2, score: 84, tone: "amber" },
    { name: "Rahul Menon", pipeline: "Rs 68L", won: 3, followups: 5, score: 79, tone: "sky" },
  ];
  const pipelineStages = [
    { stage: "New Leads", count: 64, rate: "100%", fill: 100, color: "from-indigo-200 to-indigo-500" },
    { stage: "Contacted", count: 52, rate: "81%", fill: 81, color: "from-sky-200 to-sky-500" },
    { stage: "Quote Sent", count: 28, rate: "54%", fill: 54, color: "from-amber-200 to-amber-500" },
    { stage: "Negotiation", count: 16, rate: "29%", fill: 29, color: "from-purple-200 to-purple-500" },
    { stage: "Won", count: 9, rate: "14%", fill: 14, color: "from-emerald-200 to-emerald-500" },
  ];
  const regions = [
    { region: "South", value: "Rs 1.4 Cr", growth: "+12%", fill: 82 },
    { region: "West", value: "Rs 98L", growth: "+6%", fill: 68 },
    { region: "North", value: "Rs 72L", growth: "-4%", fill: 54 },
    { region: "East", value: "Rs 48L", growth: "+3%", fill: 46 },
  ];
  const alerts = [
    "3 deals stuck in negotiation for 7+ days (seek pricing support).",
    "6 follow-ups overdue today (reassign to available executive).",
    "North region at 68% of target (trigger offer campaign).",
    "2 discount approvals pending manager review.",
  ];
  const quickActions = [
    "+ Assign leads",
    "+ Approve discount",
    "+ Broadcast update",
    "+ Export pipeline",
    "+ Schedule review",
    "+ Add offer",
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Sales manager
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {profileName}, steer the team to target.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Track pipeline health, unblock deals, and push regional momentum.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Team on-track: 76%
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Priority deals: 12
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Avg response: 1.8h
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-white px-4 py-2 text-indigo-700 transition hover:-translate-y-[1px] hover:shadow-sm">
            Assign leads
          </button>
          <button className="rounded-2xl border border-white/60 bg-white/10 px-4 py-2 text-white transition hover:-translate-y-[1px] hover:bg-white/15">
            Approve discounts
          </button>
          <button className="rounded-2xl border border-white/60 bg-white/10 px-4 py-2 text-white transition hover:-translate-y-[1px] hover:bg-white/15">
            Export report
          </button>
        </div>
      </div>

      <KpiGrid items={kpis} />

      <Section title="Team leaderboard" subtitle="Performance this week" variant="pastel">
        <div className="grid gap-3 lg:grid-cols-2">
          {leaderboard.map((member) => (
            <div
              key={member.name}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[2px] hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{member.name}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {member.won} won / {member.followups} follow-ups pending
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    member.tone === "emerald"
                      ? "bg-emerald-50 text-emerald-700"
                      : member.tone === "indigo"
                        ? "bg-indigo-50 text-indigo-700"
                        : member.tone === "amber"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-sky-50 text-sky-700"
                  }`}
                >
                  Score {member.score}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                <span>Pipeline: {member.pipeline}</span>
                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  Follow-ups: {member.followups}
                </span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(member.score, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pipeline health" subtitle="Stage conversion and velocity" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {pipelineStages.map((stage) => (
            <div
              key={stage.stage}
              className="rounded-2xl border border-white/70 bg-white/95 p-4 shadow-md shadow-indigo-50 transition hover:-translate-y-[2px] hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{stage.stage}</p>
                <span className="text-xs font-semibold text-slate-500">{stage.rate}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stage.count}</p>
              <div className="mt-3 h-2.5 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${stage.color}`}
                  style={{ width: `${stage.fill}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Region performance" subtitle="Revenue and growth by zone">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {regions.map((region) => (
            <div
              key={region.region}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{region.region}</p>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                    region.growth.startsWith("-")
                      ? "bg-rose-50 text-rose-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {region.growth}
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-slate-900">{region.value}</p>
              <div className="mt-3 h-2.5 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-500"
                  style={{ width: `${region.fill}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Manager watchlist" subtitle="Alerts and approvals">
        <div className="grid gap-3 lg:grid-cols-2">
          {alerts.map((alert) => (
            <div
              key={alert}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <span>{alert}</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                Action
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Quick actions">
        <QuickActions actions={quickActions} />
      </Section>
    </div>
  );
}

function AccountantDashboard({ profileName }: DashboardProps) {
  const receivables = [
    { label: "0-7 days", value: "₹ 6,20,000", percent: 38, tone: "emerald" },
    { label: "8-15 days", value: "₹ 4,10,000", percent: 25, tone: "sky" },
    { label: "16-30 days", value: "₹ 3,20,000", percent: 20, tone: "amber" },
    { label: "30+ days", value: "₹ 1,30,000", percent: 8, tone: "rose" },
  ];
  const payables = [
    { vendor: "Steel Traders", due: "₹ 2,45,000", aging: "Due in 2d", tone: "rose" },
    { vendor: "Fasteners Ltd", due: "₹ 1,80,000", aging: "Due in 5d", tone: "amber" },
    { vendor: "Logistics Hub", due: "₹ 95,000", aging: "Due in 8d", tone: "sky" },
    { vendor: "Packaging Co", due: "₹ 62,000", aging: "Due in 12d", tone: "emerald" },
  ];
  const taxes = [
    { label: "GST Payable", value: "₹ 1,48,720", detail: "Next filing in 5 days" },
    { label: "GST Collected", value: "₹ 1,86,400", detail: "Set-off ready" },
    { label: "TDS Payable", value: "₹ 82,300", detail: "Due on 7th" },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Finance cockpit
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              Hello {profileName}, cash & compliance at a glance.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Monitor receivables, payables, and tax positions in real time.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
              Cash on hand: ₹ 9.2 Cr
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
              Net flow today: +₹ 74.5 L
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
              Filing in 5 days
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-slate-50 px-4 py-2 text-sky-700 transition hover:-translate-y-[1px] hover:shadow-sm">
            + Create invoice
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:bg-white/15">
            Reconcile payments
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:bg-white/15">
            Export aging
          </button>
        </div>
      </div>

      <KpiGrid
        items={[
          { label: "Total Receivables", value: "₹ 14,80,000", subLabel: "↑ ₹ 2.1L vs last week" },
          { label: "Total Payables", value: "₹ 12,40,000", subLabel: "↓ ₹ 80k vs last week" },
          { label: "GST Collected", value: "₹ 1,86,400", subLabel: "Ready for set-off" },
          { label: "GST Payable", value: "₹ 1,48,720", subLabel: "Due in 5 days" },
        ]}
      />
      <Section
        title="Cash flow snapshot"
        subtitle={`Daily overview for ${profileName}`}
        variant="pastel"
      >
        <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-3">
          {[
            { label: "Inflow today", value: "₹ 11,20,000", detail: "+8% vs last week", tone: "emerald" },
            { label: "Outflow today", value: "₹ 1,45,000", detail: "-3% vs last week", tone: "rose" },
            { label: "Net position", value: "+₹ 9,75,000", detail: "After payables", tone: "sky" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-indigo-50 bg-white/90 p-4 shadow-md shadow-indigo-100 transition hover:-translate-y-[2px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {card.value}
              </p>
              <p
                className={`text-xs font-semibold ${
                  card.tone === "emerald"
                    ? "text-emerald-600"
                    : card.tone === "rose"
                      ? "text-rose-600"
                      : "text-sky-600"
                }`}
              >
                {card.detail}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Receivables aging" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {receivables.map((bucket) => (
            <div
              key={bucket.label}
              className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {bucket.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {bucket.value}
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    bucket.tone === "rose"
                      ? "bg-rose-400"
                      : bucket.tone === "amber"
                        ? "bg-amber-400"
                        : bucket.tone === "sky"
                          ? "bg-sky-400"
                          : "bg-emerald-400"
                  }`}
                  style={{ width: `${bucket.percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {bucket.percent}% of total
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Payables by urgency">
        <div className="grid gap-3 lg:grid-cols-2">
          {payables.map((bill) => (
            <div
              key={bill.vendor}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">
                  {bill.vendor}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    bill.tone === "rose"
                      ? "bg-rose-50 text-rose-600"
                      : bill.tone === "amber"
                        ? "bg-amber-50 text-amber-700"
                        : bill.tone === "sky"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {bill.aging}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {bill.due}
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-sky-400"
                  style={{ width: "68%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tax summary" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-3">
          {taxes.map((tax) => (
            <div
              key={tax.label}
              className="rounded-2xl border border-indigo-50 bg-white/90 p-4 shadow-sm shadow-indigo-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {tax.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {tax.value}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                {tax.detail}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pending tasks">
        <List
          items={[
            "Review 4 invoices due today and trigger reminders",
            "Approve 2 vendor bills for payment run",
            "Prepare GST filing pack (due in 5 days)",
            "Reconcile yesterday’s bank statement",
          ]}
        />
      </Section>

      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Create Invoice",
            "+ Record Payment",
            "+ Add Expense",
            "+ Add Vendor Bill",
            "+ Export Aging",
            "+ Reconcile Bank",
          ]}
        />
      </Section>
    </div>
  );
}

function ServiceEngineerDashboard({ profileName }: DashboardProps) {
  const jobs = [
    { time: "09:15", client: "Kumar Industries", issue: "Motor Overheat", priority: "High", eta: "Onsite", status: "In progress" },
    { time: "12:00", client: "Star Metals", issue: "Alignment Issue", priority: "Medium", eta: "45m", status: "Queued" },
    { time: "15:30", client: "Sri Plastics", issue: "Belt Trouble", priority: "Low", eta: "2h", status: "Queued" },
    { time: "17:10", client: "North Mills", issue: "Sensor Fault", priority: "High", eta: "3h", status: "Queued" },
  ];
  const parts = [
    { name: "Motor Belt", stock: "12 in van", need: 1, status: "Ready" },
    { name: "Sensor Board", stock: "3 in hub", need: 1, status: "Pick up" },
    { name: "Grease Pack", stock: "5 in van", need: 2, status: "Ready" },
    { name: "Fasteners Kit", stock: "Low", need: 1, status: "Order" },
  ];
  const load = [
    { label: "Assigned", value: 6, color: "from-indigo-300 to-indigo-500" },
    { label: "In progress", value: 3, color: "from-amber-300 to-amber-500" },
    { label: "Completed", value: 4, color: "from-emerald-300 to-emerald-500" },
    { label: "Escalations", value: 1, color: "from-rose-300 to-rose-500" },
  ];
  const loadFills = ["#dbeafe", "#fef3c7", "#dcfce7", "#ffe4e6"];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Field ops
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              {profileName}, your routes are live.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Track visits, spares, and SLA health on the go.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
              Jobs today: 9
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
              On-time: 92%
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
              Response: 34m avg
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-slate-50 px-4 py-2 text-indigo-700 transition hover:-translate-y-[1px] hover:shadow-sm">
            Start next job
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:bg-white/15">
            View route map
          </button>
        </div>
      </div>

      <KpiGrid
        items={[
          { label: "Jobs Assigned", value: "9", subLabel: "3 in progress" },
          { label: "Completed Today", value: "4", subLabel: "Avg 52m" },
          { label: "Pending Jobs", value: "5", subLabel: "2 high priority" },
          { label: "Escalations", value: "1", subLabel: "Follow-up at 4 PM" },
        ]}
      />

      <Section title="Workload status" variant="pastel">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {load.map((item, index) => (
            <div
              key={item.label}
              className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-4 shadow-[0_18px_45px_rgba(59,130,246,0.12)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(59,130,246,0.18)]"
            >
              <div className="absolute inset-0 opacity-50 blur-2xl bg-white" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl shadow-inner shadow-white/70 ring-2 ring-white/60 transition duration-300 group-hover:scale-105"
                    style={{ backgroundColor: loadFills[index % loadFills.length] }}
                  >
                    <span className="relative text-lg font-extrabold text-slate-900">
                      {item.value}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-600">
                      {item.label}
                    </p>
                    <p className="text-[11px] font-semibold text-indigo-600 opacity-0 transition duration-200 group-hover:opacity-100">
                      Tap for details
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's visit schedule" subtitle="Upcoming calls and priorities">
        <div className="grid gap-3 lg:grid-cols-2">
          {jobs.map((job) => (
            <div
              key={job.client + job.time}
              className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="absolute inset-0 opacity-70 blur-2xl" style={{ background: `radial-gradient(circle at 30% 20%, rgba(59,130,246,0.12), transparent 35%), radial-gradient(circle at 70% 0%, rgba(16,185,129,0.12), transparent 30%)` }} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    {job.time} · {job.client}
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {job.issue}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    ETA: {job.eta}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      job.priority === "High"
                        ? "bg-rose-50 text-rose-600"
                        : job.priority === "Medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {job.priority}
                  </span>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                    {job.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spares readiness" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {parts.map((part) => (
            <div
              key={part.name}
              className="rounded-2xl border border-slate-100 bg-white/90 p-4 text-sm shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {part.name}
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                Stock: {part.stock}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                Need: {part.need}
              </p>
              <span
                className={`mt-3 inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold ${
                  part.status === "Ready"
                    ? "bg-emerald-50 text-emerald-700"
                    : part.status === "Pick up"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-600"
                }`}
              >
                {part.status}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Start Job",
            "+ Upload Photo",
            "+ Add Spare Usage",
            "+ Close Job",
            "+ Update ETA",
            "+ Mark Escalation",
          ]}
        />
      </Section>
    </div>
  );
}

function SalesExecutiveDashboard({ profileName }: DashboardProps) {
  const deals = [
    { name: "Sri Plastics", value: "₹ 4,80,000", stage: "Negotiation", eta: "Close in 5d", tone: "amber" },
    { name: "North Mills", value: "₹ 3,25,000", stage: "Quote sent", eta: "Follow-up tomorrow", tone: "sky" },
    { name: "Summit Agro", value: "₹ 2,10,000", stage: "Contacted", eta: "Demo scheduled", tone: "indigo" },
    { name: "Arora Foods", value: "₹ 1,45,000", stage: "Won", eta: "PO received", tone: "emerald" },
  ];
  const funnel = [
    { stage: "New Leads", value: 22, color: "from-indigo-100 to-indigo-300" },
    { stage: "Contacted", value: 18, color: "from-sky-100 to-sky-300" },
    { stage: "Quote Sent", value: 10, color: "from-amber-100 to-amber-300" },
    { stage: "Negotiation", value: 6, color: "from-purple-100 to-purple-300" },
    { stage: "Won", value: 3, color: "from-emerald-100 to-emerald-300" },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Sales command
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {profileName}, keep momentum on live deals.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Track funnel health, follow-ups, and top opportunities.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Leads today: 12
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Win rate: 28%
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Follow-ups pending: 7
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-white px-4 py-2 text-indigo-700 transition hover:-translate-y-[1px] hover:shadow-sm">
            + Add lead
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:-translate-y-[1px] hover:bg-white/15">
            Log follow-up
          </button>
        </div>
      </div>

      <KpiGrid
        items={[
          { label: "Leads Assigned", value: "14", subLabel: "+4 today" },
          { label: "Follow-ups Due", value: "9", subLabel: "7 today" },
          { label: "Orders Won", value: "3", subLabel: "Win rate 28%" },
          { label: "Pipeline Value", value: "₹ 12,35,000", subLabel: "Prioritized top 5" },
        ]}
      />

      <Section title="Sales funnel" subtitle={`Live funnel for ${profileName}`} variant="pastel">
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-5">
          {funnel.map((item) => (
            <div
              key={item.stage}
              className="rounded-2xl border border-white/70 bg-white/90 p-4 text-center shadow-sm shadow-indigo-50 transition hover:-translate-y-[2px] hover:shadow-lg"
            >
              <div
                className={`mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-xl font-semibold text-slate-800 shadow-inner shadow-white`}
              >
                {item.value}
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {item.stage}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Top opportunities" subtitle="Focus deals to close" variant="pastel">
        <div className="grid gap-3 lg:grid-cols-2">
          {deals.map((deal) => (
            <div
              key={deal.name}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{deal.name}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {deal.stage}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    deal.tone === "amber"
                      ? "bg-amber-50 text-amber-700"
                      : deal.tone === "sky"
                        ? "bg-sky-50 text-sky-700"
                        : deal.tone === "emerald"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {deal.value}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-600">
                {deal.eta}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Quick actions">
        <QuickActions
          actions={["+ Add Lead", "+ Add Quotation", "+ Log Activity", "+ Schedule Demo", "+ Send Catalog"]}
        />
      </Section>
    </div>
  );
}

function ServiceManagerDashboard({ profileName }: DashboardProps) {
  const escalations = [
    { ticket: "T-298", issue: "Motor overheating", age: "2h 15m", status: "Escalated", priority: "High" },
    { ticket: "T-285", issue: "Sensor fault", age: "4h 20m", status: "Pending RCA", priority: "Medium" },
    { ticket: "T-279", issue: "HMI reboot", age: "6h 05m", status: "Waiting parts", priority: "Low" },
  ];
  const visits = [
    "08:30 AM – Arora Foods – Dryer vibration",
    "12:00 PM – North Mills – Camera calibration",
    "03:30 PM – Summit Agro – Belt replacement",
    "05:30 PM – Chennai Agro – Nozzle calibration",
  ];
  const dispatch = [
    { zone: "North", jobs: 5, eta: "28m", score: 82 },
    { zone: "Central", jobs: 4, eta: "36m", score: 75 },
    { zone: "South", jobs: 6, eta: "42m", score: 68 },
    { zone: "West", jobs: 3, eta: "24m", score: 88 },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c78ff] via-[#119dff] to-[#07d6c0] p-6 text-white shadow-[0_25px_80px_rgba(59,130,246,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              Service manager
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {profileName}, keep the field humming.
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Monitor workload, dispatch efficiency, and escalations in one view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Live tickets: 18
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              SLA on-time: 91%
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur">
              Dispatch avg: 32m
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-white px-4 py-2 text-indigo-700 transition hover:-translate-y-[1px] hover:shadow-sm">
            View dispatch
          </button>
          <button className="rounded-2xl border border-white/60 px-4 py-2 text-white transition hover:-translate-y-[1px] hover:bg-white/10">
            Escalation board
          </button>
        </div>
      </div>

      <Section
        title="Service status overview"
        subtitle={`Snapshot for ${profileName}`}
        variant="pastel"
      >
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-4">
          {[
            { label: "Pending", value: "8", color: "from-rose-100 to-rose-200" },
            { label: "In Progress", value: "5", color: "from-amber-100 to-amber-200" },
            { label: "Completed Today", value: "4", color: "from-emerald-100 to-emerald-200" },
            { label: "Escalated", value: "1", color: "from-indigo-100 to-indigo-200" },
          ].map((status) => (
            <div
              key={status.label}
              className="rounded-2xl border border-white/70 bg-white/90 p-4 text-center shadow-sm shadow-indigo-50 transition hover:-translate-y-[2px] hover:shadow-lg"
            >
              <div
                className={`mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${status.color} text-lg font-semibold text-slate-900 shadow-inner shadow-white`}
              >
                {status.value}
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {status.label}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's scheduled visits" subtitle="Keep routes tight">
        <List items={visits} />
      </Section>

      <Section title="Dispatch efficiency" subtitle="Zone performance" variant="pastel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dispatch.map((row) => (
            <div
              key={row.zone}
              className="rounded-2xl border border-slate-100 bg-white/90 p-4 text-sm shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">{row.zone}</p>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                  {row.jobs} jobs
                </span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                ETA {row.eta}
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-emerald-400"
                  style={{ width: `${row.score}%` }}
                />
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Performance: {row.score}%
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Escalations board" subtitle="Unblock high-priority tickets">
        <div className="grid gap-3 lg:grid-cols-3">
          {escalations.map((item) => (
            <div
              key={item.ticket}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">
                  {item.ticket}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    item.priority === "High"
                      ? "bg-rose-50 text-rose-600"
                      : item.priority === "Medium"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {item.priority}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {item.issue}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {item.status} · Age {item.age}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Quick actions">
        <QuickActions
          actions={[
            "+ Create Work Order",
            "+ Add Complaint",
            "+ Assign Technician",
            "+ Escalate Ticket",
            "+ Update ETA",
          ]}
        />
      </Section>
    </div>
  );
}

type HrKpi = { label: string; value: number | string; detail?: string; trend?: string };
type HrData = {
  filters: {
    locations: string[];
    departments: string[];
    dateRanges: string[];
  };
  kpis: { primary: HrKpi[]; secondary: { label: string; value: number | string; insight: string }[] };
  navCards: string[];
  quickActions: string[];
  attendance: {
    summary: { total: number; present: number; absent: number; leave: number; onField: number; unmarked: number };
    rows: Array<{
      department: string;
      total: number;
      present: number;
      absent: number;
      leave: number;
      onField: number;
      unmarked: number;
      presentPercent: number;
    }>;
  };
  approvals: Array<{
    type: string;
    reqId: string;
    employee: string;
    dept: string;
    details: string;
    requestedOn: string;
    ageing: string;
  }>;
  joiningsExits: Array<{
    type: string;
    title: string;
    dept: string;
    location: string;
    date: string;
    status: string;
  }>;
  recruitment: Array<{
    position: string;
    dept: string;
    location: string;
    requiredBy: string;
    pipeline: number;
    stage: string;
    risk: string;
  }>;
  skills: Array<{
    employee: string;
    dept: string;
    certification: string;
    issuer: string;
    expiry: string;
    risk: string;
  }>;
  fieldStatus: Array<{
    technician: string;
    region: string;
    skill: string;
    firstJob: string;
    jobsToday: number;
    checkInStatus: string;
    lastUpdated: string;
  }>;
  analytics: {
    headcount: Array<{ label: string; value: number }>;
    attrition: Array<{ label: string; value: number }>;
    overtimeByDept: Array<{ label: string; value: number }>;
    leaveDistribution: Array<{ label: string; value: number }>;
  };
};

const hrDefaults: HrData = {
  filters: {
    locations: ["All Locations", "HO", "Factory-Coimbatore", "Service-South", "Service-North"],
    departments: ["All", "Production", "Sales", "Service", "Stores", "Accounts", "Management"],
    dateRanges: ["Today", "This Week", "This Month", "Last 30 Days", "Custom"],
  },
  kpis: {
    primary: [
      { label: "Total Employees", value: 138, detail: "On-roll headcount", trend: "+6 quarterly" },
      { label: "Present Today", value: 124, detail: "All locations", trend: "89.9%" },
      { label: "Today's Absentees", value: 14, detail: "4 unplanned", trend: "+2 vs yesterday" },
      { label: "Pending HR Approvals", value: 19, detail: "Leave, expenses, attendance", trend: "7 due today" },
      { label: "Open Positions", value: 5, detail: "Recruitment ongoing", trend: "2 offers sent" },
      { label: "Attrition (12M)", value: "8.5%", detail: "Rolling attrition", trend: "Stable" },
    ],
    secondary: [
      { label: "Overtime (This Month)", value: "212 hrs", insight: "High in Production" },
      { label: "Training Coverage", value: "78%", insight: "Target: 90%" },
      { label: "Leave Utilization", value: "62%", insight: "YTD usage" },
      { label: "Certification Expiry (30 Days)", value: 5, insight: "3 Service, 2 Electrical" },
    ],
  },
  navCards: [
    "Employee Directory",
    "Attendance & Shifts",
    "Leave Management",
    "Travel & Expense",
    "Recruitment & Onboarding",
    "Training & Skill Matrix",
    "Performance & Appraisals",
    "HR Analytics",
  ],
  quickActions: [
    "+ Add Employee",
    "Approve Today's Leaves",
    "Approve Regularizations",
    "Approve Expenses",
    "Publish Shift Roster",
    "Assign Training",
    "Export Attendance (Payroll)",
    "Download HR MIS",
  ],
  attendance: {
    summary: { total: 138, present: 124, absent: 14, leave: 7, onField: 32, unmarked: 3 },
    rows: [
      { department: "Production", total: 44, present: 38, absent: 2, leave: 3, onField: 0, unmarked: 1, presentPercent: 86 },
      { department: "Service", total: 41, present: 33, absent: 3, leave: 0, onField: 5, unmarked: 0, presentPercent: 80 },
      { department: "Sales", total: 22, present: 19, absent: 1, leave: 0, onField: 2, unmarked: 0, presentPercent: 86 },
      { department: "Stores", total: 9, present: 8, absent: 0, leave: 1, onField: 0, unmarked: 0, presentPercent: 89 },
      { department: "Accounts", total: 13, present: 12, absent: 1, leave: 0, onField: 0, unmarked: 0, presentPercent: 92 },
      { department: "Management", total: 9, present: 8, absent: 0, leave: 1, onField: 0, unmarked: 0, presentPercent: 89 },
    ],
  },
  approvals: [
    { type: "Leave", reqId: "LV-091", employee: "Praveen Kumar", dept: "Service", details: "2 days Sick Leave", requestedOn: "24 Nov", ageing: "1 day" },
    { type: "Expense", reqId: "EX-144", employee: "Divya S", dept: "Sales", details: "Rs 13,250", requestedOn: "23 Nov", ageing: "2 days" },
    { type: "Attendance", reqId: "AT-057", employee: "Selvam", dept: "Production", details: "Missed punch", requestedOn: "24 Nov", ageing: "1 day" },
    { type: "Roster", reqId: "RS-017", employee: "Sathish", dept: "Production", details: "Shift B -> General", requestedOn: "24 Nov", ageing: "<1 day" },
  ],
  joiningsExits: [
    { type: "Joining", title: "Service Engineer Trainee", dept: "Service", location: "Factory", date: "02 Dec", status: "Offer Accepted" },
    { type: "Joining", title: "Accounts Executive", dept: "Accounts", location: "HO", date: "05 Dec", status: "Shortlisted" },
    { type: "Exit", title: "Mohanraj", dept: "Stores", location: "Factory", date: "30 Nov", status: "Notice Period" },
  ],
  recruitment: [
    { position: "Service Engineer", dept: "Service", location: "Madurai", requiredBy: "10 Dec", pipeline: 6, stage: "Interview", risk: "On Track" },
    { position: "Stores Supervisor", dept: "Stores", location: "Factory", requiredBy: "15 Dec", pipeline: 2, stage: "Sourcing", risk: "At Risk" },
    { position: "Production Operator", dept: "Production", location: "Factory", requiredBy: "01 Jan", pipeline: 4, stage: "Sourcing", risk: "On Track" },
  ],
  skills: [
    { employee: "Suresh P", dept: "Service", certification: "Electrical Safety - HT", issuer: "TNEB", expiry: "12 Dec", risk: "High" },
    { employee: "Arun K", dept: "Service", certification: "Sorter Installation Master", issuer: "Internal", expiry: "20 Dec", risk: "Medium" },
    { employee: "Vimal", dept: "Production", certification: "Forklift License", issuer: "RTO", expiry: "05 Jan", risk: "Medium" },
  ],
  fieldStatus: [
    { technician: "Arun K", region: "Coimbatore", skill: "Installation", firstJob: "9:15 AM", jobsToday: 3, checkInStatus: "On Job", lastUpdated: "10:22 AM" },
    { technician: "Mahesh", region: "Guntur", skill: "Calibration", firstJob: "-", jobsToday: 2, checkInStatus: "Not Checked-in", lastUpdated: "-" },
    { technician: "Kumar", region: "Davanagere", skill: "Electrical", firstJob: "8:50 AM", jobsToday: 4, checkInStatus: "Checked-in", lastUpdated: "10:05 AM" },
  ],
  analytics: {
    headcount: [
      { label: "Aug", value: 126 },
      { label: "Sep", value: 128 },
      { label: "Oct", value: 133 },
      { label: "Nov", value: 138 },
    ],
    attrition: [
      { label: "Aug", value: 9.1 },
      { label: "Sep", value: 8.9 },
      { label: "Oct", value: 8.7 },
      { label: "Nov", value: 8.5 },
    ],
    overtimeByDept: [
      { label: "Production", value: 110 },
      { label: "Service", value: 48 },
      { label: "Sales", value: 18 },
      { label: "Stores", value: 12 },
    ],
    leaveDistribution: [
      { label: "CL", value: 38 },
      { label: "SL", value: 24 },
      { label: "EL", value: 18 },
      { label: "Comp Off", value: 12 },
    ],
  },
};

function HrDashboard({ profileName }: DashboardProps) {
  const [data, setData] = useState<HrData>(hrDefaults);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: data.filters.locations[0],
    department: data.filters.departments[0],
    dateRange: data.filters.dateRanges[0],
  });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/hr-dashboard");
        if (!response.ok) {
          throw new Error("Request failed");
        }
        const payload = (await response.json()) as { data: HrData };
        if (active && payload?.data) {
          setData(payload.data);
          setFilters({
            location: payload.data.filters.locations[0] ?? "All Locations",
            department: payload.data.filters.departments[0] ?? "All",
            dateRange: payload.data.filters.dateRanges[0] ?? "Today",
          });
        }
      } catch {
        // keep defaults
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const triggerToast = (message: string) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3c45b0] via-[#4b6be0] to-[#7a8ff5] p-6 text-white shadow-2xl shadow-[#3c45b0]/35 transition hover:shadow-[0_25px_80px_rgba(60,69,176,0.45)]">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-100 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">Colorsort360</p>
            <div className="mt-2 flex items-center gap-3 text-2xl font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner shadow-white/20 backdrop-blur">
                <span className="text-xl">HR</span>
              </div>
              <span>HR Dashboard</span>
            </div>
            <p className="mt-1 text-sm text-slate-100 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
              Workforce, attendance, approvals, and compliance in one view.
            </p>
          </div>
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Search employee / code / mobile / request ID"
              className="w-full rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm text-white placeholder:text-slate-100 shadow-inner shadow-white/10 outline-none backdrop-blur transition focus:border-[#7d83ff] focus:ring-2 focus:ring-[#7d83ff]/40"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-200">
              Enter
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-lg shadow-slate-200">
        <div className="grid gap-3 md:grid-cols-3">
          {renderFilter("Location", data.filters.locations, filters.location, (value) => setFilters((f) => ({ ...f, location: value })))}
          {renderFilter("Department", data.filters.departments, filters.department, (value) => setFilters((f) => ({ ...f, department: value })))}
          {renderFilter("Date Range", data.filters.dateRanges, filters.dateRange, (value) => setFilters((f) => ({ ...f, dateRange: value })))}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={() =>
              setFilters({
                location: data.filters.locations[0],
                department: data.filters.departments[0],
                dateRange: data.filters.dateRanges[0],
              })
            }
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {data.kpis.primary.map((kpi, index) => (
          <div
            key={kpi.label}
            className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_15px_55px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(15,23,42,0.14)]"
          >
            <div className="absolute inset-0 opacity-70 blur-2xl" style={{ background: `radial-gradient(circle at 30% 20%, rgba(34,211,238,0.25), transparent 40%), radial-gradient(circle at 70% 0%, rgba(16,185,129,0.25), transparent 35%)` }} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{kpi.label}</p>
                <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-slate-900">
                  <span>{kpi.value}</span>
                  {kpi.trend && (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                      {kpi.trend}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{kpi.detail}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-sky-50 text-slate-700 shadow-inner shadow-white">
                #{index + 1}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.kpis.secondary.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-md shadow-slate-100 transition hover:-translate-y-[2px] hover:shadow-lg"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{kpi.value}</p>
            <p className="text-xs font-semibold text-amber-600">{kpi.insight}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Section title="HR Modules" variant="pastel">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.navCards.map((item) => (
              <button
                key={item}
                onClick={() => triggerToast(`${item} (demo preview)`)}
                className="group flex items-center justify-between rounded-2xl border border-indigo-50 bg-gradient-to-br from-white via-[#eef2ff] to-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm shadow-indigo-100 transition hover:-translate-y-[2px] hover:border-indigo-100 hover:shadow-lg"
              >
                <span>{item}</span>
                <span className="rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 transition group-hover:bg-emerald-100">
                  Open
                </span>
              </button>
            ))}
          </div>
        </Section>
        <Section title="Quick actions" variant="pastel">
          <div className="grid gap-2 sm:grid-cols-2">
            {data.quickActions.map((action, idx) => {
              const swatches = [
                "#9BC3E7", // light blue
                "#ACB6E3", // periwinkle
                "#8BE1D5", // teal mint
                "#C9E7EB", // soft aqua
                "#F9E899", // pale yellow
                "#F7C27A", // soft amber
                "#F5A3A6", // coral pink
              ];
              const background = swatches[idx % swatches.length];
              return (
              <button
                key={action}
                onClick={() => triggerToast(`${action} (demo action)`)}
                style={{ background }}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 shadow-md shadow-slate-200 transition hover:-translate-y-[2px] hover:shadow-xl hover:shadow-slate-300"
              >
                {action}
              </button>
            );
            })}
          </div>
        </Section>
      </div>

      <Section
        title="Attendance snapshot"
        subtitle="Live department attendance"
        variant="pastel"
      >
        <div className="flex flex-wrap gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          <Tag label={`Total: ${data.attendance.summary.total}`} />
          <Tag label={`Present: ${data.attendance.summary.present}`} tone="emerald" />
          <Tag label={`Absent: ${data.attendance.summary.absent}`} tone="rose" />
          <Tag label={`On Leave: ${data.attendance.summary.leave}`} />
          <Tag label={`On Field: ${data.attendance.summary.onField}`} tone="sky" />
          <Tag label={`Unmarked: ${data.attendance.summary.unmarked}`} tone="amber" />
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.25em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3">On Leave</th>
                <th className="px-4 py-3">On Field</th>
                <th className="px-4 py-3">Unmarked</th>
                <th className="px-4 py-3">Present %</th>
              </tr>
            </thead>
            <tbody>
              {data.attendance.rows.map((row) => (
                <tr key={row.department} className="border-t border-slate-100 bg-white transition hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.department}</td>
                  <td className="px-4 py-3">{row.total}</td>
                  <td className="px-4 py-3 text-emerald-700">{row.present}</td>
                  <td className="px-4 py-3 text-rose-600">{row.absent}</td>
                  <td className="px-4 py-3">{row.leave}</td>
                  <td className="px-4 py-3 text-sky-700">{row.onField}</td>
                  <td className="px-4 py-3 text-amber-700">{row.unmarked}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ inlineSize: `${Math.min(row.presentPercent, 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{row.presentPercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Pending approvals" variant="pastel">
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.25em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Req ID</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Dept</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Ageing</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.approvals.map((row) => (
                  <tr key={row.reqId} className="border-t border-slate-100 bg-white transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.type}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-500">{row.reqId}</td>
                    <td className="px-4 py-3">{row.employee}</td>
                    <td className="px-4 py-3">{row.dept}</td>
                    <td className="px-4 py-3">{row.details}</td>
                    <td className="px-4 py-3">{row.requestedOn}</td>
                    <td className="px-4 py-3 text-amber-700">{row.ageing}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          triggerToast(`Reviewing ${row.type} ${row.reqId} (mock)`)
                        }
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Joinings & exits" variant="pastel">
          <div className="space-y-3">
            {data.joiningsExits.map((row) => (
              <div
                key={`${row.type}-${row.title}-${row.date}`}
                onClick={() =>
                  triggerToast(`${row.type}: ${row.title} (${row.status})`)
                }
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white px-4 py-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{row.type}</p>
                  <p className="text-base font-semibold text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-500">
                    {row.dept} • {row.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{row.date}</p>
                  <p className="text-xs font-semibold text-emerald-600">{row.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Recruitment overview" variant="pastel">
          <div className="space-y-3">
            {data.recruitment.map((row) => (
              <div
                key={`${row.position}-${row.location}`}
                onClick={() =>
                  triggerToast(`Recruiting ${row.position} (${row.stage}, ${row.risk})`)
                }
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <div>
                  <p className="text-base font-semibold text-slate-900">{row.position}</p>
                  <p className="text-xs text-slate-500">
                    {row.dept} • {row.location}
                  </p>
                  <p className="text-xs text-slate-500">Pipeline: {row.pipeline}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Required</p>
                  <p className="text-sm font-semibold text-slate-900">{row.requiredBy}</p>
                  <p className={`text-xs font-semibold ${row.risk.includes("Risk") ? "text-rose-600" : "text-emerald-600"}`}>
                    {row.stage} • {row.risk}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Skills & certification alerts" variant="pastel">
          <div className="space-y-3">
            {data.skills.map((row) => (
              <div
                key={`${row.employee}-${row.certification}`}
                onClick={() =>
                  triggerToast(`Skill alert: ${row.employee} (${row.certification})`)
                }
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white px-4 py-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <div>
                  <p className="text-base font-semibold text-slate-900">{row.employee}</p>
                  <p className="text-xs text-slate-500">
                    {row.dept} • {row.certification}
                  </p>
                  <p className="text-xs text-slate-500">Issuer: {row.issuer}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Expiry</p>
                  <p className="text-sm font-semibold text-slate-900">{row.expiry}</p>
                  <p className={`text-xs font-semibold ${row.risk === "High" ? "text-rose-600" : "text-amber-600"}`}>
                    {row.risk} risk
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Field force status" variant="pastel">
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.25em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Skill</th>
                  <th className="px-4 py-3">First Job</th>
                  <th className="px-4 py-3">Jobs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.fieldStatus.map((row) => (
                  <tr
                    key={row.technician}
                    onClick={() =>
                      triggerToast(`Technician ${row.technician}: ${row.checkInStatus}`)
                    }
                    className="border-t border-slate-100 bg-white transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.technician}</td>
                    <td className="px-4 py-3">{row.region}</td>
                    <td className="px-4 py-3">{row.skill}</td>
                    <td className="px-4 py-3">{row.firstJob}</td>
                    <td className="px-4 py-3">{row.jobsToday}</td>
                    <td className="px-4 py-3">
                      <Tag label={row.checkInStatus} tone={row.checkInStatus.includes("Not") ? "rose" : "emerald"} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{row.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="HR analytics" variant="pastel">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniChart title="Headcount vs Time" data={data.analytics.headcount} colorClass="from-emerald-300 to-emerald-500" />
            <MiniChart title="Attrition Trend" data={data.analytics.attrition} colorClass="from-amber-300 to-amber-500" />
            <MiniChart title="Overtime by Department" data={data.analytics.overtimeByDept} colorClass="from-sky-300 to-sky-500" bar />
            <MiniChart title="Leave Type Distribution" data={data.analytics.leaveDistribution} colorClass="from-indigo-300 to-indigo-500" bar />
          </div>
        </Section>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-200">
            <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
            Syncing HR data...
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg shadow-slate-300 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {toast}
        </div>
      )}
    </div>
  );
}

const renderFilter = (
  label: string,
  options: string[],
  value: string,
  onChange: (value: string) => void,
) => (
  <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
    {label}
    <select
      value={value}
      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
        onChange(event.target.value)
      }
      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const Tag = ({ label, tone = "slate" }: { label: string; tone?: "slate" | "emerald" | "rose" | "sky" | "amber" }) => {
  const toneMap: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneMap[tone] ?? toneMap.slate}`}>{label}</span>;
};

const MiniChart = ({
  title,
  data,
  colorClass,
  bar = false,
}: {
  title: string;
  data: Array<{ label: string; value: number }>;
  colorClass: string;
  bar?: boolean;
}) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{title}</p>
      <div className="mt-3 flex items-end gap-2">
        {data.map((item) => (
          <div key={item.label} className="flex-1 text-center">
            <div
              className={`mx-auto w-full rounded-xl bg-gradient-to-t ${colorClass}`}
              style={{
                blockSize: `${Math.max((item.value / maxValue) * 90, 10)}px`,
              }}
            />
            <p className="mt-1 text-xs font-semibold text-slate-600">{item.label}</p>
            <p className="text-xs text-slate-500">{item.value}</p>
          </div>
        ))}
      </div>
      {!bar && <p className="mt-2 text-xs text-slate-500">Data synced from Supabase (fallback to sample if table missing).</p>}
    </div>
  );
};
