import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";

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

// Read leads from Firestore
async function readLeads(): Promise<Lead[]> {
  try {
    const db = getDb();
    const leadsRef = collection(db, 'leads');
    const q = query(leadsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const leads: Lead[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      leads.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastContacted: data.lastContacted?.toDate() || undefined
      } as Lead);
    });
    
    return leads;
  } catch (error) {
    console.error('Error reading leads from Firestore:', error);
    return [];
  }
}

// Add lead to Firestore
async function addLead(leadData: Omit<Lead, 'id'>): Promise<string> {
  try {
    const db = getDb();
    const leadsRef = collection(db, 'leads');
    const docRef = await addDoc(leadsRef, {
      ...leadData,
      createdAt: leadData.createdAt || new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding lead to Firestore:', error);
    throw error;
  }
}

// Update lead in Firestore
async function updateLead(leadId: string, updates: Partial<Lead>): Promise<void> {
  try {
    const db = getDb();
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, updates);
  } catch (error) {
    console.error('Error updating lead in Firestore:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const leads = await readLeads();
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error reading leads:", error);
    return NextResponse.json({ error: "Failed to read leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.email || body.email.trim().length === 0) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!body.projectType || body.projectType.trim().length === 0) {
      return NextResponse.json({ error: "Project type is required" }, { status: 400 });
    }
    if (!body.projectDetails || body.projectDetails.trim().length === 0) {
      return NextResponse.json({ error: "Project details are required" }, { status: 400 });
    }
    
    const now = new Date();
    
    const leadData: Omit<Lead, 'id'> = {
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

    // Add lead to Firestore
    const leadId = await addLead(leadData);

    return NextResponse.json({ id: leadId, ...leadData }, { status: 201 });
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

    // Prepare update data
    const updateData: Partial<Lead> = {};
    if (status !== undefined) {
      updateData.status = status;
    }
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    if (status === 'contacted') {
      updateData.lastContacted = new Date();
    }

    // Update lead in Firestore
    await updateLead(id, updateData);
    
    return NextResponse.json({ id, ...updateData });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}