"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthInstance, signOut } from "@/lib/firebase";
import { getDb } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { isUserAdmin } from "@/lib/auth-utils";
import type { User } from "firebase/auth";
import Link from "next/link";

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
  clientId: string;
  clientName: string;
  status: "planning" | "in-progress" | "completed" | "on-hold";
  startDate: Date;
  endDate: Date;
  budget: number;
  progress: number;
}

interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  pendingQuotes: number;
  upcomingDeadlines: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    pendingQuotes: 0,
    upcomingDeadlines: 0,
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "clients" | "projects" | "analytics"
  >("overview");
  const [recentOrders, setRecentOrders] = useState<
    Array<{
      id: string;
      customerEmail: string;
      amountTotal: number;
      paymentStatus: string;
      createdAt: Date;
      items?: Array<{ id: string; name: string; price: number; quantity: number; image?: string }>;
    }>
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const router = useRouter();

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
          console.log(
            "Custom claims check failed, using fallback methods:",
            error
          );
        }

        // Method 3: Check session token from cookies
        const cookies = document.cookie;
        if (cookies.includes("-admin")) {
          isAdmin = true;
        }

        if (isAdmin) {
          setUser(user);
          await loadDashboardData();
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

  const loadDashboardData = async () => {
    try {
      const db = getDb();

      // Load clients
      const clientsSnapshot = await getDocs(collection(db, "clients"));
      const clientsData = clientsSnapshot.docs.map((doc) => {
        const data = doc.data();

        // Helper function to safely convert to Date
        const safeDate = (dateValue: unknown): Date => {
          if (!dateValue) return new Date();
          if (dateValue instanceof Date) return dateValue;
          if (
            dateValue &&
            typeof dateValue === "object" &&
            "toDate" in dateValue &&
            typeof (dateValue as { toDate: () => Date }).toDate === "function"
          ) {
            return (dateValue as { toDate: () => Date }).toDate();
          }
          if (typeof dateValue === "string" || typeof dateValue === "number") {
            return new Date(dateValue);
          }
          return new Date();
        };

        return {
          id: doc.id,
          ...data,
          createdAt: safeDate(data.createdAt),
          lastContact: safeDate(data.lastContact),
        };
      }) as Client[];
      setClients(clientsData);

      // Load projects
      const projectsSnapshot = await getDocs(collection(db, "projects"));
      console.log(
        "Projects snapshot:",
        projectsSnapshot.docs.length,
        "documents"
      );
      const projectsData = projectsSnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Project data:", doc.id, data);
        console.log("Start date type:", typeof data.startDate, data.startDate);
        console.log("End date type:", typeof data.endDate, data.endDate);

        // Helper function to safely convert to Date
        const safeDate = (dateValue: unknown): Date => {
          if (!dateValue) return new Date();
          if (dateValue instanceof Date) return dateValue;
          if (
            dateValue &&
            typeof dateValue === "object" &&
            "toDate" in dateValue &&
            typeof (dateValue as { toDate: () => Date }).toDate === "function"
          ) {
            return (dateValue as { toDate: () => Date }).toDate();
          }
          if (typeof dateValue === "string" || typeof dateValue === "number") {
            return new Date(dateValue);
          }
          return new Date();
        };

        const startDate = safeDate(data.startDate);
        const endDate = safeDate(data.endDate);

        console.log(
          "Converted start date:",
          startDate,
          "is Date:",
          startDate instanceof Date
        );
        console.log(
          "Converted end date:",
          endDate,
          "is Date:",
          endDate instanceof Date
        );

        return {
          id: doc.id,
          ...data,
          startDate,
          endDate,
        };
      }) as Project[];
      console.log("Processed projects:", projectsData);
      setProjects(projectsData);

      // Load recent orders (latest 10)
      try {
        const res = await fetch("/api/orders?limit=10", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const safeDate = (dateValue: unknown): Date => {
            if (!dateValue) return new Date();
            if (dateValue instanceof Date) return dateValue;
            if (
              dateValue &&
              typeof dateValue === "object" &&
              "toDate" in dateValue &&
              typeof (dateValue as { toDate: () => Date }).toDate === "function"
            ) {
              return (dateValue as { toDate: () => Date }).toDate();
            }
            if (typeof dateValue === "string" || typeof dateValue === "number")
              return new Date(dateValue);
            return new Date();
          };
          const orders = (Array.isArray(data.orders) ? data.orders : []).map(
            (o: Record<string, unknown>) => ({
              id: String(o.id ?? ""),
              customerEmail: String(o.customerEmail ?? ""),
              amountTotal: Number(o.amountTotal ?? 0),
              paymentStatus: String(o.paymentStatus ?? "paid"),
              createdAt: safeDate((o as { createdAt?: unknown }).createdAt),
            })
          );
          setRecentOrders(orders);
        }
      } catch (_e) {}

      // Calculate stats
      const activeProjects = projectsData.filter(
        (p) => p.status === "in-progress"
      ).length;
      const completedProjects = projectsData.filter(
        (p) => p.status === "completed"
      ).length;
      const totalRevenue = projectsData
        .reduce((sum, p) => sum + (p.budget || 0), 0);

      setStats({
        totalClients: clientsData.length,
        activeProjects,
        completedProjects,
        totalRevenue,
        pendingQuotes: projectsData.filter((p) => p.status === "planning")
          .length,
        upcomingDeadlines: projectsData.filter((p) => {
          const endDate = new Date(p.endDate);
          const today = new Date();
          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7 && diffDays > 0;
        }).length,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        const db = getDb();
        await deleteDoc(doc(db, "projects", projectId));
        // Reload data to update the UI
        await loadDashboardData();
        console.log("Project deleted successfully");
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("Failed to delete project. Please try again.");
      }
    }
  };

  const editProject = (project: Project) => {
    // Navigate to the manage page with the project ID
    router.push(`/admin/manage?editProject=${project.id}`);
  };

  const uploadExistingServices = async () => {
    if (
      confirm(
        "This will upload the hardcoded services to the database. Continue?"
      )
    ) {
      const hardcodedServices = [
        {
          title: "Kitchen Remodeling",
          description:
            "Transform your kitchen into the heart of your home with our expert remodeling services. We handle everything from concept to completion.",
          features: [
            "Custom cabinetry and storage solutions",
            "Countertop installation and replacement",
            "Appliance integration and upgrades",
            "Lighting design and installation",
            "Flooring and backsplash options",
          ],
          iconColor: "blue",
          iconPath:
            "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
          isActive: true,
          order: 1,
        },
        {
          title: "Bathroom Renovation",
          description:
            "Create your dream bathroom with our comprehensive renovation services. We specialize in both aesthetic and functional improvements.",
          features: [
            "Full bathroom remodeling and design",
            "Shower and tub installation",
            "Vanity and fixture upgrades",
            "Tile work and flooring",
            "Plumbing and electrical updates",
          ],
          iconColor: "green",
          iconPath:
            "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
          isActive: true,
          order: 2,
        },
        {
          title: "Home Additions",
          description:
            "Expand your living space with our home addition services. We seamlessly integrate new spaces with your existing home design.",
          features: [
            "Room additions and extensions",
            "Second story additions",
            "Sunroom and porch construction",
            "Garage conversions",
            "Basement finishing",
          ],
          iconColor: "purple",
          iconPath:
            "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
          isActive: true,
          order: 3,
        },
        {
          title: "Custom Carpentry",
          description:
            "Add unique character to your home with our custom carpentry services. From built-ins to decorative elements, we bring your vision to life.",
          features: [
            "Custom built-in furniture",
            "Crown molding and trim work",
            "Wainscoting and paneling",
            "Custom doors and windows",
            "Decorative woodwork",
          ],
          iconColor: "orange",
          iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
          isActive: true,
          order: 4,
        },
        {
          title: "Project Management",
          description:
            "Let us handle the complexity of your renovation project. Our experienced project managers ensure smooth execution from start to finish.",
          features: [
            "Comprehensive project planning",
            "Timeline management and coordination",
            "Subcontractor coordination",
            "Quality control and inspections",
            "Communication and updates",
          ],
          iconColor: "red",
          iconPath:
            "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
          isActive: true,
          order: 5,
        },
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
        alert(
          "Services uploaded successfully! You can now manage them in the Services section."
        );
        // Optionally reload dashboard data
        await loadDashboardData();
      } catch (error) {
        console.error("Error uploading services:", error);
        alert("Failed to upload services. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(getAuthInstance());
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const db = getDb();
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, { status: newStatus });
      await loadDashboardData(); // Reload data
    } catch (error) {
      console.error("Error updating project status:", error);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900/40 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/40 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">
                Welcome back, {user?.email}
              </p>
            </div>

            {/* Desktop Button Grid */}
            <div className="hidden lg:flex items-center space-x-2">
              <button
                onClick={() => router.push("/admin/manage")}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Manage Content
              </button>
              <button
                onClick={() => router.push("/admin/leads")}
                className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                Manage Leads
              </button>
              <button
                onClick={() => router.push("/admin/services")}
                className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Manage Services
              </button>
              <button
                onClick={() => router.push("/admin/users")}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Manage Users
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Logout
              </button>
            </div>

            {/* Mobile Button Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:hidden gap-2">
              <button
                onClick={() => router.push("/admin/manage")}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs"
              >
                Content
              </button>
              <button
                onClick={() => router.push("/admin/leads")}
                className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-xs"
              >
                Leads
              </button>
              <button
                onClick={() => router.push("/admin/services")}
                className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-xs"
              >
                Services
              </button>
              <button
                onClick={() => router.push("/admin/users")}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs"
              >
                Users
              </button>
              {/* <button
                onClick={uploadExistingServices}
                className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors text-xs"
              >
                Upload
              </button> */}
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-xs"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto space-x-4 sm:space-x-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "clients", label: "Clients" },
              { id: "projects", label: "Projects" },
              { id: "analytics", label: "Analytics" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as "overview" | "clients" | "projects" | "analytics"
                  )
                }
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM7 10a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-400">
                      Total Clients
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white dark:text-white dark:text-white">
                      {stats.totalClients}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-400">
                      Active Projects
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white dark:text-white dark:text-white">
                      {stats.activeProjects}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white dark:text-white">
                      ${stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pending Quotes
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white dark:text-white">
                      {stats.pendingQuotes}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Upcoming Deadlines
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white dark:text-white">
                      {stats.upcomingDeadlines}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Completed Projects
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white dark:text-white">
                      {stats.completedProjects}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Recent Projects
                  </h3>
                </div>
                <div className="p-6">
                  {projects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {project.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {project.clientName}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          project.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : project.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : project.status === "planning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {project.status.replace("-", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Recent Clients
                  </h3>
                </div>
                <div className="p-6">
                  {clients.slice(0, 5).map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {client.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{client.email}</p>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {client.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow xl:col-span-2">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Recent Orders
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Last 10</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-900/40">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-6 text-center text-gray-500 dark:text-gray-400"
                          >
                            No recent orders.
                          </td>
                        </tr>
                      ) : (
                        recentOrders.map((o) => (
                          <tr key={o.id}>
                            <td className="px-6 py-3 text-sm text-blue-600 break-all">
                              <Link 
                                href={`/admin/orders/${o.id}?data=${encodeURIComponent(JSON.stringify({
                                  id: o.id,
                                  customerEmail: o.customerEmail,
                                  amountTotal: o.amountTotal,
                                  paymentStatus: o.paymentStatus,
                                  createdAt: o.createdAt,
                                  items: o.items || []
                                }))}`}
                              >
                                {o.id}
                              </Link>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">
                              {o.customerEmail}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {o.createdAt.toLocaleString()}
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  o.paymentStatus === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {o.paymentStatus}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <Link href={`/project/proj-${o.id}`} className="text-blue-600 hover:underline">
                                View Project
                              </Link>
                            </td>
                            <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
                              ${(o.amountTotal / 100).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
                Client Management
              </h2>
              <button
                onClick={() => router.push("/admin/manage")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Add New Client
              </button>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Projects
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map((client) => {
                      const clientProjects = projects.filter(
                        (p) => p.clientId === client.id
                      );
                      return (
                        <tr key={client.id}>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {client.name}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                {client.address}
                              </div>
                              <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {client.email}
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {client.email}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {client.phone}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {clientProjects.length} projects
                            </span>
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {client.createdAt.toLocaleDateString()}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-3">
                              <button className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm">
                                Edit
                              </button>
                              <button className="text-red-600 hover:text-red-900 text-xs sm:text-sm">
                                Delete
                              </button>
                            </div>
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
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
                Project Management
              </h2>
              <button
                onClick={() => router.push("/admin/manage")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Add New Project
              </button>
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:w-auto w-full"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Timeline
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                        >
                          <div className="flex flex-col items-center">
                            <svg
                              className="w-12 h-12 text-gray-400 mb-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              No projects found
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                              {projects.length === 0
                                ? "You haven't created any projects yet. Click 'Add New Project' to get started."
                                : "No projects match your current search or filter criteria."}
                            </p>
                            {projects.length === 0 && (
                              <button
                                onClick={() => router.push("/admin/manage")}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Create Your First Project
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((project) => (
                        <tr key={project.id}>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {project.title}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                ID: {project.id}
                              </div>
                              <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {project.clientName}
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {project.clientName}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <select
                              value={project.status}
                              onChange={(e) =>
                                updateProjectStatus(project.id, e.target.value)
                              }
                              className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${
                                project.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : project.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : project.status === "planning"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <option value="planning">Planning</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="on-hold">On Hold</option>
                            </select>
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${project.progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {project.progress || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            ${project.budget?.toLocaleString() || "0"}
                          </td>
                          <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div>{project.startDate.toLocaleDateString()}</div>
                            <div>to {project.endDate.toLocaleDateString()}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-3">
                              <button
                                onClick={() => editProject(project)}
                                className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteProject(project.id)}
                                className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
              Business Analytics
            </h2>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white dark:text-white mb-4">
                  Project Status Distribution
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      status: "Planning",
                      count: projects.filter((p) => p.status === "planning")
                        .length,
                      color: "bg-yellow-500",
                    },
                    {
                      status: "In Progress",
                      count: projects.filter((p) => p.status === "in-progress")
                        .length,
                      color: "bg-blue-500",
                    },
                    {
                      status: "Completed",
                      count: projects.filter((p) => p.status === "completed")
                        .length,
                      color: "bg-green-500",
                    },
                    {
                      status: "On Hold",
                      count: projects.filter((p) => p.status === "on-hold")
                        .length,
                      color: "bg-gray-50 dark:bg-gray-900/400",
                    },
                  ].map((item) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${item.color} mr-3`}
                        ></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.status}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white dark:text-white mb-4">
                  Revenue Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">
                      ${stats.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Average Project Value
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      $
                      {stats.completedProjects > 0
                        ? Math.round(
                            stats.totalRevenue / stats.completedProjects
                          ).toLocaleString()
                        : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Completion Rate
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {projects.length > 0
                        ? Math.round(
                            (stats.completedProjects / projects.length) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white dark:text-white mb-4">
                Recent Activity Timeline
              </h3>
              <div className="space-y-4">
                {projects.slice(0, 10).map((project) => (
                  <div key={project.id} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Status changed to {project.status} •{" "}
                        {project.startDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
