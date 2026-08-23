import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { askLLM } from '@/lib/llmClient';

const SYSTEM_PROMPT = `You are an expert learning resource curator.
Given a learner's topic, level, and style, pick the best resources from the catalog and explain why each fits.
Always respond with valid JSON only — no prose, no markdown fences.`;

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const { topics, experienceLevel, learningStyle, limit = 5 } = await request.json();
    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: true, message: 'topics array is required' }, { status: 400 });
    }

    const db = await getDb();
    // Fetch candidate resources from DB matching the topics
    const candidates = await db.collection('resources').find({
      topics: { $in: topics },
      difficulty: { $in: [experienceLevel || 'beginner', 'intermediate'] }
    }).limit(30).toArray();

    if (candidates.length === 0) {
      return NextResponse.json({ recommendations: [], message: 'No matching resources found in catalog.' });
    }

    const catalogSummary = candidates.map((r, i) =>
      `[${i}] "${r.title}" | type: ${r.type} | difficulty: ${r.difficulty} | topics: ${r.topics.join(', ')} | hours: ${r.estimatedHours}`
    ).join('\n');

    const userPrompt = `Learner profile:
Topics to learn: ${topics.join(', ')}
Experience level: ${experienceLevel || 'beginner'}
Learning style: ${learningStyle || 'mixed'}

Available resources catalog (indexed):
${catalogSummary}

Return a JSON object:
{
  "recommendations": [
    { "index": number, "reason": string, "priority": "must-do"|"recommended"|"optional" }
  ]
}

Pick the top ${limit} best resources ranked by fit. Be specific in the reason field.`;

    const result = await askLLM(SYSTEM_PROMPT, userPrompt, { jsonMode: true });

    // Map back from index to actual resource objects
    const recommendations = (result.recommendations || []).map(rec => ({
      ...candidates[rec.index],
      _id: candidates[rec.index]?._id?.toString(),
      reason: rec.reason,
      priority: rec.priority
    }));

    return NextResponse.json({ recommendations });
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
