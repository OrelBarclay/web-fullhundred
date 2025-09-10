import { NextResponse } from "next/server";

// We'll use the REST API approach to interact with Firestore
// This bypasses the SDK issues and works reliably

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

// Firestore REST API helper
async function addDocumentToFirestore(collection: string, document: Lead): Promise<string> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  if (!projectId || !apiKey) {
    throw new Error("Firebase configuration missing");
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
  
  // Convert the document to Firestore format
  const firestoreDoc: { fields: Record<string, { stringValue?: string; booleanValue?: boolean; timestampValue?: string }> } = {
    fields: {
      name: { stringValue: document.name },
      email: { stringValue: document.email },
      projectType: { stringValue: document.projectType },
      description: { stringValue: document.description },
      createdAt: { timestampValue: document.createdAt.toISOString() },
      customQuote: { booleanValue: document.customQuote }
    }
  };

  // Add optional fields
  if (document.phone) {
    firestoreDoc.fields.phone = { stringValue: document.phone };
  }
  if (document.budget) {
    firestoreDoc.fields.budget = { stringValue: document.budget };
  }
  if (document.timeline) {
    firestoreDoc.fields.timeline = { stringValue: document.timeline };
  }
  if (document.projectSize) {
    firestoreDoc.fields.projectSize = { stringValue: document.projectSize };
  }
  if (document.timestamp) {
    firestoreDoc.fields.timestamp = { stringValue: document.timestamp };
  }
  if (document.estimate) {
    firestoreDoc.fields.estimate = { stringValue: JSON.stringify(document.estimate) };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(firestoreDoc)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Firestore API error:', errorText);
    throw new Error(`Firestore API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  // Extract document ID from the response
  const docId = result.name.split('/').pop();
  return docId;
}

export async function POST(request: Request) {
  try {
    console.log("Leads Firestore API called");
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

    console.log("Validation passed, proceeding with Firestore operation");
    
    const now = new Date();
    
    const leadData: Lead = {
      id: '', // Will be set by Firestore
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

    // Save to Firestore using REST API
    const docId = await addDocumentToFirestore('leads', leadData);
    
    console.log("Lead saved successfully to Firestore with ID:", docId);

    return NextResponse.json({ 
      ...leadData, 
      id: docId 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ 
      error: "Failed to create lead",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
