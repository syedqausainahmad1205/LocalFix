import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import TrackingMap from '../../components/TrackingMap';
import ComplaintModal from '../../components/ComplaintModal';
import PaymentCheckoutModal from '../../components/PaymentCheckoutModal';
import InvoiceModal from '../../components/InvoiceModal';
import {
  Calendar,
  Clock,
  MapPin,
  Send,
  CreditCard,
  Star,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageSquare,
  ShieldCheck,
  ArrowLeft,
  FileText,
  Lock,
  Sparkles,
  Wifi,
  RefreshCw
} from 'lucide-react';

const MILESTONES = [
  'requested',
  'accepted',
  'confirmed',
  'on_the_way',
  'in_progress',
  'completed'
];

export default function BookingDetails() {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // Modals state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Review State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const wsRef = useRef(null);
  const chatContainerRef = useRef(null);

  const fetchBooking = async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data);
    } catch (err) {
      console.error("Error loading booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/booking/${id}`);
      setMessages((prev) => {
        // Prevent state update and re-render if message list has not changed
        if (
          prev.length === res.data.length &&
          prev.every((m, idx) => m.id === res.data[idx]?.id)
        ) {
          return prev;
        }
        return res.data;
      });
    } catch (err) {
      console.error("Error loading chat messages:", err);
    }
  };

  useEffect(() => {
    fetchBooking();
    fetchMessages();
  }, [id]);

  // Setup WebSocket connection with auto-reconnect and reliable fallback
  useEffect(() => {
    if (!token || !id) return;

    let isMounted = true;
    let ws = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/bookings/${id}/chat?token=${token}`;

        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (isMounted) {
              setMessages((prev) => {
                // Deduplicate if already present by unique database id
                if (prev.some((m) => m.id === data.id)) return prev;

                // Replace optimistic message if content matches
                const optIdx = prev.findIndex(
                  (m) => m.is_optimistic && m.content === data.content
                );
                if (optIdx !== -1) {
                  const updated = [...prev];
                  updated[optIdx] = data;
                  return updated;
                }
                return [...prev, data];
              });

              // Scroll only the internal chat box, never the window/page
              setTimeout(() => {
                if (chatContainerRef.current) {
                  chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
              }, 50);
            }
          } catch (err) {
            console.error("WS parse error:", err);
          }
        };

        ws.onerror = (err) => {
          console.warn("WebSocket error, active HTTP fallback engaged");
          if (isMounted) setIsWsConnected(false);
        };

        ws.onclose = () => {
          if (isMounted) setIsWsConnected(false);
        };
      } catch (err) {
        console.warn("Failed to instantiate WebSocket:", err);
        if (isMounted) setIsWsConnected(false);
      }
    };

    connectWebSocket();

    // Background safety polling (every 4s) without jumping or scrolling the page
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [id, token]);

  // Ultra-reliable instant send: HTTP persistence + server broadcast, no double-sending
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sendingMessage) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      booking_id: id,
      sender_id: user?.id,
      sender_name: user?.full_name || 'You',
      content: text,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_optimistic: true
    };

    // 1. Immediately update local chat UI with optimistic message
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    setSendingMessage(true);

    // Scroll internal chat container only
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 20);

    try {
      // 2. HTTP persistence (backend automatically broadcasts to all active WS listeners)
      const res = await api.post(`/messages/booking/${id}`, { content: text });
      
      // Update optimistic message with actual saved message from database
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.id)) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? res.data : m));
      });

      // Scroll internal chat box only
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    } catch (err) {
      console.error("HTTP send message error:", err);
      fetchMessages();
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        booking_id: booking.id,
        rating: rating,
        comment: comment || undefined
      });
      setReviewSubmitted(true);
      fetchBooking();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-sm text-slate-500 dark:text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
        Loading service booking details...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <p className="text-slate-800 dark:text-white font-bold">Booking not found.</p>
        <Link to="/customer/bookings" className="text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline block">
          Return to Customer Dashboard
        </Link>
      </div>
    );
  }

  const currentIdx = MILESTONES.indexOf(booking.current_status);
  const isPaid = Boolean(booking.payment);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-sm transition-colors">
        <div className="space-y-1">
          <Link to="/customer/bookings" className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-1 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Bookings
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Booking Ref: <span className="font-mono text-blue-600 dark:text-blue-400">{booking.booking_reference}</span>
            </h1>
            <StatusBadge status={booking.current_status} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Created on {new Date(booking.created_at).toLocaleDateString()} • Scheduled for <strong>{booking.scheduled_date} ({booking.scheduled_time_slot})</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 dark:text-slate-400 block font-medium">Service Total</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">₹{booking.total_amount}</span>
          </div>

          {(isPaid || booking.current_status === 'completed') && (
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-3.5 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              title="View Official Tax Invoice"
            >
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Tax Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Milestones Visual Progress Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 transition-colors">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Service Execution Progress
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {MILESTONES.map((m, idx) => {
            const isCompleted = currentIdx >= idx;
            const isCurrent = booking.current_status === m;

            return (
              <div
                key={m}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-700/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <span className="text-[11px] font-bold capitalize block">
                  {m.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Details, Payment & Reviews (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service & Provider Details */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">
              Service & Professional Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Service</span>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{booking.service_name}</p>
                {booking.special_instructions && (
                  <p className="text-slate-500 dark:text-slate-400 italic mt-1">"{booking.special_instructions}"</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Assigned Professional</span>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{booking.provider_business || booking.provider_name}</p>
                <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {booking.provider_phone || 'Protected Contact'}
                </p>
              </div>

              <div className="sm:col-span-2 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Service Destination Address</span>
                <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-medium">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  {booking.street_address}, {booking.locality}, {booking.city}
                </p>
              </div>
            </div>
          </div>

          {/* Live Provider GPS Tracking Map */}
          {['accepted', 'confirmed', 'on_the_way', 'in_progress', 'completed'].includes(booking.current_status) && (
            <TrackingMap
              providerName={booking.provider_business || booking.provider_name}
              providerPhone={booking.provider_phone}
              destinationAddress={`${booking.street_address}, ${booking.locality}, ${booking.city}`}
              destinationCoords={[27.9015, 78.0792]}
              providerCoords={[27.8920, 78.0850]}
              status={booking.current_status}
            />
          )}

          {/* Payment Card */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Payment Record & Escrow
              </h3>
              {isPaid ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Payment Completed
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Payment Pending
                </span>
              )}
            </div>

            {isPaid ? (
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-xl space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex justify-between">
                  <span className="text-emerald-700 dark:text-emerald-300">Transaction Reference:</span>
                  <span className="font-mono font-bold">{booking.payment.transaction_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700 dark:text-emerald-300">Amount Paid:</span>
                  <span className="font-bold">₹{booking.payment.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700 dark:text-emerald-300">Method:</span>
                  <span className="font-medium uppercase">{booking.payment.payment_method.replace('_', ' ')}</span>
                </div>

                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex justify-end">
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="text-emerald-800 dark:text-emerald-300 font-bold hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Download Official Tax Invoice
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Support instant UPI, QR Code, Cards, NetBanking or Cash on Service with LocalFix Buyer Escrow.
                </p>

                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                >
                  <Lock className="w-4 h-4" />
                  Proceed to Pay ₹{booking.total_amount} Securely
                </button>
              </div>
            )}
          </div>

          {/* Review Submission Card (If Completed) */}
          {booking.current_status === 'completed' && !reviewSubmitted && (
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                Submit Verified Review
              </h3>
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Overall Star Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm font-bold text-amber-600 ml-2">{rating} Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Feedback & Experience</label>
                  <textarea
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe punctuality, quality of work, cleanliness..."
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-sm"
                >
                  {submittingReview ? 'Publishing...' : 'Publish Verified Review'}
                </button>
              </form>
            </div>
          )}

          {/* Fast-Track Complaint / Dispute Action Banner */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-rose-900 dark:text-rose-200 block">
                  Experiencing an issue with this service?
                </span>
                <span className="text-rose-700 dark:text-rose-300 text-[11px]">
                  1-Click Fast-Track Resolution under LocalFix Buyer Protection Guarantee.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowComplaintModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm transition shrink-0"
            >
              Raise Fast-Track Complaint
            </button>
          </div>
        </div>

        {/* Right Column: Real-Time Chat (1 col) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[580px] transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Coordinator Chat
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {isWsConnected ? 'Real-Time Live' : 'Direct Sync'}
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500 p-4">
                Send a message to coordinate arrival, gate security, or problem details. Messages deliver instantly.
              </div>
            ) : (
              messages.map((m, idx) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1 mb-0.5 font-medium flex items-center gap-1">
                      {isMe ? 'You' : m.sender_name} • {m.created_at}
                      {m.is_optimistic && <span className="text-[9px] text-blue-400">sending...</span>}
                    </span>
                    <div
                      className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm transition-all ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-bl-none'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Send Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-white dark:bg-slate-800 rounded-b-2xl">
            <input
              type="text"
              placeholder="Type message to provider..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700"
            />
            <button
              type="submit"
              disabled={sendingMessage || !newMessage.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition shadow-sm"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Checkout Modal */}
      <PaymentCheckoutModal
        booking={booking}
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onPaymentSuccess={() => {
          fetchBooking();
        }}
        onViewInvoice={() => setShowInvoiceModal(true)}
      />

      {/* Complaint Modal */}
      <ComplaintModal
        booking={booking}
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        onComplaintResolved={() => {
          fetchBooking();
        }}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        bookingId={booking.id}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
}
