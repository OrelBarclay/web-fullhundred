import { NextResponse } from "next/server";
import { mediaService } from "@/server/db";

export async function GET() {
  try {
    const media = await mediaService.getAll();
    return NextResponse.json(media);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.projectId || body.projectId.trim().length === 0) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }
    if (!body.type || !['image', 'video'].includes(body.type)) {
      return NextResponse.json({ error: "Type must be 'image' or 'video'" }, { status: 400 });
    }
    if (!body.url || body.url.trim().length === 0) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const created = await mediaService.create({
      projectId: body.projectId.trim(),
      type: body.type,
      url: body.url.trim(),
      thumbnailUrl: body.thumbnailUrl,
      altText: body.altText,
      order: body.order || 0,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create media" }, { status: 500 });
  }
}
