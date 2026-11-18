'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { Issue, IssueStatus } from '@/lib/types';
import { CHENNAI_ZONES } from '@/lib/zones';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  Filter,
  RefreshCw,
  Search,
  Clock,
  User,
  MapPin,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ChevronDown,
  Check
} from 'lucide-react';

export default function ReviewPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal State
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'edit' | 'reject'>('approve');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [editedSeverity, setEditedSeverity] = useState<number>(3);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/issues');
      if (!res.ok) {
        throw new Error('Failed to retrieve issues list');
      }
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const openReviewModal = (issue: Issue, action: 'approve' | 'edit' | 'reject') => {
    setSelectedIssue(issue);
    setActionType(action);
    setEditedSeverity(issue.severity);
    setDecisionNotes(
      action === 'approve'
        ? `Approved recommendation for immediate GCC operational dispatch.`
        : action === 'reject'
        ? `Report rejected: Issue already serviced or insufficient field evidence.`
        : `Approved with adjusted priority parameters.`
    );
    setActionSuccessMsg(null);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    if (!decisionNotes.trim()) {
      alert('Please enter a comment explaining the authority decision.');
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          decision_notes: decisionNotes.trim(),
          edited_severity: actionType === 'edit' ? editedSeverity : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      // Update state in place
      setIssues((prev) =>
        prev.map((i) => (i.id === selectedIssue.id ? { ...i, ...data.issue } : i))
      );

      setActionSuccessMsg(`Decision successfully logged for #${selectedIssue.id}`);
      setTimeout(() => {
        setSelectedIssue(null);
        setActionSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Error executing review action');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter computation
  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (zoneFilter !== 'all' && issue.zone !== zoneFilter) return false;
    if (typeFilter !== 'all' && issue.issue_type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = (issue.note || '').toLowerCase().includes(q);
      const matchReason = (issue.reasoning || '').toLowerCase().includes(q);
      const matchZone = issue.zone.toLowerCase().includes(q);
      const matchType = issue.issue_type.toLowerCase().includes(q);
      if (!matchNote && !matchReason && !matchZone && !matchType) return false;
    }
    return true;
  });

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'edited':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <Edit3 className="w-3 h-3" /> Edited & Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-950 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              GCC City Authority Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Municipal Review & Action Board
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Decision agent recommendations ranked strictly by multi-factor civic priority. Final executive authority and field dispatch remain with verified city officials.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchIssues}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400">Total in Queue</span>
          <div className="text-2xl font-bold text-white font-mono mt-1">{issues.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-900/40">
          <span className="text-xs text-amber-300">Pending Review</span>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
            {issues.filter((i) => i.status === 'analyzed' || i.status === 'pending_analysis').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-red-900/40">
          <span className="text-xs text-red-300">Critical Priority (&gt;80)</span>
          <div className="text-2xl font-bold text-red-400 font-mono mt-1">
            {issues.filter((i) => i.priority_score >= 80).length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-900/40">
          <span className="text-xs text-emerald-300">Approved Dispatches</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {issues.filter((i) => i.status === 'approved' || i.status === 'edited').length}
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="analyzed">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="edited">Edited & Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Zone filter */}
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Chennai Zones</option>
            {CHENNAI_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Hazard Types</option>
            <option value="road">Road Damage</option>
            <option value="waste">Waste Accumulation</option>
            <option value="water">Water Utility</option>
          </select>
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes or zones..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 text-xs"
          />
        </div>
      </div>

      {/* Issues Queue Table / Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 rounded-xl bg-slate-900/40 border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
            <span>Loading ranked municipal review queue...</span>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="p-12 text-center text-slate-500 rounded-xl bg-slate-900/40 border border-slate-800">
            No issues match current filter criteria.
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-slate-700 transition shadow-lg"
            >
              {/* Row Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white capitalize">
                        {issue.issue_type} Defect
                      </span>
                      <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                        {issue.zone.replace('_', ' ')}
                      </span>
                      {issue.is_demo && (
                        <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1 rounded">
                          Demo data
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">Ref: {issue.id}</span>
                      <span>•</span>
                      <span>Reporter: {issue.user_name || 'Anonymous Citizen'}</span>
                      <span>•</span>
                      <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(issue.status)}
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-right min-w-[90px]">
                    <div className="text-lg font-bold text-emerald-400 font-mono leading-none">
                      {issue.priority_score}
                      <span className="text-[10px] text-slate-500">/100</span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono">Priority</span>
                  </div>
                </div>
              </div>

              {/* Main Content Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Photo Thumbnail */}
                <div className="md:col-span-3">
                  <div className="relative h-32 w-full rounded-xl overflow-hidden border border-slate-800 bg-black/40">
                    <img
                      src={issue.image_url}
                      alt="Issue capture"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Agent Analysis & Findings */}
                <div className="md:col-span-9 space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-300">Decision Agent Reasoning:</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                      {issue.reasoning}
                    </p>
                  </div>

                  {/* Recommended Actions */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-300">Recommended Municipal Dispatch:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      {issue.recommended_actions?.slice(0, 2).map((action, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-slate-300 bg-slate-950 p-2 rounded border border-slate-850">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="truncate">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority Formula Display */}
                  <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-850">
                    <span>Formula: {issue.priority_breakdown?.formula || 'Weighted multi-factor score'}</span>
                    <span className="text-amber-400 font-semibold">Sev: {issue.severity}/5 | Conf: {(issue.confidence * 100).toFixed(0)}%</span>
                  </div>

                  {/* Decision Audit Log if already decided */}
                  {issue.decided_by && (
                    <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/50 text-xs text-indigo-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Decided by: <strong>{issue.decided_by}</strong> ({issue.decision_notes})</span>
                      </div>
                      <span className="font-mono text-[10px] text-indigo-400">
                        {issue.decided_at ? new Date(issue.decided_at).toLocaleString() : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Official */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => openReviewModal(issue, 'approve')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Recommendation</span>
                </button>

                <button
                  type="button"
                  onClick={() => openReviewModal(issue, 'edit')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Parameters</span>
                </button>

                <button
                  type="button"
                  onClick={() => openReviewModal(issue, 'reject')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-900/80 text-red-300 text-xs font-medium transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Action Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-850 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white capitalize">
                  {actionType === 'approve'
                    ? 'Approve Operational Dispatch'
                    : actionType === 'edit'
                    ? 'Edit Priority & Approve'
                    : 'Reject Report'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {actionSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-900 text-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold">{actionSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={submitReview} className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Issue: #{selectedIssue.id}</span>
                    <span className="font-semibold text-white capitalize">{selectedIssue.issue_type} in {selectedIssue.zone}</span>
                  </div>
                  <p className="text-slate-300 line-clamp-2">{selectedIssue.note || selectedIssue.reasoning}</p>
                </div>

                {actionType === 'edit' && (
                  <div className="space-y-1.5">
                    <label className="block text-slate-300 font-medium">Adjust Severity Level (1-5)</label>
                    <select
                      value={editedSeverity}
                      onChange={(e) => setEditedSeverity(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    >
                      <option value={1}>Level 1: Minimal</option>
                      <option value={2}>Level 2: Minor</option>
                      <option value={3}>Level 3: Moderate</option>
                      <option value={4}>Level 4: Severe</option>
                      <option value={5}>Level 5: Critical</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">Official Authority Decision Comment (Required)</label>
                  <textarea
                    rows={3}
                    required
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Enter reason for approval, specific dispatch instructions, or rejection reason..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIssue(null)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow"
                  >
                    {submittingAction ? 'Persisting Decision...' : 'Confirm Decision'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
