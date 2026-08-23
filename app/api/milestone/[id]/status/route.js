import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';

export async function PATCH(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const { id } = params;
    const { status } = await request.json();

    const validStatuses = ['not_started', 'in_progress', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: true, message: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Update the milestone inside the learning path doc
    const result = await db.collection('learning_paths').updateOne(
      { learnerId: user.id, status: 'active', 'milestones.id': id },
      {
        $set: {
          'milestones.$.status': status,
          'milestones.$.completedAt': status === 'completed' ? new Date() : null,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: true, message: 'Milestone not found' }, { status: 404 });
    }

    // Return updated path
    const path = await db.collection('learning_paths').findOne({ learnerId: user.id, status: 'active' });

    // Compute progress percentage
    const milestones = path.milestones || [];
    const completedCount = milestones.filter(m => m.status === 'completed').length;
    const progressPercent = milestones.length > 0
      ? Math.round((completedCount / milestones.length) * 100)
      : 0;

    // Persist progress snapshot
    await db.collection('progress').updateOne(
      { learnerId: user.id },
      {
        $set: {
          learnerId: user.id,
          progressPercent,
          completedMilestones: completedCount,
          totalMilestones: milestones.length,
          lastActivity: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      milestoneId: id,
      status,
      progressPercent
    });
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
