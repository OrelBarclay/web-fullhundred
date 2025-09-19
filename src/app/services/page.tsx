"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Service } from "@/server/db/schema";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        if (response.ok) {
          const data = await response.json();
          // Convert Firestore timestamps to Date objects and filter active services
          const servicesWithDates = data.map((service: Service) => ({
            ...service,
            createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
            updatedAt: service.updatedAt ? new Date(service.updatedAt) : new Date()
          }));
          const activeServices = servicesWithDates.filter((service: Service) => service.isActive);
          setServices(activeServices);
        } else {
          console.error("Failed to fetch services");
          // Fallback to hardcoded services if API fails
          setServices(getHardcodedServices());
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        // Fallback to hardcoded services if API fails
        setServices(getHardcodedServices());
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const getHardcodedServices = (): Service[] => [
    {
      id: "hardcoded-1",
      title: "Kitchen Remodeling",
      description: "Transform your kitchen into the heart of your home with our expert remodeling services. We handle everything from concept to completion.",
      features: [
        "Custom cabinetry and storage solutions",
        "Countertop installation and replacement",
        "Appliance integration and upgrades",
        "Lighting design and installation",
        "Flooring and backsplash options"
      ],
      iconColor: "blue",
      iconPath: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      isActive: true,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "hardcoded-2",
      title: "Bathroom Renovation",
      description: "Create your dream bathroom with our comprehensive renovation services. We specialize in both aesthetic and functional improvements.",
      features: [
        "Full bathroom remodeling and design",
        "Shower and tub installation",
        "Vanity and fixture upgrades",
        "Tile work and flooring",
        "Plumbing and electrical updates"
      ],
      iconColor: "green",
      iconPath: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
      isActive: true,
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "hardcoded-3",
      title: "Home Additions",
      description: "Expand your living space with our home addition services. We seamlessly integrate new spaces with your existing home design.",
      features: [
        "Room additions and extensions",
        "Second story additions",
        "Sunroom and porch construction",
        "Garage conversions",
        "Basement finishing"
      ],
      iconColor: "purple",
      iconPath: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      isActive: true,
      order: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "hardcoded-4",
      title: "Custom Carpentry",
      description: "Add unique character to your home with our custom carpentry services. From built-ins to decorative elements, we bring your vision to life.",
      features: [
        "Custom built-in furniture",
        "Crown molding and trim work",
        "Wainscoting and paneling",
        "Custom doors and windows",
        "Decorative woodwork"
      ],
      iconColor: "orange",
      iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      isActive: true,
      order: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "hardcoded-5",
      title: "Plumbing Services",
      description: "Professional plumbing solutions for your home. From repairs to installations, we ensure your plumbing systems work efficiently and reliably.",
      features: [
        "Pipe repair and replacement",
        "Fixture installation and upgrades",
        "Water heater services",
        "Drain cleaning and repair",
        "Emergency plumbing repairs"
      ],
      iconColor: "cyan",
      iconPath: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
      isActive: true,
      order: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "hardcoded-6",
      title: "Painting Services",
      description: "Transform your space with our professional painting services. We provide high-quality interior and exterior painting with attention to detail.",
      features: [
        "Interior and exterior painting",
        "Color consultation and design",
        "Surface preparation and priming",
        "Cabinet and furniture refinishing",
        "Decorative painting techniques"
      ],
      iconColor: "pink",
      iconPath: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z",
      isActive: true,
      order: 6,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "hardcoded-7",
      title: "Tiling Services",
      description: "Expert tile installation and repair services for all areas of your home. We work with all tile types and create beautiful, durable surfaces.",
      features: [
        "Floor and wall tile installation",
        "Bathroom and kitchen tiling",
        "Backsplash installation",
        "Tile repair and replacement",
        "Grout cleaning and sealing"
      ],
      iconColor: "indigo",
      iconPath: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
      isActive: true,
      order: 7,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "hardcoded-8",
      title: "Deck Construction",
      description: "Build the perfect outdoor living space with our custom deck construction services. We create durable, beautiful decks that enhance your home.",
      features: [
        "Custom deck design and construction",
        "Composite and wood decking options",
        "Railings and safety features",
        "Deck repair and maintenance",
        "Outdoor lighting integration"
      ],
      iconColor: "amber",
      iconPath: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2zM3 7l9-4 9 4M3 7l9 4 9-4M12 3v18",
      isActive: true,
      order: 8,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "hardcoded-9",
      title: "Project Management",
      description: "Let us handle the complexity of your renovation project. Our experienced project managers ensure smooth execution from start to finish.",
      features: [
        "Comprehensive project planning",
        "Timeline management and coordination",
        "Subcontractor coordination",
        "Quality control and inspections",
        "Communication and updates"
      ],
      iconColor: "red",
      iconPath: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
      isActive: true,
      order: 9,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const getIconComponent = (service: Service) => {
    const colorClass = `text-${service.iconColor}-600`;
    return (
      <svg className={`w-12 h-12 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={service.iconPath} />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-[color:var(--muted)] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[color:var(--muted-foreground)]">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* Hero Section */}
      <div className="bg-[color:var(--card)] border-b border-[color:var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-6">
              Our Services
            </h1>
            <p className="text-xl text-[color:var(--muted-foreground)] max-w-3xl mx-auto">
              We design, build, and renovate with a relentless focus on quality. 
              From concept to completion, we handle every detail of your project.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow p-8 hover:shadow-md hover:outline hover:outline-2 hover:outline-[color:var(--ring)] transition">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0">
                  {getIconComponent(service)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {service.title}
                  </h3>
                  <p className="text-[color:var(--muted-foreground)] leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-[color:var(--foreground)]">
                    <svg className="w-5 h-5 text-[color:oklch(0.488_0.243_264.376)] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-[color:var(--card)] border-t border-[color:var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Why Choose Full Hundred?
            </h2>
            <p className="text-xl text-[color:var(--muted-foreground)]">
              We bring decades of experience and a commitment to excellence to every project.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-[color:var(--muted)] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Craftsmanship</h3>
              <p className="text-[color:var(--muted-foreground)]">Every detail is executed with precision and care, ensuring lasting results.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-[color:var(--muted)] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[color:oklch(0.696_0.17_162.48)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">On-Time Delivery</h3>
              <p className="text-[color:var(--muted-foreground)]">We respect your time and deliver projects on schedule, every time.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-[color:var(--muted)] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[color:oklch(0.627_0.265_303.9)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 009.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Team</h3>
              <p className="text-[color:var(--muted-foreground)]">Our skilled professionals bring years of experience to every project.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Get a free, no-obligation quote and let&apos;s discuss how we can transform your space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#quote"
              className="bg-primary-foreground text-primary px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors duration-200"
            >
              Get Free Quote
            </Link>
            <Link
              href="/portfolio"
              className="border-2 border-primary-foreground text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground hover:text-primary transition-colors duration-200"
            >
              View Our Work
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
