import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const db = await getDb();
    const path = await db.collection('learning_paths').findOne(
      { learnerId: user.id, status: 'active' },
      { sort: { createdAt: -1 } }
    );

    if (!path) return NextResponse.json({ path: null });

    return NextResponse.json({
      path: { ...path, _id: path._id.toString() }
    });
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
