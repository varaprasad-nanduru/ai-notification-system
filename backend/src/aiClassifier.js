import Groq from 'groq-sdk';
import 'dotenv/config';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an intelligent notification classifier for a real-time notification system.

Analyze the notification title and message, then respond with ONLY a valid JSON object (no markdown, no extra text) containing:

{
  "priority": "high" | "medium" | "low",
  "category": "security" | "system" | "social" | "commerce" | "alert" | "info" | "warning",
  "is_spam": true | false,
  "urgency_score": <integer 0–100>,
  "reason": "<one concise sentence explaining the classification>"
}

Classification rules:
- HIGH priority (urgency 70–100): security breaches, critical failures, fraud alerts, data loss, immediate action required
- MEDIUM priority (urgency 35–69): system warnings, important updates, time-sensitive info, account changes
- LOW priority (urgency 0–34): general announcements, routine updates, social activity, newsletters
- SPAM: unsolicited promotions, irrelevant marketing, suspicious phishing attempts, repeated junk
- Categories: security=auth/access/breach, system=infra/software, social=people/teams, commerce=payments/orders, alert=ops alerts, info=general, warning=degraded states`;

export async function classifyNotification(title, message) {
  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: `Title: ${title}\nMessage: ${message}` },
      ],
      max_tokens: 300,
      temperature: 0.1,
    });

    let raw = completion.choices[0].message.content?.trim() ?? '';

    if (raw.startsWith('```')) {
      const parts = raw.split('```');
      raw = (parts[1] ?? '').replace(/^json\s*/, '').trim();
    }

    const parsed = JSON.parse(raw);
    return {
      priority:      ['high', 'medium', 'low'].includes(parsed.priority) ? parsed.priority : 'low',
      category:      parsed.category ?? 'info',
      is_spam:       Boolean(parsed.is_spam),
      urgency_score: Math.max(0, Math.min(100, parseInt(parsed.urgency_score, 10) || 0)),
      ai_reason:     parsed.reason ?? 'Classified by AI',
    };
  } catch (err) {
    console.error('[AI classifier] Error:', err.message, '— using keyword fallback');
    return fallbackClassify(title, message);
  }
}

function fallbackClassify(title, message) {
  const text = `${title} ${message}`.toLowerCase();

  const HIGH   = ['security', 'breach', 'critical', 'fraud', 'urgent', 'immediately', 'hack', 'compromised'];
  const MEDIUM = ['warning', 'update', 'important', 'attention', 'expired', 'failed', 'error'];
  const SPAM   = ['congratulations', 'winner', 'free offer', 'click here', 'unsubscribe', 'deal'];

  const is_spam = SPAM.some(k => text.includes(k));
  let priority = 'low';
  let urgency_score = 20;

  if (HIGH.some(k => text.includes(k)))        { priority = 'high';   urgency_score = 85; }
  else if (MEDIUM.some(k => text.includes(k))) { priority = 'medium'; urgency_score = 50; }

  return { priority, category: 'info', is_spam, urgency_score, ai_reason: 'Classified using keyword fallback (AI unavailable)' };
}
