import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: true, message: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const learner = await db.collection('learners').findOne({ email });
    if (!learner) {
      return NextResponse.json({ error: true, message: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, learner.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: true, message: 'Invalid credentials' }, { status: 401 });
    }

    const tokenPayload = { id: learner._id.toString(), email: learner.email, name: learner.name };
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
