import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getTutorById,
  submitTutorReview,
  toggleTutorShortlist,
  sendTutorRequest,
  getReviewableTutorSessions,
  getTutorAssignmentEligibility
} from '../services/tutorService';
import {
  getParentAssignmentSummary,
  getTutorAssignmentMessage
} from '../utils/tutorAssignmentEligibility';
import {
  Star,
  CheckCircle2,
  MapPin,
  Calendar,
  Clock,
  Award,
  BookOpen,
  GraduationCap,
  Bookmark,
  Send,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  X
} from 'lucide-react';

const TutorProfileDetailPage = ({ tutorId, onNavigate, onBack }) => {
  const { user, isAuthenticated } = useAuth();

  const [tutor, setTutor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShortlisted, setIsShortlisted] = useState(false);

  // Modals State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Request Form State
  const [requestForm, setRequestForm] = useState({
    subject: '',
    gradeLevel: '',
    preferredMode: 'online',
    preferredSchedule: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    studentProfileId: '',
    message: '',
    budget: ''
  });
  const [children, setChildren] = useState([]);
  const [assignmentEligibility, setAssignmentEligibility] = useState(null);
  const [eligibilityError, setEligibilityError] = useState('');
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState(null);

  // Review Form State
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewableSessions, setReviewableSessions] = useState([]);
  const [reviewSessionId, setReviewSessionId] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState(null);

  const fetchTutorDetails = useCallback(async () => {
    if (!tutorId) return;
    setIsLoading(true);
    const res = await getTutorById(tutorId);
    if (res.success && res.data) {
      setTutor(res.data);
      setRequestForm(prev => ({
        ...prev,
        subject: res.data.subjects?.[0]?.subjectName || '',
        preferredMode: res.data.teachingMode === 'both' ? 'online' : res.data.teachingMode,
        budget: res.data.hourlyRate ? String(res.data.hourlyRate) : ''
      }));
    }
    setIsLoading(false);
  }, [tutorId]);

  useEffect(() => {
    fetchTutorDetails();
  }, [fetchTutorDetails]);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || !['student', 'parent'].includes(user?.role)) return () => { cancelled = true; };
    setEligibilityLoading(true);
    getTutorAssignmentEligibility().then(result => {
      if (cancelled) return;
      if (result.success) {
        setAssignmentEligibility(result.data);
        setEligibilityError('');
      } else {
        setEligibilityError(result.error);
      }
      setEligibilityLoading(false);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.role]);

  const handleToggleShortlist = async () => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }
    const res = await toggleTutorShortlist(tutor.id);
    if (res.success) {
      setIsShortlisted(res.isShortlisted);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    setRequestFeedback(null);

    const res = await sendTutorRequest({
      tutorProfileId: tutor.id,
      subject: requestForm.subject,
      gradeLevel: requestForm.gradeLevel,
      preferredMode: requestForm.preferredMode,
      preferredSchedule: requestForm.preferredSchedule,
      studentProfileId: requestForm.studentProfileId || undefined,
      message: requestForm.message,
      budget: requestForm.budget ? parseFloat(requestForm.budget) : undefined
    });

    setIsSubmittingRequest(false);
    if (res.success) {
      setRequestFeedback({ type: 'success', message: 'Tutor request sent successfully! The tutor will review and respond.' });
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestFeedback(null);
      }, 2000);
    } else {
      setRequestFeedback({ type: 'error', message: res.error || 'Failed to send request' });
    }
  };

  const handleOpenRequestModal = async () => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }
    setEligibilityLoading(true);
    const result = await getTutorAssignmentEligibility();
    setEligibilityLoading(false);
    if (!result.success) {
      setEligibilityError(result.error);
      setRequestFeedback({ type: 'error', message: result.error });
      return;
    }
    setAssignmentEligibility(result.data);
    setEligibilityError('');
    if (user?.role === 'student' && !result.data.canRequest) {
      setRequestFeedback({ type: 'error', message: getTutorAssignmentMessage(result.data.reason) });
      return;
    }
    const linkedChildren = user?.role === 'parent'
      ? (result.data.children || []).filter(child => child.canRequest)
      : [];
    if (user?.role === 'parent' && linkedChildren.length === 0) {
      const reasons = [...new Set((result.data.children || []).map(child => child.reason))];
      setRequestFeedback({
        type: 'error',
        message: reasons.length ? getTutorAssignmentMessage(reasons[0]) : 'Link a child to your parent account before requesting a tutor.'
      });
      return;
    }
    setChildren(linkedChildren);
    setRequestForm(prev => ({
      ...prev,
      studentProfileId: linkedChildren.length === 1 ? String(linkedChildren[0].studentProfileId) : ''
    }));
    setShowRequestModal(true);
  };

  const handleOpenReviewModal = async () => {
    if (!isAuthenticated || !['student', 'parent'].includes(user?.role)) {
      onNavigate('login');
      return;
    }
    const result = await getReviewableTutorSessions(tutor.id);
    if (!result.success) {
      setReviewFeedback({ type: 'error', message: result.error || 'Unable to load completed sessions' });
      return;
    }
    setReviewableSessions(result.data || []);
    setReviewSessionId('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }
    setIsSubmittingReview(true);
    setReviewFeedback(null);

    const res = await submitTutorReview(tutor.id, {
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      teachingSessionId: reviewSessionId
    });

    setIsSubmittingReview(false);
    if (res.success) {
      setReviewFeedback({ type: 'success', message: 'Review submitted successfully! Thank you for your feedback.' });
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewFeedback(null);
        fetchTutorDetails();
      }, 1500);
    } else {
      setReviewFeedback({ type: 'error', message: res.error || 'Failed to submit review' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading tutor profile...</p>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Tutor Profile Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">The tutor you are looking for is unavailable or does not exist.</p>
          <button
            onClick={() => onNavigate('find-tutors')}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold"
          >
            Back to Tutor Search
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation / Back Bar */}
        <button
          onClick={() => (onBack ? onBack() : onNavigate('find-tutors'))}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tutors List</span>
        </button>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Avatar & Key Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {(tutor.user?.profileImage || tutor.profilePicture) ? (
                <img
                  src={tutor.user?.profileImage || tutor.profilePicture}
                  alt={tutor.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover shadow-lg shadow-emerald-700/15 shrink-0 border-2 border-slate-100"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white font-extrabold text-3xl sm:text-4xl flex items-center justify-center shadow-lg shadow-emerald-700/15 shrink-0">
                  {tutor.name?.charAt(0) || 'T'}
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{tutor.name}</h1>
                  {tutor.isVerified && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Educator</span>
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-slate-600">{tutor.headline || 'Dedicated Private Tutor'}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {(tutor.city || tutor.area) && (
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{[tutor.area, tutor.city].filter(Boolean).join(', ')}</span>
                    </span>
                  )}
                  <span className="flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 text-blue-500" />
                    <span>{tutor.experienceYears} Years Experience</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{tutor.totalStudentsTaught || 0}+ Students Taught</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Price & Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
              <div className="text-left md:text-right">
                <span className="text-xs text-slate-400 block font-medium">Standard Rate</span>
                <span className="text-3xl font-black text-slate-900">
                  {tutor.hourlyRate > 0 ? `₹${tutor.hourlyRate}` : 'Contact'}
                </span>
                <span className="text-xs text-slate-500 font-medium"> / hour</span>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={handleToggleShortlist}
                  className={`p-3 rounded-2xl border transition-colors ${
                    isShortlisted
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Bookmark Tutor"
                >
                  <Bookmark className="w-4 h-4" />
                </button>

                {(!isAuthenticated || (
                  user?.role === 'student' && assignmentEligibility?.canRequest
                ) || (
                  user?.role === 'parent' && assignmentEligibility?.children?.some(child => child.canRequest)
                )) && (
                  <button
                    onClick={handleOpenRequestModal}
                    disabled={eligibilityLoading}
                    className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{eligibilityLoading ? 'Checking eligibility…' : 'Hire / Book Sessions'}</span>
                  </button>
                )}
              </div>
              {isAuthenticated && ['student', 'parent'].includes(user?.role) && (
                <p className={`mt-3 text-xs ${
                  eligibilityError ? 'text-rose-700' :
                  user.role === 'student' && assignmentEligibility && !assignmentEligibility.canRequest
                    ? 'text-amber-800'
                    : 'text-slate-500'
                }`}>
                  {eligibilityLoading ? 'Checking tutor request eligibility…' :
                    eligibilityError ? eligibilityError :
                    user.role === 'student'
                      ? getTutorAssignmentMessage(assignmentEligibility?.reason)
                      : assignmentEligibility
                          ? getParentAssignmentSummary(assignmentEligibility)
                        : 'Tutor request eligibility could not be loaded.'}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Columns: Bio, Subjects, Availability, Reviews */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About & Bio Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>About the Educator</span>
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {tutor.bio || 'No detailed biography provided yet.'}
              </p>

              {tutor.teachingExperience && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Teaching Background</h3>
                  <p className="text-xs text-slate-700 leading-relaxed">{tutor.teachingExperience}</p>
                </div>
              )}

              {Array.isArray(tutor.languages) && tutor.languages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center space-x-2 text-xs">
                  <span className="font-bold text-slate-600">Languages:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tutor.languages.map((lang, lIdx) => (
                      <span key={lIdx} className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subjects & Grade Specialization Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>Subjects & Grade Levels</span>
              </h2>

              {tutor.subjects?.length === 0 ? (
                <p className="text-xs text-slate-500">No specific subject specializations listed.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {tutor.subjects?.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-900">{sub.subjectName}</h4>
                        {sub.hourlyRate && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            ₹{sub.hourlyRate}/hr
                          </span>
                        )}
                      </div>
                      {Array.isArray(sub.gradeLevels) && sub.gradeLevels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sub.gradeLevels.map((gr, gIdx) => (
                            <span key={gIdx} className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-medium">
                              {gr}
                            </span>
                          ))}
                        </div>
                      )}
                      {sub.description && (
                        <p className="text-xs text-slate-500 mt-2">{sub.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Availability Schedule */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <span>Weekly Availability Schedule</span>
              </h2>

              {tutor.availabilities?.length === 0 ? (
                <p className="text-xs text-slate-500">Flexible schedule — contact directly to arrange timings.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {tutor.availabilities?.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <span className="font-bold text-slate-800 capitalize flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{slot.dayOfWeek}</span>
                      </span>
                      <span className="text-slate-600 font-semibold">
                        {slot.startTime} – {slot.endTime} ({slot.mode})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ratings & Reviews Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                    <span>Verified Reviews ({tutor.reviewsCount || 0})</span>
                  </h2>
                  <p className="text-xs text-slate-500">Authentic feedback from verified students and parents</p>
                </div>

                {isAuthenticated && ['student', 'parent'].includes(user?.role) && (
                  <button
                    onClick={handleOpenReviewModal}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Write Review
                  </button>
                )}
              </div>

              {tutor.reviews?.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-500">No reviews yet. Be the first to share your learning experience!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tutor.reviews?.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                            {rev.reviewer?.name?.charAt(0) || 'L'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900">{rev.reviewer?.name}</span>
                            <span className="text-[10px] text-slate-400 block capitalize">{rev.reviewer?.role}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.comment && <p className="text-xs text-slate-700">{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Credentials & Badges */}
          <div className="space-y-6">
            
            {/* Credentials Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Verification & Credentials</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Degrees & Education</span>
                  <span className="font-bold text-slate-800">{tutor.degree || tutor.qualifications || 'Graduate'}</span>
                </div>

                {tutor.university && (
                  <div>
                    <span className="text-slate-400 block">University / Institution</span>
                    <span className="font-bold text-slate-800">{tutor.university}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block">Class Mode Options</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {tutor.teachingMode === 'both' ? 'Online & Home / Offline' : tutor.teachingMode}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Monthly Package (Approx)</span>
                  <span className="font-bold text-slate-800">
                    {tutor.monthlyRate > 0 ? `₹${tutor.monthlyRate}/month` : 'Available on Request'}
                  </span>
                </div>
              </div>
            </div>

            {/* EduSetu Trust Badge Card */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50 rounded-3xl p-6 border border-emerald-100 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>EduSetu Guarantee</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Admin-verified academic qualifications</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Integrated live classroom & learning notes</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Direct communication with zero middleman fee</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Request / Hire Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Request Tutoring Sessions</h3>
                  <p className="text-xs text-slate-500">with {tutor.name}</p>
                </div>
                <button
                  onClick={() => setShowRequestModal(false)}
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

                {user?.role === 'parent' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Student</label>
                    <select
                      required
                      value={requestForm.studentProfileId}
                      onChange={(e) => setRequestForm({ ...requestForm, studentProfileId: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="">Choose a linked child</option>
                      {children.map(child => (
                        <option key={child.studentProfileId} value={child.studentProfileId}>
                          {child.name} {child.className ? `- ${child.className}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
                    placeholder="Optional: preferred days or times"
                    value={requestForm.preferredSchedule}
                    onChange={(e) => setRequestForm({ ...requestForm, preferredSchedule: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <p className="text-xs text-slate-500">If the tutor accepts, you can select an available class date and time from your tutor requests.</p>

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
                    onClick={() => setShowRequestModal(false)}
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

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Review {tutor.name}</h3>
                  <p className="text-xs text-slate-500">Rate your learning experience</p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reviewFeedback && (
                <div
                  className={`p-3 rounded-xl mb-4 text-xs font-semibold ${
                    reviewFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {reviewFeedback.message}
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {reviewableSessions.length > 0 ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Completed session</label>
                    <select
                      required
                      value={reviewSessionId}
                      onChange={(e) => setReviewSessionId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="">Select a completed session</option>
                      {reviewableSessions.map(session => (
                        <option key={session.id} value={session.id}>
                          {session.title} - {session.scheduledDate}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">No eligible completed sessions are available for review.</p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Rating</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="p-1 text-amber-500 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= reviewForm.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Review / Comments</label>
                  <textarea
                    rows={4}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Describe the tutor's teaching clarity, punctuality, and helpfulness..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !reviewSessionId || !reviewableSessions.length}
                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
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

export default TutorProfileDetailPage;
