import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileUrl, folder = "portfolio", publicId } = body || {};
    if (!fileUrl) return NextResponse.json({ error: "fileUrl required" }, { status: 400 });

    const cld = getCloudinary();
    const result = await cld.uploader.upload(fileUrl, {
      folder,
      public_id: publicId,
      overwrite: true,
      resource_type: "auto",
    });

    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch (e) {
    return NextResponse.json({ error: "Cloudinary upload failed" }, { status: 500 });
  }
}
