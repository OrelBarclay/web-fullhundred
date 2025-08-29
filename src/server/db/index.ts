import { getDb } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import type { 
  Client, 
  Project, 
  Media, 
  Lead, 
  Milestone, 
  Invoice, 
  User,
  ClientInput, 
  ProjectInput, 
  MediaInput, 
  LeadInput, 
  MilestoneInput, 
  InvoiceInput,
  UserInput
} from './schema';

// Helper function to convert Firestore timestamps to Date objects
function convertTimestamps<T extends Record<string, unknown>>(obj: T): T {
  const converted: Record<string, unknown> = { ...obj };
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted as T;
}

// Client Service
export const clientService = {
  async getAll(): Promise<Client[]> {
    const db = getDb();
    const querySnapshot = await getDocs(collection(db, 'clients'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Client[];
  },

  async getById(id: string): Promise<Client | null> {
    const db = getDb();
    const docRef = doc(db, 'clients', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Client;
    }
    return null;
  },

  async create(data: ClientInput): Promise<Client> {
    const db = getDb();
    const now = new Date();
    const docRef = await addDoc(collection(db, 'clients'), {
      ...data,
      createdAt: now,
      updatedAt: now
    });
    return { id: docRef.id, ...data, createdAt: now, updatedAt: now } as Client;
  },

  async update(id: string, data: Partial<ClientInput>): Promise<void> {
    const db = getDb();
    const docRef = doc(db, 'clients', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    const docRef = doc(db, 'clients', id);
    await deleteDoc(docRef);
  }
};

// Project Service
export const projectService = {
  async getAll(): Promise<Project[]> {
    const db = getDb();
    const querySnapshot = await getDocs(collection(db, 'projects'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Project[];
  },

  async getById(id: string): Promise<Project | null> {
    const db = getDb();
    const docRef = doc(db, 'projects', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Project;
    }
    return null;
  },

  async create(data: ProjectInput): Promise<Project> {
    const db = getDb();
    const now = new Date();
    const docRef = await addDoc(collection(db, 'projects'), {
      ...data,
      createdAt: now,
      updatedAt: now
    });
    return { id: docRef.id, ...data, createdAt: now, updatedAt: now } as Project;
  },

  async update(id: string, data: Partial<ProjectInput>): Promise<void> {
    const db = getDb();
    const docRef = doc(db, 'projects', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    const docRef = doc(db, 'projects', id);
    await deleteDoc(docRef);
  }
};

// Media Service
export const mediaService = {
  async getAll(): Promise<Media[]> {
    const db = getDb();
    const querySnapshot = await getDocs(collection(db, 'media'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Media[];
  },

  async getByProjectId(projectId: string): Promise<Media[]> {
    const db = getDb();
    const q = query(
      collection(db, 'media'), 
      where('projectId', '==', projectId),
      orderBy('order')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Media[];
  },

  async create(data: MediaInput): Promise<Media> {
    const db = getDb();
    const now = new Date();
    const docRef = await addDoc(collection(db, 'media'), {
      ...data,
      createdAt: now
    });
    return { id: docRef.id, ...data, createdAt: now } as Media;
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    const docRef = doc(db, 'media', id);
    await deleteDoc(docRef);
  }
};

// Lead Service
export const leadService = {
  async getAll(): Promise<Lead[]> {
    const db = getDb();
    const querySnapshot = await getDocs(collection(db, 'leads'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Lead[];
  },

  async create(data: LeadInput): Promise<Lead> {
    const db = getDb();
    const now = new Date();
    const docRef = await addDoc(collection(db, 'leads'), {
      ...data,
      createdAt: now
    });
    return { id: docRef.id, ...data, createdAt: now } as Lead;
  }
};

// Milestone Service
export const milestoneService = {
  async getAll(): Promise<Milestone[]> {
    const db = getDb();
    const querySnapshot = await getDocs(collection(db, 'milestones'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Milestone[];
  },

  async create(data: MilestoneInput): Promise<Milestone> {
    const db = getDb();
    const now = new Date();
    const docRef = await addDoc(collection(db, 'milestones'), {
      ...data,
      completed: false,
      createdAt: now,
      updatedAt: now
    });
    return { 
      id: docRef.id, 
      ...data, 
      completed: false, 
      createdAt: now, 
      updatedAt: now 
    } as Milestone;
  },

  async update(id: string, data: Partial<MilestoneInput>): Promise<void> {
    const db = getDb();
    const docRef = doc(db, 'milestones', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
  }
};

// Invoice Service
export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    const db = getDb();
    const querySnapshot = await getDocs(collection(db, 'invoices'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Invoice[];
  },

  async create(data: InvoiceInput): Promise<Invoice> {
    const db = getDb();
    const now = new Date();
    const docRef = await addDoc(collection(db, 'invoices'), {
      ...data,
      createdAt: now,
      updatedAt: now
    });
    return { id: docRef.id, ...data, createdAt: now, updatedAt: now } as Invoice;
  },

  async update(id: string, data: Partial<InvoiceInput>): Promise<void> {
    const db = getDb();
    const docRef = doc(db, 'invoices', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
  }
};

// User Service
export const userService = {
  async getById(id: string): Promise<User | null> {
    const db = getDb();
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as User;
    }
    return null;
  },

  async getByEmail(email: string): Promise<User | null> {
    const db = getDb();
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...convertTimestamps(doc.data()) } as User;
    }
    return null;
  },

  async create(data: UserInput): Promise<User> {
    const db = getDb();
    const now = new Date();
    const docRef = await addDoc(collection(db, 'users'), {
      ...data,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    });
    return { id: docRef.id, ...data, createdAt: now, updatedAt: now, lastLoginAt: now } as User;
  },

  async createWithId(id: string, data: UserInput): Promise<User> {
    const db = getDb();
    const now = new Date();
    const docRef = doc(db, 'users', id);
    await setDoc(docRef, {
      ...data,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    });
    return { id, ...data, createdAt: now, updatedAt: now, lastLoginAt: now } as User;
  },

  async update(id: string, data: Partial<UserInput>): Promise<void> {
    const db = getDb();
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
  },

  async updateLastLogin(id: string): Promise<void> {
    const db = getDb();
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, {
      lastLoginAt: new Date()
    });
  }
};


