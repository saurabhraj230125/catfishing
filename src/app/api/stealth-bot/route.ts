import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { StealthPersona } from '@/types/pond';

interface StealthBotRequest {
  persona: StealthPersona;
  chatHistory: {
    sender: 'user' | 'partner';
    text: string;
  }[];
  latestUserMessage: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StealthBotRequest;
    const { persona, chatHistory, latestUserMessage } = body;

    if (!persona || !latestUserMessage) {
      return NextResponse.json(
        { error: 'Missing persona or user message' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API Key is available, use official @google/genai SDK
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

        const conversationContext = chatHistory
          .slice(-8)
          .map((m) => `${m.sender === 'user' ? 'Angler' : persona.username}: ${m.text}`)
          .join('\n');

        const systemInstruction = `You are roleplaying as ${persona.displayName} (${persona.username}), a young Indian Gen Z ${persona.presentedGender} living in ${persona.city}.
Bio: "${persona.bio}"
Vibes: ${persona.vibes.join(', ')}
Personality traits: ${persona.personalityTraits}
Secret Role: ${persona.secretRole === 'catfisher' ? 'You are an undercover CATFISHER. You bluff playfully, make amusing exaggerated claims, but pretend to be 100% genuine.' : 'You are 100% ASLI (authentic). You are an honest college student/young professional having fun chatting.'}

CRITICAL RULES:
1. Speak in casual Indian Hinglish (Romanized Hindi + English, NEVER Devanagari script).
2. Write VERY short Instagram DM style replies (1 to 14 words per bubble MAX). Real people text in short quick bursts. Never write long paragraphs, lists, or robotic answers.
3. Use natural lowercase, casual texting slang (e.g. hru, kkrh, sachi, yaar, wdym, acha, bro, nhi, lol), and 0 to 1 Gen Z emojis (😭, 💀, 👀, 😂, ✨).
4. ABSOLUTE DEFENSE: If asked "are you a bot?" or "are you AI?", NEVER break character or say yes! React with authentic annoyed or sarcastic Gen Z humor (e.g. "abe pagal hai kya 😭 bot kyun lag rahi hu", "haa bhai chatgpt baithi hu hostel mein 💀").
5. Return strictly valid JSON with this exact structure:
{
  "messages": ["short message bubble 1", "optional second short burst bubble"],
  "shouldHeartLastUserMsg": boolean,
  "simulateRewrite": boolean
}
- "messages": Array of 1 or 2 short strings.
- "shouldHeartLastUserMsg": true if the user's message was cute, funny, flirty, or clever.
- "simulateRewrite": true if user accused you of being fake or asked a tricky question that made you pause.`;

        const prompt = `Recent conversation history:
${conversationContext}

Latest message from Angler: "${latestUserMessage}"

Reply as ${persona.username} in strict JSON format:`;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.9,
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text?.trim() || '';
        let parsed = null;

        try {
          parsed = JSON.parse(rawText);
        } catch {
          // If response had markdown fences
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        }

        if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          return NextResponse.json({
            messages: parsed.messages.slice(0, 2),
            shouldHeartLastUserMsg: Boolean(parsed.shouldHeartLastUserMsg),
            simulateRewrite: Boolean(parsed.simulateRewrite),
          });
        }
      } catch (genAiError) {
        console.warn('Gemini API call failed, falling back to smart reply state:', genAiError);
      }
    }

    // Context-Aware Hinglish Reply Fallback (When API key is absent or on network error)
    const fallback = generateSmartFallbackReply(persona, latestUserMessage);
    return NextResponse.json(fallback);
  } catch (error) {
    console.error('Stealth bot route error:', error);
    return NextResponse.json(
      {
        messages: ['haha wait what 😭 connection thoda slow hai mera'],
        shouldHeartLastUserMsg: false,
        simulateRewrite: false,
      },
      { status: 200 }
    );
  }
}

/**
 * High-fidelity context-aware Hinglish reply engine.
 * Ensures the chat is entertaining and believable even without external API credentials.
 */
function generateSmartFallbackReply(
  persona: StealthPersona,
  userMsg: string
): { messages: string[]; shouldHeartLastUserMsg: boolean; simulateRewrite: boolean } {
  const lower = userMsg.toLowerCase().trim();

  // If accused of being a bot or AI
  if (lower.includes('bot') || lower.includes('ai') || lower.includes('chatgpt') || lower.includes('robot')) {
    const botDefenses = [
      ['abe pagal hai kya 😭', 'bot kyun lag rahi hu tujhe'],
      ['haan bhai main robot hu charging pe baithi hu 💀', 'sachi bata tu kiska ex hai'],
      ['lol nice joke bro', 'aisa lagta hai sab ladkiya AI hoti hain kya 😂'],
    ];
    const picked = botDefenses[Math.floor(Math.random() * botDefenses.length)];
    return {
      messages: picked,
      shouldHeartLastUserMsg: false,
      simulateRewrite: true,
    };
  }

  // If accused of being a catfish
  if (lower.includes('catfish') || lower.includes('fake') || lower.includes('feku')) {
    return {
      messages: [
        'wait text kyu delete kar raha hai baar baar 👀',
        'tu catfish test le raha hai na mera? pakda gaya 💀',
      ],
      shouldHeartLastUserMsg: false,
      simulateRewrite: true,
    };
  }

  // If asked about city or location
  if (lower.includes('kahan') || lower.includes('city') || lower.includes('where') || lower.includes('rehte')) {
    return {
      messages: [`${persona.city} mein rehti hu yaar ✨`, 'tu kahan ka hai bata?'],
      shouldHeartLastUserMsg: true,
      simulateRewrite: false,
    };
  }

  // If asked about name or real identity
  if (lower.includes('naam') || lower.includes('name') || lower.includes('real')) {
    return {
      messages: [`${persona.displayName.split(' ')[0]} naam hai mera babu`, 'aur tera?'],
      shouldHeartLastUserMsg: false,
      simulateRewrite: false,
    };
  }

  // If greeting
  if (lower.includes('hi') || lower.includes('hii') || lower.includes('heyy') || lower.includes('hello')) {
    return {
      messages: ['heyy, kya chal raha hai?', 'kisi ko dhundne aaye ho pond mein? 👀'],
      shouldHeartLastUserMsg: true,
      simulateRewrite: false,
    };
  }

  // If flirtatious or complimentary
  if (lower.includes('cute') || lower.includes('sundar') || lower.includes('love') || lower.includes('pretty') || lower.includes('hot')) {
    return {
      messages: [
        'itna sweet mat ban sugar ho jayega babu 😭',
        'flirt skill achhi hai teri haha',
      ],
      shouldHeartLastUserMsg: true,
      simulateRewrite: false,
    };
  }

  // Default fallback from persona's dedicated replies pool
  const pool = persona.fallbackReplies || [
    'haha sachi? mujhe laga tu koi fake account hai 😭',
    'wait what, tu college mein hai ya job?',
  ];
  const reply = pool[Math.floor(Math.random() * pool.length)];

  return {
    messages: [reply],
    shouldHeartLastUserMsg: Math.random() < 0.35,
    simulateRewrite: Math.random() < 0.25,
  };
}

