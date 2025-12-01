"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

type SidebarLink = {
  label: string;
  href: string;
  icon: ReactElement;
};

const baseLinks: SidebarLink[] = [
  {
    label: "Dashboard Overview",
    href: "/dashboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M4 13h6V4H4v9Zm10 7h6v-8h-6v8ZM4 20h6v-5H4v5ZM14 4v5h6V4h-6Z" />
      </svg>
    ),
  },
  {
    label: "User Creation",
    href: "/user-creation",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-9 13v-1a5 5 0 0 1 5-5h2" />
        <path d="M16 17h6m-3-3v6" />
      </svg>
    ),
  },
  {
    label: "Product List",
    href: "/product-list",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />
      </svg>
    ),
  },
  {
    label: "Stock Insights",
    href: "#",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="m4 15 4-4 4 4 6-6" />
        <path d="M18 9h4v4" />
      </svg>
    ),
  },
  {
    label: "Client Registry",
    href: "#",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-4 7c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
      </svg>
    ),
  },
  {
    label: "Lead Management",
    href: "/lead-management",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M5 5h9l5 5v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        <path d="M14 5v5h5" />
        <path d="M9 14h6" />
        <path d="M9 18h3" />
      </svg>
    ),
  },
  {
    label: "Customer & Vendor Management",
    href: "/customer-vendor-management",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M6 9a3 3 0 1 1 6 0" />
        <path d="M16 9a3 3 0 1 1 6 0" />
        <path d="M2 20a6 6 0 0 1 12 0" />
        <path d="M14 20a6 6 0 0 1 10 0" />
        <path d="M12 14h4" />
      </svg>
    ),
  },
  {
    label: "Reports & Exports",
    href: "#",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M7 4h10l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M7 10h10M7 14h6" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/admin-settings",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="m4 6 2-2 2 2h8l2-2 2 2-2 2 2 2-2 2 2 2-2 2-2-2h-8l-2 2-2-2 2-2-2-2 2-2-2-2Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
  },
];

export type DashboardSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  companyLogo?: string;
  onLogout: () => void;
  isSigningOut?: boolean;
  activeHref?: string;
  showSettings?: boolean;
  showUserCreation?: boolean;
  showLeadManagement?: boolean;
  showCustomerVendorManagement?: boolean;
};

export function DashboardSidebar({
  collapsed,
  onToggle,
  companyLogo = "/image.png",
  onLogout,
  isSigningOut = false,
  activeHref = "/dashboard",
  showSettings = false,
  showUserCreation = false,
  showLeadManagement = true,
  showCustomerVendorManagement = false,
}: DashboardSidebarProps) {
  const router = useRouter();

  const links = baseLinks.filter((link) => {
    if (link.label === "Settings") return showSettings;
    if (link.label === "User Creation") return showUserCreation;
    if (link.label === "Lead Management") return showLeadManagement;
    if (link.label === "Customer & Vendor Management") {
      return showCustomerVendorManagement;
    }
    return true;
  });

  return (
    <aside
      className={`relative flex ${
        collapsed ? "w-24" : "w-72"
      } flex-col border-r border-slate-200 bg-white/95 px-6 pb-6 pt-14 transition-all`}
    >
      <button
        aria-label="Toggle sidebar"
        onClick={onToggle}
        className="absolute right-3 top-3 rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:text-indigo-500"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M4 6h16M8 12h12M4 18h16" />
        </svg>
      </button>

      <div className="flex items-center justify-center pb-6">
        <img
          src={companyLogo}
          alt="Colorsort360 logo"
          className={`object-contain ${collapsed ? "h-14 w-14" : "h-20 w-20"}`}
        />
      </div>

      <nav className="flex flex-col gap-1 text-sm font-medium text-slate-600">
        {links.map((link) => {
          const isActive = activeHref === link.href;
          return (
            <button
              key={link.label}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-slate-100 ${
                isActive ? "bg-indigo-50 text-indigo-600" : ""
              }`}
              onClick={() => link.href !== "#" && router.push(link.href)}
            >
              <span className="text-slate-400">{link.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{link.label}</span>}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onLogout}
        disabled={isSigningOut}
        className="group mt-4 flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-500 shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-lg hover:shadow-rose-100 active:scale-95 disabled:opacity-70"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-500 shadow-inner">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M10 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
            <path d="m14 9 3 3-3 3" />
            <path d="M17 12H9" />
            <path d="M13 5.5v-1a2.5 2.5 0 0 1 2.5-2.5 2.5 2.5 0 0 1 2.5 2.5v1" />
            <path d="M18 5.5h-5" />
          </svg>
        </span>
        {!collapsed && <span>{isSigningOut ? "Signing out..." : "Logout"}</span>}
      </button>
    </aside>
  );
}
