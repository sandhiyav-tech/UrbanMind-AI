import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/session';
import { getAllIssues } from '@/lib/db';
import { CHENNAI_ZONES } from '@/lib/zones';
import { getAllZoneAirQualityForecasts } from '@/lib/predictive/airQuality';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  try {
    const issues = await getAllIssues();
    const airQualityForecasts = getAllZoneAirQualityForecasts();

    // Aggregate zone metrics
    const zoneSummaries = CHENNAI_ZONES.map((zone) => {
      const zoneIssues = issues.filter(
        (i) => i.zone.toLowerCase() === zone.id.toLowerCase() || i.zone.toLowerCase() === zone.name.toLowerCase()
      );
      const openIssues = zoneIssues.filter((i) => i.status !== 'rejected');
      const avgPriority =
        openIssues.length > 0
          ? Number((openIssues.reduce((acc, curr) => acc + curr.priority_score, 0) / openIssues.length).toFixed(1))
          : 0;

      const maxPriority =
        openIssues.length > 0
          ? Math.max(...openIssues.map((i) => i.priority_score))
          : 0;

      // Type counts
      const counts: Record<string, number> = {};
      zoneIssues.forEach((i) => {
        counts[i.issue_type] = (counts[i.issue_type] || 0) + 1;
      });

      let dominantType = 'None';
      let maxCount = 0;
      Object.entries(counts).forEach(([t, c]) => {
        if (c > maxCount) {
          maxCount = c;
          dominantType = t;
        }
      });

      const aqi = airQualityForecasts.find((a) => a.zone_id === zone.id);

      return {
        zone,
        open_issues_count: openIssues.length,
        total_issues_count: zoneIssues.length,
        average_priority: avgPriority,
        highest_priority: maxPriority,
        dominant_issue_type: dominantType,
        issues: zoneIssues,
        air_quality: aqi,
      };
    });

    return NextResponse.json({
      zones: zoneSummaries,
      air_quality_forecasts: airQualityForecasts,
    });
  } catch (err: any) {
    console.error('Twin data error:', err);
    return NextResponse.json({ error: 'Failed to aggregate twin data' }, { status: 500 });
  }
}
