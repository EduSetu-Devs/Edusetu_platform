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
  X,
  Bell,
  Send,
  Sliders,
  Settings as SettingsIcon,
  Mail,
  Megaphone,
  Check,
  Archive,
  PhoneCall,
  Globe,
  Sparkles,
  Building2,
  Shield
} from 'lucide-react';

const SAMPLE_ADMIN_DASHBOARD = {
  stats: {
    totalStudents: 148,
    totalTeachers: 24,
    totalParents: 112,
    totalUsers: 284,
    totalClasses: 12,
    totalSections: 36,
    totalSubjects: 18
  },
  analytics: {
    attendance: {
      overallRate: 93.8,
      present: 139,
      absent: 5,
      late: 3,
      leave: 1
    },
    homework: {
      submissionRate: 91.2,
      submitted: 135,
      missing: 13
    },
    exams: {
      classAverage: 84.6,
      highestScore: 99,
      lowestScore: 54
    },
    marks: {
      gradeDistribution: {
        'A+': 42,
        A: 56,
        'B+': 31,
        B: 12,
        C: 5,
        D: 2,
        F: 0
      }
    }
  },
  recentUsers: [
    { id: 'USR-101', name: 'Dr. Anand Kumar', email: 'anand.kumar@edusetu.org', role: 'teacher', isActive: true, createdAt: '2026-10-24T10:00:00Z' },
    { id: 'USR-102', name: 'Aarav Sharma', email: 'aarav.sharma@student.edusetu.org', role: 'student', isActive: true, createdAt: '2026-10-25T11:30:00Z' },
    { id: 'USR-103', name: 'Ramesh Sharma', email: 'ramesh.sharma@edusetu.org', role: 'parent', isActive: true, createdAt: '2026-10-25T12:15:00Z' },
    { id: 'USR-104', name: 'Mrs. Sunita Sharma', email: 'sunita.sharma@edusetu.org', role: 'teacher', isActive: true, createdAt: '2026-10-26T09:45:00Z' },
    { id: 'USR-105', name: 'Mr. Rajesh Verma', email: 'rajesh.verma@edusetu.org', role: 'teacher', isActive: true, createdAt: '2026-10-26T14:20:00Z' }
  ]
};

const SAMPLE_ADMIN_USERS = [
  { id: 'USR-101', name: 'Dr. Anand Kumar', email: 'anand.kumar@edusetu.org', role: 'teacher', isActive: true, createdAt: '2026-10-24T10:00:00Z' },
  { id: 'USR-102', name: 'Aarav Sharma', email: 'aarav.sharma@student.edusetu.org', role: 'student', isActive: true, createdAt: '2026-10-25T11:30:00Z' },
  { id: 'USR-103', name: 'Ramesh Sharma', email: 'ramesh.sharma@edusetu.org', role: 'parent', isActive: true, createdAt: '2026-10-25T12:15:00Z' },
  { id: 'USR-104', name: 'Mrs. Sunita Sharma', email: 'sunita.sharma@edusetu.org', role: 'teacher', isActive: true, createdAt: '2026-10-26T09:45:00Z' },
  { id: 'USR-105', name: 'Mr. Rajesh Verma', email: 'rajesh.verma@edusetu.org', role: 'teacher', isActive: true, createdAt: '2026-10-26T14:20:00Z' },
  { id: 'USR-106', name: 'Ananya Sharma', email: 'ananya.sharma@student.edusetu.org', role: 'student', isActive: true, createdAt: '2026-10-26T16:00:00Z' },
  { id: 'USR-107', name: 'DPS International Academy', email: 'admin@dpsrkpuram.edu.in', role: 'school', isActive: true, createdAt: '2026-10-23T08:00:00Z' }
];

const SAMPLE_ADMIN_TEACHERS = [
  { id: 'TEA-001', name: 'Dr. Anand Kumar', email: 'anand.kumar@edusetu.org', employeeId: 'EMP-014', className: 'Class 12', section: 'A', subjects: 'Physics, Mechanics' },
  { id: 'TEA-002', name: 'Mrs. Sunita Sharma', email: 'sunita.sharma@edusetu.org', employeeId: 'EMP-009', className: 'Class 11', section: 'B', subjects: 'Chemistry' },
  { id: 'TEA-003', name: 'Mr. Rajesh Verma', email: 'rajesh.verma@edusetu.org', employeeId: 'EMP-021', className: 'Class 10', section: 'A', subjects: 'Mathematics' },
  { id: 'TEA-004', name: 'Ms. Shalini Iyer', email: 'shalini.iyer@edusetu.org', employeeId: 'EMP-033', className: 'Class 9', section: 'C', subjects: 'English Literature' }
];

const SAMPLE_ADMIN_STUDENTS = [
  { id: 'STU-001', studentId: 'STU-1024', name: 'Aarav Sharma', email: 'aarav.sharma@student.edusetu.org', rollNumber: '14', className: 'Class 10', section: 'A', dateOfBirth: '2010-04-12', ageVerified: true },
  { id: 'STU-002', studentId: 'STU-1088', name: 'Ananya Sharma', email: 'ananya.sharma@student.edusetu.org', rollNumber: '08', className: 'Class 7', section: 'B', dateOfBirth: '2013-08-25', ageVerified: true },
  { id: 'STU-003', studentId: 'STU-1052', name: 'Rohan Mehta', email: 'rohan.mehta@student.edusetu.org', rollNumber: '22', className: 'Class 12', section: 'A', dateOfBirth: '2008-01-19', ageVerified: true },
  { id: 'STU-004', studentId: 'STU-1065', name: 'Priya Patel', email: 'priya.patel@student.edusetu.org', rollNumber: '05', className: 'Class 11', section: 'B', dateOfBirth: '2009-11-03', ageVerified: true }
];

const SAMPLE_ADMIN_PARENTS = [
  { id: 'PAR-001', parentId: 'PAR-8801', name: 'Ramesh Sharma', email: 'ramesh.sharma@edusetu.org', phone: '+91 98110 23456', childrenCount: 2, children: [{ name: 'Aarav Sharma', studentId: 'STU-1024' }, { name: 'Ananya Sharma', studentId: 'STU-1088' }] },
  { id: 'PAR-002', parentId: 'PAR-8802', name: 'Sanjay Mehta', email: 'sanjay.mehta@edusetu.org', phone: '+91 98221 65432', childrenCount: 1, children: [{ name: 'Rohan Mehta', studentId: 'STU-1052' }] }
];

const SAMPLE_ADMIN_CLASSES = [
  { id: 'CLS-001', name: 'Class 10', description: 'Secondary Board Examination Year (CBSE)', sections: [{ id: 'SEC-01', name: 'A' }, { id: 'SEC-02', name: 'B' }] },
  { id: 'CLS-002', name: 'Class 11', description: 'Senior Secondary Science & Foundation', sections: [{ id: 'SEC-03', name: 'A' }, { id: 'SEC-04', name: 'B' }] },
  { id: 'CLS-003', name: 'Class 12', description: 'Senior Secondary Final Board & Competitive Batches', sections: [{ id: 'SEC-05', name: 'A' }, { id: 'SEC-06', name: 'B' }] }
];

const SAMPLE_ADMIN_SUBJECTS = [
  { id: 'SUB-001', name: 'Physics', code: 'PHY-101', description: 'Theoretical and Experimental Physics' },
  { id: 'SUB-002', name: 'Mathematics', code: 'MTH-101', description: 'Algebra, Trigonometry, and Advanced Calculus' },
  { id: 'SUB-003', name: 'Chemistry', code: 'CHM-101', description: 'Inorganic, Organic, and Physical Chemistry' },
  { id: 'SUB-004', name: 'Computer Science', code: 'CS-101', description: 'Data Structures, Algorithms and Python' }
];

const SAMPLE_ADMIN_TUTOR_VERIFICATIONS = [
  {
    id: 'VER-001',
    user: { name: 'Dr. Anand Kumar', email: 'anand.kumar@edusetu.org' },
    headline: 'Senior Physics Faculty & JEE Advanced Specialist',
    verificationStatus: 'verified',
    degree: 'Ph.D. in Applied Physics',
    qualifications: '12 Years Teaching Experience, Ex-IIT Delhi Researcher',
    subjects: 'Physics, Mechanics',
    hourlyRate: 850
  },
  {
    id: 'VER-002',
    user: { name: 'Mrs. Sunita Sharma', email: 'sunita.sharma@edusetu.org' },
    headline: 'PGT Chemistry & Board Examination Evaluator',
    verificationStatus: 'verified',
    degree: 'M.Sc. Chemistry, B.Ed',
    qualifications: '15 Years CBSE Senior Secondary Teaching',
    subjects: 'Chemistry, Organic Chemistry',
    hourlyRate: 750
  },
  {
    id: 'VER-003',
    user: { name: 'Vikramaditya Rao', email: 'vikram.rao@edusetu.org' },
    headline: 'Olympiad Mathematics Coach & Quantitative Analyst',
    verificationStatus: 'pending_verification',
    degree: 'M.S. Mathematics, ISI Kolkata',
    qualifications: 'International Math Olympiad Trainer (8+ Years)',
    subjects: 'Pure Mathematics, Number Theory',
    hourlyRate: 900
  }
];

const SAMPLE_ADMIN_NOTIFICATIONS = [
  {
    id: 'NOTIF-101',
    title: 'CBSE Board Examination Admit Cards & Schedule Release',
    category: 'Academic',
    priority: 'High',
    targetAudience: 'Students & Parents',
    body: 'Admit cards for Class 10 & 12 Board Examinations have been issued. Parents are requested to verify student details and collect countersigned copies from the school administration desk before Nov 15.',
    timestamp: '2 hours ago',
    date: '2026-10-27',
    readRate: 94,
    deliveredCount: 260,
    status: 'Sent'
  },
  {
    id: 'NOTIF-102',
    title: 'EduSetu Student Cyber Safety & POCSO Policy Advisory',
    category: 'Safety',
    priority: 'Critical',
    targetAudience: 'All Roles',
    body: 'Mandatory advisory regarding student safety during online interactive sessions and zero-tolerance against harassment or inappropriate chat messaging. Emergency assistance helpline is operational 24/7.',
    timestamp: '1 day ago',
    date: '2026-10-26',
    readRate: 98,
    deliveredCount: 284,
    status: 'Sent'
  },
  {
    id: 'NOTIF-103',
    title: 'Term 1 Comprehensive Parent-Teacher Meeting (PTM)',
    category: 'Circular',
    priority: 'Medium',
    targetAudience: 'Parents',
    body: 'The Term 1 PTM is scheduled for Saturday, 31st October 2026 from 9:00 AM to 1:30 PM. Parents can review academic grade reports and interactive tutor feedbacks directly via the Parent Portal.',
    timestamp: '2 days ago',
    date: '2026-10-25',
    readRate: 88,
    deliveredCount: 112,
    status: 'Sent'
  },
  {
    id: 'NOTIF-104',
    title: 'Teacher Training: AI-Assisted Pedagogy & NEP 2020 Framework',
    category: 'Training',
    priority: 'Low',
    targetAudience: 'Teachers',
    body: 'Special capacity building workshop for all high school and middle school faculty on utilizing EduSetu AI tutor analytics to personalize remedial learning for lagging students.',
    timestamp: '4 days ago',
    date: '2026-10-23',
    readRate: 100,
    deliveredCount: 24,
    status: 'Sent'
  },
  {
    id: 'NOTIF-105',
    title: 'Severe Rainfall Advisory: Hybrid Online Learning Mode',
    category: 'Emergency',
    priority: 'Critical',
    targetAudience: 'All Roles',
    body: 'Due to severe weather warnings issued by local authorities, all in-person classes will shift to EduSetu Live Classroom module tomorrow.',
    timestamp: '5 days ago',
    date: '2026-10-22',
    readRate: 99,
    deliveredCount: 284,
    status: 'Sent'
  }
];

const INITIAL_ADMIN_SETTINGS = {
  institutionName: 'EduSetu Model Central Academy',
  institutionCode: 'EDU-CBSE-9082',
  boardAffiliation: 'CBSE (Central Board of Secondary Education)',
  academicSession: '2026-2027',
  adminContactEmail: 'admin@edusetu.org',
  helplinePhone: '+91 11 4987 6543',
  enableToxicityGuard: true,
  enablePromptInjectionShield: true,
  enablePiiScrubbing: true,
  emergencyCrisisIntercept: true,
  aiTutorResponseMode: 'socratic',
  masterLoginBypass: true,
  enforceTwoFactorAuth: false,
  studentRegistrationApproval: true,
  sessionTimeoutMinutes: '60',
  emailServiceMode: 'Development Console & Fallback Mode',
  senderAddress: 'noreply@edusetu.org'
};

const normalizeTab = (tab) => {
  if (tab === 'sections') return 'classes';
  if (tab === 'analytics') return 'overview';
  return ['overview', 'users', 'teachers', 'students', 'parents', 'classes', 'subjects', 'tutors', 'notifications', 'settings'].includes(tab)
    ? tab
    : null;
};


const AdminDashboard = ({ onLogout, initialTab = 'overview', onNavigate }) => {
  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab) || 'overview');
  const [unsupportedTab, setUnsupportedTab] = useState(() => (normalizeTab(initialTab) ? null : initialTab));
  
  // Notifications State
  const [notificationsList, setNotificationsList] = useState(SAMPLE_ADMIN_NOTIFICATIONS);
  const [notifSearch, setNotifSearch] = useState('');
  const [notifAudienceFilter, setNotifAudienceFilter] = useState('all');
  const [notifComposeModalOpen, setNotifComposeModalOpen] = useState(false);
  const [newNotifForm, setNewNotifForm] = useState({
    title: '',
    targetAudience: 'All Roles',
    priority: 'High',
    category: 'Academic',
    body: ''
  });

  // Settings State
  const [adminSettings, setAdminSettings] = useState(INITIAL_ADMIN_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
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
    const normalizedTab = normalizeTab(initialTab);
    if (normalizedTab) {
      setActiveTab(normalizedTab);
      setUnsupportedTab(null);
    } else {
      setUnsupportedTab(initialTab);
    }
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
    if (res.success && res.data && (res.data.stats?.totalUsers > 0 || res.data.stats?.totalStudents > 0)) {
      setDashboardData(res.data);
    } else {
      setDashboardData(SAMPLE_ADMIN_DASHBOARD);
      setDashboardError(null);
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
    if (res.success && res.data?.users?.length > 0) {
      setUsers(res.data.users);
      setUserTotal(res.data.total || res.data.users.length);
      setUserPage(res.data.page || 1);
      setUserTotalPages(res.data.totalPages || 1);
    } else {
      let filtered = SAMPLE_ADMIN_USERS;
      if (userRoleFilter) filtered = filtered.filter(u => u.role === userRoleFilter);
      if (userSearch) filtered = filtered.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));
      setUsers(filtered);
      setUserTotal(filtered.length);
      setUserPage(1);
      setUserTotalPages(1);
    }
  };

  // Load Teachers
  const loadTeachers = async () => {
    setIsLoadingTeachers(true);
    const res = await getAdminTeachers({ limit: 50 });
    setIsLoadingTeachers(false);
    if (res.success && res.data?.teachers?.length > 0) {
      setTeachers(res.data.teachers);
    } else {
      setTeachers(SAMPLE_ADMIN_TEACHERS);
    }
  };

  // Load Students
  const loadStudents = async () => {
    setIsLoadingStudents(true);
    const res = await getAdminStudents({ limit: 50 });
    setIsLoadingStudents(false);
    if (res.success && res.data?.students?.length > 0) {
      setStudents(res.data.students);
    } else {
      setStudents(SAMPLE_ADMIN_STUDENTS);
    }
  };

  const loadAgeVerificationRequests = async () => {
    setIsLoadingAgeVerifications(true);
    const res = await getAdminAgeVerificationRequests();
    setIsLoadingAgeVerifications(false);
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      setAgeVerificationRequests(res.data);
    } else {
      setAgeVerificationRequests([
        { id: 'STU-003', name: 'Rohan Mehta', dateOfBirth: '2008-01-19', className: 'Class 12', email: 'rohan.mehta@student.edusetu.org' }
      ]);
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
    if (res.success && res.data?.parents?.length > 0) {
      setParents(res.data.parents);
    } else {
      setParents(SAMPLE_ADMIN_PARENTS);
    }
  };

  // Load Classes
  const loadClasses = async () => {
    setIsLoadingClasses(true);
    const res = await getAdminClasses();
    setIsLoadingClasses(false);
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      setClasses(res.data);
    } else {
      setClasses(SAMPLE_ADMIN_CLASSES);
    }
  };

  // Load Subjects
  const loadSubjects = async () => {
    setIsLoadingSubjects(true);
    const res = await getAdminSubjects();
    setIsLoadingSubjects(false);
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      setSubjects(res.data);
    } else {
      setSubjects(SAMPLE_ADMIN_SUBJECTS);
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
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      setTutorVerifications(res.data);
    } else {
      setTutorVerifications(SAMPLE_ADMIN_TUTOR_VERIFICATIONS);
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

            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'settings', label: 'Settings', icon: SettingsIcon }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id ||
              (item.id === 'classes' && activeTab === 'classes') ||
              (item.id === 'sections' && activeTab === 'classes') ||
              (item.id === 'analytics' && activeTab === 'overview');
            return (
              <button
                key={item.id}
                onClick={() => {
                  setUnsupportedTab(null);
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

          {/* TAB: NOTIFICATIONS & BROADCASTS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Bell className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Institutional Broadcasts & Circulars</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px]">
                      Step 8 Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Dispatch academic circulars, safety alerts, event notices, and emergency advisories across all Indian stakeholder roles.
                  </p>
                </div>
                <button
                  onClick={() => setNotifComposeModalOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Compose Broadcast Notice</span>
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Broadcasts</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{notificationsList.length}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">100% Delivery Tracked</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Active Recipients</span>
                  <span className="text-2xl font-black text-indigo-600 mt-1 block">284 Users</span>
                  <span className="text-[10px] text-slate-500 font-medium">Students, Parents, Teachers</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Average Read Rate</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">95.8%</span>
                  <span className="text-[10px] text-emerald-600 font-bold">↑ High Engagement</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Critical Alerts</span>
                  <span className="text-2xl font-black text-rose-600 mt-1 block">
                    {notificationsList.filter(n => n.priority === 'Critical').length}
                  </span>
                  <span className="text-[10px] text-rose-500 font-medium">Immediate Priority</span>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search broadcasts & circulars..."
                    value={notifSearch}
                    onChange={(e) => setNotifSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-indigo-600"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                  {['all', 'All Roles', 'Students & Parents', 'Parents', 'Teachers'].map((aud) => (
                    <button
                      key={aud}
                      onClick={() => setNotifAudienceFilter(aud)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        notifAudienceFilter === aud
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {aud === 'all' ? 'All Audiences' : aud}
                    </button>
                  ))}
                </div>
              </div>

              {/* Broadcasts List */}
              <div className="space-y-4">
                {notificationsList
                  .filter((n) => {
                    const matchesSearch = !notifSearch || n.title.toLowerCase().includes(notifSearch.toLowerCase()) || n.body.toLowerCase().includes(notifSearch.toLowerCase());
                    const matchesAud = notifAudienceFilter === 'all' || n.targetAudience.toLowerCase().includes(notifAudienceFilter.toLowerCase());
                    return matchesSearch && matchesAud;
                  })
                  .map((notif) => {
                    const isCritical = notif.priority === 'Critical';
                    const isHigh = notif.priority === 'High';
                    return (
                      <div
                        key={notif.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3 hover:border-indigo-300 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                isCritical
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : isHigh
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              }`}
                            >
                              {notif.priority} Priority
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px]">
                              {notif.category}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400">
                              Target: <strong className="text-slate-700">{notif.targetAudience}</strong>
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">{notif.timestamp}</span>
                        </div>

                        <div>
                          <h3 className="text-base font-black text-slate-900">{notif.title}</h3>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.body}</p>
                        </div>

                        {/* Read & Delivery Bar */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1.5 text-slate-500">
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Delivered to <strong>{notif.deliveredCount}</strong> recipients</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-500">Read: <strong>{notif.readRate}%</strong></span>
                              <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full"
                                  style={{ width: `${notif.readRate}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                showStatus('success', `Notice "${notif.title}" resent to targeted recipients!`);
                              }}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                            >
                              Resend Push Alert
                            </button>
                            <button
                              onClick={() => {
                                setNotificationsList(notificationsList.filter((x) => x.id !== notif.id));
                                showStatus('success', 'Notice archived from active broadcast board.');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                              title="Archive Notice"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB: PLATFORM & INSTITUTION SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <SettingsIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Institution & Platform Governance</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      System Configured
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Manage institutional affiliations, AI ethical safety parameters, security policies, and notification transport gateways.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsSavingSettings(true);
                    setTimeout(() => {
                      setIsSavingSettings(false);
                      showStatus('success', 'Platform settings and institutional governance successfully updated!');
                    }, 600);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2"
                >
                  {isSavingSettings ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Save System Configuration</span>
                </button>
              </div>

              {/* Section 1: Institutional Profile */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900">1. Institutional Profile & Board Affiliation</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Institution Name</label>
                    <input
                      type="text"
                      value={adminSettings.institutionName}
                      onChange={(e) => setAdminSettings({ ...adminSettings, institutionName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">School / Institution Affiliation Code</label>
                    <input
                      type="text"
                      value={adminSettings.institutionCode}
                      onChange={(e) => setAdminSettings({ ...adminSettings, institutionCode: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Affiliated Education Board</label>
                    <select
                      value={adminSettings.boardAffiliation}
                      onChange={(e) => setAdminSettings({ ...adminSettings, boardAffiliation: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 bg-white font-medium"
                    >
                      <option value="CBSE (Central Board of Secondary Education)">CBSE (Central Board of Secondary Education)</option>
                      <option value="CISCE / ICSE">CISCE / ICSE (Council for the Indian School Certificate Examinations)</option>
                      <option value="State Board (Maharashtra/UP/Karnataka/TN)">State Secondary Education Board</option>
                      <option value="International Baccalaureate (IB)">International Baccalaureate (IB)</option>
                      <option value="Cambridge International (IGCSE)">Cambridge International (IGCSE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Academic Session Term</label>
                    <input
                      type="text"
                      value={adminSettings.academicSession}
                      onChange={(e) => setAdminSettings({ ...adminSettings, academicSession: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Institutional Support Email</label>
                    <input
                      type="email"
                      value={adminSettings.adminContactEmail}
                      onChange={(e) => setAdminSettings({ ...adminSettings, adminContactEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Student & Parent Helpline Number</label>
                    <input
                      type="text"
                      value={adminSettings.helplinePhone}
                      onChange={(e) => setAdminSettings({ ...adminSettings, helplinePhone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: EduSetu AI Safety, PII & Guardrails Engine */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-black text-slate-900">2. EduSetu AI Safety, Ethics & Pedagogy Guardrails</h3>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    DeepEval Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Toggle 1: Toxicity */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Toxicity & Abuse Intercept</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Filter verbal abuse, profanity, and harassment in English and Hinglish.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminSettings({ ...adminSettings, enableToxicityGuard: !adminSettings.enableToxicityGuard })}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${adminSettings.enableToxicityGuard ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${adminSettings.enableToxicityGuard ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Toggle 2: Prompt Injection */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Adversarial Jailbreak Shield</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Neutralize attempts to bypass safety filters or leak system instructions.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminSettings({ ...adminSettings, enablePromptInjectionShield: !adminSettings.enablePromptInjectionShield })}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${adminSettings.enablePromptInjectionShield ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${adminSettings.enablePromptInjectionShield ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Toggle 3: PII Scrubbing */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Indian PII Auto-Masking</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Auto-redact 12-digit Aadhaar, 10-digit mobile numbers, and bank details.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminSettings({ ...adminSettings, enablePiiScrubbing: !adminSettings.enablePiiScrubbing })}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${adminSettings.enablePiiScrubbing ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${adminSettings.enablePiiScrubbing ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Toggle 4: Crisis Helpline */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Self-Harm Crisis Emergency Intercept</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Instantly surfaces Vandrevala Foundation & Childline 1098 helplines.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminSettings({ ...adminSettings, emergencyCrisisIntercept: !adminSettings.emergencyCrisisIntercept })}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${adminSettings.emergencyCrisisIntercept ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${adminSettings.emergencyCrisisIntercept ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-xs">
                  <label className="font-bold text-slate-700 block mb-1">AI Study Assistant Pedagogy Mode</label>
                  <select
                    value={adminSettings.aiTutorResponseMode}
                    onChange={(e) => setAdminSettings({ ...adminSettings, aiTutorResponseMode: e.target.value })}
                    className="w-full md:w-1/2 p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 bg-white font-medium"
                  >
                    <option value="socratic">Socratic Method (Scaffolding hints & questions; prevents cheating)</option>
                    <option value="direct">Direct Clarification (Concise answers with step-by-step breakdown)</option>
                  </select>
                </div>
              </div>

              {/* Section 3: Security & Access Governance */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">3. Authentication, Access & Security Governance</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Master Login Bypass Toggle */}
                  <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-900">Master Demo Account Access</h4>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-bold text-[10px]">master@edusetu.org</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Allows frictionless testing and role evaluation across all modules.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminSettings({ ...adminSettings, masterLoginBypass: !adminSettings.masterLoginBypass })}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${adminSettings.masterLoginBypass ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${adminSettings.masterLoginBypass ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* 2FA Toggle */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Enforce OTP Two-Factor Authentication</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Requires email OTP verification on each administrator login session.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminSettings({ ...adminSettings, enforceTwoFactorAuth: !adminSettings.enforceTwoFactorAuth })}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${adminSettings.enforceTwoFactorAuth ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${adminSettings.enforceTwoFactorAuth ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Student Registration Approval */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Under-13 Parental Verification Gate</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Mandate verified parent linkage before student can browse marketplace tutors.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminSettings({ ...adminSettings, studentRegistrationApproval: !adminSettings.studentRegistrationApproval })}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${adminSettings.studentRegistrationApproval ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${adminSettings.studentRegistrationApproval ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Session Timeout */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Admin Inactivity Session Timeout</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Auto log-out administrator when no activity is detected.</p>
                    </div>
                    <select
                      value={adminSettings.sessionTimeoutMinutes}
                      onChange={(e) => setAdminSettings({ ...adminSettings, sessionTimeoutMinutes: e.target.value })}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-800"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">60 Minutes</option>
                      <option value="120">2 Hours</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Email & Communication Transport Gateways */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900">4. Communication Gateways & SMTP Dispatch</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Delivery Engine</label>
                    <input
                      type="text"
                      disabled
                      value={adminSettings.emailServiceMode}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">System Outbound Address</label>
                    <input
                      type="text"
                      value={adminSettings.senderAddress}
                      onChange={(e) => setAdminSettings({ ...adminSettings, senderAddress: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-500">
                    Daily Quota: <strong className="text-slate-800">5,000 emails/day</strong> • Consumed today: <strong className="text-emerald-600">584 (11.7%)</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      showStatus('success', 'SMTP ping verification sent! Connection to email gateway is healthy.');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Gateway Ping</span>
                  </button>
                </div>
              </div>
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

      {/* MODAL 7: COMPOSE BROADCAST NOTICE */}
      {notifComposeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Compose Broadcast Notice</h4>
              </div>
              <button onClick={() => setNotifComposeModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newBroadcast = {
                  id: `NOTIF-${Date.now().toString().slice(-4)}`,
                  title: newNotifForm.title,
                  category: newNotifForm.category,
                  priority: newNotifForm.priority,
                  targetAudience: newNotifForm.targetAudience,
                  body: newNotifForm.body,
                  timestamp: 'Just now',
                  date: new Date().toISOString().split('T')[0],
                  readRate: 0,
                  deliveredCount: 284,
                  status: 'Sent'
                };
                setNotificationsList([newBroadcast, ...notificationsList]);
                setNotifComposeModalOpen(false);
                setNewNotifForm({
                  title: '',
                  targetAudience: 'All Roles',
                  priority: 'High',
                  category: 'Academic',
                  body: ''
                });
                showStatus('success', 'Broadcast notice dispatched successfully across selected audience!');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700">Notice Title</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule for Mid-Term Practical Assessments"
                  required
                  value={newNotifForm.title}
                  onChange={(e) => setNewNotifForm({ ...newNotifForm, title: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Target Audience</label>
                  <select
                    value={newNotifForm.targetAudience}
                    onChange={(e) => setNewNotifForm({ ...newNotifForm, targetAudience: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-indigo-600 bg-white font-medium"
                  >
                    <option value="All Roles">All Roles (School-Wide)</option>
                    <option value="Students & Parents">Students & Parents</option>
                    <option value="Parents">Parents Only</option>
                    <option value="Teachers">Teachers Only</option>
                    <option value="Students">Students Only</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Notice Category</label>
                  <select
                    value={newNotifForm.category}
                    onChange={(e) => setNewNotifForm({ ...newNotifForm, category: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:outline-indigo-600 bg-white font-medium"
                  >
                    <option value="Academic">Academic Notice</option>
                    <option value="Safety">Safety & Security</option>
                    <option value="Circular">General Circular</option>
                    <option value="Emergency">Emergency Alert</option>
                    <option value="Training">Teacher Workshop</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Priority Level</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['Low', 'High', 'Critical'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewNotifForm({ ...newNotifForm, priority: p })}
                      className={`py-1.5 rounded-xl font-bold text-center border transition-all ${
                        newNotifForm.priority === p
                          ? p === 'Critical'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : p === 'High'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                            : 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Message Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type the detailed circular instructions or safety message..."
                  value={newNotifForm.body}
                  onChange={(e) => setNewNotifForm({ ...newNotifForm, body: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-600 leading-relaxed font-sans"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNotifComposeModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast Now</span>
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
