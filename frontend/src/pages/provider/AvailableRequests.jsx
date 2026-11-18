import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import {
  Briefcase,
  MapPin,
  Clock,
  Send,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

export default function AvailableRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quotation Modal state
  const [selectedReq, setSelectedReq] = useState(null);
  const [quotedAmount, setQuotedAmount] = useState('');
  const [workDesc, setWorkDesc] = useState('');
  const [durationHours, setDurationHours] = useState('1.5');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedSlot, setProposedSlot] = useState('10:00 AM - 01:00 PM');
  const [terms, setTerms] = useState('Includes 30 days standard work warranty.');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  const fetchAvailable = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/requests/available');
      setRequests(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not fetch requests. Ensure your profile is verified.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, []);

  const handleOpenQuoteModal = (req) => {
    setSelectedReq(req);
    setProposedDate(req.preferred_date);
    setProposedSlot(req.preferred_time_slot);
    setQuoteError('');
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    setQuoteError('');
    setSubmittingQuote(true);

    try {
      await api.post('/quotations', {
        request_id: selectedReq.id,
        quoted_amount: parseFloat(quotedAmount),
        work_description: workDesc,
        estimated_duration_hours: parseFloat(durationHours),
        proposed_date: proposedDate,
        proposed_time_slot: proposedSlot,
        additional_terms: terms || undefined
      });
      setSelectedReq(null);
      setQuotedAmount('');
      setWorkDesc('');
      alert("Quotation submitted successfully! Customer will review your bid.");
      fetchAvailable();
    } catch (err) {
      setQuoteError(err.response?.data?.detail || "Failed to submit quotation.");
    } finally {
      setSubmittingQuote(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/provider/dashboard" className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Jobs Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Open Customer Problem Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse active service requests matching your trade and submit competitive quotations.
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-sm text-amber-800">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Access Restricted</p>
            <p className="text-xs text-amber-700">{error}</p>
            <Link to="/provider/verification" className="text-xs font-bold text-amber-900 underline block pt-1">
              Go to Provider Verification →
            </Link>
          </div>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
          <p className="font-bold text-slate-700 text-sm">No new problem requests currently open in your category.</p>
          <p>Check back shortly as customers post new requests in your region.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">{r.title}</h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-semibold text-blue-600">{r.category_name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {r.locality}, {r.city}
                    </span>
                    <span>•</span>
                    <span>Desired: {r.preferred_date}</span>
                  </p>
                </div>

                <button
                  onClick={() => handleOpenQuoteModal(r)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Quotation
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{r.description}"
              </p>

              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>Customer: {r.customer_name}</span>
                <span>Slot requested: {r.preferred_time_slot}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Quotation Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Submit Quotation Bid</h3>
                <p className="text-xs text-slate-500">{selectedReq.title}</p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {quoteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{quoteError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitQuote} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quoted Price (₹ INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="50"
                    required
                    placeholder="e.g. 450"
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proposed Execution & Scope</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Explain exactly what you will fix, tools/materials you bring, and methodology..."
                  value={workDesc}
                  onChange={(e) => setWorkDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Proposed Date</label>
                  <input
                    type="date"
                    required
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Proposed Time Slot</label>
                  <select
                    value={proposedSlot}
                    onChange={(e) => setProposedSlot(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning)</option>
                    <option value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM (Afternoon)</option>
                    <option value="03:00 PM - 06:00 PM">03:00 PM - 06:00 PM (Evening)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Warranty & Terms</label>
                <input
                  type="text"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submittingQuote ? 'Sending Quotation...' : 'Submit Quotation to Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
