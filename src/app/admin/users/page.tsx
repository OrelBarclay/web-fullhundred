"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthInstance } from "@/lib/firebase";
import { getDb } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { isUserAdmin } from "@/lib/auth-utils";
import type { User } from "firebase/auth";

interface UserData {
  id: string;
  uid?: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  isAdmin?: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  updatedAt: Date;
}

export default function UserManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Check if user is admin using custom claims and session token
        const isAdminFromClaims = await isUserAdmin();
        const isAdminFromEmail = user.email === "coolbarclay@gmail.com";
        const isAdmin = isAdminFromClaims || isAdminFromEmail;
        
        if (isAdmin) {
          setUser(user);
          await loadUsers();
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

  const loadUsers = async () => {
    try {
      const db = getDb();
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
          lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : (data.lastLoginAt || new Date()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date())
        };
      }) as UserData[];
      setUsers(usersData);
      console.log('Loaded users:', usersData);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/set-claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: userId,
          claims: {
            role: role,
            admin: role === "admin"
          }
        }),
      });

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, role, isAdmin: role === "admin" }
            : u
        ));
        setSelectedUser(null);
        setNewRole("");
        alert("User role updated successfully!");
      } else {
        const error = await response.json();
        alert(`Failed to update role: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user management...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-600">Manage user roles and permissions</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">All Users ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userData) => (
                  <tr key={userData.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{userData.displayName || "No name"}</div>
                        <div className="text-sm text-gray-500">{userData.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        userData.isAdmin ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {userData.role || "user"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userData.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userData.lastLoginAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => setSelectedUser(userData)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Change Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Change Role for {selectedUser.email}
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a role</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => updateUserRole(selectedUser.id, newRole)}
                    disabled={!newRole || isSubmitting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Updating..." : "Update Role"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setNewRole("");
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
