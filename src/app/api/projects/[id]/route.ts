import { NextResponse, NextRequest } from "next/server";
import { projectService } from "@/server/db";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    console.log('Fetching project with ID:', id);
    const project = await projectService.getById(id);
    console.log('Project found:', project ? 'Yes' : 'No');
    if (project) {
      console.log('Project data:', {
        id: project.id,
        title: project.title,
        hasBeforeImages: !!project.beforeImages?.length,
        hasAfterImages: !!project.afterImages?.length,
        hasBeforeVideos: !!project.beforeVideos?.length,
        hasAfterVideos: !!project.afterVideos?.length,
        beforeImages: project.beforeImages,
        afterImages: project.afterImages
      });
    }
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (err) {
    console.error('Error fetching project:', err);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}
