// Validation schemas for Firebase data
export interface ClientInput {
  name: string;
  email?: string;
  phone?: string;
}

export interface ProjectInput {
  clientId: string;
  title: string;
  description?: string;
  status?: "planning" | "in_progress" | "completed" | "on_hold";
}

export interface MediaInput {
  projectId: string;
  type: "image" | "video" | "before" | "after";
  url: string;
  caption?: string;
}

export interface LeadInput {
  name: string;
  email: string;
  phone?: string;
  projectDetails: string;
}
