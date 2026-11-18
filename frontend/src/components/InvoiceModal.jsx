import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  FileText,
  Printer,
  X,
  CheckCircle2,
  Building,
  ShieldCheck,
  Download
} from 'lucide-react';

export default function InvoiceModal({ bookingId, isOpen, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !bookingId) return;

    const fetchInvoice = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/payments/booking/${bookingId}/invoice`);
        setInvoice(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load official invoice.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0.00';
    const num = typeof val === 'number' ? val : parseFloat(val);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        {/* Top Controls */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-slate-900 dark:text-white text-base">
              Tax Invoice & Payment Receipt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Generating official tax invoice receipt...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600">
            {error}
          </div>
        ) : invoice ? (
          /* Printable Tax Invoice Document */
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 text-slate-900 space-y-6 shadow-sm">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                    LX
                  </div>
                  <h1 className="text-xl font-black text-blue-900 tracking-tight">LOCALFIX</h1>
                </div>
                <p className="text-xs text-slate-500 mt-1">Verified Local Service Marketplace</p>
                <p className="text-[11px] font-mono text-slate-400">GSTIN: 07AAACL2024F1ZV</p>
              </div>

              <div className="text-right sm:text-right space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-block mb-1">
                  {invoice.payment_status?.toUpperCase() || 'PAID'}
                </span>
                <p className="text-xs font-mono font-bold text-slate-800">
                  Invoice #: {invoice.invoice_number}
                </p>
                <p className="text-[11px] text-slate-500">
                  Date: {invoice.date}
                </p>
              </div>
            </div>

            {/* Bill To & Service Provider Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Customer / Billed To:</span>
                <p className="font-bold text-slate-800 text-sm">{invoice.customer?.name}</p>
                <p className="text-slate-600">{invoice.customer?.email}</p>
                <p className="text-slate-500">{invoice.customer?.phone || 'Customer On Record'}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Executed By Professional:</span>
                <p className="font-bold text-slate-800 text-sm">{invoice.provider?.business_name || invoice.provider?.name}</p>
                <p className="text-slate-600">Lead Specialist: {invoice.provider?.name}</p>
                <p className="text-slate-500">{invoice.provider?.service_area || 'Regional Specialist'}</p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="text-left py-2">Service Description</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Net Rate</th>
                    <th className="text-right py-2">Total (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3">
                      <p className="font-bold text-slate-800">{invoice.service_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">Ref: {invoice.booking_reference}</p>
                    </td>
                    <td className="text-center py-3">1</td>
                    <td className="text-right py-3">₹{formatCurrency(invoice.base_amount)}</td>
                    <td className="text-right py-3 font-semibold">₹{formatCurrency(invoice.base_amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex flex-col items-end text-xs space-y-1.5">
              <div className="flex justify-between w-64 text-slate-600 dark:text-slate-300">
                <span>Subtotal (Net):</span>
                <span>₹{formatCurrency(invoice.base_amount)}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-600 dark:text-slate-300">
                <span>Central GST (CGST 9%):</span>
                <span>₹{formatCurrency((parseFloat(invoice.gst_amount) || 0) / 2)}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-600 dark:text-slate-300">
                <span>State GST (SGST 9%):</span>
                <span>₹{formatCurrency((parseFloat(invoice.gst_amount) || 0) / 2)}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-600 dark:text-slate-300">
                <span>Platform Facilitation:</span>
                <span className="text-emerald-600 font-semibold">₹0.00</span>
              </div>
              <div className="flex justify-between w-64 text-sm font-extrabold text-blue-900 dark:text-blue-300 border-t border-slate-200 dark:border-slate-700 pt-2">
                <span>Total Amount:</span>
                <span>₹{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>

            {/* Footer Terms */}
            <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                LocalFix 100% Satisfaction Guarantee & Escrow Protected
              </span>
              <span>Computer generated tax receipt, no physical signature required.</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
