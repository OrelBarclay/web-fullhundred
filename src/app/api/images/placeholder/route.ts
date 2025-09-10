import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';

// Map categories to relevant search terms for Unsplash
const categorySearchTerms: Record<string, string> = {
  kitchen: "kitchen renovation modern",
  bathroom: "bathroom remodel modern",
  outdoor: "deck construction outdoor",
  renovation: "home renovation construction",
  maintenance: "home maintenance repair",
  combo: "home improvement package",
  electrical: "electrical work installation",
  plumbing: "plumbing installation repair",
  hvac: "hvac installation heating",
  flooring: "flooring installation hardwood",
  carpentry: "carpentry woodwork custom",
  roofing: "roofing installation construction"
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "construction";
  const width = searchParams.get("width") || "400";
  const height = searchParams.get("height") || "300";
  
  const searchTerm = categorySearchTerms[category] || "construction renovation";
  
  // Option 1: Use Unsplash Source API (free, no API key needed)
  const unsplashUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(searchTerm)}`;
  
  // Option 2: Use Picsum for random construction images
  const picsumUrl = `https://picsum.photos/${width}/${height}?random=${Math.floor(Math.random() * 1000)}`;
  
  // Option 3: Use placeholder.com with construction theme
  const placeholderUrl = `https://via.placeholder.com/${width}x${height}/4F46E5/FFFFFF?text=${encodeURIComponent(category.toUpperCase())}`;
  
  // Return the image URL (you can choose which service to use)
  return NextResponse.json({ 
    imageUrl: unsplashUrl,
    fallbackUrl: placeholderUrl,
    searchTerm 
  });
}
