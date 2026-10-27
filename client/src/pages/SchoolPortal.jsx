import React, { useState, useEffect, useCallback } from 'react';
import { getSchoolProfile, saveSchoolProfile, searchSchoolTutors } from '../services/schoolService';
import { getMyShortlist, toggleTutorShortlist } from '../services/tutorService';
import {
  Building,
  GraduationCap,
  CheckCircle2,
  MapPin,
  Save,
  AlertCircle,
  FileText,
  Bookmark
} from 'lucide-react';

const SAMPLE_FACULTY_CANDIDATES = [
  {
    id: 'TUT-101',
    name: 'Dr. Anand Kumar',
    headline: 'Senior Physics Faculty & JEE Advanced Specialist',
    isVerified: true,
    experienceYears: 12,
    degree: 'Ph.D. in Applied Physics',
    university: 'IIT Delhi',
    city: 'New Delhi',
    area: 'R.K. Puram',
    modes: ['online', 'offline'],
    subjects: ['Physics', 'Mechanics', 'Electrodynamics'],
    hourlyRate: 850,
    rating: 4.9,
    reviewsCount: 38
  },
  {
    id: 'TUT-102',
    name: 'Mrs. Sunita Sharma',
    headline: 'PGT Chemistry & Board Examination Evaluator',
    isVerified: true,
    experienceYears: 15,
    degree: 'M.Sc. in Organic Chemistry, B.Ed',
    university: 'Delhi University',
    city: 'New Delhi',
    area: 'Vasant Kunj',
    modes: ['online', 'offline'],
    subjects: ['Chemistry', 'Organic Chemistry', 'Physical Chemistry'],
    hourlyRate: 750,
    rating: 4.85,
    reviewsCount: 42
  },
  {
    id: 'TUT-103',
    name: 'Mr. Rajesh Verma',
    headline: 'Senior Mathematics Olympiad Mentor',
    isVerified: true,
    experienceYears: 9,
    degree: 'M.Sc. in Pure Mathematics',
    university: 'IIT Roorkee',
    city: 'Noida',
    area: 'Sector 62',
    modes: ['online'],
    subjects: ['Mathematics', 'Calculus', 'Coordinate Geometry'],
    hourlyRate: 700,
    rating: 4.92,
    reviewsCount: 29
  },
  {
    id: 'TUT-104',
    name: 'Ms. Shalini Iyer',
    headline: 'Head of English Department & Creative Writing Coach',
    isVerified: true,
    experienceYears: 8,
    degree: 'M.A. English Literature, B.Ed',
    university: 'Jawaharlal Nehru University (JNU)',
    city: 'Gurugram',
    area: 'Cyber City',
    modes: ['online', 'offline'],
    subjects: ['English Literature', 'Grammar & Composition', 'Verbal Ability'],
    hourlyRate: 650,
    rating: 4.8,
    reviewsCount: 24
  },
  {
    id: 'TUT-105',
    name: 'Er. Amit Trivedi',
    headline: 'Computer Science Faculty & AI/Python Educator',
    isVerified: true,
    experienceYears: 7,
    degree: 'B.Tech in Computer Science',
    university: 'NIT Trichy',
    city: 'Bengaluru',
    area: 'Koramangala',
    modes: ['online'],
    subjects: ['Computer Science', 'Python', 'Data Structures', 'Informatics Practices'],
    hourlyRate: 800,
    rating: 4.88,
    reviewsCount: 31
  }
];

const DEFAULT_SCHOOL_PROFILE = {
  institutionName: 'Delhi Public School International',
  institutionType: 'school',
  affiliation: 'CBSE',
  registrationNumber: 'CBSE-AFF-2024-8841',
  city: 'New Delhi',
  area: 'R.K. Puram',
  pincode: '110022',
  address: 'Sector XII, R.K. Puram, New Delhi',
  contactEmail: 'principal@dpsrkpuram.edu.in',
  contactPhone: '+91 11 2617 7379',
  website: 'https://dpsrkpuram.edu.in',
  description: 'Premier educational institution committed to academic excellence, STEM initiatives, and holistic student growth.',
  requiredSubjects: ['Physics', 'Mathematics', 'Computer Science', 'Chemistry'],
  requiredQualifications: 'M.Sc / B.Ed / Ph.D with 3+ years experience'
};

const SchoolPortal = ({ onSelectTutor }) => {
  const [activeTab, setActiveTab] = useState('tutors'); // tutors | shortlisted | profile
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Institution Profile Form
  const [schoolForm, setSchoolForm] = useState(DEFAULT_SCHOOL_PROFILE);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Candidate Faculty Search State
  const [candidates, setCandidates] = useState(SAMPLE_FACULTY_CANDIDATES);
  const [shortlistedCandidates, setShortlistedCandidates] = useState([SAMPLE_FACULTY_CANDIDATES[0]]);
  const [searchSubject, setSearchSubject] = useState('');
  const [searchQualification, setSearchQualification] = useState('');
  const [searchMinExp, setSearchMinExp] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchArea, setSearchArea] = useState('');
  const [searchMode, setSearchMode] = useState('');
  const [searchVerifiedOnly, setSearchVerifiedOnly] = useState(false);

  const [shortlistedMap, setShortlistedMap] = useState({ [SAMPLE_FACULTY_CANDIDATES[0].id]: true });

  // Fetch School Profile
  const fetchProfile = async () => {
    const res = await getSchoolProfile();
    if (res.success && res.data && res.data.profile?.institutionName) {
      setSchoolForm(res.data.profile);
    }
  };

  // Fetch Candidates
  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    const params = {
      subject: searchSubject || undefined,
      qualification: searchQualification || undefined,
      minExperience: searchMinExp || undefined,
      city: searchCity || undefined,
      area: searchArea || undefined,
      mode: searchMode || undefined,
      verifiedOnly: searchVerifiedOnly ? 'true' : undefined
    };

    const res = await searchSchoolTutors(params);
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      setCandidates(res.data);
    } else {
      setCandidates(SAMPLE_FACULTY_CANDIDATES);
    }
    setIsLoading(false);
  }, [searchSubject, searchQualification, searchMinExp, searchCity, searchArea, searchMode, searchVerifiedOnly]);

  useEffect(() => {
    fetchProfile();
    fetchCandidates();
    getMyShortlist().then(result => {
      if (result.success && result.data && result.data.length > 0) {
        const shortlisted = result.data.map(item => item.tutor).filter(Boolean);
        if (shortlisted.length > 0) {
          setShortlistedCandidates(shortlisted);
          setShortlistedMap(Object.fromEntries(shortlisted.map(tutor => [tutor.id, true])));
        }
      }
    });
  }, [fetchCandidates]);

  const handleToggleShortlist = async (candidate) => {
    const result = await toggleTutorShortlist(candidate.id);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.error || 'Failed to update shortlist' });
      return;
    }
    setShortlistedMap(previous => ({ ...previous, [candidate.id]: result.isShortlisted }));
    setShortlistedCandidates(previous => result.isShortlisted
      ? [...previous.filter(item => item.id !== candidate.id), candidate]
      : previous.filter(item => item.id !== candidate.id));
    setFeedback({
      type: 'success',
      message: result.isShortlisted ? 'Candidate added to your shortlist.' : 'Candidate removed from your shortlist.'
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setFeedback(null);

    const res = await saveSchoolProfile(schoolForm);
    setIsSavingProfile(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Institution profile updated successfully!' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update profile' });
    }
  };

  const visibleCandidates = activeTab === 'shortlisted'
    ? shortlistedCandidates
    : candidates;
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Strip */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              <Building className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {schoolForm.institutionName || 'School & Institution Portal'}
              </h1>
              <p className="text-xs text-slate-500">
                Discover, recruit, and connect with qualified educators, guest faculty, and subject matter specialists.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('tutors')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tutors' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Candidate Faculty
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Institution Profile
            </button>
            <button
              onClick={() => setActiveTab('shortlisted')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'shortlisted' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Shortlisted
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* TAB 1: Candidates Faculty Search */}
        {(activeTab === 'tutors' || activeTab === 'shortlisted') && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Needed</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, Physics"
                    value={searchSubject}
                    onChange={(e) => setSearchSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Degree / Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. M.Sc, B.Ed, Ph.D"
                    value={searchQualification}
                    onChange={(e) => setSearchQualification(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Min Experience</label>
                  <select
                    value={searchMinExp}
                    onChange={(e) => setSearchMinExp(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Any Experience</option>
                    <option value="2">2+ Years</option>
                    <option value="5">5+ Years</option>
                    <option value="8">8+ Years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Location / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Delhi"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Area / Locality</label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown, North Campus"
                    value={searchArea}
                    onChange={(e) => setSearchArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teaching Mode</label>
                  <select
                    value={searchMode}
                    onChange={(e) => setSearchMode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Any mode</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="both">Online and offline</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center space-x-2 font-semibold text-emerald-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={searchVerifiedOnly}
                    onChange={(e) => setSearchVerifiedOnly(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Show Verified Educators Only</span>
                </label>

                <button
                  onClick={fetchCandidates}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
                >
                  Search Candidates
                </button>
              </div>
            </div>

            {/* Candidate Cards */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : visibleCandidates.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-xs">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  {activeTab === 'shortlisted' ? 'No shortlisted candidates yet' : 'No candidate faculty found'}
                </h3>
                <p className="text-xs text-slate-500">Try adjusting your qualification or subject filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-200 transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-600 text-white font-bold text-lg flex items-center justify-center">
                            {cand.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h3 className="text-sm font-bold text-slate-900">{cand.name}</h3>
                              {cand.isVerified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Verified" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1">{cand.headline || 'Faculty Candidate'}</p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {cand.experienceYears}y exp
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                        {cand.degree && (
                          <p className="flex items-center space-x-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{cand.degree} {cand.university ? `• ${cand.university}` : ''}</span>
                          </p>
                        )}
                        {(cand.city || cand.area) && (
                          <p className="flex items-center space-x-1.5 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{[cand.area, cand.city].filter(Boolean).join(', ')}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(cand.subjects || []).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold"
                          >
                            {typeof s === 'string' ? s : s.subjectName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-800">
                        {cand.hourlyRate > 0 ? `₹${cand.hourlyRate}/hr` : 'Negotiable'}
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSelectTutor?.(cand.id)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
                        >
                          View Profile
                        </button>
                        {cand.resumeUrl && (
                          <a
                            href={cand.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center space-x-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>CV</span>
                          </a>
                        )}

                        <button
                          onClick={() => handleToggleShortlist(cand)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs inline-flex items-center gap-1.5"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          {shortlistedMap[cand.id] ? 'Remove Shortlist' : 'Shortlist'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: Institution Profile Form */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900">Institution & School Profile</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Xavier's High School / Apex Academy"
                  value={schoolForm.institutionName}
                  onChange={(e) => setSchoolForm({ ...schoolForm, institutionName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Type</label>
                <select
                  value={schoolForm.institutionType}
                  onChange={(e) => setSchoolForm({ ...schoolForm, institutionType: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="school">K-12 School</option>
                  <option value="college">Junior College / Degree College</option>
                  <option value="coaching_institute">Coaching / Test Prep Center</option>
                  <option value="university">University</option>
                  <option value="other">Other Educational Institution</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Board / Affiliation</label>
                <input
                  type="text"
                  placeholder="e.g. CBSE, ICSE, IB, State Board"
                  value={schoolForm.affiliation}
                  onChange={(e) => setSchoolForm({ ...schoolForm, affiliation: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registration / Recognition No.</label>
                <input
                  type="text"
                  placeholder="e.g. REG-2024-889"
                  value={schoolForm.registrationNumber}
                  onChange={(e) => setSchoolForm({ ...schoolForm, registrationNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={schoolForm.contactEmail}
                  onChange={(e) => setSchoolForm({ ...schoolForm, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={schoolForm.contactPhone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={schoolForm.city}
                  onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Locality</label>
                <input
                  type="text"
                  value={schoolForm.area}
                  onChange={(e) => setSchoolForm({ ...schoolForm, area: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://myschool.edu.in"
                  value={schoolForm.website}
                  onChange={(e) => setSchoolForm({ ...schoolForm, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">About Institution</label>
                <textarea
                  rows={3}
                  value={schoolForm.description}
                  onChange={(e) => setSchoolForm({ ...schoolForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default SchoolPortal;
