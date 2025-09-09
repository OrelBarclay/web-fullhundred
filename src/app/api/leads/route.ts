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
    if (!body.projectDetails || body.projectDetails.trim().length === 0) {
      return NextResponse.json({ error: "Project details are required" }, { status: 400 });
    }

    const created = await leadService.create({
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || undefined,
      projectType: body.projectType.trim(),
      description: body.projectDetails.trim(),
      budget: body.budget,
      timeline: body.timeline,
      // Additional quote-specific fields
      projectSize: body.projectSize,
      customQuote: body.customQuote || false,
      estimate: body.estimate,
      timestamp: body.timestamp
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
