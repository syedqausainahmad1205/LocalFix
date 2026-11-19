import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api, { getApiAssetUrl } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ProviderMap from '../components/ProviderMap';
import {
  Search as SearchIcon,
  MapPin,
  Star,
  ShieldCheck,
  Briefcase,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  Map as MapIcon,
  Grid,
  GraduationCap,
  Navigation,
  X,
  Filter,
  Sparkles,
  Scissors,
  Paintbrush,
  Palette,
  Hammer,
  Award
} from 'lucide-react';
import SearchAutocomplete from '../components/SearchAutocomplete';

const TUTOR_STANDARDS = [
  { label: 'All Standards', value: '' },
  { label: 'Class 6th - 8th (Middle)', value: '8th' },
  { label: 'Class 9th - 10th (Boards)', value: '10th' },
  { label: 'Class 11th - 12th (Senior)', value: '12th' },
];

const TUTOR_SUBJECTS = [
  { label: 'All Subjects', value: '' },
  { label: 'Mathematics', value: 'math' },
  { label: 'Science & Biology', value: 'science' },
  { label: 'English & Literature', value: 'english' },
  { label: 'Computer Science & Coding', value: 'computer' },
];

const TUTOR_MODES = [
  { label: 'All Delivery Modes', value: '' },
  { label: 'Online Teaching Only', value: 'Online' },
  { label: 'Offline / Home Tuition Only', value: 'Offline' },
  { label: 'Both Online & Offline', value: 'Both' }
];

const SUPPORTED_CITIES = [
  'All Cities',
  'Delhi NCR',
  'Noida',
  'Aligarh',
  'Lucknow',
  'Agra',
  'Kanpur',
  'Bangalore',
  'Mumbai'
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialCity = searchParams.get('city') || localStorage.getItem('localfix_city') || 'All Cities';
  const initialGrade = searchParams.get('tutor_grade') || '';
  const initialSubject = searchParams.get('tutor_subject') || '';
  const initialMode = searchParams.get('tutor_mode') || '';
  const initialQuery = searchParams.get('q') || '';

  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [tutorGrade, setTutorGrade] = useState(initialGrade);
  const [tutorSubject, setTutorSubject] = useState(initialSubject);
  const [tutorMode, setTutorMode] = useState(initialMode);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [radiusKm, setRadiusKm] = useState(10);
  const [minRating, setMinRating] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Sync category & filters if URL param changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat !== null) setSelectedCategory(cat);
    const city = searchParams.get('city');
    if (city !== null) setSelectedCity(city);
    const grade = searchParams.get('tutor_grade');
    if (grade !== null) setTutorGrade(grade);
    const subject = searchParams.get('tutor_subject');
    if (subject !== null) setTutorSubject(subject);
    const mode = searchParams.get('tutor_mode');
    if (mode !== null) setTutorMode(mode);
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_slug', selectedCategory);
      if (selectedCity && selectedCity !== 'All Cities') params.append('city', selectedCity);
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory === 'tutors' || selectedCategory.includes('tutor') || tutorMode) {
        if (tutorGrade) params.append('tutor_grade', tutorGrade);
        if (tutorSubject) params.append('tutor_subject', tutorSubject);
        if (tutorMode) params.append('tutor_mode', tutorMode);
      }
      if (userLocation) {
        params.append('latitude', userLocation[0]);
        params.append('longitude', userLocation[1]);
      }
      if (radiusKm) params.append('max_radius_km', radiusKm);
      if (minRating) params.append('min_rating', minRating);
      params.append('verified_only', verifiedOnly);

      const res = await api.get(`/search/providers?${params.toString()}`);
      setProviders(res.data);
    } catch (err) {
      console.error("Error searching providers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [selectedCategory, selectedCity, tutorGrade, tutorSubject, tutorMode, searchQuery, radiusKm, minRating, verifiedOnly, userLocation]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      (err) => {
        console.warn("GPS lookup denied or unavailable:", err.message);
        // Fallback default coordinates
        setUserLocation([27.8974, 78.0880]);
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const isTutorCategory = selectedCategory === 'tutors' || selectedCategory.includes('tutor');

  const filterSidebar = (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Filter Results
        </h3>
        {(selectedCategory || selectedCity !== 'All Cities' || tutorGrade || tutorSubject || minRating || radiusKm !== 30) && (
          <button
            onClick={() => {
              setSelectedCategory('');
              setSelectedCity('All Cities');
              setTutorGrade('');
              setTutorSubject('');
              setMinRating('');
              setRadiusKm(30);
              setVerifiedOnly(true);
              setUserLocation(null);
              setSearchParams({});
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Reset All
          </button>
        )}
      </div>

      {/* City / Hub Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          City / Regional Hub
        </label>
        <select
          value={selectedCity}
          onChange={(e) => {
            setSelectedCity(e.target.value);
            localStorage.setItem('localfix_city', e.target.value);
          }}
          className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 font-medium"
        >
          {SUPPORTED_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Service Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setTutorGrade('');
            setTutorSubject('');
          }}
          className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 font-medium"
        >
          <option value="">All Categories & Trades</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dedicated Tutor Standard & Subject Filter */}
      {isTutorCategory && (
        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Tutor Specializations
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 block">Teaching Delivery Mode</label>
            <select
              value={tutorMode}
              onChange={(e) => setTutorMode(e.target.value)}
              className="w-full text-xs p-2 border border-indigo-200 dark:border-indigo-800 rounded-lg outline-none bg-white dark:bg-slate-800 text-indigo-950 dark:text-indigo-200 font-medium"
            >
              {TUTOR_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 block">Class / Standard</label>
            <select
              value={tutorGrade}
              onChange={(e) => setTutorGrade(e.target.value)}
              className="w-full text-xs p-2 border border-indigo-200 dark:border-indigo-800 rounded-lg outline-none bg-white dark:bg-slate-800 text-indigo-950 dark:text-indigo-200 font-medium"
            >
              {TUTOR_STANDARDS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 block">Subject / Stream</label>
            <select
              value={tutorSubject}
              onChange={(e) => setTutorSubject(e.target.value)}
              className="w-full text-xs p-2 border border-indigo-200 dark:border-indigo-800 rounded-lg outline-none bg-white dark:bg-slate-800 text-indigo-950 dark:text-indigo-200 font-medium"
            >
              {TUTOR_SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Local Neighborhood Verification Badge */}
      <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/60 flex items-center gap-2.5 text-xs text-blue-950 dark:text-blue-200">
        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <div>
          <span className="font-bold block">Local Discovery Active</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Restricted to neighborhood verified providers</span>
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Minimum Rating
        </label>
        <div className="grid grid-cols-4 gap-1 text-xs">
          {['', '3.0', '4.0', '4.5'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setMinRating(r)}
              className={`py-1.5 rounded-lg border font-medium text-center transition ${
                minRating === r
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {r ? `${r}★` : 'Any'}
            </button>
          ))}
        </div>
      </div>

      {/* Verified Only Toggle */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <label htmlFor="verifiedOnly" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
          Verified Professionals Only
        </label>
        <input
          id="verifiedOnly"
          type="checkbox"
          checked={verifiedOnly}
          onChange={(e) => setVerifiedOnly(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {isTutorCategory ? <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> : <SearchIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
              {isTutorCategory ? 'Verified Personal & Online Tutors' : 'Verified Service Professionals'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse verified experts across {selectedCity === 'All Cities' ? 'all regional hubs' : selectedCity}. Upfront rates, neighborhood verified coverage, and live GPS tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm"
          >
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Filters
          </button>

          {/* Locate Me Button */}
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition ${
              userLocation
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 shadow-sm'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-rose-500" />
            {locating ? 'Locating...' : userLocation ? 'Using My GPS Location' : 'Locate Me (GPS)'}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Map
            </button>
          </div>

          <Link
            to="/customer/requests/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            Post Request
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Mobile Filters Slide-over / Modal */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white dark:bg-slate-800 h-full p-6 overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Filter Search
              </span>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterSidebar}
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow hover:bg-blue-700"
            >
              Apply Filters ({providers.length} Available)
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-6 sticky top-20 self-start">
          {filterSidebar}
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Interactive Search Bar with Spelling-Tolerant Suggestions */}
          <div className="bg-white dark:bg-slate-800 p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-sm relative z-30">
            <SearchAutocomplete
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              onSelect={(item) => {
                setSearchQuery(item.title);
                if (item.categorySlug) setSelectedCategory(item.categorySlug);
              }}
              selectedCity={selectedCity}
              userCoords={userLocation ? { lat: userLocation[0], lon: userLocation[1] } : null}
              placeholder="Search trade, skill or spelling e.g. electrisian, tutur, plamber..."
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200 font-bold">{providers.length}</strong> matching verified provider(s)
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Local Specialists
            </span>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : viewMode === 'map' ? (
            /* Interactive OpenStreetMap View */
            <div className="space-y-3">
              <ProviderMap
                providers={providers}
                userLocation={userLocation}
              />
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between px-2 flex-wrap gap-2">
                <span>Click on any trade marker (⚡ 🔧 ❄️ 🪚 🧹 ✂️ 🎨 🛋️ 💻 🎓) to view profile & book.</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">Pan or zoom to explore wider zones</span>
              </div>
            </div>
          ) : providers.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                <SearchIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">No providers found matching exact filters</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Try selecting "All Cities" or resetting standard/subject filters to view all available professionals.
              </p>
              <button
                onClick={() => {
                  setSelectedCity('All Cities');
                  setSelectedCategory('');
                  setTutorGrade('');
                  setTutorSubject('');
                  setRadiusKm(50);
                }}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-blue-700 transition"
              >
                Expand Search Nationwide
              </button>
            </div>
          ) : (
            /* Provider Cards Grid */
            <div className="space-y-4">
              {providers.map((p) => (
                <div
                  key={p.provider_id}
                  className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1">
                      {/* Provider Profile Photo */}
                      <div className="shrink-0 mt-0.5">
                        {p.profile_photo_url ? (
                          <img
                            src={getApiAssetUrl(p.profile_photo_url)}
                            alt={p.full_name}
                            className="w-12 h-12 rounded-xl object-cover border border-emerald-500 shadow-sm bg-slate-100 dark:bg-slate-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-blue-600 text-white font-bold text-base flex items-center justify-center shadow-sm">
                            {p.full_name ? p.full_name.charAt(0).toUpperCase() : 'P'}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            {p.full_name}
                          </h3>
                          <StatusBadge status={p.verification_status} />

                          {p.organisation_name ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                              Shop: {p.organisation_name}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              Individual
                            </span>
                          )}

                          {/* Real-time Availability Badge */}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            p.is_available ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${p.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                            {p.is_available ? 'Available Now' : 'Busy on Active Job'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                          <span>Trade: <strong className="text-slate-700 dark:text-slate-300">{p.primary_skill || 'Specialist'}</strong></span>
                          <span>•</span>
                          <span>{p.experience_years} years exp</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            {p.service_area} (~{p.distance_km} km away)
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Rating and review counter */}
                    <div className="flex items-center sm:flex-col sm:items-end gap-2 sm:gap-0 shrink-0">
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{(Number(p.avg_rating) || 0).toFixed(1)}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">
                        {p.total_reviews === 0 ? "No ratings yet (0 reviews)" : `${p.total_reviews} reviews • ${p.completed_jobs_count || 0} completed jobs`}
                      </span>
                    </div>
                  </div>

                  {/* Specializations Pill (Maid, Barber, Carpenter, Painter, Interior Designer, etc.) */}
                  {p.specializations && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200">
                      <Award className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold text-blue-950 dark:text-blue-100">Specializations: </span>
                        <span>{p.specializations}</span>
                      </div>
                    </div>
                  )}

                  {/* Tutor Specialty Badges (if applicable) */}
                  {(p.tutor_grades || p.tutor_mode || (p.primary_skill && (p.primary_skill.toLowerCase().includes('tutor') || p.primary_skill.toLowerCase().includes('teach')))) && (
                    <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-1.5 text-xs text-indigo-950 dark:text-indigo-200">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300">
                          <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Work: Teaching</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Mode: {p.tutor_mode === 'online' ? 'Online Live' : p.tutor_mode === 'offline' ? 'Offline (Home Tuition)' : 'Online & Offline'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                        <strong>Subjects:</strong> {p.tutor_subjects || 'Curriculum Specialties'} {p.tutor_grades ? `• Standards: ${p.tutor_grades}` : ''}
                      </p>
                    </div>
                  )}

                  {/* Bio statement */}
                  {p.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                      "{p.bio}"
                    </p>
                  )}

                  {/* Offered Services and Pricing Chips */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Popular Services & Standard Rates
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(p.services || []).slice(0, 4).map((s) => (
                        <div
                          key={s.service_id}
                          className="px-2.5 py-1 rounded-lg bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2"
                        >
                          <span className="font-medium text-slate-800 dark:text-white">{s.service_name}</span>
                          <span className="font-bold text-blue-700 dark:text-blue-400">₹{s.final_price}</span>
                        </div>
                      ))}
                      {(p.services?.length || 0) > 4 && (
                        <span className="text-xs text-slate-400 dark:text-slate-400 self-center">
                          +{p.services.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Serving {p.city || p.service_area}
                    </span>

                    <Link
                      to={`/providers/${p.provider_id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
                    >
                      View Profile & Book
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
