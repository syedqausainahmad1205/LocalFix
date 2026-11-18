import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  HardHat,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [activeRoleTab, setActiveRoleTab] = useState('customer'); // 'customer' | 'provider' | 'admin'
  const [email, setEmail] = useState('customer@localfix.com');
  const [password, setPassword] = useState('customer123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rolePresets = {
    customer: {
      email: 'customer@localfix.com',
      password: 'customer123',
      label: 'Customer Account',
      note: 'Book verified pros, track jobs & manage requests'
    },
    provider: {
      email: 'electrician@localfix.com',
      password: 'provider123',
      label: 'Service Professional',
      note: 'Receive leads, manage schedule & fulfill bookings'
    },
    tutor: {
      email: 'tutor.math@localfix.com',
      password: 'provider123',
      label: 'Home & Online Tutor',
      note: 'Offer 6th-12th standard & subject tutoring'
    },
    admin: {
      email: 'admin@localfix.com',
      password: 'admin123',
      label: 'Platform Admin',
      note: 'Provider KYC verification & platform telemetry'
    }
  };

  const handleSelectRole = (roleKey) => {
    setActiveRoleTab(roleKey);
    const preset = rolePresets[roleKey];
    if (preset) {
      setEmail(preset.email);
      setPassword(preset.password);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'provider') {
        navigate('/provider/dashboard');
      } else {
        navigate('/customer/bookings');
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Invalid credentials or network connection issue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700 shadow-xl space-y-6 transition-colors">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sign In to LocalFix
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Secure Role-Based Access for Customers, Pros & Admins
          </p>
        </div>

        {/* Quick Demo Role Switcher Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl border border-slate-200/80 dark:border-slate-600">
          <button
            type="button"
            onClick={() => handleSelectRole('customer')}
            className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 ${
              activeRoleTab === 'customer'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="text-[11px]">Customer</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole('provider')}
            className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 ${
              activeRoleTab === 'provider'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span className="text-[11px]">Provider</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole('tutor')}
            className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 ${
              activeRoleTab === 'tutor'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="text-[11px]">Tutor</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole('admin')}
            className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 ${
              activeRoleTab === 'admin'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[11px]">Admin</span>
          </button>
        </div>

        {/* Selected Role Sub-label */}
        <div className="text-[11px] text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 py-1.5 px-3 rounded-lg border border-slate-100 dark:border-slate-700">
          Logging into: <strong className="text-slate-800 dark:text-slate-200">{rolePresets[activeRoleTab]?.label}</strong>
          <span className="block text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">{rolePresets[activeRoleTab]?.note}</span>
        </div>

        {/* Security Warning / Error Box */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Notice</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                Sign In to Portal
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Trust Badges */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            256-Bit SSL Encrypted
          </span>
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            Brute-Force Protected
          </span>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
