"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Project = {
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  // Media fields saved on the project document
  beforeImages?: string[];
  afterImages?: string[];
};

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const res = await fetch("/api/projects-fallback", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data)) setProjects(data as Project[]);
        else if (Array.isArray(data?.projects)) setProjects(data.projects as Project[]);
        else setProjects([]);
      } catch (_e) {
        setError("Failed to load projects");
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return (projects || []).filter(p => {
      const matchText = !q || p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
      const matchStatus = !status || (p.status === status);
      return matchText && matchStatus;
    });
  }, [projects, query, status]);

  const getThumbnail = (p: Project): string | undefined => {
    if (p.beforeImages && p.beforeImages.length > 0) return p.beforeImages[0];
    if (p.afterImages && p.afterImages.length > 0) return p.afterImages[0];
    return undefined;
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-semibold">Our Work</h1>
        <div className="flex gap-3">
          <input className="border rounded px-3 py-2 w-64" placeholder="Search projects" value={query} onChange={e=>setQuery(e.target.value)} />
          <select className="border rounded px-3 py-2" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => {
            const thumb = getThumbnail(project);
            return (
              <Link key={project.id} href={`/project/${project.id}`} className="group block border rounded-lg overflow-hidden hover:shadow-md transition">
                {thumb ? (
                  <img src={thumb} alt={project.title} className="w-full aspect-[16/10] object-cover" />
                ) : (
                  <div className="w-full aspect-[16/10] bg-black/5" />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">{project.title}</h2>
                    {project.status && (
                      <span className="text-xs px-2 py-1 border rounded capitalize opacity-80">{project.status.replace('_',' ')}</span>
                    )}
                  </div>
                  {project.description ? (
                    <p className="text-sm opacity-80 line-clamp-2">{project.description}</p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
