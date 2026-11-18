import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ShieldCheck, MapPin, Sparkles, GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">LocalFix</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Nationwide on-demand marketplace connecting households with verified electricians, plumbers, verified tutors (Class 6th-12th), carpenters, and technical experts.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Verified Local Services & Tutors Marketplace
            </div>
          </div>

          {/* Service Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Popular Services</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/search?category=tutors" className="hover:text-blue-400 font-semibold text-blue-300 transition-colors flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-amber-400" /> Home & Online Tutors</Link></li>
              <li><Link to="/search?category=electrician" className="hover:text-white transition-colors">Electricians</Link></li>
              <li><Link to="/search?category=plumber" className="hover:text-white transition-colors">Plumbers & Drainage</Link></li>
              <li><Link to="/search?category=ac-repair" className="hover:text-white transition-colors">AC Repair & Jet Wash</Link></li>
              <li><Link to="/search?category=carpenter" className="hover:text-white transition-colors">Carpentry & Locks</Link></li>
              <li><Link to="/search?category=home-cleaning" className="hover:text-white transition-colors">Home Deep Cleaning</Link></li>
              <li><Link to="/search?category=laptop-repair" className="hover:text-white transition-colors">Computer Diagnostics</Link></li>
            </ul>
          </div>

          {/* Covered Hubs & Cities */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Cities & Coverage</h4>
            <div className="flex flex-wrap gap-1.5 text-xs text-slate-300">
              {['Delhi NCR', 'Noida', 'Aligarh', 'Lucknow', 'Agra', 'Kanpur', 'Bangalore', 'Mumbai'].map((zone) => (
                <Link key={zone} to={`/search?city=${encodeURIComponent(zone)}`} className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-blue-400 hover:text-white transition">
                  {zone}
                </Link>
              ))}
            </div>
          </div>

          {/* Trust & Guarantee */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Safety & Verification</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Govt ID & skill certification verified for all professionals.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Customer reviews allowed only after completed jobs.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Real-time tracking, upfront standard rates & secure mock payments.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} LocalFix Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/search" className="hover:text-slate-300">Explore Providers</Link>
            <Link to="/login" className="hover:text-slate-300">Partner Sign-in</Link>
            <Link to="/admin/dashboard" className="hover:text-slate-300">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
