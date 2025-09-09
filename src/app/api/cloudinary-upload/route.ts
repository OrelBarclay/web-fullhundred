import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || "portfolio";
    
    if (!file) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }

    // Convert file to base64 for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    const cld = getCloudinary();
    const result = await cld.uploader.upload(dataURI, {
      folder,
      resource_type: "auto",
      overwrite: true,
    });

    return NextResponse.json({ 
      secure_url: result.secure_url, 
      public_id: result.public_id,
      url: result.secure_url // For backward compatibility
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ 
      error: "Cloudinary upload failed", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
