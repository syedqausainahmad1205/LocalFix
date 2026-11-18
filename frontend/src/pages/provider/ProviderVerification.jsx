import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import {
  ShieldCheck,
  FileCheck,
  Upload,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function ProviderVerification() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [idDocUrl, setIdDocUrl] = useState('');
  const [skillCertUrl, setSkillCertUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/providers/me');
      setProfile(res.data);
      if (res.data.id_document_url) setIdDocUrl(res.data.id_document_url);
      if (res.data.skill_certificate_url) setSkillCertUrl(res.data.skill_certificate_url);
    } catch (err) {
      console.error("Error loading provider verification profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const res = await api.post('/providers/me/verification', {
        id_document_url: idDocUrl,
        skill_certificate_url: skillCertUrl || undefined
      });
      setMessage(res.data.message);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit verification documents.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto py-16 text-center text-sm text-slate-500">Loading verification status...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/provider/dashboard" className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Jobs Dashboard
      </Link>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              Provider Verification Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Submit credentials for administrative review to become a verified local professional.
            </p>
          </div>
          <StatusBadge status={profile?.verification_status} />
        </div>

        {profile?.rejection_reason && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <p className="font-bold">Previous Application Rejected</p>
            <p>Reason provided by administrator: "{profile.rejection_reason}". Please re-upload clearer documentation.</p>
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Standards Guide */}
        <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-2">
          <p className="font-bold flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            Verification Criteria & Guidelines
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
            <li><strong>Government ID Proof:</strong> Aadhaar Card, Voter ID, or Driving License verifying your legal name and residential address.</li>
            <li><strong>Trade Skill Proof:</strong> ITI certification, degree/diploma, apprenticeship certificate, trade license, or business registration.</li>
            <li>Applications are typically reviewed by platform administrators within 24 hours.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Government ID Proof Document URL / Drive Link *
            </label>
            <input
              type="url"
              required
              placeholder="https://... document cloud link or sample aadhaar URL"
              value={idDocUrl}
              onChange={(e) => setIdDocUrl(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              For testing/evaluation: Enter any valid mock document URL (e.g. https://sample-id-docs.com/aadhaar.pdf)
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Skill or Trade Certificate Document URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://... ITI certificate or trade license URL"
              value={skillCertUrl}
              onChange={(e) => setSkillCertUrl(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {submitting ? 'Submitting Documents...' : 'Submit Documents for Verification'}
          </button>
        </form>
      </div>
    </div>
  );
}
