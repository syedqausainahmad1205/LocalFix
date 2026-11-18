import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Lock,
  Mail,
  User,
  Phone,
  Briefcase,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  Camera,
  Navigation,
  Info
} from 'lucide-react';

const SERVICE_SKILLS = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'AC Repair & Service',
  'Home Cleaning & Maid',
  'Laptop & Computer Technician',
  'Barber & Salon at Home',
  'Painter & Waterproofing',
  'Interior Designer & Modular Decor',
  'Teaching / Home & Online Tutor',
  'Appliance Repair'
];

const SUPPORTED_CITIES = [
  'Aligarh',
  'Delhi NCR',
  'Noida',
  'Lucknow',
  'Agra',
  'Kanpur',
  'Bangalore',
  'Mumbai'
];

export default function Register() {
  const { register, registerProvider } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('customer'); // 'customer' or 'provider'

  // Common & Customer fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Provider specific fields
    organisationName: '',
    primarySkill: 'Electrician',
    serviceAddress: '',
    city: 'Aligarh',
    state: 'Uttar Pradesh',
    pincode: '',
    latitude: 27.8974,
    longitude: 78.0880,
    experienceYears: 2,
    aadhaarNumber: '',
    consentGiven: false,
    // Tutor specific teaching fields
    tutorMode: 'Both (Online & Offline)',
    tutorGrades: 'Class 6th - 10th (Secondary)',
    tutorSubjects: 'Mathematics & Science'
  });

  // File uploads
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [customSkill, setCustomSkill] = useState('');
  const [aadhaarDoc, setAadhaarDoc] = useState(null);
  const [aadhaarDocName, setAadhaarDocName] = useState('');
  const [resumeDoc, setResumeDoc] = useState(null);
  const [resumeDocName, setResumeDocName] = useState('');

  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photograph size must not exceed 5MB.');
      return;
    }
    setProfilePhoto(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const handleAadhaarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Aadhaar document size must not exceed 5MB.');
      return;
    }
    setAadhaarDoc(file);
    setAadhaarDocName(file.name);
  };

  const handleResumeSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Resume / certification document size must not exceed 5MB.');
      return;
    }
    setResumeDoc(file);
    setResumeDocName(file.name);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6))
        }));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError(`Unable to detect location (${err.message}). Using default coordinates.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation for passwords
    if (formData.password !== formData.confirmPassword) {
      setError('Password and password confirmation do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (role === 'customer') {
        const payload = {
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          phone: formData.phone || undefined,
          role: 'customer'
        };
        await register(payload);
        navigate('/customer/bookings');
      } else {
        // Provider Registration
        if (!formData.consentGiven) {
          setError('You must explicitly give consent to submit identity documents for administrator verification.');
          setLoading(false);
          return;
        }

        const cleanAadhaar = formData.aadhaarNumber.replace(/[\s-]/g, '');
        if (!/^[2-9]\d{11}$/.test(cleanAadhaar)) {
          setError('Aadhaar number must be exactly 12 numeric digits and cannot start with 0 or 1.');
          setLoading(false);
          return;
        }

        if (!profilePhoto) {
          setError('Profile photograph is mandatory. Please upload a clear photo of yourself to continue.');
          setLoading(false);
          return;
        }

        if (!aadhaarDoc) {
          setError('Aadhaar card image or PDF document is required.');
          setLoading(false);
          return;
        }

        if (!resumeDoc) {
          setError('Resume or professional experience document is required.');
          setLoading(false);
          return;
        }

        const skillToSubmit = formData.primarySkill === 'Other Custom Trade / Skill'
          ? (customSkill.trim() || 'General Specialist')
          : formData.primarySkill;

        const data = new FormData();
        data.append('full_name', formData.fullName.trim());
        data.append('email', formData.email.trim());
        data.append('phone', formData.phone.trim());
        data.append('password', formData.password);
        data.append('confirm_password', formData.confirmPassword);
        data.append('primary_skill', skillToSubmit);
        data.append('service_address', formData.serviceAddress.trim());
        data.append('city', formData.city);
        data.append('state', formData.state);
        data.append('pincode', formData.pincode.trim());
        data.append('latitude', formData.latitude.toString());
        data.append('longitude', formData.longitude.toString());
        data.append('aadhaar_number', cleanAadhaar);
        data.append('consent_given', 'true');
        data.append('experience_years', formData.experienceYears.toString());

        if (formData.organisationName && formData.organisationName.trim()) {
          data.append('organisation_name', formData.organisationName.trim());
          data.append('business_name', formData.organisationName.trim());
        } else {
          // Individual service provider registering under own personal name
          data.append('business_name', formData.fullName.trim());
        }

        const isTutor = skillToSubmit.toLowerCase().includes('tutor') || skillToSubmit.toLowerCase().includes('teach');
        if (isTutor) {
          data.append('tutor_mode', formData.tutorMode || 'Both (Online & Offline)');
          data.append('tutor_grades', formData.tutorGrades || 'Class 6th - 10th (Secondary)');
          data.append('tutor_subjects', formData.tutorSubjects || 'Mathematics & Science');
        }

        data.append('profile_photo_file', profilePhoto);
        data.append('aadhaar_card_file', aadhaarDoc);
        data.append('resume_file', resumeDoc);

        await registerProvider(data);
        // After registration, new provider has PENDING status and cannot publish immediately
        navigate('/provider/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg || d.detail).join(', '));
      } else {
        setError('Registration failed. Please check all fields and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className={`w-full ${role === 'provider' ? 'max-w-2xl' : 'max-w-lg'} space-y-6 bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-700 transition-all`}>
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 items-center justify-center text-white shadow-md shadow-blue-500/20 mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {role === 'provider' ? 'Service Provider Registration' : 'Join LocalFix Marketplace'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {role === 'provider'
              ? 'Register directly under your own name. No shop name or organization is required. Skilled professionals with field experience can offer any service.'
              : 'Create an account to book verified local services near you.'}
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600">
          <button
            type="button"
            onClick={() => {
              setRole('customer');
              setError('');
            }}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              role === 'customer'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            I am a Customer
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('provider');
              setError('');
            }}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              role === 'provider'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            I am a Professional / Provider
          </button>
        </div>

        {/* Individual Provider Highlight Banner */}
        {role === 'provider' && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-emerald-950 dark:text-emerald-100 block font-bold">
                Work Under Your Own Name (No Organization or Shop Needed)
              </strong>
              <p>
                Every skilled technician, electrician, plumber, cleaner, or specialist can register as an independent service provider with their own name and personal experience. A shop or company name is strictly optional.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Personal Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ramesh@example.com"
                  className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {role === 'provider' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Shop / Trade Name (Optional)
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Optional</span>
                </div>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="organisationName"
                    value={formData.organisationName}
                    onChange={handleChange}
                    placeholder="Optional: Leave blank to use your own personal name"
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Leave blank to register as an individual under your personal name: <strong className="text-slate-700 dark:text-slate-300">{formData.fullName || 'Your Name'}</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Provider Specific Service & Location Details */}
          {role === 'provider' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Service Field & Professional Experience
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 lowercase font-medium">any skilled trade supported</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-300 font-medium mb-1">
                    Your Skill or Service Category *
                  </label>
                  <div className="space-y-2">
                    <select
                      name="primarySkill"
                      value={formData.primarySkill}
                      onChange={(e) => {
                        handleChange(e);
                        if (e.target.value !== 'Other Custom Trade / Skill') {
                          setCustomSkill('');
                        }
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none"
                    >
                      {SERVICE_SKILLS.map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                      <option value="Other Custom Trade / Skill">Other Custom Trade / Field (Type Below)</option>
                    </select>
                    {formData.primarySkill === 'Other Custom Trade / Skill' && (
                      <input
                        type="text"
                        required
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        placeholder="e.g. Mason, Welder, Solar Tech, Gardner, Locksmith"
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-700 border-2 border-blue-500 text-slate-900 dark:text-white rounded-xl outline-none"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-300 font-medium mb-1">
                    Experience in Your Field (Years) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    placeholder="e.g. 3"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Individual experience in trade/profession</span>
                </div>
              </div>

              {/* Teaching Delivery Mode & Curriculum Box for Tutors */}
              {(formData.primarySkill.toLowerCase().includes('tutor') || formData.primarySkill.toLowerCase().includes('teach')) && (
                <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Teaching Delivery Mode & Curriculum Details
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                      Teaching Delivery Mode *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'Online', label: 'Online Teaching', desc: '1-on-1 & batch video classes' },
                        { id: 'Offline', label: 'Offline / Home Tuition', desc: 'Doorstep in-person classes' },
                        { id: 'Both (Online & Offline)', label: 'Both Online & Offline', desc: 'Doorstep & virtual' }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, tutorMode: mode.id }))}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            formData.tutorMode === mode.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-indigo-100 dark:border-indigo-900 hover:border-indigo-300'
                          }`}
                        >
                          <span className="block text-xs font-bold">{mode.label}</span>
                          <span className={`block text-[10px] mt-0.5 ${formData.tutorMode === mode.id ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {mode.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                        Teaching Standards / Classes
                      </label>
                      <select
                        name="tutorGrades"
                        value={formData.tutorGrades}
                        onChange={handleChange}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white rounded-lg outline-none"
                      >
                        <option value="Class 6th - 8th (Middle School)">Class 6th - 8th (Middle School)</option>
                        <option value="Class 9th - 10th (Secondary Boards)">Class 9th - 10th (Secondary Boards)</option>
                        <option value="Class 11th - 12th (Senior / Boards)">Class 11th - 12th (Senior / Boards)</option>
                        <option value="College & Degree Level">College & Degree Level</option>
                        <option value="All Standards (Class 6th to 12th)">All Standards (Class 6th to 12th)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                        Subjects Taught
                      </label>
                      <input
                        type="text"
                        name="tutorSubjects"
                        value={formData.tutorSubjects}
                        onChange={handleChange}
                        placeholder="e.g. Mathematics, Physics, Chemistry, English"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white rounded-lg outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Complete Service Address *
                </label>
                <input
                  type="text"
                  name="serviceAddress"
                  required
                  value={formData.serviceAddress}
                  onChange={handleChange}
                  placeholder="Street, Landmark, Building Number, Sector"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-300 font-medium mb-1">
                    City *
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none"
                  >
                    {SUPPORTED_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-300 font-medium mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-300 font-medium mb-1">
                    PIN Code (6 digits) *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="202001"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Exact Service Geolocation Coordinates */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Exact Service Location (Used for Local Customer Discovery)
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={locating}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Navigation className="w-3 h-3" />
                    {locating ? 'Detecting...' : 'Detect GPS Location'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      required
                      value={formData.latitude}
                      onChange={handleChange}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      required
                      value={formData.longitude}
                      onChange={handleChange}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Aadhaar and Document Verification Section */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-600 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Government Identity & Credential Documents
                </div>

                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-300 font-medium mb-1">
                    12-digit Aadhaar Number *
                  </label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    required
                    maxLength={14}
                    value={formData.aadhaarNumber}
                    onChange={handleChange}
                    placeholder="2345 6789 0123"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Encrypted at rest with AES/Fernet encryption. Only authorized administrators can inspect for verification.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Profile Photo (Mandatory) */}
                  <div className={`p-3 bg-white dark:bg-slate-800 rounded-xl border-2 ${profilePhotoPreview ? 'border-emerald-500' : 'border-dashed border-blue-400 dark:border-blue-500'} text-center space-y-2`}>
                    <label className="cursor-pointer block">
                      {profilePhotoPreview ? (
                        <div className="relative inline-block">
                          <img
                            src={profilePhotoPreview}
                            alt="Preview"
                            className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-emerald-500 shadow"
                          />
                          <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">✓</span>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-slate-700 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
                          <Camera className="w-6 h-6" />
                        </div>
                      )}
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mt-1">
                        Mandatory Photo *
                      </span>
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        Profile Photo
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        Shows on Dashboard &amp; Profile
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Aadhaar Card Upload */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-center space-y-2">
                    <label className="cursor-pointer block">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-400">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 mt-2">
                        Aadhaar Document *
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate">
                        {aadhaarDocName || 'PDF / JPG (Max 5MB)'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        required
                        onChange={handleAadhaarSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Resume / Certifications */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-center space-y-2">
                    <label className="cursor-pointer block">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 mt-2">
                        Resume / Certificate *
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate">
                        {resumeDocName || 'PDF / Document (Max 5MB)'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        required
                        onChange={handleResumeSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Explicit Consent & Privacy Disclosure */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl space-y-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="consentGiven"
                      name="consentGiven"
                      checked={formData.consentGiven}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="consentGiven" className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer">
                      <strong className="text-slate-900 dark:text-white">Consent to Verification: </strong>
                      I explicitly consent to submitting my government identity details and documents for background verification by authorized LocalFix platform administrators. I understand my Aadhaar is encrypted at rest and will never be exposed on public listings.
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pl-6">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    New service providers start with status <strong>PENDING</strong> and cannot publish services until approved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Password and Confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={8}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-3"
          >
            {loading ? 'Submitting Application...' : (role === 'provider' ? 'Submit Provider Application' : 'Complete Registration')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
