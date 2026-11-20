import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import RoleCard from './components/RoleCard';
import ArchitectureSection from './components/ArchitectureSection';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ProfilePage from './pages/ProfilePage';
import StudentDashboard from './pages/StudentDashboard';
import StudentAttendance from './pages/StudentAttendance';
import StudentHomework from './pages/StudentHomework';
import StudentMarks from './pages/StudentMarks';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherStudents from './pages/TeacherStudents';
import TeacherAttendance from './pages/TeacherAttendance';
import TeacherHomework from './pages/TeacherHomework';
import TeacherMarks from './pages/TeacherMarks';
import TeacherMessages from './pages/TeacherMessages';
import TeacherClasses from './pages/TeacherClasses';
import ParentDashboard from './pages/ParentDashboard';
import ParentMessages from './pages/ParentMessages';
import ParentLearningHistory from './pages/ParentLearningHistory';
import StudentClasses from './pages/StudentClasses';
import StudentAI from './pages/StudentAI';
import TeacherAIInsights from './pages/TeacherAIInsights';
import ParentAIInsights from './pages/ParentAIInsights';
import OnlineClassroom from './pages/OnlineClassroom';
import AdminDashboard from './pages/AdminDashboard';
import AdminMarketplacePage from './pages/AdminMarketplacePage';
import FindTutorsPage from './pages/FindTutorsPage';
import TutorProfileDetailPage from './pages/TutorProfileDetailPage';
import TutorComparePage from './pages/TutorComparePage';
import TeacherTutorProfile from './pages/TeacherTutorProfile';
import TutorRequestsPage from './pages/TutorRequestsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import SchoolPortal from './pages/SchoolPortal';
import { checkBackendHealth } from './services/api';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Rocket,
  CheckCircle,
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  Award,
  FileSpreadsheet,
  HeartHandshake,
  MessageSquare
} from 'lucide-react';

const routeToView = (pathname) => {
  if (pathname === '/login/admin') return { view: 'login-admin', adminTab: 'overview' };
  if (pathname === '/login') return { view: 'login', adminTab: 'overview' };
  if (pathname === '/register') return { view: 'register', adminTab: 'overview' };
  if (pathname === '/terms' || pathname === '/terms/') return { view: 'terms', adminTab: 'overview' };
  if (pathname === '/privacy' || pathname === '/privacy/') return { view: 'privacy', adminTab: 'overview' };
  if (pathname === '/profile') return { view: 'profile', adminTab: 'overview' };
  if (pathname === '/admin/marketplace' || pathname === '/admin/marketplace/') return { view: 'admin-marketplace', adminTab: 'overview' };
  if (pathname === '/admin' || pathname === '/admin/') return { view: 'admin-dashboard', adminTab: 'overview' };
  if (pathname === '/student' || pathname === '/student/') return { view: 'student-dashboard', adminTab: 'overview' };
  if (pathname === '/student/classes' || pathname === '/student/classes/') return { view: 'student-classes', adminTab: 'overview' };
  if (pathname === '/student/ai' || pathname === '/student/ai/') return { view: 'student-ai', adminTab: 'overview' };
  if (pathname === '/teacher' || pathname === '/teacher/') return { view: 'teacher-dashboard', adminTab: 'overview' };
  if (pathname === '/teacher/classes' || pathname === '/teacher/classes/') return { view: 'teacher-classes', adminTab: 'overview' };
  if (pathname === '/teacher/ai' || pathname === '/teacher/ai/') return { view: 'teacher-ai', adminTab: 'overview' };
  if (pathname === '/teacher/tutor-profile' || pathname === '/teacher/tutor-profile/') return { view: 'teacher-tutor-profile', adminTab: 'overview' };
  if (pathname === '/teacher/tutor-requests' || pathname === '/teacher/tutor-requests/') return { view: 'teacher-tutor-requests', adminTab: 'overview' };
  if (pathname === '/my-tutor-requests' || pathname === '/my-tutor-requests/') return { view: 'my-tutor-requests', adminTab: 'overview' };
  if (pathname === '/my-bookings' || pathname === '/my-bookings/') return { view: 'my-bookings', adminTab: 'overview' };
  if (pathname === '/find-tutor' || pathname === '/find-tutors' || pathname === '/find-tutor/' || pathname === '/find-tutors/') return { view: 'find-tutors', adminTab: 'overview' };
  if (pathname === '/compare-tutors' || pathname === '/compare-tutors/') return { view: 'compare-tutors', adminTab: 'overview' };
  if (pathname === '/school' || pathname === '/school/' || pathname === '/school-portal' || pathname === '/school-portal/') return { view: 'school-portal', adminTab: 'overview' };

  const tutorMatch = pathname.match(/^\/tutor\/(\d+)\/?$/);
  if (tutorMatch) return { view: 'tutor-detail', tutorId: tutorMatch[1], adminTab: 'overview' };

  const classroomMatch = pathname.match(/^\/classroom\/(\d+)\/?$/);
  if (classroomMatch) return { view: 'online-classroom', sessionId: classroomMatch[1], adminTab: 'overview' };
  if (pathname === '/parent' || pathname === '/parent/') return { view: 'parent-dashboard', adminTab: 'overview' };
  if (pathname === '/parent/learning' || pathname === '/parent/learning/') return { view: 'parent-learning', adminTab: 'overview' };
  if (pathname === '/parent/ai' || pathname === '/parent/ai/') return { view: 'parent-ai', adminTab: 'overview' };

  const adminMatch = pathname.match(/^\/admin\/([^/]+)\/?$/);
  if (adminMatch) {
    const tabByPath = {
      users: 'users', students: 'students', teachers: 'teachers', parents: 'parents',
      classes: 'classes', sections: 'sections', subjects: 'subjects', tutors: 'tutors', analytics: 'analytics',
      notifications: 'notifications', settings: 'settings'
    };
    return { view: 'admin-dashboard', adminTab: tabByPath[adminMatch[1]] || 'overview' };
  }

  return { view: pathname.replace(/^\//, '').replace(/\//g, '-') || 'home', adminTab: 'overview' };
};

const viewToPath = {
  home: '/', login: '/login', 'login-admin': '/login/admin', register: '/register', profile: '/profile',
  terms: '/terms', privacy: '/privacy',
  'student-dashboard': '/student', 'student-attendance': '/student/attendance',
  'student-homework': '/student/homework', 'student-marks': '/student/marks',
  'student-classes': '/student/classes',
  'student-ai': '/student/ai',
  'teacher-dashboard': '/teacher', 'teacher-students': '/teacher/students',
  'teacher-classes': '/teacher/classes',
  'teacher-ai': '/teacher/ai',
  'teacher-attendance': '/teacher/attendance', 'teacher-homework': '/teacher/homework',
  'teacher-marks': '/teacher/marks', 'teacher-messages': '/teacher/messages',
  'teacher-tutor-profile': '/teacher/tutor-profile',
  'teacher-tutor-requests': '/teacher/tutor-requests',
  'my-tutor-requests': '/my-tutor-requests',
  'my-bookings': '/my-bookings',
  'admin-marketplace': '/admin/marketplace',
  'find-tutors': '/find-tutor',
  'compare-tutors': '/compare-tutors',
  'school-portal': '/school',
  'parent-dashboard': '/parent', 'parent-messages': '/parent/messages', 'parent-learning': '/parent/learning', 'parent-ai': '/parent/ai', 'admin-dashboard': '/admin'
};

const adminTabToPath = {
  overview: '/admin', users: '/admin/users', students: '/admin/students', teachers: '/admin/teachers',
  parents: '/admin/parents', classes: '/admin/classes', sections: '/admin/sections', subjects: '/admin/subjects',
  tutors: '/admin/tutors', analytics: '/admin/analytics'
};


function AppContent() {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const [route, setRoute] = useState(() => routeToView(window.location.pathname));
  const { view: currentView, adminTab } = route;
  const [backendHealth, setBackendHealth] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [compareList, setCompareList] = useState([]);

  // Fetch backend status on mount
  const verifyBackend = async () => {
    setIsChecking(true);
    const health = await checkBackendHealth();
    setBackendHealth(health);
    setIsChecking(false);
  };

  useEffect(() => {
    verifyBackend();
  }, []);

  useEffect(() => {
    const handlePopState = () => setRoute(routeToView(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (view) => {
    const path = viewToPath[view] || '/';
    window.history.pushState({}, '', path);
    setRoute(routeToView(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToTutor = (tutorId) => {
    const path = `/tutor/${tutorId}`;
    window.history.pushState({}, '', path);
    setRoute(routeToView(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToClassroom = (sessionId) => {
    const path = `/classroom/${sessionId}`;
    window.history.pushState({}, '', path);
    setRoute(routeToView(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const setCurrentView = navigate;

  const navigateAdmin = (tab) => {
    const path = adminTabToPath[tab] || adminTabToPath.overview;
    window.history.pushState({}, '', path);
    setRoute(routeToView(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (loggedInUser) => {
    const role = loggedInUser?.role || user?.role;
    if (role === 'student') {
      navigate('student-dashboard');
    } else if (role === 'teacher') {
      navigate('teacher-dashboard');
    } else if (role === 'parent') {
      navigate('parent-dashboard');
    } else if (role === 'school') {
      navigate('school-portal');
    } else if (role === 'admin') {
      navigate('admin-dashboard');
    } else {
      navigate('profile');
    }
  };

  // Automatic redirect if user becomes authenticated while on login/register view
  useEffect(() => {
    if (isAuthenticated && user && (currentView === 'login' || currentView === 'login-admin' || currentView === 'register')) {
      handleLoginSuccess(user);
    }
  }, [isAuthenticated, user, currentView]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3 animate-fade-in">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 animate-pulse shadow-lg shadow-indigo-500/30" />
          <p className="text-sm font-semibold text-slate-600">Loading EduSetu Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 selection:bg-indigo-500 selection:text-white relative">
      {/* Background ambient glowing gradient orbs for scroll richness */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-300/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[40%] right-10 w-[450px] h-[450px] bg-purple-300/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      {/* Header / Navbar */}
      <Navbar
        backendConnected={backendHealth?.connected}
        isChecking={isChecking}
        currentView={currentView}
        onNavigate={navigate}
      />

      {/* Main Content View Switcher */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 w-full relative z-10">

        {/* VIEW 1: Sign In */}
        {(currentView === 'login' || currentView === 'login-admin') && (
          <div className="animate-fade-up">
            <LoginPage
              initialAdminMode={currentView === 'login-admin'}
              onNavigateToRegister={() => setCurrentView('register')}
              onLoginSuccess={handleLoginSuccess}
            />
          </div>
        )}

        {/* VIEW 2: Register */}
        {currentView === 'register' && (
          <div className="animate-fade-up">
            <RegisterPage
              onNavigateToLogin={(asAdmin = false) => setCurrentView(asAdmin ? 'login-admin' : 'login')}
              onRegisterSuccess={handleLoginSuccess}
            />
          </div>
        )}

        {/* Legal pages */}
        {currentView === 'terms' && <div className="animate-fade-up"><TermsPage onNavigateBack={() => setCurrentView('home')} /></div>}
        {currentView === 'privacy' && <div className="animate-fade-up"><PrivacyPage onNavigateBack={() => setCurrentView('home')} /></div>}

        {/* VIEW 3: Student Dashboard (Protected - Student Role Only) */}
        {currentView === 'student-dashboard' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['student']} onNavigateToLogin={() => setCurrentView('login')}>
              <StudentDashboard
                onLogout={() => setCurrentView('home')}
                onNavigateToTutors={() => setCurrentView('find-tutors')}
                onNavigateToAttendance={() => setCurrentView('student-attendance')}
                onNavigateToHomework={() => setCurrentView('student-homework')}
                onNavigateToMarks={() => setCurrentView('student-marks')}
                onNavigateToClasses={() => setCurrentView('student-classes')}
                onNavigateToAI={() => setCurrentView('student-ai')}
                onNavigateToClassroom={navigateToClassroom}
              />
            </ProtectedRoute>
          </div>
        )}

        {currentView === 'student-classes' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['student']} onNavigateToLogin={() => setCurrentView('login')}>
              <StudentClasses onNavigateBack={() => setCurrentView('student-dashboard')} onNavigateToClassroom={navigateToClassroom} />
            </ProtectedRoute>
          </div>
        )}

        {currentView === 'student-ai' && <div className="animate-fade-up"><ProtectedRoute allowedRoles={['student']} onNavigateToLogin={() => setCurrentView('login')}><StudentAI onNavigateBack={() => setCurrentView('student-dashboard')} /></ProtectedRoute></div>}

        {/* VIEW 4: Student Attendance (Protected - Student Role Only) */}
        {currentView === 'student-attendance' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['student']} onNavigateToLogin={() => setCurrentView('login')}>
              <StudentAttendance
                onNavigateBack={() => setCurrentView('student-dashboard')}
              />
            </ProtectedRoute>
          </div>
        )}

        {/* VIEW 5: Student Homework (Protected - Student Role Only) */}
        {currentView === 'student-homework' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['student']} onNavigateToLogin={() => setCurrentView('login')}>
              <StudentHomework
                onNavigateBack={() => setCurrentView('student-dashboard')}
              />
            </ProtectedRoute>
          </div>
        )}

        {/* VIEW 6: Student Marks & Performance (Protected - Student Role Only) */}
        {currentView === 'student-marks' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['student']} onNavigateToLogin={() => setCurrentView('login')}>
              <StudentMarks
                onNavigateBack={() => setCurrentView('student-dashboard')}
              />
            </ProtectedRoute>
          </div>
        )}

        {/* VIEW 7: Teacher Dashboard (Protected - Teacher Role Only) */}
        {currentView === 'teacher-dashboard' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['teacher']} onNavigateToLogin={() => setCurrentView('login')}>
              <TeacherDashboard
                onLogout={() => setCurrentView('home')}
                onNavigateToStudents={() => setCurrentView('teacher-students')}
                onNavigateToAttendance={() => setCurrentView('teacher-attendance')}
                onNavigateToHomework={() => setCurrentView('teacher-homework')}
                onNavigateToMarks={() => setCurrentView('teacher-marks')}
                onNavigateToMessages={() => setCurrentView('teacher-messages')}
                onNavigateToClasses={() => setCurrentView('teacher-classes')}
                onNavigateToAI={() => setCurrentView('teacher-ai')}
                onNavigateToTutorProfile={() => setCurrentView('teacher-tutor-profile')}
                onNavigateToRequests={() => setCurrentView('teacher-tutor-requests')}
                onNavigateToBookings={() => setCurrentView('my-bookings')}
              />
            </ProtectedRoute>
          </div>
        )}

        {currentView === 'teacher-classes' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['teacher']} onNavigateToLogin={() => setCurrentView('login')}>
              <TeacherClasses onNavigateBack={() => setCurrentView('teacher-dashboard')} onNavigateToClassroom={navigateToClassroom} />
            </ProtectedRoute>
          </div>
        )}

        {currentView === 'teacher-ai' && <div className="animate-fade-up"><ProtectedRoute allowedRoles={['teacher']} onNavigateToLogin={() => setCurrentView('login')}><TeacherAIInsights onNavigateBack={() => setCurrentView('teacher-dashboard')} /></ProtectedRoute></div>}

        {currentView === 'online-classroom' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['teacher', 'student']} onNavigateToLogin={() => setCurrentView('login')}>
              <OnlineClassroom sessionId={route.sessionId} onNavigateBack={() => setCurrentView(user?.role === 'teacher' ? 'teacher-classes' : 'student-classes')} />
            </ProtectedRoute>
          </div>
        )}

        {/* VIEW 8: Teacher Students Roster (Protected - Teacher Role Only) */}
        {currentView === 'teacher-students' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['teacher']} onNavigateToLogin={() => setCurrentView('login')}>
              <TeacherStudents
                onNavigateBack={() => setCurrentView('teacher-dashboard')}
              />
            </ProtectedRoute>
          </div>
        )}

        {/* VIEW 9: Teacher Attendance Register (Protected - Teacher Role Only) */}
        {currentView === 'teacher-attendance' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['teacher']} onNavigateToLogin={() => setCurrentView('login')}>
              <TeacherAttendance
                onNavigateBack={() => setCurrentView('teacher-dashboard')}
              />
            </ProtectedRoute>
          </div>
        )}

        {/* VIEW 10: Teacher Homework Management (Protected - Teacher Role Only) */}
        {currentView === 'teacher-homework' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['teacher']} onNavigateToLogin={() => setCurrentView('login')}>
              <TeacherHomework
                onNavigateBack={() => setCurrentView('teacher-dashboard')}
              />
            </ProtectedRoute>
          </div>
        )}

        {/* VIEW 11: Teacher Marks Management (Protected - Teacher Role Only) */}
        {currentView === 'teacher-marks' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['teacher']} onNavigateToLogin={() => setCurrentView('login')}>
              <TeacherMarks
                onNavigateBack={() => setCurrentView('teacher-dashboard')}
              />
            </ProtectedRoute>
          </div>
        )}

        {/* VIEW 12: Teacher Messages (Protected - Teacher Role Only) */}
        {currentView === 'teacher-messages' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['teacher']} onNavigateToLogin={() => setCurrentView('login')}>
              <TeacherMessages onNavigateBack={() => setCurrentView('teacher-dashboard')} />
            </ProtectedRoute>
          </div>
        )}

        {/* VIEW 13: Parent Dashboard (Protected - Parent Role Only) */}
        {currentView === 'parent-dashboard' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['parent']} onNavigateToLogin={() => setCurrentView('login')}>
              <ParentDashboard
                onNavigateToAI={() => setCurrentView('parent-ai')}
                onNavigateToTutors={() => setCurrentView('find-tutors')}
                onNavigateToMessages={() => setCurrentView('parent-messages')}
              />
            </ProtectedRoute>
          </div>
        )}

        {/* VIEW 14: Parent Messages (Protected - Parent Role Only) */}
        {currentView === 'parent-messages' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['parent']} onNavigateToLogin={() => setCurrentView('login')}>
              <ParentMessages onNavigateBack={() => setCurrentView('parent-dashboard')} />
            </ProtectedRoute>
          </div>
        )}

        {currentView === 'parent-learning' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['parent']} onNavigateToLogin={() => setCurrentView('login')}>
              <ParentLearningHistory onNavigateBack={() => setCurrentView('parent-dashboard')} />
            </ProtectedRoute>
          </div>
        )}

        {currentView === 'parent-ai' && <div className="animate-fade-up"><ProtectedRoute allowedRoles={['parent']} onNavigateToLogin={() => setCurrentView('login')}><ParentAIInsights onNavigateBack={() => setCurrentView('parent-dashboard')} /></ProtectedRoute></div>}

        {/* VIEW 15: Admin Dashboard (Protected - Admin Role Only) */}
        {currentView === 'admin-dashboard' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['admin']} onNavigateToLogin={() => navigate('login-admin')}>
              <AdminDashboard
                initialTab={adminTab}
                onNavigate={navigateAdmin}
              />
            </ProtectedRoute>
          </div>
        )}
        {currentView === 'admin-marketplace' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['admin']} onNavigateToLogin={() => navigate('login-admin')}>
              <AdminMarketplacePage onNavigateBack={() => setCurrentView('admin-dashboard')} />
            </ProtectedRoute>
          </div>
        )}

        {/* VIEW 16: General Protected Profile */}
        {currentView === 'profile' && (
          <div className="animate-fade-up">
            <ProtectedRoute onNavigateToLogin={() => setCurrentView('login')}>
              <ProfilePage onLogout={() => setCurrentView('home')} />
            </ProtectedRoute>
          </div>
        )}

        {/* PHASE 5: VIEW 18: Find Tutors Marketplace */}
        {currentView === 'find-tutors' && (
          <div className="animate-fade-up">
            <FindTutorsPage
              onNavigate={navigate}
              onNavigateBack={() => setCurrentView(user?.role === 'parent' ? 'parent-dashboard' : user?.role === 'teacher' ? 'teacher-dashboard' : user?.role === 'student' ? 'student-dashboard' : 'home')}
              onSelectTutor={(id) => navigateToTutor(id)}
              onCompareTutors={() => navigate('compare-tutors')}
              compareList={compareList}
              setCompareList={setCompareList}
            />
          </div>
        )}

        {/* PHASE 5: VIEW 19: Single Tutor Public Profile */}
        {(currentView === 'tutor-detail' || (currentView.startsWith('tutor-') && !isNaN(currentView.replace('tutor-', '')))) && (
          <div className="animate-fade-up">
            <TutorProfileDetailPage
              tutorId={route.tutorId || currentView.replace('tutor-', '')}
              onNavigate={navigate}
              onBack={() => navigate('find-tutors')}
            />
          </div>
        )}

        {/* PHASE 5: VIEW 20: Side-by-Side Tutor Comparison */}
        {currentView === 'compare-tutors' && (
          <div className="animate-fade-up">
            <TutorComparePage
              compareList={compareList}
              setCompareList={setCompareList}
              onNavigate={navigate}
              onSelectTutor={(id) => navigateToTutor(id)}
            />
          </div>
        )}

        {/* PHASE 5: VIEW 21: Teacher Tutor Profile Management */}
        {currentView === 'teacher-tutor-profile' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['teacher']} onNavigateToLogin={() => navigate('login')}>
              <TeacherTutorProfile
                onNavigate={navigate}
                onNavigateBack={() => setCurrentView('teacher-dashboard')}
              />
            </ProtectedRoute>
          </div>
        )}

        {/* PHASE 5: VIEW 22: Tutor Booking Requests (Teacher incoming or Student/Parent outgoing) */}
        {(currentView === 'teacher-tutor-requests' || currentView === 'my-tutor-requests') && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['teacher', 'student', 'parent']} onNavigateToLogin={() => navigate('login')}>
              <TutorRequestsPage
                onNavigate={navigate}
                onNavigateBack={() => setCurrentView(user?.role === 'teacher' ? 'teacher-dashboard' : user?.role === 'parent' ? 'parent-dashboard' : 'student-dashboard')}
                onEnterClassroom={navigateToClassroom}
              />
            </ProtectedRoute>
          </div>
        )}
        {currentView === 'my-bookings' && (
          <div className="animate-fade-up">
            <ProtectedRoute allowedRoles={['teacher', 'student', 'parent']} onNavigateToLogin={() => navigate('login')}>
              <MyBookingsPage onNavigateToClassroom={navigateToClassroom} onNavigateBack={() => navigate(user?.role === 'teacher' ? 'teacher-classes' : user?.role === 'student' ? 'student-classes' : 'parent-dashboard')} />
            </ProtectedRoute>
          </div>
        )}

        {/* PHASE 5: VIEW 23: School & Institution Portal */}
        {currentView === 'school-portal' && (
          <div className="animate-fade-up">
            <ProtectedRoute onNavigateToLogin={() => navigate('login')}>
              <SchoolPortal
                onSelectTutor={(id) => navigateToTutor(id)}
                onNavigateBack={() => setCurrentView(user?.role === 'admin' ? 'admin-dashboard' : user?.role === 'teacher' ? 'teacher-dashboard' : user?.role === 'parent' ? 'parent-dashboard' : user?.role === 'student' ? 'student-dashboard' : 'home')}
              />
            </ProtectedRoute>
          </div>
        )}

        {/* VIEW 17: Home Overview with Scroll Animations */}
        {currentView === 'home' && (
          <div className="space-y-20">

            {/* Hero Section */}
            <section className="text-center max-w-4xl mx-auto space-y-8 pt-8 sm:pt-12 animate-fade-up">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-700 shadow-sm animate-float">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Scroll-Driven Interactive UI • Institutional Admin Center Active!</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-950 tracking-tight leading-[1.1]">
                Seamless Governance for{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
                  Schools & Education
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
                EduSetu connects <strong className="text-slate-900">Administrators</strong>, <strong className="text-slate-900">Teachers</strong>, <strong className="text-slate-900">Students</strong>, and <strong className="text-slate-900">Parents</strong> on a single unified, animated platform.
              </p>

              {/* Quick Action CTA */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                {isAuthenticated ? (
                  user?.role === 'admin' ? (
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => setCurrentView('admin-dashboard')}
                        className="px-8 py-4 bg-indigo-900 hover:bg-slate-950 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-950/25 transition-all hover:scale-105 flex items-center space-x-3"
                      >
                        <ShieldCheck className="w-5 h-5 text-amber-400" />
                        <span>Open Admin Console</span>
                      </button>
                      <button
                        onClick={() => setCurrentView('profile')}
                        className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-bold text-base rounded-2xl shadow-md transition-all hover:scale-105 flex items-center space-x-3"
                      >
                        <span>Account Profile</span>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>
                  ) : user?.role === 'student' ? (
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => setCurrentView('student-dashboard')}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-500/25 transition-all hover:scale-105 flex items-center space-x-3"
                      >
                        <GraduationCap className="w-5 h-5" />
                        <span>Student Dashboard</span>
                      </button>
                      <button
                        onClick={() => setCurrentView('student-marks')}
                        className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-purple-500/25 transition-all hover:scale-105 flex items-center space-x-3"
                      >
                        <Award className="w-5 h-5" />
                        <span>Marks & Grades</span>
                      </button>
                      <button
                        onClick={() => setCurrentView('student-attendance')}
                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 flex items-center space-x-3"
                      >
                        <CalendarCheck className="w-5 h-5" />
                        <span>Attendance</span>
                      </button>
                    </div>
                  ) : user?.role === 'teacher' ? (
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => setCurrentView('teacher-dashboard')}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-500/25 transition-all hover:scale-105 flex items-center space-x-3"
                      >
                        <GraduationCap className="w-5 h-5" />
                        <span>Faculty Dashboard</span>
                      </button>
                      <button
                        onClick={() => setCurrentView('teacher-messages')}
                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 flex items-center space-x-3"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>Parent Messages</span>
                      </button>
                      <button
                        onClick={() => setCurrentView('teacher-marks')}
                        className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-purple-500/25 transition-all hover:scale-105 flex items-center space-x-3"
                      >
                        <FileSpreadsheet className="w-5 h-5" />
                        <span>Gradebook</span>
                      </button>
                    </div>
                  ) : user?.role === 'parent' ? (
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => setCurrentView('parent-dashboard')}
                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 flex items-center space-x-3"
                      >
                        <HeartHandshake className="w-5 h-5" />
                        <span>Parent Portal</span>
                      </button>
                      <button
                        onClick={() => setCurrentView('parent-messages')}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-500/25 transition-all hover:scale-105 flex items-center space-x-3"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>Faculty Messages</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCurrentView('profile')}
                      className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-500/25 transition-all hover:scale-105 flex items-center space-x-3"
                    >
                      <span>View Authenticated Profile</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )
                ) : (
                  <>
                    <button
                      onClick={() => setCurrentView('register')}
                      className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/20 transition-all hover:scale-105 flex items-center space-x-3"
                    >
                      <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                      <span>Choose Role & Create Account 🚀</span>
                    </button>
                    <button
                      onClick={() => setCurrentView('login')}
                      className="px-8 py-4 bg-white hover:bg-slate-100 border-2 border-slate-200 text-slate-800 font-bold text-base rounded-2xl shadow-md transition-all hover:scale-105 flex items-center space-x-3"
                    >
                      <span>Sign In to Your Role</span>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </button>
                  </>
                )}
              </div>
            </section>

            {/* Roles Breakdown with Scroll Animation */}
            <section className="animate-fade-up">
              <RoleCard />
            </section>

            {/* Architecture & Tech Stack with Scroll Animation */}
            <section className="animate-fade-up">
              <ArchitectureSection />
            </section>

            {/* Roadmap Progress with Scroll Animation */}
            <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden animate-fade-up">
              <div className="absolute -right-24 -top-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                <div className="flex items-center space-x-3 text-indigo-400">
                  <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30">
                    <Rocket className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-white">Project Roadmap Progress</h3>
                </div>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  All foundational modules (Students, Teachers, Parents, Messaging, and Admin Center) are fully implemented, tested, and active!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start space-x-4 p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-lg hover:border-emerald-400 transition-colors">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Student Module
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40">Complete</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">Profile, Attendance tracking, Homework submissions, and Marks gradebook.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-lg hover:border-emerald-400 transition-colors">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Teacher Module
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40">Complete</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">Profile, Rosters, Daily Attendance Register, Homework Management, and Gradebook.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-lg hover:border-emerald-400 transition-colors">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Parent & Messaging
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40">Complete</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">ParentProfile, academic tracking, direct teacher chat, and centralized alerts.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-lg hover:border-emerald-400 transition-colors">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Admin Module
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40">Complete</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">Users, roster assignments, classes, sections, subjects, and audit tracking.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

      </main>

      {/* Footer */}
      <Footer onNavigate={navigate} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
