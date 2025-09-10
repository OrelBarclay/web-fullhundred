"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const { items, setQuantity, removeItem, subtotal, clear } = useCart();

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 text-[color:var(--foreground)]">
      <h1 className="text-3xl font-semibold text-primary mb-6">Cart</h1>
      {items.length === 0 ? (
        <div className="text-[color:var(--muted-foreground)]">Your cart is empty. <Link href="/shop" className="underline hover:no-underline">Browse products</Link>.</div>
      ) : (
        <div className="grid gap-6">
          <div className="border border-[color:var(--border)] bg-[color:var(--card)] rounded-lg p-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-b-0 border-[color:var(--border)]/60">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-[color:var(--muted-foreground)]">${(item.price / 100).toFixed(2)} each</div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.id, Math.max(1, Number(e.target.value)))}
                    className="w-20 border border-[color:var(--border)] bg-[color:var(--popover)] rounded px-2 py-1"
                  />
                  <button onClick={() => removeItem(item.id)} className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg">Subtotal: <span className="font-semibold">${(subtotal / 100).toFixed(2)}</span></div>
            <div className="flex gap-3">
              <button onClick={clear} className="px-4 py-2 rounded border border-[color:var(--border)]">Clear</button>
              <form action="/api/checkout" method="post">
                <button className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90">Checkout</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


