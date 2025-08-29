import { 
  collection, 
  doc as fsDoc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { Client, Project, Media, Lead, Milestone, Invoice } from './schema';

// Helper to convert Firestore timestamps to Date objects
const convertTimestamps = <T extends Record<string, unknown>>(obj: T): T => {
  const converted: Record<string, unknown> = { ...obj };
  Object.keys(converted).forEach(key => {
    const value = converted[key];
    if (value instanceof Timestamp) {
      converted[key] = value.toDate();
    }
  });
  return converted as T;
};

// Client operations
export const clientService = {
  async getAll(): Promise<Client[]> {
    const db = getDb();
    const snapshot = await getDocs(collection(db, 'clients'));
    return snapshot.docs.map(snap => ({
      id: snap.id,
      ...convertTimestamps(snap.data() as Record<string, unknown>)
    } as Client));
  },

  async getById(id: string): Promise<Client | null> {
    const db = getDb();
    const ref = fsDoc(db, 'clients', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...convertTimestamps(snap.data() as Record<string, unknown>) } as Client;
  },

  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const db = getDb();
    const now = new Date();
    const ref = await addDoc(collection(db, 'clients'), {
      ...data,
      createdAt: now,
      updatedAt: now
    });
    return { id: ref.id, ...data, createdAt: now, updatedAt: now };
  },

  async update(id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<void> {
    const db = getDb();
    const ref = fsDoc(db, 'clients', id);
    await updateDoc(ref, { ...data, updatedAt: new Date() });
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    const ref = fsDoc(db, 'clients', id);
    await deleteDoc(ref);
  }
};

// Project operations
export const projectService = {
  async getAll(): Promise<Project[]> {
    const db = getDb();
    const snapshot = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(snap => ({
      id: snap.id,
      ...convertTimestamps(snap.data() as Record<string, unknown>)
    } as Project));
  },

  async getById(id: string): Promise<Project | null> {
    const db = getDb();
    const ref = fsDoc(db, 'projects', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...convertTimestamps(snap.data() as Record<string, unknown>) } as Project;
  },

  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const db = getDb();
    const now = new Date();
    const ref = await addDoc(collection(db, 'projects'), {
      ...data,
      createdAt: now,
      updatedAt: now
    });
    return { id: ref.id, ...data, createdAt: now, updatedAt: now };
  },

  async update(id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<void> {
    const db = getDb();
    const ref = fsDoc(db, 'projects', id);
    await updateDoc(ref, { ...data, updatedAt: new Date() });
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    const ref = fsDoc(db, 'projects', id);
    await deleteDoc(ref);
  }
};

// Media operations
export const mediaService = {
  async getAll(): Promise<Media[]> {
    const db = getDb();
    const snapshot = await getDocs(collection(db, 'media'));
    return snapshot.docs.map(snap => ({
      id: snap.id,
      ...convertTimestamps(snap.data() as Record<string, unknown>)
    } as Media));
  },

  async getByProjectId(projectId: string): Promise<Media[]> {
    const db = getDb();
    const q = query(collection(db, 'media'), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(snap => ({
      id: snap.id,
      ...convertTimestamps(snap.data() as Record<string, unknown>)
    } as Media));
  },

  async create(data: Omit<Media, 'id' | 'createdAt'>): Promise<Media> {
    const db = getDb();
    const now = new Date();
    const ref = await addDoc(collection(db, 'media'), {
      ...data,
      createdAt: now
    });
    return { id: ref.id, ...data, createdAt: now };
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    const ref = fsDoc(db, 'media', id);
    await deleteDoc(ref);
  }
};

// Lead operations
export const leadService = {
  async create(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Lead> {
    const db = getDb();
    const now = new Date();
    const ref = await addDoc(collection(db, 'leads'), {
      ...data,
      status: 'new' as const,
      createdAt: now,
      updatedAt: now
    });
    return { id: ref.id, ...data, status: 'new', createdAt: now, updatedAt: now };
  },

  async getAll(): Promise<Lead[]> {
    const db = getDb();
    const snapshot = await getDocs(query(collection(db, 'leads'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(snap => ({
      id: snap.id,
      ...convertTimestamps(snap.data() as Record<string, unknown>)
    } as Lead));
  },

  async update(id: string, data: Partial<Omit<Lead, 'id' | 'createdAt'>>): Promise<void> {
    const db = getDb();
    const ref = fsDoc(db, 'leads', id);
    await updateDoc(ref, { ...data, updatedAt: new Date() });
  }
};

// Milestone operations
export const milestoneService = {
  async getByProject(projectId: string): Promise<Milestone[]> {
    const db = getDb();
    const qy = query(collection(db, 'milestones'), where('projectId', '==', projectId), orderBy('dueDate', 'asc'));
    const snapshot = await getDocs(qy);
    return snapshot.docs.map(s => ({ id: s.id, ...convertTimestamps(s.data() as Record<string, unknown>) } as Milestone));
  },
  async create(data: Omit<Milestone, 'id'>): Promise<Milestone> {
    const db = getDb();
    const ref = await addDoc(collection(db, 'milestones'), data);
    return { id: ref.id, ...data };
  },
  async update(id: string, data: Partial<Omit<Milestone, 'id'>>): Promise<void> {
    const db = getDb();
    const ref = fsDoc(db, 'milestones', id);
    await updateDoc(ref, data);
  },
  async delete(id: string): Promise<void> {
    const db = getDb();
    const ref = fsDoc(db, 'milestones', id);
    await deleteDoc(ref);
  }
} as const;

// Invoice operations
export const invoiceService = {
  async getByProject(projectId: string): Promise<Invoice[]> {
    const db = getDb();
    const qy = query(collection(db, 'invoices'), where('projectId', '==', projectId), orderBy('issuedAt', 'desc'));
    const snapshot = await getDocs(qy);
    return snapshot.docs.map(s => ({ id: s.id, ...convertTimestamps(s.data() as Record<string, unknown>) } as Invoice));
  },
  async create(data: Omit<Invoice, 'id'>): Promise<Invoice> {
    const db = getDb();
    const ref = await addDoc(collection(db, 'invoices'), data);
    return { id: ref.id, ...data };
  },
  async update(id: string, data: Partial<Omit<Invoice, 'id'>>): Promise<void> {
    const db = getDb();
    const ref = fsDoc(db, 'invoices', id);
    await updateDoc(ref, data);
  },
  async delete(id: string): Promise<void> {
    const db = getDb();
    const ref = fsDoc(db, 'invoices', id);
    await deleteDoc(ref);
  }
} as const;


