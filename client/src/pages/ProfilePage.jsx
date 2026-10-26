import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { testRoleEndpoint } from '../services/authService';
import {
  User,
  Mail,
  Shield,
  Phone,
  Calendar,
  LogOut,
  Key,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const roleColors = {
  student: 'bg-blue-100 text-blue-800 border-blue-200',
  teacher: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  parent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  admin: 'bg-amber-100 text-amber-800 border-amber-200'
};

const ProfilePage = ({ onLogout }) => {
  const { user, token, logout } = useAuth();
  const [roleTestResult, setRoleTestResult] = useState(null);
  const [isTestingRole, setIsTestingRole] = useState(false);

  const handleTestRole = async (targetRole) => {
    setIsTestingRole(true);
    setRoleTestResult(null);
    const result = await testRoleEndpoint(targetRole);
    setRoleTestResult({ targetRole, ...result });
    setIsTestingRole(false);
  };

  const handleLogoutClick = () => {
    logout();
    if (onLogout) onLogout();
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto my-6 px-4 space-y-6">
      
      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Header with Role Badge & Logout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                  roleColors[user.role] || 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 rounded-xl transition-colors self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">User ID</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">#{user.id}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Email Address</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{user.email}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Assigned Role</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">{user.role}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Phone</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{user.phone || 'Not provided'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Account Status</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">Active</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <div className="p-2 bg-slate-200 text-slate-700 rounded-lg shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Registered On</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active session'}
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Role-Based Access Control (RBAC) Live Test Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Live Role-Based Authorization (RBAC) Tester</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Test how the backend <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">authorizeRoles()</code> middleware validates your current role (<strong className="capitalize text-slate-800">{user.role}</strong>).
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleTestRole('admin')}
            disabled={isTestingRole}
            className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            <span>Test Admin-Only Route (/api/auth/test-role/admin)</span>
          </button>

          <button
            onClick={() => handleTestRole('teacher')}
            disabled={isTestingRole}
            className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold text-indigo-800 transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            <span>Test Teacher/Admin Route (/api/auth/test-role/teacher)</span>
          </button>
        </div>

        {/* Test Result Display */}
        {roleTestResult && (
          <div className={`p-4 rounded-xl border text-xs animate-fadeIn ${
            roleTestResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center space-x-2 font-bold mb-1">
              {roleTestResult.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>HTTP 200 OK — Authorized</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>HTTP {roleTestResult.status || 403} Forbidden — Access Denied</span>
                </>
              )}
            </div>
            <p className="text-[11px] font-mono">
              {roleTestResult.message || roleTestResult.data?.message}
            </p>
          </div>
        )}
      </div>

      {/* JWT Token Inspector */}
      <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold">
            <Key className="w-4 h-4" />
            <span>Active JWT Session Token</span>
          </div>
          <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-full">Bearer Format</span>
        </div>
        <p className="text-slate-400 break-all text-[11px] bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          {token}
        </p>
      </div>

    </div>
  );
};

export default ProfilePage;
