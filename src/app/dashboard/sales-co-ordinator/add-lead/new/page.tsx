"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getRoleFromEmail } from "@/lib/role-map";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ?? "admin@qube.com";

const slugifyRole = (role?: string | null) =>
  role?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ?? "";

type LeadFormState = {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  address: string;
  gst: string;
  source: string;
  model: string;
  purpose: string;
  purposeOption: string;
  priority: string;
  expectedQty: string;
};

type StoredLead = {
  id: string;
  createdAt: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  address: string;
  gst: string;
  source: string;
  model: string;
  purpose: string;
  priority: string;
  expectedQty: string;
};

const LEADS_KEY = "sc_leads";

const loadStoredLeads = (): StoredLead[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredLead[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const saveStoredLeads = (leads: StoredLead[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  } catch {
    // ignore quota errors
  }
};

const stateOptions = [
  "Tamil Nadu",
  "Karnataka",
  "Kerala",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
];

export default function CreateLeadWizardPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [profileName, setProfileName] = useState("Team Member");
  void profileName;
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/image.png");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [productModels, setProductModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [gstError, setGstError] = useState<string | null>(null);
  const [form, setForm] = useState<LeadFormState>({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    state: "",
    city: "",
    address: "",
    gst: "",
    source: "",
    model: "",
    purpose: "",
    purposeOption: "",
    priority: "Warm",
    expectedQty: "",
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
      const fetchedRole =
        (user.user_metadata?.role as string | undefined) ??
        getRoleFromEmail(user.email) ??
        (await fetchRole(user.id));
      const slug = slugifyRole(fetchedRole);

      const derivedName =
        (user.user_metadata?.full_name as string | undefined) ?? "Team Member";
      setProfileName(derivedName);

      if (
        user.email?.toLowerCase() === SUPER_ADMIN_EMAIL ||
        slug === "super_admin"
      ) {
        router.replace("/dashboard/admin");
        return;
      }

      if (slug !== "sales-co-ordinator") {
        router.replace(slug ? `/dashboard/${slug}` : "/dashboard");
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
      .catch(() => {
        // best-effort logo fetch
      });
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingModels(true);
      setModelsError(null);
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Unable to fetch products");
        }
        const payload = (await response.json()) as {
          products?: Array<{ product_name?: string | null }>;
        };
        const names = Array.from(
          new Set(
            (payload.products ?? [])
              .map((p) => p.product_name?.trim())
              .filter(Boolean) as string[],
          ),
        );
        setProductModels(names);
      } catch (error) {
        setModelsError(
          error instanceof Error ? error.message : "Failed to load models",
        );
      } finally {
        setIsLoadingModels(false);
      }
    };
    loadProducts();
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

  const handleChange = (key: keyof LeadFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isValidGst = (value: string) => {
    const upper = value.trim().toUpperCase();
    const gstRegex = /^(0[1-9]|[12][0-9]|3[0-5])[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
    return gstRegex.test(upper);
  };

  const nextStep = () =>
    setStep((s) => {
      if (s === 1) {
        if (!form.gst || !isValidGst(form.gst)) {
          setGstError("Enter a valid GSTIN (e.g., 33ABCDE1234F1Z5).");
          return s;
        }
        setGstError(null);
      }
      return Math.min(3, s + 1);
    });
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = () => {
    const newLead: StoredLead = {
      id: `L-${Date.now()}`,
      createdAt: new Date().toISOString(),
      companyName: form.companyName,
      contactPerson: form.contactPerson,
      phone: form.phone,
      email: form.email,
      state: form.state,
      city: form.city,
      address: form.address,
      gst: form.gst,
      source: form.source,
      model: form.model,
      purpose: form.purpose || form.purposeOption,
      priority: form.priority,
      expectedQty: form.expectedQty,
    };
    const existing = loadStoredLeads();
    saveStoredLeads([newLead, ...existing]);
    router.push("/dashboard/sales-co-ordinator/add-lead?tab=my-leads");
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
        Loading workspace...
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
        activeHref="/dashboard/sales-co-ordinator/add-lead/new"
        showLeadManagement
      />

      <main className="flex-1 px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-indigo-400">
              Lead creation
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              New lead wizard
            </h1>
          </div>
          <button
            onClick={() => router.push("/dashboard/sales-co-ordinator/add-lead")}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Back to selection
          </button>
        </div>

        <Stepper currentStep={step} />

        <section className="mt-6 rounded-[32px] border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.1)] backdrop-blur">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  Client Details
                </p>
                <p className="text-sm text-slate-600">
                  Capture the customer’s core information.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Company Name *"
                  value={form.companyName}
                  onChange={(v) => handleChange("companyName", v)}
                />
                <Field
                  label="Contact Person *"
                  value={form.contactPerson}
                  onChange={(v) => handleChange("contactPerson", v)}
                />
                <Field
                  label="Phone *"
                  value={form.phone}
                  onChange={(v) => handleChange("phone", v)}
                />
                <Field
                  label="Email"
                  value={form.email}
                  onChange={(v) => handleChange("email", v)}
                />
                <SelectField
                  label="State *"
                  value={form.state}
                  onChange={(v) => handleChange("state", v)}
                  options={stateOptions}
                  placeholder="Select state"
                />
                <Field
                  label="City"
                  value={form.city}
                  onChange={(v) => handleChange("city", v)}
                />
              </div>
              <Field
                label="Address"
                value={form.address}
                onChange={(v) => handleChange("address", v)}
                multiline
              />
              <Field
                label="GST No."
                value={form.gst}
                onChange={(v) => {
                  handleChange("gst", v.toUpperCase());
                  if (gstError) setGstError(null);
                }}
                error={gstError}
              />
            </div>
          )}

          {step === 2 && (
              <div className="space-y-6 text-slate-700">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    Lead Details
                  </p>
                <p className="text-sm">
                  Define the opportunity attributes so we can route and prioritize it correctly.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Source *"
                  value={form.source}
                  onChange={(v) => handleChange("source", v)}
                  options={[
                    "Inbound call",
                    "Website form",
                    "Field marketing",
                    "Partner referral",
                    "Social",
                    "Event",
                  ]}
                  placeholder="Select source"
                />
                <SelectField
                  label="Model *"
                  value={form.model}
                  onChange={(v) => handleChange("model", v)}
                  options={productModels}
                  placeholder="Select a model"
                  disabled={isLoadingModels || !!modelsError}
                />
                <SelectField
                  label="Purpose to Switch *"
                  value={form.purposeOption}
                  onChange={(v) => {
                    handleChange("purposeOption", v);
                    if (v === "Others (custom)") {
                      handleChange("purpose", "");
                    } else {
                      handleChange("purpose", v);
                    }
                  }}
                  options={[
                    "Upgrade performance",
                    "Reduce downtime",
                    "Expand capacity",
                    "Replace competitor",
                    "New facility",
                    "Others (custom)",
                  ]}
                  placeholder="Select purpose"
                />
                {form.purposeOption === "Others (custom)" && (
                  <Field
                    label="Custom purpose"
                    value={form.purpose}
                    onChange={(v) => handleChange("purpose", v)}
                    placeholder="Describe the purpose to switch"
                  />
                )}
                <Field
                  label="Expected Quantity"
                  value={form.expectedQty}
                  onChange={(v) => handleChange("expectedQty", v)}
                  placeholder="e.g., 10 units"
                />
                <SelectField
                  label="Priority *"
                  value={form.priority}
                  onChange={(v) => handleChange("priority", v)}
                  options={["Hot", "Warm", "Cold"]}
                  placeholder="Select priority"
                />
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-inner shadow-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M12 6v6l4 2" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Automation hint</p>
                  <p className="text-sm text-slate-600">
                    Priority and source will auto-route to the right manager. Adjust if you need a different path.
                  </p>
                  {isLoadingModels && (
                    <p className="text-xs text-slate-500">Loading models from Product Master...</p>
                  )}
                  {modelsError && (
                    <p className="text-xs text-rose-500">Model list failed to load. {modelsError}</p>
                  )}
                  {!isLoadingModels && !modelsError && productModels.length === 0 && (
                    <p className="text-xs text-amber-600">No models found in Product Master.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    Review & confirm
                  </p>
                  <p className="text-sm">
                    Double-check the client and lead details before creating the lead.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Ready to create
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <SummaryCard
                  tone="blue"
                  title="Client"
                  items={[
                    { label: "Company", value: form.companyName || "—" },
                    { label: "Contact person", value: form.contactPerson || "—" },
                    { label: "Phone", value: form.phone || "—" },
                    { label: "Email", value: form.email || "—" },
                    { label: "State", value: form.state || "—" },
                    { label: "City", value: form.city || "—" },
                    { label: "Address", value: form.address || "—" },
                    { label: "GST", value: form.gst || "—" },
                  ]}
                />
                <SummaryCard
                  tone="indigo"
                  title="Lead"
                  items={[
                    { label: "Source", value: form.source || "—" },
                    { label: "Model", value: form.model || "—" },
                    { label: "Purpose", value: form.purpose || "—" },
                    { label: "Priority", value: form.priority || "—" },
                    { label: "Expected qty", value: form.expectedQty || "—" },
                  ]}
                />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white px-4 py-3 text-sm text-slate-700 shadow-sm shadow-slate-100">
                <p className="font-semibold text-slate-900">Need changes?</p>
                <p className="text-sm text-slate-600">
                  Use Previous to adjust details, then Create lead to save and jump to My Leads.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:bg-slate-50 disabled:opacity-50"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="m14 7-5 5 5 5" />
              </svg>
              Previous
            </button>

            {step < 3 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 rounded-2xl bg-[#4d95ff] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(77,149,255,0.35)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_35px_rgba(77,149,255,0.45)]"
              >
                Next
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="m10 7 5 5-5 5" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.35)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_35px_rgba(16,185,129,0.45)]"
              >
                Create lead
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="m10 7 5 5-5 5" />
                </svg>
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, label: "Client Details" },
    { id: 2, label: "Lead Details" },
    { id: 3, label: "Review" },
  ];

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white px-4 py-3 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;
          return (
            <div key={step.id} className="flex flex-1 items-center gap-3">
              <div
                className={`relative flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition duration-200 ${
                  isActive
                    ? "border-blue-200 bg-gradient-to-br from-blue-50 via-blue-100 to-white text-blue-700 shadow-[0_10px_30px_rgba(59,130,246,0.25)]"
                    : isDone
                      ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                <div
                  className={`absolute inset-0 rounded-full blur-lg transition ${
                    isActive ? "bg-blue-200/50" : isDone ? "bg-emerald-200/30" : "bg-transparent"
                  }`}
                />
                <span className="relative">
                  {isDone ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Step {step.id}
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="ml-3 flex-1">
                  <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  items,
  tone = "blue",
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
  tone?: "blue" | "indigo";
}) {
  const accent =
    tone === "indigo"
      ? "from-indigo-50 via-white to-white text-indigo-700"
      : "from-blue-50 via-white to-white text-blue-700";
  const pillBg = tone === "indigo" ? "bg-indigo-50 text-indigo-700" : "bg-blue-50 text-blue-700";
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${accent} px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] shadow-inner shadow-white`}>
        <span className="h-2 w-2 rounded-full bg-current opacity-70" />
        {title}
      </div>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm shadow-inner shadow-white/40"
          >
            <span className="text-slate-500">{item.label}</span>
            <span className={`rounded-full px-2 py-1 font-semibold text-slate-900 ${item.value !== "—" ? pillBg : ""}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
  placeholder?: string;
  error?: string | null;
}) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <div
        className={`group rounded-2xl border bg-white/80 shadow-sm transition duration-150 ease-out focus-within:bg-white focus-within:shadow-lg ${
          error
            ? "border-rose-300 focus-within:border-rose-300 focus-within:shadow-rose-100/60"
            : "border-slate-200 focus-within:border-blue-200 focus-within:shadow-blue-100/60"
        }`}
      >
        {multiline ? (
          <textarea
            className="w-full rounded-2xl bg-transparent px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <input
            className="w-full rounded-2xl bg-transparent px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        )}
      </div>
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm transition duration-150 ease-out focus-within:border-blue-200 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-blue-100/60">
        <select
          className="w-full rounded-2xl bg-transparent px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder ?? "Select"}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
