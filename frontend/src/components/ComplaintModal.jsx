import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  Sparkles,
  RefreshCw,
  PhoneCall,
  DollarSign,
  HelpCircle,
  FileText
} from 'lucide-react';

const COMMON_ISSUES = [
  { id: 'quality', label: 'Substandard Quality of Work', icon: '🛠️', defaultResolution: 're_service' },
  { id: 'delay', label: 'Technician Arrived Too Late / No-Show', icon: '⏰', defaultResolution: 'instant_refund' },
  { id: 'pricing', label: 'Overcharged or Extra Demanded', icon: '💰', defaultResolution: 'instant_refund' },
  { id: 'conduct', label: 'Unprofessional or Impolite Behavior', icon: '🗣️', defaultResolution: 'admin_review' },
  { id: 'damage', label: 'Appliance or Property Damage', icon: '📦', defaultResolution: 'instant_refund' },
  { id: 'other', label: 'Other Issue with Service', icon: '❓', defaultResolution: 'admin_review' },
];

const RESOLUTION_OPTIONS = [
  {
    id: 'instant_refund',
    title: 'Instant Refund (Fast-Track)',
    desc: 'Auto-credited to original payment method or wallet under Buyer Protection.',
    badge: 'Fastest (Instant)',
    icon: DollarSign,
    color: 'emerald'
  },
  {
    id: 're_service',
    title: 'Free Expert Re-Service',
    desc: 'Senior supervisor assigned for complete re-work at no extra cost.',
    badge: 'Within 24 Hours',
    icon: RefreshCw,
    color: 'blue'
  },
  {
    id: 'admin_review',
    title: 'Senior Support Investigation',
    desc: 'A dedicated complaints officer will review the chat logs and call you.',
    badge: 'Priority Queue',
    icon: PhoneCall,
    color: 'amber'
  }
];

export default function ComplaintModal({ booking, isOpen, onClose, onComplaintResolved }) {
  const [existingComplaint, setExistingComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState('Substandard Quality of Work');
  const [preferredResolution, setPreferredResolution] = useState('instant_refund');
  const [description, setDescription] = useState('');
  const [autoResolve, setAutoResolve] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resolvedResult, setResolvedResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !booking) return;

    const checkExisting = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/complaints/booking/${booking.id}`);
        if (res.data) {
          const item = Array.isArray(res.data) ? res.data[0] : res.data;
          setExistingComplaint(item || null);
        }
      } catch (err) {
        // No existing complaint or error
        setExistingComplaint(null);
      } finally {
        setLoading(false);
      }
    };
    checkExisting();
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        booking_id: booking.id,
        category: selectedIssue,
        description: description || `Issue reported: ${selectedIssue}. Customer requested ${preferredResolution}.`,
        preferred_resolution: preferredResolution,
        auto_resolve: autoResolve
      };

      const res = await api.post('/complaints', payload);
      setResolvedResult(res.data);
      if (onComplaintResolved) onComplaintResolved(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Fast-Track Resolution Center
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Buyer Protection
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Booking Ref: <strong className="font-mono text-slate-700 dark:text-slate-300">{booking.booking_reference}</strong> • {booking.service_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900">
            {error}
          </div>
        )}

        {/* Success / Resolved View */}
        {resolvedResult || (existingComplaint && existingComplaint.status === 'resolved') ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-sm animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Complaint Resolved Instantly!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Your issue has been resolved automatically under the <strong>LocalFix 100% Service Guarantee</strong>.
              </p>
            </div>

            {/* Resolution Details Card */}
            <div className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-600 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Resolution Reference:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {(() => {
                    const notes = resolvedResult?.resolution_notes || existingComplaint?.resolution_notes || '';
                    const parts = notes.split('ID: ');
                    if (parts && parts.length > 1 && parts[1]) {
                      return parts[1].split('.')[0].trim();
                    }
                    return 'RES-AUTO-VERIFIED';
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-600 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Outcome Action:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {resolvedResult?.preferred_resolution === 'instant_refund'
                    ? `100% Refund Approved (₹${booking.total_amount})`
                    : resolvedResult?.preferred_resolution === 're_service'
                    ? 'Free Re-service Voucher Issued'
                    : 'Priority Support Scheduled'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Resolution Summary:</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {resolvedResult?.resolution_notes || existingComplaint?.resolution_notes || 'Resolved under customer satisfaction guarantee.'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition"
            >
              Done & Close
            </button>
          </div>
        ) : existingComplaint ? (
          /* Existing Pending / Under Review Complaint */
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-amber-900 dark:text-amber-200">
                  Complaint In Progress ({existingComplaint.status.toUpperCase()})
                </h4>
                <p className="text-amber-700 dark:text-amber-300">
                  A ticket has already been opened for this booking. Our team has flagged this for immediate inspection.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-xl space-y-2 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Category:</strong> {existingComplaint.category}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Details:</strong> {existingComplaint.description}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-[11px]">
                Filed On: {new Date(existingComplaint.created_at).toLocaleString()}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-semibold text-xs"
            >
              Close Window
            </button>
          </div>
        ) : (
          /* New Complaint Submission Form */
          <form onSubmit={handleSubmitComplaint} className="space-y-5">
            {/* 1-Click Quick Issue Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                1. What went wrong with your service?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMMON_ISSUES.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => {
                      setSelectedIssue(issue.label);
                      setPreferredResolution(issue.defaultResolution);
                    }}
                    className={`p-3 rounded-2xl border text-left text-xs font-semibold flex items-center gap-2.5 transition ${
                      selectedIssue === issue.label
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="text-lg">{issue.icon}</span>
                    <span className="flex-1">{issue.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 1-Click Preferred Resolution Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                2. How would you prefer us to resolve this?
              </label>
              <div className="space-y-2">
                {RESOLUTION_OPTIONS.map((res) => {
                  const Icon = res.icon;
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setPreferredResolution(res.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left text-xs transition flex items-start gap-3 ${
                        preferredResolution === res.id
                          ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600 text-blue-600 dark:text-blue-400 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{res.title}</span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            {res.badge}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{res.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                3. Additional Details (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share any specific notes or photos/details you want our team to note..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500"
              />
            </div>

            {/* Fast-Track Auto-Resolve Guarantee Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 block">
                    Fast-Track Instant Auto-Resolution
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Complaints with standard resolutions are resolved in &lt; 5 seconds.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoResolve}
                onChange={(e) => setAutoResolve(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                {submitting ? 'Resolving...' : 'Submit & Resolve Now'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
