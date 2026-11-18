import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import {
  FileText,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function CustomerRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests/my');
      setRequests(res.data);
    } catch (err) {
      console.error("Error loading service requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAcceptQuotation = async (quoteId) => {
    if (!window.confirm("Accept this quotation? This will create a confirmed appointment.")) return;
    setAcceptingId(quoteId);
    try {
      const res = await api.post(`/quotations/${quoteId}/accept`);
      alert("Quotation accepted! Appointment booked.");
      navigate(`/customer/bookings/${res.data.booking_id}`);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to accept quotation.");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectQuotation = async (quoteId) => {
    try {
      await api.post(`/quotations/${quoteId}/reject`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to reject quotation.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-700 shadow-sm transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            My Service Requests & Quotations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare bids submitted by verified technicians across your selected city and accept the best offer.
          </p>
        </div>

        <Link
          to="/customer/requests/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Post New Request
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 sm:p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm transition-colors">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No active service requests</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Need work done? Post a problem request to get personalized quotes from certified local professionals.
          </p>
          <Link
            to="/customer/requests/new"
            className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            Post Request Now
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{req.title}</h3>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{req.category_name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {req.locality}, {req.city}
                    </span>
                    <span>•</span>
                    <span>Target Date: {req.preferred_date}</span>
                  </p>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {req.quotations.length} Quotations Received
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                "{req.description}"
              </p>

              {/* Quotations List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Received Bids & Quotations
                </h4>

                {req.quotations.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Waiting for nearby verified providers to review request and submit quotes...
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {req.quotations.map((q) => (
                      <div
                        key={q.id}
                        className={`p-4 rounded-2xl border text-xs space-y-3 transition-all ${
                          q.status === 'accepted'
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                            : q.status === 'rejected'
                            ? 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-700 opacity-60'
                            : 'bg-white dark:bg-slate-700/70 border-slate-200 dark:border-slate-600 hover:border-blue-400 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block text-sm">
                              {q.provider_name || q.business_name}
                            </span>
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {(Number(q.provider_rating) || 0).toFixed(1)} Rating
                            </span>
                          </div>
                          <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">₹{q.quoted_amount}</span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          "{q.work_description}"
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-600">
                          <span>Est. Duration: ~{q.estimated_duration_hours} hrs</span>
                          <span>Slot: {q.proposed_time_slot}</span>
                        </div>

                        {q.additional_terms && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                            Terms: {q.additional_terms}
                          </p>
                        )}

                        {q.status === 'submitted' && (
                          <div className="pt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleRejectQuotation(q.id)}
                              className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 font-medium"
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              disabled={acceptingId === q.id}
                              onClick={() => handleAcceptQuotation(q.id)}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition"
                            >
                              {acceptingId === q.id ? 'Accepting...' : 'Accept & Book'}
                            </button>
                          </div>
                        )}

                        {q.status === 'accepted' && (
                          <div className="pt-1 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Quotation Accepted & Booked
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
