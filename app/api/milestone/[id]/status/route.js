import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { generatePathLogic } from '@/app/api/path/generate/route';

export async function PATCH(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const status = body.status;
    const feedback = body.feedback || '';

    const validStatuses = ['not_started', 'in_progress', 'completed', 'struggling'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: true, message: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const db = await getDb();
    const path = await db.collection('learning_paths').findOne({ learnerId: user.id, status: 'active' });
    if (!path) return NextResponse.json({ error: true, message: 'Active path not found' }, { status: 404 });

    const milestones = path.milestones || [];
    console.log('[Milestone Update] Looking for ID:', id);
    console.log('[Milestone Update] Available milestones:', milestones.map(m => ({ id: m.id, title: m.title })));
    
    let milestoneIndex = milestones.findIndex(m => m.id === id);
    
    // Fallback 1: if ID not found, try parsing as array index
    if (milestoneIndex === -1 && !isNaN(parseInt(id))) {
      const index = parseInt(id);
      if (index >= 0 && index < milestones.length) {
        milestoneIndex = index;
      }
    }
    
    // Fallback 2: try extracting number from string IDs like 'm1', 'm2', 'ms-123-0'
    if (milestoneIndex === -1) {
      const match = id.match(/\d+/);
      if (match) {
        const extractedNum = parseInt(match[0]);
        // Try as direct index first
        if (extractedNum >= 0 && extractedNum < milestones.length) {
          milestoneIndex = extractedNum;
        } else {
          // Try finding by matching the numeric part in existing IDs
          milestoneIndex = milestones.findIndex(m => m.id && m.id.includes(match[0]));
        }
      }
    }
    
    if (milestoneIndex === -1) {
      console.log('[Milestone Update] Milestone not found after all fallbacks');
      return NextResponse.json({ error: true, message: 'Milestone not found' }, { status: 404 });
    }
    
    console.log('[Milestone Update] Found milestone at index:', milestoneIndex);

    let updatedMilestones = [...milestones];
    let reGenerated = false;

    // Log the progress change
    await db.collection('progress_logs').insertOne({
      learnerId: user.id,
      milestoneId: id,
      oldStatus: milestones[milestoneIndex].status,
      newStatus: status,
      feedback,
      timestamp: new Date()
    });

    if (status === 'struggling' || feedback.toLowerCase().includes('struggling') || feedback.toLowerCase().includes('too hard')) {
      // Keep completed and currently active ones (up to the struggling one)
      const keptMilestones = updatedMilestones.slice(0, milestoneIndex);
      const remainingTopics = updatedMilestones.slice(milestoneIndex).flatMap(m => m.topics || []);

      // If we have remaining topics, we regenerate the tail end
      if (remainingTopics.length > 0) {
        // Find profile to pass into the generator
        const profile = await db.collection('learner_profiles').findOne({ learnerId: user.id });
        
        // Pseudo-generation: this would normally hit the LLM again but with only remaining topics.
        // We will call the generate logic but fake a new payload for now if we can't easily isolate the topics,
        // or we'll just modify the milestone to be "broken down" into smaller pieces.
        // Wait, PROJECT.md says "call the generate-path logic in-process again, passing only the remaining... and replace them"
        
        // Actually, we can fetch from Groq here to break it down.
        // Let's implement a simpler version of the LLM call directly here to break down the struggling milestone.
        const { askLLM } = await import('@/lib/llmClient');
        const systemPrompt = `You are an AI tutor. The learner is struggling with the following milestone topics: ${remainingTopics.join(', ')}. Break these topics down into easier, more foundational milestones. Return a JSON array of milestones: [{ "id": "uuid", "title": "string", "description": "string", "type": "foundation", "topics": ["string"], "estimatedWeeks": 1, "status": "not_started" }]. Use simple terminology. Limit to 3-5 new milestones.`;
        
        try {
          const response = await askLLM(systemPrompt, `Rewrite the roadmap from here for someone who found it too difficult. Goal: ${profile?.careerGoal}`, { jsonMode: true });
          const newMilestones = Array.isArray(response) ? response : (response.milestones || response.newMilestones || []);
          if (newMilestones.length > 0) {
             // ensure IDs exist
             newMilestones.forEach((nm, idx) => {
               if(!nm.id) nm.id = `regen-${Date.now()}-${idx}`;
               nm.status = 'not_started';
               nm.resources = updatedMilestones[milestoneIndex].resources || []; // carry over some resources or fetch new ones
             });
             updatedMilestones = [...keptMilestones, ...newMilestones];
             reGenerated = true;
          } else {
             // fallback if LLM returns empty
             updatedMilestones[milestoneIndex].status = 'in_progress';
          }
        } catch(e) {
          console.error("Adaptive re-plan failed", e);
          updatedMilestones[milestoneIndex].status = 'in_progress'; // fallback
        }
      }
    } else {
      updatedMilestones[milestoneIndex].status = status;
      updatedMilestones[milestoneIndex].completedAt = status === 'completed' ? new Date() : null;
    }

    await db.collection('learning_paths').updateOne(
      { _id: path._id },
      {
        $set: {
          milestones: updatedMilestones,
          updatedAt: new Date()
        }
      }
    );

    const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
    const progressPercent = updatedMilestones.length > 0
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : 0;

    await db.collection('progress').updateOne(
      { learnerId: user.id },
      {
        $set: {
          learnerId: user.id,
          progressPercent,
          completedMilestones: completedCount,
          totalMilestones: updatedMilestones.length,
          lastActivity: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      milestoneId: id,
      status: status === 'struggling' && !reGenerated ? 'in_progress' : status,
      progressPercent,
      reGenerated
    });
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
