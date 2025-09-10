"use client";
import { useState, useEffect, useRef } from "react";

interface ProductImageProps {
  category: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackIcon?: string;
}

export default function ProductImage({ 
  category, 
  width = 400, 
  height = 300, 
  className = ""
}: ProductImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    let isCancelled = false;

    const fetchImage = async () => {
      try {
        const response = await fetch(`/api/images/placeholder?category=${category}&width=${width}&height=${height}`);
        
        if (isCancelled || !isMountedRef.current) return;
        
        const data = await response.json();
        setImageUrl(data.imageUrl);
      } catch {
        if (!isCancelled && isMountedRef.current) {
          setError(true);
        }
      } finally {
        if (!isCancelled && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isCancelled = true;
    };
  }, [category, width, height]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fallback to icon-based design if image fails to load
  if (loading || error || !imageUrl) {
    return (
      <div className={`bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center relative overflow-hidden ${className}`}>
        <div className="text-center z-10">
          <div className="text-6xl mb-2">{getCategoryIcon(category)}</div>
          <p className="text-sm text-muted-foreground capitalize font-medium">{category}</p>
        </div>
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-16 h-16 bg-primary rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 bg-primary rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  const handleImageError = () => {
    if (isMountedRef.current) {
      setError(true);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={imageUrl}
        alt={`${category} construction work`}
        className="w-full h-full object-cover"
        onError={handleImageError}
        loading="lazy"
        onLoad={() => {
          if (isMountedRef.current) {
            setError(false);
          }
        }}
      />
      {/* Overlay with category name */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <p className="text-white text-sm font-medium capitalize">{category}</p>
      </div>
    </div>
  );
}

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
