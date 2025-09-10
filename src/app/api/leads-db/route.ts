import { NextResponse } from "next/server";

// We'll use a different approach - save to a JSON file or use a simple database
// For now, let's create a file-based storage solution
import { writeFile, readFile, mkdir } from 'fs/promises';
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
    return JSON.parse(data);
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

export async function POST(request: Request) {
  try {
    console.log("Leads DB API called");
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
      createdAt: now
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

// GET endpoint to retrieve leads
export async function GET() {
  try {
    const leads = await readLeads();
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error reading leads:", error);
    return NextResponse.json({ error: "Failed to read leads" }, { status: 500 });
  }
}
