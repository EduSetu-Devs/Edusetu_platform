import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { compareTutors, sendTutorRequest } from '../services/tutorService';
import {
  Scale,
  Star,
  CheckCircle2,
  MapPin,
  Clock,
  Award,
  DollarSign,
  GraduationCap,
  ArrowLeft,
  X,
  Send,
  Sparkles,
  BookOpen
} from 'lucide-react';

const TutorComparePage = ({ compareList = [], setCompareList, onNavigate, onSelectTutor }) => {
  const { user, isAuthenticated } = useAuth();

  const [tutors, setTutors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Request Modal
  const [requestModalTutor, setRequestModalTutor] = useState(null);
  const [requestForm, setRequestForm] = useState({
    subject: '',
    gradeLevel: '',
    preferredMode: 'online',
    preferredSchedule: '',
    message: '',
    budget: ''
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState(null);

  useEffect(() => {
    const fetchComparison = async () => {
      if (!compareList || compareList.length === 0) {
        setTutors([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const tutorIds = compareList.map(t => t.id);
      const res = await compareTutors(tutorIds);
      if (res.success && Array.isArray(res.data)) {
        setTutors(res.data);
      } else {
        setTutors(compareList);
      }
      setIsLoading(false);
    };

    fetchComparison();
  }, [compareList]);

  const handleRemoveTutor = (tutorId) => {
    if (setCompareList) {
      setCompareList(compareList.filter(t => t.id !== tutorId));
    }
  };

  const handleOpenRequestModal = (tutor) => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }
    setRequestModalTutor(tutor);
    setRequestForm({
      subject: tutor.subjects?.[0] || '',
      gradeLevel: '',
      preferredMode: tutor.teachingMode === 'both' ? 'online' : (tutor.teachingMode || 'online'),
      preferredSchedule: '',
      message: `Hi ${tutor.name}, I'm interested in booking tutoring sessions with you.`,
      budget: tutor.hourlyRate ? String(tutor.hourlyRate) : ''
    });
    setRequestFeedback(null);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!requestModalTutor) return;
    setIsSubmittingRequest(true);
    setRequestFeedback(null);

    const res = await sendTutorRequest({
      tutorProfileId: requestModalTutor.id,
      subject: requestForm.subject,
      gradeLevel: requestForm.gradeLevel,
      preferredMode: requestForm.preferredMode,
      preferredSchedule: requestForm.preferredSchedule,
      message: requestForm.message,
      budget: requestForm.budget ? parseFloat(requestForm.budget) : undefined
    });

    setIsSubmittingRequest(false);
    if (res.success) {
      setRequestFeedback({ type: 'success', message: 'Tutor request sent successfully! The tutor will review and respond.' });
      setTimeout(() => {
        setRequestModalTutor(null);
        setRequestFeedback(null);
      }, 2000);
    } else {
      setRequestFeedback({ type: 'error', message: res.error || 'Failed to send request' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Comparing tutor profiles...</p>
        </div>
      </div>
    );
  }

  if (tutors.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
            <Scale className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">No Tutors Selected to Compare</h2>
          <p className="text-sm text-slate-500">
            Browse tutors from the marketplace and click the compare button to evaluate up to 3 educators side-by-side.
          </p>
          <button
            onClick={() => onNavigate('find-tutors')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            Explore Tutors Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => onNavigate('find-tutors')}
              className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tutors List</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Side-by-Side Tutor Comparison
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {setCompareList && (
              <button
                onClick={() => setCompareList([])}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
              >
                Clear All ({tutors.length})
              </button>
            )}
          </div>
        </div>

        {/* Comparison Table / Matrix */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <tbody>
              
              {/* Header / Avatar Row */}
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <td className="p-5 text-xs font-bold uppercase tracking-wider text-slate-400 w-1/4">
                  Educator
                </td>
                {tutors.map((tutor) => (
                  <td key={tutor.id} className="p-5 align-top">
                    <div className="space-y-3 relative">
                      <button
                        onClick={() => handleRemoveTutor(tutor.id)}
                        className="absolute right-0 top-0 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-sm">
                        {tutor.name?.charAt(0) || 'T'}
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="text-base font-bold text-slate-900">{tutor.name}</h3>
                          {tutor.isVerified && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" title="Verified Tutor" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{tutor.headline || 'Private Tutor'}</p>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => {
                            if (onSelectTutor) onSelectTutor(tutor.id);
                            else onNavigate(`tutor-${tutor.id}`);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handleOpenRequestModal(tutor)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                        >
                          Hire
                        </button>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Hourly Rate */}
              <tr className="border-b border-slate-100">
                <td className="p-5 text-xs font-bold text-slate-700">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Hourly Fee</span>
                  </div>
                </td>
                {tutors.map((t) => (
                  <td key={t.id} className="p-5 text-sm font-extrabold text-slate-900">
                    {t.hourlyRate > 0 ? `₹${t.hourlyRate} / hr` : 'Contact for fee'}
                  </td>
                ))}
              </tr>

              {/* Rating & Reviews */}
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <td className="p-5 text-xs font-bold text-slate-700">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Rating & Reviews</span>
                  </div>
                </td>
                {tutors.map((t) => (
                  <td key={t.id} className="p-5">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200/60">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{t.rating ? Number(t.rating).toFixed(1) : '5.0'}</span>
                      <span className="text-slate-400 font-normal">({t.reviewsCount || 0} reviews)</span>
                    </span>
                  </td>
                ))}
              </tr>

              {/* Experience */}
              <tr className="border-b border-slate-100">
                <td className="p-5 text-xs font-bold text-slate-700">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span>Experience</span>
                  </div>
                </td>
                {tutors.map((t) => (
                  <td key={t.id} className="p-5 text-xs font-semibold text-slate-800">
                    {t.experienceYears} Years
                  </td>
                ))}
              </tr>

              {/* Mode */}
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <td className="p-5 text-xs font-bold text-slate-700">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Teaching Mode</span>
                  </div>
                </td>
                {tutors.map((t) => (
                  <td key={t.id} className="p-5 text-xs font-semibold text-slate-800 capitalize">
                    {t.teachingMode === 'both' ? 'Online & Home / Offline' : t.teachingMode}
                  </td>
                ))}
              </tr>

              {/* Location */}
              <tr className="border-b border-slate-100">
                <td className="p-5 text-xs font-bold text-slate-700">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>Location</span>
                  </div>
                </td>
                {tutors.map((t) => (
                  <td key={t.id} className="p-5 text-xs text-slate-700 font-medium">
                    {[t.area, t.city].filter(Boolean).join(', ') || 'Pan-India (Online)'}
                  </td>
                ))}
              </tr>

              {/* Subjects Offered */}
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <td className="p-5 text-xs font-bold text-slate-700">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Subjects Taught</span>
                  </div>
                </td>
                {tutors.map((t) => (
                  <td key={t.id} className="p-5">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(t.subjects) && t.subjects.length > 0 ? (
                        t.subjects.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-100"
                          >
                            {typeof s === 'string' ? s : s.subjectName}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">General</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Education & Qualifications */}
              <tr className="border-b border-slate-100">
                <td className="p-5 text-xs font-bold text-slate-700">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>Qualifications</span>
                  </div>
                </td>
                {tutors.map((t) => (
                  <td key={t.id} className="p-5 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900">{t.degree || t.qualifications || 'Graduate'}</p>
                    {t.university && <p className="text-slate-500 text-[11px]">{t.university}</p>}
                  </td>
                ))}
              </tr>

              {/* Verification Status */}
              <tr>
                <td className="p-5 text-xs font-bold text-slate-700">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verification</span>
                  </div>
                </td>
                {tutors.map((t) => (
                  <td key={t.id} className="p-5">
                    {t.isVerified ? (
                      <span className="inline-flex items-center space-x-1 text-emerald-700 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified by EduSetu</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Standard Profile</span>
                    )}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

        {/* Request Modal */}
        {requestModalTutor && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Request Tutoring Sessions</h3>
                  <p className="text-xs text-slate-500">with {requestModalTutor.name}</p>
                </div>
                <button
                  onClick={() => setRequestModalTutor(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {requestFeedback && (
                <div
                  className={`p-3 rounded-xl mb-4 text-xs font-semibold ${
                    requestFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {requestFeedback.message}
                </div>
              )}

              <form onSubmit={handleSendRequest} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mathematics"
                      value={requestForm.subject}
                      onChange={(e) => setRequestForm({ ...requestForm, subject: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Grade / Level</label>
                    <input
                      type="text"
                      placeholder="e.g. Class 10"
                      value={requestForm.gradeLevel}
                      onChange={(e) => setRequestForm({ ...requestForm, gradeLevel: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Mode</label>
                    <select
                      value={requestForm.preferredMode}
                      onChange={(e) => setRequestForm({ ...requestForm, preferredMode: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    >
                      <option value="online">🌐 Online</option>
                      <option value="offline">🏡 Offline / Home</option>
                      <option value="both">✨ Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Budget (₹/hr)</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={requestForm.budget}
                      onChange={(e) => setRequestForm({ ...requestForm, budget: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Schedule / Days</label>
                  <input
                    type="text"
                    placeholder="e.g. Mon, Wed, Fri 5:00 PM"
                    value={requestForm.preferredSchedule}
                    onChange={(e) => setRequestForm({ ...requestForm, preferredSchedule: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Message / Requirements</label>
                  <textarea
                    rows={3}
                    value={requestForm.message}
                    onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Describe your learning goals, target exams, or specific topics..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRequestModalTutor(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRequest}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingRequest ? 'Sending...' : 'Send Request'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TutorComparePage;
