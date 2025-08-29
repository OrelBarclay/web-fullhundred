import { NextRequest, NextResponse } from "next/server";
import { milestoneService } from "@/server/db";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  try {
    const items = await milestoneService.getByProject(projectId);
    return NextResponse.json(items);
  } catch (_e) {
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.projectId || !body?.title) {
      return NextResponse.json({ error: "projectId and title required" }, { status: 400 });
    }
    const created = await milestoneService.create({
      projectId: body.projectId,
      title: body.title,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (_e) {
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
  }
}
