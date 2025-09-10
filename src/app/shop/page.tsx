"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";

type Product = { 
  id: string; 
  name: string; 
  description: string; 
  price: number; 
  image: string;
  category: string;
  includedServices?: Array<{ id: string; title: string; estimatedPrice: number }>;
  estimatedTimeline?: string;
  complexity?: string;
};



export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 text-[color:var(--foreground)]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-primary mb-2">AI-Powered Shop</h1>
        <p className="text-[color:var(--muted-foreground)]">Dynamic packages generated from our services</p>
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Pricing Note:</strong> All prices shown are for <strong>labor only</strong>. Materials are quoted separately based on your selections and preferences.
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center text-[color:var(--muted-foreground)] py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Generating AI packages...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="border border-[color:var(--border)] bg-[color:var(--card)] rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <ProductImage 
                category={p.category}
                width={400}
                height={250}
                className="w-full aspect-[16/10]"
              />
              
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-[color:var(--foreground)]">{p.name}</h2>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">${(p.price / 10).toFixed(2)}</span>
                    {p.includedServices && (
                      <p className="text-xs text-[color:var(--muted-foreground)]">
                        {p.includedServices.length} services
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-[color:var(--muted-foreground)] line-clamp-2">{p.description}</p>

                {/* Package Details */}
                <div className="space-y-2">
                  {p.estimatedTimeline && (
                    <div className="flex items-center text-xs text-[color:var(--muted-foreground)]">
                      <span className="mr-2">⏱️</span>
                      <span>{p.estimatedTimeline}</span>
                    </div>
                  )}
                  
                  {p.complexity && (
                    <div className="flex items-center text-xs text-[color:var(--muted-foreground)]">
                      <span className="mr-2">⚡</span>
                      <span>Complexity: {p.complexity}</span>
                    </div>
                  )}

                  {/* Included Services Preview */}
                  {p.includedServices && p.includedServices.length > 0 && (
                    <div className="bg-[color:var(--muted)] rounded-md p-2">
                      <p className="text-xs font-medium text-[color:var(--foreground)] mb-1">Includes:</p>
                      <div className="space-y-1">
                        {p.includedServices.slice(0, 2).map((service, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-[color:var(--muted-foreground)] truncate mr-2">{service.title}</span>
                            <span className="text-[color:var(--foreground)] font-medium">${(service.estimatedPrice / 100).toFixed(0)}</span>
                          </div>
                        ))}
                        {p.includedServices.length > 2 && (
                          <p className="text-xs text-[color:var(--muted-foreground)]">
                            +{p.includedServices.length - 2} more services
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 mt-3">
                  <Link
                    href={`/package/${p.id}`}
                    className="flex-1 bg-card border border-[color:var(--border)] text-[color:var(--foreground)] py-2 px-3 rounded-md hover:bg-[color:var(--accent)] transition-colors text-sm font-medium text-center"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => addItem({ id: p.id, name: p.name, price: p.price, image: p.image })}
                    className="flex-1 bg-primary text-primary-foreground py-2 px-3 rounded-md hover:opacity-90 transition-opacity font-medium text-sm"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


