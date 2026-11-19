import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSession } from '@/lib/session';
import { getAllIssues, getIssuesByUserId, createIssue } from '@/lib/db';
import { Issue } from '@/lib/types';

const CreateIssueSchema = z.object({
  zone: z.string().min(1),
  image_url: z.string().min(1),
  note: z.string().optional(),
  issue_type: z.enum(['road', 'waste', 'water', 'other', 'invalid']),
  severity: z.number().int().min(1).max(5),
  confidence: z.number().min(0).max(1),
  priority_score: z.number(),
  priority_breakdown: z.object({
    severity_norm: z.number(),
    confidence: z.number(),
    zone_density_norm: z.number(),
    open_issue_count_norm: z.number(),
    raw_score: z.number(),
    formula: z.string(),
  }),
  reasoning: z.string(),
  recommended_actions: z.array(z.string()),
  needs_human_review: z.boolean(),
  specialist_findings: z.object({
    gatekeeper: z.object({ valid: z.boolean(), reason: z.string() }),
    road: z.object({ severity: z.number(), confidence: z.number(), evidence: z.string(), findings: z.string() }),
    waste: z.object({ severity: z.number(), confidence: z.number(), evidence: z.string(), findings: z.string() }),
    water: z.object({ severity: z.number(), confidence: z.number(), evidence: z.string(), findings: z.string() }),
  }),
  is_demo: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mineOnly = searchParams.get('mine') === 'true';

  try {
    if (session.role === 'authority' && !mineOnly) {
      // GCC Officials on /review board view all city-wide issues
      const allIssues = await getAllIssues();
      return NextResponse.json({ issues: allIssues });
    } else {
      // Private user portal (/my-reports): strictly the user's OWN submitted reports
      const myIssues = await getIssuesByUserId(session.userId, session.name);
      return NextResponse.json({ issues: myIssues });
    }
  } catch (err: any) {
    console.error('Fetch issues error:', err);
    return NextResponse.json({ error: 'Failed to retrieve issues' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Please log in to submit reports' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreateIssueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid issue data' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const issueId = `iss_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newIssue: Issue = {
      id: issueId,
      user_id: session.userId,
      user_name: session.name,
      zone: data.zone,
      image_url: data.image_url,
      note: data.note,
      issue_type: data.issue_type,
      severity: data.severity,
      confidence: data.confidence,
      priority_score: data.priority_score,
      priority_breakdown: data.priority_breakdown,
      reasoning: data.reasoning,
      recommended_actions: data.recommended_actions,
      needs_human_review: data.needs_human_review,
      status: 'analyzed',
      specialist_findings: data.specialist_findings,
      is_demo: data.is_demo ?? false,
      created_at: new Date().toISOString(),
    };

    const saved = await createIssue(newIssue);
    return NextResponse.json({ issue: saved }, { status: 201 });
  } catch (err: any) {
    console.error('Create issue error:', err);
    return NextResponse.json({ error: 'Failed to save issue report' }, { status: 500 });
  }
}
