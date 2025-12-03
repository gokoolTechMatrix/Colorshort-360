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
  owner?: string;
  nextAt?: string;
};

type Quotation = {
  id: string;
  status: "Draft" | "Submitted" | "Approved" | "PO Received" | "Pending" | "Rejected";
  company: string;
  client: string;
  leadId: string;
  date: string;
  price: string;
  validity?: string;
};

type OrderForm = {
  model: string;
  totalPrice: string;
  quantity: string;
  customerName: string;
  gstNumber: string;
  contactPerson: string;
  billingAddress: string;
  shippingAddress: string;
  discount: string;
  paymentMethod: string;
  deliveryTimeline: string;
  shipmentType: string;
  specialRequest: string;
  terms: string;
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
  const allowedRoles = new Set(["sales-manager", "sales-co-ordinator", "sales-executive"]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedQuotationForOrder, setSelectedQuotationForOrder] = useState<Quotation | null>(null);
  const defaultOrderForm = (q: Quotation | null = null): OrderForm => ({
    model: "CS-5000",
    totalPrice: q?.price ?? "₹ 8,40,000",
    quantity: "1",
    customerName: q?.client ?? "",
    gstNumber: "11nnjcwedeq",
    contactPerson: q?.client ? q.client.split(" ")[0] ?? "" : "",
    billingAddress: "1342,\nMadurai, Tamil Nadu",
    shippingAddress: "",
    discount: "₹ 10,000",
    paymentMethod: "",
    deliveryTimeline: "",
    shipmentType: "",
    specialRequest: "",
    terms: "",
  });
  const [orderForm, setOrderForm] = useState<OrderForm>(defaultOrderForm());

  const filteredLeads = useMemo(() => {
    if (selectedFilter === "All") return leads;
    return leads.filter((lead) => lead.stage === selectedFilter);
  }, [leads, selectedFilter]);

  const selectedLead =
    (selectedLeadId && filteredLeads.find((lead) => lead.id === selectedLeadId)) || filteredLeads[0] || null;

  useEffect(() => {
    const detectRole = () => {
      if (typeof window === "undefined") return "sales-manager";
      const stored =
        window.localStorage.getItem("role_slug") ||
        window.localStorage.getItem("role") ||
        window.sessionStorage.getItem("role_slug") ||
        "";
      const normalized = stored?.toLowerCase().replace(/[^a-z0-9-]/g, "") || "";
      return normalized || "sales-manager";
    };
    const role = detectRole();
    setRoleSlug(role);
    setAccessDenied(!allowedRoles.has(role));
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

  const handleOrderFieldChange = (field: keyof OrderForm, value: string) => {
    setOrderForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCopyBilling = () => {
    setOrderForm((prev) => ({ ...prev, shippingAddress: prev.billingAddress }));
  };

  const handleOpenOrderModal = (q: Quotation) => {
    setSelectedQuotationForOrder(q);
    setOrderForm(defaultOrderForm(q));
    setShowOrderModal(true);
  };

  const handleCloseOrderModal = () => {
    setShowOrderModal(false);
    setSelectedQuotationForOrder(null);
  };

  const handleOrderSubmit = (mode: "draft" | "submit") => {
    setToast(mode === "submit" ? "Order sheet Submitted" : "Order sheet created");
    setShowOrderModal(false);
  };

  const handlePrintQuote = (quote: Quotation) => {
    const win = window.open("", "print-quote", "width=900,height=1200");
    if (!win) return;
    const html = `<!doctype html>
    <html><head><meta charset="utf-8"><title>Quotation ${quote.id}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #1f2937; margin: 32px; }
      .row { display:flex; justify-content:space-between; }
      .title { font-size:24px; font-weight:700; margin:12px 0; }
      .muted { color:#6b7280; font-size:12px; }
      table { width:100%; border-collapse:collapse; margin-top:24px; }
      th,td { border-bottom:1px solid #e5e7eb; padding:10px; text-align:left; font-size:13px; }
      th { text-transform:uppercase; letter-spacing:0.08em; color:#6b7280; }
      .total { text-align:right; font-weight:700; font-size:16px; }
    </style>
    </head><body>
      <div class="row">
        <div>
          <div class="title">QUOTATION</div>
          <div class="muted">No. ${quote.id}</div>
          <div class="muted">Date: ${quote.date}</div>
        </div>
        <div style="text-align:right">
          <div class="title" style="font-size:18px;">Qube Technologies</div>
          <div class="muted">Rice Sorting Solutions</div>
        </div>
      </div>
      <div class="row" style="margin-top:16px;">
        <div>
          <div class="muted" style="letter-spacing:0.08em;font-weight:700;">FROM</div>
          <div>Qube Technologies Pvt Ltd</div>
          <div class="muted">sales@qube.tech</div>
          <div class="muted">GST: 33AABCU9603R1ZX</div>
        </div>
        <div>
          <div class="muted" style="letter-spacing:0.08em;font-weight:700;">TO</div>
          <div>${quote.client}</div>
          <div class="muted">Contact: ${quote.client}</div>
          <div class="muted">Phone: 9080202120</div>
          <div class="muted">GST: 11nnjcwedeq</div>
          <div class="muted">1342, Madurai, Tamil Nadu</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Items Description</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Total</th></tr></thead>
        <tbody>
          <tr><td>CS-5000 · High-performance rice sorter</td><td style="text-align:right;">₹ 850,000</td><td style="text-align:right;">1</td><td style="text-align:right;">₹ 850,000</td></tr>
        </tbody>
      </table>
      <div class="total" style="margin-top:12px;">Subtotal: ${quote.price}</div>
      <div class="muted" style="margin-top:8px;">Tax GST 18%: ₹ 153,000 · Discount: ₹ 10,000</div>
      <div class="total" style="margin-top:8px;">Total Due: ₹ 993,000</div>
      <div style="margin-top:24px;">
        <div class="muted" style="letter-spacing:0.08em;font-weight:700;">TERMS & CONDITIONS</div>
        <div class="muted">Payment due within 30 days. Installation and training included.</div>
      </div>
      <div style="margin-top:24px;font-weight:700;">Thank you for your business.</div>
    </body></html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  if (isCheckingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
        Checking access...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-rose-500">
        Access denied for lead management.
      </div>
    );
  }

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
      price: "₹,111,80,000",
    },
    {
      id: "Q-2025-771",
      status: "Submitted",
      company: "ABC COMPANY",
      client: "ABC COMPANY",
      leadId: "251110",
      date: "21/11/2025",
      price: "₹,13,98,000",
    },
    {
      id: "Q-2025-668",
      status: "Submitted",
      company: "ABC COMPANY",
      client: "ABC COMPANY",
      leadId: "251109",
      date: "21/11/2025",
      price: "₹,10",
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
        <header className="relative mb-5 overflow-hidden rounded-3xl bg-linear-to-r from-[#2f7bff] via-[#149dff] to-[#05c6c8] p-6 text-white shadow-[0_25px_55px_rgba(20,157,255,0.35)]">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-10 -top-16 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -right-8 bottom-4 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Sales Command</p>
              <h1 className="mt-1 text-3xl font-semibold leading-tight">Keep momentum on live deals.</h1>
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
              <div className="space-y-3 lg:col-span-2">
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

                <div className="grid gap-3 md:grid-cols-2">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-px hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{lead.name}</p>
                          <p className="text-xs text-slate-500">{lead.company}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {lead.stage}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2 py-1">{lead.temperature}</span>
                        {lead.statusTag && (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{lead.statusTag}</span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-600">Next: {lead.nextAction}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <button
                          className="rounded-full bg-blue-500 px-3 py-1.5 text-white shadow-sm shadow-blue-200 transition hover:bg-blue-400"
                          onClick={() => handleOpenLead(lead.id)}
                        >
                          Open
                        </button>
                        <button
                          className="rounded-full bg-emerald-500 px-3 py-1.5 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400"
                          onClick={() => handleAssign(lead.id, "You")}
                        >
                          Assign to me
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
                  <p className="text-sm font-semibold text-slate-800">Lead controls</p>
                  <div className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
                    <button
                      onClick={handleReceiveLead}
                      className="w-full rounded-xl bg-blue-500 px-3 py-2 text-white shadow-sm shadow-blue-200 transition hover:bg-blue-400"
                    >
                      Receive lead
                    </button>
                    <button
                      onClick={handleNextAction}
                      className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400"
                    >
                      Log next action
                    </button>
                    <button
                      onClick={handleCallReminder}
                      className="w-full rounded-xl bg-indigo-500 px-3 py-2 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                    >
                      Set call reminder
                    </button>
                  </div>
                </div>

                <div
                  ref={detailRef}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">Follow-up</p>
                    <button
                      onClick={handleSaveFollowUp}
                      className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-400"
                    >
                      Save
                    </button>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(event) => setFollowUpDate(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-400 focus:outline-none"
                    />
                    <input
                      type="time"
                      value={followUpTime}
                      onChange={(event) => setFollowUpTime(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-400 focus:outline-none"
                    />
                    <textarea
                      value={callNotes}
                      onChange={(event) => setCallNotes(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-400 focus:outline-none"
                      rows={3}
                      placeholder="Add call notes"
                    />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {selectedTab === "quotations" && (
          <div className="space-y-4">
            <section className="grid gap-3 sm:grid-cols-4">
              {quotationKpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className={`rounded-2xl border border-slate-100 ${kpi.color} p-4 shadow-sm shadow-slate-100`}
                >
                  <p className="text-xs font-semibold text-slate-600">{kpi.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{kpi.value}</p>
                </div>
              ))}
            </section>
            <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Quotation queue</p>
                <button
                  onClick={handleRequestDiscount}
                  className="rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                >
                  Request discount approval
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {quotations.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 shadow-sm shadow-slate-100"
                  >
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                      <span>{q.id}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-blue-700">
                        {q.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {q.company} · {q.client}
                    </p>
                    <p className="text-xs text-slate-600">
                      Lead: {q.leadId} · {q.date}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{q.price}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                      <button
                        onClick={handleRequestEmi}
                        className="rounded-full bg-emerald-500 px-3 py-1 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400"
                      >
                        Request EMI
                      </button>
                      <button
                        onClick={() => handleStageChange(q.leadId, "Pending Approval")}
                        className="rounded-full bg-blue-500 px-3 py-1 text-white shadow-sm shadow-blue-200 transition hover:bg-blue-400"
                      >
                        Move to approval
                      </button>
                      <button
                        onClick={() => handleOpenOrderModal(q)}
                        className="rounded-full bg-indigo-500 px-3 py-1 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                      >
                        Order sheet
                      </button>
                      <button
                        onClick={() => handlePrintQuote(q)}
                        className="rounded-full bg-white px-3 py-1 text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                      >
                        Print / PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {selectedTab === "orders" && (
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Order tracking</p>
              <button
                onClick={handleTrackOrder}
                className="rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-400"
              >
                Track latest order
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              ViewPO Received, dispatch, and installation readiness for your live orders.
            </p>
          </div>
        )}
      </main>

      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl shadow-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Create Order Sheet</h3>
                {selectedQuotationForOrder && (
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    From {selectedQuotationForOrder.id} · {selectedQuotationForOrder.company}
                  </p>
                )}
              </div>
              <button
                onClick={handleCloseOrderModal}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 text-sm font-semibold text-slate-700">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span>Model</span>
                  <input
                    value={orderForm.model}
                    onChange={(e) => handleOrderFieldChange("model", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="space-y-2">
                  <span>Total Price</span>
                  <input
                    value={orderForm.totalPrice}
                    onChange={(e) => handleOrderFieldChange("totalPrice", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span>Quantity</span>
                <input
                  value={orderForm.quantity}
                  onChange={(e) => handleOrderFieldChange("quantity", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="space-y-2">
                <span>Customer Name</span>
                <input
                  value={orderForm.customerName}
                  onChange={(e) => handleOrderFieldChange("customerName", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span>GST No.</span>
                  <input
                    value={orderForm.gstNumber}
                    onChange={(e) => handleOrderFieldChange("gstNumber", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="space-y-2">
                  <span>Contact Person</span>
                  <input
                    value={orderForm.contactPerson}
                    onChange={(e) => handleOrderFieldChange("contactPerson", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span>Billing Address</span>
                <textarea
                  rows={2}
                  value={orderForm.billingAddress}
                  onChange={(e) => handleOrderFieldChange("billingAddress", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Shipping Address</span>
                  <button
                    onClick={handleCopyBilling}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Copy billing → shipping
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={orderForm.shippingAddress}
                  onChange={(e) => handleOrderFieldChange("shippingAddress", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <label className="space-y-2">
                <span>Discount (from Quotation)</span>
                <input
                  value={orderForm.discount}
                  onChange={(e) => handleOrderFieldChange("discount", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2">
                  <span>Payment Method</span>
                  <input
                    value={orderForm.paymentMethod}
                    onChange={(e) => handleOrderFieldChange("paymentMethod", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="space-y-2">
                  <span>Delivery Timeline</span>
                  <input
                    value={orderForm.deliveryTimeline}
                    onChange={(e) => handleOrderFieldChange("deliveryTimeline", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="space-y-2">
                  <span>Shipment Type</span>
                  <input
                    value={orderForm.shipmentType}
                    onChange={(e) => handleOrderFieldChange("shipmentType", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span>Special Request</span>
                <textarea
                  rows={2}
                  value={orderForm.specialRequest}
                  onChange={(e) => handleOrderFieldChange("specialRequest", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="space-y-2">
                <span>Terms / Notes</span>
                <textarea
                  rows={3}
                  value={orderForm.terms}
                  onChange={(e) => handleOrderFieldChange("terms", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  onClick={handleCloseOrderModal}
                  className="rounded-full border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleOrderSubmit("submit")}
                  className="rounded-full bg-slate-900 px-4 py-2 text-white shadow-sm transition hover:bg-slate-800"
                >
                  Create &amp; Submit
                </button>
                <button
                  onClick={() => handleOrderSubmit("draft")}
                  className="rounded-full bg-indigo-500 px-4 py-2 text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-auto fixed bottom-6 right-6 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg shadow-slate-200">
          {toast}
        </div>
      )}
    </div>
  );
}
