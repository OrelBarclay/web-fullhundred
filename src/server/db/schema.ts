

// Firebase Firestore data structures
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  clientId: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  beforeImages?: string[];
  afterImages?: string[];
  beforeVideos?: string[];
  afterVideos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Media {
  id: string;
  projectId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  order: number;
  createdAt: Date;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  description: string;
  budget?: string;
  timeline?: string;
  createdAt: Date;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  projectId: string;
  clientId: string;
  amount: number;
  description: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

// Input types for creating/updating
export interface ClientInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ProjectInput {
  title: string;
  description: string;
  clientId: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  startDate?: Date;
  endDate?: Date;
  budget?: number;
}

export interface MediaInput {
  projectId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  order: number;
}

export interface LeadInput {
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  description: string;
  budget?: string;
  timeline?: string;
}

export interface MilestoneInput {
  projectId: string;
  title: string;
  description: string;
  dueDate: Date;
}

export interface InvoiceInput {
  projectId: string;
  clientId: string;
  amount: number;
  description: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date;
}

export interface UserInput {
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
}


