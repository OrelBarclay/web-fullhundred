import { NextResponse } from "next/server";
import { leadService } from "@/server/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.email || body.email.trim().length === 0) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!body.projectType || body.projectType.trim().length === 0) {
      return NextResponse.json({ error: "Project type is required" }, { status: 400 });
    }
    if (!body.description || body.description.trim().length === 0) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const created = await leadService.create({
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || undefined,
      projectType: body.projectType.trim(),
      description: body.description.trim(),
      budget: body.budget,
      timeline: body.timeline,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
