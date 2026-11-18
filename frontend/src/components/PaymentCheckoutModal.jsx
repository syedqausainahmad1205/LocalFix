import React, { useState } from 'react';
import api from '../api/client';
import {
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Lock,
  X,
  ArrowRight,
  FileText,
  AlertCircle
} from 'lucide-react';

const UPI_APPS = [
  { name: 'Google Pay', icon: '🟢', id: 'gpay' },
  { name: 'PhonePe', icon: '🟣', id: 'phonepe' },
  { name: 'Paytm', icon: '🔵', id: 'paytm' },
  { name: 'BHIM UPI', icon: '🟠', id: 'bhim' },
];

const POPULAR_BANKS = [
  'HDFC Bank',
  'State Bank of India (SBI)',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank'
];

export default function PaymentCheckoutModal({ booking, isOpen, onClose, onPaymentSuccess, onViewInvoice }) {
  const [method, setMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'cod'
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('4532 8920 1123 4892');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('883');
  const [cardName, setCardName] = useState('Mohd A.');

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  if (!isOpen || !booking) return null;

  const basePrice = Number(booking.total_amount) || 0;
  const gstAmount = Math.round(basePrice * 0.18);
  const totalPayable = basePrice; // total_amount is already gross total or base price

  const handleCheckout = async () => {
    setProcessing(true);
    setError('');

    try {
      let backendMethod = 'mock_upi';
      if (method === 'card') backendMethod = 'card';
      else if (method === 'netbanking') backendMethod = 'netbanking';
      else if (method === 'cod') backendMethod = 'cash';

      await api.post('/payments/checkout', {
        booking_id: booking.id,
        payment_method: backendMethod
      });

      setSuccess(true);
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment authorization failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Secure Express Checkout
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  256-Bit SSL
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Booking: <strong className="font-mono text-slate-700 dark:text-slate-300">{booking.booking_reference}</strong> • {booking.service_name}
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
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          /* Payment Success Confirmation */
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-sm animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Payment Authorized Successfully!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                ₹{totalPayable} has been verified and held in escrow protection until the job is completed to your satisfaction.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-600 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Payment Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">PAID & VERIFIED</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-600 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  TXN-LF-{booking.id}-{Date.now().toString().slice(-6)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Payment Method:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{method}</span>
              </div>
            </div>

            <div className="flex gap-3">
              {onViewInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewInvoice();
                  }}
                  className="flex-1 py-3 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-xs border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1.5 transition"
                >
                  <FileText className="w-4 h-4" />
                  View Tax Invoice
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                Return to Booking
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Forms */
          <div className="space-y-5">
            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                  method === 'upi'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-bold">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                  method === 'card'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-bold">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('netbanking')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                  method === 'netbanking'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-bold">NetBanking</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('cod')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                  method === 'cod'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Banknote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-bold">Cash</span>
              </button>
            </div>

            {/* Tab 1: UPI & QR Code */}
            {method === 'upi' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Dynamic Mock QR Code */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
                    <div className="w-28 h-28 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-2 rounded-xl flex items-center justify-center text-white text-center">
                      <div className="space-y-1">
                        <QrCode className="w-12 h-12 mx-auto text-blue-400" />
                        <span className="text-[9px] font-mono block opacity-80">UPI QR</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 font-bold">
                      ₹{totalPayable}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-center sm:text-left">
                    <span className="font-bold text-slate-800 dark:text-white block">
                      Scan QR or Tap Any UPI App
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Instant zero-surcharge transfer via NPCI Unified Payments Interface.
                    </p>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg font-mono text-[11px] text-blue-900 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900">
                      VPA: localfix.escrow@icici
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={handleCheckout}
                      disabled={processing}
                      className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-500 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <span>{app.icon}</span>
                      <span className="text-slate-800 dark:text-white">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Credit / Debit Card */}
            {method === 'card' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                {/* Visual Card Preview */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white shadow-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs opacity-80">LocalFix SafePay Card</span>
                    <CreditCard className="w-5 h-5 opacity-90" />
                  </div>
                  <div className="font-mono text-base tracking-widest font-bold">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex justify-between text-[11px] font-mono">
                    <span>{cardName.toUpperCase() || 'CARD HOLDER'}</span>
                    <span>EXP: {cardExpiry || 'MM/YY'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 8920 1123 4892"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">CVV / CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Name on card"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Tab 3: NetBanking */}
            {method === 'netbanking' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block">
                  Select Popular Bank
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_BANKS.map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition ${
                        selectedBank === bank
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                          : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Cash on Service */}
            {method === 'cod' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                  <Banknote className="w-5 h-5 text-amber-600" />
                  <span>Pay Cash Upon Job Completion</span>
                </div>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  Pay directly to your assigned technician only after inspecting the finished service. The technician will generate an instant digital cash receipt upon receiving payment.
                </p>
              </div>
            )}

            {/* Cost Breakdown Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Standard Trade Fee</span>
                <span>₹{basePrice}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Platform Convenience Fee</span>
                <span className="text-emerald-600 font-semibold">FREE (₹0)</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Integrated GST (18% itemized)</span>
                <span>Included in Rate</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-600 flex justify-between items-center font-bold text-slate-900 dark:text-white text-sm">
                <span>Total Amount Payable</span>
                <span className="text-blue-600 dark:text-blue-400 text-base">₹{totalPayable}</span>
              </div>
            </div>

            {/* Action Checkout Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={processing}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                {processing ? 'Authorizing Payment...' : `Pay ₹${totalPayable} Securely`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
