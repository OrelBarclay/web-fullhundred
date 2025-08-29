

// Firebase Firestore types
export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  description?: string | null;
  status: "planning" | "in_progress" | "completed" | "on_hold";
  createdAt: Date;
  updatedAt: Date;
}

export interface Media {
  id: string;
  projectId: string;
  type: "image" | "video" | "before" | "after";
  url: string;
  caption?: string | null;
  createdAt: Date;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  dueDate?: Date | null;
  completedAt?: Date | null;
}

export interface Invoice {
  id: string;
  projectId: string;
  amountCents: number;
  status: "unpaid" | "paid" | "overdue";
  issuedAt: Date;
  paidAt?: Date | null;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  projectDetails: string;
  status: "new" | "contacted" | "quoted" | "converted";
  createdAt: Date;
  updatedAt: Date;
}


