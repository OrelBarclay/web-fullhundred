"use client";
import { useEffect, useState } from "react";
import type { Client, Project } from "@/server/db/schema";
import { getStorageInstance } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuid } from "uuid";

type UploadType = "image" | "video" | "before" | "after";

type Milestone = { id: string; projectId: string; title: string; dueDate?: string | null; completedAt?: string | null };

type Invoice = { id: string; projectId: string; amountCents: number; status: "unpaid" | "paid" | "overdue"; issuedAt: string; paidAt?: string | null };

export default function AdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
  const [newProject, setNewProject] = useState({ clientId: "", title: "", description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Media upload state
  const [uploadProjectId, setUploadProjectId] = useState("");
  const [uploadType, setUploadType] = useState<UploadType>("image");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Milestones / Invoices state
  const [selectedProjectForMgmt, setSelectedProjectForMgmt] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [newMilestone, setNewMilestone] = useState({ title: "", dueDate: "" });
  const [newInvoice, setNewInvoice] = useState({ amountCents: "", status: "unpaid", issuedAt: "" });
  const [isMgmtLoading, setIsMgmtLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProjectForMgmt) {
      loadMgmtData(selectedProjectForMgmt);
    } else {
      setMilestones([]);
      setInvoices([]);
    }
  }, [selectedProjectForMgmt]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const [clientsRes, projectsRes] = await Promise.all([
        fetch("/api/clients", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" })
      ]);
      const clientsJson = await clientsRes.json();
      const projectsJson = await projectsRes.json();
      setClients(Array.isArray(clientsJson) ? clientsJson : (Array.isArray(clientsJson?.clients) ? clientsJson.clients : []));
      setProjects(Array.isArray(projectsJson) ? projectsJson : (Array.isArray(projectsJson?.projects) ? projectsJson.projects : []));
    } catch {
      setError("Failed to load data");
      setClients([]);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMgmtData(projectId: string) {
    try {
      setIsMgmtLoading(true);
      const [msRes, invRes] = await Promise.all([
        fetch(`/api/milestones?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" }),
        fetch(`/api/invoices?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" })
      ]);
      const ms = await msRes.json();
      const inv = await invRes.json();
      setMilestones(Array.isArray(ms) ? ms : []);
      setInvoices(Array.isArray(inv) ? inv : []);
    } finally {
      setIsMgmtLoading(false);
    }
  }

  async function createClient() {
    if (!newClient.name.trim()) return;
    
    try {
      const response = await fetch("/api/clients", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(newClient) 
      });
      
      if (response.ok) {
        const client = await response.json();
        setClients(prev => [client, ...(Array.isArray(prev) ? prev : [])]);
        setNewClient({ name: "", email: "", phone: "" });
      } else {
        setError("Failed to create client");
      }
    } catch {
      setError("Failed to create client");
    }
  }

  async function createProject() {
    if (!newProject.title.trim() || !newProject.clientId) return;
    
    try {
      const response = await fetch("/api/projects", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(newProject) 
      });
      
      if (response.ok) {
        const project = await response.json();
        setProjects(prev => [project, ...(Array.isArray(prev) ? prev : [])]);
        setNewProject({ clientId: "", title: "", description: "" });
      } else {
        setError("Failed to create project");
      }
    } catch {
      setError("Failed to create project");
    }
  }

  async function handleUpload() {
    if (!uploadProjectId || !uploadFile) return;
    try {
      setIsUploading(true);
      setError(null);
      const storage = getStorageInstance();
      const ext = uploadFile.name.split(".").pop() || "bin";
      const objectName = `projects/${uploadProjectId}/${uuid()}.${ext}`;
      const storageRef = ref(storage, objectName);
      await uploadBytes(storageRef, uploadFile);
      const tempUrl = await getDownloadURL(storageRef);

      // Optional: promote to Cloudinary for permanent optimized hosting
      let finalUrl = tempUrl;
      try {
        const cldRes = await fetch("/api/cloudinary-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl: tempUrl, folder: `projects/${uploadProjectId}` })
        });
        if (cldRes.ok) {
          const c = await cldRes.json();
          finalUrl = c.url || tempUrl;
        }
      } catch {}

      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: uploadProjectId, type: uploadType, url: finalUrl })
      });
      if (!res.ok) throw new Error("Failed to save media record");

      // reset
      setUploadFile(null);
    } catch {
      setError("Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function addMilestone() {
    if (!selectedProjectForMgmt || !newMilestone.title.trim()) return;
    const payload: { projectId: string; title: string; dueDate?: string } = {
      projectId: selectedProjectForMgmt,
      title: newMilestone.title.trim(),
      ...(newMilestone.dueDate ? { dueDate: newMilestone.dueDate } : {}),
    };
    const res = await fetch("/api/milestones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      setNewMilestone({ title: "", dueDate: "" });
      await loadMgmtData(selectedProjectForMgmt);
    }
  }

  async function addInvoice() {
    if (!selectedProjectForMgmt || !newInvoice.amountCents) return;
    const amount = parseInt(newInvoice.amountCents, 10);
    if (Number.isNaN(amount)) return;
    const payload: { projectId: string; amountCents: number; status: 'unpaid'|'paid'|'overdue'; issuedAt?: string } = {
      projectId: selectedProjectForMgmt,
      amountCents: amount,
      status: newInvoice.status as 'unpaid'|'paid'|'overdue',
      ...(newInvoice.issuedAt ? { issuedAt: newInvoice.issuedAt } : {}),
    };
    const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      setNewInvoice({ amountCents: "", status: "unpaid", issuedAt: "" });
      await loadMgmtData(selectedProjectForMgmt);
    }
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-center">Loading...</div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 grid gap-12">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Admin CMS</h1>
        <p className="opacity-80">Manage clients and projects.</p>
        {error && (
          <p className="text-red-600 text-sm mt-2">{error}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="border rounded-lg p-4">
          <h2 className="font-medium mb-3">Create Client</h2>
          <div className="grid gap-3">
            <input 
              className="border rounded px-3 py-2" 
              placeholder="Name *" 
              value={newClient.name} 
              onChange={e => setNewClient(v => ({ ...v, name: e.target.value }))} 
            />
            <input 
              className="border rounded px-3 py-2" 
              placeholder="Email" 
              type="email"
              value={newClient.email} 
              onChange={e => setNewClient(v => ({ ...v, email: e.target.value }))} 
            />
            <input 
              className="border rounded px-3 py-2" 
              placeholder="Phone" 
              type="tel"
              value={newClient.phone} 
              onChange={e => setNewClient(v => ({ ...v, phone: e.target.value }))} 
            />
            <button 
              className="bg-black text-white rounded px-4 py-2 w-fit disabled:opacity-50" 
              onClick={createClient}
              disabled={!newClient.name.trim()}
            >
              Save Client
            </button>
          </div>
          <div className="mt-4">
            <h3 className="font-medium mb-2">Existing Clients ({Array.isArray(clients) ? clients.length : 0})</h3>
            <ul className="space-y-2">
              {(Array.isArray(clients) ? clients : []).map(client => (
                <li key={client.id} className="text-sm p-2 bg-gray-50 rounded">
                  <div className="font-medium">{client.name}</div>
                  {client.email && <div className="text-gray-600">{client.email}</div>}
                  {client.phone && <div className="text-gray-600">{client.phone}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-medium mb-3">Create Project</h2>
          <div className="grid gap-3">
            <select 
              className="border rounded px-3 py-2" 
              value={newProject.clientId} 
              onChange={e => setNewProject(v => ({ ...v, clientId: e.target.value }))}
            >
              <option value="">Select client *</option>
              {(Array.isArray(clients) ? clients : []).map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <input 
              className="border rounded px-3 py-2" 
              placeholder="Title *" 
              value={newProject.title} 
              onChange={e => setNewProject(v => ({ ...v, title: e.target.value }))} 
            />
            <textarea 
              className="border rounded px-3 py-2" 
              placeholder="Description" 
              rows={3}
              value={newProject.description} 
              onChange={e => setNewProject(v => ({ ...v, description: e.target.value }))} 
            />
            <button 
              className="bg-black text-white rounded px-4 py-2 w-fit disabled:opacity-50" 
              onClick={createProject}
              disabled={!newProject.title.trim() || !newProject.clientId}
            >
              Save Project
            </button>
          </div>
          <div className="mt-4">
            <h3 className="font-medium mb-2">Existing Projects ({Array.isArray(projects) ? projects.length : 0})</h3>
            <ul className="space-y-2">
              {(Array.isArray(projects) ? projects : []).map(project => (
                <li key={project.id} className="text-sm p-2 bg-gray-50 rounded">
                  <div className="font-medium">{project.title}</div>
                  <div className="text-gray-600">Client: {(Array.isArray(clients) ? clients : []).find(c => c.id === project.clientId)?.name || 'Unknown'}</div>
                  {project.description && <div className="text-gray-600">{project.description}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Media upload */}
      <div className="border rounded-lg p-4">
        <h2 className="font-medium mb-3">Upload Media</h2>
        <div className="grid md:grid-cols-4 gap-3 items-center">
          <select className="border rounded px-3 py-2" value={uploadProjectId} onChange={e=>setUploadProjectId(e.target.value)}>
            <option value="">Select project *</option>
            {(Array.isArray(projects) ? projects : []).map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <select 
            className="border rounded px-3 py-2" 
            value={uploadType} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUploadType(e.target.value as UploadType)}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="before">Before</option>
            <option value="after">After</option>
          </select>
          <input type="file" className="border rounded px-3 py-2" onChange={e=>setUploadFile(e.target.files?.[0] || null)} />
          <button onClick={handleUpload} disabled={!uploadProjectId || !uploadFile || isUploading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
            {isUploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>

      {/* Milestones & Invoices */}
      <div className="border rounded-lg p-4">
        <h2 className="font-medium mb-3">Milestones & Invoices</h2>
        <div className="grid md:grid-cols-3 gap-3 items-end">
          <select className="border rounded px-3 py-2" value={selectedProjectForMgmt} onChange={e=>setSelectedProjectForMgmt(e.target.value)}>
            <option value="">Select project</option>
            {(Array.isArray(projects) ? projects : []).map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          {isMgmtLoading && <div className="text-sm opacity-70">Loading…</div>}
        </div>

        {selectedProjectForMgmt && (
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            {/* Milestones */}
            <div>
              <h3 className="font-medium mb-2">Milestones</h3>
              <div className="grid gap-2 mb-3">
                <input className="border rounded px-3 py-2" placeholder="Title" value={newMilestone.title} onChange={e=>setNewMilestone(v=>({...v, title: e.target.value}))} />
                <input className="border rounded px-3 py-2" type="date" value={newMilestone.dueDate} onChange={e=>setNewMilestone(v=>({...v, dueDate: e.target.value}))} />
                <button className="bg-black text-white rounded px-4 py-2 w-fit disabled:opacity-50" onClick={addMilestone} disabled={!newMilestone.title.trim()}>Add Milestone</button>
              </div>
              <ul className="space-y-2">
                {milestones.map(m => (
                  <li key={m.id} className="text-sm p-2 border rounded">
                    <div className="font-medium">{m.title}</div>
                    <div className="opacity-75">Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '—'}</div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Invoices */}
            <div>
              <h3 className="font-medium mb-2">Invoices</h3>
              <div className="grid gap-2 mb-3">
                <input className="border rounded px-3 py-2" placeholder="Amount (cents)" value={newInvoice.amountCents} onChange={e=>setNewInvoice(v=>({...v, amountCents: e.target.value}))} />
                <select className="border rounded px-3 py-2" value={newInvoice.status} onChange={e=>setNewInvoice(v=>({...v, status: e.target.value}))}>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
                <input className="border rounded px-3 py-2" type="date" value={newInvoice.issuedAt} onChange={e=>setNewInvoice(v=>({...v, issuedAt: e.target.value}))} />
                <button className="bg-black text-white rounded px-4 py-2 w-fit disabled:opacity-50" onClick={addInvoice} disabled={!newInvoice.amountCents}>Add Invoice</button>
              </div>
              <ul className="space-y-2">
                {invoices.map(inv => (
                  <li key={inv.id} className="text-sm p-2 border rounded">
                    <div className="font-medium">{(inv.amountCents/100).toLocaleString(undefined,{style:'currency',currency:'USD'})}</div>
                    <div className="opacity-75">Status: {inv.status} · Issued: {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—'}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
