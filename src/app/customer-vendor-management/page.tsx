"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  type Filters,
  type DocumentHealth,
  type MasterRecord,
  type MasterStatus,
  type MasterType,
  MASTER_SEED,
} from "./master-data";
import { getRoleFromEmail } from "@/lib/role-map";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ?? "admin@qube.com";

type SortKey = "updated" | "creditLimit" | "outstanding" | "name";
type SortDirection = "asc" | "desc";

const formatCurrency = (value: number, currency: string) =>
  Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const pct = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 100);

const getId = () => `M-${Math.floor(Math.random() * 90000 + 10000)}`;

export default function CustomerVendorManagementPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/image.png");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileRole, setProfileRole] = useState<"admin" | "super_admin" | null>(
    null,
  );
  const [profileName, setProfileName] = useState("Admin");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [masters, setMasters] = useState<MasterRecord[]>(() => MASTER_SEED);
  const [filters, setFilters] = useState<Filters>({
    type: "all",
    status: "all",
    risk: "all",
    city: "all",
    search: "",
  });
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [quickForm, setQuickForm] = useState<{
    code: string;
    name: string;
    type: MasterType;
    status: MasterStatus;
    city: string;
    industry: string;
  }>({
    code: "",
    name: "",
    type: "customer",
    status: "prospect",
    city: "Chennai",
    industry: "Food Processing",
  });

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
      setProfileName(
        (user.user_metadata?.full_name as string | undefined) ?? "Admin",
      );
      setIsCheckingAuth(false);
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
  }, [router, supabase]);

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
    const timer = setTimeout(() => setToast(null), 2600);
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

  const handleQuickCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const trimmedCode = quickForm.code.trim().toUpperCase();
    const trimmedName = quickForm.name.trim();
    if (!trimmedCode || !trimmedName) {
      setFormError("Code and Name are required (unique code enforced).");
      return;
    }
    const duplicate = masters.some(
      (master) => master.code.toLowerCase() === trimmedCode.toLowerCase(),
    );
    if (duplicate) {
      setFormError("Code already exists. Use a unique master code.");
      return;
    }
    const now = new Date().toISOString();
    const newMaster: MasterRecord = {
      id: getId(),
      code: trimmedCode,
      name: trimmedName,
      type: quickForm.type,
      status: quickForm.status,
      industry: quickForm.industry || "General",
      city: quickForm.city || "Chennai",
      country: "IN",
      creditLimit: 250000,
      currency: "INR",
      taxId: "NEW-TAX-ID",
      taxCountry: "IN",
      tags: ["draft"],
      accountOwner: profileName || "Admin",
      risk: "medium",
      outstanding: 0,
      lastUpdated: now,
      primaryContact: {
        name: "Primary contact",
        email: "contact@example.com",
        phone: "+910000000000",
        role: "Owner",
        preferredCommunication: "email",
      },
      address: {
        label: "Primary",
        line1: "Address pending",
        city: quickForm.city || "Chennai",
        state: "TN",
        postalCode: "600000",
        country: "IN",
        isPrimary: true,
      },
      billingTerms: "Net 30",
      paymentMethods: ["UPI"],
      bankMask: "Masked",
      documents: [
        { type: "GST Certificate", status: "missing", note: "Upload required" },
      ],
    };
    setMasters((prev) => [newMaster, ...prev]);
    setQuickForm({
      code: "",
      name: "",
      type: "customer",
      status: "prospect",
      city: "Chennai",
      industry: "Food Processing",
    });
    setToast(`Master ${trimmedCode} saved as draft`);
  };

  const handleStatusChange = (id: string, status: MasterStatus) => {
    setMasters((prev) =>
      prev.map((master) =>
        master.id === id
          ? { ...master, status, lastUpdated: new Date().toISOString() }
          : master,
      ),
    );
    setToast(`Status updated to ${status}`);
  };

  const handleDocsHealthy = (id: string) => {
    setMasters((prev) =>
      prev.map((master) =>
        master.id === id
          ? {
            ...master,
            documents: master.documents.map((doc) => ({
              ...doc,
              status: "valid" as DocumentHealth,
              note: doc.note && doc.note.includes("Upload")
                ? "Awaiting verification"
                : doc.note,
            })),
            tags: Array.from(new Set([...(master.tags ?? []), "compliant"])),
            lastUpdated: new Date().toISOString(),
          }
          : master,
      ),
    );
    setToast("Compliance marked as valid for this master");
  };

  const handleExport = () => {
    setToast("Export started for filtered records (CSV)");
  };

  const handleImport = () => {
    setToast("Import template queued. Check notifications for progress.");
  };

  const handleExportRow = (code: string) => {
    setToast(`Row ${code} ready for export`);
  };

  const handleResetSeed = () => {
    setMasters(MASTER_SEED);
    setToast("Sample data restored");
  };

  const searchTerm = filters.search.trim().toLowerCase();
  const filteredMasters = masters
    .filter((master) => {
      if (filters.type !== "all") {
        if (filters.type === "customer" && master.type === "vendor") return false;
        if (filters.type === "vendor" && master.type === "customer") return false;
        if (filters.type === "both" && master.type !== "both") return false;
      }
      if (filters.status !== "all" && master.status !== filters.status) {
        return false;
      }
      if (filters.risk !== "all" && master.risk !== filters.risk) {
        return false;
      }
      if (filters.city !== "all" && master.city !== filters.city) {
        return false;
      }
      if (searchTerm) {
        const haystack = [
          master.code,
          master.name,
          master.city,
          master.industry,
          master.primaryContact.name,
          master.taxId,
          master.accountOwner,
          ...(master.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortKey === "updated") {
        return (
          (new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()) *
          direction
        );
      }
      if (sortKey === "creditLimit") {
        return (a.creditLimit - b.creditLimit) * direction;
      }
      if (sortKey === "outstanding") {
        return (a.outstanding - b.outstanding) * direction;
      }
      return a.name.localeCompare(b.name) * direction;
    });

  const total = masters.length;
  const activeCount = masters.filter((master) => master.status === "active").length;
  const customerCount = masters.filter(
    (master) => master.type === "customer" || master.type === "both",
  ).length;
  const vendorCount = masters.filter(
    (master) => master.type === "vendor" || master.type === "both",
  ).length;
  const complianceIssues = masters.filter((master) =>
    master.documents.some((doc) => doc.status !== "valid"),
  ).length;
  const expiringDocs = masters.filter((master) =>
    master.documents.some((doc) => doc.status === "expiring"),
  ).length;
  const missingUploads = masters.filter((master) =>
    master.documents.some((doc) => doc.status === "missing"),
  ).length;
  const creditExposure = masters.reduce(
    (sum, master) => sum + master.outstanding,
    0,
  );
  let complianceScore: { label: string; tone: string } = {
    label: "Good (Optimal)",
    tone: "bg-emerald-50 text-emerald-700",
  };
  if (complianceIssues > 4 || missingUploads > 2) {
    complianceScore = { label: "Critical", tone: "bg-rose-50 text-rose-700" };
  } else if (complianceIssues > 0 || expiringDocs > 0) {
    complianceScore = { label: "Warning (Vulnerable)", tone: "bg-amber-50 text-amber-700" };
  }

  const statusBuckets: Array<{ label: MasterStatus; color: string; count: number }> =
    [
      { label: "active", color: "bg-emerald-500", count: 0 },
      { label: "prospect", color: "bg-amber-500", count: 0 },
      { label: "inactive", color: "bg-slate-400", count: 0 },
      { label: "suspended", color: "bg-rose-500", count: 0 },
    ];
  masters.forEach((master) => {
    const bucket = statusBuckets.find((item) => item.label === master.status);
    if (bucket) bucket.count += 1;
  });

  const cityOptions = Array.from(new Set(masters.map((master) => master.city))).sort();
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
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-sm backdrop-blur">
                Customer & Vendor Management
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                  {profileRole?.replace("_", " ")}
                </span>
              </span>
              <h1 className="text-3xl font-semibold leading-tight text-white">
                Unified master data for customers and vendors
              </h1>
              <p className="max-w-3xl text-sm text-white/80">
                Identity, contacts, addresses, financials, and tax records in one
                place. Filters, imports, and exports follow the spec so onboarding
                stays predictable.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleImport}
                className="rounded-2xl border border-white/50 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
              >
                Import CSV/XLSX
              </button>
              <button
                onClick={handleExport}
                className="rounded-2xl border border-white/60 bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
              >
                Export filtered
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-4">
          {[
            {
              label: "Total masters",
              value: total,
              sub: `${activeCount} active / ${complianceIssues} needs review`,
              tone: "from-cyan-200 via-white to-emerald-100",
            },
            {
              label: "Customers",
              value: customerCount,
              sub: "Customers or both",
              tone: "from-amber-200 via-white to-amber-100",
            },
            {
              label: "Vendors",
              value: vendorCount,
              sub: "Procurement ready",
              tone: "from-indigo-200 via-white to-cyan-100",
            },
            {
              label: "Credit exposure",
              value: formatCurrency(creditExposure, "INR"),
              sub: "Outstanding across accounts",
              tone: "from-rose-200 via-white to-orange-100",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${card.tone} p-5 shadow-md shadow-black/5`}
            >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/70 blur-3xl" />
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {card.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {card.sub}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6">
          <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 shadow-inner">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-slate-400"
                  aria-hidden
                >
                  <path
                    d="m21 21-4.35-4.35M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="search"
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, search: event.target.value }))
                  }
                  placeholder="Search code, name, city, contact, tax ID"
                  className="w-56 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={filters.type}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    type: event.target.value as Filters["type"],
                  }))
                }
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
              >
                <option value="all">All types</option>
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="both">Both</option>
              </select>
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: event.target.value as Filters["status"],
                  }))
                }
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="prospect">Prospect</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <select
                value={filters.risk}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    risk: event.target.value as Filters["risk"],
                  }))
                }
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
              >
                <option value="all">All risk</option>
                <option value="low">Low risk</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select
                value={filters.city}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    city: event.target.value as Filters["city"],
                  }))
                }
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
              >
                <option value="all">All cities</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <div className="ml-auto flex items-center gap-2">
                <select
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as SortKey)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  <option value="updated">Updated</option>
                  <option value="creditLimit">Credit limit</option>
                  <option value="outstanding">Outstanding</option>
                  <option value="name">Name</option>
                </select>
                <button
                  onClick={() =>
                    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  {sortDirection === "asc" ? "Asc" : "Desc"}
                </button>
                <button
                  onClick={handleResetSeed}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
                >
                  Reset data
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Status mix
                </p>
                <div className="mt-2 space-y-2">
                  {statusBuckets.map((bucket) => (
                    <div key={bucket.label} className="flex items-center gap-3">
                      <span
                        className={`h-2 w-2 rounded-full ${bucket.color}`}
                        aria-hidden
                      />
                      <span className="text-xs font-semibold text-slate-600">
                        {bucket.label}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`${bucket.color} h-2`}
                          style={{
                            width: `${pct(bucket.count, total)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {bucket.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Compliance
                </p>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Open issues</span>
                    <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600">
                      {complianceIssues}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Expiring docs</span>
                    <span className="text-xs font-semibold text-amber-600">
                      {expiringDocs}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Missing uploads</span>
                    <span className="text-xs font-semibold text-rose-500">{missingUploads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Compliance score</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${complianceScore.tone}`}>
                      {complianceScore.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            id="quick-create"
            className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-5 shadow-lg shadow-cyan-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-600">
                  Quick create
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  Add master in three fields
                </h3>
              </div>
              <button
                onClick={handleResetSeed}
                className="rounded-full border border-cyan-100 bg-white px-3 py-1 text-xs font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-50"
              >
                Restore
              </button>
            </div>

            <form onSubmit={handleQuickCreate} className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Code (unique)
                  <input
                    value={quickForm.code}
                    onChange={(event) =>
                      setQuickForm((prev) => ({ ...prev, code: event.target.value }))
                    }
                    placeholder="ACME-002"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Name
                  <input
                    value={quickForm.name}
                    onChange={(event) =>
                      setQuickForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Company name"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Type
                  <select
                    value={quickForm.type}
                    onChange={(event) =>
                      setQuickForm((prev) => ({
                        ...prev,
                        type: event.target.value as MasterType,
                      }))
                    }
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="both">Both</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Status
                  <select
                    value={quickForm.status}
                    onChange={(event) =>
                      setQuickForm((prev) => ({
                        ...prev,
                        status: event.target.value as MasterStatus,
                      }))
                    }
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="prospect">Prospect</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  City
                  <input
                    value={quickForm.city}
                    onChange={(event) =>
                      setQuickForm((prev) => ({ ...prev, city: event.target.value }))
                    }
                    placeholder="City"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Industry
                  <input
                    value={quickForm.industry}
                    onChange={(event) =>
                      setQuickForm((prev) => ({
                        ...prev,
                        industry: event.target.value,
                      }))
                    }
                    placeholder="Industry"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                  />
                </label>
              </div>
              {formError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">
                  {formError}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickForm({
                    code: "",
                    name: "",
                    type: "customer",
                    status: "prospect",
                    city: "Chennai",
                    industry: "Food Processing",
                  })}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="ml-auto rounded-full bg-[linear-gradient(120deg,#2f80ed_0%,#6a5af9_100%)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:brightness-105"
                >
                  Save master
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          {filteredMasters.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm font-semibold text-slate-500 shadow-inner">
              No records match your filters. Clear filters or add a new master.
            </div>
          )}
          {["customer", "vendor", "both"].map((typeKey) => {
            const groupLabel =
              typeKey === "customer"
                ? "Customers"
                : typeKey === "vendor"
                  ? "Vendors"
                  : "Both (Customer & Vendor)";
            const groupItems = filteredMasters.filter(
              (item) => item.type === typeKey || (typeKey === "both" && item.type === "both"),
            );
            if (groupItems.length === 0) return null;
            return (
              <div
                key={typeKey}
                className="rounded-3xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{groupLabel}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {groupItems.length} record{groupItems.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="space-y-3">
                  {groupItems.map((master) => (
                    <div
                      key={master.id}
                      className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                              {master.code}
                            </p>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                              {master.industry}
                            </span>
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                master.status === "active"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : master.status === "prospect"
                                    ? "bg-amber-50 text-amber-600"
                                    : master.status === "inactive"
                                      ? "bg-slate-100 text-slate-600"
                                      : "bg-rose-50 text-rose-600"
                              }`}
                            >
                              {master.status}
                            </span>
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                master.type === "customer"
                                  ? "bg-sky-50 text-sky-600"
                                  : master.type === "vendor"
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "bg-cyan-50 text-cyan-700"
                              }`}
                            >
                              {master.type}
                            </span>
                          </div>
                          <button
                            onClick={() => router.push(`/customer-vendor-management/${master.id}`)}
                            className="group flex items-center gap-2 text-left text-lg font-semibold text-slate-900 transition hover:text-cyan-700"
                          >
                            {master.name}
                            <span className="text-sm text-cyan-600 transition group-hover:translate-x-0.5">
                              ▼
                            </span>
                          </button>
                          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2 py-1">
                              Owner: {master.accountOwner}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-1">
                              {master.city}, {master.country}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-1">
                              Risk: {master.risk}
                            </span>
                            {master.tags.map((tag) => (
                              <span
                                key={`${master.id}-${tag}`}
                                className="rounded-full bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-100"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(master.creditLimit, master.currency)} limit
                          </p>
                          <p className="text-xs text-slate-500">
                            Outstanding {formatCurrency(master.outstanding, master.currency)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Updated {new Date(master.lastUpdated).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <button
                          onClick={() => router.push(`/customer-vendor-management/${master.id}`)}
                          className="rounded-full bg-cyan-500 px-4 py-2 text-white shadow-sm shadow-cyan-200 transition hover:bg-cyan-400"
                        >
                          Open details
                        </button>
                        {master.status !== "active" && (
                          <button
                            onClick={() => handleStatusChange(master.id, "active")}
                            className="rounded-full bg-emerald-500 px-4 py-2 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400"
                          >
                            Mark active
                          </button>
                        )}
                        {master.status !== "suspended" && (
                          <button
                            onClick={() => handleStatusChange(master.id, "suspended")}
                            className="rounded-full bg-rose-400 px-4 py-2 text-white shadow-sm shadow-rose-200 transition hover:bg-rose-300"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => handleDocsHealthy(master.id)}
                          className="rounded-full bg-indigo-500 px-4 py-2 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                        >
                          Docs OK
                        </button>
                        <button
                          onClick={() => handleExportRow(master.code)}
                          className="rounded-full bg-slate-100 px-4 py-2 text-slate-700 shadow-sm transition hover:bg-slate-200"
                        >
                          Export row
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
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
          animation: "toastPop 220ms ease, toastFade 320ms ease 2.5s forwards",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-base font-bold text-cyan-700 shadow-inner shadow-cyan-100">
            *
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
