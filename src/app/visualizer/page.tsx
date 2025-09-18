"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const SPACE_TYPES = [
  { id: "bathroom", label: "Bathroom" },
  { id: "kitchen", label: "Kitchen" },
  { id: "patio", label: "Patio" },
];

const STYLES = [
  { id: "modern", label: "Modern Minimal", prompt: "modern minimalist design, clean lines, neutral palette, matte black fixtures, large tiles, frameless glass" },
  { id: "luxury", label: "Luxury Spa", prompt: "luxury spa design, marble surfaces, warm lighting, elegant fixtures, wooden accents, ambient glow" },
  { id: "scandinavian", label: "Scandinavian", prompt: "scandinavian design, light wood, white surfaces, airy, functional, cozy, natural light" },
  { id: "industrial", label: "Industrial", prompt: "industrial design, concrete textures, exposed elements, metal fixtures, dramatic contrast" },
  { id: "coastal", label: "Coastal", prompt: "coastal design, soft blues, white shiplap, natural textures, bright and fresh" },
];

export default function VisualizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [spaceType, setSpaceType] = useState<string>(SPACE_TYPES[0].id);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const priceCents: number = (() => {
    const envVal = Number(process.env.NEXT_PUBLIC_VISUALIZER_PRICE_CENTS || 499);
    return Number.isFinite(envVal) && envVal > 0 ? Math.floor(envVal) : 499;
  })();
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Derived label for current space type
  const spaceLabel = (SPACE_TYPES.find(s => s.id === spaceType)?.label || spaceType);

  function onPickFile() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResultUrl(null);
    setError(null);
    setLastError(null);
    setRetryCount(0);
    if (f) {
      // Downscale large images to <= 1024 on longest side to avoid OOM
      const img = new window.Image();
      img.onload = () => {
        const maxSide = 1024;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setImagePreview(dataUrl);
      };
      img.src = URL.createObjectURL(f);
    } else {
      setImagePreview(null);
    }
  }

  // Check admin status (admins do not pay)
  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(Boolean(data?.isAdmin));
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setIsCheckingRole(false);
      }
    }
    checkRole();
  }, []);

  async function uploadToCloudinaryIfNeeded(dataUrlOrUrl: string | null): Promise<string | null> {
    if (!dataUrlOrUrl) return null;
    if (!dataUrlOrUrl.startsWith('data:')) return dataUrlOrUrl;
    const blob = await (await fetch(dataUrlOrUrl)).blob();
    const formData = new FormData();
    formData.append('file', new File([blob], 'before.png', { type: blob.type || 'image/png' }));
    formData.append('folder', 'visualizer/uploads');
    const res = await fetch('/api/cloudinary-upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Failed to upload image');
    const data = await res.json();
    return data.secure_url as string;
  }

  async function onVisualize() {
    if (!file && !imagePreview) {
      setError("Please upload a photo or pick a style.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResultUrl(null);
    setLastError(null);
    
    try {
      const style = STYLES.find((s) => s.id === selectedStyle)!;
      const spaceLabel = SPACE_TYPES.find(s => s.id === spaceType)?.label || spaceType;
      let base64: string | undefined = undefined;
      if (imagePreview?.startsWith("data:")) {
        base64 = imagePreview;
      }
      
      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          imageBase64: base64, 
          stylePrompt: `${spaceLabel.toLowerCase()} ${style.prompt}`, 
          width: 768, 
          height: 768 
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || "Visualization failed";
        setLastError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const url: string | null = data.imageUrl || null;
      if (url) {
        // More lenient image URL validation
        const isValidImageUrl = (() => {
          try {
            // Check if it's a data URL
            if (url.startsWith('data:image/')) return true;
            
            // Check if it's a valid URL with image extension
            const u = new URL(url);
            const pathname = u.pathname.toLowerCase();
            const hasImageExtension = /(\.png|\.jpg|\.jpeg|\.webp|\.gif)$/.test(pathname);
            
            // Also accept URLs from common image hosting services
            const isImageHost = ['replicate.delivery', 'storage.googleapis.com', 'firebasestorage.googleapis.com', 'res.cloudinary.com'].some(host => u.hostname.includes(host));
            
            return hasImageExtension || isImageHost;
          } catch {
            // If URL parsing fails, check if it looks like a data URL
            return /^data:image\//i.test(url);
          }
        })();
        
        if (!isValidImageUrl) {
          const errorMsg = 'The AI returned a non-image result. This sometimes happens - try again.';
          setLastError(errorMsg);
          setError(errorMsg);
          setResultUrl(null);
        } else {
          setResultUrl(url);
          setError(null);
          setLastError(null);
          setRetryCount(0); // Reset retry count on success
        }
      } else {
        const errorMsg = 'No image was generated. This sometimes happens - try again.';
        setLastError(errorMsg);
        setError(errorMsg);
        setResultUrl(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate design";
      setLastError(msg);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  // Retry function
  async function onRetry() {
    if (retryCount >= 3) {
      setError("Maximum retry attempts reached. Please try uploading a different image or changing the style.");
      return;
    }
    setRetryCount(prev => prev + 1);
    setError(null);
    await onVisualize();
  }

  // Pay for generated image (non-admins)
  async function onPayForDesign() {
    if (!resultUrl) {
      setError('Generate a design first');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const beforeUrl = await uploadToCloudinaryIfNeeded(imagePreview);
      const payload = {
        priceCents,
        beforeImageUrl: beforeUrl,
        resultImageUrl: resultUrl,
        styleId: selectedStyle,
        styleLabel: STYLES.find(s => s.id === selectedStyle)?.label || selectedStyle,
        spaceType,
        spaceLabel: SPACE_TYPES.find(s => s.id === spaceType)?.label || spaceType,
      };
      const res = await fetch('/api/visualizer/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout');
      if (data.url) {
        window.location.href = data.url as string;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start checkout';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Admins can save visualizer result as project directly without payment
  async function onAdminSaveProject() {
    if (!resultUrl) {
      setError('Generate a design first');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const beforeUrl = await uploadToCloudinaryIfNeeded(imagePreview);
      const res = await fetch('/api/visualizer/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeImageUrl: beforeUrl,
          resultImageUrl: resultUrl,
          styleId: selectedStyle,
          styleLabel: STYLES.find(s => s.id === selectedStyle)?.label || selectedStyle,
          spaceType,
          spaceLabel: SPACE_TYPES.find(s => s.id === spaceType)?.label || spaceType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');
      // redirect to project page
      if (data.projectId) {
        window.location.href = `/project/${data.projectId}`;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create project';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 text-[color:var(--foreground)]">
      <h1 className="text-3xl font-semibold text-primary mb-6">AI-Powered Design Visualizer</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="border border-[color:var(--border)] rounded-lg p-4 bg-[color:var(--card)]">
            <h2 className="font-medium mb-2">0) Choose space type</h2>
            <div className="flex gap-2 flex-wrap">
              {SPACE_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSpaceType(t.id)}
                  className={`px-3 py-2 rounded border transition ${spaceType === t.id ? 'border-primary bg-primary/10' : 'border-[color:var(--border)] hover:bg-[color:var(--muted)]'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-[color:var(--border)] rounded-lg p-4 bg-[color:var(--card)]">
            <h2 className="font-medium mb-2">1) Upload your current {spaceLabel}</h2>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <button onClick={onPickFile} className="px-4 py-2 rounded border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition">Upload Photo</button>
            {imagePreview && (
              <div className="mt-4">
                <Image src={imagePreview} alt="preview" width={800} height={600} className="rounded-md max-h-80 object-contain" />
              </div>
            )}
          </div>

          <div className="border border-[color:var(--border)] rounded-lg p-4 bg-[color:var(--card)]">
            <h2 className="font-medium mb-2">2) Choose a design style for your {spaceLabel}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={`px-3 py-2 rounded border transition text-left ${selectedStyle === s.id ? "border-primary bg-primary/10" : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"}`}
                >
                  <div className="font-medium">{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button onClick={onVisualize} disabled={isLoading} className="px-6 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition">
              {isLoading ? "Generating..." : "Generate Design"}
            </button>
            {error && lastError && retryCount < 3 && (
              <button onClick={onRetry} disabled={isLoading} className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                {isLoading ? "Retrying..." : `Retry (${retryCount}/3)`}
              </button>
            )}
          </div>
          {error && (
            <div className="text-red-600 text-sm space-y-2">
              <div>{error}</div>
              {retryCount > 0 && retryCount < 3 && (
                <div className="text-xs text-gray-500">
                  Attempt {retryCount + 1} of 3. Sometimes the AI needs a few tries to generate a good result.
                </div>
              )}
              {retryCount >= 3 && (
                <div className="text-xs text-gray-500">
                  Try uploading a different image or selecting a different style.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border border-[color:var(--border)] rounded-lg p-4 bg-[color:var(--card)] min-h-[320px] flex flex-col items-center justify-between">
          <div className="w-full flex-1 flex items-center justify-center">
            {resultUrl ? (
              <Image src={resultUrl} alt="AI result" width={1200} height={900} className="rounded-md max-h-[60vh] object-contain" />
            ) : (
              <div className="text-[color:var(--muted-foreground)]">Your AI-enhanced design will appear here.</div>
            )}
          </div>

          {/* Actions for payment / save */}
          <div className="w-full mt-4 flex items-center justify-between">
            <div className="text-sm text-[color:var(--muted-foreground)]">
              Recommended cost per generated image: <span className="font-semibold text-[color:var(--foreground)]">${(priceCents/100).toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              {isAdmin ? (
                <button onClick={onAdminSaveProject} disabled={isCheckingRole || !resultUrl || isSubmitting} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition">
                  {isSubmitting ? 'Saving…' : 'Save as Project (Admin)'}
                </button>
              ) : (
                <button onClick={onPayForDesign} disabled={!resultUrl || isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition">
                  {isSubmitting ? 'Redirecting…' : `Pay $${(priceCents/100).toFixed(2)} for this design`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


