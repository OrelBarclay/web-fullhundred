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

    // Create client
    const client = await clientService.create({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined
    });

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
    const clients = await clientService.getAll();
    return { success: true, clients };
  } catch (error) {
    console.error('Error fetching clients:', error);
    return { success: false, error: 'Failed to fetch clients', clients: [] };
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

    // Update client
    await clientService.update(id, {
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined
    });

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
