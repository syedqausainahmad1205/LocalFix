import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Award,
  GraduationCap,
  Camera,
  Plus,
  Trash2,
  User,
  Phone,
  Mail,
  X
} from 'lucide-react';

export default function ProviderDashboard() {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  // Service modal state
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [addingService, setAddingService] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [profRes, bkRes] = await Promise.all([
        api.get('/providers/me'),
        api.get('/bookings/my')
      ]);
      setProfile(profRes.data);
      setBookings(bkRes.data);
    } catch (err) {
      console.error("Error loading provider dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setAvailableCategories(res.data || []);
      // Preselect first available service if any
      if (res.data?.length > 0 && res.data[0].services?.length > 0) {
        setSelectedServiceId(res.data[0].services[0].id);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleAvailability = async () => {
    if (!profile) return;
    setTogglingAvailability(true);
    try {
      const nextState = !profile.is_available;
      await api.patch('/providers/me/availability', { is_available: nextState });
      setProfile((prev) => ({ ...prev, is_available: nextState }));
      setSuccessBanner(nextState ? 'Status set to Available: You are now visible to local customers for jobs!' : 'Status set to Offline / Busy: You will not receive immediate job requests.');
      setTimeout(() => setSuccessBanner(''), 6000);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not update availability.");
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Profile photograph size must not exceed 5MB.");
      return;
    }
    const formData = new FormData();
    formData.append('photo_file', file);
    setUploadingPhoto(true);
    try {
      const res = await api.post('/providers/me/photo', formData);
      setProfile((prev) => ({
        ...prev,
        profile_photo_path: res.data.profile_photo_path,
        profile_photo_url: res.data.profile_photo_url
      }));
      setSuccessBanner("Profile photograph updated successfully!");
      setTimeout(() => setSuccessBanner(''), 6000);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not update profile photograph.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) {
      alert("Please select a service to add.");
      return;
    }
    setAddingService(true);
    try {
      await api.post('/providers/me/services', {
        service_id: selectedServiceId,
        custom_price: customPrice ? parseFloat(customPrice) : null
      });
      setShowAddServiceModal(false);
      setCustomPrice('');
      setSuccessBanner("Service successfully added to your active catalog!");
      setTimeout(() => setSuccessBanner(''), 6000);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add service.");
    } finally {
      setAddingService(false);
    }
  };

  const handleRemoveService = async (serviceId) => {
    if (!window.confirm("Are you sure you want to remove this service from your catalog?")) return;
    try {
      await api.delete(`/providers/me/services/${serviceId}`);
      setSuccessBanner("Service removed from your catalog.");
      setTimeout(() => setSuccessBanner(''), 5000);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to remove service.");
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        new_status: newStatus,
        change_notes: `Status updated to ${newStatus.replace('_', ' ')} by provider.`
      });
      if (newStatus === 'completed') {
        setProfile((prev) => ({ ...prev, is_available: true }));
        setSuccessBanner("🎉 Service Job Completed! Your status is now automatically Available so new customers can book you.");
        setTimeout(() => setSuccessBanner(''), 7000);
      }
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto py-16 text-center text-sm text-slate-500 dark:text-slate-400">Loading provider portal...</div>;
  }

  const activeBookings = bookings.filter((b) => !['completed', 'cancelled', 'disputed'].includes(b.current_status));
  const completedBookings = bookings.filter((b) => b.current_status === 'completed');
  const totalEarnings = completedBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

  const photoSrc = profile?.profile_photo_url || (profile?.profile_photo_path ? `/api/providers/photo/${profile.profile_photo_path}` : null);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner('')}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-200 font-bold ml-4 p-1 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Verification Status Alert Screen */}
      {(profile?.verification_status === 'pending' || profile?.verification_status === 'under_review') && (
        <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-4">
          <div className="flex items-start gap-3.5">
            <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                  Application Under Review: Verification Status PENDING
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                  Awaiting Admin Approval
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                Thank you for applying to join LocalFix. To ensure community trust and marketplace safety, all service provider applications undergo administrative verification of identity and credentials before appearing in public discovery.
              </p>
            </div>
          </div>

          <div className="p-4 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Submitted Dossier Summary
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-slate-700 dark:text-slate-300">
              <div>
                <span className="text-slate-400 block text-[11px]">Provider Name:</span>
                <span className="font-semibold">{profile?.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Trade Field / Skill:</span>
                <span className="font-semibold">{profile?.primary_skill || 'General Services'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Experience in Field:</span>
                <span className="font-semibold">{profile?.experience_years} Years</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Aadhaar Identity:</span>
                <span className="font-mono font-semibold">XXXX-XXXX-{profile?.aadhaar_last4 || '****'}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            Your profile will not be publicly visible in customer searches until approved. You will receive an email notification when your verification is finalized.
          </p>
        </div>
      )}

      {profile?.verification_status === 'rejected' && (
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-4">
          <div className="flex items-start gap-3.5">
            <ShieldAlert className="w-7 h-7 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
                  Application Verification Rejected
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100">
                  Action Required
                </span>
              </div>
              <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-300 leading-relaxed">
                Your application could not be verified by the platform administration at this time.
              </p>
            </div>
          </div>

          <div className="p-4 bg-white/90 dark:bg-slate-800/90 rounded-2xl border border-rose-200 dark:border-rose-900 text-xs space-y-1.5">
            <span className="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[11px]">
              Mandatory Rejection Reason Provided by Admin:
            </span>
            <p className="text-slate-800 dark:text-slate-200 font-medium text-xs sm:text-sm">
              "{profile?.rejection_reason || 'Document verification could not be completed. Please upload clear documents.'}"
            </p>
          </div>

          <p className="text-xs text-rose-700 dark:text-rose-300">
            Please review the reason above and ensure your uploaded documents are high-resolution, unedited government credentials. You may contact platform support at <strong>support@localfix.com</strong>.
          </p>
        </div>
      )}

      {(profile?.verification_status === 'approved' || profile?.verification_status === 'verified') && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-emerald-900 dark:text-emerald-200 font-semibold">
              Verified Professional Account — Publicly discoverable for local customer bookings within 10 km.
            </span>
          </div>
          {profile?.verified_at && (
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
              Verified: {profile.verified_at}
            </span>
          )}
        </div>
      )}

      {/* Main Profile Header Card with Mandatory Profile Photo */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-700 pb-6">
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Profile Photo Avatar with Edit/Change Photo Trigger */}
            <div className="relative shrink-0">
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt={profile?.full_name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-md bg-slate-100 dark:bg-slate-700"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'P'}
                </div>
              )}

              {/* Status Ring / Online Indicator on Photo */}
              <span
                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                  profile?.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
                title={profile?.is_available ? 'Available' : 'Offline'}
              />

              {/* Change Photo Overlay Button */}
              <label
                className="absolute -bottom-2 -right-2 p-1.5 sm:p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg cursor-pointer transition border-2 border-white dark:border-slate-800"
                title="Change Profile Photograph"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>

            {/* Provider Details & Credentials */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {profile?.full_name}
                </h1>
                <StatusBadge status={profile?.verification_status} />

                {/* Individual vs Shop Badge */}
                {profile?.organisation_name ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    Shop: {profile.organisation_name}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Individual Professional
                  </span>
                )}
              </div>

              {/* Trade Skill & Experience in Field */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex-wrap">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {profile?.primary_skill || 'Professional Specialist'}
                </span>
                <span>•</span>
                <span className="font-medium">
                  {profile?.experience_years} Years Experience in Field
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  {profile?.service_area || profile?.city} (10 km Radius)
                </span>
              </div>

              {/* Aadhaar & Contact details */}
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                <span className="font-mono bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                  Aadhaar: XXXX-XXXX-{profile?.aadhaar_last4 || '****'}
                </span>
                <span>Phone: {profile?.phone || 'Protected'}</span>
                <span>Email: {profile?.email}</span>
              </div>

              {/* Teaching / Tutor Mode Banner */}
              {(profile?.tutor_mode || /tutor|teach/i.test(profile?.primary_skill || '')) && (
                <div className="mt-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs flex items-center gap-2 flex-wrap">
                  <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-indigo-900 dark:text-indigo-200">
                    Teaching Mode: {profile.tutor_mode || 'Online & Offline'}
                  </span>
                  {profile.tutor_subjects && (
                    <span className="text-slate-600 dark:text-slate-300">
                      • Subjects: <strong>{profile.tutor_subjects}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action & Availability Buttons */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0">
            <button
              onClick={handleToggleAvailability}
              disabled={togglingAvailability}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-2 ${
                profile?.is_available
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${profile?.is_available ? 'bg-amber-500' : 'bg-white'}`} />
              {profile?.is_available ? 'Go Offline / Mark Busy' : 'Go Online & Available'}
            </button>

            <Link
              to="/provider/requests"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Briefcase className="w-4 h-4" />
              View Customer Requests
            </Link>
          </div>
        </div>

        {/* Top 4 Performance Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Active Jobs</span>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{activeBookings.length}</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Completed Jobs</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedBookings.length}</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Average Rating</span>
            <div className="text-xl sm:text-2xl font-black text-amber-500 flex items-center gap-1">
              {profile?.total_reviews > 0 ? (
                <>
                  <Star className="w-5 h-5 fill-amber-400" />
                  <span>{(Number(profile?.avg_rating) || 0).toFixed(1)}</span>
                  <span className="text-xs font-normal text-slate-400">({profile?.total_reviews})</span>
                </>
              ) : (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  0.0 (No reviews yet)
                </span>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Earnings Volume</span>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">₹{(Number(totalEarnings) || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Genuine Rating & Reputation Banner */}
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg shrink-0">
              ★
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Rating: {Number(profile?.avg_rating || 0).toFixed(1)} / 5.0
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  ({profile?.total_reviews || 0} Verified Reviews)
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Closed-Loop Verified Rating:</strong> Calculated strictly from completed jobs. New providers start at 0.0 with zero artificial inflation.
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="inline-block px-3 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-bold text-[11px]">
              {profile?.completed_jobs_count || 0} Successful Jobs
            </span>
          </div>
        </div>
      </div>

      {/* Offered Services & Pricing Management Section */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              My Offered Services &amp; Rates ({profile?.services?.length || 0})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specific services you offer to customers within your 10 km service radius.
            </p>
          </div>
          <button
            onClick={() => {
              fetchCategories();
              setShowAddServiceModal(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 w-fit"
          >
            <Plus className="w-4 h-4" />
            Add Service to Catalog
          </button>
        </div>

        {!profile?.services || profile.services.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-dashed border-slate-300 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <p className="font-semibold text-slate-700 dark:text-slate-300">You haven't attached any services to your catalog yet.</p>
            <p>Click "Add Service to Catalog" to select services in your field and set your custom rates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.services.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-500 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{s.service_name}</h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Platform Base: ₹{s.base_price}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-600 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Your Active Rate:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-base">
                      ₹{s.custom_price !== null && s.custom_price !== undefined ? s.custom_price : s.base_price}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveService(s.service_id)}
                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Remove service from catalog"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Jobs & Status Transitions */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Active Assigned Jobs</h2>

        {activeBookings.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 text-center rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 space-y-2 transition-colors">
            <p className="font-semibold text-slate-700 dark:text-slate-300">No active service jobs currently pending.</p>
            <p>Check available customer problem requests to submit competitive bids.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold block">
                      Ref: {b.booking_reference}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{b.service_name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      {b.street_address}, {b.locality}, {b.city}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">₹{b.total_amount}</span>
                    <StatusBadge status={b.current_status} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-slate-600 dark:text-slate-300">
                      Customer: <strong className="text-slate-900 dark:text-white">{b.customer_name}</strong> ({b.customer_phone || 'Protected Contact'})
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Scheduled Window: <strong>{b.scheduled_date} ({b.scheduled_time_slot})</strong>
                    </p>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {b.current_status === 'requested' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'accepted')}
                        disabled={updatingId === b.id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                      >
                        Accept Booking
                      </button>
                    )}

                    {b.current_status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'on_the_way')}
                        disabled={updatingId === b.id}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                      >
                        Mark On The Way
                      </button>
                    )}

                    {b.current_status === 'on_the_way' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'in_progress')}
                        disabled={updatingId === b.id}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-sm"
                      >
                        Arrived &amp; Start Work
                      </button>
                    )}

                    {b.current_status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'completed')}
                        disabled={updatingId === b.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Job Completed
                      </button>
                    )}

                    <Link
                      to={`/customer/bookings/${b.id}`}
                      className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Live Chat
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Add Service to My Profile
              </h3>
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Service *
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none"
                  required
                >
                  {availableCategories.map((cat) => (
                    <optgroup key={cat.id} label={cat.name}>
                      {cat.services?.map((srv) => (
                        <option key={srv.id} value={srv.id}>
                          {srv.name} (Base: ₹{srv.base_price})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Custom Price (₹) (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Leave empty to use base price"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  You can set your own price or charge the standard platform base price.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingService}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition"
                >
                  {addingService ? 'Adding...' : 'Attach Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
