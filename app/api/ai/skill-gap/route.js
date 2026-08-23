import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { askLLM } from '@/lib/llmClient';
import { topoSortMissingTopics } from '@/lib/skillGraph';
import { skillTaxonomy } from '@/lib/skillTaxonomy';

const SYSTEM_PROMPT = `You are an expert skills assessor and learning gap analyst.
Given a learner's profile and goal domain, identify their precise skill gaps.
Always respond with valid JSON only — no prose, no markdown fences.`;

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const { domain, experienceLevel, completedCourses, interests } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: true, message: 'domain is required' }, { status: 400 });
    }

    // Get deterministic missing topics via graph traversal
    const missingTopics = topoSortMissingTopics(domain, completedCourses || []);
    const missingTopicNames = missingTopics.map(t => t.topic);
    const allDomainTopics = (skillTaxonomy[domain] || []).map(t => t.topic);

    // Ask LLM to prioritize and enrich the skill gap analysis
    const userPrompt = `A learner wants to master "${domain}".
Experience level: ${experienceLevel || 'beginner'}
Topics already known: ${(completedCourses || []).join(', ') || 'none'}
Interests: ${(interests || []).join(', ') || 'general'}

All topics in this domain (ordered): ${allDomainTopics.join(', ')}
Topics they are missing (topological order): ${missingTopicNames.join(', ')}

Return a JSON object:
{
  "prioritizedGaps": [ { "topic": string, "urgency": "high"|"medium"|"low", "reason": string } ],
  "estimatedWeeksToFill": number,
  "quickWins": [string],
  "bottlenecks": [string]
}`;

    const analysis = await askLLM(SYSTEM_PROMPT, userPrompt, { jsonMode: true });

    return NextResponse.json({
      domain,
      missingTopics,
      analysis
    });
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
