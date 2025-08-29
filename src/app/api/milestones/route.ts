import { NextRequest, NextResponse } from "next/server";
import { milestoneService } from "@/server/db";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  try {
    // Get all milestones and filter by projectId on the client side for now
    // In a production app, you'd want to add a getByProject method to the service
    const allMilestones = await milestoneService.getAll();
    const projectMilestones = allMilestones.filter(milestone => milestone.projectId === projectId);
    return NextResponse.json(projectMilestones);
  } catch (_e) {
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.projectId || !body?.title || !body?.description || !body?.dueDate) {
      return NextResponse.json({ error: "projectId, title, description, and dueDate required" }, { status: 400 });
    }
    const created = await milestoneService.create({
      projectId: body.projectId,
      title: body.title,
      description: body.description,
      dueDate: new Date(body.dueDate),
    });
    return NextResponse.json(created, { status: 201 });
  } catch (_e) {
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
  }
}
