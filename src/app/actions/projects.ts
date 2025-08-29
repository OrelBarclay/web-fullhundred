'use server';

import { revalidatePath } from 'next/cache';
import { projectService } from '@/server/db';

export async function createProject(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const clientId = formData.get('clientId') as string;
    const status = formData.get('status') as 'planning' | 'in-progress' | 'completed' | 'on-hold';
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const budget = formData.get('budget') as string;

    // Validation
    if (!title || !description || !clientId || !status) {
      throw new Error('Missing required fields');
    }

    // Parse dates and budget
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    const budgetNum = budget ? parseFloat(budget) : undefined;

    // Validate dates
    if (startDateObj && isNaN(startDateObj.getTime())) {
      throw new Error('Invalid start date');
    }
    if (endDateObj && isNaN(endDateObj.getTime())) {
      throw new Error('Invalid end date');
    }
    if (startDateObj && endDateObj && startDateObj > endDateObj) {
      throw new Error('Start date cannot be after end date');
    }

    // Validate budget
    if (budgetNum && (isNaN(budgetNum) || budgetNum < 0)) {
      throw new Error('Invalid budget amount');
    }

    // Create project
    const project = await projectService.create({
      title,
      description,
      clientId,
      status,
      startDate: startDateObj,
      endDate: endDateObj,
      budget: budgetNum
    });

    console.log('Project created successfully:', project.id);
    
    // Revalidate the admin page to show the new project
    revalidatePath('/admin');
    
    return { success: true, projectId: project.id };
  } catch (error) {
    console.error('Error creating project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
    return { success: false, error: errorMessage };
  }
}

export async function getAllProjects() {
  try {
    const projects = await projectService.getAll();
    return { success: true, projects };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return { success: false, error: 'Failed to fetch projects', projects: [] };
  }
}

export async function updateProject(id: string, formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const clientId = formData.get('clientId') as string;
    const status = formData.get('status') as 'planning' | 'in-progress' | 'completed' | 'on-hold';
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const budget = formData.get('budget') as string;

    // Validation
    if (!title || !description || !clientId || !status) {
      throw new Error('Missing required fields');
    }

    // Parse dates and budget
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    const budgetNum = budget ? parseFloat(budget) : undefined;

    // Validate dates
    if (startDateObj && isNaN(startDateObj.getTime())) {
      throw new Error('Invalid start date');
    }
    if (endDateObj && isNaN(endDateObj.getTime())) {
      throw new Error('Invalid end date');
    }
    if (startDateObj && endDateObj && startDateObj > endDateObj) {
      throw new Error('Start date cannot be after end date');
    }

    // Validate budget
    if (budgetNum && (isNaN(budgetNum) || budgetNum < 0)) {
      throw new Error('Invalid budget amount');
    }

    // Update project
    await projectService.update(id, {
      title,
      description,
      clientId,
      status,
      startDate: startDateObj,
      endDate: endDateObj,
      budget: budgetNum
    });

    console.log('Project updated successfully:', id);
    
    // Revalidate the admin page
    revalidatePath('/admin');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
    return { success: false, error: errorMessage };
  }
}

export async function deleteProject(id: string) {
  try {
    await projectService.delete(id);
    console.log('Project deleted successfully:', id);
    
    // Revalidate the admin page
    revalidatePath('/admin');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
    return { success: false, error: errorMessage };
  }
}
