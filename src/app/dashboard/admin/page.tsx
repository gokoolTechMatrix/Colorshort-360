"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ?? "admin@qube.com";

const mockStats = [
  { label: "Total Sales", value: "₹2.45 Cr", change: "+12.4%" },
  { label: "Clients Onboarded", value: "438", change: "+6.8%" },
  { label: "Active Products", value: "62", change: "+2.1%" },
  { label: "Total Profit", value: "₹89.4 L", change: "+9.2%" },
];

const weeklySales = [65, 82, 54, 98, 76, 104, 90];

const stockAlerts = [
  { product: "Sortex Machine", status: "Low Stock", qty: "7 units" },
  { product: "Rice Sorting Machine", status: "Stable", qty: "15 units" },
  { product: "Sorting Machine", status: "Stable", qty: "25 units" },
  { product: "Grain Colour Sorter", status: "Low Stock", qty: "4 units" },
];

const tamilNaduZones = [
  {
    name: "Chennai North",
    metric: "2,487 units",
    change: "+1.8%",
    trend: "up",
  },
  {
    name: "Coimbatore Cluster",
    metric: "1,828 units",
    change: "+2.3%",
    trend: "up",
  },
  {
    name: "Madurai South",
    metric: "1,463 units",
    change: "-1.0%",
    trend: "down",
  },
];

const zoneDialLayers = [
  { radius: 90, strokeWidth: 12, value: 0.82, color: "#2563eb", rotation: -90 },
  { radius: 70, strokeWidth: 12, value: 0.65, color: "#2563eb", rotation: -120 },
  { radius: 50, strokeWidth: 12, value: 0.45, color: "#ef4444", rotation: -60 },
  { radius: 30, strokeWidth: 10, value: 0.35, color: "#d4d4d8", rotation: -30 },
];

const topOrders = [
  {
    state: "Tamil Nadu",
    company: "Chennai Agro Mills",
    delivery: "17 Nov, 2025 - 09:45",
    amount: "₹15,80,000",
    status: "Paid",
  },
  {
    state: "Karnataka",
    company: "Bengaluru Grain Works",
    delivery: "15 Nov, 2025 - 13:20",
    amount: "₹12,45,000",
    status: "Pending",
  },
  {
    state: "Telangana",
    company: "Hyderabad Agro Hub",
    delivery: "14 Nov, 2025 - 16:05",
    amount: "₹10,70,000",
    status: "Paid",
  },
  {
    state: "Maharashtra",
    company: "Navi Mumbai Sorters",
    delivery: "13 Nov, 2025 - 10:48",
    amount: "₹9,30,000",
    status: "Paid",
  },
  {
    state: "Gujarat",
    company: "Ahmedabad Cereals",
    delivery: "12 Nov, 2025 - 07:55",
    amount: "₹8,90,000",
    status: "Paid",
  },
];

export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/image.png");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      const role =
        (user?.user_metadata?.role as string | undefined)?.toLowerCase() ?? "";
      const superAdmin =
        user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL ||
        role === "super_admin";
      setIsSuperAdmin(superAdmin);
    });
    return () => {
      active = false;
    };
  }, [supabase]);

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
        // best-effort logo
      });
  }, []);

  const handleLogout = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      router.push("/");
    }
  }, [isSigningOut, router, supabase.auth]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        companyLogo={companyLogo}
        onLogout={handleLogout}
        isSigningOut={isSigningOut}
        activeHref="/dashboard"
        showSettings={isSuperAdmin}
        showUserCreation={isSuperAdmin}
      />

      <main className="flex-1 p-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Operations Overview
            </h1>
          </div>
          <div className="flex gap-3">
            <button className="rounded-2xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-white">
              Export
            </button>
            <button className="rounded-2xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500">
              Create Report
            </button>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-4">
          {mockStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-100"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {stat.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-500">
                {stat.change}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-100 lg:col-span-2">
            <p className="text-sm font-medium text-slate-500">
              Weekly Sales Performance
            </p>
            <WeeklySalesBar data={weeklySales} />
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-100">
            <p className="text-sm font-medium text-slate-500">Stock Alerts</p>
            <div className="mt-4 space-y-4">
              {stockAlerts.map((alert) => (
                <div
                  key={alert.product}
                  className="rounded-2xl border border-slate-100 p-4"
                >
                  <p className="text-base font-semibold text-slate-900">
                    {alert.product}
                  </p>
                  <p className="text-sm text-slate-500">{alert.qty}</p>
                  <p
                    className={`mt-2 text-xs font-semibold uppercase tracking-wider ${
                      alert.status.toLowerCase().includes("low")
                        ? "text-rose-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {alert.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  Product Statistic
                </p>
                <p className="text-xs text-slate-400">
                  Track Tamil Nadu zone performance
                </p>
              </div>
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4 text-slate-400"
                  aria-hidden
                >
                  <path
                    d="M6 2v2M14 2v2M3 7h14M5 4h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-[125px] cursor-pointer border-none bg-transparent text-xs font-semibold text-slate-600 outline-none [color-scheme:light]"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-col items-center gap-4 text-center">
              <ZoneStatsDial
                layers={zoneDialLayers}
              />
              <div>
                <p className="text-4xl font-semibold text-slate-900">9,829</p>
                <p className="text-sm text-slate-400">Products Sorted</p>
                <p className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
                  +5.34%
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {tamilNaduZones.map((zone, index) => (
                <div
                  key={zone.name}
                  className="flex items-center justify-between text-sm text-slate-600"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        index === 0
                          ? "bg-indigo-100 text-indigo-600"
                          : index === 1
                            ? "bg-blue-100 text-blue-600"
                            : "bg-rose-100 text-rose-500"
                      }`}
                    >
                      {zone.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {zone.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">
                      {zone.metric}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        zone.trend === "down"
                          ? "bg-rose-100 text-rose-600"
                          : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      {zone.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-100 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between text-sm font-medium text-slate-600">
              <p>Top Orders</p>
              <button className="text-indigo-500">View All</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <span>State</span>
                <span>Company</span>
                <span>Delivery Date</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {topOrders.map((order) => (
                <div
                  key={order.company}
                  className="grid grid-cols-5 items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600"
                >
                  <span className="font-semibold text-slate-900">
                    {order.state}
                  </span>
                  <span>{order.company}</span>
                  <span>{order.delivery}</span>
                  <span className="font-semibold text-slate-900">
                    {order.amount}
                  </span>
                  <span
                    className={`font-semibold ${
                      order.status === "Pending"
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function WeeklySalesBar({ data }: { data: number[] }) {
  return (
    <div>
      <div className="mt-4 flex items-end gap-3">
        {data.map((height, index) => (
          <div
            key={index}
            className="group flex-1 rounded-2xl bg-gradient-to-t from-indigo-200 to-indigo-500 transition duration-200 hover:from-rose-200 hover:to-rose-500 hover:shadow-lg"
            style={{ height: `${height + 80}px` }}
          />
        ))}
      </div>
      <div className="mt-4 flex justify-between text-xs font-semibold text-slate-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
    </div>
  );
}

function ZoneStatsDial({ layers }: { layers: typeof zoneDialLayers }) {
  const circumference = (radius: number) => 2 * Math.PI * radius;

  return (
    <svg viewBox="0 0 220 220" className="h-44 w-44">
      {layers.map((dial, index) => (
        <circle
          key={`bg-${index}`}
          cx="110"
          cy="110"
          r={dial.radius}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={dial.strokeWidth}
          opacity={0.4}
        />
      ))}
      {layers.map((dial, index) => {
        const dash = circumference(dial.radius) * dial.value;
        const gap = circumference(dial.radius);
        return (
          <circle
            key={index}
            cx="110"
            cy="110"
            r={dial.radius}
            fill="none"
            stroke={dial.color}
            strokeWidth={dial.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(${dial.rotation} 110 110)`}
            style={{
              opacity: 0.85,
              transition: "stroke-dashoffset 600ms ease, opacity 600ms ease",
            }}
          />
        );
      })}
    </svg>
  );
}
