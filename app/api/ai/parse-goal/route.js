import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { askLLM } from '@/lib/llmClient';

const SYSTEM_PROMPT = `You are an expert career advisor and learning coach.
Given a user's career goal description, extract structured information.
Always respond with valid JSON only — no prose, no markdown fences.`;

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const { goalText } = await request.json();
    if (!goalText || goalText.trim().length < 5) {
      return NextResponse.json({ error: true, message: 'goalText is required (min 5 chars)' }, { status: 400 });
    }

    const userPrompt = `Parse this career goal and return a JSON object with these fields:
- domain: one of ["Web Development","Data Science","DSA/Backend Engineering","Cloud/DevOps","Other"]
- specificGoal: a concise rephrasing of the goal (max 20 words)
- targetRole: the job title they are aiming for
- skills: array of specific skills they mentioned or implied
- timeframe: estimated months to achieve (number), or null if unspecified
- difficulty: "beginner" | "intermediate" | "advanced"

Goal: "${goalText}"`;

    const parsed = await askLLM(SYSTEM_PROMPT, userPrompt, { jsonMode: true });

    return NextResponse.json({ parsed });
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
