import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: true, message: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection('learners').findOne({ email });
    if (existing) {
      return NextResponse.json({ error: true, message: 'Email already registered' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const learner = { name, email, passwordHash, createdAt: new Date() };
    const result = await db.collection('learners').insertOne(learner);

    const tokenPayload = { id: result.insertedId.toString(), email, name };
    const token = await signToken(tokenPayload);

    const response = NextResponse.json({ user: tokenPayload });
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
