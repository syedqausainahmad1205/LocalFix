import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import {
  Wrench,
  MapPin,
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  FileText,
  Award,
  GraduationCap
} from 'lucide-react';

export default function ProviderProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, role } = useAuth();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [scheduledSlot, setScheduledSlot] = useState('10:00 AM - 01:00 PM');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPincode, setNewPincode] = useState('202001');
  const [instructions, setInstructions] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const res = await api.get(`/search/providers/${id}`);
        setProvider(res.data);
      } catch (err) {
        console.error("Error fetching provider:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && role === 'customer') {
      api.get('/customers/addresses')
        .then((res) => {
          setAddresses(res.data);
          if (res.data.length > 0) {
            setSelectedAddressId(res.data[0].id);
            setIsNewAddress(false);
          } else {
            setIsNewAddress(true);
          }
        })
        .catch((err) => {
          console.error("Could not fetch addresses", err);
          setIsNewAddress(true);
        });
    }
  }, [isAuthenticated, role]);

  const handleOpenBooking = (srv) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (role !== 'customer') {
      alert("Please sign in with a Customer account to book services. (You can sign in with customer@localfix.com / customer123)");
      return;
    }
    const serviceToBook = srv || provider?.services?.[0] || {
      service_id: 'default',
      service_name: `${provider?.primary_skill || 'General'} Home Inspection & Service`,
      final_price: 299,
      category_name: provider?.primary_skill || 'General Service'
    };
    setSelectedService(serviceToBook);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (isNewAddress || addresses.length === 0) {
      if (!newStreet.trim()) {
        setBookingError("Please enter your street / house address for service delivery.");
        return;
      }
    } else if (!selectedAddressId) {
      setBookingError("Please select a service delivery address.");
      return;
    }

    if (!scheduledDate) {
      setBookingError("Please choose an appointment date.");
      return;
    }

    const serviceId = selectedService?.service_id && selectedService.service_id !== 'default'
      ? selectedService.service_id
      : (provider?.services?.[0]?.service_id || null);

    if (!serviceId) {
      setBookingError("No service available for booking. Please try another provider.");
      return;
    }

    setSubmittingBooking(true);
    try {
      const payload = {
        service_id: serviceId,
        provider_id: provider.provider_id,
        scheduled_date: scheduledDate,
        scheduled_time_slot: scheduledSlot,
        special_instructions: instructions || undefined
      };

      if (isNewAddress || addresses.length === 0) {
        payload.street_address = newStreet.trim();
        payload.city = newCity.trim() || provider.city || "Aligarh";
        payload.postal_code = newPincode.trim() || "202001";
      } else {
        payload.address_id = selectedAddressId;
      }

      const res = await api.post('/bookings', payload);
      setBookingModalOpen(false);
      navigate(`/customer/bookings/${res.data.id}`);
    } catch (err) {
      setBookingError(err.response?.data?.detail || "Booking failed. Please try again.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-20 text-center text-sm text-slate-500 dark:text-slate-400">Loading verified profile...</div>;
  }

  if (!provider) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Provider not found</h2>
        <Link to="/search" className="text-blue-600 dark:text-blue-400 mt-2 inline-block font-semibold">
          Return to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5 flex-1">
            {/* Provider Profile Photo */}
            <div className="shrink-0">
              {provider.profile_photo_url ? (
                <img
                  src={provider.profile_photo_url}
                  alt={provider.full_name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-md bg-slate-100 dark:bg-slate-700"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                  {provider.full_name ? provider.full_name.charAt(0).toUpperCase() : 'P'}
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {provider.full_name}
                </h1>
                <StatusBadge status={provider.verification_status} />
                {provider.organisation_name ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    Shop: {provider.organisation_name}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Individual Professional
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 flex-wrap">
                <span>Field: <strong className="text-slate-800 dark:text-white">{provider.primary_skill || 'Professional'}</strong></span>
                <span>•</span>
                <span><strong>{provider.experience_years} Years</strong> Field Experience</span>
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Base Locality: <strong className="text-slate-700 dark:text-slate-300">{provider.service_area || provider.city}</strong></span>
              </p>

            {/* Teaching / Tutor Mode Badge & Details if provider is tutor */}
            {(provider.tutor_mode || /tutor|teach/i.test(provider.primary_skill || '') || /tutor|teach/i.test(provider.business_name || '')) && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm">
                    <GraduationCap className="w-4 h-4" />
                    Work: Teaching
                  </span>
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:purple-200 border border-purple-200 dark:border-purple-700">
                    Mode: {provider.tutor_mode === 'online' ? 'Online Live Classes' : provider.tutor_mode === 'offline' ? 'Offline (Home Tuition)' : 'Online & Offline (Both)'}
                  </span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-semibold block text-[11px]">Subjects:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{provider.tutor_subjects || 'All School Subjects, Mathematics, Science'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-semibold block text-[11px]">Grades / Standards:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{provider.tutor_grades || 'Class 1-12, Foundation & Competitive'}</span>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            <div className="flex sm:flex-col items-center sm:items-end gap-2 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-1 text-amber-500 font-bold text-lg">
                <Star className="w-5 h-5 fill-amber-400" />
                <span>{(Number(provider.avg_rating) || 0).toFixed(1)}</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {Number(provider.total_reviews) === 0 ? "No ratings yet (0 reviews)" : `${provider.total_reviews} verified reviews • ${provider.completed_jobs_count || 0} completed`}
              </span>
            </div>

            {/* Instant Direct Booking Header CTA */}
            <button
              onClick={() => handleOpenBooking(provider.services?.[0] || null)}
              className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <Calendar className="w-4 h-4" />
              Book {(provider.tutor_mode || /tutor|teach/i.test(provider.primary_skill || '')) ? 'Tuition Session' : 'Appointment Now'}
            </button>
          </div>
        </div>

        {provider.bio && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/80 dark:bg-slate-700/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">
              "{provider.bio}"
            </p>
          </div>
        )}
      </div>

      {/* Services Offered and Pricing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Offered Services & Standard Pricing
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Instant direct booking available</span>
        </div>

        {(!provider.services || provider.services.length === 0) ? (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {provider.primary_skill || 'General'} Home Inspection & Repair
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-100 dark:border-blue-900">
                  Standard Service
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Complete on-site diagnosis and repair by certified technician. Starting from ₹299.
              </p>
            </div>
            <button
              onClick={() => handleOpenBooking(null)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 shrink-0"
            >
              Book Service
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {provider.services.map((srv) => (
              <div
                key={srv.service_id}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{srv.service_name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-100 dark:border-blue-900">
                      {srv.category_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      ~{srv.estimated_duration_mins} mins
                    </span>
                    <span>•</span>
                    <span className="capitalize">{srv.pricing_type} rate</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">Starting from</span>
                    <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">₹{srv.final_price}</span>
                  </div>
                  <button
                    onClick={() => handleOpenBooking(srv)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    Book Service
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Reviews Section */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Customer Ratings & Verified Feedback
        </h2>

        {(!provider.recent_reviews || provider.recent_reviews.length === 0) ? (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
            No customer reviews submitted yet. Be the first to book and review this service provider!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(provider.recent_reviews || []).map((rev) => (
              <div key={rev.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                      {rev.customer_name[0]}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{rev.customer_name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{rev.created_at}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, idx) => (
                    <Star
                      key={idx}
                      className={`w-3.5 h-3.5 ${
                        idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                {rev.comment && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Direct Booking Modal */}
      {bookingModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Book Service Appointment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedService.service_name}</p>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {bookingError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
              {/* Service Selection */}
              {provider.services && provider.services.length > 1 && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Service</label>
                  <select
                    value={selectedService?.service_id || ''}
                    onChange={(e) => {
                      const found = provider.services.find(s => s.service_id === e.target.value);
                      if (found) setSelectedService(found);
                    }}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl outline-none"
                  >
                    {provider.services.map(s => (
                      <option key={s.service_id} value={s.service_id}>
                        {s.service_name} (₹{s.final_price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(provider.tutor_mode || /tutor|teach/i.test(provider.primary_skill || '')) && (
                <div className="p-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Delivery Mode:
                  </span>
                  <span>
                    {provider.tutor_mode === 'online' ? 'Online Live Sessions' : provider.tutor_mode === 'offline' ? 'Offline (Home Tuition)' : 'Online / Offline Flexible'}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {(provider.tutor_mode || /tutor|teach/i.test(provider.primary_skill || '')) ? 'Tuition Fee' : 'Service Fee'}
                </label>
                <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl flex justify-between items-center text-sm font-bold text-blue-900 dark:text-blue-300">
                  <span>{(provider.tutor_mode || /tutor|teach/i.test(provider.primary_skill || '')) ? 'Standard Session Rate' : 'Standard Doorstep Charge'}</span>
                  <span>₹{selectedService?.final_price || 299}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Appointment Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Time Window</label>
                <select
                  value={scheduledSlot}
                  onChange={(e) => setScheduledSlot(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl outline-none"
                >
                  <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning)</option>
                  <option value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM (Afternoon)</option>
                  <option value="03:00 PM - 06:00 PM">03:00 PM - 06:00 PM (Evening)</option>
                </select>
              </div>

              {/* Service Delivery Address (Saved or New) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Service Delivery Address</label>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsNewAddress(!isNewAddress)}
                      className="text-blue-600 dark:text-blue-400 font-semibold text-[11px] hover:underline"
                    >
                      {isNewAddress ? "Use Saved Address" : "+ Enter Different Address"}
                    </button>
                  )}
                </div>

                {!isNewAddress && addresses.length > 0 ? (
                  <select
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl outline-none"
                  >
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}: {a.street_address}, {a.locality}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">Street Address / House No.</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Flat 302, Civil Lines, Near AMU Circle"
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg outline-none text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">City</label>
                        <input
                          type="text"
                          placeholder={provider.city || "Aligarh"}
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg outline-none text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">PIN Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="202001"
                          value={newPincode}
                          onChange={(e) => setNewPincode(e.target.value)}
                          className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Special Instructions (Optional)</label>
                <textarea
                  rows="2"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Ring bell 204, technician please bring tools..."
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking || (isNewAddress && !newStreet.trim())}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 shadow-sm transition"
                >
                  {submittingBooking ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
