import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { verifyAdminSecretPassword } from '../services/authService';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  KeyRound,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  Sparkles
} from 'lucide-react';

const accountTypes = [
  {
    id: 'student',
    title: 'Student',
    emoji: '👨‍🎓',
    icon: GraduationCap,
    bgBadge: 'bg-blue-50 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-100 text-blue-700',
    borderHover: 'hover:border-blue-500 hover:shadow-blue-500/10',
    desc: 'Access your classes, attendance, homework and results'
  },
  {
    id: 'teacher',
    title: 'Teacher',
    emoji: '👨‍🏫',
    icon: BookOpen,
    bgBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconBg: 'bg-indigo-100 text-indigo-700',
    borderHover: 'hover:border-indigo-500 hover:shadow-indigo-500/10',
    desc: 'Manage students, attendance, homework and marks'
  },
  {
    id: 'parent',
    title: 'Parent',
    emoji: '👨‍👩‍👧',
    icon: HeartHandshake,
    bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-700',
    borderHover: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
    desc: "Track your child's academic progress"
  },
  {
    id: 'admin',
    title: 'Admin',
    emoji: '🛡️',
    icon: ShieldCheck,
    bgBadge: 'bg-purple-50 text-purple-700 border-purple-200',
    iconBg: 'bg-purple-100 text-purple-700',
    borderHover: 'hover:border-purple-500 hover:shadow-purple-500/10',
    desc: 'Manage EduSetu users, academics and system settings'
  }
];

const LoginPage = ({ onNavigateToRegister, onLoginSuccess, initialAdminMode = false }) => {
  const { login, adminLogin, authError, setAuthError } = useAuth();

  // Screen State: 'select-type' | 'role-login' | 'admin-verify' | 'admin-login'
  const [screen, setScreen] = useState(initialAdminMode ? 'admin-verify' : 'select-type');
  const [selectedRole, setSelectedRole] = useState('student');

  // Admin Verification Password State
  const [verificationPassword, setVerificationPassword] = useState('');
  const [adminVerificationToken, setAdminVerificationToken] = useState(null);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [adminVerifyError, setAdminVerifyError] = useState(null);

  // Credentials State
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localErrors, setLocalErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (localErrors[name]) {
      setLocalErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (authError) setAuthError(null);
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email or username is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Screen 1: Select Account Type
  const handleSelectAccountType = (roleId) => {
    if (roleId === 'admin') {
      setScreen('admin-verify');
      setAdminVerifyError(null);
    } else {
      setSelectedRole(roleId);
      setScreen('role-login');
    }
    if (authError) setAuthError(null);
  };

  // Screen 2: Submit Admin Verification Password
  const handleAdminVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verificationPassword.trim()) {
      setAdminVerifyError('Admin verification password is required');
      return;
    }

    setIsVerifyingAdmin(true);
    setAdminVerifyError(null);

    const result = await verifyAdminSecretPassword(verificationPassword.trim());
    setIsVerifyingAdmin(false);

    if (result.success && result.data?.adminVerificationToken) {
      setAdminVerificationToken(result.data.adminVerificationToken);
      setScreen('admin-login');
      setAdminVerifyError(null);
      if (authError) setAuthError(null);
    } else {
      setAdminVerifyError(result.error || 'Invalid admin verification.');
    }
  };

  // Screen 3: Submit Standard or Admin Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    let result;

    if (screen === 'admin-login') {
      result = await adminLogin(formData.email.trim(), formData.password, adminVerificationToken);
    } else {
      result = await login(formData.email.trim(), formData.password);
    }

    setIsSubmitting(false);

    if (result.success) {
      if (onLoginSuccess) onLoginSuccess(result.user);
    }
  };

  const handleQuickFill = (roleEmail, rolePass = 'Password123') => {
    setFormData({ email: roleEmail, password: rolePass });
    setLocalErrors({});
    if (authError) setAuthError(null);
  };

  const currentRoleMeta = accountTypes.find((a) => a.id === selectedRole) || accountTypes[0];

  return (
    <div className="max-w-2xl mx-auto my-6 px-4 animate-fadeIn">
      
      {/* SCREEN 1: WHO ARE YOU SIGNING IN AS? */}
      {screen === 'select-type' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          
          <div className="text-center space-y-2 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome Back to EduSetu
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Choose your account type to continue
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold text-indigo-700">
                Who are you signing in as?
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accountTypes.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleSelectAccountType(acc.id)}
                  className={`group p-5 rounded-3xl border border-slate-200/90 bg-slate-50/50 hover:bg-white text-left transition-all duration-200 shadow-2xs hover:shadow-lg ${acc.borderHover} flex flex-col justify-between space-y-4 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className={`w-12 h-12 rounded-2xl ${acc.iconBg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xl">
                      {acc.emoji}
                    </span>
                  </div>

                  <div className="space-y-1 flex-1">
                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                      <span>{acc.title} {acc.emoji}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {acc.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="font-bold text-indigo-600 hover:text-indigo-700 underline"
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: ADMIN VERIFICATION */}
      {screen === 'admin-verify' && (
        <div className="max-w-md mx-auto bg-white border border-purple-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-md shadow-purple-500/20">
              <KeyRound className="w-6 h-6 text-amber-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Admin Verification
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-purple-950 bg-purple-50 border border-purple-200 p-2.5 rounded-xl">
              Admin access requires additional verification.
            </p>
          </div>

          {/* Error Banner */}
          {adminVerifyError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-800 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Verification Failed</p>
                <p className="text-rose-700">{adminVerifyError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleAdminVerificationSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Admin Verification Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
                <input
                  type={showAdminSecret ? 'text' : 'password'}
                  placeholder="Enter admin verification password"
                  value={verificationPassword}
                  onChange={(e) => {
                    setVerificationPassword(e.target.value);
                    if (adminVerifyError) setAdminVerifyError(null);
                  }}
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 bg-purple-50/40 border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminSecret(!showAdminSecret)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showAdminSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isVerifyingAdmin}
                className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isVerifyingAdmin ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setScreen('select-type');
                  setAdminVerifyError(null);
                }}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back to Account Type Selection</span>
              </button>
            </div>
          </form>

        </div>
      )}

      {/* SCREEN 3: ROLE LOGIN (STUDENT / TEACHER / PARENT) */}
      {screen === 'role-login' && (
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Top Bar with Back Button & Role Badge */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                setScreen('select-type');
                if (authError) setAuthError(null);
              }}
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center space-x-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Account Type Selection</span>
            </button>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center space-x-1 ${currentRoleMeta.bgBadge}`}>
              <span>{currentRoleMeta.emoji}</span>
              <span>{currentRoleMeta.title}</span>
            </span>
          </div>

          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className={`w-12 h-12 rounded-2xl ${currentRoleMeta.iconBg} flex items-center justify-center mx-auto shadow-md`}>
              <currentRoleMeta.icon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {currentRoleMeta.title} Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Enter your credentials to access your {currentRoleMeta.title.toLowerCase()} portal.
            </p>
          </div>

          {/* Server Auth Error Banner */}
          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-800 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Failed</p>
                <p className="text-rose-700">{authError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email / Username */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Email or Username *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@school.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    localErrors.email ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
              {localErrors.email && (
                <p className="text-xs text-rose-600 font-medium pl-1">{localErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Account Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    localErrors.password ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {localErrors.password && (
                <p className="text-xs text-rose-600 font-medium pl-1">{localErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in as {currentRoleMeta.title}...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {currentRoleMeta.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Helper */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Quick Test</p>
            <button
              type="button"
              onClick={() => handleQuickFill(`${selectedRole}@edusetu.org`, 'Password123')}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 text-xs font-semibold text-left truncate flex items-center justify-between"
            >
              <span>{currentRoleMeta.emoji} Fill Demo {currentRoleMeta.title} Account</span>
              <span className="text-[10px] text-slate-400 font-mono">Password123</span>
            </button>
          </div>

          {/* Footer switch to Register */}
          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="font-bold text-indigo-600 hover:text-indigo-700 underline"
            >
              Create Account
            </button>
          </div>

        </div>
      )}

      {/* SCREEN 4: ADMIN LOGIN */}
      {screen === 'admin-login' && (
        <div className="max-w-md mx-auto bg-white border border-purple-300 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          
          {/* Top Bar with Back Button & Verified Badge */}
          <div className="flex items-center justify-between pb-2 border-b border-purple-100">
            <button
              type="button"
              onClick={() => {
                setScreen('select-type');
                if (authError) setAuthError(null);
              }}
              className="text-xs font-bold text-slate-600 hover:text-purple-700 flex items-center space-x-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Account Type Selection</span>
            </button>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Verified Admin</span>
            </span>
          </div>

          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Admin Login
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Enter your institutional administrator credentials
            </p>
          </div>

          {/* Server Auth Error Banner */}
          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-800 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Failed</p>
                <p className="text-rose-700">{authError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email / Username */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Email or Username *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  placeholder="admin@school.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    localErrors.email ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
              {localErrors.email && (
                <p className="text-xs text-rose-600 font-medium pl-1">{localErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Account Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    localErrors.password ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {localErrors.password && (
                <p className="text-xs text-rose-600 font-medium pl-1">{localErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-sm rounded-xl shadow-md shadow-purple-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Login as Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Test Credential Helpers */}
          <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900">Quick Test</p>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@edusetu.org', 'Password123')}
              className="w-full px-2.5 py-1.5 bg-white border border-purple-200 hover:border-purple-400 rounded-lg text-purple-900 text-xs font-bold text-left truncate flex items-center justify-between"
            >
              <span>🛡️ Fill Demo Administrator Account</span>
              <span className="text-[10px] text-purple-400 font-mono">Password123</span>
            </button>
          </div>

          {/* Footer switch to Register */}
          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="font-bold text-indigo-600 hover:text-indigo-700 underline"
            >
              Create Account
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default LoginPage;
