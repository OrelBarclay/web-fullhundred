"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { getAuthInstance } from "@/lib/firebase";
import type { User } from "firebase/auth";

export type CartItem = {
  id: string;
  name: string;
  price: number; // cents
  image?: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  clearLocal: () => void;
  setQuantity: (id: string, qty: number) => Promise<void>;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "fh_cart_v1";

// Helper function to merge two carts intelligently
function mergeCarts(dbItems: CartItem[], localItems: CartItem[]): CartItem[] {
  const merged = [...dbItems];
  
  localItems.forEach(localItem => {
    const existingIndex = merged.findIndex(item => item.id === localItem.id);
    if (existingIndex >= 0) {
      // Item exists in both, add quantities
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: merged[existingIndex].quantity + localItem.quantity
      };
    } else {
      // Item only exists in localStorage, add it
      merged.push(localItem);
    }
  });
  
  return merged;
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to auth state changes
  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load cart via API when user changes (single fetch), and merge local storage if present
  useEffect(() => {
    if (isLoading) return;
    
    async function loadForAuthenticatedUser(authUser: User) {
      try {
        // Fetch current cart from API
        const response = await fetch(`/api/cart?userId=${authUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          const dbItems: CartItem[] = Array.isArray(data.items) ? data.items : [];

          // Attempt local merge
          let merged = dbItems;
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const localItems: CartItem[] = JSON.parse(raw);
              if (Array.isArray(localItems) && localItems.length > 0) {
                merged = mergeCarts(dbItems, localItems);
                // Push merged items to DB via API by adding each delta from local
                for (const localItem of localItems) {
                  const existing = dbItems.find((i) => i.id === localItem.id);
                  const deltaQty = existing ? localItem.quantity : localItem.quantity; // always add local qty
                  if (deltaQty > 0) {
                    await fetch('/api/cart/add', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: authUser.uid, item: { id: localItem.id, name: localItem.name, price: localItem.price, image: localItem.image }, quantity: localItem.quantity })
                    });
                  }
                }
                // Clear local after merge
                localStorage.removeItem(STORAGE_KEY);
              }
            }
          } catch (err) {
            // Error merging local cart
          }

          // Re-fetch to ensure server is source of truth after merge
          const refetch = await fetch(`/api/cart?userId=${authUser.uid}`);
          if (refetch.ok) {
            const refreshed = await refetch.json();
            setItems(Array.isArray(refreshed.items) ? refreshed.items : merged);
          } else {
            setItems(merged);
          }
        } else {
          // If API fails, fallback to local
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) setItems(JSON.parse(raw)); else setItems([]);
        }
      } catch (error) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw)); else setItems([]);
      }
    }

    if (user) {
      loadForAuthenticatedUser(user);
    } else {
      // Anonymous user -> load from localStorage only
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw)); else setItems([]);
      } catch {
        setItems([]);
      }
    }
  }, [user, isLoading]);

  // Persist cart to localStorage for anonymous users when items change
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {}
    }
  }, [items, user, isLoading]);

  const addItem: CartContextValue["addItem"] = useCallback(async (item, qty = 1) => {
    if (user) {
      // Save to database for authenticated users
      try {
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, item, quantity: qty })
        });
        
        if (response.ok) {
          const data = await response.json();
          setItems(data.items);
        } else {
          // Fallback to local state
          setItems((prev) => {
            const existing = prev.find((p) => p.id === item.id);
            if (existing) {
              return prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + qty } : p));
            }
            return [...prev, { ...item, quantity: qty }];
          });
        }
      } catch (error) {
        // Fallback to local state
        setItems((prev) => {
          const existing = prev.find((p) => p.id === item.id);
          if (existing) {
            return prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + qty } : p));
          }
          return [...prev, { ...item, quantity: qty }];
        });
      }
    } else {
      // Update local state for anonymous users
      setItems((prev) => {
        const existing = prev.find((p) => p.id === item.id);
        if (existing) {
          return prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + qty } : p));
        }
        return [...prev, { ...item, quantity: qty }];
      });
    }
  }, [user]);

  const removeItem = useCallback(async (id: string) => {
    if (user) {
      // Remove from database for authenticated users
      try {
        const response = await fetch('/api/cart/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, itemId: id })
        });
        
        if (response.ok) {
          const data = await response.json();
          setItems(data.items);
        } else {
          // Fallback to local state
          setItems((prev) => prev.filter((p) => p.id !== id));
        }
      } catch (error) {
        // Fallback to local state
        setItems((prev) => prev.filter((p) => p.id !== id));
      }
    } else {
      // Update local state for anonymous users
      setItems((prev) => prev.filter((p) => p.id !== id));
    }
  }, [user]);
  const clear = useCallback(async () => {
    if (user) {
      // Clear cart in database for authenticated users
      try {
        const response = await fetch(`/api/cart?userId=${user.uid}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setItems([]);
        } else {
          // Fallback to local state
          setItems([]);
        }
      } catch (error) {
        // Fallback to local state
        setItems([]);
      }
    } else {
      // Update local state for anonymous users
      setItems([]);
    }
  }, [user]);
  const setQuantity = useCallback(async (id: string, qty: number) => {
    if (user) {
      // Update quantity in database for authenticated users
      try {
        const response = await fetch('/api/cart/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, itemId: id, quantity: qty })
        });
        
        if (response.ok) {
          const data = await response.json();
          setItems(data.items);
        } else {
          // Fallback to local state
          setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)));
        }
      } catch (error) {
        // Fallback to local state
        setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)));
      }
    } else {
      // Update local state for anonymous users
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)));
    }
  }, [user]);

  // Local-only clear (used on logout) to avoid deleting server cart
  const clearLocal = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(() => ({ items, addItem, removeItem, clear, clearLocal, setQuantity, subtotal }), [items, subtotal, addItem, removeItem, clear, clearLocal, setQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}


