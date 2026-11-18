import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSession } from '@/lib/session';
import { getIssueById, updateIssue } from '@/lib/db';

const ReviewActionSchema = z.object({
  action: z.enum(['approve', 'edit', 'reject']),
  decision_notes: z.string().min(2, 'A decision comment is required'),
  edited_severity: z.number().int().min(1).max(5).optional(),
  edited_actions: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  // Authority role check
  if (session.role !== 'authority') {
    return NextResponse.json(
      { error: 'Forbidden: Only GCC city officials have authority to review and approve issues' },
      { status: 403 }
    );
  }

  try {
    const issueId = params.id;
    const existing = await getIssueById(issueId);
    if (!existing) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = ReviewActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid review action data' },
        { status: 400 }
      );
    }

    const { action, decision_notes, edited_severity, edited_actions } = parsed.data;

    let newStatus: 'approved' | 'edited' | 'rejected' = 'approved';
    if (action === 'reject') newStatus = 'rejected';
    else if (action === 'edit') newStatus = 'edited';

    const updates: any = {
      status: newStatus,
      decision_notes,
      decided_by: session.email,
      decided_at: new Date().toISOString(),
    };

    if (action === 'edit') {
      if (edited_severity) updates.severity = edited_severity;
      if (edited_actions && edited_actions.length > 0) updates.recommended_actions = edited_actions;
    }

    const updated = await updateIssue(issueId, updates);
    return NextResponse.json({ success: true, issue: updated });
  } catch (err: any) {
    console.error('Review issue error:', err);
    return NextResponse.json({ error: 'Failed to update issue review' }, { status: 500 });
  }
}
