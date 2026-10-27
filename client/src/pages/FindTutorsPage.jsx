import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  searchTutors,
  toggleTutorShortlist,
  sendTutorRequest,
  getMyShortlist,
  getTutorAssignmentEligibility,
  getRecommendedTutors
} from '../services/tutorService';
import {
  getParentAssignmentSummary,
  getTutorAssignmentMessage
} from '../utils/tutorAssignmentEligibility';
import {
  Search,
  Star,
  MapPin,
  Award,
  CheckCircle2,
  Bookmark,
  ArrowRight,
  Scale,
  X,
  Send,
  Sparkles,
  GraduationCap,
  RefreshCw,
  Video,
  Building
} from 'lucide-react';

const INDIAN_CITIES_SUGGESTIONS = [
  'Kota', 'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune',
  'Jaipur', 'Kolkata', 'Patna', 'Lucknow', 'Chennai', 'Ahmedabad',
  'Chandigarh', 'Indore', 'Noida', 'Gurgaon', 'Kanpur', 'Mohali'
];

const POPULAR_SUBJECTS_SUGGESTIONS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science',
  'Computer Science', 'Python', 'English', 'Hindi', 'Sanskrit',
  'Accountancy', 'Economics', 'Business Studies', 'History', 'Social Studies'
];

const QUICK_DISCOVERY_TAGS = [
  { label: '🔥 Kota JEE Physics', set: { city: 'Kota', subject: 'Physics' } },
  { label: '📐 Delhi CBSE Maths', set: { city: 'Delhi', subject: 'Mathematics' } },
  { label: '💻 Bengaluru Python', set: { city: 'Bengaluru', subject: 'Python' } },
  { label: '🧬 NEET Biology', set: { subject: 'Biology', city: '' } },
  { label: '💼 Commerce & Accounts', set: { subject: 'Accountancy', city: '' } },
  { label: '🏠 Mumbai Home Tutors', set: { city: 'Mumbai', teachingMode: 'both' } },
  { label: '💰 Under ₹600/hr', set: { maxRate: '600', minRate: '' } },
  { label: '⭐ Top Rated (4.9+)', set: { minRating: '4.9' } }
];

const FindTutorsPage = ({ onNavigate, onSelectTutor, onCompareTutors, compareList = [], setCompareList }) => {
  const { user, isAuthenticated } = useAuth();

  // Filters State
  const [subject, setSubject] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [qualification, setQualification] = useState('');
  const [availability, setAvailability] = useState('');
  const [teachingMode, setTeachingMode] = useState('');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [minRating, setMinRating] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState('rating_desc');
  const [page, setPage] = useState(1);

  // Data State
  const [tutors, setTutors] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [shortlistedMap, setShortlistedMap] = useState({});

  // Request Modal State
  const [requestModalTutor, setRequestModalTutor] = useState(null);
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
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const [recommendationsLoaded, setRecommendationsLoaded] = useState(false);
  const [recommendationStudentId, setRecommendationStudentId] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState(null);

  // Fetch Tutors
  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    const params = {
      subject: subject || undefined,
      city: city || undefined,
      area: area || undefined,
      qualification: qualification || undefined,
      availability: availability || undefined,
      teachingMode: teachingMode || undefined,
      minRate: minRate || undefined,
      maxRate: maxRate || undefined,
      minExperience: minExperience || undefined,
      minRating: minRating || undefined,
      verifiedOnly: verifiedOnly ? 'true' : undefined,
      sort,
      page,
      limit: 12
    };

    const res = await searchTutors(params);
    if (res.success && res.data) {
      setTutors(res.data.tutors || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
    }
    setIsLoading(false);
  }, [subject, city, area, qualification, availability, teachingMode, minRate, maxRate, minExperience, minRating, verifiedOnly, sort, page]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || !['student', 'parent'].includes(user?.role)) {
      setAssignmentEligibility(null);
      setEligibilityError('');
      return () => { cancelled = true; };
    }
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

  useEffect(() => {
    if (!isAuthenticated || !['student', 'parent', 'school'].includes(user?.role)) return;
    getMyShortlist().then(result => {
      if (result.success) {
        setShortlistedMap(Object.fromEntries((result.data || []).map(item => [item.tutor?.id, true])));
      }
    });
  }, [isAuthenticated, user?.role]);

  const handleResetFilters = () => {
    setSubject('');
    setCity('');
    setArea('');
    setQualification('');
    setAvailability('');
    setTeachingMode('');
    setMinRate('');
    setMaxRate('');
    setMinExperience('');
    setMinRating('');
    setVerifiedOnly(false);
    setSort('rating_desc');
    setPage(1);
  };

  const fetchRecommendations = useCallback(async () => {
    setRecommendationLoading(true);
    setRecommendationError('');
    const childrenList = assignmentEligibility?.children || [];
    const params = {
      subject: subject || undefined,
      budget: maxRate || undefined,
      language: preferredLanguage || undefined,
      availability: availability || undefined,
      studentProfileId: user?.role === 'parent'
        ? (recommendationStudentId || childrenList[0]?.studentProfileId)
        : undefined
    };
    const result = await getRecommendedTutors(params);
    if (result.success) {
      setRecommendations(result.data?.recommendations || []);
      setRecommendationsLoaded(true);
    } else {
      setRecommendationError(result.error);
      setRecommendations([]);
      setRecommendationsLoaded(false);
    }
    setRecommendationLoading(false);
  }, [subject, maxRate, preferredLanguage, availability, recommendationStudentId, assignmentEligibility, user?.role]);

  useEffect(() => {
    if (isAuthenticated && ['student', 'parent'].includes(user?.role)) {
      fetchRecommendations();
    }
  }, [isAuthenticated, user?.role, fetchRecommendations]);

  // Compare Toggle
  const handleToggleCompare = (tutor) => {
    if (!setCompareList) return;
    const exists = compareList.some(item => item.id === tutor.id);
    if (exists) {
      setCompareList(compareList.filter(item => item.id !== tutor.id));
    } else {
      if (compareList.length >= 3) {
        alert('You can compare up to 3 tutors at a time.');
        return;
      }
      setCompareList([...compareList, tutor]);
    }
  };

  // Shortlist Toggle
  const handleToggleShortlist = async (tutorId) => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }
    const res = await toggleTutorShortlist(tutorId);
    if (res.success) {
      setShortlistedMap(prev => ({ ...prev, [tutorId]: res.isShortlisted }));
    }
  };

  // Request Modal Handlers
  const handleOpenRequestModal = async (tutor) => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }
    setEligibilityLoading(true);
    const eligibilityResult = await getTutorAssignmentEligibility();
    setEligibilityLoading(false);
    if (!eligibilityResult.success) {
      setEligibilityError(eligibilityResult.error);
      setRequestFeedback({ type: 'error', message: eligibilityResult.error });
      return;
    }
    setAssignmentEligibility(eligibilityResult.data);
    setEligibilityError('');
    if (user?.role === 'student' && !eligibilityResult.data.canRequest) {
      setRequestFeedback({ type: 'error', message: getTutorAssignmentMessage(eligibilityResult.data.reason) });
      return;
    }
    const linkedChildren = user?.role === 'parent'
      ? (eligibilityResult.data.children || []).filter(child => child.canRequest)
      : [];
    if (user?.role === 'parent' && linkedChildren.length === 0) {
      const reasons = [...new Set((eligibilityResult.data.children || []).map(child => child.reason))];
      setRequestFeedback({
        type: 'error',
        message: reasons.length
          ? getTutorAssignmentMessage(reasons[0])
          : 'Link a child to your parent account before requesting a tutor.'
      });
      return;
    }
    setChildren(linkedChildren);
    setRequestModalTutor(tutor);
    setRequestForm({
      subject: tutor.subjects?.[0]?.subjectName || '',
      gradeLevel: '',
      preferredMode: tutor.teachingMode === 'both' ? 'online' : tutor.teachingMode,
      preferredSchedule: '',
      scheduledDate: '',
      startTime: '',
      endTime: '',
      studentProfileId: linkedChildren.length === 1 ? String(linkedChildren[0].studentProfileId) : '',
      message: `Hi ${tutor.name}, I would like to inquire about tutoring sessions.`,
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
      scheduledDate: requestForm.scheduledDate,
      startTime: requestForm.startTime,
      endTime: requestForm.endTime,
      studentProfileId: requestForm.studentProfileId || undefined,
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

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isAuthenticated && ['student', 'parent'].includes(user?.role) && (
          <div className={`mb-5 rounded-2xl border p-4 text-sm ${
            eligibilityError ? 'border-rose-200 bg-rose-50 text-rose-800' :
            user?.role === 'student' && assignmentEligibility && !assignmentEligibility.canRequest
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}>
            {eligibilityLoading ? 'Checking tutor request eligibility…' :
              eligibilityError ? eligibilityError :
              user?.role === 'student'
                ? getTutorAssignmentMessage(assignmentEligibility?.reason)
                : assignmentEligibility
                    ? getParentAssignmentSummary(assignmentEligibility)
                  : 'Tutor request eligibility could not be loaded.'}
          </div>
        )}
        
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-8 sm:p-10 mb-8 shadow-xl shadow-emerald-900/10">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold mb-4 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Phase 5 • Smart Tutor Marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Find Verified Expert Tutors & Educators
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Discover verified home tutors and online teachers across all subjects and grades. Compare credentials, fees, and ratings to book your personalized sessions.
            </p>
          </div>
          
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none hidden md:block" />
        </div>

        {/* Quick Indian Discovery Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Discovery:
          </span>
          {QUICK_DISCOVERY_TAGS.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => {
                if (tag.set.city !== undefined) setCity(tag.set.city);
                if (tag.set.subject !== undefined) setSubject(tag.set.subject);
                if (tag.set.teachingMode !== undefined) setTeachingMode(tag.set.teachingMode);
                if (tag.set.maxRate !== undefined) setMaxRate(tag.set.maxRate);
                if (tag.set.minRate !== undefined) setMinRate(tag.set.minRate);
                if (tag.set.minRating !== undefined) setMinRating(tag.set.minRating);
                setPage(1);
              }}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer"
            >
              {tag.label}
            </button>
          ))}
          {(city || subject || teachingMode || maxRate || minRating) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="shrink-0 px-2.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              ✕ Reset
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            
            {/* Subject Keyword */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Subject / Keyword</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  list="popular-subjects-list"
                  placeholder="e.g. Mathematics, Physics..."
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <datalist id="popular-subjects-list">
                  {POPULAR_SUBJECTS_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">City / Region</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  list="indian-cities-list"
                  placeholder="e.g. Mumbai, Delhi, Kota..."
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <datalist id="indian-cities-list">
                  {INDIAN_CITIES_SUGGESTIONS.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            {/* Locality / Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Area / Locality</label>
              <input
                type="text"
                placeholder="e.g. Andheri, Rohini..."
                value={area}
                onChange={(e) => { setArea(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Teaching Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Class Mode</label>
              <select
                value={teachingMode}
                onChange={(e) => { setTeachingMode(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="">All Modes (Online & Offline)</option>
                <option value="online">🌐 Online Classes Only</option>
                <option value="offline">🏡 Home / Offline Only</option>
                <option value="both">✨ Hybrid / Both</option>
              </select>
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Qualification / Degree</label>
              <input
                type="text"
                placeholder="e.g. B.Ed, M.Sc"
                value={qualification}
                onChange={(e) => { setQualification(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Advanced Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-3">

              <div className="flex items-center space-x-2">


                <span className="text-xs font-semibold text-slate-600">Fee range:</span>
                <input
                  type="number"
                  min="0"
                  aria-label="Minimum hourly fee"
                  placeholder="Min"
                  value={minRate}
                  onChange={(e) => { setMinRate(e.target.value); setPage(1); }}
                  className="w-20 px-2 py-1.5 text-xs rounded-lg border border-slate-200"
                />
                <input
                  type="number"
                  min="0"
                  aria-label="Maximum hourly fee"
                  placeholder="Max"
                  value={maxRate}
                  onChange={(e) => { setMaxRate(e.target.value); setPage(1); }}
                  className="w-20 px-2 py-1.5 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center space-x-2">
                <label htmlFor="tutor-availability" className="text-xs font-semibold text-slate-600">Available:</label>
                <select
                  id="tutor-availability"
                  value={availability}
                  onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
                  className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">Any day</option>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <option key={day} value={day.toLowerCase()}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label htmlFor="tutor-rating" className="text-xs font-semibold text-slate-600">Rating:</label>
                <select
                  id="tutor-rating"
                  value={minRating}
                  onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
                  className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">Any</option>
                  <option value="3">3+ stars</option>
                  <option value="4">4+ stars</option>
                  <option value="4.5">4.5+ stars</option>
                </select>
              </div>

              {/* Min Experience */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-600">Min Exp:</span>
                <select
                  value={minExperience}
                  onChange={(e) => { setMinExperience(e.target.value); setPage(1); }}
                  className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Any Exp</option>
                  <option value="2">2+ Years</option>
                  <option value="5">5+ Years</option>
                  <option value="10">10+ Years</option>
                </select>
              </div>

              {/* Verified Filter */}
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Verified Badges Only
                </span>
              </label>

              {/* Reset */}
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-600">Sort By:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-medium text-slate-700"
              >
                <option value="rating_desc">Highest Rated ⭐</option>
                <option value="rate_asc">Fee: Low to High 💰</option>
                <option value="rate_desc">Fee: High to Low 💎</option>
                <option value="experience_desc">Most Experienced 🎓</option>
              </select>
            </div>
          </div>
        </div>

        {isAuthenticated && ['student', 'parent'].includes(user?.role) && (
          <section className="mb-8 rounded-2xl border border-indigo-100 bg-white p-5 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Sparkles className="h-5 w-5 text-indigo-600" /> Recommended Teachers
                </h2>
                <p className="mt-1 text-sm text-slate-500">Ranked from teacher profiles using your marketplace filters and linked student’s class.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                {user?.role === 'parent' && (assignmentEligibility?.children || []).length > 0 && (
                  <label className="text-xs font-semibold text-slate-600">
                    For child
                    <select
                      value={recommendationStudentId || String((assignmentEligibility?.children || [])[0]?.studentProfileId || '')}
                      onChange={event => setRecommendationStudentId(event.target.value)}
                      className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal"
                    >
                      {(assignmentEligibility?.children || []).map(child => (
                        <option key={child.studentProfileId} value={child.studentProfileId}>{child.name} · Class {child.className || 'not set'}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="text-xs font-semibold text-slate-600">
                  Preferred language
                  <input
                    value={preferredLanguage}
                    onChange={event => setPreferredLanguage(event.target.value)}
                    maxLength={50}
                    placeholder="e.g. Hindi"
                    className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
                  />
                </label>
                <button
                  type="button"
                  disabled={recommendationLoading}
                  onClick={fetchRecommendations}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {recommendationLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {recommendationLoading ? 'Finding matches…' : 'Find recommendations'}
                </button>
              </div>
            </div>
            {recommendationError && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{recommendationError}</p>}
            {recommendationsLoaded && recommendations.length === 0 && !recommendationError && (
              <p className="mt-4 text-sm text-slate-500">No available teacher profiles were found. Try changing your preferences.</p>
            )}
            {recommendations.length > 0 && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {recommendations.map(tutor => (
                  <article key={tutor.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{tutor.name}</h3>
                        <p className="text-sm text-slate-600">{tutor.headline}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {tutor.experienceYears} years’ experience · {tutor.rating ? `${tutor.rating.toFixed(1)}★` : 'No reviews'} · {tutor.hourlyRate ? `₹${tutor.hourlyRate}/hr` : 'Fee not listed'}
                        </p>
                      </div>
                      {tutor.isVerified && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Verified teacher profile" />}
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {tutor.matchingReasons.map(reason => (
                        <li key={reason} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-800">{reason}</li>
                      ))}
                      {!tutor.matchingReasons.length && <li className="text-xs text-slate-500">Available profile; no specific preference matches supplied.</li>}
                    </ul>
                    <button
                      type="button"
                      onClick={() => onSelectTutor ? onSelectTutor(tutor.id) : onNavigate(`tutor-${tutor.id}`)}
                      className="mt-3 text-sm font-bold text-indigo-700 hover:text-indigo-900"
                    >
                      View teacher profile <ArrowRight className="inline h-4 w-4" />
                    </button>
                  </article>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-slate-500">Recommendations are suggestions only; they do not send a request or assign a teacher.</p>
          </section>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-slate-600">
            Showing <span className="text-slate-900 font-bold">{pagination.total}</span> available tutors
          </p>

          {/* Quick shortcuts for role */}
          {isAuthenticated && user?.role === 'teacher' && (
            <button
              onClick={() => onNavigate('teacher-tutor-profile')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Manage My Tutor Profile & Schedule</span>
            </button>
          )}
        </div>

        {/* Tutors Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-slate-200 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-slate-100 rounded" />
                <div className="h-4 bg-slate-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : tutors.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-xs">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No tutors found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              We couldn't find any tutors matching your current filter criteria. Try expanding your search location or clearing filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((tutor) => {
              const isCompared = compareList.some(item => item.id === tutor.id);
              const isShortlisted = shortlistedMap[tutor.id];

              return (
                <div
                  key={tutor.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6">
                    {/* Top Row: Avatar & Badges */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3.5">
                        {tutor.profilePicture ? (
                          <img
                            src={tutor.profilePicture}
                            alt={tutor.name}
                            className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-100 shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-sm shrink-0">
                            {tutor.name?.charAt(0) || 'T'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {tutor.name}
                            </h3>
                            {tutor.isVerified && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" title="Verified Tutor" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">{tutor.headline || 'Dedicated Educator'}</p>
                        </div>
                      </div>

                      {/* Bookmark Button */}
                      <button
                        onClick={() => handleToggleShortlist(tutor.id)}
                        className={`p-2 rounded-xl border transition-colors ${
                          isShortlisted
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                        }`}
                        title="Bookmark Tutor"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Stats & Meta Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                      {/* Rating */}
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200/60">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{tutor.rating ? Number(tutor.rating).toFixed(1) : '5.0'}</span>
                        <span className="text-slate-400 font-normal">({tutor.reviewsCount || 0})</span>
                      </span>

                      {/* Experience */}
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-medium border border-blue-100">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        <span>{tutor.experienceYears}y exp</span>
                      </span>

                      {/* Mode */}
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                        {tutor.teachingMode === 'online' && <Video className="w-3 h-3 text-indigo-600" />}
                        {tutor.teachingMode === 'offline' && <Building className="w-3 h-3 text-emerald-600" />}
                        {tutor.teachingMode === 'both' && <Sparkles className="w-3 h-3 text-purple-600" />}
                        <span className="capitalize">{tutor.teachingMode}</span>
                      </span>
                    </div>

                    {/* Qualifications & Location */}
                    <div className="space-y-1.5 mb-4 text-xs text-slate-600">
                      {tutor.qualifications && (
                        <p className="flex items-center space-x-1.5 text-slate-700 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{tutor.qualifications}</span>
                        </p>
                      )}
                      {(tutor.city || tutor.area) && (
                        <p className="flex items-center space-x-1.5 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{[tutor.area, tutor.city].filter(Boolean).join(', ')}</span>
                        </p>
                      )}
                    </div>

                    {/* Subjects Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(tutor.subjects || []).slice(0, 3).map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-100"
                        >
                          {sub.subjectName}
                        </span>
                      ))}
                      {(tutor.subjects || []).length > 3 && (
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[11px]">
                          +{tutor.subjects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Action Strip */}
                  <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Fee / hr</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        {tutor.hourlyRate > 0 ? `₹${tutor.hourlyRate}` : 'Contact for Fee'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Compare Checkbox Button */}
                      <button
                        onClick={() => handleToggleCompare(tutor)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                          isCompared
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={isCompared ? 'Remove from compare' : 'Add to compare (up to 3)'}
                      >
                        <Scale className="w-4 h-4" />
                      </button>

                      {/* View Profile */}
                      <button
                        onClick={() => {
                          if (onSelectTutor) onSelectTutor(tutor.id);
                          else onNavigate(`tutor-${tutor.id}`);
                        }}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Profile
                      </button>

                      {(!isAuthenticated || (
                        user?.role === 'student' && assignmentEligibility?.canRequest
                      ) || (
                        user?.role === 'parent' && assignmentEligibility?.children?.some(child => child.canRequest)
                      )) && (
                        <button
                          onClick={() => handleOpenRequestModal(tutor)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          Request
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-10">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-slate-600 px-3">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Floating Side-by-Side Comparison Dock */}
        {compareList && compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-center space-x-4 max-w-xl w-full mx-4 animate-in slide-in-from-bottom">
            <div className="flex items-center space-x-2 flex-1 overflow-hidden">
              <Scale className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex items-center space-x-2 overflow-x-auto py-1">
                {compareList.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-200 border border-slate-700 whitespace-nowrap"
                  >
                    <span>{t.name}</span>
                    <button
                      onClick={() => handleToggleCompare(t)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setCompareList([])}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  if (onCompareTutors) onCompareTutors(compareList);
                  else onNavigate('compare-tutors');
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <span>Compare ({compareList.length}/3)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Request / Hire Modal */}
        {requestModalTutor && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center">
                    {requestModalTutor.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Request Tutoring Sessions</h3>
                    <p className="text-xs text-slate-500">with {requestModalTutor.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRequestModalTutor(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
                      placeholder="e.g. Class 10, IIT-JEE"
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

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Session date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().slice(0, 10)}
                      value={requestForm.scheduledDate}
                      onChange={(e) => setRequestForm({ ...requestForm, scheduledDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Start time</label>
                    <input
                      type="time"
                      required
                      value={requestForm.startTime}
                      onChange={(e) => setRequestForm({ ...requestForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">End time</label>
                    <input
                      type="time"
                      required
                      value={requestForm.endTime}
                      onChange={(e) => setRequestForm({ ...requestForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
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

export default FindTutorsPage;
