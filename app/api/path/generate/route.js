import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { askLLM } from '@/lib/llmClient';
import { topoSortMissingTopics } from '@/lib/skillGraph';
import { skillTaxonomy } from '@/lib/skillTaxonomy';

const PARSE_GOAL_SYSTEM = `You are an expert career advisor. Extract structured info from a user's career goal.
Return valid JSON only.`;

const SKILL_GAP_SYSTEM = `You are an expert skills assessor. Identify skill gaps and priorities.
Return valid JSON only.`;

const PATH_GEN_SYSTEM = `You are an expert AI learning path designer. Create a structured roadmap.
Return valid JSON only.`;

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { goalText } = body;
    if (!goalText) {
      return NextResponse.json({ error: true, message: 'goalText is required' }, { status: 400 });
    }

    const db = await getDb();

    // ─── Step 1: Parse the learner profile ─────────────────────────────────────
    const profileDoc = await db.collection('learner_profiles').findOne({ learnerId: user.id });
    const profile = profileDoc || {};

    // ─── Step 2: Parse goal via LLM ─────────────────────────────────────────────
    const parsedGoal = await askLLM(
      PARSE_GOAL_SYSTEM,
      `Parse this career goal and return JSON with:
- domain: one of ${JSON.stringify(Object.keys(skillTaxonomy).concat(['Other']))}
- specificGoal: concise rephrasing (max 20 words)
- targetRole: job title
- skills: array of mentioned/implied skills
- timeframe: months or null
- difficulty: "beginner"|"intermediate"|"advanced"

Goal: "${goalText}"`,
      { jsonMode: true }
    );

    const domain = Object.keys(skillTaxonomy).includes(parsedGoal.domain)
      ? parsedGoal.domain
      : Object.keys(skillTaxonomy)[0];

    // ─── Step 3: Skill gap analysis ──────────────────────────────────────────────
    const completedCourses = profile.completedCourses || [];
    const missingTopics = topoSortMissingTopics(domain, completedCourses);
    const missingTopicNames = missingTopics.map(t => t.topic);
    const allDomainTopics = (skillTaxonomy[domain] || []).map(t => t.topic);

    const skillGapAnalysis = await askLLM(
      SKILL_GAP_SYSTEM,
      `Learner wants: "${parsedGoal.specificGoal}" in domain "${domain}".
Experience: ${profile.experienceLevel || parsedGoal.difficulty || 'beginner'}
Known topics: ${completedCourses.join(', ') || 'none'}
All domain topics: ${allDomainTopics.join(', ')}
Missing topics (ordered): ${missingTopicNames.join(', ')}

Return JSON:
{
  "prioritizedGaps": [ { "topic": string, "urgency": "high"|"medium"|"low", "reason": string } ],
  "estimatedWeeksToFill": number,
  "quickWins": [string],
  "bottlenecks": [string]
}`,
      { jsonMode: true }
    );

    // ─── Step 4: Generate learning path ─────────────────────────────────────────
    const gaps = (skillGapAnalysis.prioritizedGaps || [])
      .slice(0, 8)
      .map(g => `${g.topic} (${g.urgency} urgency)`)
      .join(', ');

    const generatedPath = await askLLM(
      PATH_GEN_SYSTEM,
      `Design a personalized learning path for:
Goal: ${parsedGoal.specificGoal}
Target Role: ${parsedGoal.targetRole || domain + ' professional'}
Domain: ${domain}
Experience: ${profile.experienceLevel || parsedGoal.difficulty || 'beginner'}
Learning Style: ${profile.learningStyle || 'mixed'}
Skill gaps (top 8): ${gaps}
Quick wins: ${(skillGapAnalysis.quickWins || []).join(', ')}

Return JSON:
{
  "title": string,
  "description": string,
  "totalEstimatedWeeks": number,
  "milestones": [
    {
      "id": string,
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
Generate 5–7 milestones. Keep descriptions concise.`,
      { jsonMode: true }
    );

    // ─── Step 5: Fetch matching resources for each milestone ─────────────────────
    const allMilestoneTopics = (generatedPath.milestones || []).flatMap(m => m.topics || []);
    const uniqueTopics = [...new Set(allMilestoneTopics)];

    const resources = await db.collection('resources').find({
      topics: { $in: uniqueTopics }
    }).limit(40).toArray();

    // Distribute resources into matching milestones
    const enrichedMilestones = (generatedPath.milestones || []).map(milestone => {
      const milestoneResources = resources
        .filter(r => r.topics.some(t => milestone.topics.includes(t)))
        .slice(0, 4)
        .map(r => ({ ...r, _id: r._id.toString() }));
      return { ...milestone, resources: milestoneResources };
    });

    // ─── Step 6: Persist the path in MongoDB ────────────────────────────────────
    const pathDoc = {
      learnerId: user.id,
      goalText,
      parsedGoal,
      domain,
      skillGapAnalysis,
      title: generatedPath.title,
      description: generatedPath.description,
      totalEstimatedWeeks: generatedPath.totalEstimatedWeeks,
      milestones: enrichedMilestones,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Upsert: one active path per learner
    await db.collection('learning_paths').updateOne(
      { learnerId: user.id, status: 'active' },
      { $set: pathDoc },
      { upsert: true }
    );

    const saved = await db.collection('learning_paths').findOne({ learnerId: user.id, status: 'active' });

    return NextResponse.json({
      path: { ...saved, _id: saved._id.toString() }
    });
  } catch (error) {
    console.error('[/api/path/generate] error:', error);
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
