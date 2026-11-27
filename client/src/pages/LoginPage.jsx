import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { verifyAdminSecretPassword } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import GoogleAuthButton from '../components/ui/GoogleAuthButton';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  CheckCircle2,
  Users,
  Sparkles
} from 'lucide-react';

const accountTypes = [
  {
    id: 'student',
    title: 'Student',
    emoji: '👨‍🎓',
    icon: GraduationCap,
    desc: 'Access your classroom, homework, exams, and AI study assistant'
  },
  {
    id: 'teacher',
    title: 'Teacher',
    emoji: '👨‍🏫',
    icon: BookOpen,
    desc: 'Manage classes, attendance, grading, and parent communications'
  },
  {
    id: 'parent',
    title: 'Parent',
    emoji: '👨‍👩‍👧',
    icon: HeartHandshake,
    desc: "Monitor your child's real-time progress and school updates"
  },
  {
    id: 'admin',
    title: 'Institutional Admin',
    emoji: '🛡️',
    icon: ShieldCheck,
    desc: 'Institution governance, marketplace audits, and user approvals'
  }
];

const LoginPage = ({
  onLoginSuccess,
  onNavigateToRegister,
  initialRole = null
}) => {
  const { login, adminLogin, loginWithGoogle, authError, setAuthError } = useAuth();
  const toast = useToast();

  const [selectedRole, setSelectedRole] = useState(initialRole || 'student');
  const [isAdminMode, setIsAdminMode] = useState(initialRole === 'admin');
  const [adminVerificationToken, setAdminVerificationToken] = useState(null);
  const [verificationPassword, setVerificationPassword] = useState('');
  const [adminVerifyError, setAdminVerifyError] = useState(null);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [localErrors, setLocalErrors] = useState({});

  const handleRoleChange = (roleId) => {
    if (roleId === 'admin') {
      setIsAdminMode(true);
      setSelectedRole('admin');
    } else {
      setIsAdminMode(false);
      setSelectedRole(roleId);
      setAdminVerificationToken(null);
    }
    if (authError) setAuthError(null);
    setLocalErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (localErrors[name]) setLocalErrors((prev) => ({ ...prev, [name]: '' }));
    if (authError) setAuthError(null);
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
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

  const handleAdminVerifySubmit = async (e) => {
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
      toast.success('Admin passkey verified. Please enter your credentials.');
    } else {
      setAdminVerifyError(result.error || 'Invalid admin verification password.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    let result;

    if (isAdminMode) {
      result = await adminLogin(formData.email.trim(), formData.password, adminVerificationToken);
    } else {
      result = await login(formData.email.trim(), formData.password);
    }

    setIsSubmitting(false);

    if (result.success) {
      toast.success(`Welcome back, ${result.user?.name || 'User'}!`);
      if (onLoginSuccess) onLoginSuccess(result.user);
    } else {
      toast.error(result.error || 'Sign in failed');
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    const result = await loginWithGoogle(selectedRole || 'student');
    if (result.redirected) {
      return;
    }
    setIsGoogleSubmitting(false);
    if (result.success) {
      toast.success(`Signed in with Google as ${result.user?.name || 'User'}`);
      if (onLoginSuccess) onLoginSuccess(result.user);
    } else {
      toast.error(result.error || 'Google sign-in failed');
    }
  };

  const activeRoleMeta = accountTypes.find((a) => a.id === selectedRole) || accountTypes[0];

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4 sm:px-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* LEFT SHOWCASE PANEL (5 COLUMNS ON DESKTOP) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow circles */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand */}
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>EduSetu Unified SaaS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Education Platform for Modern Institutions.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Empowering students, educators, and guardians with real-time academic workflows and AI assistance.
            </p>
          </div>

          {/* Live Platform Highlights */}
          <div className="relative z-10 space-y-3.5 my-8">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Verified Academic Community</p>
                <p className="text-2xs text-slate-400">Institutional rosters with strict role boundaries</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Secure OTP & Google Auth</p>
                <p className="text-2xs text-slate-400">End-to-end token verification via Brevo & Firebase</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Full Privacy & Compliance</p>
                <p className="text-2xs text-slate-400">Encrypted communications & parental oversight</p>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-2xs text-slate-400 font-medium">
            <span>© 2026 EduSetu Platform</span>
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Systems Operational
            </span>
          </div>
        </div>

        {/* RIGHT FORM PANEL (7 COLUMNS ON DESKTOP) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div className="space-y-6 max-w-md mx-auto w-full">
            
            {/* Role Switcher Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sign in as</span>
                {isAdminMode && (
                  <Badge variant="purple" size="sm">Admin Protected</Badge>
                )}
              </div>

              <div className="grid grid-cols-4 p-1 bg-slate-100 rounded-2xl gap-1">
                {accountTypes.map((acc) => {
                  const isSelected = selectedRole === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleRoleChange(acc.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span className="text-sm">{acc.emoji}</span>
                      <span className="truncate">{acc.title.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Header Titles */}
            <div className="text-left">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {activeRoleMeta.title} Portal
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {activeRoleMeta.desc}
              </p>
            </div>

            {/* Server Error Notice */}
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Authentication Notice:</span> {authError}
                </div>
              </div>
            )}

            {/* ADMIN GATE: Passkey Entry Screen */}
            {isAdminMode && !adminVerificationToken ? (
              <form onSubmit={handleAdminVerifySubmit} className="space-y-4 pt-2">
                <div className="p-4 bg-purple-50 border border-purple-200/80 rounded-2xl text-xs text-purple-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-purple-900">
                    <KeyRound className="w-4 h-4 text-purple-700" />
                    <span>Administrator Master Gate</span>
                  </div>
                  <p className="text-purple-800/80">
                    Institutional governance accounts require master authorization passkey before proceeding.
                  </p>
                </div>

                <Input
                  label="Master Verification Password"
                  type={showAdminSecret ? 'text' : 'password'}
                  placeholder="Enter administrator master secret"
                  value={verificationPassword}
                  onChange={(e) => {
                    setVerificationPassword(e.target.value);
                    if (adminVerifyError) setAdminVerifyError(null);
                  }}
                  error={adminVerifyError}
                  icon={Lock}
                  iconRight={
                    <button
                      type="button"
                      onClick={() => setShowAdminSecret(!showAdminSecret)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAdminSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full bg-purple-600 hover:bg-purple-700 focus-visible:ring-purple-500"
                  isLoading={isVerifyingAdmin}
                >
                  Verify Master Gate
                </Button>
              </form>
            ) : (
              /* STANDARD CREDENTIALS FORM */
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* One-Click Google Auth for Non-Admin */}
                {!isAdminMode && (
                  <>
                    <GoogleAuthButton
                      onClick={handleGoogleLogin}
                      disabled={isSubmitting}
                      isLoading={isGoogleSubmitting}
                      label="Continue with Google"
                    />

                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-2xs uppercase">
                        <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">Or email credentials</span>
                      </div>
                    </div>
                  </>
                )}

                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  placeholder="name@school.edu"
                  value={formData.email}
                  onChange={handleChange}
                  error={localErrors.email}
                  icon={Mail}
                  required
                />

                <Input
                  label="Account Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={localErrors.password}
                  icon={Lock}
                  iconRight={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isSubmitting}
                  iconRight={ArrowRight}
                >
                  Sign In to {activeRoleMeta.title}
                </Button>
              </form>
            )}

          </div>

          {/* Bottom Switch to Register */}
          <div className="pt-6 mt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>Don't have an institutional account? </span>
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
            >
              Create Account
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LoginPage;
