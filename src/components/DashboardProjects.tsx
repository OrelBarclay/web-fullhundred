"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAuthInstance } from "@/lib/firebase";

type Project = {
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  clientName?: string;
  clientEmail?: string;
  customerEmail?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  projectType?: string;
  complexity?: string;
  estimatedTimeline?: string;
  paymentStatus?: string;
  orderSummary?: {
    totalItems: number;
    orderTotal: number;
    paymentStatus: string;
    orderDate: string;
    customerPhone?: string | null;
    customerAddress?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    } | null;
  };
  // Media fields
  beforeImages?: string[];
  afterImages?: string[];
  beforeVideos?: string[];
  afterVideos?: string[];
  images?: string[];
  videos?: string[];
  media?: Array<{ type: string; url: string }>;
};

interface DashboardProjectsProps {
  userEmail?: string | null;
  isAdmin?: boolean;
}

export default function DashboardProjects({ userEmail, isAdmin }: DashboardProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const email = userEmail?.toLowerCase();
        if (!email) {
          setProjects([]);
          setIsLoading(false);
          return;
        }

        const res = await fetch(`/api/projects?email=${encodeURIComponent(email)}&limit=50`, { 
          cache: "no-store" 
        });
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setProjects(data as Project[]);
        } else if (Array.isArray(data?.projects)) {
          setProjects(data.projects as Project[]);
        } else {
          setProjects([]);
        }
      } catch (_e) {
        setError("Failed to load projects");
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [userEmail]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return (projects || []).filter(p => {
      const matchText = !q || p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
      const matchStatus = !status || (p.status === status);
      return matchText && matchStatus;
    });
  }, [projects, query, status]);

  const getStatusChipClass = (s: string) => {
    if (s === "in_progress") return "bg-primary/10 text-primary border-transparent";
    if (s === "completed") return "bg-[color:oklch(0.95_0_0)] text-[color:oklch(0.41_0.11_160)] border-transparent";
    if (s === "on_hold") return "bg-[color:oklch(0.97_0.001_286.375)] text-[color:oklch(0.55_0.02_286)] border-transparent";
    return "bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border-transparent"; // planning or default
  };

  const getThumbnail = (p: Project): string | undefined => {
    // For completed work, prioritize after images (completed work)
    if (p.afterImages && p.afterImages.length > 0) return p.afterImages[0];
    if (p.beforeImages && p.beforeImages.length > 0) return p.beforeImages[0];
    if (p.images && p.images.length > 0) return p.images[0];
    return undefined;
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "TBD";
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== "number") return "TBD";
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">My Projects</h2>
          <p className="text-sm mt-1 text-[color:var(--muted-foreground)]">
            {isAdmin ? "All projects in the system" : "Your current and completed projects"}
          </p>
        </div>
        <div className="flex gap-3">
          <input 
            className="border border-[color:var(--border)] bg-[color:var(--popover)] rounded-md px-3 py-2 w-64 placeholder:[color:var(--muted-foreground)]/70 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
            placeholder="Search projects" 
            value={query} 
            onChange={e=>setQuery(e.target.value)} 
          />
          <select 
            className="border border-[color:var(--border)] bg-[color:var(--popover)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]" 
            value={status} 
            onChange={e=>setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-[color:var(--border)] bg-[color:var(--card)] rounded-lg overflow-hidden">
              <div className="w-full aspect-[16/10] bg-[color:var(--muted)] animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-2/3 bg-[color:var(--muted)] rounded animate-pulse" />
                <div className="h-4 w-full bg-[color:var(--muted)] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-[color:var(--muted-foreground)]">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => {
            const thumb = getThumbnail(project);
            return (
              <Link key={project.id} href={`/project/${project.id}`} className="group block border border-[color:var(--border)] bg-[color:var(--card)] rounded-lg overflow-hidden hover:shadow-md hover:border-transparent hover:outline hover:outline-2 hover:outline-[color:var(--ring)] transition">
                {thumb ? (
                  <img src={thumb} alt={project.title} className="w-full aspect-[16/10] object-cover" />
                ) : (
                  <div className="w-full aspect-[16/10] bg-[color:var(--muted)]" />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">{project.title}</h3>
                    {project.status && (
                      <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusChipClass(project.status)}`}>
                        {project.status.replace('_',' ')}
                      </span>
                    )}
                  </div>
                  
                  {project.description && (
                    <p className="text-sm text-[color:var(--muted-foreground)] line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}

                  {/* Project Details - Only for authenticated users */}
                  <div className="space-y-2 text-sm">
                    {project.clientName && (
                      <div className="flex justify-between">
                        <span className="text-[color:var(--muted-foreground)]">Client:</span>
                        <span className="font-medium">{project.clientName}</span>
                      </div>
                    )}
                    
                    {project.budget && (
                      <div className="flex justify-between">
                        <span className="text-[color:var(--muted-foreground)]">Budget:</span>
                        <span className="font-medium">{formatCurrency(project.budget)}</span>
                      </div>
                    )}
                    
                    {project.projectType && (
                      <div className="flex justify-between">
                        <span className="text-[color:var(--muted-foreground)]">Type:</span>
                        <span className="font-medium capitalize">{project.projectType}</span>
                      </div>
                    )}
                    
                    {project.complexity && (
                      <div className="flex justify-between">
                        <span className="text-[color:var(--muted-foreground)]">Complexity:</span>
                        <span className="font-medium capitalize">{project.complexity}</span>
                      </div>
                    )}
                    
                    {project.estimatedTimeline && (
                      <div className="flex justify-between">
                        <span className="text-[color:var(--muted-foreground)]">Timeline:</span>
                        <span className="font-medium">{project.estimatedTimeline}</span>
                      </div>
                    )}
                    
                    {project.paymentStatus && (
                      <div className="flex justify-between">
                        <span className="text-[color:var(--muted-foreground)]">Payment:</span>
                        <span className={`font-medium capitalize ${
                          project.paymentStatus === 'paid' ? 'text-green-600' : 
                          project.paymentStatus === 'pending' ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {project.paymentStatus}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-[color:var(--muted-foreground)]">Start Date:</span>
                      <span className="font-medium">{formatDate(project.startDate)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-[color:var(--muted-foreground)]">End Date:</span>
                      <span className="font-medium">{formatDate(project.endDate)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 border border-dashed border-[color:var(--border)] rounded-lg">
              <h3 className="text-lg font-semibold">No projects found</h3>
              <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
                {isAdmin ? "No projects have been created yet." : "You don't have any projects yet."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
