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

    // Prepare project data, filtering out undefined values
    const projectData: { 
      title: string; 
      description: string; 
      clientId: string; 
      status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
      startDate?: Date;
      endDate?: Date;
      budget?: number;
    } = {
      title,
      description,
      clientId,
      status
    };

    // Only add fields that have values
    if (startDateObj) projectData.startDate = startDateObj;
    if (endDateObj) projectData.endDate = endDateObj;
    if (budgetNum !== undefined) projectData.budget = budgetNum;

    // Create project
    const project = await projectService.create(projectData);

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
    console.log('getAllProjects: Starting to fetch projects...');
    const projects = await projectService.getAll();
    console.log('getAllProjects: Successfully fetched projects:', projects.length);
    return { success: true, projects };
  } catch (error) {
    console.error('getAllProjects: Error fetching projects:', error);
    
    // Temporary fallback for development - try client-side Firebase
    try {
      console.log('getAllProjects: Trying client-side Firebase fallback...');
      
      // This is a temporary workaround - in production, fix the service account permissions
      const response = await fetch('/api/projects-fallback', { 
        method: 'GET',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const fallbackProjects = await response.json();
        console.log('getAllProjects: Fallback successful, got projects:', fallbackProjects.length);
        return { success: true, projects: fallbackProjects };
      }
    } catch (fallbackError) {
      console.error('getAllProjects: Fallback also failed:', fallbackError);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
    return { success: false, error: errorMessage, projects: [] };
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

    // Prepare update data, filtering out undefined values
    const updateData: { 
      title: string; 
      description: string; 
      clientId: string; 
      status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
      startDate?: Date;
      endDate?: Date;
      budget?: number;
    } = {
      title,
      description,
      clientId,
      status
    };

    // Only add fields that have values
    if (startDateObj) updateData.startDate = startDateObj;
    if (endDateObj) updateData.endDate = endDateObj;
    if (budgetNum !== undefined) updateData.budget = budgetNum;

    // Update project
    await projectService.update(id, updateData);

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
