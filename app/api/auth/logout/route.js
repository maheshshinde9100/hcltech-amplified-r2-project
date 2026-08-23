import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set({ name: 'token', value: '', httpOnly: true, path: '/', maxAge: 0 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
