import React, { useEffect, useState } from 'react';
import { Lock, Mail, ShieldCheck, X } from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ADMIN_EMAIL, validateAdminLoginEmail } from '../utils/adminAuth';

interface AdminLoginModalProps {
  isOpen: boolean;
  googleUserEmail?: string | null;
  isLoggingInGoogle: boolean;
  onGoogleSignIn: () => Promise<void>;
  onVerifiedAdminEmail: (email: string) => void;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  googleUserEmail,
  isLoggingInGoogle,
  onGoogleSignIn,
  onVerifiedAdminEmail,
  onClose,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateAdminLoginEmail(emailInput, ADMIN_EMAIL);
    if (!check.ok) {
      setErrorMsg(check.error);
      return;
    }
    setErrorMsg(null);
    onVerifiedAdminEmail(check.email);
    setEmailInput('');
    onClose();
  };

  const handleGoogleClick = async () => {
    setErrorMsg(null);
    try {
      await onGoogleSignIn();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google sign-in failed.');
    }
  };

  const nonAdminGoogleSignedIn =
    Boolean(googleUserEmail) &&
    googleUserEmail!.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px] print:hidden"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-[#FAF6DD] px-5 py-4">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 rounded-lg bg-[#D8C136] p-1.5 text-slate-950">
              <Lock className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="admin-login-title" className="text-base font-bold text-slate-950">
                Admin Login
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Sign in with the authorized administrator email to unlock Manage Data, Draft to
                Email, and slide layout controls.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Admin Login modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/80 hover:text-slate-900 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {nonAdminGoogleSignedIn && (
            <div
              role="alert"
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            >
              Currently signed in to Google as <strong>{googleUserEmail}</strong>, which is not
              authorized for Admin email drafting.
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
            >
              {errorMsg}
            </div>
          )}

          {/* Direct Email Verification */}
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <label
                htmlFor="admin-login-email"
                className="block text-xs font-bold text-slate-800 mb-1"
              >
                Authorized Email Address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="admin-login-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="name@company.com"
                  autoComplete="email"
                  autoFocus
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#C7AC2D] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#141A21] px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 text-[#D8C136]" aria-hidden="true" />
              <span>Verify Admin Email</span>
            </button>
          </form>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200" />
            <span className="mx-3 shrink text-[11px] font-medium text-slate-400">
              or use Google Sign-In
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <div className="flex justify-center">
            <GoogleSignInButton
              onClick={handleGoogleClick}
              disabled={isLoggingInGoogle}
              label={isLoggingInGoogle ? 'Signing in...' : 'Sign in with Google'}
            />
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            Standard viewers can view all report pages and export PDF or Excel workbooks without
            signing in.
          </p>
        </div>
      </div>
    </div>
  );
};
