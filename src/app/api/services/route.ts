import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { Service, ServiceInput } from "@/server/db/schema";

// GET - Fetch all services
export async function GET() {
  try {
    const db = getDb();
    const servicesRef = collection(db, "services");
    const q = query(servicesRef, orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    
    const services = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }) as Service[];

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

// POST - Create a new service
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, features, iconColor, iconPath, isActive = true, order = 0 } = body as ServiceInput;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (!features || !Array.isArray(features) || features.length === 0) {
      return NextResponse.json({ error: "At least one feature is required" }, { status: 400 });
    }
    if (!iconColor || iconColor.trim().length === 0) {
      return NextResponse.json({ error: "Icon color is required" }, { status: 400 });
    }
    if (!iconPath || iconPath.trim().length === 0) {
      return NextResponse.json({ error: "Icon path is required" }, { status: 400 });
    }

    const db = getDb();
    const servicesRef = collection(db, "services");
    
    const newService = {
      title: title.trim(),
      description: description.trim(),
      features: features.map(f => f.trim()).filter(f => f.length > 0),
      iconColor: iconColor.trim(),
      iconPath: iconPath.trim(),
      isActive: Boolean(isActive),
      order: Number(order) || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(servicesRef, newService);
    
    return NextResponse.json({ 
      id: docRef.id, 
      ...newService 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}

// PUT - Update a service
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, description, features, iconColor, iconPath, isActive, order } = body;

    if (!id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const db = getDb();
    const serviceRef = doc(db, "services", id);
    
    const updateData: Partial<ServiceInput> & { updatedAt: Date } = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (features !== undefined) updateData.features = features.map((f: string) => f.trim()).filter((f: string) => f.length > 0);
    if (iconColor !== undefined) updateData.iconColor = iconColor.trim();
    if (iconPath !== undefined) updateData.iconPath = iconPath.trim();
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (order !== undefined) updateData.order = Number(order) || 0;

    await updateDoc(serviceRef, updateData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

// DELETE - Delete a service
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const db = getDb();
    const serviceRef = doc(db, "services", id);
    await deleteDoc(serviceRef);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
