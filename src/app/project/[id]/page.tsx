"use client";
import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";

type Project = {
  id: string;
  title: string;
  description?: string | null;
  beforeImages?: string[];
  afterImages?: string[];
  beforeVideos?: string[];
  afterVideos?: string[];
};

type Media = { id: string; projectId: string; type: "image" | "video" | "before" | "after"; url: string; caption?: string | null };

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [fallbackMedia, setFallbackMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Try the fallback API first since Admin SDK might be failing
        const pRes = await fetch(`/api/projects-fallback`, { cache: "no-store" });
        if (pRes.ok) {
          const projects = await pRes.json();
          const projectData = Array.isArray(projects) ? projects.find(p => p.id === params.id) : null;
          if (projectData) {
            console.log('Project data from fallback API:', projectData);
            setProject(projectData as Project);
          } else {
            setProject(null);
            return;
          }
        } else {
          // Fallback to individual project API
          const pRes = await fetch(`/api/projects/${params.id}`, { cache: "no-store" });
          if (pRes.status === 404) {
            setProject(null);
            return;
          }
          const pData = await pRes.json();
          console.log('Project data from API:', pData);
          setProject(pData as Project);
        }

        // Fallback: load separate media collection if present
        const mRes = await fetch(`/api/media-fallback`, { cache: "no-store" }).catch(() => null);
        if (mRes && mRes.ok) {
          const mAll = await mRes.json();
          if (Array.isArray(mAll)) {
            setFallbackMedia(mAll.filter((m: Media) => m.projectId === params.id));
          } else {
            setFallbackMedia([]);
          }
        } else {
          setFallbackMedia([]);
        }
      } catch (error) {
        console.error("Error loading project data:", error);
        setProject(null);
        setFallbackMedia([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (!isLoading && !project) return notFound();

  const images: string[] = [
    ...(project?.beforeImages || []),
    ...(project?.afterImages || [])
  ];
  const videos: string[] = [
    ...(project?.beforeVideos || []),
    ...(project?.afterVideos || [])
  ];

  // If no embedded media, attempt to use fallback media list
  const hasEmbedded = images.length > 0 || videos.length > 0;
  
  console.log('Project media arrays:', {
    beforeImages: project?.beforeImages,
    afterImages: project?.afterImages,
    beforeVideos: project?.beforeVideos,
    afterVideos: project?.afterVideos,
    images,
    videos,
    hasEmbedded
  });

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      {isLoading ? (
        <div>Loading…</div>
      ) : (
        <>
          <h1 className="text-3xl font-semibold mb-3">{project?.title}</h1>
          {project?.description ? (
            <p className="opacity-80 mb-8">{project.description}</p>
          ) : null}

          {hasEmbedded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {images.map((url, idx) => (
                <figure key={`img-${idx}`} className="border rounded-lg overflow-hidden">
                  <img src={url} alt={project?.title || ''} className="w-full" />
                </figure>
              ))}
              {videos.map((url, idx) => (
                <figure key={`vid-${idx}`} className="border rounded-lg overflow-hidden">
                  <video src={url} controls className="w-full" />
                </figure>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fallbackMedia.map((item) => (
                <figure key={item.id} className="border rounded-lg overflow-hidden">
                  {item.type === "video" ? (
                    <video src={item.url} controls className="w-full" />
                  ) : (
                    <img src={item.url} alt={project?.title || ''} className="w-full" />
                  )}
                </figure>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
