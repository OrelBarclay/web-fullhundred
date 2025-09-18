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
    
    const uploadResponse = await fetch('/api/cloudinary-upload', {
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
    const { beforeImageUrl, resultImageUrl, styleId, styleLabel, spaceType, spaceLabel } = await req.json();
    if (!resultImageUrl) {
      return NextResponse.json({ error: 'Missing result image' }, { status: 400 });
    }

    // Upload images to Cloudinary for permanent storage
    let uploadedBeforeImageUrl = null;
    let uploadedResultImageUrl = null;

    try {
      // Upload result image (required)
      uploadedResultImageUrl = await uploadToCloudinary(resultImageUrl, 'visualizer/projects');
      
      // Upload before image if provided
      if (beforeImageUrl) {
        uploadedBeforeImageUrl = await uploadToCloudinary(beforeImageUrl, 'visualizer/projects');
      }
    } catch (uploadError) {
      console.error('Failed to upload images to Cloudinary:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to save images. Please try again.',
        details: 'The generated image could not be permanently stored.'
      }, { status: 500 });
    }

    // Create the project with Cloudinary URLs
    const db = getDb();
    const projectId = `viz-${Date.now()}`;
    await setDoc(doc(db, 'projects', projectId), {
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
    }, { merge: true });

    return NextResponse.json({ projectId });
  } catch (e) {
    console.error('Create project error:', e);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}


