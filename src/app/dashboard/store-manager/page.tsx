"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// Mock manufacturing data
const mockKPIData = {
    totalStockItems: { value: "1,248", trend: "+12%", isPositive: true },
    lowStockAlerts: { value: "17", trend: "Critical", isPositive: false },
    pendingPOs: { value: "6", trend: "Due this week", isPositive: false },
    pendingSpareRequests: { value: "9", trend: "From Service Dept", isPositive: false },
};

const mockSecondaryKPIs = {
    todayGRN: "3",
    todayIssues: "14",
    todayReturns: "2",
    warehouseTransfers: "4",
};

const mockInventoryData = [
    { sku: "SKU-001", name: "RGB Sensor Board", category: "Electronics", qty: 45, value: "₹2,25,000", location: "Bin-A12" },
    { sku: "SKU-002", name: "Conveyor Motor 5HP", category: "Motors", qty: 12, value: "₹4,80,000", location: "Bin-C04" },
    { sku: "SKU-003", name: "PCB Assembly Main", category: "Electronics", qty: 28, value: "₹8,40,000", location: "Bin-A15" },
    { sku: "SKU-004", name: "Pneumatic Valve", category: "Pneumatics", qty: 67, value: "₹2,01,000", location: "Bin-D09" },
];

const mockSpareRequests = [
    { id: "SR-001", ticketNo: "TKT-2301", item: "Sensor Board", qty: 2, requestedBy: "Tech-A", status: "Pending", machine: "Sortex S5" },
    { id: "SR-002", ticketNo: "TKT-2298", item: "Motor Belt", qty: 1, requestedBy: "Tech-B", status: "Approved", machine: "Sortex X1" },
    { id: "SR-003", ticketNo: "TKT-2295", item: "Power Supply", qty: 3, requestedBy: "Tech-C", status: "Pending", machine: "Grain Sorter G2" },
];

const mockLowStock = [
    { sku: "SKU-231", item: "Sensor Board", available: 4, reorderLevel: 10, lastPurchase: "2 weeks ago" },
    { sku: "SKU-189", item: "PCB Tray", available: 6, reorderLevel: 15, lastPurchase: "1 month ago" },
    { sku: "SKU-445", item: "Cable Assembly", available: 8, reorderLevel: 20, lastPurchase: "3 weeks ago" },
];

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ?? "admin@qube.com";

const sidebarLinks = [
    {
        label: "Dashboard Overview",
        href: "/dashboard/store-manager",
        icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 13h6V4H4v9Zm10 7h6v-8h-6v8ZM4 20h6v-5H4v5ZM14 4v5h6V4h-6Z" />
            </svg>
        ),
    },
    {
        label: "Inventory Management",
        href: "#",
        icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M9 22V12h6v10" />
            </svg>
        ),
    },
    {
        label: "Spare Parts",
        href: "#",
        icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5" />
            </svg>
        ),
    },
    {
        label: "Purchase Orders",
        href: "#",
        icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
        ),
    },
    {
        label: "GRN - Goods Receipt",
        href: "#",
        icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path d="M12 22V12M22 7.5L12 12 2 7.5" />
            </svg>
        ),
    },
    {
        label: "Stock Alerts",
        href: "#",
        icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <path d="M12 9v4M12 17h.01" />
            </svg>
        ),
    },
    {
        label: "Reports & Exports",
        href: "#",
        icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M7 4h10l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                <path d="M7 10h10M7 14h6" />
            </svg>
        ),
    },
];

export default function StoreManagerDashboard() {
    const router = useRouter();
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);
    const [collapsed, setCollapsed] = useState(false);
    const [companyLogo, setCompanyLogo] = useState("/image.png");
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [activeModal, setActiveModal] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        supabase.auth.getSession().then(({ data }) => {
            if (!active) return;
            const user = data.session?.user;
            if (!user) {
                router.replace("/login");
                return;
            }
            const role = (user.user_metadata?.role as string | undefined)?.toLowerCase() ?? "";
            const allowed =
                user.email?.toLowerCase() === SUPER_ADMIN_EMAIL ||
                role === "super_admin" ||
                role === "store manager";
            setIsAuthorized(allowed);
        });
        return () => {
            active = false;
        };
    }, [router, supabase]);

    useEffect(() => {
        fetch("/api/company-settings")
            .then(async (response) => {
                if (!response.ok) return;
                const payload = (await response.json()) as { settings?: { logo_url?: string } };
                if (payload?.settings?.logo_url) {
                    setCompanyLogo(payload.settings.logo_url);
                }
            })
            .catch(() => { });
    }, []);

    if (isAuthorized === null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
                    <span className="text-sm font-semibold text-slate-600">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
                <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200">
                    <p className="text-sm uppercase tracking-[0.4em] text-rose-400">Restricted</p>
                    <h1 className="mt-3 text-3xl font-semibold text-slate-900">Store Manager Access Required</h1>
                    <p className="mt-4 text-sm text-slate-600">
                        Only Store Managers can access this dashboard.
                    </p>
                    <button
                        onClick={() => router.replace("/dashboard")}
                        className="mt-8 w-full rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Go to dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside
                className={`relative flex ${collapsed ? "w-24" : "w-72"} flex-col border-r border-slate-200 bg-white/95 px-6 pb-6 pt-14 transition-all duration-300`}
            >
                <button
                    aria-label="Toggle sidebar"
                    onClick={() => setCollapsed((prev) => !prev)}
                    className="absolute right-3 top-3 rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:text-amber-600"
                >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M4 6h16M8 12h12M4 18h16" />
                    </svg>
                </button>

                <div className="flex items-center justify-center pb-6">
                    <img
                        src={companyLogo}
                        alt="Company logo"
                        className={`object-contain transition-all duration-300 ${collapsed ? "h-14 w-14" : "h-20 w-20"}`}
                    />
                </div>

                <nav className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                    {sidebarLinks.map((link) => (
                        <button
                            key={link.label}
                            className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-amber-50 hover:text-amber-600"
                            onClick={() => link.href !== "#" && router.push(link.href)}
                        >
                            <span className="text-slate-400">{link.icon}</span>
                            {!collapsed && <span>{link.label}</span>}
                        </button>
                    ))}
                </nav>

                <button
                    onClick={() => router.push("/")}
                    className="mt-auto flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-100"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-500">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M3 5h8m0 0v14m0-14 6 6m-6 8 6-6" />
                        </svg>
                    </span>
                    {!collapsed && <span>Logout</span>}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    {/* Header */}
                    <header className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-600">Store Management</p>
                            <h1 className="mt-1 text-3xl font-bold text-slate-900">Store Manager Dashboard</h1>
                            <p className="mt-1 text-sm text-slate-500">Inventory • Spares • Procurement • Service Spares Flow</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <input
                                type="search"
                                placeholder="Search Spare / SKU / PO"
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                            />
                            <button
                                onClick={() => setActiveModal("create_po")}
                                className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-300"
                            >
                                + Create Purchase Order
                            </button>
                        </div>
                    </header>

                    {/* Primary KPI Cards */}
                    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <KPICard title="Total Stock Items" value={mockKPIData.totalStockItems.value} trend={mockKPIData.totalStockItems.trend} isPositive={mockKPIData.totalStockItems.isPositive} icon="📦" color="from-amber-400 to-orange-500" />
                        <KPICard title="Low Stock Alerts" value={mockKPIData.lowStockAlerts.value} trend={mockKPIData.lowStockAlerts.trend} isPositive={mockKPIData.lowStockAlerts.isPositive} icon="⚠️" color="from-red-400 to-rose-500" />
                        <KPICard title="Pending Purchase Orders" value={mockKPIData.pendingPOs.value} trend={mockKPIData.pendingPOs.trend} isPositive={false} icon="🛒" color="from-blue-400 to-indigo-500" />
                        <KPICard title="Pending Spare Requests" value={mockKPIData.pendingSpareRequests.value} trend={mockKPIData.pendingSpareRequests.trend} isPositive={false} icon="🔧" color="from-purple-400 to-violet-500" />
                    </section>

                    {/* Secondary KPI Cards */}
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <SecondaryKPI label="Today's GRN" value={mockSecondaryKPIs.todayGRN} icon="📥" bgColor="from-blue-50 to-cyan-50" borderColor="border-blue-100" />
                        <SecondaryKPI label="Today's Issues" value={mockSecondaryKPIs.todayIssues} icon="📤" bgColor="from-amber-50 to-orange-50" borderColor="border-amber-100" />
                        <SecondaryKPI label="Today's Returns" value={mockSecondaryKPIs.todayReturns} icon="↩️" bgColor="from-purple-50 to-pink-50" borderColor="border-purple-100" />
                        <SecondaryKPI label="Warehouse Transfers" value={mockSecondaryKPIs.warehouseTransfers} icon="🔀" bgColor="from-emerald-50 to-teal-50" borderColor="border-emerald-100" />
                    </section>

                    {/* Navigation Cards */}
                    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <NavigationCard icon="📦" title="Inventory Overview" description="Stock, valuation, adjustments" onClick={() => setActiveModal("inventory")} color="from-amber-400 to-orange-500" />
                        <NavigationCard icon="⚙️" title="Spare Parts" description="Issue, return, tracking" onClick={() => setActiveModal("spare_parts")} color="from-orange-400 to-red-500" />
                        <NavigationCard icon="🚚" title="Purchase Orders" description="Create & track POs" onClick={() => setActiveModal("purchase_orders")} color="from-amber-500 to-yellow-600" />
                        <NavigationCard icon="📥" title="GRN – Goods Receipt" description="Record incoming stock" onClick={() => setActiveModal("grn")} color="from-yellow-400 to-amber-500" />
                        <NavigationCard icon="📤" title="Stock Issue" description="Issue spares to service" onClick={() => setActiveModal("stock_issue")} color="from-orange-500 to-amber-600" />
                        <NavigationCard icon="🔄" title="Returns & Replacement" description="Return damaged items" onClick={() => setActiveModal("returns")} color="from-red-400 to-orange-500" />
                        <NavigationCard icon="🔀" title="Warehouse Transfer" description="Inter-store transfers" onClick={() => setActiveModal("warehouse_transfer")} color="from-amber-600 to-orange-600" />
                        <NavigationCard icon="⚠️" title="Stock Alerts" description="Low stock notifications" onClick={() => setActiveModal("stock_alerts")} color="from-red-500 to-rose-600" />
                    </section>

                    {/* Quick Actions */}
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Quick Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            <QuickAction label="Create PO" icon="➕" onClick={() => setActiveModal("create_po")} />
                            <QuickAction label="Record GRN" icon="✅" onClick={() => setActiveModal("record_grn")} />
                            <QuickAction label="Issue Spare" icon="📤" onClick={() => setActiveModal("issue_spare")} />
                            <QuickAction label="Return Entry" icon="🔄" onClick={() => setActiveModal("return_entry")} />
                            <QuickAction label="Add New Item" icon="📦" onClick={() => setActiveModal("add_item")} />
                        </div>
                    </section>

                    {/* Data Tables */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold text-slate-900">Pending Spare Requests</h3>
                            <div className="space-y-3">
                                {mockSpareRequests.map((request) => (
                                    <div key={request.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100">
                                        <div>
                                            <p className="font-semibold text-slate-900">{request.item}</p>
                                            <p className="text-sm text-slate-500">{request.ticketNo} • Qty: {request.qty}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${request.status === "Approved" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                                            {request.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold text-slate-900">Low Stock Alerts</h3>
                            <div className="space-y-3">
                                {mockLowStock.map((item) => (
                                    <div key={item.sku} className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50 p-4">
                                        <div>
                                            <p className="font-semibold text-slate-900">{item.item}</p>
                                            <p className="text-sm text-slate-500">Available: {item.available} • Reorder: {item.reorderLevel}</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveModal("create_po")}
                                            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
                                        >
                                            Create PO
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {activeModal && (
                <ModalOverlay onClose={() => setActiveModal(null)} title={getModalTitle(activeModal)}>
                    <ModalContent modalType={activeModal} />
                </ModalOverlay>
            )}
        </div>
    );
}

function KPICard({ title, value, trend, isPositive, icon, color }: { title: string; value: string; trend: string; isPositive: boolean; icon: string; color: string; }) {
    return (
        <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-2xl shadow-lg`}>{icon}</div>
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${isPositive ? "text-emerald-500" : "text-rose-500"}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {isPositive ? <path d="m5 12 4-4 4 4 6-6" /> : <path d="m5 12 4 4 4-4 6 6" />}
                </svg>
            </div>
            <p className="mt-4 text-xs uppercase tracking-wider text-slate-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            <p className={`mt-1 text-sm font-semibold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>{trend}</p>
        </div>
    );
}

function SecondaryKPI({ label, value, icon, bgColor, borderColor }: { label: string; value: string; icon: string; bgColor: string; borderColor: string; }) {
    return (
        <div className={`rounded-2xl border ${borderColor} bg-gradient-to-br ${bgColor} p-4 shadow-sm transition hover:shadow-md`}>
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

function NavigationCard({ icon, title, description, onClick, color }: { icon: string; title: string; description: string; onClick: () => void; color: string; }) {
    return (
        <button
            onClick={onClick}
            className="group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-3xl shadow-lg transition duration-300 group-hover:scale-110`}>{icon}</div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
        </button>
    );
}

function QuickAction({ label, icon, onClick }: { label: string; icon: string; onClick: () => void; }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 hover:shadow-md"
        >
            <span className="text-lg">{icon}</span>
            {label}
        </button>
    );
}

function ModalOverlay({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode; }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                    <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                    <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

function ModalContent({ modalType }: { modalType: string; }) {
    if (modalType === "inventory") {
        return (
            <div className="space-y-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b-2 border-slate-200 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-3">SKU</th>
                                <th className="px-4 py-3">Item Name</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Quantity</th>
                                <th className="px-4 py-3">Value</th>
                                <th className="px-4 py-3">Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockInventoryData.map((item) => (
                                <tr key={item.sku} className="border-b border-slate-100 transition hover:bg-amber-50">
                                    <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                                    <td className="px-4 py-3 font-semibold">{item.name}</td>
                                    <td className="px-4 py-3">{item.category}</td>
                                    <td className="px-4 py-3">{item.qty}</td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">{item.value}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{item.location}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (modalType === "create_po") {
        return (
            <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Supplier Name</label>
                        <input type="text" placeholder="Select supplier" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">PO Date</label>
                        <input type="date" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Item/Spare</label>
                        <input type="text" placeholder="Search item" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Quantity</label>
                        <input type="number" placeholder="0" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100" />
                    </div>
                </div>
                <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl">
                    Create Purchase Order
                </button>
            </form>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-4xl">🏗️</div>
            <p className="text-lg font-semibold text-slate-900">Feature Under Construction</p>
            <p className="mt-2 text-sm text-slate-500">This module will be available soon with full manufacturing data integration.</p>
        </div>
    );
}

function getModalTitle(modalType: string): string {
    const titles: Record<string, string> = {
        inventory: "Inventory Overview",
        spare_parts: "Spare Parts Management",
        purchase_orders: "Purchase Orders",
        grn: "Goods Receipt Note (GRN)",
        stock_issue: "Stock Issue",
        returns: "Returns & Replacement",
        warehouse_transfer: "Warehouse Transfer",
        stock_alerts: "Stock Alerts",
        create_po: "Create Purchase Order",
        record_grn: "Record GRN Entry",
        issue_spare: "Issue Spare Part",
        return_entry: "Return Entry",
        add_item: "Add New Inventory Item",
    };
    return titles[modalType] || "Details";
}
