"use client";



import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { useRouter } from "next/navigation";

import { useCallback, useEffect, useMemo, useState } from "react";
const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() ?? "admin@qube.com";

const CATEGORY_OPTIONS = [

  "Sortex machine",

  "Rice Sorting",

  "Sorting Machine",

  "Coffee Bean Sorting Machine",

  "Grain Color Sorter",

  "Optical Sorting Machine",

  "Gram Sorting Machine",

  "Rice Color Sorter Machine",

  "Wheat Sorting Machine",

  "Dehydrated Onion Sorting Machine",

  "Cashew Sorting Machine",

  "Millet Sorting Machine",

  "Tea Sorter Machine",

  "Multi Grain Color Sorter",

  "Groundnut Sorting Machine",

  "Plastic Color Sorter",

  "Color Sorting Equipment",

  "New Iterms",

];



const SIDEBAR_LINKS = [

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



type ProductRow = {

  id: string;

  model_no: string;

  product_name: string;

  category: string | null;

  price: number | string | null;

  status: string | null;

};



export default function ProductListPage() {

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/image.png");

  const [products, setProducts] = useState<ProductRow[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  const [formStatus, setFormStatus] = useState<string | null>(null);

  const [formData, setFormData] = useState({

    model_no: "",

    product_name: "",

    category: "",

    price: "",

    status: "Active",

  });

  const [categoryOpen, setCategoryOpen] = useState(false);

  const [filters, setFilters] = useState({

    category: "",

    status: "",

    model: "",

  });

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = filters.category
        ? (product.category ?? "").toLowerCase() === filters.category.toLowerCase()
        : true;
      const matchesStatus = filters.status
        ? (product.status ?? "").toLowerCase() === filters.status.toLowerCase()
        : true;
      const matchesModel = filters.model
        ? (product.model_no ?? "").toLowerCase().includes(filters.model.toLowerCase().trim())
        : true;
      return matchesCategory && matchesStatus && matchesModel;
    });
  }, [filters.category, filters.model, filters.status, products]);
  const fetchProducts = useCallback(async () => {

    setIsLoading(true);

    try {

      const response = await fetch("/api/products", { cache: "no-store" });

      if (!response.ok) {

        throw new Error("Unable to fetch products");

      }

      const payload = (await response.json()) as { products: ProductRow[] };

      setProducts(payload.products ?? []);

    } catch {

      setProducts([]);

    } finally {

      setIsLoading(false);

    }

  }, []);



  const handleExportPdf = async () => {
    setExportError(null);
    setExporting(true);

    const timestamp = new Date();
    const fileStamp = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, "0")}-${String(
      timestamp.getDate(),
    ).padStart(2, "0")}_${String(timestamp.getHours()).padStart(2, "0")}-${String(timestamp.getMinutes()).padStart(
      2,
      "0",
    )}`;

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 14;
      const marginY = 16;
      const lineHeight = 6;
      const rowGap = 4;

      const columns = [
        { label: "Model No.", width: 28 },
        { label: "Product Name", width: 64 },
        { label: "Category", width: 40 },
        { label: "Price", width: 25 },
        { label: "Status", width: 25 },
      ] as const;

      const subtitle = `Exported: ${timestamp.toLocaleString()}`;
      let cursorY = marginY;

      const renderHeader = (suffix = "") => {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const title = `Product List${suffix ? ` ${suffix}` : ""}`;
        doc.text(title, marginX, cursorY);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(subtitle, marginX, cursorY + 6);
        cursorY += 14;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        let x = marginX;
        columns.forEach((col) => {
          doc.text(col.label, x, cursorY);
          x += col.width;
        });
        doc.line(marginX, cursorY + 2, pageWidth - marginX, cursorY + 2);
        cursorY += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
      };

      const ensureSpace = (heightNeeded: number) => {
        if (cursorY + heightNeeded > pageHeight - marginY) {
          doc.addPage();
          cursorY = marginY;
          renderHeader("(cont.)");
        }
      };

      renderHeader();

      if (!filteredProducts.length) {
        ensureSpace(lineHeight);
        doc.text("No products available for the current filters.", marginX, cursorY);
        doc.save(`product-list-${fileStamp}.pdf`);
        return;
      }

      filteredProducts.forEach((product) => {
        const cellTexts = [
          product.model_no || "-",
          product.product_name || "-",
          product.category || "-",
          product.price !== null && product.price !== undefined && product.price !== "" ? String(product.price) : "-",
          product.status || "-",
        ];

        const wrappedCells = cellTexts.map((text, index) => doc.splitTextToSize(text, columns[index].width - 2));

        const rowHeight =
          Math.max(...wrappedCells.map((lines) => (lines.length > 0 ? lines.length : 1))) * lineHeight + rowGap;

        ensureSpace(rowHeight);

        let x = marginX;

        wrappedCells.forEach((lines, index) => {
          lines.forEach((line, lineIndex) => {
            doc.text(line, x, cursorY + lineIndex * lineHeight);
          });

          x += columns[index].width;
        });

        cursorY += rowHeight;
      });

      doc.save(`product-list-${fileStamp}.pdf`);
    } catch (error) {
      console.error("PDF export failed", error);
      setExportError("Unable to export products right now. Please try again.");
    } finally {
      setExporting(false);
    }
  };



  useEffect(() => {

    let active = true;

    supabase.auth.getSession().then(({ data }) => {

      if (!active) return;

      const user = data.session?.user;

      if (!user) {

        router.replace("/login");

        return;

      }

      const role =

        (user.user_metadata?.role as string | undefined)?.toLowerCase() ?? "";

      const allowed =

        user.email?.toLowerCase() === SUPER_ADMIN_EMAIL || role === "super_admin";

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



  useEffect(() => {

    if (!isAuthorized) return;

    void fetchProducts();

  }, [fetchProducts, isAuthorized]);



  const updateField = (field: string, value: string) => {

    setFormData((prev) => ({ ...prev, [field]: value }));

  };



  const handleSave = async () => {

    if (!formData.model_no || !formData.product_name) {

      setFormStatus("Model no. and Product Name are required.");

      return;

    }

    setSaving(true);

    setFormStatus(null);

    try {

      const response = await fetch("/api/products", {

        method: editId ? "PUT" : "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          id: editId ?? undefined,

          model_no: formData.model_no.trim(),

          product_name: formData.product_name.trim(),

          category: formData.category.trim() || null,

          price: formData.price ? Number(formData.price) : null,

          status: formData.status || "Active",

        }),

      });

      if (!response.ok) {

        const payload = (await response.json()) as { message: string };

        throw new Error(payload.message ?? "Unable to save product");

      }

      setFormOpen(false);

      setEditId(null);

      setFormData({

        model_no: "",

        product_name: "",

        category: "",

        price: "",

        status: "Active",

      });

      await fetchProducts();

    } catch (error) {

      const message = error instanceof Error ? error.message : "Unable to save product";

      setFormStatus(message);

    } finally {

      setSaving(false);

    }

  };



  if (isAuthorized === null) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">

        Checking access...

      </div>

    );

  }



  if (!isAuthorized) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200">

          <p className="text-sm uppercase tracking-[0.4em] text-rose-400">Restricted</p>

          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Admin access required</h1>

          <p className="mt-4 text-sm text-slate-600">

            Only super admins can view the Product Master.

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

    <>

      <div className="flex min-h-screen bg-slate-50">

        <aside
          className={`relative flex ${collapsed ? "w-24" : "w-72"} flex-col border-r border-slate-200 bg-white/95 px-6 pb-6 pt-14 transition-all`}
        >

          <button

            aria-label="Toggle sidebar"

            onClick={() => setCollapsed((prev) => !prev)}

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
              alt="Color Sort 360 logo"
              className={`object-contain ${collapsed ? "h-14 w-14" : "h-20 w-20"}`}
            />
          </div>



          <nav className="flex flex-col gap-1 text-sm font-medium text-slate-600">

            {SIDEBAR_LINKS.map((link) => (

              <button

                key={link.label}

                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-slate-100 ${link.href === "/product-list" ? "bg-indigo-50 text-indigo-600" : ""
                  }`}

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

              <svg

                viewBox="0 0 24 24"

                className="h-4 w-4"

                fill="none"

                stroke="currentColor"

                strokeWidth="1.8"

                strokeLinecap="round"

              >

                <path d="M3 5h8m0 0v14m0-14 6 6m-6 8 6-6" />

              </svg>

            </span>

            {!collapsed && <span>Logout</span>}

          </button>

        </aside>



        <main className="flex-1 px-6 py-10">

          <div className="mx-auto max-w-6xl space-y-6">

            <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex flex-1 flex-wrap items-center gap-3">

                <button

                  onClick={() => router.back()}

                  className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-500"

                >

                  {"<"} Back

                </button>

                <div>

                  <p className="text-sm uppercase tracking-[0.35em] text-indigo-400">

                    Product Master (Admin Only)

                  </p>

                  <h1 className="mt-1 text-3xl font-semibold text-slate-900">Manage products</h1>

                </div>

              </div>

              <div className="flex flex-wrap gap-3">

                <button

                  className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-500"

                  onClick={() => {

                    setFormStatus(null);

                    setEditId(null);

                    setFormData({

                      model_no: "",

                      product_name: "",

                      category: "",

                      price: "",

                      status: "Active",

                    });

                    setFormOpen(true);

                  }}

                >

                  + Add Product

                </button>

                <button className="rounded-2xl border border-sky-700 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:bg-sky-500">
                  Upload Bulk
                </button>

                <button
                  className="rounded-2xl border border-emerald-700 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={handleExportPdf}
                  disabled={exporting || isLoading}
                >
                  {exporting ? "Exporting..." : "Export PDF"}
                </button>

              </div>

            </header>



            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <FilterField label="Category">

                  <select

                    value={filters.category}

                    onChange={(event) =>

                      setFilters((prev) => ({ ...prev, category: event.target.value }))

                    }

                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"

                  >

                    <option value="">All categories</option>

                    {CATEGORY_OPTIONS.map((option) => (

                      <option key={option} value={option}>

                        {option}

                      </option>

                    ))}

                  </select>

                </FilterField>

                <FilterField label="Active/Inactive">

                  <select

                    value={filters.status}

                    onChange={(event) =>

                      setFilters((prev) => ({ ...prev, status: event.target.value }))

                    }

                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"

                  >

                    <option value="">Any status</option>

                    <option value="Active">Active</option>

                    <option value="Inactive">Inactive</option>

                  </select>

                </FilterField>

                <FilterField label="Model No.">

                  <input

                    type="text"

                    value={filters.model}

                    placeholder="Search model"

                    onChange={(event) =>

                      setFilters((prev) => ({ ...prev, model: event.target.value }))

                    }

                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"

                  />

                </FilterField>

              </div>

            </section>



            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-600">

                <span>Product Table</span>
                <span className="text-xs text-slate-400">
                  {isLoading ? "Loading..." : `Showing ${filteredProducts.length} items`}
                </span>

              </div>
              {exportError && (
                <p className="mb-4 text-sm font-semibold text-rose-500">{exportError}</p>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-100">

                <table className="min-w-full divide-y divide-slate-100 text-sm">

                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <tr>

                      <th className="px-4 py-3">Model no.</th>

                      <th className="px-4 py-3">Product Name</th>

                      <th className="px-4 py-3">Category</th>

                      <th className="px-4 py-3">Price</th>

                      <th className="px-4 py-3">Status</th>

                      <th className="px-4 py-3 text-right">Actions</th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">

                    {(filteredProducts ?? []).map((product) => (
                      <tr key={product.id ?? product.model_no} className="hover:bg-slate-50">

                        <td className="px-4 py-3 font-semibold text-slate-900">{product.model_no}</td>

                        <td className="px-4 py-3 text-slate-700">{product.product_name}</td>

                        <td className="px-4 py-3 text-slate-700">{product.category ?? "-"}</td>
                        <td className="px-4 py-3 text-slate-700">{product.price ?? "-"}</td>

                        <td className="px-4 py-3">

                          <span

                            className={`rounded-full px-3 py-1 text-xs font-semibold ${(product.status ?? "").toLowerCase() === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-600"

                              }`}

                          >

                            {product.status ?? "Inactive"}

                          </span>

                        </td>

                        <td className="px-4 py-3 text-right">

                          <button

                            className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"

                            onClick={() => {

                              setFormStatus(null);

                              setEditId(product.id ?? null);

                              setFormData({

                                model_no: product.model_no ?? "",
                                product_name: product.product_name ?? "",
                                category: product.category ?? "",

                                price: product.price?.toString() ?? "",

                                status: product.status ?? "Active",

                              });

                              setFormOpen(true);

                            }}

                          >

                            Edit

                          </button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </section>

          </div>

        </main>

      </div>



      {formOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">

          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs uppercase tracking-[0.35em] text-indigo-400">Add Product</p>

                <h2 className="text-2xl font-semibold text-slate-900">Enter product details</h2>

              </div>

              <button

                onClick={() => {

                  setFormOpen(false);

                  setEditId(null);

                  setFormStatus(null);

                }}

                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"

              >

                x

              </button>

            </div>



            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <Field

                label="Model no."

                required

                value={formData.model_no}

                onChange={(value) => updateField("model_no", value)}

              />

              <Field

                label="Product Name"

                required

                value={formData.product_name}

                onChange={(value) => updateField("product_name", value)}

              />

              <div className="text-sm font-semibold text-slate-600">

                <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">

                  Category

                </span>

                <div className="relative">

                  <button

                    type="button"

                    onClick={() => setCategoryOpen((prev) => !prev)}

                    onBlur={() => setTimeout(() => setCategoryOpen(false), 100)}

                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"

                  >

                    <span className={formData.category ? "" : "opacity-60"}>

                      {formData.category || "Select category"}

                    </span>

                    <svg

                      className={`h-4 w-4 text-slate-500 transition ${categoryOpen ? "rotate-180" : ""}`}

                      viewBox="0 0 20 20"

                      fill="none"

                      stroke="currentColor"

                      strokeWidth="1.8"

                      strokeLinecap="round"

                      strokeLinejoin="round"

                    >

                      <path d="M5 7l5 5 5-5" />

                    </svg>

                  </button>

                  {categoryOpen && (

                    <div className="absolute z-30 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">

                      <ul className="py-1 text-sm text-slate-700">

                        <li>

                          <button

                            type="button"

                            className="block w-full px-4 py-2 text-left hover:bg-slate-50"

                            onMouseDown={(e) => e.preventDefault()}

                            onClick={() => {

                              updateField("category", "");

                              setCategoryOpen(false);

                            }}

                          >

                            Select category

                          </button>

                        </li>

                        {CATEGORY_OPTIONS.map((option) => (

                          <li key={option}>

                            <button

                              type="button"

                              className="block w-full px-4 py-2 text-left hover:bg-slate-50"

                              onMouseDown={(e) => e.preventDefault()}

                              onClick={() => {

                                updateField("category", option);

                                setCategoryOpen(false);

                              }}

                            >

                              {option}

                            </button>

                          </li>

                        ))}

                      </ul>

                    </div>

                  )}

                </div>

              </div>

              <Field

                label="Price"

                type="number"

                inputMode="decimal"

                step="any"

                prefix={"\u20B9"}

                value={formData.price}

                onChange={(value) => updateField("price", value)}

              />

              <label className="text-sm font-semibold text-slate-600">

                <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">

                  Status

                </span>

                <select

                  value={formData.status}

                  onChange={(event) => updateField("status", event.target.value)}

                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"

                >

                  <option>Active</option>

                  <option>Inactive</option>

                </select>

              </label>

            </div>



            {formStatus && <p className="mt-4 text-sm font-semibold text-rose-500">{formStatus}</p>}



            <div className="mt-6 flex justify-end gap-3">

              <button

                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"

                onClick={() => {

                  setFormOpen(false);

                  setEditId(null);

                  setFormStatus(null);

                }}

                disabled={saving}

              >

                Cancel

              </button>

              <button

                className="rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"

                onClick={handleSave}

                disabled={saving}

              >

                {saving ? "Saving..." : "Save"}

              </button>

            </div>

          </div>

        </div>

      )}

    </>

  );

}



function FilterField({ label, children }: { label: string; children: React.ReactNode }) {

  return (

    <label className="text-sm font-semibold text-slate-600">

      <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">{label}</span>

      {children}

    </label>

  );

}



function Field({

  label,

  value,

  onChange,

  required = false,

  type = "text",

  inputMode,

  step,

  prefix,

}: {

  label: string;

  value: string;

  onChange: (value: string) => void;

  required?: boolean;

  type?: string;

  inputMode?: string;

  step?: string;

  prefix?: string;

}) {

  return (

    <label className="text-sm font-semibold text-slate-600">

      <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">

        {label} {required ? "*" : ""}

      </span>

      <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner shadow-slate-100 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">

        {prefix ? (

          <span className="flex items-center px-3 text-sm font-semibold text-slate-500">{prefix}</span>

        ) : null}

        <input

          type={type}

          value={value}

          onChange={(event) => onChange(event.target.value)}

          inputMode={inputMode as "search" | "url" | "none" | "numeric" | "text" | "email" | "tel" | "decimal" | undefined}

          step={step}

          className="w-full bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none"

          required={required}

        />

      </div>

    </label>

  );

}



