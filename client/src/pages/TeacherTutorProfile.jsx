import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMyTutorProfile,
  saveTutorProfile,
  saveTutorSubjects,
  saveTutorAvailability,
  submitTutorVerification
} from '../services/tutorService';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  DollarSign,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  Send,
  AlertCircle,
  MapPin,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

const TeacherTutorProfile = ({ onNavigate }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('general'); // general | subjects | availability | verification
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Form States
  const [profileForm, setProfileForm] = useState({
    headline: '',
    bio: '',
    qualifications: '',
    degree: '',
    university: '',
    experienceYears: 0,
    teachingExperience: '',
    teachingMode: 'both',
    city: '',
    area: '',
    pincode: '',
    hourlyRate: 0,
    monthlyRate: 0,
    languages: ['English', 'Hindi'],
    isAvailable: true,
    isProfileActive: true,
    verificationStatus: 'draft',
    verificationNotes: ''
  });

  const [subjectsList, setSubjectsList] = useState([]);
  const [availabilitiesList, setAvailabilitiesList] = useState([]);

  // Verification form
  const [verificationForm, setVerificationForm] = useState({
    resumeUrl: '',
    certificateUrlsText: '',
    degree: '',
    university: '',
    qualifications: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      const res = await getMyTutorProfile();
      if (res.success && res.data) {
        const p = res.data.profile;
        setProfileForm({
          headline: p.headline || '',
          bio: p.bio || '',
          qualifications: p.qualifications || '',
          degree: p.degree || '',
          university: p.university || '',
          experienceYears: p.experienceYears || 0,
          teachingExperience: p.teachingExperience || '',
          teachingMode: p.teachingMode || 'both',
          city: p.city || '',
          area: p.area || '',
          pincode: p.pincode || '',
          hourlyRate: p.hourlyRate || 0,
          monthlyRate: p.monthlyRate || 0,
          languages: Array.isArray(p.languages) ? p.languages : ['English'],
          isAvailable: p.isAvailable ?? true,
          isProfileActive: p.isProfileActive ?? true,
          verificationStatus: p.verificationStatus || 'draft',
          verificationNotes: p.verificationNotes || ''
        });

        setSubjectsList(Array.isArray(p.subjects) ? p.subjects : []);
        setAvailabilitiesList(Array.isArray(p.availabilities) ? p.availabilities : []);

        setVerificationForm({
          resumeUrl: p.resumeUrl || '',
          certificateUrlsText: Array.isArray(p.certificateUrls) ? p.certificateUrls.join(', ') : '',
          degree: p.degree || '',
          university: p.university || '',
          qualifications: p.qualifications || ''
        });
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const res = await saveTutorProfile(profileForm);
    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Tutor details saved successfully!' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to save profile' });
    }
  };

  const handleSaveSubjects = async () => {
    setIsSaving(true);
    setFeedback(null);

    const res = await saveTutorSubjects(subjectsList);
    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Subject specializations saved successfully!' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to save subjects' });
    }
  };

  const handleSaveAvailabilities = async () => {
    setIsSaving(true);
    setFeedback(null);

    const res = await saveTutorAvailability(availabilitiesList);
    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Weekly availability schedule saved successfully!' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to save availability' });
    }
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const certs = verificationForm.certificateUrlsText
      ? verificationForm.certificateUrlsText.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const res = await submitTutorVerification({
      resumeUrl: verificationForm.resumeUrl,
      certificateUrls: certs,
      degree: verificationForm.degree,
      university: verificationForm.university,
      qualifications: verificationForm.qualifications
    });

    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Credentials submitted for verification! Status is now Pending Review.' });
      setProfileForm(prev => ({ ...prev, verificationStatus: 'pending_verification' }));
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to submit verification' });
    }
  };

  // Subject helpers
  const handleAddSubject = () => {
    setSubjectsList([
      ...subjectsList,
      { subjectName: '', gradeLevels: ['Class 10'], hourlyRate: profileForm.hourlyRate || 0, description: '' }
    ]);
  };

  const handleRemoveSubject = (idx) => {
    setSubjectsList(subjectsList.filter((_, i) => i !== idx));
  };

  // Availability helpers
  const handleAddAvailability = () => {
    setAvailabilitiesList([
      ...availabilitiesList,
      { dayOfWeek: 'monday', startTime: '16:00', endTime: '18:00', mode: 'both', isSlotActive: true }
    ]);
  };

  const handleRemoveAvailability = (idx) => {
    setAvailabilitiesList(availabilitiesList.filter((_, i) => i !== idx));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading tutor profile setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Strip */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-slate-900">Tutor Profile & Marketplace Setup</h1>
                {profileForm.verificationStatus === 'verified' && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                )}
                {profileForm.verificationStatus === 'pending_verification' && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending Verification</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Manage your public teaching profile, specializations, hourly rates, and weekly booking availability.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('teacher-tutor-requests')}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors border border-indigo-100"
            >
              Incoming Requests
            </button>
            <button
              onClick={() => onNavigate('find-tutors')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              View Marketplace
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

        {/* Tabs Bar */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-1">
          {[
            { id: 'general', label: '1. Basic Info & Bio', icon: GraduationCap },
            { id: 'subjects', label: '2. Subjects & Grades', icon: BookOpen },
            { id: 'availability', label: '3. Weekly Schedule', icon: Clock },
            { id: 'verification', label: '4. Badges & Credentials', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setFeedback(null); }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: General Info */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900">Personal & Teaching Profile</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Mathematics & Science Specialist (10+ yrs teaching CBSE/ICSE)"
                  value={profileForm.headline}
                  onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Teaching Experience</label>
                <input
                  type="number"
                  min="0"
                  value={profileForm.experienceYears}
                  onChange={(e) => setProfileForm({ ...profileForm, experienceYears: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teaching Mode Offered</label>
                <select
                  value={profileForm.teachingMode}
                  onChange={(e) => setProfileForm({ ...profileForm, teachingMode: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="both">✨ Hybrid (Online & Home / Offline)</option>
                  <option value="online">🌐 Online Classes Only</option>
                  <option value="offline">🏡 Home / Offline Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Hourly Rate (₹ / hr)</label>
                <input
                  type="number"
                  min="0"
                  value={profileForm.hourlyRate}
                  onChange={(e) => setProfileForm({ ...profileForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rate (₹ / month, optional)</label>
                <input
                  type="number"
                  min="0"
                  value={profileForm.monthlyRate}
                  onChange={(e) => setProfileForm({ ...profileForm, monthlyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City / Region</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, New Delhi"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Locality</label>
                <input
                  type="text"
                  placeholder="e.g. Andheri East, Dwarka"
                  value={profileForm.area}
                  onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">About Me / Bio</label>
                <textarea
                  rows={4}
                  placeholder="Describe your pedagogical approach, experience, student achievements, and methodology..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save General Info'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Subjects */}
        {activeTab === 'subjects' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Subject Specializations</h3>
                <p className="text-xs text-slate-500">Add the subjects and grades you are willing to teach.</p>
              </div>
              <button
                onClick={handleAddSubject}
                className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </button>
            </div>

            {subjectsList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-500 mb-3">No subject specializations added yet.</p>
                <button
                  onClick={handleAddSubject}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Add First Subject
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {subjectsList.map((sub, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Subject #{idx + 1}</span>
                      <button
                        onClick={() => handleRemoveSubject(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Mathematics"
                          value={sub.subjectName}
                          onChange={(e) => {
                            const updated = [...subjectsList];
                            updated[idx].subjectName = e.target.value;
                            setSubjectsList(updated);
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Target Grades (comma separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Class 9, Class 10, Class 11"
                          value={Array.isArray(sub.gradeLevels) ? sub.gradeLevels.join(', ') : sub.gradeLevels || ''}
                          onChange={(e) => {
                            const updated = [...subjectsList];
                            updated[idx].gradeLevels = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            setSubjectsList(updated);
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Rate (₹/hr, optional)</label>
                        <input
                          type="number"
                          placeholder="Leave blank to use standard rate"
                          value={sub.hourlyRate || ''}
                          onChange={(e) => {
                            const updated = [...subjectsList];
                            updated[idx].hourlyRate = parseFloat(e.target.value) || 0;
                            setSubjectsList(updated);
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSaveSubjects}
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Subject Specializations'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Availability */}
        {activeTab === 'availability' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Weekly Availability Schedule</h3>
                <p className="text-xs text-slate-500">Define recurring time windows when students can book you.</p>
              </div>
              <button
                onClick={handleAddAvailability}
                className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Time Slot</span>
              </button>
            </div>

            {availabilitiesList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-500 mb-3">No availability slots defined.</p>
                <button
                  onClick={handleAddAvailability}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Add Slot
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {availabilitiesList.map((slot, idx) => (
                  <div key={idx} className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <select
                          value={slot.dayOfWeek}
                          onChange={(e) => {
                            const updated = [...availabilitiesList];
                            updated[idx].dayOfWeek = e.target.value;
                            setAvailabilitiesList(updated);
                          }}
                          className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold capitalize"
                        >
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(d => (
                            <option key={d} value={d} className="capitalize">{d}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-2 text-xs">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => {
                            const updated = [...availabilitiesList];
                            updated[idx].startTime = e.target.value;
                            setAvailabilitiesList(updated);
                          }}
                          className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => {
                            const updated = [...availabilitiesList];
                            updated[idx].endTime = e.target.value;
                            setAvailabilitiesList(updated);
                          }}
                          className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <select
                          value={slot.mode}
                          onChange={(e) => {
                            const updated = [...availabilitiesList];
                            updated[idx].mode = e.target.value;
                            setAvailabilitiesList(updated);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                        >
                          <option value="both">Online & Offline</option>
                          <option value="online">Online Only</option>
                          <option value="offline">Offline Only</option>
                        </select>
                      </div>
                      <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <input
                          type="checkbox"
                          checked={slot.isSlotActive !== false}
                          onChange={(e) => {
                            const updated = [...availabilitiesList];
                            updated[idx].isSlotActive = e.target.checked;
                            setAvailabilitiesList(updated);
                          }}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        Active
                      </label>
                    </div>

                    <button
                      onClick={() => handleRemoveAvailability(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSaveAvailabilities}
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Availability Schedule'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Credentials & Verification */}
        {activeTab === 'verification' && (
          <form onSubmit={handleSubmitVerification} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Academic Credentials & Verification Badge</h3>
                <p className="text-xs text-slate-500">Verified tutors get 4x more parent and student booking inquiries.</p>
              </div>

              <div>
                {profileForm.verificationStatus === 'verified' && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    ✓ Verified
                  </span>
                )}
                {profileForm.verificationStatus === 'pending_verification' && (
                  <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    Pending Review
                  </span>
                )}
                {profileForm.verificationStatus === 'draft' && (
                  <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                    Draft Profile
                  </span>
                )}
                {profileForm.verificationStatus === 'rejected' && (
                  <span className="px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                    Needs Correction
                  </span>
                )}
              </div>
            </div>

            {profileForm.verificationNotes && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <span className="font-bold">Admin Feedback: </span>
                {profileForm.verificationNotes}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Highest Degree *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master of Science in Mathematics, B.Ed"
                  value={verificationForm.degree}
                  onChange={(e) => setVerificationForm({ ...verificationForm, degree: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">University / College *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delhi University, IIT Bombay"
                  value={verificationForm.university}
                  onChange={(e) => setVerificationForm({ ...verificationForm, university: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resume / CV Document Link (URL)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or hosted PDF link"
                  value={verificationForm.resumeUrl}
                  onChange={(e) => setVerificationForm({ ...verificationForm, resumeUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Degree / Certificate URLs (comma separated)</label>
                <input
                  type="text"
                  placeholder="https://..., https://..."
                  value={verificationForm.certificateUrlsText}
                  onChange={(e) => setVerificationForm({ ...verificationForm, certificateUrlsText: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSaving ? 'Submitting...' : 'Submit for Verification'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default TeacherTutorProfile;
