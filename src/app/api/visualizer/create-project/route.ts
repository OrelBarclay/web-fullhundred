import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getAuthInstance } from '@/lib/firebase';

// Utility function to upload image to Cloudinary
async function uploadToCloudinary(imageUrl: string, folder: string = 'visualizer/projects'): Promise<string> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const formData = new FormData();
    formData.append('file', new File([blob], 'image.png', { type: blob.type || 'image/png' }));
    formData.append('folder', folder);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const uploadResponse = await fetch(`${baseUrl}/api/cloudinary-upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to Cloudinary');
    }
    
    const data = await uploadResponse.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Visualizer create-project: Starting request');
    const { beforeImageUrl, resultImageUrl, styleId, styleLabel, spaceType, spaceLabel } = await req.json();
    
    console.log('Visualizer create-project: Request data:', {
      hasBeforeImage: !!beforeImageUrl,
      hasResultImage: !!resultImageUrl,
      styleId,
      styleLabel,
      spaceType,
      spaceLabel
    });
    
    if (!resultImageUrl) {
      console.log('Visualizer create-project: Missing result image');
      return NextResponse.json({ error: 'Missing result image' }, { status: 400 });
    }

    // Upload images to Cloudinary for permanent storage
    let uploadedBeforeImageUrl = null;
    let uploadedResultImageUrl = null;

    try {
      console.log('Visualizer create-project: Starting image uploads');
      // Upload result image (required)
      uploadedResultImageUrl = await uploadToCloudinary(resultImageUrl, 'visualizer/projects');
      console.log('Visualizer create-project: Result image uploaded:', uploadedResultImageUrl);
      
      // Upload before image if provided
      if (beforeImageUrl) {
        uploadedBeforeImageUrl = await uploadToCloudinary(beforeImageUrl, 'visualizer/projects');
        console.log('Visualizer create-project: Before image uploaded:', uploadedBeforeImageUrl);
      }
    } catch (uploadError) {
      console.error('Visualizer create-project: Failed to upload images to Cloudinary:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to save images. Please try again.',
        details: 'The generated image could not be permanently stored.'
      }, { status: 500 });
    }

    // Create the project with Cloudinary URLs
    console.log('Visualizer create-project: Creating project in database');
    const db = getDb();
    const projectId = `viz-${Date.now()}`;
    
    const projectData = {
      id: projectId,
      title: `Visualizer ${spaceLabel || spaceType || ''} - ${styleLabel || styleId || 'Design'}`.trim(),
      description: 'Project created from AI Visualizer (admin)'.trim(),
      status: 'planning',
      startDate: new Date(),
      budget: 0,
      beforeImages: uploadedBeforeImageUrl ? [uploadedBeforeImageUrl] : [],
      afterImages: [uploadedResultImageUrl],
      projectType: 'visualizer',
      spaceType: spaceType || 'unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPortfolioProject: false,
    };
    
    console.log('Visualizer create-project: Project data:', projectData);
    
    await setDoc(doc(db, 'projects', projectId), projectData, { merge: true });
    console.log('Visualizer create-project: Project created successfully with ID:', projectId);

    return NextResponse.json({ projectId });
  } catch (e) {
    console.error('Visualizer create-project: Create project error:', e);
    return NextResponse.json({ 
      error: 'Failed to create project',
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}


