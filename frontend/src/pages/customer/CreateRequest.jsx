import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { FileText, Calendar, Clock, MapPin, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export default function CreateRequest() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categoryId, setCategoryId] = useState('');
  const [addressId, setAddressId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 01:00 PM');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, addrRes] = await Promise.all([
          api.get('/categories'),
          api.get('/customers/addresses')
        ]);
        setCategories(catRes.data);
        if (catRes.data.length > 0) setCategoryId(catRes.data[0].id);

        setAddresses(addrRes.data);
        if (addrRes.data.length > 0) setAddressId(addrRes.data[0].id);
      } catch (err) {
        console.error("Error loading request form data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!addressId) {
      setError("Please add or select a service delivery address.");
      return;
    }
    if (!preferredDate) {
      setError("Please choose a preferred service date.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/requests', {
        category_id: categoryId,
        address_id: addressId,
        title,
        description,
        preferred_date: preferredDate,
        preferred_time_slot: timeSlot,
        image_url: imageUrl || undefined
      });
      navigate('/customer/requests');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit service request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <Link to="/customer/bookings" className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-700 shadow-sm space-y-6 transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Post a Custom Service Request
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Describe your problem to receive competitive quotations from nearby verified professionals across all trades.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Service Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Service Address</label>
              {addresses.length === 0 ? (
                <div className="p-2 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-800 dark:text-amber-300">
                  No saved addresses found.{' '}
                  <Link to="/customer/bookings" className="underline font-bold">
                    Add address in dashboard
                  </Link>
                </div>
              ) : (
                <select
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}: {a.street_address}, {a.locality}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Problem Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Geyser tripping MCB or leaking bathroom pipe..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Description of Problem</label>
            <textarea
              rows="4"
              required
              placeholder="Provide symptoms, brand/model if applicable, when the problem started..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Time Window</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning)</option>
                <option value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM (Afternoon)</option>
                <option value="03:00 PM - 06:00 PM">03:00 PM - 06:00 PM (Evening)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Optional Photo / Image URL</label>
            <input
              type="url"
              placeholder="https://... image link of broken part"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => navigate('/customer/bookings')}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || addresses.length === 0}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Post Request for Quotations'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
