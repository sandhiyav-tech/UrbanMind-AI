'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { Issue, IssueStatus } from '@/lib/types';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  Edit3,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  FileText,
  AlertTriangle
} from 'lucide-react';

export default function MyReportsPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/issues');
      if (!res.ok) {
        throw new Error('Failed to load your reports');
      }
      const data = await res.json();
      let userIssues: Issue[] = data.issues || [];

      // Merge with custom issues saved locally to survive serverless cold starts
      try {
        const local = JSON.parse(localStorage.getItem('urbanmind_custom_issues') || '[]');
        if (Array.isArray(local) && local.length > 0) {
          const serverIds = new Set(userIssues.map((i) => i.id));
          const missingLocal = local.filter((i) => !serverIds.has(i.id));
          userIssues = [...missingLocal, ...userIssues];
        }
      } catch { }

      setIssues(userIssues);
    } catch (err: any) {
      setError(err.message || 'Error fetching reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Approved by GCC
          </span>
        );
      case 'edited':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <Edit3 className="w-3 h-3" /> Approved (Modified)
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Not Approved
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Citizen Tracking Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Infrastructure Reports</h1>
          <p className="text-xs text-slate-400">
            Real-time status updates, specialist agent evaluations, and official municipal dispatch decisions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-lg shadow-emerald-950/50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit New Issue</span>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400">Total Submitted</span>
          <div className="text-2xl font-bold text-white font-mono mt-1">{issues.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-900/30">
          <span className="text-xs text-amber-300">Under Review</span>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
            {issues.filter((i) => i.status === 'analyzed' || i.status === 'pending_analysis').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-900/30">
          <span className="text-xs text-emerald-300">Approved by GCC</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {issues.filter((i) => i.status === 'approved' || i.status === 'edited').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-red-900/30">
          <span className="text-xs text-red-300">Rejected</span>
          <div className="text-2xl font-bold text-red-400 font-mono mt-1">
            {issues.filter((i) => i.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 rounded-xl bg-slate-900/40 border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            <span>Fetching your submitted reports...</span>
          </div>
        ) : issues.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <ClipboardList className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-base font-medium text-slate-300">No reports logged yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't submitted any civic infrastructure photos yet. Upload a pothole, waste overflow, or waterline defect to trigger AI analysis.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition"
            >
              Report an Issue Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 hover:border-slate-700 transition shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white capitalize">
                          {issue.issue_type} Hazard
                        </span>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                          {issue.zone.replace('_', ' ')}
                        </span>
                        {issue.is_demo && (
                          <span className="text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1 rounded">
                            Demo data
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                        Logged on {new Date(issue.created_at).toLocaleDateString()} • Ref: #{issue.id}
                      </span>
                    </div>

                    <div className="shrink-0">{getStatusBadge(issue.status)}</div>
                  </div>

                  {/* Photo and Details */}
                  <div className="flex gap-3">
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-800 shrink-0 bg-black/40">
                      <img
                        src={issue.image_url}
                        alt="Issue photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <p className="text-xs text-slate-300 line-clamp-2">
                        {issue.note || issue.reasoning}
                      </p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>Severity: <strong>{issue.severity}/5</strong></span>
                        <span>•</span>
                        <span>Priority: <strong className="text-emerald-400 font-mono">{issue.priority_score}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Authority Note if decided */}
                  {issue.decision_notes && (
                    <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-300 space-y-0.5">
                      <span className="font-semibold text-[11px] uppercase tracking-wider text-indigo-400 block">
                        Official GCC Feedback:
                      </span>
                      <p className="italic text-slate-300">{issue.decision_notes}</p>
                    </div>
                  )}
                </div>

                {/* Inspect Action */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Formula: {issue.priority_breakdown?.formula ? 'Calibrated' : 'Pending'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedIssue(issue)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    <span>View Agent Findings</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white capitalize">
                  Report Detail: #{selectedIssue.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-800 bg-black/40">
                <img
                  src={selectedIssue.image_url}
                  alt="Captured problem"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-mono">Executive Reasoning</span>
                <p className="text-slate-200 leading-relaxed">{selectedIssue.reasoning}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 uppercase text-[10px] font-mono">Priority Formula Calculation</span>
                <div className="font-mono text-emerald-300 bg-slate-900 p-2 rounded">
                  {selectedIssue.priority_breakdown?.formula}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-300 font-semibold uppercase text-[10px]">Recommended Actions</span>
                {selectedIssue.recommended_actions?.map((act, i) => (
                  <div key={i} className="p-2 rounded bg-slate-950 border border-slate-850 text-slate-300">
                    • {act}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
