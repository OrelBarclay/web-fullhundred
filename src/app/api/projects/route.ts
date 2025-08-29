import { NextResponse } from "next/server";
import { projectService } from "@/server/db";
import type { ProjectInput } from "@/server/validation";

export async function GET() {
  try {
    const projects = await projectService.getAll();
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: ProjectInput = await request.json();
    
    // Basic validation
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!body.clientId || body.clientId.trim().length === 0) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const created = await projectService.create({
      clientId: body.clientId.trim(),
      title: body.title.trim(),
      description: body.description?.trim() || null,
      status: body.status || "planning",
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
