import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import {
  ShieldCheck,
  Users,
  Briefcase,
  Calendar,
  AlertTriangle,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  History,
  BarChart3,
  Search,
  Filter,
  Eye,
  EyeOff,
  Lock,
  Download,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verification Requests State
  const [verifications, setVerifications] = useState([]);
  const [verificationTotal, setVerificationTotal] = useState(0);
  const [verificationPage, setVerificationPage] = useState(1);
  const [verificationTotalPages, setVerificationTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [searchQuery, setSearchQuery] = useState('');
  const [verifLoading, setVerifLoading] = useState(false);

  // Application Dossier Inspection Modal
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [revealedAadhaar, setRevealedAadhaar] = useState(null);
  const [revealingAadhaar, setRevealingAadhaar] = useState(false);
  const [internalNote, setInternalNote] = useState('');

  // Rejection modal
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Confirmation modal for approval
  const [approvingApp, setApprovingApp] = useState(null);

  // Dispute resolution modal
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchAnalyticsAndDisputes = async () => {
    try {
      const [analyticsRes, dispRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/disputes')
      ]);
      setAnalytics(analyticsRes.data);
      setDisputes(dispRes.data);
    } catch (err) {
      console.error("Error loading admin telemetry:", err);
    }
  };

  const fetchVerifications = async (page = 1, status = statusFilter, search = searchQuery) => {
    setVerifLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('status', status);
      params.append('page', page);
      params.append('page_size', '10');
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/admin/verifications?${params.toString()}`);
      setVerifications(res.data.items || []);
      setVerificationTotal(res.data.total || 0);
      setVerificationPage(res.data.page || 1);
      setVerificationTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error("Error fetching provider verifications:", err);
    } finally {
      setVerifLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchAnalyticsAndDisputes(),
        fetchVerifications(1, 'ALL', '')
      ]);
      setLoading(false);
    };
    init();
  }, []);

  const handleFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setVerificationPage(1);
    fetchVerifications(1, newStatus, searchQuery);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setVerificationPage(1);
    fetchVerifications(1, statusFilter, searchQuery);
  };

  const handleOpenDossier = async (provider) => {
    try {
      const res = await api.get(`/admin/verifications/${provider.id || provider.provider_id}`);
      setSelectedApplication(res.data);
      setRevealedAadhaar(null);
      setInternalNote(res.data.internal_verification_note || '');
    } catch (err) {
      alert("Failed to load application dossier details.");
    }
  };

  const handleRevealAadhaar = async (providerId) => {
    setRevealingAadhaar(true);
    try {
      const res = await api.get(`/admin/verifications/${providerId}/reveal-aadhaar`);
      setRevealedAadhaar(res.data.aadhaar_number);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not decrypt Aadhaar record. Ensure you have administrator clearance.");
    } finally {
      setRevealingAadhaar(false);
    }
  };

  const handleApprove = async () => {
    if (!approvingApp) return;
    setSubmittingDecision(true);
    try {
      const pId = approvingApp.id || approvingApp.provider_id;
      await api.post(`/admin/verifications/${pId}/decision`, {
        action: 'approve',
        internal_note: internalNote.trim() || undefined
      });
      setApprovingApp(null);
      setSelectedApplication(null);
      fetchVerifications(verificationPage, statusFilter, searchQuery);
      fetchAnalyticsAndDisputes();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to record approval.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingApp) return;
    if (!rejectionReason.trim()) {
      setRejectionError('A mandatory rejection reason is required before rejecting.');
      return;
    }
    setSubmittingDecision(true);
    setRejectionError('');
    try {
      const pId = rejectingApp.id || rejectingApp.provider_id;
      await api.post(`/admin/verifications/${pId}/decision`, {
        action: 'reject',
        rejection_reason: rejectionReason.trim(),
        internal_note: internalNote.trim() || undefined
      });
      setRejectingApp(null);
      setRejectionReason('');
      setSelectedApplication(null);
      fetchVerifications(verificationPage, statusFilter, searchQuery);
      fetchAnalyticsAndDisputes();
    } catch (err) {
      setRejectionError(err.response?.data?.detail || "Failed to record rejection decision.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleResolveDispute = async (complaintId, action) => {
    if (!resolutionNotes.trim()) {
      alert("Please provide official resolution findings.");
      return;
    }
    try {
      await api.post(`/admin/disputes/${complaintId}/resolve`, {
        action: action,
        resolution_notes: resolutionNotes
      });
      setResolvingDispute(null);
      setResolutionNotes('');
      fetchAnalyticsAndDisputes();
    } catch (err) {
      alert("Failed to resolve dispute.");
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto py-16 text-center text-sm text-slate-500 dark:text-slate-400">Loading administrator control center...</div>;
  }

  const metrics = analytics?.metrics || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Administrator Governance & Verification Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Provider KYC inspection, verified local discovery oversight, and customer complaint redressal
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Live & Enforced
          </span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customers</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total_customers}</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Providers</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics.verified_providers} <span className="text-xs text-slate-400 font-normal">/ {metrics.total_providers}</span>
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Verif.</span>
          <p className="text-2xl font-black text-amber-500">{metrics.pending_verifications}</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {metrics.total_bookings} <span className="text-xs text-slate-400 font-normal">({metrics.completed_bookings} done)</span>
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1 col-span-2 sm:col-span-1 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform Volume</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">₹{(Number(metrics.total_revenue_inr) || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* SECTION 2: Provider Verification Requests */}
      <section className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-700 shadow-sm space-y-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Provider Verification Requests
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Review new provider onboarding applications, inspect encrypted credentials, and render approval/rejection decisions.
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, organisation, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl outline-none text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap border-b border-slate-100 dark:border-slate-700 pb-3">
          {[
            { label: 'All Applications', value: 'ALL' },
            { label: 'Pending Review', value: 'PENDING' },
            { label: 'Approved & Verified', value: 'APPROVED' },
            { label: 'Rejected Applications', value: 'REJECTED' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="text-xs text-slate-400 ml-auto font-medium">
            Total records: {verificationTotal}
          </span>
        </div>

        {/* Verification Requests Table / List */}
        {verifLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading applications...</div>
        ) : verifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600 dark:text-slate-300">No applications found matching status "{statusFilter}".</p>
            <p>New providers will appear here once registered.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Provider</th>
                  <th className="py-3 px-3">Skill / Profession</th>
                  <th className="py-3 px-3">Service Location</th>
                  <th className="py-3 px-3">Govt ID (Aadhaar)</th>
                  <th className="py-3 px-3">Submission Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                {verifications.map((v) => (
                  <tr key={v.id || v.provider_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{v.full_name}</p>
                        <p className="text-slate-400 text-[11px]">{v.email}</p>
                        {v.organisation_name && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-medium">
                            {v.organisation_name}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                        {v.primary_skill || 'General Services'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{v.city || 'Aligarh'}</p>
                        <p className="text-slate-400 text-[11px] truncate max-w-xs">{v.service_address}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-500" />
                        {v.masked_aadhaar || `XXXX-XXXX-${v.aadhaar_last4 || '****'}`}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                      {v.submitted_at || 'Recently'}
                    </td>

                    <td className="py-3.5 px-3">
                      <StatusBadge status={v.verification_status} />
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDossier(v)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold rounded-lg transition flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Review Dossier
                        </button>

                        {v.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => setApprovingApp(v)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectingApp(v);
                                setRejectionReason('');
                                setRejectionError('');
                              }}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {verificationTotalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4 text-xs">
            <span className="text-slate-500">
              Page {verificationPage} of {verificationTotalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={verificationPage <= 1}
                onClick={() => {
                  const p = Math.max(1, verificationPage - 1);
                  setVerificationPage(p);
                  fetchVerifications(p, statusFilter, searchQuery);
                }}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                disabled={verificationPage >= verificationTotalPages}
                onClick={() => {
                  const p = Math.min(verificationTotalPages, verificationPage + 1);
                  setVerificationPage(p);
                  fetchVerifications(p, statusFilter, searchQuery);
                }}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 disabled:opacity-40 flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Analytics Chart & Dispute Resolution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Recharts Analytics Visualization (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Service Category Distribution (Demand Analytics)
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.category_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                <XAxis dataKey="category_name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '12px', border: '1px solid #334155', fontSize: '12px' }}
                />
                <Bar dataKey="bookings" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaints Quick Summary */}
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Complaints Redressal Queue
            </h3>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
              {disputes.length} Active
            </span>
          </div>

          {disputes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No customer disputes currently open.
            </div>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {disputes.map((d) => (
                <div key={d.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{d.category}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-xs">{d.description}</p>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-600">
                    <button
                      onClick={() => setResolvingDispute(d)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px]"
                    >
                      Resolve Dispute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL 1: Full Application Dossier Inspection --- */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Provider Verification Dossier
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedApplication.full_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedApplication.organisation_name || selectedApplication.business_name || 'Independent Professional'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedApplication.verification_status} />
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Contact Details</span>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedApplication.email}
                </p>
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedApplication.phone}
                </p>
              </div>

              <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Skill & Experience</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Skill: {selectedApplication.primary_skill}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Experience: {selectedApplication.experience_years} years
                </p>
              </div>

              <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl sm:col-span-2">
                <span className="text-slate-400 block text-[11px]">Service Address & Coordinates</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedApplication.service_address}, {selectedApplication.city}, {selectedApplication.state} - {selectedApplication.pincode}
                </p>
                <p className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  GPS Coords: {selectedApplication.latitude}, {selectedApplication.longitude}
                </p>
              </div>
            </div>

            {/* Secure Identity Documents Inspection */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200 dark:border-slate-600 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Submitted Identity Documents & Verification Assets
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Profile Photo */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                    Profile Photograph
                  </span>
                  {selectedApplication.has_profile_photo ? (
                    <a
                      href={`/api/admin/verifications/${selectedApplication.provider_id}/document/profile_photo`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-lg font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View Photo
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Not uploaded</span>
                  )}
                </div>

                {/* Aadhaar Document */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                    Aadhaar Card Document
                  </span>
                  {selectedApplication.has_aadhaar_doc ? (
                    <a
                      href={`/api/admin/verifications/${selectedApplication.provider_id}/document/aadhaar`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-lg font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" /> Inspect Document
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Not uploaded</span>
                  )}
                </div>

                {/* Resume / Certificate */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                    Resume / Certification
                  </span>
                  {selectedApplication.has_resume_doc ? (
                    <a
                      href={`/api/admin/verifications/${selectedApplication.provider_id}/document/resume`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-lg font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" /> View Resume
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Not uploaded</span>
                  )}
                </div>
              </div>

              {/* Secure Aadhaar Number Reveal */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold block">
                    Aadhaar Number (Encrypted at Rest)
                  </span>
                  <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                    {revealedAadhaar ? (
                      <span className="text-emerald-700 dark:text-emerald-400 tracking-wider">{revealedAadhaar}</span>
                    ) : (
                      selectedApplication.masked_aadhaar || `XXXX-XXXX-${selectedApplication.aadhaar_last4}`
                    )}
                  </span>
                </div>
                {!revealedAadhaar ? (
                  <button
                    onClick={() => handleRevealAadhaar(selectedApplication.provider_id)}
                    disabled={revealingAadhaar}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1 self-start sm:self-auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {revealingAadhaar ? 'Decrypting...' : 'Reveal Full Aadhaar'}
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-1 rounded-lg">
                    Decrypted & Access Logged to Audit Trail
                  </span>
                )}
              </div>
            </div>

            {/* Decision History if already reviewed */}
            {(selectedApplication.verified_at || selectedApplication.rejection_reason) && (
              <div className="p-3 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-xs space-y-1">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Decision Audit Record</span>
                {selectedApplication.verified_by_admin && (
                  <p className="text-slate-700 dark:text-slate-300">
                    Reviewed by Admin: <strong>{selectedApplication.verified_by_admin}</strong> on {selectedApplication.verified_at}
                  </p>
                )}
                {selectedApplication.rejection_reason && (
                  <p className="text-rose-700 dark:text-rose-300">
                    Recorded Rejection Reason: <em>"{selectedApplication.rejection_reason}"</em>
                  </p>
                )}
                {selectedApplication.internal_verification_note && (
                  <p className="text-slate-500 italic">
                    Internal Note: {selectedApplication.internal_verification_note}
                  </p>
                )}
              </div>
            )}

            {/* Internal Note Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Internal Verification Note (Optional)
              </label>
              <textarea
                rows={2}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Internal notes visible only to platform administrators..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white outline-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setSelectedApplication(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close Dossier
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRejectingApp(selectedApplication);
                    setRejectionReason('');
                    setRejectionError('');
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => setApprovingApp(selectedApplication)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  Approve Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Mandatory Rejection Reason Dialog --- */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reject Application for {rejectingApp.full_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  A rejection email containing this explanation will be sent to the provider.
                </p>
              </div>
            </div>

            {rejectionError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {rejectionError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                Mandatory Rejection Reason *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Aadhaar card photo is blurry or cropped. Please upload a clear original document with all corners visible."
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingApp(null)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision || !rejectionReason.trim()}
                onClick={handleReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                {submittingDecision ? 'Rejecting...' : 'Confirm Rejection & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Approval Confirmation Dialog --- */}
      {approvingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Approve Verification for {approvingApp.full_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will change the provider status to <strong>APPROVED</strong>, enable their profile to be discovered by local customers, and dispatch an approval notification email.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovingApp(null)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision}
                onClick={handleApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                {submittingDecision ? 'Approving...' : 'Confirm Approval & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Dispute Resolution --- */}
      {resolvingDispute && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Official Resolution: {resolvingDispute.category}
            </h3>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Official findings and remedy (e.g. Full refund processed via mock UPI gateway)..."
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResolvingDispute(null)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveDispute(resolvingDispute.id, 'resolve')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
