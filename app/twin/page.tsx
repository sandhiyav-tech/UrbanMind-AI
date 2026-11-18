'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CHENNAI_ZONES } from '@/lib/zones';
import { AirQualityForecast, Issue } from '@/lib/types';
import {
  MapPin,
  Wind,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Droplets,
  Thermometer,
  Shield,
  ArrowRight,
  TrendingUp,
  Filter
} from 'lucide-react';

// Dynamic import of Leaflet Map with SSR disabled
const DigitalTwinMap = dynamic(() => import('@/components/DigitalTwinMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] lg:h-[650px] rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
      <div className="flex flex-col items-center gap-2">
        <Activity className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="text-sm font-medium text-slate-300">Rendering Chennai Digital Twin Geospatial Engine...</span>
      </div>
    </div>
  ),
});

interface ZoneSummary {
  zone: (typeof CHENNAI_ZONES)[0];
  open_issues_count: number;
  total_issues_count: number;
  average_priority: number;
  highest_priority: number;
  dominant_issue_type: string;
  issues: Issue[];
  air_quality?: AirQualityForecast;
}

export default function TwinPage() {
  const [zones, setZones] = useState<ZoneSummary[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('t_nagar');
  const [mode, setMode] = useState<'current' | 'predicted'>('current');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTwinData() {
      try {
        const res = await fetch('/api/twin/data');
        if (!res.ok) {
          throw new Error('Failed to load twin telemetry');
        }
        const data = await res.json();
        setZones(data.zones || []);
      } catch (err: any) {
        setError(err.message || 'Error loading twin telemetry');
      } finally {
        setLoading(false);
      }
    }
    loadTwinData();
  }, []);

  const selectedZoneData = zones.find((z) => z.zone.id === selectedZoneId) || zones[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Controls & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Chennai Geospatial Digital Twin
            </h1>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              Live Twin
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time urban damage priority vs predictive atmospheric air-quality forecasting across 6 GCC zones.
          </p>
        </div>

        {/* Current vs Predicted Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setMode('current')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              mode === 'current'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Current: Infrastructure Priority</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('predicted')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              mode === 'predicted'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Predicted: Air Quality & Risk</span>
          </button>
        </div>
      </div>

      {/* Legend & Context Alert */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-850">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Map Heatmap Legend:</span>
          {mode === 'current' ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low (0-45)
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate (46-65)
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> High (66-80)
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Urgent (81-100)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Good/Mod (AQI &le;100)
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Unhealthy Sensitive (101-150)
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Unhealthy (151-200)
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Severe (AQI &gt;200)
              </span>
            </div>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Click any zone on the map or select below to inspect telemetry
        </div>
      </div>

      {/* Main Grid: Interactive Map (7 cols) vs Side Panel (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Map View */}
        <div className="lg:col-span-7 space-y-3">
          <DigitalTwinMap
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
            mode={mode}
          />

          {/* Quick Zone Navigation Pills */}
          <div className="flex flex-wrap gap-1.5">
            {zones.map((z) => (
              <button
                key={z.zone.id}
                onClick={() => setSelectedZoneId(z.zone.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  selectedZoneId === z.zone.id
                    ? 'bg-slate-800 text-emerald-400 border-emerald-500/50'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {z.zone.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side Panel: Detailed Zone Telemetry */}
        <div className="lg:col-span-5 space-y-4">
          {selectedZoneData ? (
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-5 shadow-2xl backdrop-blur">
              {/* Zone Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {selectedZoneData.zone.name}
                    </h2>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      GCC Zone
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {selectedZoneData.zone.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Density</span>
                  <div className="text-sm font-semibold text-slate-200 font-mono">
                    {selectedZoneData.zone.population_density.toLocaleString()} / km²
                  </div>
                </div>
              </div>

              {/* Mode Specific Side Panel Content */}
              {mode === 'current' ? (
                /* CURRENT INFRASTRUCTURE MODE */
                <div className="space-y-4">
                  {/* Aggregated KPI row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400">Open Reports</span>
                      <div className="text-xl font-bold text-white font-mono mt-0.5">
                        {selectedZoneData.open_issues_count}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400">Avg Priority</span>
                      <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                        {selectedZoneData.average_priority}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400">Dominant Type</span>
                      <div className="text-sm font-bold text-amber-300 uppercase font-mono mt-1.5 truncate">
                        {selectedZoneData.dominant_issue_type}
                      </div>
                    </div>
                  </div>

                  {/* Issues List in Zone */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Active Zone Reports ({selectedZoneData.issues.length})
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Sorted by priority</span>
                    </div>

                    {selectedZoneData.issues.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                        No active reports currently logged in {selectedZoneData.zone.name}.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                        {selectedZoneData.issues.map((issue) => (
                          <div
                            key={issue.id}
                            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-white capitalize">
                                    {issue.issue_type} Hazard
                                  </span>
                                  {issue.is_demo && (
                                    <span className="text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1 rounded">
                                      Demo data
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                                  {issue.note || issue.reasoning}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-emerald-400 font-mono">
                                  {issue.priority_score}
                                </span>
                                <div className="text-[9px] text-slate-500 uppercase">Priority</div>
                              </div>
                            </div>

                            {/* Recommendations Preview */}
                            {issue.recommended_actions && issue.recommended_actions.length > 0 && (
                              <div className="text-[10px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-850 flex items-center gap-1.5">
                                <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="truncate">{issue.recommended_actions[0]}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* PREDICTIVE AIR QUALITY MODE */
                <div className="space-y-4">
                  {selectedZoneData.air_quality ? (
                    <>
                      {/* AQI Comparison Card */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Wind className="w-3.5 h-3.5 text-indigo-400" />
                            Atmospheric Predictive Model
                          </span>
                          <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                            24h Regression Forecast
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                            <span className="text-[11px] text-slate-400">Current AQI</span>
                            <div className="text-2xl font-bold text-slate-200 font-mono mt-0.5">
                              {selectedZoneData.air_quality.current_aqi}
                            </div>
                            <span className="text-[10px] text-slate-500">Live Baseline</span>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-900/80 border border-indigo-900/40 text-center">
                            <span className="text-[11px] text-indigo-300">Predicted 24h AQI</span>
                            <div className="text-2xl font-bold text-indigo-400 font-mono mt-0.5">
                              {selectedZoneData.air_quality.predicted_24h_aqi}
                            </div>
                            <span className="text-[10px] font-semibold text-amber-400 uppercase">
                              {selectedZoneData.air_quality.risk_level} Risk
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
                          <span>Primary Pollutant:</span>
                          <span className="font-semibold text-slate-200">
                            {selectedZoneData.air_quality.primary_pollutant}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 flex items-center justify-between">
                          <span>Trend vs Rolling Baseline:</span>
                          <span className="font-mono text-emerald-400">
                            {selectedZoneData.air_quality.historical_comparison}
                          </span>
                        </div>
                      </div>

                      {/* Meteorological Predictors */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Meteorological Predictor Features
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                              <Thermometer className="w-3 h-3 text-amber-400" /> Temp
                            </span>
                            <div className="text-sm font-semibold text-slate-200 font-mono mt-0.5">
                              {selectedZoneData.air_quality.temp_c}°C
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                              <Droplets className="w-3 h-3 text-blue-400" /> Humidity
                            </span>
                            <div className="text-sm font-semibold text-slate-200 font-mono mt-0.5">
                              {selectedZoneData.air_quality.humidity_pct}%
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                              <Wind className="w-3 h-3 text-cyan-400" /> Wind
                            </span>
                            <div className="text-sm font-semibold text-slate-200 font-mono mt-0.5">
                              {selectedZoneData.air_quality.wind_speed_kmh} km/h
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* City Mitigation Protocol */}
                      <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/50 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                          <Shield className="w-3.5 h-3.5" />
                          GCC Prescriptive Mitigation Advisory
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedZoneData.air_quality.mitigation_recommendation}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                      Loading air quality predictive telemetry...
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
              Select a zone on the map to view real-time digital twin telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
