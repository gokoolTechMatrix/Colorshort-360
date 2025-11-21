import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

const BUCKET = "company-assets";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: "File is required." },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();
    const arrayBuffer = await file.arrayBuffer();
    const fileExtension = file.name.split(".").pop() ?? "png";
    const objectName = `logos/company-logo-${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectName, Buffer.from(arrayBuffer), {
        contentType: file.type || "image/png",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(objectName);

    if (!publicData?.publicUrl) {
      throw new Error("Unable to generate logo URL.");
    }

    return NextResponse.json({ url: publicData.publicUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload logo.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
