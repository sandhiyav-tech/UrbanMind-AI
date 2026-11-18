'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CHENNAI_ZONES } from '@/lib/zones';
import { AirQualityForecast, Issue } from '@/lib/types';

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

interface DigitalTwinMapProps {
  zones: ZoneSummary[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  mode: 'current' | 'predicted';
}

export default function DigitalTwinMap({
  zones,
  selectedZoneId,
  onSelectZone,
  mode,
}: DigitalTwinMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center of Chennai: ~13.04, 80.24
    const map = L.map(mapContainerRef.current, {
      center: [13.045, 80.24],
      zoom: 12,
      minZoom: 10,
      maxZoom: 16,
      zoomControl: true,
    });

    // Dark high-contrast OpenStreetMap cartodb tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update Zone Polygons and Markers when data, mode, or selectedZoneId changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    zones.forEach((zSummary) => {
      const { zone, average_priority, open_issues_count, air_quality } = zSummary;
      const isSelected = selectedZoneId === zone.id;

      // Color computation based on mode
      let fillColor = '#10b981'; // green default
      let labelText = '';

      if (mode === 'current') {
        if (average_priority >= 80) fillColor = '#ef4444'; // Red
        else if (average_priority >= 65) fillColor = '#f97316'; // Orange
        else if (average_priority >= 45) fillColor = '#eab308'; // Amber
        else fillColor = '#10b981'; // Green
        labelText = `Priority ${average_priority}`;
      } else {
        // Predicted AQI mode
        const aqi = air_quality?.predicted_24h_aqi || 120;
        if (aqi > 200) fillColor = '#a855f7'; // Purple / Severe
        else if (aqi > 150) fillColor = '#ef4444'; // Red / Unhealthy
        else if (aqi > 100) fillColor = '#f97316'; // Orange / Moderate
        else fillColor = '#10b981'; // Green / Low
        labelText = `AQI ${aqi}`;
      }

      // 1. Draw Zone Polygon
      const polygon = L.polygon(zone.polygon, {
        color: isSelected ? '#ffffff' : fillColor,
        weight: isSelected ? 3 : 2,
        opacity: isSelected ? 1 : 0.8,
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.45 : 0.25,
      });

      polygon.on('click', () => {
        onSelectZone(zone.id);
      });

      polygon.bindTooltip(
        `<div class="text-xs font-sans">
          <strong>${zone.name}</strong><br/>
          ${mode === 'current' ? `Open Issues: ${open_issues_count} | Avg Pri: ${average_priority}` : `Pred 24h AQI: ${air_quality?.predicted_24h_aqi} (${air_quality?.risk_level})`}
        </div>`,
        { sticky: true }
      );

      layerGroup.addLayer(polygon);

      // 2. Custom DivIcon Marker at Zone Center
      const markerHtml = `
        <div style="
          background: #0f172a;
          color: white;
          padding: 3px 8px;
          border-radius: 9999px;
          border: 2px solid ${fillColor};
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          gap: 5px;
          transform: translate(-50%, -50%);
          cursor: pointer;
        ">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${fillColor}; display: inline-block;"></span>
          <span>${zone.name}</span>
          <span style="opacity: 0.8; font-size: 9px; background: rgba(255,255,255,0.15); padding: 1px 4px; border-radius: 4px;">
            ${labelText}
          </span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-twin-marker',
        iconSize: [0, 0],
      });

      const marker = L.marker([zone.lat, zone.lng], { icon: customIcon });
      marker.on('click', () => {
        onSelectZone(zone.id);
      });
      layerGroup.addLayer(marker);
    });
  }, [zones, selectedZoneId, mode, onSelectZone]);

  return (
    <div className="relative w-full h-[550px] lg:h-[650px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
