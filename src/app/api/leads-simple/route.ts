import { NextResponse } from "next/server";

// Simple in-memory storage for leads (for testing purposes)
// In production, you would want to use a proper database
interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  description: string;
  budget?: string;
  timeline?: string;
  projectSize?: string;
  customQuote: boolean;
  estimate?: unknown;
  timestamp?: string;
  createdAt: Date;
}

const leads: Lead[] = [];

export async function POST(request: Request) {
  try {
    console.log("Leads simple API called");
    const body = await request.json();
    console.log("Request body:", body);
    
    // Basic validation
    if (!body.name || body.name.trim().length === 0) {
      console.log("Validation failed: Name is required");
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.email || body.email.trim().length === 0) {
      console.log("Validation failed: Email is required");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!body.projectType || body.projectType.trim().length === 0) {
      console.log("Validation failed: Project type is required");
      return NextResponse.json({ error: "Project type is required" }, { status: 400 });
    }
    if (!body.projectDetails || body.projectDetails.trim().length === 0) {
      console.log("Validation failed: Project details are required");
      return NextResponse.json({ error: "Project details are required" }, { status: 400 });
    }

    console.log("Validation passed, proceeding with storage operation");
    
    const now = new Date();
    
    const leadData = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      timestamp: body.timestamp,
      createdAt: now
    };

    console.log("Lead data to be saved:", leadData);

    // Store in memory (in production, this would be a database)
    leads.push(leadData);
    console.log("Lead saved successfully with ID:", leadData.id);
    console.log("Total leads stored:", leads.length);

    return NextResponse.json(leadData, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ 
      error: "Failed to create lead",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// GET endpoint to retrieve leads (for testing)
export async function GET() {
  return NextResponse.json(leads);
}
