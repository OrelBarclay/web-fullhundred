"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthInstance, signOut } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import Link from 'next/link';
import DashboardProjects from '@/components/DashboardProjects';

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  startDate: Date;
  endDate: Date;
  budget: number;
  clientName: string;
  beforeImages?: string[];
  afterImages?: string[];
}

interface OrderItem { id: string; name: string; price: number; quantity: number; image?: string }
interface Order {
  id: string;
  customerEmail: string;
  amountTotal: number;
  paymentStatus: string;
  createdAt: string | Date;
  items?: OrderItem[];
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Helper function to safely convert dates
  const safeDate = (dateValue: unknown): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue && typeof (dateValue as { toDate: () => Date }).toDate === 'function') {
      return (dateValue as { toDate: () => Date }).toDate();
    }
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      return new Date(dateValue);
    }
    return new Date();
  };

  const loadDashboardData = useCallback(async (currentEmail: string) => {
    try {
      // Load recent orders for the user
      if (currentEmail) {
        const ordersRes = await fetch(`/api/orders?email=${encodeURIComponent(currentEmail)}&limit=50`, { cache: 'no-store' });
        if (ordersRes.ok) {
          const { orders } = await ordersRes.json();
          const processedOrders = (Array.isArray(orders) ? orders : []).map((raw: Record<string, unknown>) => ({
            id: String(raw.id ?? ''),
            customerEmail: String(raw.customerEmail ?? ''),
            amountTotal: Number(raw.amountTotal ?? 0),
            paymentStatus: String(raw.paymentStatus ?? 'paid'),
            createdAt: safeDate(raw.createdAt),
            items: Array.isArray((raw as { items?: unknown }).items) ? (raw as { items: OrderItem[] }).items : []
          })) as Order[];
          setOrders(processedOrders);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [user?.email]);

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        await loadDashboardData((u.email || '').toLowerCase());
        setIsLoading(false);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, loadDashboardData]);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin || false);
        }
      } catch (error) {
        setIsAdmin(false);
      }
    };

    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  // When an order is selected, scroll to the details panel after it renders
  useEffect(() => {
    if (selectedOrder) {
      const el = document.getElementById('order-details');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [selectedOrder]);

  // Calculate statistics for orders only
  const stats = {
    ordersCount: orders.length,
    revenueCents: orders.reduce((sum, o) => sum + (o.amountTotal || 0), 0),
    averageOrderValueCents: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + (o.amountTotal || 0), 0) / orders.length) : 0,
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow_sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Welcome back, {user?.displayName || user?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Revenue & Orders KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V4m0 12v4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue (30d)</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">${(stats.revenueCents / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18M9 7h12M9 11h12M9 15h12M3 19h18" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Orders</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.ordersCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-sky-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.866 0-7 1.79-7 4v2h14v-2c0-2.21-3.134-4-7-4z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Order Value</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">${(stats.averageOrderValueCents / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        {/* Projects Section */}
        <DashboardProjects userEmail={user?.email || null} isAdmin={isAdmin} />

        {/* Recent Orders */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
          {orders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-sm text-gray-600 dark:text-gray-300">
              No orders yet.
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text_left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg_white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.map((o) => (
                    <tr key={o.id} className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 ${selectedOrder?.id === o.id ? 'bg-gray-50 dark:bg-gray-700/40' : ''}`} onClick={() => setSelectedOrder(o)}>
                      <td className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400 break-all">
                        <a href="#order-details" className="hover:underline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedOrder(o); }}>
                          {o.id}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{new Date(o.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{o.paymentStatus || 'paid'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">${((o.amountTotal || 0) / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details Panel */}
        {selectedOrder && (
          <div id="order-details" className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Order Details</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-all">{selectedOrder.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{selectedOrder.paymentStatus}</span>
                <button onClick={() => setSelectedOrder(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">Close</button>
              </div>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                <p className="text-base text-gray-900 dark:text-white">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-base text-gray-900 dark:text-white">${((selectedOrder.amountTotal || 0) / 100).toFixed(2)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                <p className="text-base text-gray-900 dark:text-white break-all">{selectedOrder.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Linked Project</p>
                <Link href={`/project/proj-${selectedOrder.id}`} className="text-base text-blue-600 dark:text-blue-400 hover:underline break-all">proj-{selectedOrder.id}</Link>
              </div>
            </div>

            <div className="px-6 pb-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Items</h4>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/40">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg_white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedOrder.items.map((it) => (
                        <tr key={`${it.id}-${it.name}`}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{it.name}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">{it.quantity}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">${((it.price || 0) / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">No items recorded for this order.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
