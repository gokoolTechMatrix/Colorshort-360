import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

const TABLE = "product_master";

const toNumberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "string" ? Number(value.trim()) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// Ensure table exists in Supabase:
// create table if not exists public.product_master (
//   id uuid primary key default gen_random_uuid(),
//   model_no text not null,
//   product_name text not null,
//   category text,
//   price numeric,
//   status text default 'Active',
//   created_at timestamptz default now()
// );

export async function GET() {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, model_no, product_name, category, price, status")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "Unable to fetch products", products: [] },
      { status: 500 },
    );
  }

  return NextResponse.json({ products: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const model_no = (payload.model_no as string | undefined)?.trim();
    const product_name = (payload.product_name as string | undefined)?.trim();
    const category = (payload.category as string | undefined)?.trim() || null;
    const status = (payload.status as string | undefined)?.trim() || "Active";
    const price = toNumberOrNull(payload.price);

    if (!model_no || !product_name) {
      return NextResponse.json(
        { message: "Model no. and Product Name are required." },
        { status: 400 },
      );
    }

    if (price === null && payload.price) {
      return NextResponse.json(
        { message: "Price must be a valid number." },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase.from(TABLE).insert({
      model_no,
      product_name,
      category,
      price,
      status,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save product";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const id = payload.id as string | undefined;
    const model_no = (payload.model_no as string | undefined)?.trim();
    const product_name = (payload.product_name as string | undefined)?.trim();
    const category = (payload.category as string | undefined)?.trim() || null;
    const status = (payload.status as string | undefined)?.trim() || "Active";
    const price = toNumberOrNull(payload.price);

    if (!id) {
      return NextResponse.json({ message: "id is required" }, { status: 400 });
    }

    if (!model_no || !product_name) {
      return NextResponse.json(
        { message: "Model no. and Product Name are required." },
        { status: 400 },
      );
    }

    if (price === null && payload.price) {
      return NextResponse.json(
        { message: "Price must be a valid number." },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from(TABLE)
      .update({
        model_no,
        product_name,
        category,
        price,
        status,
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update product";
    return NextResponse.json({ message }, { status: 500 });
  }
}
