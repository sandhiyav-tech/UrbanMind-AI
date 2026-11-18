'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { 
  Building2, 
  MapPin, 
  ClipboardList, 
  ShieldCheck, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  Camera
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't display standard navbar on dedicated auth pages
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
    return (
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-emerald-400 font-bold text-xl tracking-tight">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <span>UrbanMind <span className="text-white text-sm font-semibold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">AI</span></span>
          </Link>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Chennai GCC Twin Ops
          </div>
        </div>
      </header>
    );
  }

  const isAuthority = user?.role === 'authority';
  const isDemoAccount = user?.email === 'citizen@demo.com' || user?.email === 'official@demo.com';

  const navLinks = [
    { href: '/', label: 'Report Issue', icon: Camera, visible: true },
    { href: '/twin', label: 'Digital Twin', icon: MapPin, visible: true },
    { href: '/my-reports', label: 'My Reports', icon: ClipboardList, visible: true },
    { href: '/review', label: 'Review Queue', icon: ShieldCheck, visible: isAuthority },
    { href: '/evaluation', label: 'AI Evaluation', icon: BarChart3, visible: isAuthority },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:border-emerald-500/50 transition">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-lg tracking-tight">UrbanMind</span>
                  <span className="text-emerald-400 text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">AI</span>
                </div>
                <span className="text-[10px] text-slate-400 -mt-1 font-mono">Chennai Civic Twin</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks
                .filter((l) => l.visible)
                .map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                        isActive
                          ? 'bg-slate-800 text-emerald-400 border border-slate-700/80'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
            </nav>
          </div>

          {/* User & Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && user ? (
              <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-200 leading-tight">{user.name}</span>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    {isAuthority ? (
                      <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        City Official
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Citizen
                      </span>
                    )}
                    {isDemoAccount && (
                      <span className="text-[9px] font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1 rounded">
                        Demo account
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-6 w-[1px] bg-slate-800"></div>

                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : !loading ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded hover:bg-slate-900 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition"
                >
                  Sign Up
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks
            .filter((l) => l.visible)
            .map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

          {user && (
            <div className="pt-4 border-t border-slate-800 mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/40 border border-red-900/60 px-3 py-1.5 rounded"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
