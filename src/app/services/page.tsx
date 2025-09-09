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
          // Only show active services
          const activeServices = data.filter((service: Service) => service.isActive);
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
      order: 5,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Our Services
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
            <div key={service.id} className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0">
                  {getIconComponent(service)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Full Hundred?
            </h2>
            <p className="text-xl text-gray-600">
              We bring decades of experience and a commitment to excellence to every project.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Craftsmanship</h3>
              <p className="text-gray-600">Every detail is executed with precision and care, ensuring lasting results.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">On-Time Delivery</h3>
              <p className="text-gray-600">We respect your time and deliver projects on schedule, every time.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Team</h3>
              <p className="text-gray-600">Our skilled professionals bring years of experience to every project.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get a free, no-obligation quote and let&apos;s discuss how we can transform your space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#quote"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Get Free Quote
            </Link>
            <Link
              href="/portfolio"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              View Our Work
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
