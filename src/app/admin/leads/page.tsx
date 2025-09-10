"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthInstance } from "@/lib/firebase";
// Admin check handled by middleware
import type { User } from "firebase/auth";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  description: string;
  budget?: string;
  timeline?: string;
  projectSize?: string;
  customQuote: boolean;
  estimate?: { minPrice?: number; maxPrice?: number; timeline?: string; complexity?: string };
  timestamp?: string;
  createdAt: Date;
  status?: 'new' | 'contacted' | 'quoted' | 'converted' | 'closed';
  adminNotes?: string;
  lastContacted?: Date;
}

export default function LeadsManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [quickMessage, setQuickMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setUser(user);
          await loadLeads();
        } else {
          router.push("/login");
        }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const loadLeads = async () => {
    try {
      const response = await fetch("/api/leads");
      
      if (response.ok) {
        const data = await response.json();
        // Convert date strings back to Date objects
        const leadsWithDates = data.map((lead: Lead) => ({
          ...lead,
          createdAt: new Date(lead.createdAt),
          lastContacted: lead.lastContacted ? new Date(lead.lastContacted) : undefined
        }));
        setLeads(leadsWithDates);
      } else {
        console.error("Failed to load leads, status:", response.status);
      }
    } catch (error) {
      console.error("Error loading leads:", error);
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setAdminNotes(lead.adminNotes || '');
    setQuickMessage('');
    setIsModalOpen(true);
  };

  const handleSendEmail = () => {
    if (!selectedLead || !quickMessage.trim()) return;
    
    const subject = `Re: Your Project Inquiry - ${selectedLead.projectType}`;
    const body = `Hi ${selectedLead.name},\n\n${quickMessage}\n\nBest regards`;
    const mailtoLink = `mailto:${selectedLead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoLink, '_blank');
    setQuickMessage('');
  };

  const handleSendSMS = () => {
    if (!selectedLead || !selectedLead.phone || !quickMessage.trim()) return;
    
    const smsBody = `Hi ${selectedLead.name}, ${quickMessage}`;
    const smsLink = `sms:${selectedLead.phone}?body=${encodeURIComponent(smsBody)}`;
    
    window.open(smsLink, '_blank');
    setQuickMessage('');
  };

  const handleCopyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leadId,
          status: newStatus,
          adminNotes: adminNotes
        })
      });

      if (response.ok) {
        await loadLeads(); // Reload leads
        setIsModalOpen(false);
        setSelectedLead(null);
        setAdminNotes('');
      } else {
        console.error("Failed to update lead");
      }
    } catch (error) {
      console.error("Error updating lead:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'quoted': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.projectType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lead Management</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Manage and respond to customer inquiries</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/admin")}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Back to Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Leads</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{leads.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">New</p>
              <p className="text-2xl font-semibold text-blue-600">{leads.filter(l => l.status === 'new' || !l.status).length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Contacted</p>
              <p className="text-2xl font-semibold text-yellow-600">{leads.filter(l => l.status === 'contacted').length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Quoted</p>
              <p className="text-2xl font-semibold text-purple-600">{leads.filter(l => l.status === 'quoted').length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Converted</p>
              <p className="text-2xl font-semibold text-green-600">{leads.filter(l => l.status === 'converted').length}</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="quoted">Quoted</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads List */}
        <div className="bg-[color:var(--card)] rounded-lg shadow overflow-hidden border border-[color:var(--border)]">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No leads found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No leads have been submitted yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => handleLeadClick(lead)}
                  className="p-6 hover:bg-[color:var(--muted)] cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{lead.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status || 'new')}`}>
                          {lead.status || 'new'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{lead.email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {lead.projectType} • {lead.projectSize} • {lead.timeline}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{lead.description}</p>
                      {lead.estimate && (
                        <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                          <strong>Estimate:</strong> ${lead.estimate.minPrice?.toLocaleString()} - ${lead.estimate.maxPrice?.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <p>{lead.createdAt.toLocaleDateString()}</p>
                      <p>{lead.createdAt.toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lead Detail Modal */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/40 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-[color:var(--card)] border border-[color:var(--border)] p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Lead Details</h2>
            
            <div className="space-y-4 mb-6 text-[color:var(--foreground)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <p className="text-gray-900 dark:text-white">{selectedLead.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-900 dark:text-white flex-1">{selectedLead.email}</p>
                  <button
                    onClick={() => handleCopyToClipboard(selectedLead.email, 'email')}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                  >
                    {copiedField === 'email' ? (
                      <>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                  <a
                    href={`mailto:${selectedLead.email}?subject=Re: Your Project Inquiry&body=Hi ${selectedLead.name},%0D%0A%0D%0AThank you for your interest in our services. I'd like to discuss your project in more detail.%0D%0A%0D%0ABest regards`}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </a>
                </div>
              </div>
              {selectedLead.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900 dark:text-white flex-1">{selectedLead.phone}</p>
                    <button
                      onClick={() => selectedLead.phone && handleCopyToClipboard(selectedLead.phone, 'phone')}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                    >
                      {copiedField === 'phone' ? (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call
                    </a>
                    <a
                      href={`sms:${selectedLead.phone}`}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      SMS
                    </a>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Details</label>
                <p className="text-gray-900 dark:text-white">{selectedLead.projectType} • {selectedLead.projectSize} • {selectedLead.timeline}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <p className="text-gray-900 dark:text-white">{selectedLead.description}</p>
              </div>
              {selectedLead.estimate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estimate</label>
                  <p className="text-gray-900 dark:text-white">
                    ${selectedLead.estimate.minPrice?.toLocaleString()} - ${selectedLead.estimate.maxPrice?.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-2">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--popover)] text-[color:var(--foreground)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent"
                rows={3}
                placeholder="Add notes about this lead..."
              />
            </div>

            {/* Quick Contact Section */}
            <div className="mb-6 p-4 bg-[color:var(--muted)] rounded-lg">
              <h3 className="text-lg font-semibold text-[color:var(--foreground)] mb-3">Quick Contact</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-1">Quick Message</label>
                  <textarea
                    value={quickMessage}
                    onChange={(e) => setQuickMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--popover)] text-[color:var(--foreground)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent"
                    rows={2}
                    placeholder="Type a quick message to send to the client..."
                  />
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleSendEmail}
                    disabled={!quickMessage.trim()}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Send Email
                  </button>
                  {selectedLead.phone && (
                    <button 
                      onClick={handleSendSMS}
                      disabled={!quickMessage.trim()}
                      className="flex-1 bg-[color:oklch(0.646_0.222_41.116)] text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Send SMS
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusUpdate(selectedLead.id, 'contacted')}
                  disabled={isUpdating}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  Mark as Contacted
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedLead.id, 'quoted')}
                  disabled={isUpdating}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Mark as Quoted
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedLead.id, 'converted')}
                  disabled={isUpdating}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Mark as Converted
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
