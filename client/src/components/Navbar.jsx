import React from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import {
  GraduationCap,
  LogIn,
  UserPlus,
  User,
  LogOut,
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  Award,
  Users,
  FileSpreadsheet,
  HeartHandshake,
  MessageSquare,
  Sparkles,
  Search,
  Building,
  Inbox
} from 'lucide-react';


const roleBadges = {
  student: 'bg-blue-100 text-blue-800 border-blue-200',
  teacher: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  parent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  school: 'bg-teal-100 text-teal-800 border-teal-200',
  admin: 'bg-amber-100 text-amber-800 border-amber-200'
};

const Navbar = ({ backendConnected, isChecking, currentView, onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-3 text-left focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                EduSetu
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Step 7B • Notifications Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Education Communication Platform</p>
          </div>
        </button>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center space-x-1 text-xs font-semibold">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentView === 'home' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Overview
          </button>

          {/* Phase 5: Find Tutors Marketplace */}
          <button
            onClick={() => onNavigate('find-tutors')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              currentView === 'find-tutors' || currentView.startsWith('tutor-') || currentView === 'compare-tutors'
                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shadow-2xs'
                : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-emerald-600" />
            <span>Find Tutors</span>
          </button>

          {/* Student Links */}
          {isAuthenticated && user?.role === 'student' && (
            <>
              <button
                onClick={() => onNavigate('student-dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentView === 'student-dashboard' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('student-attendance')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentView === 'student-attendance' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Attendance</span>
              </button>

              <button
                onClick={() => onNavigate('student-homework')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentView === 'student-homework' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
                <span>Homework</span>
              </button>

              <button
                onClick={() => onNavigate('student-marks')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentView === 'student-marks' ? 'bg-purple-50 text-purple-600 font-bold' : 'text-slate-600 hover:text-purple-600'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-purple-600" />
                <span>Marks</span>
              </button>

              <button onClick={() => onNavigate('student-classes')} className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${currentView === 'student-classes' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-600 hover:text-amber-600'}`}>
                <CalendarCheck className="w-3.5 h-3.5 text-amber-600" /><span>My Classes</span>
              </button>
              <button onClick={() => onNavigate('student-ai')} className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${currentView === 'student-ai' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:text-indigo-600'}`}><Sparkles className="w-3.5 h-3.5 text-indigo-600" /><span>AI Learning</span></button>
              <button onClick={() => onNavigate('my-tutor-requests')} className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${currentView === 'my-tutor-requests' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:text-teal-600'}`}><Inbox className="w-3.5 h-3.5 text-teal-600" /><span>Tutor Bookings</span></button>
              <button onClick={() => onNavigate('my-bookings')} className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${currentView === 'my-bookings' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:text-indigo-600'}`}><CalendarCheck className="w-3.5 h-3.5 text-indigo-600" /><span>My Classes</span></button>
            </>
          )}

          {/* Teacher Links */}
          {isAuthenticated && user?.role === 'teacher' && (
            <>
              <button
                onClick={() => onNavigate('teacher-dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentView === 'teacher-dashboard' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('teacher-students')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentView === 'teacher-students' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>My Students</span>
              </button>

              <button
                onClick={() => onNavigate('teacher-attendance')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentView === 'teacher-attendance' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Attendance</span>
              </button>

              <button
                onClick={() => onNavigate('teacher-homework')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentView === 'teacher-homework' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                <span>Homework</span>
              </button>

              <button
                onClick={() => onNavigate('teacher-classes')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${currentView === 'teacher-classes' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-600 hover:text-amber-600'}`}
              >
                <CalendarCheck className="w-3.5 h-3.5 text-amber-600" /><span>Classes</span>
              </button>

              <button
                onClick={() => onNavigate('teacher-tutor-profile')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${currentView === 'teacher-tutor-profile' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:text-indigo-600'}`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /><span>Tutor Profile</span>
              </button>

              <button
                onClick={() => onNavigate('teacher-tutor-requests')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${currentView === 'teacher-tutor-requests' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:text-teal-600'}`}
              >
                <Inbox className="w-3.5 h-3.5 text-teal-600" /><span>Requests</span>
              </button>
              <button onClick={() => onNavigate('my-bookings')} className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${currentView === 'my-bookings' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:text-indigo-600'}`}><CalendarCheck className="w-3.5 h-3.5 text-indigo-600" /><span>Bookings</span></button>
            </>
          )}

          {/* Parent Links */}
          {isAuthenticated && user?.role === 'parent' && (
            <>
              <button
                onClick={() => onNavigate('parent-dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentView === 'parent-dashboard' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Parent Portal</span>
              </button>

              <button
                onClick={() => onNavigate('parent-messages')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentView === 'parent-messages' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Messages</span>
              </button>

              <button onClick={() => onNavigate('my-tutor-requests')} className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${currentView === 'my-tutor-requests' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:text-teal-600'}`}>
                <Inbox className="w-3.5 h-3.5 text-teal-600" /><span>Tutor Bookings</span>
              </button>
              <button onClick={() => onNavigate('my-bookings')} className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${currentView === 'my-bookings' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:text-indigo-600'}`}><CalendarCheck className="w-3.5 h-3.5 text-indigo-600" /><span>My Classes</span></button>
            </>
          )}

          {isAuthenticated && user?.role === 'school' && (
            <button
              onClick={() => onNavigate('school-portal')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                currentView === 'school-portal' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>Institution Portal</span>
            </button>
          )}

          {/* Admin Links */}
          {isAuthenticated && user?.role === 'admin' && (
            <>
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentView === 'admin-dashboard' ? 'bg-indigo-900 text-white font-bold shadow-xs' : 'text-indigo-900 hover:bg-indigo-50 font-bold'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-500" />
                <span>Admin Console</span>
              </button>
              <button onClick={() => onNavigate('admin-marketplace')} className={`px-3 py-1.5 rounded-lg transition-colors ${currentView === 'admin-marketplace' ? 'bg-amber-50 text-amber-800 font-bold' : 'text-slate-600 hover:text-amber-700'}`}>Marketplace</button>
            </>
          )}


          {isAuthenticated && (
            <button
              onClick={() => onNavigate('profile')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentView === 'profile' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              My Account
            </button>
          )}
        </div>

        {/* Right Section: Notification Bell, Auth Controls & Server Status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Server Status Pill */}
          <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
            <span className="relative flex h-2 w-2">
              {isChecking ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              ) : backendConnected ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              ) : (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isChecking ? 'bg-amber-500' : backendConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}></span>
            </span>
            <span>{backendConnected ? 'API Online' : 'API Offline'}</span>
          </div>

          {/* Global Notification Bell (Authenticated Users) */}
          {isAuthenticated && <NotificationBell />}

          {/* Auth Buttons */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (user.role === 'student') onNavigate('student-dashboard');
                  else if (user.role === 'teacher') onNavigate('teacher-dashboard');
                  else if (user.role === 'parent') onNavigate('parent-dashboard');
                  else if (user.role === 'school') onNavigate('school-portal');
                  else onNavigate('profile');
                }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-xs font-semibold text-slate-800"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                  roleBadges[user.role] || 'bg-slate-100'
                }`}>
                  {user.role}
                </span>
              </button>

              <button
                onClick={() => {
                  logout();
                  onNavigate('home');
                }}
                title="Sign Out"
                className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('login')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  currentView === 'login'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => onNavigate('register')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  currentView === 'register'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Register</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};

export default Navbar;
