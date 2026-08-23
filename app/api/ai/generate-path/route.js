import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { askLLM } from '@/lib/llmClient';

const SYSTEM_PROMPT = `You are an expert AI learning path designer.
Given a learner's profile and skill gaps, create a structured, achievable learning roadmap.
Always respond with valid JSON only — no prose, no markdown fences.`;

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const {
      domain,
      specificGoal,
      targetRole,
      experienceLevel,
      learningStyle,
      timeframe,
      prioritizedGaps,
      quickWins
    } = await request.json();

    if (!domain || !specificGoal) {
      return NextResponse.json({ error: true, message: 'domain and specificGoal are required' }, { status: 400 });
    }

    const gaps = (prioritizedGaps || []).map(g => `${g.topic} (${g.urgency} urgency)`).join(', ');
    const timeframeLine = timeframe ? `Target timeframe: ${timeframe} months` : 'No fixed timeframe';

    const userPrompt = `Design a personalized learning path for:
Goal: ${specificGoal}
Target Role: ${targetRole || domain + ' professional'}
Domain: ${domain}
Experience: ${experienceLevel || 'beginner'}
Learning Style: ${learningStyle || 'mixed'}
${timeframeLine}
Key skill gaps (prioritized): ${gaps || 'all foundational skills'}
Quick wins to start with: ${(quickWins || []).join(', ') || 'foundational topics'}

Return a JSON object with this exact structure:
{
  "title": string,
  "description": string,
  "totalEstimatedWeeks": number,
  "milestones": [
    {
      "id": string (e.g. "m1"),
      "title": string,
      "description": string,
      "topics": [string],
      "estimatedWeeks": number,
      "order": number,
      "type": "foundation"|"core"|"advanced"|"project",
      "resources": []
    }
  ]
}

Generate 5–7 milestones. Keep descriptions concise and motivating.`;

    const path = await askLLM(SYSTEM_PROMPT, userPrompt, { jsonMode: true });

    return NextResponse.json({ path });
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
