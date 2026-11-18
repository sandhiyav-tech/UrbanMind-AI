import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/session';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  if (session.role !== 'authority') {
    return NextResponse.json({ error: 'Forbidden: City Official role required to view evaluation metrics' }, { status: 403 });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'eval-results.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Eval data error:', err);
    return NextResponse.json({ error: 'Failed to load evaluation data' }, { status: 500 });
  }
}
