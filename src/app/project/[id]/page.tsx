"use client";
import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";

type Project = { id: string; title: string; description?: string | null };

type Media = { id: string; projectId: string; type: "image" | "video" | "before" | "after"; url: string; caption?: string | null };

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, mRes] = await Promise.all([
          fetch(`/api/projects/${params.id}`, { cache: "no-store" }),
          fetch(`/api/media-fallback`, { cache: "no-store" })
        ]);
        if (pRes.status === 404) {
          setProject(null);
          return;
        }
        const pData = await pRes.json();
        const mAll = await mRes.json();
        setProject(pData);
        
        // Ensure mAll is an array before filtering
        if (Array.isArray(mAll)) {
          setMedia(mAll.filter((m: Media) => m.projectId === params.id));
        } else {
          console.error("Media API returned non-array response:", mAll);
          setMedia([]);
        }
      } catch (error) {
        console.error("Error loading project data:", error);
        setProject(null);
        setMedia([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (!isLoading && !project) return notFound();

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {media.map((item) => (
              <figure key={item.id} className="border rounded-lg overflow-hidden">
                {item.type === "video" ? (
                  <video src={item.url} controls className="w-full" />
                ) : (
                  <img src={item.url} alt={item.caption ?? project?.title ?? ""} className="w-full" />
                )}
                {item.caption ? <figcaption className="p-2 text-sm opacity-75">{item.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
