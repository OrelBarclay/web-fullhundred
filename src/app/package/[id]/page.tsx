"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

// Helper function to get category-specific icons
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    kitchen: "🍳",
    bathroom: "🚿", 
    outdoor: "🌳",
    renovation: "🔨",
    maintenance: "🔧",
    combo: "📦",
    electrical: "⚡",
    plumbing: "🚰",
    hvac: "🌡️",
    flooring: "🏠",
    carpentry: "🪚",
    roofing: "🏠"
  };
  return icons[category] || "🏠";
}

export default function PackageDetailsPage() {
  const params = useParams();
  const packageId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const products = await res.json();
        const foundProduct = products.find((p: Product) => p.id === packageId);
        
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError("Package not found");
        }
      } catch (err) {
        setError("Failed to load package details");
      } finally {
        setLoading(false);
      }
    };

    if (packageId) {
      fetchProduct();
    }
  }, [packageId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Package Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "The package you&apos;re looking for doesn&apos;t exist."}</p>
          <Link 
            href="/shop"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const totalLaborCost = product.includedServices?.reduce((sum, service) => sum + service.estimatedPrice, 0) || 0;
  const savings = totalLaborCost - product.price;
  const savingsPercentage = totalLaborCost > 0 ? Math.round((savings / totalLaborCost) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-foreground">Shop</Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <ProductImage 
              category={product.category}
              width={600}
              height={450}
              className="aspect-[4/3] rounded-lg"
            />
            
            {/* Package Highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">${(product.price / 100).toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Labor Only</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{savingsPercentage}%</div>
                <div className="text-sm text-muted-foreground">Package Savings</div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              <p className="text-muted-foreground text-lg">{product.description}</p>
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Pricing Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Individual Services (Labor):</span>
                  <span className="font-medium">${(totalLaborCost / 100).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Package Discount ({savingsPercentage}%):</span>
                  <span>-${(savings / 100).toFixed(0)}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Package Price (Labor Only):</span>
                    <span className="text-primary">${(product.price / 100).toFixed(0)}</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  * Materials quoted separately based on your selections
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-3">Project Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timeline:</span>
                    <span className="font-medium">{product.estimatedTimeline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Complexity:</span>
                    <span className="font-medium">{product.complexity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Services:</span>
                    <span className="font-medium">{product.includedServices?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-3">What&apos;s Included</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Professional installation
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Quality workmanship guarantee
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Cleanup and disposal
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Project management
                  </li>
                </ul>
              </div>
            </div>

            {/* Included Services */}
            {product.includedServices && product.includedServices.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Included Services</h3>
                <div className="space-y-3">
                  {product.includedServices.map((service, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                      <div>
                        <div className="font-medium text-foreground">{service.title}</div>
                        <div className="text-sm text-muted-foreground">Professional installation</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${(service.estimatedPrice / 100).toFixed(0)}</div>
                        <div className="text-sm text-muted-foreground">labor</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => addItem({ 
                  id: product.id, 
                  name: product.name, 
                  price: product.price, 
                  image: product.image 
                })}
                className="flex-1 bg-primary text-primary-foreground py-4 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity text-lg"
              >
                Add to Cart - ${(product.price / 100).toFixed(0)}
              </button>
              <Link
                href="/contact"
                className="flex-1 bg-card border border-border text-foreground py-4 px-6 rounded-lg font-semibold hover:bg-accent transition-colors text-lg text-center"
              >
                Get Quote
              </Link>
            </div>

            {/* Important Notes */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Important Notes</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• All prices shown are for labor only - materials quoted separately</li>
                <li>• Final pricing may vary based on project scope and materials selected</li>
                <li>• Free consultation and detailed estimate provided before work begins</li>
                <li>• All work backed by our quality guarantee</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
