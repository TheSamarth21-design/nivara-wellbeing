import { ContextService, ConsentedContext } from './contextService.js';
import { RiskEngine } from '../safety/riskEngine.js';
import { SafetyResponseService } from '../safety/safetyResponseService.js';
import { db } from '../../db/databaseAdapter.js';
import { config } from '../../config/index.js';

export class CompanionService {
  public static async processUserMessage(wellbeingId: string, message: string): Promise<{
    reply: string;
    safetyTier: 'GREEN' | 'YELLOW' | 'RED';
    suggestedAction?: string;
    crisisResources?: any[];
  }> {
    // 1. Safety Filter First (Layered Deterministic + Contextual)
    const safety = RiskEngine.evaluateMessage(wellbeingId, message);
    const context = ContextService.buildContext(wellbeingId);

    // Save user message
    db.addAIMessage({
      wellbeing_id: wellbeingId,
      sender: 'user',
      message,
      safety_tier: safety.tier
    });

    if (safety.tier === 'RED') {
      const redReply = SafetyResponseService.getRedResponse(context.preferredName, context.preferredLanguage);
      db.addAIMessage({
        wellbeing_id: wellbeingId,
        sender: 'assistant',
        message: redReply,
        safety_tier: 'RED',
        suggested_action: 'TRIGGER_SAFETY_MODE'
      });
      return {
        reply: redReply,
        safetyTier: 'RED',
        suggestedAction: 'TRIGGER_SAFETY_MODE',
        crisisResources: safety.crisisResources
      };
    }

    if (safety.tier === 'YELLOW') {
      const yellowReply = SafetyResponseService.getYellowNudge(context.preferredName, context.preferredLanguage);
      db.addAIMessage({
        wellbeing_id: wellbeingId,
        sender: 'assistant',
        message: yellowReply,
        safety_tier: 'YELLOW',
        suggested_action: 'OFFER_COUNSELLOR'
      });
      return {
        reply: yellowReply,
        safetyTier: 'YELLOW',
        suggestedAction: 'OFFER_COUNSELLOR',
        crisisResources: safety.crisisResources
      };
    }

    // Standard Green Empathetic Response Generation (Gemini AI with deterministic fallback)
    let reply = '';
    if (config.ai.apiKey) {
      reply = await this.generateGeminiResponse(message, context);
    }
    
    if (!reply) {
      reply = this.generateEmpatheticResponse(message, context);
    }
    
    db.addAIMessage({
      wellbeing_id: wellbeingId,
      sender: 'assistant',
      message: reply,
      safety_tier: 'GREEN'
    });

    return {
      reply,
      safetyTier: 'GREEN'
    };
  }

  private static async generateGeminiResponse(msg: string, ctx: ConsentedContext): Promise<string> {
    try {
      const apiKey = config.ai.apiKey;
      const model = config.ai.model || 'gemini-3.6-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const systemPrompt = `You are Nivara AI, a warm, compassionate, empathetic student mental wellbeing digital companion on an Indian university campus.
Tone & Persona:
- Warm, non-judgmental, grounded, supportive, and validating.
- Keep answers concise (2 to 4 sentences max) so they are easy to read on mobile.
- Offer actionable micro-coping strategies (breathing, 5-minute break, task chunking) when appropriate.
- Never give clinical diagnoses, medical prescriptions, or toxic positivity.
- Preferred user name: ${ctx.preferredName || 'Friend'}.
${ctx.primaryGoal ? `- User goal: ${ctx.primaryGoal}` : ''}
${ctx.academicWorkload ? `- Academic workload: ${ctx.academicWorkload}` : ''}
${ctx.routineSleep ? `- Routine sleep: ${ctx.routineSleep}` : ''}
${ctx.recentCheckinMood ? `- Recent mood: ${ctx.recentCheckinMood}` : ''}
${ctx.stressors?.length ? `- Stressors: ${ctx.stressors.join(', ')}` : ''}
${ctx.approvedMemories?.length ? `- Consented memories: ${ctx.approvedMemories.map(m => `${m.key}: ${m.value}`).join('; ')}` : ''}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: msg }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7
          }
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        console.warn(`[Gemini API] Request failed with status ${response.status}`);
        return '';
      }

      const data = await response.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return text || '';
    } catch (err) {
      console.warn('[Gemini API] Failed to generate response, falling back to local engine:', (err as Error).message);
      return '';
    }
  }

  private static generateEmpatheticResponse(msg: string, ctx: any): string {
    const lower = msg.toLowerCase();
    const name = ctx.preferredName || 'there';

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return `Hello ${name} 🌿 It's good to see you. How is your day feeling so far?`;
    }

    if (lower.includes('exam') || lower.includes('study') || lower.includes('assignment') || lower.includes('workload')) {
      return `Academic pressure can feel overwhelming when deadlines cluster together. Take a slow breath. Would it help to break down what's immediately on your desk into one small, manageable step?`;
    }

    if (lower.includes('sleep') || lower.includes('tired') || lower.includes('exhausted') || lower.includes('insomnia')) {
      return `Rest is foundational, and it's hard when your mind won't quiet down. Would you like to try a gentle 2-minute breathing reset, or talk through what's keeping you awake?`;
    }

    if (lower.includes('lonely') || lower.includes('isolated') || lower.includes('friend') || lower.includes('nobody')) {
      return `Feeling disconnected is painful, especially during busy campus semesters. I'm here to listen quietly without judgment. What's been on your mind today?`;
    }

    if (lower.includes('breathe') || lower.includes('reset') || lower.includes('calm')) {
      return `Let's take a moment together. Inhale gently for 4 counts... hold for 4... and release for 6. Repeat this twice. Notice how your shoulders feel.`;
    }

    return `Thank you for sharing that with me, ${name}. You don't have to figure everything out all at once. What would feel most supportive for you right now?`;
  }
}

