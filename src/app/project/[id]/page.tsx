"use client";
import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAuthInstance } from "@/lib/firebase";

type Project = {
  id: string;
  title: string;
  description?: string | null;
  clientName?: string;
  clientEmail?: string;
  clientId?: string;
  customerEmail?: string;
  status?: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  budget?: number | null;
  progress?: number | null;
  projectType?: string | null;
  complexity?: string | null;
  estimatedTimeline?: string | null;
  includedServices?: Array<{ title: string; estimatedPrice?: number }>;
  orderItems?: Array<{ id: string; name: string; price: number; quantity: number; image?: string }>;
  orderTotal?: number | null;
  paymentStatus?: string | null;
  createdFromOrderId?: string | null;
  beforeImages?: string[];
  afterImages?: string[];
  beforeVideos?: string[];
  afterVideos?: string[];
  images?: string[];
  videos?: string[];
  media?: Array<{ type: string; url: string }>;
};

type Media = { id: string; projectId: string; type: "image" | "video" | "before" | "after"; url: string; caption?: string | null };

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [fallbackMedia, setFallbackMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Check authentication and admin status
  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Check if user is admin
        const getCookieValue = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        const authToken = getCookieValue('auth-token') || getCookieValue('auth-token-debug');
        const admin = Boolean(authToken && authToken.includes('-admin'));
        setIsAdmin(admin);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        // Try the fallback API first since Admin SDK might be failing
        const pRes = await fetch(`/api/projects-fallback`, { cache: "no-store" });
        if (pRes.ok) {
          const projects = await pRes.json();
          const projectData = Array.isArray(projects) ? projects.find(p => p.id === params.id) : null;
          if (projectData) {
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
      } catch (_error) {
        setProject(null);
        setFallbackMedia([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

  // Check access permissions
  useEffect(() => {
    if (!project || !user) return;

    const userEmail = user.email?.toLowerCase() || '';
    const projectClientEmail = project.clientEmail?.toLowerCase() || '';
    const projectCustomerEmail = project.customerEmail?.toLowerCase() || '';
    const projectClientId = project.clientId?.toLowerCase() || '';

    // Admin can access any project
    if (isAdmin) {
      setHasAccess(true);
      return;
    }

    // Project owner can access their project
    if (userEmail === projectClientEmail || 
        userEmail === projectCustomerEmail || 
        userEmail === projectClientId) {
      setHasAccess(true);
      return;
    }

    // No access
    setHasAccess(false);
  }, [project, user, isAdmin]);

  if (!isLoading && !project) return notFound();

  // Check access permissions
  if (!isLoading && project && user && !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You don&apos;t have permission to view this project.
          </p>
          <Link 
            href="/dashboard" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Extract all possible image and video fields from project
  const images: string[] = [
    ...(project?.beforeImages || []),
    ...(project?.afterImages || []),
    ...(project?.images || []),
    ...(project?.media?.filter((m: { type: string; url: string }) => m.type === 'image' || m.type === 'before' || m.type === 'after')?.map((m: { type: string; url: string }) => m.url) || [])
  ].filter(Boolean);
  
  const videos: string[] = [
    ...(project?.beforeVideos || []),
    ...(project?.afterVideos || []),
    ...(project?.videos || []),
    ...(project?.media?.filter((m: { type: string; url: string }) => m.type === 'video')?.map((m: { type: string; url: string }) => m.url) || [])
  ].filter(Boolean);


  // If no embedded media, attempt to use fallback media list
  const hasEmbedded = images.length > 0 || videos.length > 0;
  
  const fmtDate = (v?: string | Date | null) => {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString();
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link href="/" className="text-blue-600 hover:underline">Home</Link>
        <span className="mx-2">/</span>
        {hasAccess ? (
          <>
            <Link href="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
            <span className="mx-2">/</span>
          </>
        ) : (
          <>
            <Link href="/portfolio" className="text-blue-600 hover:underline">Our Work</Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-gray-900">{project?.title || 'Project'}</span>
      </nav>

      {isLoading ? (
        <div>Loading…</div>
      ) : (
        <>
          <h1 className="text-3xl font-semibold mb-1">{project?.title}</h1>
          {/* Only show client info for project owners and admins */}
          {hasAccess && (project?.clientName || project?.clientEmail) && (
            <p className="text-sm text-gray-600 mb-4">
              {project?.clientName}
              {project?.clientName && project?.clientEmail ? " • " : ""}
              {project?.clientEmail}
            </p>
          )}

          {/* Project meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {project?.status && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium">{project.status}</p>
              </div>
            )}
            {(project?.startDate || project?.endDate) && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500">Timeline</p>
                <p className="text-sm font-medium">
                  {fmtDate(project?.startDate) || "TBD"}
                  {" → "}
                  {fmtDate(project?.endDate) || "TBD"}
                </p>
              </div>
            )}
            {hasAccess && typeof project?.budget === "number" && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500">Budget</p>
                <p className="text-sm font-medium">${Number(project.budget).toLocaleString()}</p>
              </div>
            )}
            {project?.projectType && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm font-medium">{project.projectType}</p>
              </div>
            )}
            {project?.complexity && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500">Complexity</p>
                <p className="text-sm font-medium">{project.complexity}</p>
              </div>
            )}
            {project?.estimatedTimeline && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500">Estimated Timeline</p>
                <p className="text-sm font-medium">{project.estimatedTimeline}</p>
              </div>
            )}
            {hasAccess && project?.paymentStatus && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500">Payment Status</p>
                <p className="text-sm font-medium">{project.paymentStatus}</p>
              </div>
            )}
            {hasAccess && project?.createdFromOrderId && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500">Order</p>
                <p className="text-sm font-medium break-all">{project.createdFromOrderId}</p>
              </div>
            )}
          </div>

          {project?.description ? (
            <p className="opacity-80 mb-8 whitespace-pre-wrap">{project.description}</p>
          ) : null}

          {/* Included Services - Only for project owners and admins */}
          {hasAccess && project?.includedServices && project.includedServices.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Included Services</h2>
              <ul className="list-disc pl-5 space-y-1">
                {project.includedServices.map((s, i) => (
                  <li key={`${s.title}-${i}`} className="text-sm">
                    {s.title}
                    {typeof s.estimatedPrice === "number" ? ` ($${s.estimatedPrice.toLocaleString()})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Order Items - Only for project owners and admins */}
          {hasAccess && project?.orderItems && project.orderItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Order Items</h2>
              <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {project.orderItems.map((it) => (
                      <tr key={`${it.id}-${it.name}`}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{it.name}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">{it.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">${(it.price / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {typeof project.orderTotal === "number" && (
                <div className="text-right mt-2 text-sm font-medium">Total: ${Number(project.orderTotal).toFixed(2)}</div>
              )}
            </div>
          )}

          {/* Media Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Project Media</h2>
            
            {/* Show embedded images/videos if available */}
            {hasEmbedded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {images.map((url, idx) => (
                  <figure key={`img-${idx}`} className="border rounded-lg overflow-hidden">
                    <Image 
                      src={url} 
                      alt={project?.title || ''} 
                      width={800} 
                      height={600} 
                      className="w-full" 
                    />
                  </figure>
                ))}
                {videos.map((url, idx) => (
                  <figure key={`vid-${idx}`} className="border rounded-lg overflow-hidden">
                    <video src={url} controls className="w-full" />
                  </figure>
                ))}
              </div>
            )}

            {/* Show fallback media if available */}
            {fallbackMedia.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fallbackMedia.map((item) => (
                  <figure key={item.id} className="border rounded-lg overflow-hidden">
                    {item.type === "video" ? (
                      <video src={item.url} controls className="w-full" />
                    ) : (
                      <Image 
                        src={item.url} 
                        alt={project?.title || ''} 
                        width={800} 
                        height={600} 
                        className="w-full" 
                      />
                    )}
                  </figure>
                ))}
              </div>
            )}

            {/* Show message if no media found */}
            {!hasEmbedded && fallbackMedia.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No media available for this project.</p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
