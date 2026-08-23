import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = cookies();
  // Support Next.js 15 (Promise) or Next.js 14 (sync)
  const resolvedCookies = cookieStore instanceof Promise ? await cookieStore : cookieStore;
  const token = resolvedCookies.get('token')?.value;
  if (!token) return null;
  
  const decoded = await verifyToken(token);
  return decoded;
}
