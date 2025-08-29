import { NextRequest, NextResponse } from "next/server";
import { invoiceService } from "@/server/db";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  try {
    // Get all invoices and filter by projectId on the client side for now
    // In a production app, you'd want to add a getByProject method to the service
    const allInvoices = await invoiceService.getAll();
    const projectInvoices = allInvoices.filter(invoice => invoice.projectId === projectId);
    return NextResponse.json(projectInvoices);
  } catch (_e) {
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.projectId || typeof body?.amount !== 'number') {
      return NextResponse.json({ error: "projectId and amount required" }, { status: 400 });
    }
    const created = await invoiceService.create({
      projectId: body.projectId,
      clientId: body.clientId || '',
      amount: body.amount,
      description: body.description || 'Invoice',
      status: body.status ?? 'draft',
      dueDate: body.dueDate ? new Date(body.dueDate) : new Date(),
    });
    return NextResponse.json(created, { status: 201 });
  } catch (_e) {
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
