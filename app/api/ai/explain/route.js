import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { askLLM } from '@/lib/llmClient';

const SYSTEM_PROMPT = `You are an expert computer science and software engineering tutor.
Explain concepts clearly, with analogies and real-world examples.
Tailor your explanation to the learner's experience level.`;

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const { topic, experienceLevel, context } = await request.json();
    if (!topic) {
      return NextResponse.json({ error: true, message: 'topic is required' }, { status: 400 });
    }

    const userPrompt = `Explain the following topic for a ${experienceLevel || 'beginner'} learner:
Topic: "${topic}"
${context ? `Context / what they are confused about: "${context}"` : ''}

Your explanation should:
1. Start with a simple definition (1-2 sentences)
2. Give a real-world analogy
3. Show a minimal code example if applicable
4. List 3 key takeaways
5. Suggest what to learn next

Keep it concise, friendly, and encouraging.`;

    const explanation = await askLLM(SYSTEM_PROMPT, userPrompt);

    return NextResponse.json({ explanation });
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
