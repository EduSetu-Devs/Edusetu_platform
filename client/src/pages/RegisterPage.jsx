import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  BookOpen,
  HeartHandshake,
  School,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Phone,
  UserCheck,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';

const roleOptions = [
  {
    id: 'student',
    title: 'Student',
    tag: 'Learner Portal',
    icon: GraduationCap,
    color: 'blue',
    borderHover: 'hover:border-blue-500 hover:shadow-blue-500/10',
    bgBadge: 'bg-blue-50 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-100 text-blue-700',
    description: 'Access your class schedules, daily homework, exam marks, and academic notices.'
  },
  {
    id: 'teacher',
    title: 'Teacher / Faculty',
    tag: 'Faculty Portal',
    icon: BookOpen,
    color: 'indigo',
    borderHover: 'hover:border-indigo-500 hover:shadow-indigo-500/10',
    bgBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconBg: 'bg-indigo-100 text-indigo-700',
    description: 'Manage assigned class rosters, attendance registers, assignments, and parent communication.'
  },
  {
    id: 'parent',
    title: 'Parent / Guardian',
    tag: 'Parent Portal',
    icon: HeartHandshake,
    color: 'emerald',
    borderHover: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
    bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-700',
    description: "Monitor your ward's attendance, report cards, homework, and chat directly with teachers."
  },
  {
    id: 'school',
    title: 'School / Institution',
    tag: 'Institution Portal',
    icon: School,
    color: 'teal',
    borderHover: 'hover:border-teal-500 hover:shadow-teal-500/10',
    bgBadge: 'bg-teal-50 text-teal-700 border-teal-200',
    iconBg: 'bg-teal-100 text-teal-700',
    description: 'Create an institution profile and discover, review, and shortlist qualified teachers.'
  },
  {
    id: 'admin',
    title: 'Administrator',
    tag: 'Governance',
    icon: ShieldCheck,
    color: 'purple',
    borderHover: 'hover:border-purple-500 hover:shadow-purple-500/10',
    bgBadge: 'bg-purple-50 text-purple-700 border-purple-200',
    iconBg: 'bg-purple-100 text-purple-700',
    description: 'Institutional governance, user accounts, rosters, classes, sections, and curriculum subjects.'
  }
];

const RegisterPage = ({ onNavigateToLogin, onRegisterSuccess }) => {
  const { register, authError, setAuthError } = useAuth();

  // Step state: 'role-select' | 'form'
  const [step, setStep] = useState('role-select');
  const [selectedRole, setSelectedRole] = useState('student');
  const [showAdminNotice, setShowAdminNotice] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localErrors, setLocalErrors] = useState({});

  // Handle Role Selection
  const handleSelectRole = (roleId) => {
    if (roleId === 'admin') {
      setShowAdminNotice(true);
      return;
    }

    setSelectedRole(roleId);
    setStep('form');
    if (authError) setAuthError(null);
  };

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
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!['student', 'teacher', 'parent', 'school'].includes(selectedRole)) {
      errors.role = 'Please select a valid registration role';
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await register({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: selectedRole,
      phone: formData.phone.trim()
    });
    setIsSubmitting(false);

    if (result.success) {
      if (onRegisterSuccess) onRegisterSuccess(result.user);
    }
  };

  const currentRoleMeta = roleOptions.find((r) => r.id === selectedRole) || roleOptions[0];

  return (
    <div className="max-w-3xl mx-auto my-6 px-4 animate-fadeIn">
      
      {/* STEP 1: ROLE SELECTION SCREEN */}
      {step === 'role-select' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Which type of account do you want to create?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Select your role below to personalize your EduSetu experience with the appropriate tools and access permissions.
            </p>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectRole(opt.id)}
                  className={`group p-5 rounded-3xl border border-slate-200/90 bg-slate-50/50 hover:bg-white text-left transition-all duration-200 shadow-2xs hover:shadow-lg ${opt.borderHover} flex flex-col justify-between space-y-4 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className={`w-12 h-12 rounded-2xl ${opt.iconBg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${opt.bgBadge}`}>
                      {opt.tag}
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                      <span>{opt.title}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Sign In switch */}
          <div className="pt-4 text-center text-xs text-slate-500 border-t border-slate-100">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-bold text-indigo-600 hover:text-indigo-700 underline"
            >
              Sign In to EduSetu
            </button>
          </div>

        </div>
      )}

      {/* STEP 2: REGISTRATION FORM FOR SELECTED ROLE */}
      {step === 'form' && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
          
          {/* Top Bar with Back Button & Role Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                setStep('role-select');
                if (authError) setAuthError(null);
              }}
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center space-x-1.5 transition-colors group px-2.5 py-1.5 rounded-xl hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Change Role</span>
            </button>

            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${currentRoleMeta.bgBadge}`}>
              <currentRoleMeta.icon className="w-3.5 h-3.5" />
              <span>{currentRoleMeta.title}</span>
            </span>
          </div>

          {/* Header */}
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Create {currentRoleMeta.title} Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Please enter your details to set up your account profile.
            </p>
          </div>

          {/* Server Auth Error Banner */}
          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-800 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Registration Error</p>
                <p className="text-rose-700">{authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Aarav Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    localErrors.name ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
              {localErrors.name && (
                <p className="text-xs text-rose-600 font-medium pl-1">{localErrors.name}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. user@edusetu.org"
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

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Password (Min 8 Chars) *</label>
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

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      localErrors.confirmPassword ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                </div>
                {localErrors.confirmPassword && (
                  <p className="text-xs text-rose-600 font-medium pl-1">{localErrors.confirmPassword}</p>
                )}
              </div>

            </div>

            {/* Phone (Optional) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering {currentRoleMeta.title}...</span>
                </>
              ) : (
                <>
                  <span>Create {currentRoleMeta.title} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Footer switch to Login */}
          <div className="pt-3 text-center text-xs text-slate-500 border-t border-slate-100">
            <span>Already registered? </span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-bold text-indigo-600 hover:text-indigo-700 underline"
            >
              Sign In
            </button>
          </div>

        </div>
      )}

      {/* ADMIN ACCOUNT SECURITY MODAL */}
      {showAdminNotice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-6 text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-8 h-8 text-purple-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">
                Administrator Policy
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-purple-900 bg-purple-50 border border-purple-200 p-3 rounded-2xl">
                Admin accounts can only be created by an existing administrator.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed pt-1">
                To maintain institution governance, privacy, and system security, administrative privileges cannot be created through public self-registration.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAdminNotice(false);
                  onNavigateToLogin(true);
                }}
                className="w-full py-2.5 px-4 bg-indigo-900 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Sign In as Existing Administrator</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAdminNotice(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Back to Role Selection
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default RegisterPage;
