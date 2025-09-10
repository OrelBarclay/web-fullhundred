import { NextResponse } from "next/server";

// Read leads from the file-based storage
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const LEADS_FILE = join(DATA_DIR, 'leads.json');

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
  status?: 'new' | 'contacted' | 'quoted' | 'converted' | 'closed';
  adminNotes?: string;
  lastContacted?: Date;
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Read leads from file
async function readLeads(): Promise<Lead[]> {
  try {
    await ensureDataDir();
    const data = await readFile(LEADS_FILE, 'utf-8');
    const leads = JSON.parse(data);
    // Convert date strings back to Date objects
    return leads.map((lead: Lead) => ({
      ...lead,
      createdAt: new Date(lead.createdAt),
      lastContacted: lead.lastContacted ? new Date(lead.lastContacted) : undefined
    }));
  } catch (error) {
    // File doesn't exist yet, return empty array
    return [];
  }
}

// Write leads to file
async function writeLeads(leads: Lead[]): Promise<void> {
  try {
    await ensureDataDir();
    await writeFile(LEADS_FILE, JSON.stringify(leads, null, 2));
  } catch (error) {
    console.error('Error writing leads file:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const leads = await readLeads();
    // Sort by creation date (newest first)
    leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error reading leads:", error);
    return NextResponse.json({ error: "Failed to read leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log("Leads API called");
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

    console.log("Validation passed, proceeding with database operation");
    
    const now = new Date();
    
    const leadData: Lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || undefined,
      projectType: body.projectType.trim(),
      description: body.projectDetails.trim(),
      budget: body.budget,
      timeline: body.timeline,
      projectSize: body.projectSize,
      customQuote: body.customQuote || false,
      estimate: body.estimate,
      timestamp: body.timestamp,
      createdAt: now,
      status: 'new'
    };

    console.log("Lead data to be saved:", leadData);

    // Read existing leads
    const existingLeads = await readLeads();
    
    // Add new lead
    existingLeads.push(leadData);
    
    // Write back to file
    await writeLeads(existingLeads);
    
    console.log("Lead saved successfully with ID:", leadData.id);
    console.log("Total leads stored:", existingLeads.length);

    return NextResponse.json(leadData, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ 
      error: "Failed to create lead",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status, adminNotes } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const leads = await readLeads();
    const leadIndex = leads.findIndex(lead => lead.id === id);
    
    if (leadIndex === -1) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Update lead
    leads[leadIndex] = {
      ...leads[leadIndex],
      status: status || leads[leadIndex].status,
      adminNotes: adminNotes !== undefined ? adminNotes : leads[leadIndex].adminNotes,
      lastContacted: status === 'contacted' ? new Date() : leads[leadIndex].lastContacted
    };

    await writeLeads(leads);
    
    return NextResponse.json(leads[leadIndex]);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}