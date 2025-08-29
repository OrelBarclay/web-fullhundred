"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Project = {
  id: string;
  title: string;
  description?: string | null;
};

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/projects", { cache: "no-store" });
        const data = await res.json();
        setProjects(data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold mb-6">Our Work</h1>
      {isLoading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/project/${project.id}`} className="group block border rounded-lg overflow-hidden hover:shadow-md transition">
              <div className="w-full aspect-[16/10] bg-black/5" />
              <div className="p-4">
                <h2 className="text-lg font-medium">{project.title}</h2>
                {project.description ? (
                  <p className="text-sm opacity-80 line-clamp-2">{project.description}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
