import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'UrbanMind AI - Chennai Civic Digital Twin & Decision Ops',
  description: 'AI-assisted urban infrastructure triage, multi-agent damage ranking, and predictive digital twin for Chennai authorities and citizens.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>UrbanMind AI — Global AI Builder's Challenge (Solo Hackathon)</p>
              <p className="flex items-center gap-2">
                <span>Chennai Greater Corporation Ops</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="font-mono text-[11px] text-slate-400">All synthetic items labeled "Demo data"</span>
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
