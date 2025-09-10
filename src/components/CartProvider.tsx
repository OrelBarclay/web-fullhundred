"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { getAuthInstance, getDb } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
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

  // Load cart from database when user changes
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      // Load from Firestore for authenticated users
      const db = getDb();
      const cartRef = doc(db, 'carts', user.uid);
      
      const unsubscribe = onSnapshot(cartRef, async (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const dbItems = data.items || [];
          
          // Check if there are items in localStorage to merge
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const localItems = JSON.parse(raw);
              if (localItems.length > 0) {
                // Merge localStorage cart with database cart
                const mergedItems = mergeCarts(dbItems, localItems);
                setItems(mergedItems);
                
                // Save merged cart to database
                await setDoc(cartRef, {
                  items: mergedItems,
                  updatedAt: new Date(),
                  userId: user.uid
                });
                
                // Clear localStorage after merge
                localStorage.removeItem(STORAGE_KEY);
                return;
              }
            }
          } catch (error) {
            console.error("Error merging carts:", error);
          }
          
          setItems(dbItems);
        } else {
          // No cart in database, check localStorage
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const localItems = JSON.parse(raw);
              setItems(localItems);
              
              // Save localStorage cart to database
              await setDoc(cartRef, {
                items: localItems,
                updatedAt: new Date(),
                userId: user.uid
              });
              
              // Clear localStorage after saving
              localStorage.removeItem(STORAGE_KEY);
            } else {
              setItems([]);
            }
          } catch (error) {
            console.error("Error loading from localStorage:", error);
            setItems([]);
          }
        }
      }, (error) => {
        console.error("Error loading cart:", error);
        // Fallback to localStorage
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) setItems(JSON.parse(raw));
        } catch {}
      });

      return () => unsubscribe();
    } else {
      // Load from localStorage for anonymous users
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch {}
    }
  }, [user, isLoading]);

  // Save cart to database when items change
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      // Save to Firestore for authenticated users
      const db = getDb();
      const cartRef = doc(db, 'carts', user.uid);
      
      setDoc(cartRef, {
        items,
        updatedAt: new Date(),
        userId: user.uid
      }).catch((error) => {
        console.error("Error saving cart:", error);
        // Fallback to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {}
      });
    } else {
      // Save to localStorage for anonymous users
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
          console.error('Failed to add item to cart in database');
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
        console.error('Error adding item to cart:', error);
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
          console.error('Failed to remove item from cart in database');
          // Fallback to local state
          setItems((prev) => prev.filter((p) => p.id !== id));
        }
      } catch (error) {
        console.error('Error removing item from cart:', error);
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
          console.error('Failed to clear cart in database');
          // Fallback to local state
          setItems([]);
        }
      } catch (error) {
        console.error('Error clearing cart:', error);
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
          console.error('Failed to update item quantity in database');
          // Fallback to local state
          setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)));
        }
      } catch (error) {
        console.error('Error updating item quantity:', error);
        // Fallback to local state
        setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)));
      }
    } else {
      // Update local state for anonymous users
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)));
    }
  }, [user]);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(() => ({ items, addItem, removeItem, clear, setQuantity, subtotal }), [items, subtotal, addItem, removeItem, clear, setQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}


