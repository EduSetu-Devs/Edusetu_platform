import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2, Lock } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles, onNavigateToLogin }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user) && onNavigateToLogin) {
      onNavigateToLogin();
    }
  }, [isLoading, isAuthenticated, user, onNavigateToLogin]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (onNavigateToLogin) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Redirecting to sign in...</p>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm text-center space-y-5">
        <div className="w-14 h-14 mx-auto bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-200">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Authentication Required</h3>
          <p className="text-sm text-slate-600 mt-2">
            You must be signed in with a valid JWT session to view this protected page.
          </p>
        </div>
        <button
          onClick={onNavigateToLogin}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-500/20"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  // Check Role Permissions if specified
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl shadow-sm text-center space-y-5">
        <div className="w-14 h-14 mx-auto bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Access Denied (403)</h3>
          <p className="text-sm text-slate-600 mt-2">
            Your role (<strong className="capitalize text-slate-900">{user.role}</strong>) does not have permission to view this resource.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Required roles: {allowedRoles.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
