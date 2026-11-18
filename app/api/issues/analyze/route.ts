import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSession } from '@/lib/session';
import { orchestrateUrbanIssueAnalysis } from '@/lib/agents/decision';
import { getAllIssues } from '@/lib/db';

const AnalyzeRequestSchema = z.object({
  imageBase64: z.string().min(10, 'Image data is required'),
  zoneId: z.string().min(1, 'Zone selection is required'),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = AnalyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const { imageBase64, zoneId, note } = parsed.data;

    // Get current open issue count in the chosen zone for formula density/load weighting
    const allIssues = await getAllIssues();
    const zoneOpenCount = allIssues.filter(
      (i) => i.zone.toLowerCase() === zoneId.toLowerCase() && i.status !== 'rejected'
    ).length;

    const analysis = await orchestrateUrbanIssueAnalysis({
      imageBase64,
      zoneId,
      note,
      openIssueCountInZone: zoneOpenCount,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (err: any) {
    console.error('Issue analysis error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to analyze urban issue' },
      { status: 500 }
    );
  }
}
