import { NextResponse, NextRequest } from "next/server";
import { projectService } from "@/server/db";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const project = await projectService.getById(id);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (_err) {
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}
