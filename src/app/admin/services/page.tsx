"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthInstance, signOut } from "@/lib/firebase";
import { isUserAdmin } from "@/lib/auth-utils";
import type { User } from "firebase/auth";
import { Service, ServiceInput } from "@/server/db/schema";

export default function ServicesManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const router = useRouter();

  const [formData, setFormData] = useState<ServiceInput>({
    title: "",
    description: "",
    features: [""],
    iconColor: "blue",
    iconPath: "",
    isActive: true,
    order: 0
  });

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Check if user is admin
        let isAdmin = false;
        
        if (user.email === "coolbarclay@gmail.com") {
          isAdmin = true;
        }
        
        try {
          const isAdminFromClaims = await isUserAdmin();
          if (isAdminFromClaims) {
            isAdmin = true;
          }
        } catch (error) {
          console.log('Custom claims check failed, using fallback methods:', error);
        }
        
        const cookies = document.cookie;
        if (cookies.includes('-admin')) {
          isAdmin = true;
        }
        
        if (isAdmin) {
          setUser(user);
          await loadServices();
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

  const loadServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        // Convert Firestore timestamps to Date objects
        const servicesWithDates = data.map((service: Service) => ({
          ...service,
          createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
          updatedAt: service.updatedAt ? new Date(service.updatedAt) : new Date()
        }));
        setServices(servicesWithDates);
      } else {
        console.error("Failed to load services");
      }
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const handleInputChange = (field: keyof ServiceInput, value: string | boolean | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }));
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        features: newFeatures
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = isEditing ? "/api/services" : "/api/services";
      const method = isEditing ? "PUT" : "POST";
      
      const body = isEditing 
        ? { id: editingService?.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await loadServices();
        resetForm();
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Failed to save service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      features: [""],
      iconColor: "blue",
      iconPath: "",
      isActive: true,
      order: 0
    });
    setIsEditing(false);
    setEditingService(null);
  };

  const editService = (service: Service) => {
    setFormData({
      title: service.title,
      description: service.description,
      features: service.features,
      iconColor: service.iconColor,
      iconPath: service.iconPath,
      isActive: service.isActive,
      order: service.order
    });
    setEditingService(service);
    setIsEditing(true);
    setShowForm(true);
  };

  const deleteService = async (serviceId: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        const response = await fetch(`/api/services?id=${serviceId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await loadServices();
        } else {
          alert("Failed to delete service. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting service:", error);
        alert("Failed to delete service. Please try again.");
      }
    }
  };

  const uploadExistingServices = async () => {
    if (confirm("This will upload the hardcoded services to the database. Continue?")) {
      const hardcodedServices = [
        {
          title: "Kitchen Remodeling",
          description: "Transform your kitchen into the heart of your home with our expert remodeling services. We handle everything from concept to completion.",
          features: [
            "Custom cabinetry and storage solutions",
            "Countertop installation and replacement",
            "Appliance integration and upgrades",
            "Lighting design and installation",
            "Flooring and backsplash options"
          ],
          iconColor: "blue",
          iconPath: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
          isActive: true,
          order: 1
        },
        {
          title: "Bathroom Renovation",
          description: "Create your dream bathroom with our comprehensive renovation services. We specialize in both aesthetic and functional improvements.",
          features: [
            "Full bathroom remodeling and design",
            "Shower and tub installation",
            "Vanity and fixture upgrades",
            "Tile work and flooring",
            "Plumbing and electrical updates"
          ],
          iconColor: "green",
          iconPath: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
          isActive: true,
          order: 2
        },
        {
          title: "Home Additions",
          description: "Expand your living space with our home addition services. We seamlessly integrate new spaces with your existing home design.",
          features: [
            "Room additions and extensions",
            "Second story additions",
            "Sunroom and porch construction",
            "Garage conversions",
            "Basement finishing"
          ],
          iconColor: "purple",
          iconPath: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
          isActive: true,
          order: 3
        },
        {
          title: "Custom Carpentry",
          description: "Add unique character to your home with our custom carpentry services. From built-ins to decorative elements, we bring your vision to life.",
          features: [
            "Custom built-in furniture",
            "Crown molding and trim work",
            "Wainscoting and paneling",
            "Custom doors and windows",
            "Decorative woodwork"
          ],
          iconColor: "orange",
          iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
          isActive: true,
          order: 4
        },
        {
          title: "Project Management",
          description: "Let us handle the complexity of your renovation project. Our experienced project managers ensure smooth execution from start to finish.",
          features: [
            "Comprehensive project planning",
            "Timeline management and coordination",
            "Subcontractor coordination",
            "Quality control and inspections",
            "Communication and updates"
          ],
          iconColor: "red",
          iconPath: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
          isActive: true,
          order: 5
        }
      ];

      try {
        for (const service of hardcodedServices) {
          await fetch("/api/services", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(service),
          });
        }
        await loadServices();
        alert("Services uploaded successfully!");
      } catch (error) {
        console.error("Error uploading services:", error);
        alert("Failed to upload services. Please try again.");
      }
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === "all" || 
                         (filterActive === "active" && service.isActive) ||
                         (filterActive === "inactive" && !service.isActive);
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services management...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
              <p className="text-sm text-gray-600">Manage your service offerings</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/admin")}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={uploadExistingServices}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Upload Existing Services
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add New Service
              </button>
              <button
                onClick={async () => {
                  await signOut(getAuthInstance());
                  await fetch("/api/auth/logout", { method: "POST" });
                  router.push("/");
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Services</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Services List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Services ({filteredServices.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredServices.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">No services found</p>
                <p className="text-sm text-gray-500 mb-4">
                  {services.length === 0 
                    ? "You haven't created any services yet. Click 'Add New Service' to get started."
                    : "No services match your current search or filter criteria."
                  }
                </p>
                {services.length === 0 && (
                  <button
                    onClick={() => {
                      resetForm();
                      setShowForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Service
                  </button>
                )}
              </div>
            ) : (
              filteredServices.map((service) => (
                <div key={service.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full bg-${service.iconColor}-500`}></div>
                        <h3 className="text-lg font-medium text-gray-900">{service.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          service.isActive 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {service.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className="text-sm text-gray-500">Order: {service.order}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{service.description}</p>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          {service.features.length} features • 
                          Created {service.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => editService(service)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteService(service.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Service Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? "Edit Service" : "Add New Service"}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features *</label>
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Feature ${index + 1}`}
                        required
                      />
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Feature
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon Color *</label>
                    <select
                      value={formData.iconColor}
                      onChange={(e) => handleInputChange("iconColor", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="orange">Orange</option>
                      <option value="red">Red</option>
                      <option value="yellow">Yellow</option>
                      <option value="indigo">Indigo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => handleInputChange("order", parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon Path (SVG) *</label>
                  <textarea
                    value={formData.iconPath}
                    onChange={(e) => handleInputChange("iconPath", e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16..."
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange("isActive", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active (visible on website)
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : isEditing ? "Update Service" : "Create Service"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
