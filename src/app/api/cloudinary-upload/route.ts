import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
// Ensure Node.js runtime (Buffer required)
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const cld = getCloudinary();

    // Case 1: multipart/form-data with a File (preferred from client forms)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const folder = (formData.get('folder') as string) || 'portfolio';

      if (!file) {
        return NextResponse.json({ error: 'File required' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const dataURI = `data:${file.type};base64,${base64}`;

      const result = await cld.uploader.upload(dataURI, {
        folder,
        resource_type: 'auto',
        overwrite: true,
      });

      return NextResponse.json({
        secure_url: result.secure_url,
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    // Case 2: JSON body with fileUrl (useful for server actions or remote URLs)
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => null);
      const fileUrl = body?.fileUrl as string | undefined;
      const folder = (body?.folder as string) || 'portfolio';
      const publicId = body?.publicId as string | undefined;

      if (!fileUrl) {
        return NextResponse.json({ error: 'fileUrl required' }, { status: 400 });
      }

      const result = await cld.uploader.upload(fileUrl, {
        folder,
        public_id: publicId,
        resource_type: 'auto',
        overwrite: true,
      });

      return NextResponse.json({
        secure_url: result.secure_url,
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 415 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cloudinary upload error:', message);
    return NextResponse.json(
      { error: 'Cloudinary upload failed', details: message },
      { status: 500 }
    );
  }
}
