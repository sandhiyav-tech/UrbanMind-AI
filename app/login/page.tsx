'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Shield, UserCheck, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let accountBackup = undefined;
      try {
        const saved = JSON.parse(localStorage.getItem('urbanmind_saved_accounts') || '{}');
        accountBackup = saved[email.trim().toLowerCase()];
      } catch {}

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, account_backup: accountBackup }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      // Successful login
      const target = nextPath || data.redirectUrl || '/';
      router.push(target);
      router.refresh();
    } catch {
      setError('Connection failed. Please check your network.');
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to UrbanMind AI</h1>
          <p className="text-sm text-slate-400">Chennai Civic Digital Twin & Decision Intelligence</p>
        </div>

        {/* Demo Accounts Box */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Demo accounts
            </span>
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
              Demo data
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('citizen@demo.com', 'Demo1234')}
              className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition group"
            >
              <div className="text-xs font-medium text-slate-200 group-hover:text-emerald-400">Citizen Account</div>
              <div className="text-[11px] text-slate-400 truncate">citizen@demo.com</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Role: citizen</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('official@demo.com', 'Demo1234')}
              className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition group"
            >
              <div className="text-xs font-medium text-slate-200 group-hover:text-indigo-400">GCC Official</div>
              <div className="text-[11px] text-slate-400 truncate">official@demo.com</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Role: authority</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('sarvesh@chennai.gov.in', 'asdf1234')}
              className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition group"
            >
              <div className="text-xs font-medium text-slate-200 group-hover:text-indigo-400">Sarvesh (Official)</div>
              <div className="text-[11px] text-slate-400 truncate">sarvesh@chennai.gov.in</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Role: authority</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('sandhu@chennai.gov.in', 'sand1234')}
              className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition group"
            >
              <div className="text-xs font-medium text-slate-200 group-hover:text-indigo-400">Sandhu (Official)</div>
              <div className="text-[11px] text-slate-400 truncate">sandhu@chennai.gov.in</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Role: authority</div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. citizen@demo.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition shadow-lg shadow-emerald-950/50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-emerald-400 hover:underline font-medium">
              Create account
            </Link>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          Security: Custom bcryptjs + signed jose JWT httpOnly cookie (7-day session)
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
