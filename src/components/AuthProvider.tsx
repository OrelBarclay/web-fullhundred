"use client";
import { useEffect, useState } from "react";
import { getAuthInstance, signOut } from "@/lib/firebase";
import Link from "next/link";
import type { User } from "firebase/auth";

export default function AuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        // Check if user is admin
        try {
          const idToken = await user.getIdToken();
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          if (response.ok) {
            const { isAdmin: adminStatus } = await response.json();
            setIsAdmin(adminStatus);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    try {
      await signOut(getAuthInstance());
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <>
      {!isLoading && (
        <>
          {user ? (
            <>
              <Link href="/profile" className="hover:underline">Profile</Link>
              {isAdmin ? (
                <Link href="/admin" className="hover:underline">Admin</Link>
              ) : (
                <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              )}
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="hover:underline">Login</Link>
          )}
        </>
      )}
    </>
  );
}
