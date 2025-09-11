"use client";

import { useState, useRef } from "react";

const STYLES = [
  { id: "modern", label: "Modern Minimal", prompt: "modern minimalist bathroom, clean lines, neutral palette, matte black fixtures, large tiles, frameless glass" },
  { id: "luxury", label: "Luxury Spa", prompt: "luxury spa bathroom, marble surfaces, warm lighting, rainfall shower, wooden accents, ambient glow" },
  { id: "scandinavian", label: "Scandinavian", prompt: "scandinavian bathroom, light wood, white tiles, airy, functional, cozy, natural light" },
  { id: "industrial", label: "Industrial", prompt: "industrial bathroom, concrete textures, exposed elements, metal fixtures, dramatic contrast" },
  { id: "coastal", label: "Coastal", prompt: "coastal bathroom, soft blues, white shiplap, natural textures, bright and fresh" },
];

export default function VisualizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function onPickFile() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResultUrl(null);
    setError(null);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(String(reader.result));
      reader.readAsDataURL(f);
    } else {
      setImagePreview(null);
    }
  }

  async function onVisualize() {
    if (!file && !imagePreview) {
      setError("Please upload a bathroom photo or pick a style.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResultUrl(null);
    try {
      const style = STYLES.find((s) => s.id === selectedStyle)!;
      let base64: string | undefined = undefined;
      if (imagePreview?.startsWith("data:")) {
        base64 = imagePreview;
      }
      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, stylePrompt: style.prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Visualization failed");
      setResultUrl(data.imageUrl || null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate design";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 text-[color:var(--foreground)]">
      <h1 className="text-3xl font-semibold text-primary mb-6">AI-Powered Design Visualizer</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="border border-[color:var(--border)] rounded-lg p-4 bg-[color:var(--card)]">
            <h2 className="font-medium mb-2">1) Upload your current bathroom</h2>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <button onClick={onPickFile} className="px-4 py-2 rounded border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition">Upload Photo</button>
            {imagePreview && (
              <div className="mt-4">
                <img src={imagePreview} alt="preview" className="rounded-md max-h-80 object-contain" />
              </div>
            )}
          </div>

          <div className="border border-[color:var(--border)] rounded-lg p-4 bg-[color:var(--card)]">
            <h2 className="font-medium mb-2">2) Or choose a design style</h2>
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

          <div className="flex gap-3">
            <button onClick={onVisualize} disabled={isLoading} className="px-6 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition">
              {isLoading ? "Generating..." : "Generate Design"}
            </button>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>

        <div className="border border-[color:var(--border)] rounded-lg p-4 bg-[color:var(--card)] min-h-[320px] flex items-center justify-center">
          {resultUrl ? (
            <img src={resultUrl} alt="AI result" className="rounded-md max-h-[70vh] object-contain" />
          ) : (
            <div className="text-[color:var(--muted-foreground)]">Your AI-enhanced design will appear here.</div>
          )}
        </div>
      </div>
    </section>
  );
}


