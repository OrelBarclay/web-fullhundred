import { NextRequest, NextResponse } from "next/server";
import { invoiceService } from "@/server/db";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  try {
    const items = await invoiceService.getByProject(projectId);
    return NextResponse.json(items);
  } catch (_e) {
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.projectId || typeof body?.amountCents !== 'number') {
      return NextResponse.json({ error: "projectId and amountCents required" }, { status: 400 });
    }
    const created = await invoiceService.create({
      projectId: body.projectId,
      amountCents: body.amountCents,
      status: body.status ?? 'unpaid',
      issuedAt: body.issuedAt ? new Date(body.issuedAt) : new Date(),
      paidAt: body.paidAt ? new Date(body.paidAt) : null,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (_e) {
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
