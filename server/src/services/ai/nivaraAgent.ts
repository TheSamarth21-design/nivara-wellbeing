import { db, StudentWellbeingProfile } from '../../db/databaseAdapter.js';
import { RiskEngine } from '../safety/riskEngine.js';
import { ContextService, ConsentedContext } from './contextService.js';
import { config } from '../../config/index.js';
import { CompanionReply } from '../../types/index.js';

export class NivaraAgent {
  public static async processMessage(
    wellbeingId: string,
    message: string
  ): Promise<CompanionReply> {
    // 1. Log incoming student message
    db.addAIMessage({
      wellbeing_id: wellbeingId,
      sender: 'user',
      message
    });

    // 2. Strict 3-Tier Safety Engine Check (Crisis & Escalation Priority)
    const safety = RiskEngine.evaluateMessage(wellbeingId, message);

    if (safety.tier === 'RED') {
      const redResponse = "I hear how much pain you are in right now. Your life is important and you do not have to carry this alone. Please connect with immediate professional support right now. Tele-MANAS (14416) is free, 24/7, and completely confidential.";
      db.addAIMessage({
        wellbeing_id: wellbeingId,
        sender: 'assistant',
        message: redResponse,
        safety_tier: 'RED',
        suggested_action: 'SAFETY_MODE'
      });
      return {
        reply: redResponse,
        safetyTier: 'RED',
        suggestedAction: 'SAFETY_MODE',
        crisisResources: safety.crisisResources
      };
    }

    if (safety.tier === 'YELLOW') {
      const yellowResponse = "It sounds like you're carrying a heavy burden right now. I'm here to listen, but having a human presence can help lighten the weight. Would you like me to connect you with a campus counsellor discreetly?";
      db.addAIMessage({
        wellbeing_id: wellbeingId,
        sender: 'assistant',
        message: yellowResponse,
        safety_tier: 'YELLOW',
        suggested_action: 'OFFER_COUNSELLOR'
      });
      return {
        reply: yellowResponse,
        safetyTier: 'YELLOW',
        suggestedAction: 'OFFER_COUNSELLOR',
        crisisResources: safety.crisisResources
      };
    }

    // 3. Conversation Memory (Sliding window of recent turns)
    const recentMessages = db.getAIMessages(wellbeingId, 8);
    const conversationHistory = recentMessages.slice(0, -1).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.message
    }));

    // 4. Load Relevant Personalization Context
    const profile = db.getWellbeingProfile(wellbeingId);
    const consentedContext = ContextService.buildContext(wellbeingId);

    // 5. Generate Personalized AI Response
    let reply = '';
    const apiKey = config.ai.apiKey;
    const hasValidKey = Boolean(apiKey && apiKey.startsWith('AIzaSy') && apiKey.length > 20);

    if (hasValidKey) {
      reply = await this.callGemini(message, conversationHistory, profile, consentedContext);
    }

    // 6. Zero-latency built-in empathetic response engine fallback
    if (!reply) {
      reply = this.generateEmpatheticResponse(message, profile, consentedContext);
    }

    // 7. Save assistant reply to database
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

  private static async callGemini(
    currentMsg: string,
    history: Array<{ role: string; text: string }>,
    profile: StudentWellbeingProfile | undefined,
    ctx: ConsentedContext
  ): Promise<string> {
    try {
      const apiKey = config.ai.apiKey;
      const model = config.ai.model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      // Communication style directive
      const commStyle = profile?.preferences?.communicationStyle || 'calm';
      const styleInstruction =
        commStyle === 'direct'
          ? 'Be direct, practical, and structured. Break overwhelming tasks into clear, manageable steps.'
          : commStyle === 'motivational'
          ? 'Be uplifting and encouraging. Focus on the student’s inner agency, strengths, and forward momentum.'
          : commStyle === 'friendly'
          ? 'Be warm, relatable, peer-like, and conversational.'
          : 'Be calm, grounding, and reassuring. Offer gentle breathing or grounding pauses.';

      // Detail directive
      const supportStyle = profile?.preferences?.supportStyle || 'balanced';
      const lengthInstruction =
        supportStyle === 'short'
          ? 'Keep answers very concise (1 to 2 sentences max).'
          : supportStyle === 'detailed'
          ? 'Provide a thoughtful, well-explained response (3 to 4 sentences).'
          : 'Keep answers balanced and readable on mobile (2 to 3 sentences).';

      // Language directive
      const lang = profile?.preferences?.preferredLanguage || ctx.preferredLanguage || 'en';
      const langInstruction =
        lang === 'hi'
          ? 'Respond in empathetic conversational Hindi / Hinglish.'
          : lang === 'mr'
          ? 'Respond in empathetic Marathi.'
          : 'Respond in empathetic English.';

      const systemPrompt = `You are Nivara AI, a warm, non-clinical student wellbeing companion on an Indian campus.
Tone & Personalization Directives:
- ${styleInstruction}
- ${lengthInstruction}
- ${langInstruction}
- Preferred student name: ${ctx.preferredName || 'Friend'}
${profile?.currentContext?.situation ? `- Current situation: ${profile.currentContext.situation}` : ''}
${profile?.wellbeingPreferences?.mainConcerns?.length ? `- Main areas of support: ${profile.wellbeingPreferences.mainConcerns.join(', ')}` : ''}
${ctx.academicWorkload ? `- Workload: ${ctx.academicWorkload}` : ''}
${ctx.recentCheckinMood ? `- Recent mood pattern: ${ctx.recentCheckinMood}` : ''}
${ctx.approvedMemories?.length ? `- Approved memories: ${ctx.approvedMemories.map(m => `${m.key}: ${m.value}`).join('; ')}` : ''}

Strict Boundaries:
- NEVER give clinical medical diagnoses, psychiatric evaluations, or medication advice.
- NEVER use toxic positivity (e.g. "Just smile! Everything is great!").
- Do NOT repeat the student's profile back to them robotically. Use context naturally when relevant.`;

      const contents = [
        ...history.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        })),
        {
          role: 'user',
          parts: [{ text: currentMsg }]
        }
      ];

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            maxOutputTokens: 250,
            temperature: 0.7
          }
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) return '';

      const data = await response.json() as any;
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } catch {
      return '';
    }
  }

  private static generateEmpatheticResponse(
    msg: string,
    profile: StudentWellbeingProfile | undefined,
    ctx: ConsentedContext
  ): string {
    const lower = msg.toLowerCase();
    const name = ctx.preferredName || 'there';
    const commStyle = profile?.preferences?.communicationStyle || 'calm';

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      if (commStyle === 'direct') {
        return `Hello ${name}. I'm here to support you. What's on your agenda or mind today?`;
      }
      if (commStyle === 'motivational') {
        return `Hey ${name}! Great to see you. Whatever you're tackling today, we can work through it together.`;
      }
      return `Hello ${name} 🌿 It's good to see you. How is your day feeling so far?`;
    }

    if (lower.includes('exam') || lower.includes('study') || lower.includes('assignment') || lower.includes('workload')) {
      if (commStyle === 'direct') {
        return `Let's focus on one practical step at a time. What is the single most urgent task in front of you right now?`;
      }
      if (commStyle === 'motivational') {
        return `Exams test memory, not your worth or potential. Let's break this study session into a 25-minute sprint with a break right after.`;
      }
      return `Academic pressure can feel intense when deadlines cluster together. Take a slow breath. Would it help to break down what's immediately on your desk?`;
    }

    if (lower.includes('sleep') || lower.includes('tired') || lower.includes('exhausted') || lower.includes('insomnia')) {
      return `Rest is foundational, and it's hard when your mind won't quiet down. Would you like to try a gentle 2-minute breathing reset, or talk through what's keeping you awake?`;
    }

    if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('panic') || lower.includes('overwhelmed') || lower.includes('stress')) {
      if (commStyle === 'direct') {
        return `Let's pause. Name 3 things you can see around you right now. Grounding brings your focus back to what you can control.`;
      }
      return `It's completely okay that you're feeling this way right now. Let's ground ourselves: feel your feet resting on the floor and take one gentle breath with me.`;
    }

    if (lower.includes('lonely') || lower.includes('isolated') || lower.includes('friend') || lower.includes('nobody')) {
      return `Feeling disconnected is painful, especially in the middle of a busy semester. I'm here to listen without judgment. What's been on your mind today?`;
    }

    if (lower.includes('breathe') || lower.includes('reset') || lower.includes('calm')) {
      return `Let's take a moment together. Inhale gently for 4 counts... hold for 4... and release for 6. Notice how your shoulders drop.`;
    }

    if (commStyle === 'direct') {
      return `I hear you, ${name}. What is one small step that would make things 10% easier right now?`;
    }

    return `Thank you for sharing that with me, ${name}. You don't have to figure everything out all at once. I'm right here with you.`;
  }
}
