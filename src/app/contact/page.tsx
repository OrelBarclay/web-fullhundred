"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // For now, we'll simulate form submission
      // In production, you'd send this to your backend or email service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        service: "",
        message: ""
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } catch (error) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Get In Touch
            </h1>
            <p className="text-xl md:text-2xl text-[color:var(--primary-foreground)]/80 max-w-3xl mx-auto">
              Ready to transform your space? Let&apos;s discuss your project and bring your vision to life.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-[color:var(--foreground)] mb-8">Send us a message</h2>
            
            {submitStatus === "success" && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Thank you! Your message has been sent successfully.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Something went wrong. Please try again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--popover)] text-[color:var(--foreground)] placeholder-[color:var(--muted-foreground)]/70 focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--popover)] text-[color:var(--foreground)] placeholder-[color:var(--muted-foreground)]/70 focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--popover)] text-[color:var(--foreground)] placeholder-[color:var(--muted-foreground)]/70 focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent transition-colors"
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-2">
                    Service Interest
                  </label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--popover)] text-[color:var(--foreground)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent transition-colors"
                  >
                    <option value="">Select a service</option>
                    <option value="kitchen-remodeling">Kitchen Remodeling</option>
                    <option value="bathroom-renovation">Bathroom Renovation</option>
                    <option value="home-additions">Home Additions</option>
                    <option value="custom-carpentry">Custom Carpentry</option>
                    <option value="project-management">Project Management</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-2">
                  Project Details *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--popover)] text-[color:var(--foreground)] placeholder-[color:var(--muted-foreground)]/70 focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent transition-colors resize-none"
                  placeholder="Tell us about your project, timeline, budget, and any specific requirements..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg font-semibold text-lg hover:opacity-90 focus:ring-4 focus:ring-[color:var(--ring)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending Message..." : "Send Message"}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Company Info */}
            <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-[color:var(--foreground)] mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Address</h3>
                    <p className="text-[color:var(--muted-foreground)] mt-1">
                      123 Construction Way<br />
                      Building District<br />
                      City, State 12345
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Phone</h3>
                    <p className="text-[color:var(--muted-foreground)] mt-1">
                      <a href="tel:+15551234567" className="hover:text-primary transition-colors">
                        (555) 123-4567
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Email</h3>
                    <p className="text-[color:var(--muted-foreground)] mt-1">
                      <a href="mailto:info@fullhundred.com" className="hover:text-primary transition-colors">
                        info@fullhundred.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-[color:var(--foreground)] mb-6">Business Hours</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-[color:var(--border)]/60">
                  <span className="text-[color:var(--muted-foreground)]">Monday - Friday</span>
                  <span className="font-semibold text-[color:var(--foreground)]">8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[color:var(--border)]/60">
                  <span className="text-[color:var(--muted-foreground)]">Saturday</span>
                  <span className="font-semibold text-[color:var(--foreground)]">9:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[color:var(--muted-foreground)]">Sunday</span>
                  <span className="font-semibold text-[color:var(--foreground)]">Closed</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-[color:var(--muted)] rounded-lg">
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  <strong>Emergency Service:</strong> Available 24/7 for urgent repairs and emergencies.
                </p>
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-[color:var(--foreground)] mb-6">Why Choose Full Hundred?</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[color:var(--muted-foreground)]">Licensed and insured professionals</span>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[color:var(--muted-foreground)]">20+ years of experience</span>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[color:var(--muted-foreground)]">Free consultations and estimates</span>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[color:var(--muted-foreground)]">Warranty on all work</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
