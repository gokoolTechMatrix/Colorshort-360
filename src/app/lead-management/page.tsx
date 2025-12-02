"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type LeadStage =
  | "New"
  | "Contacted"
  | "Quotation Sent"
  | "Negotiation"
  | "Pending Approval"
  | "Closed"
  | "Won"
  | "Lost";

type LeadTemperature = "Hot" | "Warm" | "Cold";

type Lead = {
  id: string;
  name: string;
  company: string;
  modelLabel: string;
  modelValue: string;
  nextAction: string;
  stage: LeadStage;
  temperature: LeadTemperature;
  statusTag?: string;
};

const leadList: Lead[] = [
  {
    id: "CS-50000",
    name: "Matrix Smart",
    company: "Matrix Smart",
    modelLabel: "Model",
    modelValue: "Not set",
    nextAction: "Validate contact",
    stage: "New",
    temperature: "Warm",
    statusTag: "assigned",
  },
  {
    id: "CS-50001",
    name: "ABC COMPANY",
    company: "ABC COMPANY",
    modelLabel: "assignedModel",
    modelValue: "037e924c-02a5-4ea6-90df-471861a25e96",
    nextAction: "Validate contact",
    stage: "Pending Approval",
    temperature: "Warm",
    statusTag: "assigned",
  },
  {
    id: "CS-50002",
    name: "Ayesha Cody",
    company: "Ayesha Cody",
    modelLabel: "installedModel",
    modelValue: "6979aad8-9de6-4589-b824-6cfbc5099804",
    nextAction: "Review",
    stage: "Negotiation",
    temperature: "Hot",
    statusTag: "won",
  },
  {
    id: "CS-50003",
    name: "Qube",
    company: "Qube",
    modelLabel: "wonModel",
    modelValue: "6979aad8-9de6-4589-b824-6cfbc5099804",
    nextAction: "Review",
    stage: "Won",
    temperature: "Warm",
    statusTag: "won",
  },
  {
    id: "CS-50004",
    name: "Matrix",
    company: "Matrix",
    modelLabel: "quotation sentModel",
    modelValue: "6979aad8-9de6-4589-b824-6cfbc5099804",
    nextAction: "Follow-up call",
    stage: "Quotation Sent",
    temperature: "Warm",
    statusTag: "quotation sent",
  },
];

export default function LeadManagementPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo] = useState("/image.png");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"dashboard" | "quotations" | "orders">("dashboard");
  const [selectedFilter, setSelectedFilter] = useState<LeadStage | "All">("All");
  const [leads, setLeads] = useState<Lead[]>(leadList);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(leadList[0]?.id ?? null);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const detailRef = useRef<HTMLDivElement | null>(null);
  const [isRefreshingLeads, setIsRefreshingLeads] = useState(false);
  const [roleSlug, setRoleSlug] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const allowedRole = "sales-executive";

  const filteredLeads = useMemo(() => {
    if (selectedFilter === "All") return leads;
    return leads.filter((lead) => lead.stage === selectedFilter);
  }, [leads, selectedFilter]);

  const selectedLead =
    (selectedLeadId && filteredLeads.find((lead) => lead.id === selectedLeadId)) || filteredLeads[0] || null;

  useEffect(() => {
    const detectRole = () => {
      if (typeof window === "undefined") return allowedRole;
      const stored =
        window.localStorage.getItem("role_slug") ||
        window.localStorage.getItem("role") ||
        window.sessionStorage.getItem("role_slug") ||
        "";
      const normalized = stored?.toLowerCase().replace(/[^a-z0-9-]/g, "") || "";
      return normalized || allowedRole;
    };
    const role = detectRole();
    setRoleSlug(role);
    setAccessDenied(role !== allowedRole);
    setIsCheckingRole(false);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!selectedLead) return;
    const safeNextAt = selectedLead.nextAt ? String(selectedLead.nextAt) : "";
    const [datePart = "", timePart = ""] = safeNextAt.split(" ");
    setFollowUpDate(datePart);
    setFollowUpTime(timePart);
    setCallNotes(selectedLead.nextAction || "");
    if (detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedLead]);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    router.replace("/login");
  };

  const handleRefreshLeads = async () => {
    if (isRefreshingLeads) return;
    setIsRefreshingLeads(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setToast("Leads refreshed");
    setIsRefreshingLeads(false);
  };

  const handleStageChange = (leadId: string, stage: LeadStage) => {
    setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead)));
    setToast(`Lead ${leadId} moved to ${stage}`);
  };

  const handleAssign = (leadId: string, owner: string) => {
    setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, owner } : lead)));
    setToast(`Lead ${leadId} assigned to ${owner}`);
  };

  const handleReceiveLead = () => {
    const nextId = `L-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newLead: Lead = {
      id: nextId,
      name: "New Prospect",
      company: "Assigned Company",
      modelLabel: "Model",
      modelValue: "Not set",
      nextAction: "Intro call",
      stage: "New",
      temperature: "Warm",
      statusTag: "assigned",
      owner: "You",
    };
    setLeads((prev) => [newLead, ...prev]);
    setSelectedLeadId(newLead.id);
    setToast("New lead received");
  };

  const handleOpenLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setToast(`Opening ${leadId}`);
  };

  const handleNextAction = () => {
  if (!selectedLead) return;
  const nextStage: LeadStage =
    selectedLead.stage === "New"
      ? "Contacted"
      : selectedLead.stage === "Contacted"
        ? "Quotation Sent"
        : "Pending Approval";
  handleStageChange(selectedLead.id, nextStage);
  setToast("Next action logged");
};

  const handleSaveFollowUp = () => {
    if (!selectedLead) return;
    const nextAt = [followUpDate, followUpTime].filter(Boolean).join(" ");
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === selectedLead.id
          ? { ...lead, nextAt: nextAt || lead.nextAt, nextAction: callNotes || lead.nextAction }
          : lead,
      ),
    );
    setToast("Follow-up updated");
  };

  const handleRequestEmi = () => setToast("EMI approval requested");
  const handleRequestDiscount = () => setToast("Discount approval requested");
  const handleCallReminder = () => selectedLead && setToast(`Call reminder set for ${selectedLead.name}`);
  const handleTrackOrder = () => setToast("Tracking order status");

  const kpis = [
    { label: "My Leads", value: leads.length, color: "bg-gradient-to-br from-[#d8e5ff] via-[#bcd5ff] to-[#8eb8ff]" },
    { label: "Pending Approvals", value: 0, color: "bg-gradient-to-br from-[#ffe3d2] via-[#ffd3bd] to-[#ffb789]" },
    { label: "Quotes Sent", value: 1, color: "bg-gradient-to-br from-[#dcffe7] via-[#b7ffd1] to-[#7fffb0]" },
  ];

  const quotationKpis = [
    { label: "Total Quotations", value: 14, color: "bg-gradient-to-br from-[#e3f0ff] via-[#c8e0ff] to-[#a9cdff]" },
    { label: "Approved", value: 7, color: "bg-gradient-to-br from-[#e9fff2] via-[#c8ffd8] to-[#9efac1]" },
    { label: "PO Received", value: 4, color: "bg-gradient-to-br from-[#fff2e2] via-[#ffd8b5] to-[#ffb37a]" },
    { label: "Pending", value: 3, color: "bg-gradient-to-br from-[#ffeaf2] via-[#ffcfe3] to-[#ff9fc7]" },
  ];

  const quotations = [
    {
      id: "Q-2025-729",
      status: "PO RECEIVED",
      company: "Matrix Smart",
      client: "Matrix Smart",
      leadId: "251111",
      date: "21/11/2025",
      price: "₹11,80,000",
    },
    {
      id: "Q-2025-771",
      status: "SUBMITTED",
      company: "ABC COMPANY",
      client: "ABC COMPANY",
      leadId: "251110",
      date: "21/11/2025",
      price: "₹3,98,000",
    },
    {
      id: "Q-2025-668",
      status: "SUBMITTED",
      company: "ABC COMPANY",
      client: "ABC COMPANY",
      leadId: "251109",
      date: "21/11/2025",
      price: "₹0",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        companyLogo={companyLogo}
        onLogout={handleLogout}
        isSigningOut={isSigningOut}
        activeHref="/lead-management"
        showLeadManagement
      />

      <main className="flex-1 px-4 py-6 sm:px-8">
        <header className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-r from-[#2f7bff] via-[#149dff] to-[#05c6c8] p-6 text-white shadow-[0_25px_55px_rgba(20,157,255,0.35)]">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-10 -top-16 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -right-8 bottom-4 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Sales Command</p>
              <h1 className="mt-1 text-3xl font-semibold leading-tight">Naveen, keep momentum on live deals.</h1>
              <p className="text-sm text-white/85">Track funnel health, follow-ups, and top opportunities.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {[
                { label: "Leads today", value: "12" },
                { label: "Win rate", value: "28%" },
                { label: "Follow-ups pending", value: "7" },
              ].map((pill) => (
                <span
                  key={pill.label}
                  className="rounded-full bg-white/20 px-3 py-2 text-white shadow-inner shadow-cyan-200/40 backdrop-blur"
                >
                  {pill.label}: {pill.value}
                </span>
              ))}
            </div>
          </div>
          <nav className="relative mt-4 flex flex-wrap gap-2 text-sm font-semibold">
            {[
              { key: "dashboard", label: "Dashboard" },
              { key: "quotations", label: "Quotations" },
              { key: "orders", label: "Orders" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
                className={`rounded-full px-3 py-1.5 transition ${
                  selectedTab === tab.key
                    ? "bg-white text-blue-700 shadow-sm shadow-blue-200"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {selectedTab === "dashboard" && (
          <>
            <section className="grid gap-3 sm:grid-cols-3">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className={`rounded-2xl border border-slate-100 ${kpi.color} p-4 shadow-sm shadow-slate-100`}
                >
                  <p className="text-xs font-semibold text-slate-600">{kpi.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{kpi.value}</p>
                </div>
              ))}
            </section>

            <section className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">My Leads</p>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard/sales-co-ordinator/add-lead/new")}
                    className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-400"
                  >
                    Add Lead
                  </button>
                </div>

                <div className="space-y-3">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{lead.name}</p>
                            <p className="text-xs text-slate-500">Lead ID: {lead.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                            {lead.modelLabel}: {lead.modelValue}
                          </span>
                          {lead.statusTag && (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600">
                              {lead.statusTag}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2" />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{lead.nextAction}</span>
                        <span className="text-xs text-slate-500">Next Action</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
                  <p className="text-sm font-semibold text-slate-800">Pending Approvals</p>
                  <p className="mt-2 text-xs text-slate-500">No pending approvals.</p>
                </div>
                {selectedLead && (
                  <div
                    ref={detailRef}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">Selected Lead</p>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                        {selectedLead.stage}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{selectedLead.name} · {selectedLead.id}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">Next: {selectedLead.nextAction}</p>
                    <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600">
                      <label className="space-y-1">
                        <span>Date</span>
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm shadow-inner focus:border-cyan-300 focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1">
                        <span>Time</span>
                        <input
                          type="time"
                          value={followUpTime}
                          onChange={(e) => setFollowUpTime(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm shadow-inner focus:border-cyan-300 focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1">
                        <span>Notes</span>
                        <textarea
                          value={callNotes}
                          onChange={(e) => setCallNotes(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm shadow-inner focus:border-cyan-300 focus:outline-none"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <button
                        onClick={handleNextAction}
                        className="rounded-full bg-blue-500 px-3 py-1.5 text-white shadow-sm shadow-blue-200 transition hover:bg-blue-400"
                      >
                        Next action
                      </button>
                      <button
                        onClick={handleSaveFollowUp}
                        className="rounded-full bg-cyan-500 px-3 py-1.5 text-white shadow-sm shadow-cyan-200 transition hover:bg-cyan-400"
                      >
                        Save follow-up
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {selectedTab === "quotations" && (
          <>
            <section className="mb-4 grid gap-3 sm:grid-cols-4">
              {quotationKpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className={`rounded-2xl border border-white/60 ${kpi.color} p-4 shadow-md shadow-slate-100`}
                >
                  <p className="text-xs font-semibold text-slate-700">{kpi.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{kpi.value}</p>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              {quotations.map((quote) => (
                <div
                  key={quote.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-[1px] hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{quote.id}</p>
                      <p className="text-xs text-slate-500">
                        Company: {quote.company} · Client: {quote.client} · Lead ID: {quote.leadId} · Date: {quote.date}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600">
                      {quote.status}
                    </span>
                    <p className="text-lg font-semibold text-slate-900">{quote.price}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                    <button className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 shadow-inner transition hover:bg-slate-200">
                      Preview Invoice
                    </button>
                    <button className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 shadow-inner transition hover:bg-slate-200">
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {selectedTab === "orders" && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
            Orders view coming soon.
          </div>
        )}
      </main>

      {toast && <LeadToast message={toast} />}
    </div>
  );
}

function LeadToast({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center">
      <div
        className="mt-10 rounded-3xl bg-linear-to-r from-cyan-200 via-cyan-300 to-sky-300 px-6 py-4 text-sm font-semibold text-slate-900 shadow-[0_15px_40px_rgba(14,165,233,0.35)] backdrop-blur"
        style={{
          animation: "toastPop 220ms ease, toastFade 320ms ease 2.7s forwards",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-base font-bold text-cyan-700 shadow-inner shadow-cyan-100">
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



