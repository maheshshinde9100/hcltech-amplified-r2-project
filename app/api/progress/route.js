import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const db = await getDb();

    // Current progress snapshot
    const progress = await db.collection('progress').findOne({ learnerId: user.id });

    // Active learning path for milestone breakdown
    const path = await db.collection('learning_paths').findOne({ learnerId: user.id, status: 'active' });
    const milestones = (path?.milestones || []).map(m => ({
      id: m.id,
      title: m.title,
      status: m.status || 'not_started',
      estimatedWeeks: m.estimatedWeeks,
      type: m.type,
      completedAt: m.completedAt
    }));

    return NextResponse.json({
      progressPercent: progress?.progressPercent ?? 0,
      completedMilestones: progress?.completedMilestones ?? 0,
      totalMilestones: progress?.totalMilestones ?? milestones.length,
      lastActivity: progress?.lastActivity ?? null,
      milestones
    });
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
