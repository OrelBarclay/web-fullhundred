'use server';

import { revalidatePath } from 'next/cache';
import { clientService } from '@/server/db';

export async function createClient(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    // Validation
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    // Prepare client data, filtering out undefined values
    const clientData: { name: string; email?: string; phone?: string; address?: string } = {
      name: name.trim()
    };

    // Only add fields that have values
    if (email.trim()) clientData.email = email.trim();
    if (phone.trim()) clientData.phone = phone.trim();
    if (address.trim()) clientData.address = address.trim();

    // Create client
    const client = await clientService.create(clientData);

    console.log('Client created successfully:', client.id);
    
    // Revalidate the admin page to show the new client
    revalidatePath('/admin');
    
    return { success: true, clientId: client.id };
  } catch (error) {
    console.error('Error creating client:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create client';
    return { success: false, error: errorMessage };
  }
}

export async function getAllClients() {
  try {
    console.log('getAllClients: Starting to fetch clients...');
    
    // Try server-side Firebase first
    try {
      const clients = await clientService.getAll();
      console.log('getAllClients: Successfully fetched clients from server:', clients.length);
      return { success: true, clients };
    } catch (serverError) {
      console.log('getAllClients: Server-side failed, trying client-side fallback...', serverError);
      
      // Fallback: Use client-side Firebase
      // This is a temporary workaround until Firebase Admin permissions are fixed
      const response = await fetch('/api/clients-fallback', { 
        method: 'GET',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const fallbackClients = await response.json();
        console.log('getAllClients: Fallback successful, got clients:', fallbackClients.length);
        return { success: true, clients: fallbackClients };
      } else {
        throw new Error('Fallback API also failed');
      }
    }
  } catch (error) {
    console.error('getAllClients: Error fetching clients:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch clients';
    return { success: false, error: errorMessage, clients: [] };
  }
}

export async function updateClient(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    // Validation
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    // Prepare update data, filtering out undefined values
    const updateData: { name: string; email?: string; phone?: string; address?: string } = {
      name: name.trim()
    };

    // Only add fields that have values
    if (email.trim()) updateData.email = email.trim();
    if (phone.trim()) updateData.phone = phone.trim();
    if (address.trim()) updateData.address = address.trim();

    // Update client
    await clientService.update(id, updateData);

    console.log('Client updated successfully:', id);
    
    // Revalidate the admin page
    revalidatePath('/admin');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating client:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update client';
    return { success: false, error: errorMessage };
  }
}

export async function deleteClient(id: string) {
  try {
    await clientService.delete(id);
    console.log('Client deleted successfully:', id);
    
    // Revalidate the admin page
    revalidatePath('/admin');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting client:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete client';
    return { success: false, error: errorMessage };
  }
}
