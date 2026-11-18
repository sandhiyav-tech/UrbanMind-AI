'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { CHENNAI_ZONES } from '@/lib/zones';
import { CompleteAnalysisResult } from '@/lib/agents/decision';
import {
  UploadCloud,
  Camera,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  RefreshCw,
  Info,
  Check,
  AlertOctagon,
  HelpCircle,
  FileText
} from 'lucide-react';

const SAMPLE_IMAGES = [
  {
    name: 'Pothole Crater',
    zone: 't_nagar',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    note: 'Deep asphalt cavity causing two-wheelers to swerve near Usman Road.',
    type: 'road',
  },
  {
    name: 'Waste Accumulation',
    zone: 'tondiarpet',
    url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
    note: 'Commercial waste overflowing beyond collection point into pedestrian walkway.',
    type: 'waste',
  },
  {
    name: 'Water Main Seepage',
    zone: 'adyar',
    url: 'https://images.unsplash.com/photo-1584467746872-95ffb137bc15?auto=format&fit=crop&w=800&q=80',
    note: 'Waterline pipe coupling spraying clean drinking water onto roadside.',
    type: 'water',
  },
  {
    name: 'Indoor Non-Civic (Gatekeeper Test)',
    zone: 'velachery',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
    note: 'Testing non-infrastructure gatekeeper rejection.',
    type: 'invalid',
  },
];

export default function ReportPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [selectedZone, setSelectedZone] = useState('t_nagar');
  const [note, setNote] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(SAMPLE_IMAGES[0].url);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<CompleteAnalysisResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert File to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setImagePreview(b64);
      setImageBase64(b64);
      setAnalysisResult(null);
      setSubmittedIssueId(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = reader.result as string;
        setImagePreview(b64);
        setImageBase64(b64);
        setAnalysisResult(null);
        setSubmittedIssueId(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectSample = (sample: typeof SAMPLE_IMAGES[0]) => {
    setImagePreview(sample.url);
    setImageBase64(sample.url);
    setSelectedZone(sample.zone);
    setNote(sample.note);
    setAnalysisResult(null);
    setSubmittedIssueId(null);
    setError(null);
  };

  const runAnalysis = async () => {
    if (!imagePreview) {
      setError('Please upload or select an image to inspect.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setSubmittedIssueId(null);

    // Multi-agent progress simulation steps
    setAnalysisStep('1/3: Gatekeeper Agent validating municipal infrastructure...');
    const t1 = setTimeout(() => {
      setAnalysisStep('2/3: Parallel Specialists (Road, Waste, Water) inspecting hazards...');
    }, 700);
    const t2 = setTimeout(() => {
      setAnalysisStep('3/3: Decision Agent synthesizing priority formula & zone context...');
    }, 1400);

    try {
      const res = await fetch('/api/issues/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64 || imagePreview,
          zoneId: selectedZone,
          note: note.trim(),
        }),
      });

      clearTimeout(t1);
      clearTimeout(t2);

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to complete agent analysis');
        setAnalyzing(false);
        return;
      }

      setAnalysisResult(data.analysis);
    } catch {
      setError('Failed to reach analysis service. Check connection.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setAnalyzing(false);
    }
  };

  const submitReport = async () => {
    if (!analysisResult) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone: selectedZone,
          image_url: imagePreview,
          note: note.trim(),
          issue_type: analysisResult.issue_type,
          severity: analysisResult.severity,
          confidence: analysisResult.confidence,
          priority_score: analysisResult.priority_score,
          priority_breakdown: analysisResult.priority_breakdown,
          reasoning: analysisResult.reasoning,
          recommended_actions: analysisResult.recommended_actions,
          needs_human_review: analysisResult.needs_human_review,
          specialist_findings: analysisResult.specialist_findings,
          is_demo: analysisResult.isDemo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save report');
        setSubmitting(false);
        return;
      }

      setSubmittedIssueId(data.issue.id);

      // Save to localStorage for resilient survival across serverless lambdas
      try {
        const existingLocal = JSON.parse(localStorage.getItem('urbanmind_custom_issues') || '[]');
        const updatedLocal = [data.issue, ...existingLocal.filter((i: any) => i.id !== data.issue.id)];
        localStorage.setItem('urbanmind_custom_issues', JSON.stringify(updatedLocal));
      } catch {}
    } catch {
      setError('Network error while saving report.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityBadge = (sev: number) => {
    const scales = [
      { label: 'Level 1: Minimal', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
      { label: 'Level 2: Minor', color: 'bg-lime-500/20 text-lime-300 border-lime-500/40' },
      { label: 'Level 3: Moderate', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
      { label: 'Level 4: Severe', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
      { label: 'Level 5: Critical Hazard', color: 'bg-red-500/20 text-red-300 border-red-500/40' },
    ];
    const s = scales[Math.max(0, Math.min(4, sev - 1))];
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${s.color}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Hero / Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">GCC Smart City Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Report Civic Infrastructure Issue</h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Upload an on-ground photograph in Chennai. Our multi-agent AI system executes parallel vision inspections, screens non-civic media, and computes a multi-factor priority score.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Human Authority in the Loop
          </span>
        </div>
      </div>

      {/* Main Grid: Upload & Inputs (Left) vs Real-Time Result (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sample Picker */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Quick Test Samples
              </span>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1 rounded">
                Demo data
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_IMAGES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSample(sample)}
                  className={`p-2 rounded-lg border text-left transition text-xs ${
                    imagePreview === sample.url
                      ? 'border-emerald-500 bg-emerald-950/30 text-white'
                      : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-medium truncate">{sample.name}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{sample.zone.replace('_', ' ')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Infrastructure Photograph
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer bg-slate-950/80 transition group overflow-hidden"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="space-y-3">
                  <div className="relative h-48 w-full rounded-lg overflow-hidden border border-slate-800 bg-black/40">
                    <img
                      src={imagePreview}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 group-hover:text-emerald-400">
                    <Camera className="w-4 h-4" />
                    <span>Click or drop new photo to replace</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/50 mx-auto flex items-center justify-center transition">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-200">Drag & drop photo or click to browse</p>
                    <p className="text-xs text-slate-500">JPG, PNG, WebP up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zone Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Chennai Municipal Zone
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CHENNAI_ZONES.map((z) => {
                const isSelected = selectedZone === z.id;
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setSelectedZone(z.id)}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/30 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">{z.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {z.population_density.toLocaleString()} / km²
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Citizen Description (Optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Provide landmarks, duration of issue, or immediate hazards observed..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={runAnalysis}
            disabled={analyzing || !imagePreview}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition shadow-lg shadow-emerald-950/50"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Specialist AI Agents...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Infrastructure Damage</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Multi-Agent Analysis State & Results (7 cols) */}
        <div className="lg:col-span-7">
          {analyzing ? (
            <div className="h-full min-h-[420px] rounded-2xl bg-slate-900/50 border border-slate-800 p-8 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Layers className="w-8 h-8 animate-pulse" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-base font-semibold text-white">Multi-Agent Swarm In Progress</h3>
                <p className="text-xs font-mono text-emerald-400">{analysisStep}</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-4">
                  <div className="bg-emerald-500 h-full w-2/3 animate-[pulse_1s_infinite]"></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm text-left">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                  <div className="font-semibold text-slate-300">Road Agent</div>
                  <div className="text-slate-500">Pothole / Crack</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                  <div className="font-semibold text-slate-300">Waste Agent</div>
                  <div className="text-slate-500">Refuse / Dump</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                  <div className="font-semibold text-slate-300">Water Agent</div>
                  <div className="text-slate-500">Leak / Inundation</div>
                </div>
              </div>
            </div>
          ) : analysisResult ? (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-2xl space-y-6 p-6">
              {/* Header Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${analysisResult.valid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {analysisResult.valid ? <Shield className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white capitalize">
                        {analysisResult.valid ? `${analysisResult.issue_type} Infrastructure Issue` : 'Non-Civic Media Rejection'}
                      </h2>
                      {analysisResult.isDemo && (
                        <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                          Demo data
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {analysisResult.valid
                        ? `Specialist consensus verified in ${selectedZone.replace('_', ' ').toUpperCase()}`
                        : 'Screened by Gatekeeper Agent'}
                    </p>
                  </div>
                </div>

                {analysisResult.valid && (
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(analysisResult.severity)}
                    {analysisResult.needs_human_review && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Needs Human Review
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* If Invalid Rejection */}
              {!analysisResult.valid ? (
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-red-200">Gatekeeper Verification Failed</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.reasoning}</p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                    <strong>Rule:</strong> UrbanMind AI accepts only municipal infrastructure (potholes, asphalt failures, solid waste accumulation, pipe bursts, or drain overflows).
                  </div>
                </div>
              ) : (
                <>
                  {/* Metric Chips */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                      <span className="text-[11px] text-slate-400">Priority Score</span>
                      <div className="text-2xl font-bold text-emerald-400 font-mono">
                        {analysisResult.priority_score}
                        <span className="text-xs text-slate-500 font-normal">/100</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                      <span className="text-[11px] text-slate-400">Model Confidence</span>
                      <div className="text-2xl font-bold text-slate-100 font-mono">
                        {(analysisResult.confidence * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                      <span className="text-[11px] text-slate-400">Severity</span>
                      <div className="text-2xl font-bold text-amber-400 font-mono">
                        {analysisResult.severity}
                        <span className="text-xs text-slate-500 font-normal">/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Priority Formula Breakdown Section */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        Priority Formula Breakdown
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Formula: 0.5*Sev + 0.2*Conf + 0.2*Density + 0.1*OpenIssues
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-xs text-emerald-300 overflow-x-auto">
                      {analysisResult.priority_breakdown.formula}
                    </div>

                    {/* Visual contribution bars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Severity (50%)</span>
                          <span className="font-mono text-slate-200">{(analysisResult.priority_breakdown.severity_norm * 50).toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-red-500 h-full rounded-full"
                            style={{ width: `${analysisResult.priority_breakdown.severity_norm * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Confidence (20%)</span>
                          <span className="font-mono text-slate-200">{(analysisResult.priority_breakdown.confidence * 20).toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${analysisResult.priority_breakdown.confidence * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Density (20%)</span>
                          <span className="font-mono text-slate-200">{(analysisResult.priority_breakdown.zone_density_norm * 20).toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${analysisResult.priority_breakdown.zone_density_norm * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Open Issues (10%)</span>
                          <span className="font-mono text-slate-200">{(analysisResult.priority_breakdown.open_issue_count_norm * 10).toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-500 h-full rounded-full"
                            style={{ width: `${analysisResult.priority_breakdown.open_issue_count_norm * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Specialist Findings Detail */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Parallel Specialist Findings
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-300">Road</span>
                          <span className="font-mono text-slate-400">Sev {analysisResult.specialist_findings.road.severity}/5</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {analysisResult.specialist_findings.road.evidence}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-300">Waste</span>
                          <span className="font-mono text-slate-400">Sev {analysisResult.specialist_findings.waste.severity}/5</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {analysisResult.specialist_findings.waste.evidence}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-300">Water</span>
                          <span className="font-mono text-slate-400">Sev {analysisResult.specialist_findings.water.severity}/5</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {analysisResult.specialist_findings.water.evidence}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Decision Agent Reasoning & Recommendations */}
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-xs font-semibold text-slate-200">Executive Decision Synthesis</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.reasoning}</p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Recommended Operational Protocol
                      </span>
                      <div className="space-y-1.5">
                        {analysisResult.recommended_actions.map((act, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submission Success or Action Button */}
                  {submittedIssueId ? (
                    <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-sm font-semibold">Report Logged in Chennai Digital Twin</p>
                          <p className="text-xs text-emerald-400/80 font-mono">Reference: {submittedIssueId}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push('/my-reports')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                      >
                        View in My Reports
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={submitReport}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition shadow-lg shadow-emerald-950/60"
                    >
                      {submitting ? (
                        <span>Logging Report to Twin...</span>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Submit Official Report to GCC Digital Twin</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[420px] rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <Layers className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-medium text-slate-300">Awaiting Image Inspection</h3>
                <p className="text-xs text-slate-500">
                  Select a sample or upload a photo, then click "Analyze Infrastructure Damage" to trigger parallel specialist agents.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
