import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getApiAssetUrl } from '../api/client';
import {
  Wrench,
  Zap,
  Droplets,
  Wind,
  Hammer,
  Sparkles,
  Laptop,
  GraduationCap,
  Scissors,
  Paintbrush,
  Palette,
  Search,
  MapPin,
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  BookOpen,
  Navigation,
  AlertCircle
} from 'lucide-react';
import SearchAutocomplete from '../components/SearchAutocomplete';

const iconMap = {
  Zap: Zap,
  Droplets: Droplets,
  Wind: Wind,
  Hammer: Hammer,
  Sparkles: Sparkles,
  Laptop: Laptop,
  Wrench: Wrench,
  GraduationCap: GraduationCap,
  BookOpen: BookOpen,
  Scissors: Scissors,
  Paintbrush: Paintbrush,
  Palette: Palette
};

const CITY_COORDINATES = {
  'Aligarh': { lat: 27.8974, lon: 78.0880 },
  'Delhi NCR': { lat: 28.6139, lon: 77.2090 },
  'Noida': { lat: 28.5355, lon: 77.3910 },
  'Lucknow': { lat: 26.8467, lon: 80.9462 },
  'Agra': { lat: 27.1767, lon: 78.0081 },
  'Kanpur': { lat: 26.4499, lon: 80.3319 },
  'Bangalore': { lat: 12.9716, lon: 77.5946 },
  'Mumbai': { lat: 19.0760, lon: 72.8777 }
};

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('localfix_city') || 'Aligarh');
  const [userCoords, setUserCoords] = useState(() => {
    const saved = localStorage.getItem('localfix_city') || 'Aligarh';
    return CITY_COORDINATES[saved] || CITY_COORDINATES['Aligarh'];
  });
  const [locating, setLocating] = useState(false);

  // Nearby 10km Providers State
  const [nearbyProviders, setNearbyProviders] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch strictly 10km approved providers
  const fetchNearbyProviders = async (coords, city) => {
    setLoadingNearby(true);
    try {
      const params = new URLSearchParams();
      if (coords?.lat && coords?.lon) {
        params.append('latitude', coords.lat.toString());
        params.append('longitude', coords.lon.toString());
      } else if (city && city !== 'All Cities') {
        params.append('city', city);
      }
      params.append('max_radius_km', '10.0'); // Strict 10 km restriction
      params.append('verified_only', 'true');

      const res = await api.get(`/search/providers?${params.toString()}`);
      setNearbyProviders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch nearby providers:", err);
      setNearbyProviders([]);
    } finally {
      setLoadingNearby(false);
    }
  };

  useEffect(() => {
    fetchNearbyProviders(userCoords, selectedCity);
  }, [userCoords, selectedCity]);

  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);
    localStorage.setItem('localfix_city', cityName);
    if (CITY_COORDINATES[cityName]) {
      setUserCoords(CITY_COORDINATES[cityName]);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: parseFloat(pos.coords.latitude.toFixed(4)),
          lon: parseFloat(pos.coords.longitude.toFixed(4))
        };
        setUserCoords(newCoords);
        setLocating(false);
      },
      (err) => {
        console.warn("GPS lookup denied or unavailable:", err.message);
        setLocating(false);
        alert("GPS detection failed. Please select your city from the dropdown.");
      },
      { timeout: 8000 }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('q', searchQuery.trim());
    if (selectedCity && selectedCity !== 'All Cities') params.append('city', selectedCity);
    if (userCoords?.lat && userCoords?.lon) {
      params.append('latitude', userCoords.lat.toString());
      params.append('longitude', userCoords.lon.toString());
    }
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 transition-colors duration-200">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 dark:from-slate-900/80 dark:via-slate-950 dark:to-slate-900 border-b border-slate-200/70 dark:border-slate-800 py-12 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-5 sm:space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-semibold shadow-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Verified Local Services & Neighborhood Discovery
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Book Verified Local Experts <span className="text-blue-600 dark:text-blue-400">Near You</span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Connect directly with admin-verified electricians, teachers & tutors, plumbers, carpenters, cleaners, and technicians in your area. All providers undergo government ID verification.
            </p>

            {/* Quick Search & Location Selection Box with Spelling Autocomplete */}
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto mt-6 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl shadow-xl shadow-blue-500/10 dark:shadow-none border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2 relative z-30">
              <div className="flex-1 px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-800 flex items-center">
                <SearchAutocomplete
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search Electrician, Teaching, Plumber, AC Repair...?"
                  selectedCity={selectedCity}
                  userCoords={userCoords}
                  className="w-full"
                />
              </div>

              {/* City & GPS Selector */}
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <select
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {Object.keys(CITY_COORDINATES).map((city) => (
                    <option key={city} value={city} className="dark:bg-slate-800">{city}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleDetectGPS}
                  title="Detect my current GPS coordinates"
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-blue-600 dark:text-blue-400 transition"
                >
                  <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                Find Verified Pros
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Current Coordinates Banner */}
            <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <MapPin className="w-3 h-3 text-rose-500" />
                Location Hub: {(Number(userCoords?.lat) || 0).toFixed(4)}, {(Number(userCoords?.lon) || 0).toFixed(4)} ({selectedCity})
              </span>
              <span>•</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Local Radius Verified
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 & 5: Approved Service Providers Near You (Within 10 km) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Admin-Verified Professionals Only
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Verified Providers Near You
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Showing approved professionals verified for service delivery in {selectedCity}.
            </p>
          </div>

          <Link
            to={`/search?city=${selectedCity}&latitude=${userCoords.lat}&longitude=${userCoords.lon}&max_radius_km=10`}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Explore all matching providers
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingNearby ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : nearbyProviders.length === 0 ? (
          /* Empty State */
          <div className="p-10 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Approved Providers Found in this Area
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              We did not find any approved service providers currently registered in <strong>{selectedCity}</strong> ({(Number(userCoords?.lat) || 0).toFixed(4)}, {(Number(userCoords?.lon) || 0).toFixed(4)}). In accordance with our verified location policy, distant providers are not displayed.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => handleCityChange('Aligarh')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
              >
                Switch to Aligarh Hub
              </button>
              <button
                onClick={handleDetectGPS}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Use My Exact GPS
              </button>
            </div>
          </div>
        ) : (
          /* Provider Cards Grid - Public fields only! */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyProviders.slice(0, 6).map((p) => (
              <div
                key={p.provider_id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Top card header: Photo, Name, Badge */}
                  <div className="flex items-start gap-3.5">
                    {p.profile_photo_url ? (
                      <img
                        src={getApiAssetUrl(p.profile_photo_url)}
                        alt={p.full_name}
                        className="w-14 h-14 rounded-2xl object-cover border border-emerald-500 shrink-0 shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                        {p.full_name?.charAt(0) || 'P'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                          {p.full_name}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      </div>

                      {p.organisation_name && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate mt-0.5">
                          {p.organisation_name}
                        </p>
                      )}

                      {(p.tutor_grades || p.tutor_mode || /tutor|teach/i.test(p.primary_skill || '')) ? (
                        <div className="space-y-1 mt-1">
                          <span className="inline-block text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            Work: Teaching • {p.tutor_mode === 'online' ? 'Online Live' : p.tutor_mode === 'offline' ? 'Offline (Home Tuition)' : 'Online & Offline'}
                          </span>
                          {p.tutor_subjects && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Subjects: {p.tutor_subjects}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {p.primary_skill || (p.services?.[0]?.category_name) || 'Home Services'}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location & Distance Pill */}
                  <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      {p.city}
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0 font-mono">
                      ~{p.distance_km} km away
                    </span>
                  </div>

                  {/* Genuine Rating Display */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      {p.total_reviews > 0 ? (
                        <>
                          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {(Number(p.avg_rating) || 0).toFixed(1)}
                          </div>
                          <span className="text-slate-400 text-[11px]">
                            ({p.total_reviews} reviews)
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                          No ratings yet (0.0)
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {p.experience_years}y exp
                    </span>
                  </div>
                </div>

                {/* View Profile / Book Button */}
                <Link
                  to={`/providers/${p.provider_id}`}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold rounded-xl text-center transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  View Profile & Services
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Explore Popular Service Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Verified local services bookable with transparent rates and fast-track resolution
            </p>
          </div>
          <Link
            to="/search"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            All categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingCategories ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat) => {
              const IconComp = iconMap[cat.icon_name] || Wrench;
              return (
                <Link
                  key={cat.id}
                  to={`/search?category=${cat.slug}&city=${selectedCity}`}
                  className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all text-center group flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {cat.services?.length || 0} services
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* LocalFix Trust & Verification Guarantee */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden relative shadow-2xl">
          <div className="max-w-2xl relative z-10 space-y-5 sm:space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-800/80 px-3 py-1 rounded-full border border-blue-700">
              The LocalFix Verification Standard
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug">
              Every Service Provider is Verified by Administrators Before Public Listing
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed">
              LocalFix mandates 12-digit government Aadhaar verification, encrypted at rest, alongside address validation and trade experience review. No provider is publicly discoverable until approved.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                <span className="font-medium">Verified Local Radius Enforcement</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                <span className="font-medium">Encrypted Government ID at Rest</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                <span className="font-medium">Genuine Reviews (0.0 Initial Rating)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                <span className="font-medium">Automated Fast-Track Redressal</span>
              </div>
            </div>

            <div className="pt-3 sm:pt-4 flex flex-wrap gap-2.5 sm:gap-3">
              <Link
                to={`/search?city=${selectedCity}`}
                className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white text-blue-900 text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-100 shadow transition"
              >
                Book a Verified Pro
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-blue-700 border border-blue-600 transition"
              >
                Join as Professional
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
