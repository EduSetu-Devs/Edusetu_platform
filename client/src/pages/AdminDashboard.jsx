import React, { useState, useEffect } from 'react';
import {
  getAdminDashboard,
  getAdminUsers,
  updateUserStatus,
  getAdminTeachers,
  updateTeacherAssignment,
  getAdminStudents,
  updateStudentAssignment,
  getAdminAgeVerificationRequests,
  reviewAdminStudentAge,
  getAdminParents,
  linkParentChild,
  unlinkParentChild,
  getAdminClasses,
  createAdminClass,
  updateAdminClass,
  deleteAdminClass,
  getAdminSections,
  createAdminSection,
  updateAdminSection,
  deleteAdminSection,
  getAdminSubjects,
  createAdminSubject,
  updateAdminSubject,
  deleteAdminSubject
} from '../services/adminService';
import {
  getPendingVerifications,
  verifyTutorAdmin,
  rejectTutorAdmin
} from '../services/tutorService';
import {
  ShieldCheck,
  Users,
  GraduationCap,
  HeartHandshake,
  School,
  BookOpen,
  LayoutDashboard,
  Search,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Link,
  Unlink,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Award,
  CalendarCheck,
  ClipboardList,
  ChevronRight,
  UserCheck,
  UserX,
  FileText,
  X
} from 'lucide-react';

const normalizeTab = (tab) => {
  if (tab === 'sections') return 'classes';
  if (tab === 'analytics') return 'overview';
  return ['overview', 'users', 'teachers', 'students', 'parents', 'classes', 'subjects', 'tutors'].includes(tab)
    ? tab
    : null;
};


const AdminDashboard = ({ onLogout, initialTab = 'overview', onNavigate }) => {
  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab) || 'overview');
  const [unsupportedTab, setUnsupportedTab] = useState(
    () => (['notifications', 'settings'].includes(initialTab) ? initialTab : null)
  );
  
  // Overview State
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  // Users State
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Teachers State
  const [teachers, setTeachers] = useState([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherAssignForm, setTeacherAssignForm] = useState({ className: '', section: '', subjects: '' });

  // Students State
  const [students, setStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [ageVerificationRequests, setAgeVerificationRequests] = useState([]);
  const [isLoadingAgeVerifications, setIsLoadingAgeVerifications] = useState(false);
  const [savingAgeVerificationId, setSavingAgeVerificationId] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentAssignForm, setStudentAssignForm] = useState({ className: '', section: '', rollNumber: '' });

  // Parents State
  const [parents, setParents] = useState([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [linkingParent, setLinkingParent] = useState(null);
  const [linkChildForm, setLinkChildForm] = useState({ studentId: '', relationship: 'Child' });

  // Classes & Sections State
  const [classes, setClasses] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [newClassForm, setNewClassForm] = useState({ name: '', description: '' });
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [newSectionForm, setNewSectionForm] = useState({ classId: '', name: '' });

  // Subjects State
  const [subjects, setSubjects] = useState([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [newSubjectForm, setNewSubjectForm] = useState({ name: '', code: '', description: '' });

  // Global Feedback Banner
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  useEffect(() => {
    setUnsupportedTab(['notifications', 'settings'].includes(initialTab) ? initialTab : null);
    const normalizedTab = normalizeTab(initialTab);
    if (normalizedTab) setActiveTab(normalizedTab);
  }, [initialTab]);

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Load Dashboard Overview
  const loadDashboard = async () => {
    setIsLoadingDashboard(true);
    setDashboardError(null);
    const res = await getAdminDashboard();
    setIsLoadingDashboard(false);
    if (res.success) {
      setDashboardData(res.data);
    } else {
      setDashboardError('Unable to load Admin Dashboard. Please try again.');
      showStatus('error', res.error);
    }
  };

  // Load Users
  const loadUsers = async (page = 1) => {
    setIsLoadingUsers(true);
    const params = { page, limit: 15 };
    if (userSearch) params.search = userSearch;
    if (userRoleFilter) params.role = userRoleFilter;

    const res = await getAdminUsers(params);
    setIsLoadingUsers(false);
    if (res.success) {
      setUsers(res.data.users || []);
      setUserTotal(res.data.total || 0);
      setUserPage(res.data.page || 1);
      setUserTotalPages(res.data.totalPages || 1);
    }
  };

  // Load Teachers
  const loadTeachers = async () => {
    setIsLoadingTeachers(true);
    const res = await getAdminTeachers({ limit: 50 });
    setIsLoadingTeachers(false);
    if (res.success) {
      setTeachers(res.data.teachers || []);
    }
  };

  // Load Students
  const loadStudents = async () => {
    setIsLoadingStudents(true);
    const res = await getAdminStudents({ limit: 50 });
    setIsLoadingStudents(false);
    if (res.success) {
      setStudents(res.data.students || []);
    }
  };

  const loadAgeVerificationRequests = async () => {
    setIsLoadingAgeVerifications(true);
    const res = await getAdminAgeVerificationRequests();
    setIsLoadingAgeVerifications(false);
    if (res.success) {
      setAgeVerificationRequests(res.data || []);
    } else {
      showStatus('error', res.error);
    }
  };

  const handleAgeVerificationReview = async (student, decision) => {
    const confirmed = window.confirm(
      `${decision === 'verified' ? 'Verify' : 'Reject'} ${student.name}'s age record after independently reviewing reliable age evidence. Do not upload or retain identity documents in EduSetu.`
    );
    if (!confirmed) return;

    setSavingAgeVerificationId(student.id);
    const result = await reviewAdminStudentAge(student.id, decision, student.dateOfBirth);
    setSavingAgeVerificationId(null);
    if (!result.success) {
      showStatus('error', result.error);
      return;
    }
    showStatus('success', result.message);
    loadAgeVerificationRequests();
  };

  // Load Parents
  const loadParents = async () => {
    setIsLoadingParents(true);
    const res = await getAdminParents({ limit: 50 });
    setIsLoadingParents(false);
    if (res.success) {
      setParents(res.data.parents || []);
    }
  };

  // Load Classes
  const loadClasses = async () => {
    setIsLoadingClasses(true);
    const res = await getAdminClasses();
    setIsLoadingClasses(false);
    if (res.success) {
      setClasses(res.data || []);
    }
  };

  // Load Subjects
  const loadSubjects = async () => {
    setIsLoadingSubjects(true);
    const res = await getAdminSubjects();
    setIsLoadingSubjects(false);
    if (res.success) {
      setSubjects(res.data || []);
    }
  };

  // Tutor Verifications State
  const [tutorVerifications, setTutorVerifications] = useState([]);
  const [isLoadingTutors, setIsLoadingTutors] = useState(false);
  const [tutorStatusFilter, setTutorStatusFilter] = useState('pending_verification');

  // Load Tutor Verifications
  const loadTutorVerifications = async (status = tutorStatusFilter) => {
    setIsLoadingTutors(true);
    const res = await getPendingVerifications(status);
    setIsLoadingTutors(false);
    if (res.success) {
      setTutorVerifications(res.data || []);
    }
  };

  // Trigger loads based on active tab
  useEffect(() => {
    if (activeTab === 'overview') loadDashboard();
    else if (activeTab === 'users') loadUsers(1);
    else if (activeTab === 'teachers') loadTeachers();
    else if (activeTab === 'students') {
      loadStudents();
      loadAgeVerificationRequests();
    }
    else if (activeTab === 'parents') loadParents();
    else if (activeTab === 'classes') loadClasses();
    else if (activeTab === 'subjects') loadSubjects();
    else if (activeTab === 'tutors') loadTutorVerifications();
  }, [activeTab]);


  // Handlers for User status
  const handleToggleStatus = async (user) => {
    const newStatus = !user.isActive;
    const res = await updateUserStatus(user.id, newStatus ? 'active' : 'inactive');
    if (res.success) {
      showStatus('success', `User ${user.name} is now ${newStatus ? 'active' : 'inactive'}`);
      loadUsers(userPage);
    } else {
      showStatus('error', res.error);
    }
  };

  // Handlers for Teacher assignment
  const handleSaveTeacherAssignment = async (e) => {
    e.preventDefault();
    if (!editingTeacher) return;

    const subjectsArr = teacherAssignForm.subjects
      ? teacherAssignForm.subjects.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const res = await updateTeacherAssignment(editingTeacher.teacherId, {
      className: teacherAssignForm.className,
      section: teacherAssignForm.section,
      subjects: subjectsArr
    });

    if (res.success) {
      showStatus('success', 'Teacher assignment updated successfully');
      setEditingTeacher(null);
      loadTeachers();
    } else {
      showStatus('error', res.error);
    }
  };

  // Handlers for Student assignment
  const handleSaveStudentAssignment = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    const res = await updateStudentAssignment(editingStudent.studentId, {
      className: studentAssignForm.className,
      section: studentAssignForm.section,
      rollNumber: studentAssignForm.rollNumber
    });

    if (res.success) {
      showStatus('success', 'Student assignment updated successfully');
      setEditingStudent(null);
      loadStudents();
    } else {
      showStatus('error', res.error);
    }
  };

  // Handlers for Parent child link
  const handleLinkChild = async (e) => {
    e.preventDefault();
    if (!linkingParent || !linkChildForm.studentId) return;

    const res = await linkParentChild(
      linkingParent.parentId,
      linkChildForm.studentId,
      linkChildForm.relationship
    );

    if (res.success) {
      showStatus('success', res.message || 'Child linked successfully');
      setLinkingParent(null);
      setLinkChildForm({ studentId: '', relationship: 'Child' });
      loadParents();
    } else {
      showStatus('error', res.error);
    }
  };

  const handleUnlinkChild = async (parentId, studentId) => {
    if (!window.confirm('Are you sure you want to unlink this student from the parent?')) return;
    const res = await unlinkParentChild(parentId, studentId);
    if (res.success) {
      showStatus('success', 'Child unlinked successfully');
      loadParents();
    } else {
      showStatus('error', res.error);
    }
  };

  // Handlers for Class & Section
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassForm.name.trim()) return;

    const res = await createAdminClass(newClassForm);
    if (res.success) {
      showStatus('success', 'Class created successfully');
      setClassModalOpen(false);
      setNewClassForm({ name: '', description: '' });
      loadClasses();
    } else {
      showStatus('error', res.error);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    const res = await deleteAdminClass(id);
    if (res.success) {
      showStatus('success', 'Class deleted successfully');
      loadClasses();
    } else {
      showStatus('error', res.error);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSectionForm.classId || !newSectionForm.name.trim()) return;

    const res = await createAdminSection(newSectionForm);
    if (res.success) {
      showStatus('success', 'Section created successfully');
      setSectionModalOpen(false);
      setNewSectionForm({ classId: '', name: '' });
      loadClasses();
    } else {
      showStatus('error', res.error);
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    const res = await deleteAdminSection(id);
    if (res.success) {
      showStatus('success', 'Section deleted successfully');
      loadClasses();
    } else {
      showStatus('error', res.error);
    }
  };

  // Handlers for Subjects
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectForm.name.trim() || !newSubjectForm.code.trim()) return;

    const res = await createAdminSubject(newSubjectForm);
    if (res.success) {
      showStatus('success', 'Subject created successfully');
      setSubjectModalOpen(false);
      setNewSubjectForm({ name: '', code: '', description: '' });
      loadSubjects();
    } else {
      showStatus('error', res.error);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    const res = await deleteAdminSubject(id);
    if (res.success) {
      showStatus('success', 'Subject deleted successfully');
      loadSubjects();
    } else {
      showStatus('error', res.error);
    }
  };

  // Handlers for Tutor Verifications
  const handleVerifyTutor = async (tutorProfileId) => {
    const notes = window.prompt('Enter verification notes (optional):', 'Verified credentials and certificates');
    if (notes === null) return;

    const res = await verifyTutorAdmin(tutorProfileId, notes);
    if (res.success) {
      showStatus('success', 'Tutor verified successfully! Verified badge awarded.');
      loadTutorVerifications();
    } else {
      showStatus('error', res.error || 'Failed to verify tutor');
    }
  };

  const handleRejectTutor = async (tutorProfileId) => {
    const reason = window.prompt('Enter rejection / correction reason for tutor:', 'Incomplete documents or credentials mismatch');
    if (!reason) return;

    const res = await rejectTutorAdmin(tutorProfileId, reason);
    if (res.success) {
      showStatus('success', 'Tutor verification rejected.');
      loadTutorVerifications();
    } else {
      showStatus('error', res.error || 'Failed to reject verification');
    }
  };


  const stats = dashboardData?.stats || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Step 8 • Administrative Governance & Management</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Institutional Admin Center</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Centralized control for accounts, academic rosters, classes, sections, and subjects.
          </p>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'overview') loadDashboard();
            else if (activeTab === 'users') loadUsers(userPage);
            else if (activeTab === 'teachers') loadTeachers();
            else if (activeTab === 'students') {
              loadStudents();
              loadAgeVerificationRequests();
            }
            else if (activeTab === 'parents') loadParents();
            else if (activeTab === 'classes') loadClasses();
            else if (activeTab === 'subjects') loadSubjects();
          }}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between animate-fadeIn text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Layout: Navigation Sidebar + Content View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-2">
          <p className="px-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Navigation</p>

          {[
            { id: 'overview', label: 'Overview Metrics', icon: LayoutDashboard },
            { id: 'users', label: 'User Accounts', icon: Users },
            { id: 'teachers', label: 'Teachers Roster', icon: GraduationCap },
            { id: 'students', label: 'Students Roster', icon: Users },
            { id: 'parents', label: 'Parents & Wards', icon: HeartHandshake },
            { id: 'classes', label: 'Classes', icon: School },
            { id: 'sections', label: 'Sections', icon: School },
            { id: 'subjects', label: 'Course Subjects', icon: BookOpen },
            { id: 'tutors', label: 'Tutor Verifications', icon: ShieldCheck },
            { id: 'analytics', label: 'Analytics', icon: FileSpreadsheet },

            { id: 'notifications', label: 'Notifications', icon: AlertCircle },
            { id: 'settings', label: 'Settings', icon: UserCheck }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = initialTab === item.id ||
              (item.id === 'classes' && initialTab === 'classes') ||
              (item.id === 'sections' && initialTab === 'sections');
            return (
              <button
                key={item.id}
                onClick={() => {
                  setUnsupportedTab(['notifications', 'settings'].includes(item.id) ? item.id : null);
                  const normalizedTab = normalizeTab(item.id);
                  if (normalizedTab) setActiveTab(normalizedTab);
                  if (onNavigate) onNavigate(item.id);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </aside>

        {/* Content View Container */}
        <main className="lg:col-span-9 space-y-6">
          {unsupportedTab ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xs text-center space-y-3">
              <AlertCircle className="w-10 h-10 mx-auto text-indigo-500" />
              <h2 className="text-xl font-black text-slate-900 capitalize">{unsupportedTab}</h2>
              <p className="text-sm text-slate-500">This Admin area is not available in the current module yet.</p>
            </div>
          ) : (
            <>
          
          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {isLoadingDashboard ? (
                <div className="py-20 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">Loading dashboard metrics...</p>
                </div>
              ) : dashboardError ? (
                <div className="py-20 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">{dashboardError}</p>
                  <button
                    onClick={loadDashboard}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900">{stats.totalStudents || 0}</p>
                      <p className="text-xs font-bold text-slate-500">Total Students</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900">{stats.totalTeachers || 0}</p>
                      <p className="text-xs font-bold text-slate-500">Faculty Members</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900">{stats.totalParents || 0}</p>
                      <p className="text-xs font-bold text-slate-500">Registered Parents</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900">{stats.totalUsers || 0}</p>
                      <p className="text-xs font-bold text-slate-500">Total Users</p>
                    </div>
                  </div>

                  {/* Academic Structure Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400">Classes Configured</p>
                        <p className="text-xl font-black text-slate-900">{stats.totalClasses || 0}</p>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <School className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400">Class Sections</p>
                        <p className="text-xl font-black text-slate-900">{stats.totalSections || 0}</p>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <School className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400">Subjects Taught</p>
                        <p className="text-xl font-black text-slate-900">{stats.totalSubjects || 0}</p>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Real-Time Analytics Widgets (Step 9) */}
                  {dashboardData.analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Attendance Health */}
                      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Attendance Health</span>
                          </h4>
                          <span className="text-xs font-black text-emerald-600">
                            {dashboardData.analytics.attendance?.overallRate || 0}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                            <p className="text-slate-500 font-medium">Present</p>
                            <p className="text-sm font-black">{dashboardData.analytics.attendance?.present || 0}</p>
                          </div>
                          <div className="p-2 rounded-xl bg-rose-50 text-rose-800">
                            <p className="text-slate-500 font-medium">Absent</p>
                            <p className="text-sm font-black">{dashboardData.analytics.attendance?.absent || 0}</p>
                          </div>
                          <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
                            <p className="text-slate-500 font-medium">Late</p>
                            <p className="text-sm font-black">{dashboardData.analytics.attendance?.late || 0}</p>
                          </div>
                          <div className="p-2 rounded-xl bg-blue-50 text-blue-800">
                            <p className="text-slate-500 font-medium">Leave</p>
                            <p className="text-sm font-black">{dashboardData.analytics.attendance?.leave || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Homework Engagement */}
                      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                            <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                            <span>Homework Activity</span>
                          </h4>
                          <span className="text-xs font-black text-blue-600">
                            {dashboardData.analytics.homework?.active || 0} active
                          </span>
                        </div>
                        <div className="space-y-2 text-[11px]">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>Total Submissions:</span>
                            <span>{dashboardData.analytics.homework?.totalSubmissions || 0}</span>
                          </div>
                          <div className="flex justify-between font-bold text-emerald-700">
                            <span>On-Time Submissions:</span>
                            <span>{dashboardData.analytics.homework?.onTimeSubmissions || 0}</span>
                          </div>
                          <div className="flex justify-between font-bold text-amber-700">
                            <span>Late Submissions:</span>
                            <span>{dashboardData.analytics.homework?.lateSubmissions || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Grade Distribution */}
                      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                            <Award className="w-3.5 h-3.5 text-purple-600" />
                            <span>Grade Distribution</span>
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map((grade) => (
                            <span
                              key={grade}
                              className="px-2 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg text-[10px] font-bold"
                            >
                              {grade}: {dashboardData.analytics.marks?.gradeDistribution?.[grade] || 0}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Registrations Table */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-black text-slate-900">Recent User Registrations</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                          <tr>
                            <th className="pb-3">Name</th>
                            <th className="pb-3">Email</th>
                            <th className="pb-3">Role</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3">Registered</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {(dashboardData.recentUsers || []).map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="py-3 font-bold text-slate-900">{u.name}</td>
                              <td className="py-3 text-slate-500">{u.email}</td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {u.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3 text-slate-400">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: USERS DIRECTORY */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">User Accounts Directory</h3>
                  <p className="text-xs text-slate-500">Manage all registered stakeholders and account access status.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadUsers(1)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-indigo-600 w-full sm:w-48"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setTimeout(() => loadUsers(1), 50);
                    }}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-indigo-600"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="parent">Parents</option>
                    <option value="admin">Admins</option>
                  </select>

                  <button
                    onClick={() => loadUsers(1)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Table */}
              {isLoadingUsers ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                </div>
              ) : users.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-900">{u.name}</td>
                          <td className="py-3 text-slate-500">{u.email}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                u.isActive
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {userTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Page {userPage} of {userTotalPages} ({userTotal} total)</span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={userPage <= 1}
                      onClick={() => loadUsers(userPage - 1)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg font-bold"
                    >
                      Prev
                    </button>
                    <button
                      disabled={userPage >= userTotalPages}
                      onClick={() => loadUsers(userPage + 1)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg font-bold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEACHERS ROSTER */}
          {activeTab === 'teachers' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Faculty & Class Assignments</h3>
                  <p className="text-xs text-slate-500">Assign teachers to classes, sections, and curriculum subjects.</p>
                </div>
              </div>

              {isLoadingTeachers ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                </div>
              ) : teachers.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <GraduationCap className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No teachers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="pb-3">Teacher ID</th>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Class & Section</th>
                        <th className="pb-3">Subjects</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {teachers.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono font-bold text-indigo-600">{t.teacherId}</td>
                          <td className="py-3 font-bold text-slate-900">{t.name}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                              {t.className || 'Unassigned'} - Sec {t.section || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {(t.subjects || []).map((s, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setEditingTeacher(t);
                                setTeacherAssignForm({
                                  className: t.className || '',
                                  section: t.section || '',
                                  subjects: Array.isArray(t.subjects) ? t.subjects.join(', ') : ''
                                });
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center space-x-1 ml-auto"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Assign</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STUDENTS ROSTER */}
          {activeTab === 'students' && (
            <div className="space-y-6 animate-fadeIn">
              <section className="bg-white rounded-3xl p-6 border border-amber-200 shadow-xs space-y-5">
                <div>
                  <h3 className="text-base font-black text-slate-900">Student Age-Eligibility Review</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Review age evidence independently before verifying. EduSetu does not collect or retain identity documents; approval records the verified DOB, reviewer, and time.
                  </p>
                </div>
                {isLoadingAgeVerifications ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                  </div>
                ) : ageVerificationRequests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                    No student age-verification requests are pending.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ageVerificationRequests.map(student => (
                      <article key={student.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs">
                          <p className="font-bold text-slate-900">{student.name} <span className="font-mono font-normal text-slate-500">({student.studentId})</span></p>
                          <p className="mt-1 text-slate-600">Submitted DOB: <span className="font-semibold">{student.dateOfBirth || 'Missing'}</span> · {student.className || 'No class listed'}</p>
                          <p className="mt-1 text-[10px] text-amber-800">Only approve after checking reliable age evidence outside this application.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={savingAgeVerificationId === student.id}
                            onClick={() => handleAgeVerificationReview(student, 'verified')}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"
                          >
                            Verify age
                          </button>
                          <button
                            type="button"
                            disabled={savingAgeVerificationId === student.id}
                            onClick={() => handleAgeVerificationReview(student, 'rejected')}
                            className="rounded-xl bg-rose-100 px-3 py-2 text-[11px] font-bold text-rose-800 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Student Directory & Class Placements</h3>
                <p className="text-xs text-slate-500">Assign student enrollment classes, sections, and roll numbers.</p>
              </div>

              {isLoadingStudents ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                </div>
              ) : students.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No students found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="pb-3">Student ID</th>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Class & Section</th>
                        <th className="pb-3">Roll No</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {students.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono font-bold text-blue-600">{s.studentId}</td>
                          <td className="py-3 font-bold text-slate-900">{s.name}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold">
                              {s.className || 'Unassigned'} - Sec {s.section || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-bold text-slate-600">{s.rollNumber || 'N/A'}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setEditingStudent(s);
                                setStudentAssignForm({
                                  className: s.className || '',
                                  section: s.section || '',
                                  rollNumber: s.rollNumber || ''
                                });
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold flex items-center space-x-1 ml-auto"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Assign</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </section>
            </div>
          )}

          {/* TAB 5: PARENTS & WARDS */}
          {activeTab === 'parents' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base font-black text-slate-900">Parent Accounts & Linked Wards</h3>
                <p className="text-xs text-slate-500">Manage parent profiles and link/unlink student dependents.</p>
              </div>

              {isLoadingParents ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                </div>
              ) : parents.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <HeartHandshake className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No parents found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="pb-3">Parent ID</th>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Linked Wards</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {parents.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono font-bold text-emerald-600">{p.parentId}</td>
                          <td className="py-3 font-bold text-slate-900">
                            {p.name}
                            <span className="block text-[10px] text-slate-400 font-normal">{p.relationship}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {p.children && p.children.length > 0 ? (
                                p.children.map((c, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center space-x-1"
                                  >
                                    <span>{c.name} ({c.className}-{c.section})</span>
                                    <button
                                      onClick={() => handleUnlinkChild(p.parentId, c.studentId)}
                                      className="text-slate-400 hover:text-rose-600 ml-1"
                                      title="Unlink ward"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No wards linked</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setLinkingParent(p);
                                setLinkChildForm({ studentId: '', relationship: 'Child' });
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold flex items-center space-x-1 ml-auto"
                            >
                              <Link className="w-3 h-3" />
                              <span>Link Child</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CLASSES & SECTIONS */}
          {activeTab === 'classes' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Academic Classes & Sections</h3>
                  <p className="text-xs text-slate-500">Configure grade levels and corresponding classroom sections.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setClassModalOpen(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Class</span>
                  </button>

                  <button
                    onClick={() => setSectionModalOpen(true)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Section</span>
                  </button>
                </div>
              </div>

              {isLoadingClasses ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                </div>
              ) : classes.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <School className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No classes configured</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {classes.map((cls) => (
                    <div key={cls.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{cls.name}</h4>
                          <p className="text-xs text-slate-500">{cls.description || 'Standard Grade Level'}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Sections List */}
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Sections</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cls.sections && cls.sections.length > 0 ? (
                            cls.sections.map((sec) => (
                              <span
                                key={sec.id}
                                className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1"
                              >
                                <span>Sec {sec.name}</span>
                                <button
                                  onClick={() => handleDeleteSection(sec.id)}
                                  className="text-slate-400 hover:text-rose-600 ml-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No sections created</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SUBJECTS */}
          {activeTab === 'subjects' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Curriculum Subjects</h3>
                  <p className="text-xs text-slate-500">Manage institutional academic courses and course codes.</p>
                </div>

                <button
                  onClick={() => setSubjectModalOpen(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>

              {isLoadingSubjects ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                </div>
              ) : subjects.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No subjects configured</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="pb-3">Subject Code</th>
                        <th className="pb-3">Subject Name</th>
                        <th className="pb-3">Description</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {subjects.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono font-bold text-purple-700">{sub.code}</td>
                          <td className="py-3 font-bold text-slate-900">{sub.name}</td>
                          <td className="py-3 text-slate-500">{sub.description || 'Core Subject'}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteSubject(sub.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded ml-auto"
                              title="Delete subject"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: TUTOR VERIFICATIONS */}
          {activeTab === 'tutors' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Tutor Verification & Credential Audits</h3>
                  <p className="text-xs text-slate-500">
                    Review uploaded diplomas, degrees, CVs, and qualifications to issue verified educator badges.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                  {[
                    { id: 'pending_verification', label: 'Pending' },
                    { id: 'verified', label: 'Verified' },
                    { id: 'rejected', label: 'Rejected' },
                    { id: 'all', label: 'All Tutors' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setTutorStatusFilter(st.id);
                        loadTutorVerifications(st.id);
                      }}
                      className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                        tutorStatusFilter === st.id ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingTutors ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                </div>
              ) : tutorVerifications.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No tutor verifications found</p>
                  <p className="text-[11px] text-slate-400">No tutor submissions match the selected status.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tutorVerifications.map((tutor) => (
                    <div
                      key={tutor.id}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                            {tutor.user?.name?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-slate-900">{tutor.user?.name || 'Tutor User'}</span>
                              <span className="text-[11px] text-slate-500 font-mono">({tutor.user?.email})</span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-1">{tutor.headline || 'Educator'}</p>
                          </div>
                        </div>

                        <div>
                          {tutor.verificationStatus === 'verified' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                              ✓ Verified
                            </span>
                          )}
                          {tutor.verificationStatus === 'pending_verification' && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                              Pending Review
                            </span>
                          )}
                          {tutor.verificationStatus === 'rejected' && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                              Rejected
                            </span>
                          )}
                          {tutor.verificationStatus === 'draft' && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Credentials Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-slate-100">
                          <span className="text-slate-400 block">Degree & Qualifications</span>
                          <span className="font-bold text-slate-800">{tutor.degree || tutor.qualifications || 'Not provided'}</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-100">
                          <span className="text-slate-400 block">University</span>
                          <span className="font-bold text-slate-800">{tutor.university || 'Not provided'}</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-100">
                          <span className="text-slate-400 block">Experience & Location</span>
                          <span className="font-bold text-slate-800">
                            {tutor.experienceYears}y exp • {[tutor.area, tutor.city].filter(Boolean).join(', ') || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Documents Strip */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {tutor.resumeUrl ? (
                          <a
                            href={tutor.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Submitted CV / Resume</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">No CV link attached</span>
                        )}

                        {Array.isArray(tutor.certificateUrls) && tutor.certificateUrls.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span className="text-slate-500 font-semibold">Certificates:</span>
                            {tutor.certificateUrls.map((cUrl, cIdx) => (
                              <a
                                key={cIdx}
                                href={cUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-indigo-600 hover:bg-slate-50"
                              >
                                Doc #{cIdx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Feedback Notes if any */}
                      {tutor.verificationNotes && (
                        <div className="text-xs bg-white p-2.5 rounded-xl border border-slate-100 text-slate-600">
                          <span className="font-bold">Audit Note: </span>
                          {tutor.verificationNotes}
                        </div>
                      )}

                      {/* Admin Actions */}
                      <div className="flex items-center justify-end space-x-2 pt-2">
                        {tutor.verificationStatus !== 'rejected' && (
                          <button
                            onClick={() => handleRejectTutor(tutor.id)}
                            className="px-3.5 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                          >
                            Reject Verification
                          </button>
                        )}
                        {tutor.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => handleVerifyTutor(tutor.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                          >
                            Approve & Verify Badge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </>
          )}

        </main>
      </div>

      {/* MODAL 1: TEACHER ASSIGNMENT */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900">Assign Teacher: {editingTeacher.name}</h4>
              <button onClick={() => setEditingTeacher(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacherAssignment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Assigned Class</label>
                <input
                  type="text"
                  placeholder="e.g. Class 10"
                  value={teacherAssignForm.className}
                  onChange={(e) => setTeacherAssignForm({ ...teacherAssignForm, className: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Assigned Section</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  value={teacherAssignForm.section}
                  onChange={(e) => setTeacherAssignForm({ ...teacherAssignForm, section: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Subjects (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics, Physics"
                  value={teacherAssignForm.subjects}
                  onChange={(e) => setTeacherAssignForm({ ...teacherAssignForm, subjects: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STUDENT ASSIGNMENT */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900">Assign Student: {editingStudent.name}</h4>
              <button onClick={() => setEditingStudent(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentAssignment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Class</label>
                <input
                  type="text"
                  placeholder="e.g. Class 10"
                  value={studentAssignForm.className}
                  onChange={(e) => setStudentAssignForm({ ...studentAssignForm, className: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Section</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  value={studentAssignForm.section}
                  onChange={(e) => setStudentAssignForm({ ...studentAssignForm, section: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Roll Number</label>
                <input
                  type="text"
                  placeholder="e.g. 24"
                  value={studentAssignForm.rollNumber}
                  onChange={(e) => setStudentAssignForm({ ...studentAssignForm, rollNumber: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-blue-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LINK CHILD TO PARENT */}
      {linkingParent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900">Link Child to {linkingParent.name}</h4>
              <button onClick={() => setLinkingParent(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLinkChild} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Student ID</label>
                <input
                  type="text"
                  placeholder="e.g. STU001... or numeric ID"
                  required
                  value={linkChildForm.studentId}
                  onChange={(e) => setLinkChildForm({ ...linkChildForm, studentId: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Son, Daughter, Ward"
                  value={linkChildForm.relationship}
                  onChange={(e) => setLinkChildForm({ ...linkChildForm, relationship: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-emerald-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLinkingParent(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Link Ward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD CLASS */}
      {classModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900">Create Academic Class</h4>
              <button onClick={() => setClassModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Class Name</label>
                <input
                  type="text"
                  placeholder="e.g. Grade 10 or B.Tech CSE"
                  required
                  value={newClassForm.name}
                  onChange={(e) => setNewClassForm({ ...newClassForm, name: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Secondary Academic Batch"
                  value={newClassForm.description}
                  onChange={(e) => setNewClassForm({ ...newClassForm, description: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClassModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD SECTION */}
      {sectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900">Add Class Section</h4>
              <button onClick={() => setSectionModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Select Class</label>
                <select
                  required
                  value={newSectionForm.classId}
                  onChange={(e) => setNewSectionForm({ ...newSectionForm, classId: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-teal-600 bg-white font-medium"
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Section Name</label>
                <input
                  type="text"
                  placeholder="e.g. A, B, or C"
                  required
                  value={newSectionForm.name}
                  onChange={(e) => setNewSectionForm({ ...newSectionForm, name: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-teal-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSectionModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD SUBJECT */}
      {subjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900">Add Course Subject</h4>
              <button onClick={() => setSubjectModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Mathematics"
                  required
                  value={newSubjectForm.name}
                  onChange={(e) => setNewSubjectForm({ ...newSubjectForm, name: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Subject Code (Unique)</label>
                <input
                  type="text"
                  placeholder="e.g. MATH101"
                  required
                  value={newSubjectForm.code}
                  onChange={(e) => setNewSubjectForm({ ...newSubjectForm, code: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-purple-600 uppercase font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Core STEM Subject"
                  value={newSubjectForm.description}
                  onChange={(e) => setNewSubjectForm({ ...newSubjectForm, description: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-purple-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
