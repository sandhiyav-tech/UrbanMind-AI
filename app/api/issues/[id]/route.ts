import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/session';
import { getIssueById, deleteIssue } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = params.id;
    const issue = await getIssueById(issueId);
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }
    return NextResponse.json({ issue });
  } catch (err: any) {
    console.error('Fetch issue error:', err);
    return NextResponse.json({ error: 'Failed to fetch issue' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  try {
    const issueId = params.id;
    const issue = await getIssueById(issueId);

    // If issue exists in database/store, verify ownership
    if (issue) {
      const isOwner =
        issue.user_id === session.userId ||
        (issue.user_name && session.name && issue.user_name.toLowerCase().includes(session.name.toLowerCase()));
      const isAuthority = session.role === 'authority';

      if (!isOwner && !isAuthority) {
        return NextResponse.json(
          { error: 'Forbidden: You can only delete your own submitted reports' },
          { status: 403 }
        );
      }
    }

    await deleteIssue(issueId);

    return NextResponse.json({
      success: true,
      message: `Report #${issueId} successfully deleted`,
      deletedId: issueId,
    });
  } catch (err: any) {
    console.error('Delete issue error:', err);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
