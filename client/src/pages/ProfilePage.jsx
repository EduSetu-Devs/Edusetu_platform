import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { downloadAccountExport, deleteMyAccount } from '../services/accountService';
import {
  User,
  Mail,
  Shield,
  Phone,
  Calendar,
  LogOut,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock
} from 'lucide-react';

const roleColors = {
  student: 'bg-blue-100 text-blue-800 border-blue-200',
  teacher: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  parent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  admin: 'bg-amber-100 text-amber-800 border-amber-200'
};

const ProfilePage = ({ onLogout }) => {
  const { user, logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [exportError, setExportError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleLogoutClick = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError('');
    setExportMessage('');
    const result = await downloadAccountExport();
    setIsExporting(false);
    if (result.success) {
      setExportMessage('Your data export has been downloaded.');
    } else {
      setExportError(result.error);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setIsDeleting(true);
    const result = await deleteMyAccount({
      password: deletePassword,
      confirmation: deleteConfirmation.trim()
    });
    setIsDeleting(false);

    if (result.success) {
      await logout();
      if (onLogout) onLogout();
    } else {
      setDeleteError(result.error);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto my-6 px-4 space-y-6">

      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">

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

      {/* Privacy & account controls */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Privacy & Account Data</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Download a copy of your personal data or permanently erase your account. See the{' '}
            <a href="/privacy" className="font-bold text-indigo-600 hover:underline">Privacy Policy</a> for details.
          </p>
        </div>

        {exportMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{exportMessage}</span>
          </div>
        )}
        {exportError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{exportError}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'Preparing export...' : 'Download my data'}</span>
          </button>

          {user.role !== 'admin' && (
            <button
              type="button"
              onClick={() => setShowDelete((value) => !value)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>{showDelete ? 'Cancel deletion' : 'Delete my account'}</span>
            </button>
          )}
        </div>

        {showDelete && user.role !== 'admin' && (
          <form onSubmit={handleDelete} className="p-4 sm:p-5 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-4">
            <div className="flex items-start space-x-2.5 text-xs text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                <strong>This is permanent.</strong> Your profile, attendance, submissions, marks, messages, and AI
                history will be deleted. School-required records may be retained only where the law requires it.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-white border border-rose-200 rounded-xl text-xs text-rose-700">{deleteError}</div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-rose-900">Account password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-rose-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-rose-900">
                Type <span className="font-mono">DELETE MY ACCOUNT</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-rose-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <button
              type="submit"
              disabled={isDeleting || !deletePassword || deleteConfirmation.trim() !== 'DELETE MY ACCOUNT'}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>{isDeleting ? 'Deleting...' : 'Permanently delete account'}</span>
            </button>
          </form>
        )}
      </div>

    </div>
  );
};

export default ProfilePage;
