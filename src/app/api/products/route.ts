import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { estimateServicePriceUSD } from "@/lib/ai";
import type { Service } from "@/server/db/schema";

export const runtime = 'nodejs';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // cents
  image: string;
  category: string;
  includedServices?: Array<{ id: string; title: string; estimatedPrice: number }>;
  estimatedTimeline?: string;
  complexity?: string;
}

// Fallback static products with LABOR-ONLY pricing (materials quoted separately)
const staticProducts: Product[] = [
  {
    id: "prod-1",
    name: "Kitchen Renovation Package",
    description: "Complete kitchen renovation labor (cabinets, countertops, appliances installation). Materials quoted separately.",
    price: 25000, // $25,000 labor only
    image: "/images/products/kitchen-starter.jpg",
    category: "kitchen",
    estimatedTimeline: "6-8 weeks",
    complexity: "High"
  },
  {
    id: "prod-2", 
    name: "Bathroom Remodel Package",
    description: "Full bathroom remodel labor (tile, fixtures, vanity installation). Materials quoted separately.",
    price: 15000, // $15,000 labor only
    image: "/images/products/bath-refresh.jpg",
    category: "bathroom",
    estimatedTimeline: "3-4 weeks",
    complexity: "Medium"
  },
  {
    id: "prod-3",
    name: "Deck Construction Package",
    description: "Custom deck construction labor. Materials quoted separately.",
    price: 12000, // $12,000 labor only
    image: "/images/products/deck-consult.jpg",
    category: "outdoor",
    estimatedTimeline: "2-3 weeks",
    complexity: "Medium"
  },
];

export async function GET() {
  try {
    // Fetch services from Firestore fresh every request
    const db = getDb();
    const snap = await getDocs(collection(db, "services"));
    const services: Array<Service & { id: string }> = snap.docs
      .map((d) => {
        const data = d.data() as Partial<Service>;
        return {
          id: d.id,
          title: data.title || "",
          description: data.description || "",
          features: Array.isArray(data.features) ? (data.features as string[]) : [],
          iconColor: data.iconColor || "",
          iconPath: data.iconPath || "",
          isActive: Boolean(data.isActive),
          order: Number(data.order || 0),
          createdAt: (data.createdAt as Date) || new Date(),
          updatedAt: (data.updatedAt as Date) || new Date(),
        } as Service & { id: string };
      })
      .filter((s) => s.isActive);

    // Generate AI-powered product packages from current services
    const aiProducts = generateProductPackages(services);

    // Combine with static products (optional baseline)
    const allProducts = [...staticProducts, ...aiProducts];

    return NextResponse.json(allProducts, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (_error) {
    // Fallback to static products only
    return NextResponse.json(staticProducts, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }
}

function generateProductPackages(services: Array<Service & { id: string }>): Product[] {
  const packages: Product[] = [];
  
  // Group services by category based on keywords
  const categories = {
    kitchen: services.filter(s => 
      s.title.toLowerCase().includes('kitchen') || 
      s.description.toLowerCase().includes('kitchen') ||
      s.features.some(f => f.toLowerCase().includes('kitchen'))
    ),
    bathroom: services.filter(s => 
      s.title.toLowerCase().includes('bathroom') || 
      s.description.toLowerCase().includes('bathroom') ||
      s.features.some(f => f.toLowerCase().includes('bathroom'))
    ),
    outdoor: services.filter(s => 
      s.title.toLowerCase().includes('deck') || 
      s.title.toLowerCase().includes('patio') ||
      s.title.toLowerCase().includes('outdoor') ||
      s.description.toLowerCase().includes('deck') ||
      s.description.toLowerCase().includes('patio')
    ),
    renovation: services.filter(s => 
      s.title.toLowerCase().includes('renovation') || 
      s.title.toLowerCase().includes('remodel') ||
      s.title.toLowerCase().includes('addition')
    ),
    maintenance: services.filter(s => 
      s.title.toLowerCase().includes('maintenance') || 
      s.title.toLowerCase().includes('repair') ||
      s.title.toLowerCase().includes('service')
    )
  };

  // Generate packages for each category
  Object.entries(categories).forEach(([category, categoryServices]) => {
    if (categoryServices.length === 0) return;

    // Create different package tiers
    const tiers = [
      { name: "Starter", maxServices: 2, discount: 0.85 },
      { name: "Complete", maxServices: 3, discount: 0.80 },
      { name: "Premium", maxServices: 4, discount: 0.75 }
    ];

    tiers.forEach((tier) => {
      const selectedServices = categoryServices.slice(0, tier.maxServices);
      if (selectedServices.length === 0) return;

      const totalPrice = selectedServices.reduce((sum, service) => {
        return sum + estimateServicePriceUSD({ title: service.title, description: service.description });
      }, 0);

      const discountedPrice = Math.round(totalPrice * tier.discount);
      
      const packageName = `${tier.name} ${category.charAt(0).toUpperCase() + category.slice(1)} Package`;
      const packageDescription = `Complete ${category} solution with ${selectedServices.length} professional services. ${tier.name.toLowerCase()} tier includes everything you need.`;

      packages.push({
        id: `ai-${category}-${tier.name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        name: packageName,
        description: packageDescription,
        price: discountedPrice,
        image: `/images/products/${category}-${tier.name.toLowerCase()}.jpg`,
        category: category,
        includedServices: selectedServices.map(s => ({
          id: s.id,
          title: s.title,
          estimatedPrice: estimateServicePriceUSD({ title: s.title, description: s.description })
        })),
        estimatedTimeline: getEstimatedTimeline(category, selectedServices.length),
        complexity: getComplexityLevel(category, selectedServices.length)
      });
    });
  });

  // Create custom combination packages
  if (services.length >= 3) {
    const popularServices = services
      .map(s => ({
        ...s,
        estimatedPrice: estimateServicePriceUSD({ title: s.title, description: s.description })
      }))
      .sort((a, b) => b.estimatedPrice - a.estimatedPrice)
      .slice(0, 6);

    // Create a "Best Value" package
    const bestValueServices = popularServices.slice(0, 3);
    const bestValuePrice = Math.round(
      bestValueServices.reduce((sum, s) => sum + s.estimatedPrice, 0) * 0.75
    );

    packages.push({
      id: `ai-best-value-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      name: "Best Value Home Package",
      description: "Our most popular services bundled together for maximum value. Perfect for comprehensive home improvements.",
      price: bestValuePrice,
      image: "/images/products/best-value.jpg",
      category: "combo",
      includedServices: bestValueServices.map(s => ({
        id: s.id,
        title: s.title,
        estimatedPrice: s.estimatedPrice
      })),
      estimatedTimeline: "6-10 weeks",
      complexity: "High"
    });
  }

  return packages;
}

function getEstimatedTimeline(category: string, serviceCount: number): string {
  const baseTimelines = {
    kitchen: "4-8 weeks",
    bathroom: "2-6 weeks", 
    outdoor: "2-4 weeks",
    renovation: "8-16 weeks",
    maintenance: "1-2 weeks",
    combo: "6-12 weeks"
  };
  
  const base = (baseTimelines as Record<string,string>)[category] || "4-8 weeks";
  return base;
}

function getComplexityLevel(_category: string, serviceCount: number): string {
  if (serviceCount <= 2) return "Low";
  if (serviceCount <= 3) return "Medium";
  return "High";
}