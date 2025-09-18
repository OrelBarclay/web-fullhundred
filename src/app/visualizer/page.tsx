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
  const [user, setUser] = useState<{ uid: string; isAdmin?: boolean } | null>(null);
  const [credits, setCredits] = useState(0);
  const [isCheckingCredits, setIsCheckingCredits] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
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

  // Check user authentication, admin status, and credits
  useEffect(() => {
    async function checkUserAndCredits() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setIsAdmin(Boolean(data?.isAdmin));
          
          // Check credits for non-admin users
          if (!data?.isAdmin && data?.uid) {
            try {
              const creditsRes = await fetch(`/api/visualizer/credits?userId=${data.uid}`);
              if (creditsRes.ok) {
                const creditsData = await creditsRes.json();
                setCredits(creditsData.credits || 0);
              }
            } catch (creditsError) {
              console.error('Error fetching credits:', creditsError);
            }
          }
        } else {
          setNeedsAuth(true);
        }
      } catch {
        setNeedsAuth(true);
      } finally {
        setIsCheckingRole(false);
        setIsCheckingCredits(false);
      }
    }
    checkUserAndCredits();
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

    // Check authentication for non-admins
    if (!isAdmin && !user) {
      setError("Please log in to generate designs.");
      setNeedsAuth(true);
      return;
    }

    // Check credits for non-admins
    if (!isAdmin && credits <= 0) {
      setError("You need to purchase credits to generate designs.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultUrl(null);
    setLastError(null);
    
    try {
      // Consume credit for non-admin users
      if (!isAdmin && user?.uid) {
        const creditRes = await fetch('/api/visualizer/consume-credit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid }),
        });
        
        if (!creditRes.ok) {
          const creditData = await creditRes.json();
          throw new Error(creditData.error || 'Failed to consume credit');
        }
        
        const creditData = await creditRes.json();
        setCredits(creditData.credits);
      }

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

  // Purchase credits function
  async function onPurchaseCredits() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/visualizer/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceCents }),
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
      console.log('Admin save project: Starting process');
      const beforeUrl = await uploadToCloudinaryIfNeeded(imagePreview);
      console.log('Admin save project: Before URL:', beforeUrl);
      console.log('Admin save project: Result URL:', resultUrl);
      
      const payload = {
        beforeImageUrl: beforeUrl,
        resultImageUrl: resultUrl,
        styleId: selectedStyle,
        styleLabel: STYLES.find(s => s.id === selectedStyle)?.label || selectedStyle,
        spaceType,
        spaceLabel: SPACE_TYPES.find(s => s.id === spaceType)?.label || spaceType,
      };
      
      console.log('Admin save project: Payload:', payload);
      
      const res = await fetch('/api/visualizer/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      console.log('Admin save project: Response status:', res.status);
      const data = await res.json();
      console.log('Admin save project: Response data:', data);
      
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to create project');
      }
      
      // redirect to project page
      if (data.projectId) {
        console.log('Admin save project: Redirecting to project:', data.projectId);
        window.location.href = `/project/${data.projectId}`;
      } else {
        throw new Error('No project ID returned from server');
      }
    } catch (e) {
      console.error('Admin save project error:', e);
      const msg = e instanceof Error ? e.message : 'Failed to create project';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading state while checking authentication and credits
  if (isCheckingRole || isCheckingCredits) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-12 text-[color:var(--foreground)]">
        <h1 className="text-3xl font-semibold text-primary mb-6">AI-Powered Design Visualizer</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-[color:var(--muted-foreground)]">Loading...</div>
        </div>
      </section>
    );
  }

  // Show authentication required message
  if (needsAuth) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-12 text-[color:var(--foreground)]">
        <h1 className="text-3xl font-semibold text-primary mb-6">AI-Powered Design Visualizer</h1>
        <div className="text-center py-12">
          <div className="text-lg mb-4">Please log in to use the AI Visualizer</div>
          <a href="/login" className="px-6 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition">
            Log In
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 text-[color:var(--foreground)]">
      <h1 className="text-3xl font-semibold text-primary mb-6">AI-Powered Design Visualizer</h1>

      {/* Credits display for non-admin users */}
      {!isAdmin && (
        <div className="mb-6 p-4 bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Your Credits: {credits}</div>
              <div className="text-sm text-[color:var(--muted-foreground)]">
                Each generation costs 1 credit. Purchase 10 credits for ${(priceCents/100).toFixed(2)}.
              </div>
            </div>
            {credits === 0 && (
              <button 
                onClick={onPurchaseCredits} 
                disabled={isSubmitting}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Processing...' : `Purchase 10 Credits - $${(priceCents/100).toFixed(2)}`}
              </button>
            )}
          </div>
        </div>
      )}

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
            <button 
              onClick={onVisualize} 
              disabled={isLoading || (!isAdmin && credits <= 0)} 
              className="px-6 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? "Generating..." : 
               (!isAdmin && credits <= 0) ? "No Credits - Purchase Required" : 
               "Generate Design"}
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

          {/* Actions for saving project */}
          {resultUrl && (
            <div className="w-full mt-4 flex items-center justify-center">
              <div className="flex gap-3">
                {isAdmin ? (
                  <button onClick={onAdminSaveProject} disabled={isCheckingRole || !resultUrl || isSubmitting} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition">
                    {isSubmitting ? 'Saving…' : 'Save as Project (Admin)'}
                  </button>
                ) : (
                  <div className="text-sm text-[color:var(--muted-foreground)] text-center">
                    <div>Design generated successfully!</div>
                    <div>You can now generate another design or save this one as a project.</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


