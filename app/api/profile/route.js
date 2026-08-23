import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const db = await getDb();
    const profile = await db.collection('learner_profiles').findOne({ learnerId: user.id });
    return NextResponse.json({ profile: profile || {} });
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { interests, experienceLevel, completedCourses, careerGoal, learningStyle, timeframe } = body;
    
    // minimal validation
    if (!experienceLevel || !careerGoal) {
      return NextResponse.json({ error: true, message: 'experienceLevel and careerGoal are required' }, { status: 400 });
    }

    const db = await getDb();
    const newProfile = {
      learnerId: user.id,
      interests: interests || [],
      experienceLevel,
      completedCourses: completedCourses || [],
      careerGoal,
      learningStyle: learningStyle || 'mixed',
      timeframe: timeframe || 'flexible',
      updatedAt: new Date()
    };
    
    await db.collection('learner_profiles').updateOne(
      { learnerId: user.id },
      { $set: newProfile },
      { upsert: true }
    );
    return NextResponse.json({ profile: newProfile });
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const db = await getDb();
    
    body.updatedAt = new Date();
    // Prevent updating learnerId
    delete body.learnerId;
    delete body._id;

    await db.collection('learner_profiles').updateOne(
      { learnerId: user.id },
      { $set: body }
    );
    
    const updatedProfile = await db.collection('learner_profiles').findOne({ learnerId: user.id });
    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
