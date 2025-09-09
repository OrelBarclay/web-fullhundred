"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthInstance } from "@/lib/firebase";
import { getDb } from "@/lib/firebase";
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { isUserAdmin } from "@/lib/auth-utils";
import type { User } from "firebase/auth";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  lastContact: Date;
}

interface Project {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  status: "planning" | "in-progress" | "completed" | "on-hold";
  startDate: Date;
  endDate: Date;
  budget: number;
  progress: number;
  beforeImages?: string[];
  afterImages?: string[];
  beforeVideos?: string[];
  afterVideos?: string[];
}

export default function ManageContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<"clients" | "projects">("clients");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Form states
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    clientId: "",
    status: "planning" as "planning" | "in-progress" | "completed" | "on-hold",
    startDate: "",
    endDate: "",
    budget: "",
    progress: "0",
    beforeImages: [] as File[],
    afterImages: [] as File[],
    beforeVideos: [] as File[],
    afterVideos: [] as File[]
  });

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Check if user is admin using multiple methods
        let isAdmin = false;
        
        // Method 1: Check email (temporary fallback)
        if (user.email === "coolbarclay@gmail.com") {
          isAdmin = true;
        }
        
        // Method 2: Try custom claims (may fail due to Admin SDK issues)
        try {
          const isAdminFromClaims = await isUserAdmin();
          if (isAdminFromClaims) {
            isAdmin = true;
          }
        } catch (error) {
          console.log('Custom claims check failed, using fallback methods:', error);
        }
        
        // Method 3: Check session token from cookies
        const cookies = document.cookie;
        if (cookies.includes('-admin')) {
          isAdmin = true;
        }
        
        if (isAdmin) {
          setUser(user);
          await loadData();
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/login");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadData = async () => {
    try {
      const db = getDb();
      
      // Load clients
      const clientsSnapshot = await getDocs(collection(db, "clients"));
      const clientsData = clientsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
          lastContact: data.lastContact?.toDate ? data.lastContact.toDate() : (data.lastContact || new Date())
        };
      }) as Client[];
      setClients(clientsData);

      // Load projects
      const projectsSnapshot = await getDocs(collection(db, "projects"));
      const projectsData = projectsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate ? data.startDate.toDate() : (data.startDate || new Date()),
          endDate: data.endDate?.toDate ? data.endDate.toDate() : (data.endDate || new Date())
        };
      }) as Project[];
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      const db = getDb();
      
      if (editingClient) {
        // Update existing client
        const clientRef = doc(db, "clients", editingClient.id);
        await updateDoc(clientRef, {
          ...clientForm,
          updatedAt: new Date()
        });
        setEditingClient(null);
      } else {
        // Create new client
        await addDoc(collection(db, "clients"), {
          ...clientForm,
          createdAt: new Date(),
          lastContact: new Date()
        });
      }

      // Reset form and reload data
      setClientForm({ name: "", email: "", phone: "", address: "" });
      await loadData();
    } catch (error) {
      console.error("Error saving client:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to upload files to Cloudinary
  const uploadFilesToCloudinary = async (files: File[], folder: string) => {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      
      const response = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }
      
      const data = await response.json();
      return data.secure_url;
    });
    
    return Promise.all(uploadPromises);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim() || !projectForm.clientId) return;

    setIsSubmitting(true);
    try {
      const db = getDb();
      const selectedClient = clients.find(c => c.id === projectForm.clientId);
      
      // Upload media files to Cloudinary
      const projectId = editingProject?.id || `temp-${Date.now()}`;
      const mediaUrls = {
        beforeImages: [] as string[],
        afterImages: [] as string[],
        beforeVideos: [] as string[],
        afterVideos: [] as string[]
      };

      try {
        if (projectForm.beforeImages.length > 0) {
          console.log('Uploading before images...');
          mediaUrls.beforeImages = await uploadFilesToCloudinary(
            projectForm.beforeImages, 
            `projects/${projectId}/before/images`
          );
        }
        
        if (projectForm.afterImages.length > 0) {
          console.log('Uploading after images...');
          mediaUrls.afterImages = await uploadFilesToCloudinary(
            projectForm.afterImages, 
            `projects/${projectId}/after/images`
          );
        }
        
        if (projectForm.beforeVideos.length > 0) {
          console.log('Uploading before videos...');
          mediaUrls.beforeVideos = await uploadFilesToCloudinary(
            projectForm.beforeVideos, 
            `projects/${projectId}/before/videos`
          );
        }
        
        if (projectForm.afterVideos.length > 0) {
          console.log('Uploading after videos...');
          mediaUrls.afterVideos = await uploadFilesToCloudinary(
            projectForm.afterVideos, 
            `projects/${projectId}/after/videos`
          );
        }
      } catch (uploadError) {
        console.error('Error uploading media files:', uploadError);
        alert('Error uploading media files. Please try again.');
        return;
      }

      // Prepare project data without File objects
      const projectData = {
        title: projectForm.title,
        description: projectForm.description,
        clientId: projectForm.clientId,
        status: projectForm.status,
        budget: parseFloat(projectForm.budget) || 0,
        progress: parseInt(projectForm.progress) || 0,
        clientName: selectedClient?.name || "",
        startDate: projectForm.startDate ? new Date(projectForm.startDate) : new Date(),
        endDate: projectForm.endDate ? new Date(projectForm.endDate) : new Date(),
        // Only include media URLs, not File objects
        beforeImages: mediaUrls.beforeImages,
        afterImages: mediaUrls.afterImages,
        beforeVideos: mediaUrls.beforeVideos,
        afterVideos: mediaUrls.afterVideos
      };

      console.log('Project data being saved:', projectData);
      console.log('Media URLs:', mediaUrls);
      
      if (editingProject) {
        // Update existing project
        const projectRef = doc(db, "projects", editingProject.id);
        await updateDoc(projectRef, {
          ...projectData,
          updatedAt: new Date()
        });
        setEditingProject(null);
      } else {
        // Create new project
        await addDoc(collection(db, "projects"), {
          ...projectData,
          createdAt: new Date()
        });
      }

      // Reset form and reload data
      setProjectForm({
        title: "",
        description: "",
        clientId: "",
        status: "planning",
        startDate: "",
        endDate: "",
        budget: "",
        progress: "0",
        beforeImages: [],
        afterImages: [],
        beforeVideos: [],
        afterVideos: []
      });
      await loadData();
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const editClient = (client: Client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address
    });
  };

  const editProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      clientId: project.clientId,
      status: project.status,
      startDate: project.startDate.toISOString().split('T')[0],
      endDate: project.endDate.toISOString().split('T')[0],
      budget: project.budget?.toString() || "",
      progress: project.progress?.toString() || "0",
      beforeImages: [],
      afterImages: [],
      beforeVideos: [],
      afterVideos: []
    });
  };

  const deleteClient = async (clientId: string) => {
    if (confirm("Are you sure you want to delete this client? This will also delete all associated projects.")) {
      try {
        const db = getDb();
        
        // Delete associated projects first
        const clientProjects = projects.filter(p => p.clientId === clientId);
        for (const project of clientProjects) {
          await deleteDoc(doc(db, "projects", project.id));
        }
        
        // Delete client
        await deleteDoc(doc(db, "clients", clientId));
        await loadData();
      } catch (error) {
        console.error("Error deleting client:", error);
      }
    }
  };

  const deleteProject = async (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        const db = getDb();
        await deleteDoc(doc(db, "projects", projectId));
        await loadData();
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  const cancelEdit = () => {
    setEditingClient(null);
    setEditingProject(null);
    setClientForm({ name: "", email: "", phone: "", address: "" });
    setProjectForm({
      title: "",
      description: "",
      clientId: "",
      status: "planning",
      startDate: "",
      endDate: "",
      budget: "",
      progress: "0",
      beforeImages: [],
      afterImages: [],
      beforeVideos: [],
      afterVideos: []
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
              <p className="text-sm text-gray-600">Manage clients and projects</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/admin")}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: "clients", label: "Clients" },
              { id: "projects", label: "Projects" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "clients" | "projects")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Clients Tab */}
        {activeTab === "clients" && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingClient ? "Edit Client" : "Add New Client"}
              </h2>
              
              <form onSubmit={handleClientSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={clientForm.name}
                      onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Client name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={clientForm.email}
                      onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="client@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={clientForm.address}
                      onChange={(e) => setClientForm(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : editingClient ? "Update Client" : "Add Client"}
                  </button>
                  
                  {editingClient && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Clients List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Clients ({clients.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => {
                      const clientProjects = projects.filter(p => p.clientId === client.id);
                      return (
                        <tr key={client.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{client.name}</div>
                              <div className="text-sm text-gray-500">{client.address}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{client.email}</div>
                            <div className="text-sm text-gray-500">{client.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {clientProjects.length} projects
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.createdAt.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => editClient(client)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteClient(client.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingProject ? "Edit Project" : "Add New Project"}
              </h2>
              
              <form onSubmit={handleProjectSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={projectForm.title}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Project title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                    <select
                      required
                      value={projectForm.clientId}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, clientId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={projectForm.status}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, status: e.target.value as "planning" | "in-progress" | "completed" | "on-hold" }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="planning">Planning</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on-hold">On Hold</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                    <input
                      type="number"
                      value={projectForm.budget}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={projectForm.startDate}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={projectForm.endDate}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={projectForm.progress}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, progress: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={projectForm.description}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Project description..."
                  />
                </div>

                {/* Media Upload Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Project Media</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before Images */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Before Images</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setProjectForm(prev => ({ ...prev, beforeImages: [...prev.beforeImages, ...files] }));
                          }}
                          className="hidden"
                          id="before-images"
                        />
                        <label
                          htmlFor="before-images"
                          className="cursor-pointer flex flex-col items-center justify-center py-4"
                        >
                          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">Click to upload before images</span>
                        </label>
                        {projectForm.beforeImages.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-2">{projectForm.beforeImages.length} file(s) selected</p>
                            <div className="flex flex-wrap gap-2">
                              {projectForm.beforeImages.map((file, index) => (
                                <div key={index} className="flex items-center bg-blue-50 px-2 py-1 rounded text-xs">
                                  <span className="truncate max-w-20">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProjectForm(prev => ({
                                        ...prev,
                                        beforeImages: prev.beforeImages.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="ml-1 text-red-500 hover:text-red-700"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* After Images */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">After Images</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setProjectForm(prev => ({ ...prev, afterImages: [...prev.afterImages, ...files] }));
                          }}
                          className="hidden"
                          id="after-images"
                        />
                        <label
                          htmlFor="after-images"
                          className="cursor-pointer flex flex-col items-center justify-center py-4"
                        >
                          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">Click to upload after images</span>
                        </label>
                        {projectForm.afterImages.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-2">{projectForm.afterImages.length} file(s) selected</p>
                            <div className="flex flex-wrap gap-2">
                              {projectForm.afterImages.map((file, index) => (
                                <div key={index} className="flex items-center bg-green-50 px-2 py-1 rounded text-xs">
                                  <span className="truncate max-w-20">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProjectForm(prev => ({
                                        ...prev,
                                        afterImages: prev.afterImages.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="ml-1 text-red-500 hover:text-red-700"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Before Videos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Before Videos</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setProjectForm(prev => ({ ...prev, beforeVideos: [...prev.beforeVideos, ...files] }));
                          }}
                          className="hidden"
                          id="before-videos"
                        />
                        <label
                          htmlFor="before-videos"
                          className="cursor-pointer flex flex-col items-center justify-center py-4"
                        >
                          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">Click to upload before videos</span>
                        </label>
                        {projectForm.beforeVideos.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-2">{projectForm.beforeVideos.length} file(s) selected</p>
                            <div className="flex flex-wrap gap-2">
                              {projectForm.beforeVideos.map((file, index) => (
                                <div key={index} className="flex items-center bg-blue-50 px-2 py-1 rounded text-xs">
                                  <span className="truncate max-w-20">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProjectForm(prev => ({
                                        ...prev,
                                        beforeVideos: prev.beforeVideos.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="ml-1 text-red-500 hover:text-red-700"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* After Videos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">After Videos</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setProjectForm(prev => ({ ...prev, afterVideos: [...prev.afterVideos, ...files] }));
                          }}
                          className="hidden"
                          id="after-videos"
                        />
                        <label
                          htmlFor="after-videos"
                          className="cursor-pointer flex flex-col items-center justify-center py-4"
                        >
                          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">Click to upload after videos</span>
                        </label>
                        {projectForm.afterVideos.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-2">{projectForm.afterVideos.length} file(s) selected</p>
                            <div className="flex flex-wrap gap-2">
                              {projectForm.afterVideos.map((file, index) => (
                                <div key={index} className="flex items-center bg-green-50 px-2 py-1 rounded text-xs">
                                  <span className="truncate max-w-20">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProjectForm(prev => ({
                                        ...prev,
                                        afterVideos: prev.afterVideos.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="ml-1 text-red-500 hover:text-red-700"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Uploading media and saving..." : editingProject ? "Update Project" : "Add Project"}
                  </button>
                  
                  {editingProject && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Projects List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Projects ({projects.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{project.title}</div>
                            <div className="text-sm text-gray-500">{project.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            project.status === "completed" ? "bg-green-100 text-green-800" :
                            project.status === "in-progress" ? "bg-blue-100 text-blue-800" :
                            project.status === "planning" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {project.status.replace("-", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${project.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{project.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${project.budget?.toLocaleString() || "0"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => editProject(project)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteProject(project.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
