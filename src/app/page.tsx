"use client";
import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    projectDetails: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", phone: "", projectDetails: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 grid gap-16">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="grid gap-6">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Transforming Spaces with Precision and Craft</h1>
          <p className="text-lg opacity-85">We design, build, and renovate with a relentless focus on quality. Explore our portfolio and get a free, no-obligation quote today.</p>
          <div className="flex gap-4">
            <a href="#quote" className="bg-black text-white px-5 py-3 rounded">Get a Free Quote</a>
            <a href="/portfolio" className="border px-5 py-3 rounded">View Our Work</a>
          </div>
        </div>
        <div className="aspect-[16/10] rounded-lg bg-black/5" />
      </div>

      <div id="quote" className="border rounded-xl p-6 grid gap-4">
        <h2 className="text-xl font-medium">Request a Free Quote</h2>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-4">
          <input 
            className="border rounded px-3 py-2" 
            placeholder="Your name" 
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <input 
            className="border rounded px-3 py-2" 
            placeholder="Email" 
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <input 
            className="border rounded px-3 py-2" 
            placeholder="Phone" 
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
          <textarea 
            className="border rounded px-3 py-2 md:col-span-3" 
            placeholder="Project details" 
            rows={4}
            value={formData.projectDetails}
            onChange={(e) => setFormData(prev => ({ ...prev, projectDetails: e.target.value }))}
            required
          />
          <button 
            type="submit"
            disabled={isSubmitting}
            className="bg-black text-white rounded px-4 py-2 w-fit disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send Request"}
          </button>
        </form>
        
        {submitStatus === "success" && (
          <p className="text-green-600 text-sm">Thank you! We&apos;ll be in touch soon.</p>
        )}
        {submitStatus === "error" && (
          <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>
        )}
      </div>
    </section>
  );
}
