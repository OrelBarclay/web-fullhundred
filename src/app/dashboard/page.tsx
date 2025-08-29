"use client";
import { useState, useEffect } from "react";
import { getAuthInstance, signOut } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "firebase/auth";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        router.push("/login");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    try {
      await signOut(getAuthInstance());
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Welcome to Your Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                This is where you can view your project updates, track progress, and manage your account.
              </p>
              <div className="space-y-4">
                <Link
                  href="/portfolio"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  View Our Portfolio
                </Link>
                <br />
                <Link
                  href="/#quote"
                  className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                >
                  Request a Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
