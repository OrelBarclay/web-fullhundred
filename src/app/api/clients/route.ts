import { NextResponse } from "next/server";
import { clientService } from "@/server/db";
import type { ClientInput } from "@/server/validation";

export async function GET() {
  try {
    const clients = await clientService.getAll();
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: ClientInput = await request.json();
    
    // Basic validation
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const created = await clientService.create({
      name: body.name.trim(),
      email: body.email?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
