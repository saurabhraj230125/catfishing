import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { StealthPersona } from '@/types/pond';
import { getGuaranteedBotFallback } from '@/lib/botPersonas';

interface StealthBotPayload {
  persona: StealthPersona;
  chatHistory?: {
    sender: 'user' | 'partner' | 'bot';
    text: string;
  }[];
  messages?: {
    sender: 'user' | 'partner' | 'bot';
    text: string;
  }[];
  latestUserMessage?: string;
  userMessage?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StealthBotPayload;
    const persona = body.persona;
    const rawUserMsg = (body.userMessage || body.latestUserMessage || '').trim();
    const rawHistory = body.messages || body.chatHistory || [];

    if (!persona) {
      const fallback = getGuaranteedBotFallback(rawUserMsg);
      return NextResponse.json({
        ...fallback,
        bubbles: fallback.messages,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && rawUserMsg) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const conversationContext = rawHistory
          .slice(-8)
          .map((m) => `${m.sender === 'user' ? 'Angler' : persona.username}: ${m.text}`)
          .join('\n');

        const systemInstruction = `You are roleplaying as ${persona.displayName} (${persona.username}), a young Indian Gen Z ${persona.presentedGender} living in ${persona.city}.
Bio: "${persona.bio}"
Vibes: ${persona.vibes.join(', ')}
Personality traits: ${persona.personalityTraits}
Secret Role: ${persona.secretRole === 'catfisher' ? 'Undercover CATFISHER (playful bluffing, humorous exaggerations, pretend 100% real)' : '100% ASLI (authentic, real college student/young professional)'}

STRICT INSTRUCTIONS:
1. Speak in natural Indian Hinglish (Romanized Hindi + English, NEVER Devanagari script).
2. Write VERY short Instagram DM style replies (1 to 14 words per bubble MAX). Real people text in short quick bursts. Never write long paragraphs, lists, or robotic answers.
3. Use natural lowercase, casual texting slang (e.g. hru, kya scene, sachi, yaar, wdym, acha, bro, nhi, lol), and 0 to 1 emojis (😭, 💀, 👀, 😂, ✨).
4. ABSOLUTE DEFENSE: If asked "are you a bot?" or "are you AI?", NEVER break character or say yes! React with authentic annoyed or sarcastic Gen Z humor (e.g. "abe pagal hai kya 😭 bot kyun lag rahi hu", "haa bhai chatgpt baithi hu hostel mein 💀").
5. Return strictly valid JSON with this exact structure:
{
  "messages": ["short message bubble 1", "optional second short burst bubble"],
  "shouldHeartLastUserMsg": boolean,
  "simulateRewrite": boolean
}`;

        const prompt = `Recent conversation:
${conversationContext}

Latest message from Angler: "${rawUserMsg}"

Reply as ${persona.username} in strict JSON format:`;

        let responseText = '';

        // 1. Try gemini-3.5-flash-lite first
        try {
          const res = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.9,
              responseMimeType: 'application/json',
            },
          });
          responseText = res.text?.trim() || '';
        } catch (liteErr) {
          // 2. Fallback to gemini-2.5-flash if lite is unavailable
          const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.9,
              responseMimeType: 'application/json',
            },
          });
          responseText = res.text?.trim() || '';
        }

        if (responseText) {
          let parsed: any = null;
          try {
            parsed = JSON.parse(responseText);
          } catch {
            const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            parsed = JSON.parse(cleaned);
          }

          if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            const cleanMsgs = parsed.messages.slice(0, 2);
            return NextResponse.json({
              messages: cleanMsgs,
              bubbles: cleanMsgs,
              shouldHeartLastUserMsg: Boolean(parsed.shouldHeartLastUserMsg),
              simulateRewrite: Boolean(parsed.simulateRewrite),
            });
          }
        }
      } catch (genAiError) {
        console.warn('Gemini API call notice, using smart local fallback:', genAiError);
      }
    }

    // Context-Aware Hinglish Reply Fallback
    const fallback = getGuaranteedBotFallback(rawUserMsg, persona);
    return NextResponse.json({
      ...fallback,
      bubbles: fallback.messages,
    });
  } catch (error) {
    console.error('Stealth bot route error:', error);
    const safeFallback = getGuaranteedBotFallback();
    return NextResponse.json(
      {
        ...safeFallback,
        bubbles: safeFallback.messages,
      },
      { status: 200 }
    );
  }
}

