'use client';

/**
 * Aesthetic SEO Keyword CRM Login Screen
 * Ultra-fast, minimal, zero-fluff login screen.
 * Standard native cursor, clean paper palette (#F4F1EC), ink panel (#0E0E0E),
 * direct credentials and Google sign-in options. Zero fabricated data.
 */

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('editor@aestheticseo.io');
  const [password, setPassword] = useState('HarleySt_2026!');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setFieldError('Email and password are required.');
      return;
    }
    if (cleanEmail.length > 128 || password.length > 128) {
      setFieldError('Input exceeds maximum allowed length.');
      return;
    }

    setLoading(true);

    try {
      const targetCallback = callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
        ? callbackUrl
        : '/';

      const result = await signIn('credentials', {
        username: cleanEmail,
        password,
        callbackUrl: targetCallback,
        redirect: false,
      });

      if (result?.error) {
        setFieldError(
          result.error === 'CredentialsSignin'
            ? 'Incorrect email or password.'
            : result.error
        );
        setLoading(false);
      } else {
        // Enforce strictly relative path navigation so it never redirects to localhost
        let destination = targetCallback;
        if (result?.url) {
          try {
            const parsed = new URL(result.url, window.location.origin);
            destination = parsed.pathname + parsed.search;
          } catch {
            destination = targetCallback;
          }
        }
        window.location.href = destination || '/';
      }
    } catch {
      setFieldError('Connection interrupted. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFieldError('');
    setGoogleLoading(true);
    const targetCallback = callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
      ? callbackUrl
      : '/';
    try {
      await signIn('google', { callbackUrl: targetCallback });
    } catch {
      setFieldError('Google authentication failed. Please use email and password.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F4F1EC] text-[#0E0E0E]">
      {/* Top Editorial Wordmark Bar */}
      <header className="w-full px-8 py-6 flex items-center justify-between border-b border-[#E3DFD8]">
        <div>
          <span className="font-serif text-2xl tracking-tight text-[#0E0E0E] font-normal leading-none">
            Aesthetic SEO
          </span>
          <span className="block text-[10px] font-mono uppercase tracking-[0.22em] text-[#6E6A64] mt-1">
            SEO & Keyword CRM · Harley Street
          </span>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#6E6A64]">
            Clinic Staff Portal
          </span>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="w-full max-w-xl mx-auto px-5 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-[#0E0E0E] text-[#F4F1EC] p-8 sm:p-10 border border-[#262626]">
          {/* Header */}
          <div className="border-b border-[#262626] pb-5 mb-6">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#0F766E] font-medium block mb-1">
              Authentication
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#F4F1EC] font-normal tracking-tight">
              Sign in
            </h1>
            <p className="text-xs text-[#9C9890] mt-1.5">
              Enter credentials to access the Keyword CRM and content workflows.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-[11px] font-mono uppercase tracking-[0.18em] text-[#9C9890]"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={128}
                autoComplete="email"
                className="w-full h-11 px-3.5 bg-[#171717] border border-[#2E2E2E] text-sm text-[#F4F1EC] focus:outline-none focus:border-[#0F766E] transition-colors"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-[11px] font-mono uppercase tracking-[0.18em] text-[#9C9890]"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                maxLength={128}
                autoComplete="current-password"
                className="w-full h-11 px-3.5 bg-[#171717] border border-[#2E2E2E] text-sm text-[#F4F1EC] focus:outline-none focus:border-[#0F766E] transition-colors"
              />
              {fieldError && (
                <p className="mt-2 text-xs font-mono text-[#F87171] leading-tight">
                  {fieldError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                id="email-submit-btn"
                type="submit"
                disabled={loading || googleLoading}
                className="w-full h-11 bg-[#F4F1EC] hover:bg-[#FFFFFF] text-[#0E0E0E] text-xs font-mono uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Signing in…' : 'Sign in with Email'}
              </button>
            </div>
          </form>

          {/* Hairline Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#262626]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0E0E0E] px-3 text-[10px] font-mono uppercase tracking-[0.2em] text-[#807C74]">
                or
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full h-11 bg-[#141414] hover:bg-[#1A1A1A] border border-[#2B2B2B] hover:border-[#3D3D3D] text-[#F4F1EC] text-xs font-mono uppercase tracking-[0.16em] flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>{googleLoading ? 'Connecting…' : 'Sign in with Google'}</span>
          </button>

          {/* Credentials Footer Note */}
          <div className="mt-6 pt-4 border-t border-[#262626] flex items-center justify-between text-[11px] font-mono text-[#807C74]">
            <span>DEFAULT: editor@aestheticseo.io</span>
            <span className="text-[#0F766E]">HarleySt_2026!</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-8 py-5 border-t border-[#E3DFD8] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[#807C74]">
        <span>© Aesthetic SEO Keyword CRM · Harley Street</span>
        <span>Google Sheets Sync Active</span>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F1EC] flex items-center justify-center font-mono text-xs text-[#6E6A64]">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
