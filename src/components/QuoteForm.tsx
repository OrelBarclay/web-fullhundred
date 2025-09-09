"use client";
import { useState } from "react";

interface QuoteFormData {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  projectSize: string;
  timeline: string;
  budget: string;
  customQuote: boolean;
  projectDetails: string;
}

interface QuoteEstimate {
  minPrice: number;
  maxPrice: number;
  timeline: string;
  complexity: string;
}

const PROJECT_TYPES = [
  { value: "kitchen", label: "Kitchen Remodeling", basePrice: 15000 },
  { value: "bathroom", label: "Bathroom Renovation", basePrice: 8000 },
  { value: "addition", label: "Home Addition", basePrice: 25000 },
  { value: "basement", label: "Basement Finishing", basePrice: 12000 },
  { value: "deck", label: "Deck/Patio", basePrice: 6000 },
  { value: "roofing", label: "Roofing", basePrice: 10000 },
  { value: "flooring", label: "Flooring", basePrice: 5000 },
  { value: "custom", label: "Custom Project", basePrice: 0 }
];

const PROJECT_SIZES = [
  { value: "small", label: "Small (< 500 sq ft)", multiplier: 0.7 },
  { value: "medium", label: "Medium (500-1000 sq ft)", multiplier: 1.0 },
  { value: "large", label: "Large (1000-2000 sq ft)", multiplier: 1.5 },
  { value: "xlarge", label: "Extra Large (> 2000 sq ft)", multiplier: 2.0 }
];

const TIMELINES = [
  { value: "urgent", label: "ASAP (< 1 month)", multiplier: 1.3 },
  { value: "normal", label: "Normal (1-3 months)", multiplier: 1.0 },
  { value: "flexible", label: "Flexible (3+ months)", multiplier: 0.9 }
];

const BUDGET_RANGES = [
  { value: "under-10k", label: "Under $10,000" },
  { value: "10k-25k", label: "$10,000 - $25,000" },
  { value: "25k-50k", label: "$25,000 - $50,000" },
  { value: "50k-100k", label: "$50,000 - $100,000" },
  { value: "over-100k", label: "Over $100,000" }
];

export default function QuoteForm() {
  const [formData, setFormData] = useState<QuoteFormData>({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    projectSize: "",
    timeline: "",
    budget: "",
    customQuote: false,
    projectDetails: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [showEstimate, setShowEstimate] = useState(false);
  const [estimate, setEstimate] = useState<QuoteEstimate | null>(null);

  const calculateEstimate = (): QuoteEstimate | null => {
    if (!formData.projectType || !formData.projectSize || !formData.timeline) {
      return null;
    }

    const projectType = PROJECT_TYPES.find(p => p.value === formData.projectType);
    const projectSize = PROJECT_SIZES.find(s => s.value === formData.projectSize);
    const timeline = TIMELINES.find(t => t.value === formData.timeline);

    if (!projectType || !projectSize || !timeline) {
      return null;
    }

    if (projectType.value === "custom") {
      return {
        minPrice: 0,
        maxPrice: 0,
        timeline: "Custom",
        complexity: "Custom"
      };
    }

    const basePrice = projectType.basePrice;
    const sizeMultiplier = projectSize.multiplier;
    const timelineMultiplier = timeline.multiplier;

    const adjustedPrice = basePrice * sizeMultiplier * timelineMultiplier;
    const minPrice = Math.round(adjustedPrice * 0.8);
    const maxPrice = Math.round(adjustedPrice * 1.2);

    let complexity = "Standard";
    if (adjustedPrice > 50000) complexity = "High";
    else if (adjustedPrice > 20000) complexity = "Medium";

    return {
      minPrice,
      maxPrice,
      timeline: timeline.label,
      complexity
    };
  };

  const handleInputChange = (field: keyof QuoteFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate estimate when relevant fields change
    if (field === "projectType" || field === "projectSize" || field === "timeline") {
      const newEstimate = calculateEstimate();
      setEstimate(newEstimate);
      setShowEstimate(!!newEstimate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          estimate: estimate,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({
          name: "",
          email: "",
          phone: "",
          projectType: "",
          projectSize: "",
          timeline: "",
          budget: "",
          customQuote: false,
          projectDetails: ""
        });
        setEstimate(null);
        setShowEstimate(false);
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border rounded-xl p-6 grid gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Your Free Quote</h2>
        <p className="text-gray-600">Tell us about your project and get an instant estimate</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        {/* Contact Information */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Your name" 
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="your@email.com" 
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="(555) 123-4567" 
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>
        </div>

        {/* Project Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Type *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.projectType}
              onChange={(e) => handleInputChange("projectType", e.target.value)}
              required
            >
              <option value="">Select project type</option>
              {PROJECT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Size *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.projectSize}
              onChange={(e) => handleInputChange("projectSize", e.target.value)}
              required
            >
              <option value="">Select project size</option>
              {PROJECT_SIZES.map(size => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeline *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.timeline}
              onChange={(e) => handleInputChange("timeline", e.target.value)}
              required
            >
              <option value="">Select timeline</option>
              {TIMELINES.map(timeline => (
                <option key={timeline.value} value={timeline.value}>{timeline.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.budget}
              onChange={(e) => handleInputChange("budget", e.target.value)}
            >
              <option value="">Select budget range</option>
              {BUDGET_RANGES.map(budget => (
                <option key={budget.value} value={budget.value}>{budget.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Quote Option */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="customQuote"
            checked={formData.customQuote}
            onChange={(e) => handleInputChange("customQuote", e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="customQuote" className="ml-2 block text-sm text-gray-700">
            I need a custom quote (skip automatic estimate)
          </label>
        </div>

        {/* Project Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Details *</label>
          <textarea 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Describe your project in detail..." 
            rows={4}
            value={formData.projectDetails}
            onChange={(e) => handleInputChange("projectDetails", e.target.value)}
            required
          />
        </div>

        {/* Instant Estimate Display */}
        {showEstimate && estimate && !formData.customQuote && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Instant Estimate</h3>
            {estimate.minPrice === 0 ? (
              <p className="text-blue-800">Custom project - we&apos;ll provide a detailed quote after reviewing your requirements.</p>
            ) : (
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-900">Estimated Range:</span>
                  <p className="text-blue-800">${estimate.minPrice.toLocaleString()} - ${estimate.maxPrice.toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Timeline:</span>
                  <p className="text-blue-800">{estimate.timeline}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Complexity:</span>
                  <p className="text-blue-800">{estimate.complexity}</p>
                </div>
              </div>
            )}
            <p className="text-xs text-blue-600 mt-2">
              * This is a preliminary estimate. Final pricing will be provided after consultation.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Sending..." : "Get My Quote"}
          </button>
        </div>
        
        {/* Status Messages */}
        {submitStatus === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium">Thank you! We&apos;ll be in touch soon with your detailed quote.</p>
          </div>
        )}
        {submitStatus === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800 font-medium">Something went wrong. Please try again.</p>
          </div>
        )}
      </form>
    </div>
  );
}
