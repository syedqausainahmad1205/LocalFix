import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Wrench,
  Search,
  Calendar,
  FileText,
  User,
  LogOut,
  Bell,
  ShieldCheck,
  Menu,
  X,
  LayoutDashboard,
  CheckCircle,
  Briefcase,
  MapPin,
  GraduationCap,
  Sun,
  Moon
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, isAuthenticated, role, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('localfix_city') || 'All Cities');

  const handleCityChange = (newCity) => {
    setSelectedCity(newCity);
    localStorage.setItem('localfix_city', newCity);
    navigate(`/search?city=${encodeURIComponent(newCity)}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & City Selector */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
                  LocalFix
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Services & Tutors</p>
              </div>
            </Link>

            {/* Dynamic Multi-City Selector (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer text-xs"
              >
                <option value="All Cities" className="dark:bg-slate-800">📍 All Cities</option>
                <option value="Delhi NCR" className="dark:bg-slate-800">Delhi NCR</option>
                <option value="Noida" className="dark:bg-slate-800">Noida</option>
                <option value="Aligarh" className="dark:bg-slate-800">Aligarh</option>
                <option value="Lucknow" className="dark:bg-slate-800">Lucknow</option>
                <option value="Agra" className="dark:bg-slate-800">Agra</option>
                <option value="Kanpur" className="dark:bg-slate-800">Kanpur</option>
                <option value="Bangalore" className="dark:bg-slate-800">Bangalore</option>
                <option value="Mumbai" className="dark:bg-slate-800">Mumbai</option>
              </select>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Home
            </Link>

            <Link
              to="/search?category=tutors"
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                location.search.includes('tutors')
                  ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700'
                  : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-amber-500" />
              Find Tutors
            </Link>

            <Link
              to="/search"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isActive('/search') && !location.search.includes('tutors')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-4 h-4" />
              Find Providers
            </Link>

            {/* Role-Specific Navigation */}
            {isAuthenticated && role === 'customer' && (
              <>
                <Link
                  to="/customer/bookings"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    location.pathname.startsWith('/customer/bookings')
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  My Bookings
                </Link>
                <Link
                  to="/customer/requests"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    location.pathname.startsWith('/customer/requests')
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Requests
                </Link>
              </>
            )}

            {isAuthenticated && role === 'provider' && (
              <>
                <Link
                  to="/provider/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    isActive('/provider/dashboard')
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Jobs Dashboard
                </Link>
                <Link
                  to="/provider/requests"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    isActive('/provider/requests')
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Open Requests
                </Link>
              </>
            )}

            {isAuthenticated && role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  location.pathname.startsWith('/admin')
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Admin Center
              </Link>
            )}
          </nav>

          {/* User Profile / Auth Action & Dark Mode Toggle */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            
            {/* Dark Mode / Light Mode Toggle Button */}
            <button
              type="button"
              id="theme-toggle-desktop"
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* In-App Notifications Dropdown */}
            {isAuthenticated && <NotificationBell />}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {user?.full_name}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize flex items-center justify-end gap-1">
                    {role === 'provider' && user?.provider_profile && (
                      <StatusBadge status={user.provider_profile.verification_status} className="scale-90 origin-right" />
                    )}
                    {role !== 'provider' && (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
                        {role}
                      </span>
                    )}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/30 transition-all hover:shadow-md"
                >
                  Join LocalFix
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Theme Toggle & Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && <NotificationBell />}

            <button
              type="button"
              id="theme-toggle-mobile"
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-amber-400 cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open Mobile Menu"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Responsive Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-5 space-y-2.5 shadow-lg animate-fade-in">
          
          {/* Mobile City Selector */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-medium text-slate-500 dark:text-slate-400">City:</span>
            <select
              value={selectedCity}
              onChange={(e) => {
                handleCityChange(e.target.value);
                setMobileMenuOpen(false);
              }}
              className="bg-transparent font-bold text-slate-900 dark:text-white outline-none flex-1"
            >
              <option value="All Cities" className="dark:bg-slate-900">📍 All Cities</option>
              <option value="Delhi NCR" className="dark:bg-slate-900">Delhi NCR</option>
              <option value="Noida" className="dark:bg-slate-900">Noida</option>
              <option value="Aligarh" className="dark:bg-slate-900">Aligarh</option>
              <option value="Lucknow" className="dark:bg-slate-900">Lucknow</option>
              <option value="Agra" className="dark:bg-slate-900">Agra</option>
              <option value="Kanpur" className="dark:bg-slate-900">Kanpur</option>
              <option value="Bangalore" className="dark:bg-slate-900">Bangalore</option>
              <option value="Mumbai" className="dark:bg-slate-900">Mumbai</option>
            </select>
          </div>

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Home
          </Link>

          <Link
            to="/search?category=tutors"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40"
          >
            <GraduationCap className="w-4 h-4 text-amber-500" />
            Find Tutors (6th - 12th)
          </Link>

          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Find Service Providers
          </Link>

          {isAuthenticated && role === 'customer' && (
            <>
              <Link
                to="/customer/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                My Bookings
              </Link>
              <Link
                to="/customer/requests"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Service Requests
              </Link>
            </>
          )}

          {isAuthenticated && role === 'provider' && (
            <>
              <Link
                to="/provider/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Jobs Dashboard
              </Link>
              <Link
                to="/provider/requests"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Open Customer Requests
              </Link>
            </>
          )}

          {isAuthenticated && role === 'admin' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40"
            >
              Admin Center
            </Link>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 rounded-lg"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl"
                >
                  Join LocalFix
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
