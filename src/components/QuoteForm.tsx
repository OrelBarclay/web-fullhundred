"use client";
import { useState, useEffect } from "react";
import { getAuthInstance } from "@/lib/firebase";
import { getDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

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
  const [user, setUser] = useState<User | null>(null);
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

  // Load user data and autofill form
  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        
        // Try to get user profile from Firestore
        try {
          const db = getDb();
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Autofill form with user data
            setFormData(prev => ({
              ...prev,
              name: userData.displayName || user.displayName || "",
              email: userData.email || user.email || "",
              phone: userData.phone || ""
            }));
          } else {
            // Fallback to Firebase Auth data
            setFormData(prev => ({
              ...prev,
              name: user.displayName || "",
              email: user.email || "",
              phone: ""
            }));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to Firebase Auth data
          setFormData(prev => ({
            ...prev,
            name: user.displayName || "",
            email: user.email || "",
            phone: ""
          }));
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

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
      const requestData = {
        ...formData,
        estimate: estimate,
        timestamp: new Date().toISOString()
      };

      console.log("Submitting quote form with data:", requestData);

      const response = await fetch("/api/leads-fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("Success response:", result);
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
        const errorData = await response.json();
        console.error("Error response:", errorData);
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 grid gap-6 bg-white dark:bg-gray-800">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Get Your Free Quote</h2>
        <p className="text-gray-600 dark:text-gray-300">Tell us about your project and get an instant estimate</p>
        {user && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Form pre-filled with your account information</span>
            <button
              type="button"
              onClick={() => {
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
              }}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        {/* Contact Information */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
              {user && formData.name && (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Auto-filled
                </span>
              )}
            </label>
            <input 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Your name" 
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
              {user && formData.email && (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Auto-filled
                </span>
              )}
            </label>
            <input 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="your@email.com" 
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
              {user && formData.phone && (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Auto-filled
                </span>
              )}
            </label>
            <input 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Type *</label>
            <select
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Size *</label>
            <select
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timeline *</label>
            <select
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget Range</label>
            <select
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
          <label htmlFor="customQuote" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            I need a custom quote (skip automatic estimate)
          </label>
        </div>

        {/* Project Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Details *</label>
          <textarea 
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Describe your project in detail..." 
            rows={4}
            value={formData.projectDetails}
            onChange={(e) => handleInputChange("projectDetails", e.target.value)}
            required
          />
        </div>

        {/* Instant Estimate Display */}
        {showEstimate && estimate && !formData.customQuote && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Instant Estimate</h3>
            {estimate.minPrice === 0 ? (
              <p className="text-blue-800 dark:text-blue-200">Custom project - we&apos;ll provide a detailed quote after reviewing your requirements.</p>
            ) : (
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-900 dark:text-blue-100">Estimated Range:</span>
                  <p className="text-blue-800 dark:text-blue-200">${estimate.minPrice.toLocaleString()} - ${estimate.maxPrice.toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-900 dark:text-blue-100">Timeline:</span>
                  <p className="text-blue-800 dark:text-blue-200">{estimate.timeline}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-900 dark:text-blue-100">Complexity:</span>
                  <p className="text-blue-800 dark:text-blue-200">{estimate.complexity}</p>
                </div>
              </div>
            )}
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              * This is a preliminary estimate. Final pricing will be provided after consultation.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Sending..." : "Get My Quote"}
          </button>
        </div>
        
        {/* Status Messages */}
        {submitStatus === "success" && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <p className="text-green-800 dark:text-green-200 font-medium">Thank you! We&apos;ll be in touch soon with your detailed quote.</p>
          </div>
        )}
        {submitStatus === "error" && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <p className="text-red-800 dark:text-red-200 font-medium">Something went wrong. Please try again.</p>
          </div>
        )}
      </form>
    </div>
  );
}
