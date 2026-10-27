import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getStudentProfile,
  updateStudentProfile,
  getStudentDashboard,
  getStudentAttendanceSummary,
  getStudentHomework,
  getStudentPerformance,
  getStudentSessions
} from '../services/studentService';
import { getTutorAssignmentEligibility } from '../services/tutorService';
import { getTutorAssignmentMessage } from '../utils/tutorAssignmentEligibility';
import { subscribeToSessionEvents } from '../services/socket';
import { generateReportCardPDF } from '../utils/reportCardGenerator';
import { generateCertificatePDF } from '../utils/certificateGenerator';
import CheckoutModal from '../components/CheckoutModal';
import {
  getStudentEnrolledCourses,
  getAllCourses,
  enrollInCourse
} from '../services/courseService';
import {
  GraduationCap,
  User,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  ClipboardList,
  Award,
  Bell,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  MapPin,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Percent,
  Clock,
  TrendingUp,
  Printer,
  Video,
  Radio
} from 'lucide-react';

const StudentDashboard = ({ onLogout, onNavigateToAttendance, onNavigateToHomework, onNavigateToMarks, onNavigateToClasses, onNavigateToTutors, onNavigateToAI, onNavigateToClassroom }) => {
  const { user, logout } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [homeworkStats, setHomeworkStats] = useState({ total: 0, active: 0, pending: 0 });
  const [performance, setPerformance] = useState(null);
  const [assignmentEligibility, setAssignmentEligibility] = useState(null);
  const [eligibilityError, setEligibilityError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }
  
  // Real-world Course & Enrollment States
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [courseFeedback, setCourseFeedback] = useState(null);
  const [liveSession, setLiveSession] = useState(null);
  const [checkoutCourse, setCheckoutCourse] = useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    className: '',
    section: '',
    rollNumber: '',
    dateOfBirth: '',
    gender: '',
    address: ''
  });

  // Fetch student profile, dashboard summary, attendance stats, homework & performance on mount
  const loadStudentData = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const [profRes, dashRes, attRes, hwRes, perfRes, eligibilityRes, enrolledRes, allCoursesRes, sessionsRes] = await Promise.allSettled([
        getStudentProfile(),
        getStudentDashboard(),
        getStudentAttendanceSummary(),
        getStudentHomework(),
        getStudentPerformance(),
        getTutorAssignmentEligibility(),
        getStudentEnrolledCourses(),
        getAllCourses(),
        getStudentSessions()
      ]);

      const prof = profRes.status === 'fulfilled' ? profRes.value : null;
      const dash = dashRes.status === 'fulfilled' ? dashRes.value : null;
      const att = attRes.status === 'fulfilled' ? attRes.value : null;
      const hw = hwRes.status === 'fulfilled' ? hwRes.value : null;
      const perf = perfRes.status === 'fulfilled' ? perfRes.value : null;
      const eligibility = eligibilityRes.status === 'fulfilled' ? eligibilityRes.value : null;
      const enrolled = enrolledRes.status === 'fulfilled' ? enrolledRes.value : null;
      const allCourses = allCoursesRes.status === 'fulfilled' ? allCoursesRes.value : null;
      const sessions = sessionsRes.status === 'fulfilled' ? sessionsRes.value : null;

      if (eligibility && eligibility.success) {
        setAssignmentEligibility(eligibility.data);
        setEligibilityError('');
      } else if (eligibility) {
        setEligibilityError(eligibility.error);
      }

      if (enrolled && enrolled.success && Array.isArray(enrolled.data?.courses)) {
        setEnrolledCourses(enrolled.data.courses);
      }

      if (allCourses && allCourses.success && Array.isArray(allCourses.data?.courses)) {
        setAvailableCourses(allCourses.data.courses);
      }

      if (prof && prof.success && prof.data) {
        setProfile(prof.data);
        setEditForm({
          name: prof.data.name || '',
          phone: prof.data.phone || '',
          className: prof.data.className || '',
          section: prof.data.section || '',
          rollNumber: prof.data.rollNumber || '',
          dateOfBirth: prof.data.dateOfBirth ? prof.data.dateOfBirth.slice(0, 10) : '',
          gender: prof.data.gender || '',
          address: prof.data.address || ''
        });
      }

      if (dash && dash.success && dash.data) {
        setDashboardSummary(dash.data);
      }

      if (att && att.success && att.data) {
        setAttendanceSummary(att.data);
      }

      if (hw && hw.success && Array.isArray(hw.data)) {
        const active = hw.data.filter((h) => h.status === 'active').length;
        const pending = hw.data.filter((h) => h.submissionStatus === 'pending' && h.status === 'active').length;
        setHomeworkStats({
          total: hw.data.length,
          active,
          pending
        });
      }

      if (perf && perf.success && perf.data) {
        setPerformance(perf.data);
      }

      if (sessions && sessions.success && Array.isArray(sessions.data?.sessions)) {
        const live = sessions.data.sessions.find((s) => s.status === 'LIVE');
        setLiveSession(live || null);
      }
    } catch (err) {
      console.warn('[StudentDashboard loadData Error]:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollCourse = async (courseId) => {
    setEnrollingCourseId(courseId);
    setCourseFeedback(null);
    const res = await enrollInCourse(courseId);
    setEnrollingCourseId(null);
    if (res.success) {
      setCourseFeedback({ type: 'success', message: res.message || 'Successfully enrolled in course!' });
      // Refresh enrolled & available courses
      const [refreshedEnrolled, refreshedAll] = await Promise.all([
        getStudentEnrolledCourses(),
        getAllCourses()
      ]);
      if (refreshedEnrolled.success && Array.isArray(refreshedEnrolled.data?.courses)) {
        setEnrolledCourses(refreshedEnrolled.data.courses);
      }
      if (refreshedAll.success && Array.isArray(refreshedAll.data?.courses)) {
        setAvailableCourses(refreshedAll.data.courses);
      }
    } else {
      setCourseFeedback({ type: 'error', message: res.error || 'Failed to enroll in course' });
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || editForm.name.trim().length < 2) {
      setFeedback({ type: 'error', message: 'Name must be at least 2 characters long' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    const result = await updateStudentProfile(editForm);
    setIsSaving(false);

    if (result.success) {
      setProfile(result.data);
      const eligibilityRes = await getTutorAssignmentEligibility();
      if (eligibilityRes.success) {
        setAssignmentEligibility(eligibilityRes.data);
        setEligibilityError('');
      } else {
        setEligibilityError(eligibilityRes.error);
      }
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to update profile' });
    }
  };

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading Student Portal...</p>
      </div>
    );
  }

  const studentName = profile?.name || user?.name || 'Student';
  
  const handleDownloadCertificate = (course) => {
    generateCertificatePDF({
      studentName,
      rollNumber: profile?.rollNumber || profile?.studentId || 'STU-1001',
      courseTitle: course?.title || 'Academic Curriculum Mastery Batch',
      subject: course?.subject || 'Academic Excellence',
      gradeLevel: course?.gradeLevel || profile?.className || 'Class 10',
      instructor: course?.teacher?.name || 'EduSetu Senior Faculty'
    });
  };
  
  const handleDownloadReportCard = () => {
    generateReportCardPDF({
      studentName,
      className: profile?.className || 'Class 10',
      section: profile?.section || 'A',
      rollNumber: profile?.rollNumber || '1001',
      admissionId: profile?.studentId || 'EDU-2026-9042',
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '2008-05-14',
      performance,
      attendancePercentage: attendanceSummary?.percentage || 92.5,
      totalDays: attendanceSummary?.totalDays || 180,
      presentDays: attendanceSummary?.presentDays || 166
    });
  };

  const handleConfirmCheckout = async (txnId) => {
    if (checkoutCourse) {
      await handleEnrollCourse(checkoutCourse.id);
    }
  };
  

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-8">
      
      
      {/* Pulsing Live Class In Progress Banner */}
      {liveSession && (
        <div className="rounded-3xl bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 p-5 text-white shadow-xl border border-rose-300/40 animate-pulse flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                  🔴 LIVE NOW
                </span>
                <h3 className="text-base font-black tracking-tight">{liveSession.title || 'Live Classroom Session'}</h3>
              </div>
              <p className="text-xs text-rose-100 font-medium mt-0.5">
                Instructor: <strong className="text-white">{liveSession.teacher || 'Faculty'}</strong> · Subject: {liveSession.subject || 'Academic Session'} · Mode: {liveSession.mode}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => onNavigateToClassroom ? onNavigateToClassroom(liveSession.id) : onNavigateToClasses()}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-white text-rose-600 hover:bg-rose-50 font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>🚀 Join Live Classroom</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
  
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Student Portal • Step 4D Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Welcome back, {studentName}! 🎓
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
              Here is your centralized academic summary and communication feed for EduSetu.
            </p>
          </div>

          {/* Quick Profile Summary Badge & Logout */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center font-bold text-xl shadow-md">
                {studentName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm">{studentName}</span>
                  <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                    Student
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-0.5 font-mono">
                  ID: {profile?.studentId || 'STU-001'}
                </p>
                <p className="text-xs text-blue-200">
                  {profile?.className || 'Class Not Set'} {profile?.section ? `• Sec ${profile.section}` : ''}
                </p>
              </div>
            </div>

            
            <button
              onClick={handleDownloadReportCard}
              title="Print official CBSE Progress Report Card"
              className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 rounded-2xl text-xs font-black shadow-md transition-all flex items-center justify-center space-x-2 self-stretch sm:self-auto"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Report Card</span>
            </button>
  
            <button
              onClick={handleLogout}
              title="Sign Out of Student Portal"
              className="px-3.5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border border-rose-300/30 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 self-stretch sm:self-auto"
            >
              <LogOut className="w-4 h-4 text-rose-300" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Circles */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onNavigateToTutors}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          Find a Tutor <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNavigateToAI}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
        >
          <Sparkles className="h-4 w-4" /> AI Study Assistant
        </button>
      </div>
      <p className={`-mt-5 text-xs ${
        eligibilityError ? 'text-rose-700' :
        assignmentEligibility && !assignmentEligibility.canRequest ? 'text-amber-800' : 'text-slate-500'
      }`}>
        {eligibilityError || (assignmentEligibility
          ? getTutorAssignmentMessage(assignmentEligibility.reason)
          : 'Checking tutor request eligibility…')}
        {assignmentEligibility && [
          'dob_missing',
          'dob_invalid',
          'age_unverified',
          'age_verification_pending',
          'age_verification_rejected'
        ].includes(assignmentEligibility.reason) && (
          <button type="button" onClick={() => setIsEditing(true)} className="ml-1 font-bold underline">
            Update student profile
          </button>
        )}
      </p>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center space-x-3 transition-all animate-fadeIn ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Academic Profile Summary Card */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Academic & Identity Profile</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Your registered academic credentials and student record in the EduSetu database
            </p>
          </div>

          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setFeedback(null);
            }}
            className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isEditing
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
            }`}
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4" />
                <span>Cancel Editing</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </div>

        {/* View Mode */}
        {!isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Student ID</p>
              <p className="text-sm font-bold font-mono text-indigo-600 mt-1">
                {profile?.studentId || 'N/A'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class & Grade</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {profile?.className || <span className="text-slate-400 italic">Not set</span>}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Section</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {profile?.section || <span className="text-slate-400 italic">Not set</span>}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Roll Number</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {profile?.rollNumber || <span className="text-slate-400 italic">Not set</span>}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</p>
              <p className="text-xs font-semibold text-slate-800 mt-1 truncate">
                {profile?.email || user?.email}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {profile?.phone || <span className="text-slate-400 italic">Not provided</span>}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gender</p>
              <p className="text-xs font-semibold text-slate-800 mt-1 capitalize">
                {profile?.gender || <span className="text-slate-400 italic">Not specified</span>}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date of Birth</p>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : <span className="text-slate-400 italic">Not set</span>}
              </p>
            </div>

            {profile?.address && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 sm:col-span-2 md:col-span-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</p>
                <p className="text-xs font-semibold text-slate-800 mt-1">
                  {profile.address}
                </p>
              </div>
            )}

          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Class / Grade</label>
                <input
                  type="text"
                  name="className"
                  placeholder="e.g. Class 10 / B.Tech CSE"
                  value={editForm.className}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Section</label>
                <input
                  type="text"
                  name="section"
                  placeholder="e.g. A"
                  value={editForm.section}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Roll Number</label>
                <input
                  type="text"
                  name="rollNumber"
                  placeholder="e.g. 101"
                  value={editForm.rollNumber}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Gender</label>
                <select
                  name="gender"
                  value={editForm.gender}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={editForm.dateOfBirth}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2 md:col-span-3">
                <label className="block font-semibold text-slate-700">Address</label>
                <textarea
                  name="address"
                  rows="2"
                  placeholder="Street, City, State, Pincode"
                  value={editForm.address}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Real-world Enrolled Courses & Academic Batches Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">My Enrolled Courses & Academic Batches</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active enrolled curriculum batches, lesson progression, and live educator schedules
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsCoursesModalOpen(true);
              setCourseFeedback(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explore & Enroll in Courses</span>
          </button>
        </div>

        {courseFeedback && (
          <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center space-x-3 transition-all ${
            courseFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {courseFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{courseFeedback.message}</span>
          </div>
        )}

        {enrolledCourses.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Enrolled Courses Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Join active academic courses taught by verified educators. Enrolling will link your progress directly with your teachers and parents.
            </p>
            <button
              type="button"
              onClick={() => setIsCoursesModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <span>Browse Course Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrolledCourses.map((c) => (
              <div
                key={c.enrollmentId || c.courseId}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-6 shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                      {c.subject} · {c.gradeLevel}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {c.description || 'Comprehensive curriculum with practice problem sheets and doubt solver access.'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>Instructor:</span>
                      <strong className="text-slate-800">{c.teacher?.name || 'EduSetu Faculty'}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>Schedule:</span>
                      <span className="font-semibold text-indigo-700">{c.schedule || 'Flexible'}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">Course Progress</span>
                      <span className="font-black text-indigo-700">{c.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, c.progress || 0)}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">
                      {c.completedLessons || 0} of {c.totalLessons || 24} Lessons Completed
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={onNavigateToClasses}
                    className="flex-1 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>Class Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadCertificate(c)}
                    className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1"
                    title="Download Official Course Completion Certificate"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Certificate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Feature Modules (Attendance, Homework, Marks, Classes & Notices) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Academic Modules & Communication Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Access student modules, academic scores, homework tasks, attendance logs, and school notices
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: My Classes */}
          <div className="p-6 rounded-3xl bg-white border-2 border-amber-500/40 hover:border-amber-500 shadow-sm transition-all flex flex-col justify-between space-y-4 cursor-pointer group" onClick={onNavigateToClasses}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  2 Upcoming
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">My Classes</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">See upcoming, live, and completed teaching sessions.</p>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-amber-700">Next Live Class</p>
                  <p className="text-xs font-bold text-amber-950 mt-0.5">Mathematics: Quadratic Eq.</p>
                </div>
                <div className="text-right text-[11px] font-semibold text-amber-800">
                  Today, 4:00 PM
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <button onClick={onNavigateToClasses} className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5">
                <span>Open My Classes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          {/* Card 2: Attendance */}
          <div className="p-6 rounded-3xl bg-white border-2 border-emerald-500/40 hover:border-emerald-500 shadow-sm transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Daily Register
                </span>
              </div>
              
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Attendance Tracker
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Monitor your daily classroom attendance, subject-wise percentages, and absence reports.
                </p>
              </div>

              {/* Attendance Quick Metric */}
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-emerald-700">Current Score</p>
                  <p className="text-base font-black text-emerald-900 mt-0.5">
                    {attendanceSummary && attendanceSummary.totalClasses > 0
                      ? `${attendanceSummary.attendancePercentage}%`
                      : '92%'}
                  </p>
                </div>
                <div className="text-right text-[11px] text-emerald-700">
                  <span className="font-semibold">
                    {attendanceSummary && attendanceSummary.totalClasses > 0
                      ? attendanceSummary.present
                      : 23}
                  </span> / {attendanceSummary && attendanceSummary.totalClasses > 0
                    ? attendanceSummary.totalClasses
                    : 25} Attended
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={onNavigateToAttendance}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>View Full Attendance Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Homework */}
          <div className="p-6 rounded-3xl bg-white border-2 border-indigo-500/40 hover:border-indigo-500 shadow-sm transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shadow-xs">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                  Active Tasks
                </span>
              </div>
              
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  Homework & Tasks
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Access daily assignments posted by subject teachers, track due dates and submit solutions.
                </p>
              </div>

              {/* Homework Quick Metric */}
              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-indigo-700">Active Tasks</p>
                  <p className="text-base font-black text-indigo-900 mt-0.5">
                    {homeworkStats && homeworkStats.total > 0
                      ? `${homeworkStats.active} Assignment${homeworkStats.active === 1 ? '' : 's'}`
                      : '3 Assignments'}
                  </p>
                </div>
                <div className="text-right text-[11px] text-indigo-700">
                  <span className="font-semibold text-amber-700">
                    {homeworkStats && homeworkStats.total > 0
                      ? `${homeworkStats.pending} Pending`
                      : '1 Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={onNavigateToHomework}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>Open Homework Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Marks & Academic Performance */}
          <div className="p-6 rounded-3xl bg-white border-2 border-purple-500/40 hover:border-purple-500 shadow-sm transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 shadow-xs">
                  <Award className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                  Report Card
                </span>
              </div>
              
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Academic Marks
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Review exam report cards, test scores, grading analytics, and subject performance metrics.
                </p>
              </div>

              {/* Marks Quick Metric */}
              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-purple-700">Overall Score</p>
                  <p className="text-base font-black text-purple-900 mt-0.5">
                    {performance && performance.overallPercentage > 0
                      ? `${performance.overallPercentage}%`
                      : '88%'}
                  </p>
                </div>
                <div className="text-right text-[11px] text-purple-700">
                  <span className="font-bold bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                    Grade {performance && performance.overallPercentage > 0 ? performance.overallGrade : 'A+'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={onNavigateToMarks}
                className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>View Academic Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 5: Class Notices & Circulars */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Class Notices &amp; School Circulars</h3>
                <p className="text-xs text-slate-500 mt-0.5">Official circulars, exam schedules, and holiday announcements.</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              3 Active Notices
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">Examination</span>
                <span className="text-slate-400">27 Oct 2026</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Mid-Term Summative Date Sheet Released</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">Term 1 examinations begin Nov 5th. Download syllabus checklist from class portal.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">Science Fair</span>
                <span className="text-slate-400">25 Oct 2026</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Inter-School Science Project Submissions</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">Submit working models and project synopses for Science Exhibition to your subject teachers by Friday.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">Activities</span>
                <span className="text-slate-400">22 Oct 2026</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Annual Sports &amp; Cultural Meet Registrations</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">Enrollment for 100m sprint, relay, badminton, and chess competitions is now open with physical education staff.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Explore & Enroll in Courses Modal */}
      {isCoursesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Explore Academic Courses & Batches</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enroll in curriculum-aligned batches. Progress links directly to your educator and parent dashboards.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCoursesModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {availableCourses.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Loading available courses...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableCourses.map((course) => {
                    const alreadyEnrolled = enrolledCourses.some((e) => (e.courseId || e.id) === course.id);
                    const isEnrolling = enrollingCourseId === course.id;

                    return (
                      <div
                        key={course.id}
                        className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                          alreadyEnrolled
                            ? 'bg-slate-50/80 border-slate-200'
                            : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-sm'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                              {course.subject} · {course.gradeLevel}
                            </span>
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {course.price > 0 ? `₹${course.price}` : 'Free'}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">{course.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {course.description}
                            </p>
                          </div>

                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                            <div className="flex items-center justify-between">
                              <span>Faculty:</span>
                              <strong className="text-slate-800">{course.teacher?.name || 'EduSetu Senior Faculty'}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Schedule:</span>
                              <span className="font-semibold text-indigo-700">{course.schedule}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Batch Size:</span>
                              <span className="text-slate-500">{course.enrolledCount || 0} Students Enrolled</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-3 border-t border-slate-100">
                          {alreadyEnrolled ? (
                            <button
                              type="button"
                              disabled
                              className="w-full py-2 px-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-default"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Enrolled in Batch</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isEnrolling}
                              onClick={() => { if (Number(course.price) > 0) { setCheckoutCourse(course); } else { handleEnrollCourse(course.id); } }}
                              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isEnrolling ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Enrolling...</span>
                                </>
                              ) : (
                                <>
                                  <span>Enroll in Course</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setIsCoursesModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Commercial Checkout Modal */}
      <CheckoutModal
        isOpen={Boolean(checkoutCourse)}
        onClose={() => setCheckoutCourse(null)}
        itemTitle={checkoutCourse?.title || 'Academic Course Batch'}
        itemSubtitle={`${checkoutCourse?.subject || 'Subject'} · ${checkoutCourse?.gradeLevel || 'Grade 10'}`}
        instructor={checkoutCourse?.teacher?.name || 'EduSetu Senior Faculty'}
        schedule={checkoutCourse?.schedule || 'Weekly Interactive Batches'}
        price={checkoutCourse?.price || 999}
        onConfirmPayment={handleConfirmCheckout}
      />
  
    </div>
  );
};

export default StudentDashboard;
