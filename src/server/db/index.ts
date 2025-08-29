import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
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

// Helper function to get Firestore instance
function getDb() {
  return getFirestore(getFirebaseAdmin());
}

// Helper function to convert Firestore timestamps to Date objects
function convertTimestamps<T extends Record<string, unknown>>(obj: T): T {
  const converted: Record<string, unknown> = { ...obj };
  Object.keys(converted).forEach((key) => {
    if (converted[key] && typeof converted[key] === 'object' && 'toDate' in converted[key]) {
      converted[key] = (converted[key] as { toDate: () => Date }).toDate();
    }
  });
  return converted as T;
}

// Client Service
export const clientService = {
  async getAll(): Promise<Client[]> {
    const db = getDb();
    const querySnapshot = await db.collection('clients').get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Client[];
  },

  async getById(id: string): Promise<Client | null> {
    const db = getDb();
    const docRef = db.collection('clients').doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data) {
        return { id: docSnap.id, ...convertTimestamps(data) } as Client;
      }
    }
    return null;
  },

  async create(data: ClientInput): Promise<Client> {
    const db = getDb();
    const now = new Date();
    const docRef = await db.collection('clients').add({
      ...data,
      createdAt: now,
      updatedAt: now
    });
    return { id: docRef.id, ...data, createdAt: now, updatedAt: now } as Client;
  },

  async update(id: string, data: Partial<ClientInput>): Promise<void> {
    const db = getDb();
    const docRef = db.collection('clients').doc(id);
    await docRef.update({
      ...data,
      updatedAt: new Date()
    });
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    const docRef = db.collection('clients').doc(id);
    await docRef.delete();
  }
};

// Project Service
export const projectService = {
  async getAll(): Promise<Project[]> {
    const db = getDb();
    const querySnapshot = await db.collection('projects').get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Project[];
  },

  async getById(id: string): Promise<Project | null> {
    const db = getDb();
    const docRef = db.collection('projects').doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data) {
        return { id: docSnap.id, ...convertTimestamps(data) } as Project;
      }
    }
    return null;
  },

  async create(data: ProjectInput): Promise<Project> {
    const db = getDb();
    const now = new Date();
    const docRef = await db.collection('projects').add({
      ...data,
      createdAt: now,
      updatedAt: now
    });
    return { id: docRef.id, ...data, createdAt: now, updatedAt: now } as Project;
  },

  async update(id: string, data: Partial<ProjectInput>): Promise<void> {
    const db = getDb();
    const docRef = db.collection('projects').doc(id);
    await docRef.update({
      ...data,
      updatedAt: new Date()
    });
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    const docRef = db.collection('projects').doc(id);
    await docRef.delete();
  }
};

// Media Service
export const mediaService = {
  async getAll(): Promise<Media[]> {
    const db = getDb();
    const querySnapshot = await db.collection('media').get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Media[];
  },

  async getByProjectId(projectId: string): Promise<Media[]> {
    const db = getDb();
    const q = db.collection('media').where('projectId', '==', projectId).orderBy('order');
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Media[];
  },

  async create(data: MediaInput): Promise<Media> {
    const db = getDb();
    const now = new Date();
    const docRef = await db.collection('media').add({
      ...data,
      createdAt: now
    });
    return { id: docRef.id, ...data, createdAt: now } as Media;
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    const docRef = db.collection('media').doc(id);
    await docRef.delete();
  }
};

// Lead Service
export const leadService = {
  async getAll(): Promise<Lead[]> {
    const db = getDb();
    const querySnapshot = await db.collection('leads').get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Lead[];
  },

  async create(data: LeadInput): Promise<Lead> {
    const db = getDb();
    const now = new Date();
    const docRef = await db.collection('leads').add({
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
    const querySnapshot = await db.collection('milestones').get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Milestone[];
  },

  async create(data: MilestoneInput): Promise<Milestone> {
    const db = getDb();
    const now = new Date();
    const docRef = await db.collection('milestones').add({
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
    const docRef = db.collection('milestones').doc(id);
    await docRef.update({
      ...data,
      updatedAt: new Date()
    });
  }
};

// Invoice Service
export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    const db = getDb();
    const querySnapshot = await db.collection('invoices').get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Invoice[];
  },

  async create(data: InvoiceInput): Promise<Invoice> {
    const db = getDb();
    const now = new Date();
    const docRef = await db.collection('invoices').add({
      ...data,
      createdAt: now,
      updatedAt: now
    });
    return { id: docRef.id, ...data, createdAt: now, updatedAt: now } as Invoice;
  },

  async update(id: string, data: Partial<InvoiceInput>): Promise<void> {
    const db = getDb();
    const docRef = db.collection('invoices').doc(id);
    await docRef.update({
      ...data,
      updatedAt: new Date()
    });
  }
};

// User Service
export const userService = {
  async getById(id: string): Promise<User | null> {
    const db = getDb();
    const docRef = db.collection('users').doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data) {
        return { id: docSnap.id, ...convertTimestamps(data) } as User;
      }
    }
    return null;
  },

  async getByEmail(email: string): Promise<User | null> {
    const db = getDb();
    const q = db.collection('users').where('email', '==', email);
    const querySnapshot = await q.get();
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...convertTimestamps(doc.data()) } as User;
    }
    return null;
  },

  async create(data: UserInput): Promise<User> {
    const db = getDb();
    const now = new Date();
    const docRef = await db.collection('users').add({
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
    const docRef = db.collection('users').doc(id);
    await docRef.set({
      ...data,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    });
    return { id, ...data, createdAt: now, updatedAt: now, lastLoginAt: now } as User;
  },

  async update(id: string, data: Partial<UserInput>): Promise<void> {
    const db = getDb();
    const docRef = db.collection('users').doc(id);
    await docRef.update({
      ...data,
      updatedAt: new Date()
    });
  },

  async updateUid(oldId: string, newId: string): Promise<void> {
    const db = getDb();
    
    // Get the old user document
    const oldDocRef = db.collection('users').doc(oldId);
    const oldDocSnap = await oldDocRef.get();
    
    if (oldDocSnap.exists) {
      const userData = oldDocSnap.data();
      
      // Create new document with new UID
      const newDocRef = db.collection('users').doc(newId);
      await newDocRef.set({
        ...userData,
        updatedAt: new Date()
      });
      
      // Delete the old document
      await oldDocRef.delete();
    }
  },

  async updateLastLogin(id: string): Promise<void> {
    const db = getDb();
    const docRef = db.collection('users').doc(id);
    await docRef.update({
      lastLoginAt: new Date()
    });
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    const docRef = db.collection('users').doc(id);
    await docRef.delete();
  }
};

// Re-export types for convenience
export type { 
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
};


