import { ConsentedContext, CompanionReply } from '../../types';
import { SafetyEngine } from '../safety/safetyEngine';
import { config } from '../../config';
import { db } from '../../database/db';

export class CompanionService {
  public static async processUserMessage(
    wellbeingId: string,
    message: string,
    context: ConsentedContext
  ): Promise<CompanionReply> {
    // 1. Log incoming user message
    db.addAIMessage({
      wellbeing_id: wellbeingId,
      sender: 'user',
      message
    });

    // 2. Strict Safety Tier Classification (Immediate 3-tier check)
    const safety = SafetyEngine.classify(message);

    if (safety.tier === 'RED') {
      const redResponse = "I'm hearing how much pain you are in right now. Your life is important, and you don't have to carry this alone. Please connect with immediate professional support right now. Tele-MANAS (14416) is free, 24/7, and confidential.";
      
      db.addAIMessage({
        wellbeing_id: wellbeingId,
        sender: 'assistant',
        message: redResponse,
        safety_tier: 'RED'
      });

      return {
        reply: redResponse,
        safetyTier: 'RED',
        suggestedAction: 'SAFETY_MODE',
        crisisResources: safety.crisisResources
      };
    }

    if (safety.tier === 'YELLOW') {
      const yellowResponse = "It sounds like you're carrying a heavy load right now. I'm here to listen, but having a real person can help lighten the weight. Would you like me to connect you with a campus counsellor discreetly?";
      
      db.addAIMessage({
        wellbeing_id: wellbeingId,
        sender: 'assistant',
        message: yellowResponse,
        safety_tier: 'YELLOW'
      });

      return {
        reply: yellowResponse,
        safetyTier: 'YELLOW',
        suggestedAction: 'OFFER_COUNSELLOR',
        crisisResources: safety.crisisResources
      };
    }

    // Standard Green Empathetic Response Generation
    let reply = '';
    const apiKey = config.ai.apiKey;
    const hasValidKey = Boolean(apiKey && apiKey.startsWith('AIzaSy') && apiKey.length > 20);

    if (hasValidKey) {
      reply = await this.generateGeminiResponse(message, context);
    }
    
    // Built-in empathetic engine fallback
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
      const model = config.ai.model || 'gemini-1.5-flash';
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
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        return '';
      }

      const data = await response.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return text || '';
    } catch {
      // Gracefully fall back to the built-in empathetic engine without terminal spam
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

    if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('panic') || lower.includes('overwhelmed') || lower.includes('stress')) {
      return `It's completely okay that you're feeling this way right now. Let's ground ourselves: feel your feet resting on the floor and take one deep, gentle breath with me.`;
    }

    if (lower.includes('breathe') || lower.includes('reset') || lower.includes('calm')) {
      return `Let's take a moment together. Inhale gently for 4 counts... hold for 4... and release for 6. Notice how your shoulders drop.`;
    }

    return `Thank you for sharing that with me, ${name}. You don't have to carry everything all at once. I'm right here with you.`;
  }
}
