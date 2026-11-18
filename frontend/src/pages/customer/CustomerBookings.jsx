import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  ArrowRight,
  Home,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileText,
  CreditCard,
  ShieldCheck
} from 'lucide-react';

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Address Modal state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newStreet, setNewStreet] = useState('');
  const [newLocality, setNewLocality] = useState('Central Area');
  const [newCity, setNewCity] = useState('Delhi NCR');
  const [addressError, setAddressError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bkRes, addrRes] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/customers/addresses')
      ]);
      setBookings(bkRes.data);
      setAddresses(addrRes.data);
    } catch (err) {
      console.error("Error loading customer data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddressError('');
    try {
      await api.post('/customers/addresses', {
        label: newLabel,
        street_address: newStreet,
        locality: newLocality,
        city: newCity,
        state: 'India',
        postal_code: '110001',
        is_default: addresses.length === 0
      });
      setShowAddAddress(false);
      setNewStreet('');
      fetchData();
    } catch (err) {
      setAddressError(err.response?.data?.detail || "Failed to add address.");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to remove this address?")) return;
    try {
      await api.delete(`/customers/addresses/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete address.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Customer Dashboard & Service Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track active appointments, live chat with technicians, and manage verified addresses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/customer/requests/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Post New Request
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Bookings List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Your Service Appointments
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 text-center rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm transition-colors">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">No bookings created yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Explore local verified professionals across all categories or submit a custom request.
              </p>
              <Link
                to="/search"
                className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Find Providers
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                        Ref: {b.booking_reference}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{b.service_name}</h3>
                    </div>
                    <StatusBadge status={b.current_status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div>
                      <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Assigned Specialist</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{b.provider_business || b.provider_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Schedule</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        {b.scheduled_date} ({b.scheduled_time_slot})
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 block">Total Amount</span>
                      <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">₹{b.total_amount}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/customer/bookings/${b.id}`}
                        className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Live Track & Chat
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Addresses Sidebar (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Saved Addresses</h2>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Address
            </button>
          </div>

          {/* Add Address Form Box */}
          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="bg-blue-50/70 dark:bg-slate-800 p-4 rounded-xl border border-blue-200 dark:border-slate-700 space-y-3 text-xs">
              <h4 className="font-bold text-blue-900 dark:text-blue-300">Add New Service Address</h4>
              {addressError && <p className="text-rose-600">{addressError}</p>}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Label (e.g. Home, Office, Studio)</label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">City / Region</label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg outline-none text-xs"
                  >
                    {['Delhi NCR', 'Noida', 'Aligarh', 'Lucknow', 'Agra', 'Kanpur', 'Bangalore', 'Mumbai'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Locality / Sector</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sector 62 / Civil Lines"
                    value={newLocality}
                    onChange={(e) => setNewLocality(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg outline-none text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Street / House Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 102, Green Valley Apartments"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg outline-none text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {addresses.map((a) => (
              <div key={a.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between gap-2 text-xs transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{a.label}</span>
                    {a.is_default && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{a.street_address}</p>
                  <p className="text-slate-400 dark:text-slate-500">{a.locality}, {a.city} - {a.postal_code}</p>
                </div>

                <button
                  onClick={() => handleDeleteAddress(a.id)}
                  title="Remove address"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
