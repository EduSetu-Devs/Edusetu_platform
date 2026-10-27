import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getTeacherProfile,
  updateTeacherProfile,
  getTeacherDashboard,
  getMyStudents,
  getMyHomework
} from '../services/teacherService';
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
  Briefcase,
  Users,
  CheckSquare,
  FileSpreadsheet,
  CalendarCheck,
  MessageSquare,
  Inbox
} from 'lucide-react';

const TeacherDashboard = ({
  onLogout,
  onNavigateToStudents,
  onNavigateToAttendance,
  onNavigateToHomework,
  onNavigateToMarks,
  onNavigateToClasses,
  onNavigateToMessages,
  onNavigateToAI,
  onNavigateToTutorProfile,
  onNavigateToRequests,
  onNavigateToBookings
}) => {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [activeHomeworkCount, setActiveHomeworkCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    department: '',
    designation: '',
    subjects: '',
    className: '',
    section: '',
    qualification: '',
    experience: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    setFeedback(null);

    const [profRes, dashRes, studentsRes, hwRes] = await Promise.all([
      getTeacherProfile(),
      getTeacherDashboard(),
      getMyStudents(),
      getMyHomework({ status: 'active' })
    ]);

    if (profRes.success) {
      setProfile(profRes.data);
      setEditForm({
        name: profRes.data.name || '',
        phone: profRes.data.phone || '',
        department: profRes.data.department || '',
        designation: profRes.data.designation || '',
        subjects: Array.isArray(profRes.data.subjects) ? profRes.data.subjects.join(', ') : profRes.data.subjects || '',
        className: profRes.data.className || '',
        section: profRes.data.section || '',
        qualification: profRes.data.qualification || '',
        experience: profRes.data.experience || ''
      });
    }

    if (dashRes.success) {
      setDashboardData(dashRes.data);
    }

    if (studentsRes.success) {
      setStudentCount(studentsRes.data.count || 0);
    }

    if (hwRes.success) {
      setActiveHomeworkCount(hwRes.data.count || 0);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
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

    const formattedPayload = {
      ...editForm,
      subjects: editForm.subjects
        ? editForm.subjects.split(',').map((s) => s.trim()).filter(Boolean)
        : []
    };

    const result = await updateTeacherProfile(formattedPayload);
    setIsSaving(false);

    if (result.success) {
      setProfile(result.data);
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Faculty profile updated successfully!' });
      setTimeout(() => setFeedback(null), 4000);
      const studentsRes = await getMyStudents();
      if (studentsRes.success) {
        setStudentCount(studentsRes.data.count || 0);
      }
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to update profile' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading Faculty Portal...</p>
      </div>
    );
  }

  const teacherName = profile?.name || user?.name || 'Teacher';

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-8">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Teacher Portal • Step 5E Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Welcome back, {teacherName}! 👩‍🏫
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed">
              Manage your classroom roster, student evaluations, daily attendance registers, assignments, and gradebook.
            </p>
          </div>

          {/* Quick Profile Summary Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center space-x-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white text-indigo-700 flex items-center justify-center font-bold text-xl shadow-md">
              {teacherName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm">{teacherName}</span>
                <span className="text-[10px] bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-bold uppercase">
                  Faculty
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5 font-mono">
                ID: {profile?.teacherId || 'TCH-001'}
              </p>
              <p className="text-xs text-indigo-200">
                {profile?.department || 'Department Not Set'} • {profile?.designation || 'Instructor'}
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Background Circles */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
      </div>

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

      {/* Teacher Profile Summary Section */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Faculty Credentials & Identity</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Your registered academic role, department affiliation, and assigned classes in EduSetu
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Teacher ID</p>
              <p className="text-sm font-bold font-mono text-indigo-600 mt-1">
                {profile?.teacherId || 'N/A'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {profile?.department || <span className="text-slate-400 italic">Not set</span>}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Designation</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {profile?.designation || <span className="text-slate-400 italic">Not set</span>}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Assigned</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {profile?.className ? `${profile.className} ${profile.section ? `(${profile.section})` : ''}` : <span className="text-slate-400 italic">Not assigned</span>}
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Qualification</p>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {profile?.qualification || <span className="text-slate-400 italic">Not set</span>}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Experience</p>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {profile?.experience || <span className="text-slate-400 italic">Not set</span>}
              </p>
            </div>

            {/* Subjects List */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 sm:col-span-2 md:col-span-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Taught Subjects</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(profile?.subjects) && profile.subjects.length > 0 ? (
                  profile.subjects.map((sub, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs"
                    >
                      {sub}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-xs">No subjects currently assigned</span>
                )}
              </div>
            </div>

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
                <label className="block font-semibold text-slate-700">Department</label>
                <input
                  type="text"
                  name="department"
                  placeholder="e.g. Computer Science & Engineering"
                  value={editForm.department}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Designation</label>
                <input
                  type="text"
                  name="designation"
                  placeholder="e.g. Assistant Professor / Senior Faculty"
                  value={editForm.designation}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Class Assigned</label>
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
                <label className="block font-semibold text-slate-700">Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  placeholder="e.g. M.Tech, Ph.D."
                  value={editForm.qualification}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Experience</label>
                <input
                  type="text"
                  name="experience"
                  placeholder="e.g. 5 Years"
                  value={editForm.experience}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2 md:col-span-3">
                <label className="block font-semibold text-slate-700">Subjects <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                <input
                  type="text"
                  name="subjects"
                  placeholder="e.g. Mathematics, Physics, Computer Science"
                  value={editForm.subjects}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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

      {/* Quick Action Feature Modules */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Classroom Management Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quick access to teacher administration, student rosters, attendance sheets, and gradebooks
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <div onClick={onNavigateToClasses} className="p-6 rounded-3xl bg-white border border-amber-200/80 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between space-y-4 cursor-pointer group">
            <div className="space-y-3"><div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 group-hover:scale-105 transition-transform"><CalendarCheck className="w-6 h-6" /></div><div><div className="flex items-center justify-between"><h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600">My Classes</h3><ArrowRight className="w-4 h-4 text-slate-400" /></div><p className="text-xs text-slate-500 mt-1 leading-relaxed">Schedule online or offline classes and manage their lifecycle.</p></div></div>
            <div className="pt-3 border-t border-slate-100"><span className="text-[10px] font-bold text-amber-700">Open classroom manager &rarr;</span></div>
          </div>
          
          {/* Card 1: My Students (ACTIVE) */}
          <div
            onClick={onNavigateToStudents}
            className="p-6 rounded-3xl bg-white border border-indigo-200/80 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    My Students
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  View complete student roster, roll numbers, academic performance, and submission history.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {studentCount} Enrolled Students
              </span>
              <span className="text-[10px] font-bold text-indigo-600">Open Roster &rarr;</span>
            </div>
          </div>

          {/* Card 2: Attendance Marking (ACTIVE) */}
          <div
            onClick={onNavigateToAttendance}
            className="p-6 rounded-3xl bg-white border border-emerald-200/80 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Attendance Sheet
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Mark daily classroom attendance, toggle status, and record subject registers with bulk saving.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Daily Register Ready
              </span>
              <span className="text-[10px] font-bold text-emerald-600">Mark Sheet &rarr;</span>
            </div>
          </div>

          {/* Card 3: Homework & Assignments (ACTIVE) */}
          <div
            onClick={onNavigateToHomework}
            className="p-6 rounded-3xl bg-white border border-blue-200/80 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Assign Homework
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Publish assignments, set submission deadlines, review student submissions, and write feedback.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {activeHomeworkCount} Active Tasks
              </span>
              <span className="text-[10px] font-bold text-blue-600">Manage Tasks &rarr;</span>
            </div>
          </div>

          {/* Card 4: Marks & Grading (ACTIVE) */}
          <div
            onClick={onNavigateToMarks}
            className="p-6 rounded-3xl bg-white border border-purple-200/80 shadow-sm hover:shadow-md hover:border-purple-400 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    Gradebook Entry
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Enter examination marks, calculate weighted GPA scores, generate report cards, and publish term grades.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Gradebook Active
              </span>
              <span className="text-[10px] font-bold text-purple-600">Enter Scores &rarr;</span>
            </div>
          </div>

          <div
            onClick={onNavigateToAI}
            className="p-6 rounded-3xl bg-white border border-rose-200/80 shadow-sm hover:shadow-md hover:border-rose-400 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors">AI Insights</h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Review recorded academic data for authorized students and completed classes.</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-rose-600">Advisory only · Open insights &rarr;</span>
            </div>
          </div>

          <div
            onClick={onNavigateToMessages}
            className="p-6 rounded-3xl bg-white border border-teal-200/80 shadow-sm hover:shadow-md hover:border-teal-400 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">Parent Messages</h3>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Chat with parents of students assigned to your class or accepted tutoring sessions.</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-teal-600">Open secure messages &rarr;</span>
            </div>
          </div>

        </div>
      </section>

      {/* Private Tutoring & Marketplace Hub */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            1-on-1 Tutoring & Marketplace Portal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your public teacher profile on the EduSetu marketplace, set hourly rates, review student booking requests, and launch tutoring classrooms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card 1: Tutor Profile */}
          <div
            onClick={onNavigateToTutorProfile}
            className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-200/80 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-300 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Public Tutor Profile
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Configure hourly rates (₹/hr), teaching mode (online/offline), subjects offered, and weekly availability slots.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Marketplace Active
              </span>
              <span className="text-[10px] font-bold text-indigo-600">Edit Profile &rarr;</span>
            </div>
          </div>

          {/* Card 2: Incoming Requests */}
          <div
            onClick={onNavigateToRequests}
            className="p-6 rounded-3xl bg-gradient-to-br from-teal-50/50 to-white border border-teal-200/80 shadow-sm hover:shadow-md hover:border-teal-400 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center border border-teal-300 group-hover:scale-105 transition-transform">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                    Booking Requests
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Respond to new tutor inquiries and proposals sent by students and parents across education hubs.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Inquiries Inbox
              </span>
              <span className="text-[10px] font-bold text-teal-600">Review Requests &rarr;</span>
            </div>
          </div>

          {/* Card 3: Active Bookings */}
          <div
            onClick={onNavigateToBookings}
            className="p-6 rounded-3xl bg-gradient-to-br from-amber-50/50 to-white border border-amber-200/80 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300 group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                    Tutoring Bookings
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Manage active tutoring schedule, reschedule sessions, review student contracts, and launch classroom.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Live Sessions
              </span>
              <span className="text-[10px] font-bold text-amber-600">Open Bookings &rarr;</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default TeacherDashboard;
