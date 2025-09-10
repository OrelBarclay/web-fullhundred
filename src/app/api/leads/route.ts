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