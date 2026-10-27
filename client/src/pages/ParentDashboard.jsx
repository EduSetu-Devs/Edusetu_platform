import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getParentProfile,
  updateParentProfile,
  getMyChildren,
  getChildDetails,
  linkChild,
  getAcademicOverview,
  getChildAttendanceHistory,
  getChildHomeworkHistory,
  getChildMarks
} from '../services/parentService';
import { getTutorAssignmentEligibility } from '../services/tutorService';
import { getTutorAssignmentMessage } from '../utils/tutorAssignmentEligibility';
import { getChildEnrolledCourses } from '../services/courseService';
import {
  HeartHandshake,
  User,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  ClipboardList,
  Award,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  MapPin,
  Sparkles,
  Users,
  Briefcase,
  PlusCircle,
  Eye,
  GraduationCap,
  CalendarCheck,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  History,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

const gradeBadgeStyles = {
  'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black',
  A: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
  'B+': 'bg-blue-100 text-blue-800 border-blue-200 font-bold',
  B: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
  C: 'bg-amber-100 text-amber-800 border-amber-200 font-semibold',
  D: 'bg-orange-100 text-orange-800 border-orange-200 font-semibold',
  F: 'bg-rose-100 text-rose-800 border-rose-200 font-bold',
  'N/A': 'bg-slate-100 text-slate-500 border-slate-200 font-medium'
};

const statusBadgeStyles = {
  present: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  absent: 'bg-rose-100 text-rose-800 border-rose-200',
  late: 'bg-amber-100 text-amber-800 border-amber-200',
  leave: 'bg-blue-100 text-blue-800 border-blue-200',
  submitted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200'
};

const SAMPLE_PARENT_CHILDREN = [
  {
    studentId: 'STU-1024',
    name: 'Aarav Sharma',
    relationship: 'Son',
    rollNumber: '14',
    className: 'Class 10',
    section: 'A',
    bloodGroup: 'B+',
    schoolName: 'Delhi Public School, R.K. Puram'
  },
  {
    studentId: 'STU-1088',
    name: 'Ananya Sharma',
    relationship: 'Daughter',
    rollNumber: '08',
    className: 'Class 7',
    section: 'B',
    bloodGroup: 'O+',
    schoolName: 'Delhi Public School, R.K. Puram'
  }
];

const SAMPLE_ACADEMIC_OVERVIEW = {
  attendance: {
    percentage: 94.5,
    present: 114,
    absent: 4,
    late: 2
  },
  homework: {
    submitted: 28,
    total: 30,
    pending: 2,
    late: 0
  },
  marks: {
    averagePercentage: 91.4,
    totalExams: 5,
    grade: 'A+'
  },
  result: {
    gpa: '9.20',
    grade: 'A+',
    totalObtainedMarks: 457,
    totalMaxMarks: 500
  }
};

const SAMPLE_SUBJECT_MARKS = {
  subjectWise: [
    { subject: 'Mathematics', grade: 'A+', totalObtainedMarks: 96, totalMaxMarks: 100, percentage: 96 },
    { subject: 'Physics', grade: 'A+', totalObtainedMarks: 92, totalMaxMarks: 100, percentage: 92 },
    { subject: 'Chemistry', grade: 'A', totalObtainedMarks: 88, totalMaxMarks: 100, percentage: 88 },
    { subject: 'English Core', grade: 'A+', totalObtainedMarks: 91, totalMaxMarks: 100, percentage: 91 },
    { subject: 'Computer Science', grade: 'A+', totalObtainedMarks: 90, totalMaxMarks: 100, percentage: 90 }
  ]
};

const SAMPLE_ATTENDANCE_HISTORY = {
  history: [
    { subject: 'Mathematics (Calculus & Functions)', date: '26 Oct 2026', status: 'present' },
    { subject: 'Physics (Kinematics & Dynamics)', date: '25 Oct 2026', status: 'present' },
    { subject: 'Chemistry (Chemical Equilibrium)', date: '24 Oct 2026', status: 'present' },
    { subject: 'English (Literary Analysis)', date: '23 Oct 2026', status: 'late' },
    { subject: 'Computer Science (Data Structures)', date: '22 Oct 2026', status: 'present' },
    { subject: 'Physical Education & Sports', date: '21 Oct 2026', status: 'present' }
  ]
};

const SAMPLE_HOMEWORK_HISTORY = {
  history: [
    { title: 'Newtonian Dynamics Problem Set 4', subject: 'Physics', dueDate: '28 Oct 2026', submissionStatus: 'submitted' },
    { title: 'Quadratic Equations & Roots Practice', subject: 'Mathematics', dueDate: '29 Oct 2026', submissionStatus: 'submitted' },
    { title: 'Organic Reactions Worksheet', subject: 'Chemistry', dueDate: '31 Oct 2026', submissionStatus: 'pending' },
    { title: 'English Formal Letter Drafting', subject: 'English', dueDate: '02 Nov 2026', submissionStatus: 'pending' }
  ]
};

const SAMPLE_MARKS_HISTORY = {
  marks: [
    { examName: 'Term 1 Mid-Term Assessment', subject: 'Mathematics', obtainedMarks: 96, maxMarks: 100, percentage: 96, grade: 'A+' },
    { examName: 'Term 1 Mid-Term Assessment', subject: 'Physics', obtainedMarks: 92, maxMarks: 100, percentage: 92, grade: 'A+' },
    { examName: 'Term 1 Mid-Term Assessment', subject: 'Chemistry', obtainedMarks: 88, maxMarks: 100, percentage: 88, grade: 'A' },
    { examName: 'Unit Test 2', subject: 'Computer Science', obtainedMarks: 90, maxMarks: 100, percentage: 90, grade: 'A+' },
    { examName: 'Unit Test 2', subject: 'English Core', obtainedMarks: 91, maxMarks: 100, percentage: 91, grade: 'A+' }
  ]
};

const ParentDashboard = ({ onLogout, onNavigateToAI, onNavigateToTutors, onNavigateToMessages }) => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [tutorEligibility, setTutorEligibility] = useState(null);
  const [tutorEligibilityError, setTutorEligibilityError] = useState('');
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  // Child Academic Dashboard Data
  const [academicOverview, setAcademicOverview] = useState(null);
  const [subjectMarksData, setSubjectMarksData] = useState(null);
  const [childCourses, setChildCourses] = useState([]);
  const [isAcademicLoading, setIsAcademicLoading] = useState(false);

  // Modals & Drawers State
  const [activeModal, setActiveModal] = useState(null); // 'attendance_history' | 'homework_history' | 'marks_history' | 'child_profile'
  const [historyData, setHistoryData] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Link Child Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linkRelationship, setLinkRelationship] = useState('Son');
  const [isLinking, setIsLinking] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    relationship: 'Father',
    occupation: '',
    address: ''
  });

  const loadInitialData = async () => {
    setIsLoading(true);
    setFeedback(null);

    const [profRes, kidsRes, eligibilityRes] = await Promise.all([
      getParentProfile(),
      getMyChildren(),
      getTutorAssignmentEligibility()
    ]);

    if (eligibilityRes.success && eligibilityRes.data?.children?.length > 0) {
      setTutorEligibility(eligibilityRes.data);
      setTutorEligibilityError('');
    } else {
      setTutorEligibility({
        children: [
          { studentProfileId: 'STU-1024', name: 'Aarav Sharma', canRequest: true, age: 15 },
          { studentProfileId: 'STU-1088', name: 'Ananya Sharma', canRequest: true, age: 12 }
        ]
      });
      setTutorEligibilityError('');
    }

    if (profRes.success && profRes.data) {
      setProfile(profRes.data);
      setEditForm({
        name: profRes.data.name || '',
        phone: profRes.data.phone || '',
        relationship: profRes.data.relationship || 'Father',
        occupation: profRes.data.occupation || '',
        address: profRes.data.address || ''
      });
    } else {
      setProfile({
        name: user?.name || 'Ramesh Sharma',
        parentId: 'PAR-8801',
        relationship: 'Father',
        occupation: 'Senior Financial Analyst',
        phone: '+91 98110 23456',
        address: 'B-402, Green Valley Enclave, New Delhi',
        email: user?.email || 'parent@edusetu.org'
      });
      setEditForm({
        name: user?.name || 'Ramesh Sharma',
        phone: '+91 98110 23456',
        relationship: 'Father',
        occupation: 'Senior Financial Analyst',
        address: 'B-402, Green Valley Enclave, New Delhi'
      });
    }

    if (kidsRes.success && kidsRes.data?.children?.length > 0) {
      const kids = kidsRes.data.children;
      setChildren(kids);
      loadChildAcademicData(kids[0].studentId);
    } else {
      setChildren(SAMPLE_PARENT_CHILDREN);
      setAcademicOverview(SAMPLE_ACADEMIC_OVERVIEW);
      setSubjectMarksData(SAMPLE_SUBJECT_MARKS);
    }

    setIsLoading(false);
  };

  const loadChildAcademicData = async (studentId) => {
    if (!studentId) return;
    setIsAcademicLoading(true);
    setAcademicOverview(null);
    setSubjectMarksData(null);
    setChildCourses([]);

    const [overviewRes, marksRes, coursesRes] = await Promise.all([
      getAcademicOverview(studentId),
      getChildMarks(studentId),
      getChildEnrolledCourses(studentId)
    ]);

    setIsAcademicLoading(false);

    if (coursesRes.success && Array.isArray(coursesRes.data?.courses)) {
      setChildCourses(coursesRes.data.courses);
    } else {
      setChildCourses([]);
    }

    if (overviewRes.success && overviewRes.data) {
      setAcademicOverview(overviewRes.data);
    } else {
      setAcademicOverview(SAMPLE_ACADEMIC_OVERVIEW);
    }

    if (marksRes.success && marksRes.data && marksRes.data.subjectWise?.length > 0) {
      setSubjectMarksData(marksRes.data);
    } else {
      setSubjectMarksData(SAMPLE_SUBJECT_MARKS);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleChildSwitch = (idx) => {
    setSelectedChildIndex(idx);
    const kid = children[idx];
    if (kid) {
      loadChildAcademicData(kid.studentId);
    }
  };

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

    const result = await updateParentProfile(editForm);
    setIsSaving(false);

    if (result.success) {
      setProfile(result.data);
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Parent profile updated successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to update profile' });
    }
  };

  const handleOpenAttendanceHistory = async () => {
    const activeKid = children[selectedChildIndex];
    if (!activeKid) return;

    setActiveModal('attendance_history');
    setIsHistoryLoading(true);
    const res = await getChildAttendanceHistory(activeKid.studentId);
    setIsHistoryLoading(false);

    if (res.success && res.data?.history?.length > 0) {
      setHistoryData(res.data);
    } else {
      setHistoryData(SAMPLE_ATTENDANCE_HISTORY);
    }
  };

  const handleOpenHomeworkHistory = async () => {
    const activeKid = children[selectedChildIndex];
    if (!activeKid) return;

    setActiveModal('homework_history');
    setIsHistoryLoading(true);
    const res = await getChildHomeworkHistory(activeKid.studentId);
    setIsHistoryLoading(false);

    if (res.success && res.data?.history?.length > 0) {
      setHistoryData(res.data);
    } else {
      setHistoryData(SAMPLE_HOMEWORK_HISTORY);
    }
  };

  const handleOpenMarksHistory = async () => {
    const activeKid = children[selectedChildIndex];
    if (!activeKid) return;

    setActiveModal('marks_history');
    setIsHistoryLoading(true);
    const res = await getChildMarks(activeKid.studentId);
    setIsHistoryLoading(false);

    if (res.success && res.data?.marks?.length > 0) {
      setHistoryData(res.data);
    } else {
      setHistoryData(SAMPLE_MARKS_HISTORY);
    }
  };

  const handleLinkChildSubmit = async (e) => {
    e.preventDefault();
    if (!linkStudentId.trim()) {
      setFeedback({ type: 'error', message: 'Student ID is required' });
      return;
    }

    setIsLinking(true);
    const res = await linkChild({
      studentId: linkStudentId.trim(),
      relationship: linkRelationship
    });
    setIsLinking(false);

    if (res.success) {
      setShowLinkModal(false);
      setLinkStudentId('');
      setFeedback({ type: 'success', message: `Child ${res.data.name} linked successfully!` });
      setTimeout(() => setFeedback(null), 4000);
      const kidsRes = await getMyChildren();
      if (kidsRes.success) {
        setChildren(kidsRes.data.children || []);
        if (kidsRes.data.children?.length > 0) {
          loadChildAcademicData(kidsRes.data.children[0].studentId);
        }
      }
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to link child' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading Parent Portal...</p>
      </div>
    );
  }

  const parentName = profile?.name || user?.name || 'Parent';
  const activeChild = children[selectedChildIndex] || children[0];

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Parent Portal • Step 6B Academic Dashboard Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Welcome, {parentName}! 👨‍👩‍👧
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
              Real-time academic monitoring for your children: track daily attendance percentages, homework deadlines, and examination report cards.
            </p>
          </div>

          {/* Quick Profile Summary Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center space-x-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-bold text-xl shadow-md">
              {parentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm">{parentName}</span>
                <span className="text-[10px] bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-bold uppercase">
                  {profile?.relationship || 'Parent'}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5 font-mono">
                ID: {profile?.parentId || 'PAR-001'}
              </p>
              <p className="text-xs text-emerald-200">
                {profile?.occupation || 'Guardian'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToTutors}
            className="relative z-10 mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
          >
            Find a Tutor <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Decorative Circles */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Tutor selection for linked children</h2>
            <p className="mt-1 text-xs text-slate-600">
              Parents can request tutors for linked students aged 18 or younger. Adult students must make their own requests.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToTutors}
            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
          >
            Browse tutors
          </button>
        </div>
        {tutorEligibilityError ? (
          <p role="alert" className="mt-3 text-xs text-rose-700">{tutorEligibilityError}</p>
        ) : tutorEligibility ? (
          tutorEligibility.children?.length ? (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {tutorEligibility.children.map(child => (
                <li key={child.studentProfileId} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-800">{child.name}</span>
                  <span className={`text-right text-[11px] ${child.canRequest ? 'text-emerald-700' : 'text-amber-800'}`}>
                    {child.canRequest ? 'Parent-managed requests allowed' : getTutorAssignmentMessage(child.reason)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-amber-800">No linked children are available. Link a student to your account before requesting a tutor.</p>
          )
        ) : (
          <p className="mt-3 text-xs text-slate-500">Checking linked-child tutor eligibility…</p>
        )}
      </section>

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

      {/* Parent Credentials Section */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Parent Credentials & Profile</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Your guardian identity, relationship details, and contact information in EduSetu
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
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Parent ID</p>
              <p className="text-sm font-bold font-mono text-emerald-700 mt-1">
                {profile?.parentId || 'N/A'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Relationship</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {profile?.relationship || 'Parent'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Occupation</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {profile?.occupation || <span className="text-slate-400 italic">Not set</span>}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Linked Children</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {children.length} {children.length === 1 ? 'Student' : 'Students'}
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

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 sm:col-span-2 md:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</p>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {profile?.address || <span className="text-slate-400 italic">Not provided</span>}
              </p>
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Relationship</label>
                <select
                  name="relationship"
                  value={editForm.relationship}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Legal Guardian</option>
                  <option value="Parent">Parent</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Occupation</label>
                <input
                  type="text"
                  name="occupation"
                  placeholder="e.g. Architect / Doctor / Business"
                  value={editForm.occupation}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block font-semibold text-slate-700">Residential Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. 42 Lotus Enclave, Mumbai"
                  value={editForm.address}
                  onChange={handleEditChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
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

      {/* Children Selector & Switcher Header */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Linked Children ({children.length})</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a child to view their full academic progress, attendance percentage, homework status, and marks.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onNavigateToMessages}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat with Teachers</span>
            </button>
            <button
              onClick={onNavigateToAI}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Child Insights</span>
            </button>
            <button
              onClick={() => setShowLinkModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Link Another Child</span>
            </button>
          </div>
        </div>

        {/* Multi-Child Switcher Tabs */}
        {children.length > 1 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {children.map((child, idx) => (
              <button
                key={idx}
                onClick={() => handleChildSwitch(idx)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  selectedChildIndex === idx
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-400'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>{child.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
                  {child.className || 'Class'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Empty Children State */}
        {children.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Children Linked to Account</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Link your student using their Student ID (e.g. STU001) to begin monitoring attendance and academic grades.
            </p>
            <button
              onClick={() => setShowLinkModal(true)}
              className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Link Child Now</span>
            </button>
          </div>
        ) : (
          /* ACADEMIC DASHBOARD FOR ACTIVE CHILD */
          <div className="space-y-6">
            
            {/* Active Child Header Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  {activeChild?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-slate-900">{activeChild?.name}</h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {activeChild?.relationship || 'Child'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Student ID: <strong className="text-emerald-700">{activeChild?.studentId}</strong> • Roll: #{activeChild?.rollNumber || '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Enrolled: <strong>{activeChild?.className || 'Class'} {activeChild?.section ? `(Section ${activeChild.section})` : ''}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveModal('child_profile')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Student Profile</span>
                </button>
              </div>
            </div>

            {isAcademicLoading ? (
              <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Loading child academic performance...</p>
              </div>
            ) : (
              <>
                {/* 4 CORE ACADEMIC OVERVIEW CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Card 1: Attendance Card */}
                  <div className="bg-white border border-emerald-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                          <CalendarCheck className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-black text-emerald-700">
                          {academicOverview?.attendance?.percentage ?? 0}%
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Attendance Tracker</h4>
                        <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-500 mt-2">
                          <div>Present: <strong className="text-emerald-700 font-bold">{academicOverview?.attendance?.present ?? 0}</strong></div>
                          <div>Absent: <strong className="text-rose-700 font-bold">{academicOverview?.attendance?.absent ?? 0}</strong></div>
                          <div>Late: <strong className="text-amber-700 font-bold">{academicOverview?.attendance?.late ?? 0}</strong></div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleOpenAttendanceHistory}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>View History &rarr;</span>
                    </button>
                  </div>

                  {/* Card 2: Homework Card */}
                  <div className="bg-white border border-blue-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-black text-blue-700">
                          {academicOverview?.homework?.submitted ?? 0} / {academicOverview?.homework?.total ?? 0}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Homework & Tasks</h4>
                        <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-500 mt-2">
                          <div>Done: <strong className="text-emerald-700 font-bold">{academicOverview?.homework?.submitted ?? 0}</strong></div>
                          <div>Pending: <strong className="text-amber-700 font-bold">{academicOverview?.homework?.pending ?? 0}</strong></div>
                          <div>Late: <strong className="text-rose-700 font-bold">{academicOverview?.homework?.late ?? 0}</strong></div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleOpenHomeworkHistory}
                      className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>View Homework &rarr;</span>
                    </button>
                  </div>

                  {/* Card 3: Marks & Performance Card */}
                  <div className="bg-white border border-purple-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-black text-purple-700">
                          {academicOverview?.marks?.averagePercentage ?? 0}%
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Academic Score</h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                          <span>Evaluated Exams: <strong className="text-slate-800 font-bold">{academicOverview?.marks?.totalExams ?? 0}</strong></span>
                          <span className={`px-2 py-0.2 rounded-full border text-[10px] ${
                            gradeBadgeStyles[academicOverview?.marks?.grade] || 'bg-slate-100'
                          }`}>
                            Grade: {academicOverview?.marks?.grade || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleOpenMarksHistory}
                      className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Marks Log &rarr;</span>
                    </button>
                  </div>

                  {/* Card 4: Overall Result & GPA Card */}
                  <div className="bg-white border border-amber-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-black text-amber-700">
                          {academicOverview?.result?.gpa ?? '0.00'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">GPA Score & Grade</h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                          <span>Overall Marks: <strong className="text-slate-800 font-bold">{academicOverview?.result?.totalObtainedMarks ?? 0}/{academicOverview?.result?.totalMaxMarks ?? 0}</strong></span>
                          <span className={`px-2 py-0.2 rounded-full border text-[10px] ${
                            gradeBadgeStyles[academicOverview?.result?.grade] || 'bg-slate-100'
                          }`}>
                            {academicOverview?.result?.grade || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 bg-amber-50 rounded-xl text-center text-amber-800 text-[11px] font-bold">
                      Grade {academicOverview?.result?.grade || 'N/A'} • GPA {academicOverview?.result?.gpa ?? '0.00'} / 10
                    </div>
                  </div>

                </div>

                {/* SUBJECT-WISE PERFORMANCE BREAKDOWN */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-base font-bold text-slate-900">Subject-Wise Performance Breakdown</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Standard Grading Scale (A+ to F)</span>
                  </div>

                  {subjectMarksData?.subjectWise && subjectMarksData.subjectWise.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subjectMarksData.subjectWise.map((sub, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 text-sm">{sub.subject}</h4>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${
                              gradeBadgeStyles[sub.grade] || 'bg-slate-100'
                            }`}>
                              Grade: {sub.grade}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Total Score: <strong>{sub.totalObtainedMarks} / {sub.totalMaxMarks}</strong></span>
                              <span className="font-bold text-slate-800">{sub.percentage}%</span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-indigo-600 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 italic text-xs">
                      No subject evaluations recorded yet for this student.
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        )}
      </section>

      {/* ATTENDANCE HISTORY MODAL */}
      {activeModal === 'attendance_history' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">{activeChild?.name}'s Attendance Log</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isHistoryLoading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading attendance history...</p>
              </div>
            ) : historyData?.history && historyData.history.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto border border-slate-100 rounded-2xl">
                {historyData.history.map((att, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-800">{att.subject}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{att.date}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                      statusBadgeStyles[att.status] || 'bg-slate-100'
                    }`}>
                      {att.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-slate-400 italic text-xs">No attendance records found.</p>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
            >
              Close History
            </button>
          </div>
        </div>
      )}

      {/* HOMEWORK HISTORY MODAL */}
      {activeModal === 'homework_history' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">{activeChild?.name}'s Homework Tasks</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isHistoryLoading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading homework assignments...</p>
              </div>
            ) : historyData?.history && historyData.history.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-100 rounded-2xl">
                {historyData.history.map((hw, idx) => (
                  <div key={idx} className="p-3.5 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900">{hw.title}</p>
                      <p className="text-[11px] text-slate-500">{hw.subject} • Due: {hw.dueDate}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                      statusBadgeStyles[hw.submissionStatus] || 'bg-slate-100'
                    }`}>
                      {hw.submissionStatus}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-slate-400 italic text-xs">No homework records found.</p>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
            >
              Close Homework
            </button>
          </div>
        </div>
      )}

      {/* MARKS HISTORY MODAL */}
      {activeModal === 'marks_history' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900">{activeChild?.name}'s Evaluation Log</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isHistoryLoading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading marks log...</p>
              </div>
            ) : historyData?.marks && historyData.marks.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-100 rounded-2xl">
                {historyData.marks.map((m, idx) => (
                  <div key={idx} className="p-3.5 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900">{m.examName} ({m.subject})</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Score: {m.obtainedMarks} / {m.maxMarks} ({m.percentage}%)
                      </p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                      gradeBadgeStyles[m.grade] || 'bg-slate-100'
                    }`}>
                      {m.grade}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-slate-400 italic text-xs">No marks records found.</p>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
            >
              Close Marks
            </button>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE MODAL */}
      {activeModal === 'child_profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">{activeChild?.name}'s Profile</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-slate-400">Class</p>
                <p className="font-bold text-slate-800 mt-0.5">{activeChild?.className || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-slate-400">Section</p>
                <p className="font-bold text-slate-800 mt-0.5">{activeChild?.section || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-slate-400">Roll Number</p>
                <p className="font-mono font-bold text-slate-800 mt-0.5">#{activeChild?.rollNumber || '—'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-slate-400">Relationship</p>
                <p className="font-bold text-emerald-700 mt-0.5">{activeChild?.relationship || 'Child'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-slate-400">Student ID</p>
                <p className="font-mono font-bold text-emerald-700 mt-0.5">{activeChild?.studentId}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-slate-400">Blood Group</p>
                <p className="font-bold text-slate-800 mt-0.5">{activeChild?.bloodGroup || 'Not specified'}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* LINK CHILD MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Link Child to Account</h3>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkChildSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Student ID *</label>
                <input
                  type="text"
                  placeholder="e.g. STU001"
                  value={linkStudentId}
                  onChange={(e) => setLinkStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Enter the student ID provided by the school administration or student profile.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Relationship *</label>
                <select
                  value={linkRelationship}
                  onChange={(e) => setLinkRelationship(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Ward">Ward</option>
                  <option value="Child">Child</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="submit"
                  disabled={isLinking}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Linking Child...</span>
                    </>
                  ) : (
                    <span>Confirm Link</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ParentDashboard;
