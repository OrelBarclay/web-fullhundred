"use client";
import { useEffect, useState } from "react";
import type { Client, Project } from "@/server/db/schema";

export default function AdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
  const [newProject, setNewProject] = useState({ clientId: "", title: "", description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const [clientsData, projectsData] = await Promise.all([
        fetch("/api/clients").then(r => r.json()),
        fetch("/api/projects").then(r => r.json())
      ]);
      setClients(clientsData);
      setProjects(projectsData);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
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
        setClients([client, ...clients]);
        setNewClient({ name: "", email: "", phone: "" });
      } else {
        setError("Failed to create client");
      }
    } catch (err) {
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
        setProjects([project, ...projects]);
        setNewProject({ clientId: "", title: "", description: "" });
      } else {
        setError("Failed to create project");
      }
    } catch (err) {
      setError("Failed to create project");
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
            <h3 className="font-medium mb-2">Existing Clients ({clients.length})</h3>
            <ul className="space-y-2">
              {clients.map(client => (
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
              {clients.map(client => (
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
            <h3 className="font-medium mb-2">Existing Projects ({projects.length})</h3>
            <ul className="space-y-2">
              {projects.map(project => (
                <li key={project.id} className="text-sm p-2 bg-gray-50 rounded">
                  <div className="font-medium">{project.title}</div>
                  <div className="text-gray-600">Client: {clients.find(c => c.id === project.clientId)?.name || 'Unknown'}</div>
                  {project.description && <div className="text-gray-600">{project.description}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
