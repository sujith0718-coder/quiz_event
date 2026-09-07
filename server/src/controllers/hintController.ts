import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Question } from '../models/Question.js';
import { Submission } from '../models/Submission.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';

// ─── Config (overrideable via env) ───────────────────────────────────────────
const HINT_POINT_COST = parseInt(process.env.HINT_POINT_COST || '5');
const HINT_MAX_PER_QUESTION = parseInt(process.env.HINT_MAX_PER_QUESTION || '3');
const MIN_WRONG_ATTEMPTS = parseInt(process.env.HINT_MIN_ATTEMPTS || '2');

// ─── In-memory hint cache: questionId → hint text ────────────────────────────
// One LLM call per question, shared across all teams
const hintCache = new Map<string, string>();

// ─── Per-team hint usage tracker: `${teamId}:${questionId}` → count ──────────
const hintUsage = new Map<string, number>();

const usageKey = (teamId: string, questionId: string) => `${teamId}:${questionId}`;

// ─── LLM call via Gemini ──────────────────────────────────────────────────────
const generateHintFromLLM = async (
  title: string,
  description: string,
  type: string
): Promise<string | null> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an AI assistant for a competitive programming & riddle quiz platform.
A team is stuck on the following ${type === 'RIDDLE' ? 'riddle' : 'multiple-choice question'}.

Title: ${title}
Question: ${description}

Write a 1–2 sentence hint that nudges the team toward the correct answer WITHOUT revealing it.
- Do NOT state the answer or any synonym of the answer.
- Focus on the underlying concept, metaphor, or logical reasoning path.
- Be encouraging and concise.

Hint:`,
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 120, temperature: 0.4 },
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
  } catch {
    return null;
  }
};

// ─── Smart local fallback hints by question type ──────────────────────────────
const buildFallbackHint = (title: string, description: string, type: string): string => {
  const lower = `${title} ${description}`.toLowerCase();

  if (type === 'RIDDLE') {
    if (lower.includes('key') || lower.includes('lock'))
      return "💡 Think about something you use every day at your workstation to type characters.";
    if (lower.includes('background') || lower.includes('silent') || lower.includes('ui'))
      return "💡 Consider Unix processes that run without a visible interface — they listen and serve quietly.";
    if (lower.includes('memory') || lower.includes('store'))
      return "💡 Think about how data is stacked or queued — one of them follows LIFO, the other FIFO.";
    return "💡 Break down the metaphors. Compare what the subject has vs. what it lacks.";
  }

  // MCQ fallbacks by topic
  if (lower.includes('fifo') || lower.includes('lifo') || lower.includes('queue') || lower.includes('stack'))
    return "💡 Remember: a Queue is like a checkout line — first in, first out. A Stack is like a pile of plates.";
  if (lower.includes('deadlock'))
    return "💡 Picture two processes each waiting for a resource the other holds — neither can proceed.";
  if (lower.includes('hash') || lower.includes('lookup'))
    return "💡 A well-designed hash table computes the index directly — no searching required.";
  if (lower.includes('complexity') || lower.includes('big o'))
    return "💡 Think about which operation does NOT depend on the size of the input.";

  return `💡 Re-read the question carefully and think about the core concept in "${title}".`;
};

// ─── Main Handler: POST /api/questions/:id/hint ───────────────────────────────
export const requestHint = async (req: AuthRequest, res: Response) => {
  try {
    const { id: questionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // 1. Resolve the user's team
    const user = await User.findById(userId);
    if (!user?.teamId) {
      return res.status(400).json({ error: 'You must be in a team to request hints.' });
    }
    const teamId = user.teamId.toString();

    // 2. Find question
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found.' });

    // 3. Verify team has attempted this question at least MIN_WRONG_ATTEMPTS times
    const wrongAttempts = await Submission.countDocuments({
      teamId: user.teamId,
      questionId: question._id,
      isCorrect: false,
    });

    if (wrongAttempts < MIN_WRONG_ATTEMPTS) {
      return res.status(403).json({
        error: `Hints unlock after ${MIN_WRONG_ATTEMPTS} incorrect attempts. You have ${wrongAttempts} so far.`,
        wrongAttempts,
        requiredAttempts: MIN_WRONG_ATTEMPTS,
      });
    }

    // 4. Check per-team hint limit for this question
    const key = usageKey(teamId, questionId);
    const used = hintUsage.get(key) ?? 0;

    if (used >= HINT_MAX_PER_QUESTION) {
      return res.status(429).json({
        error: `Hint limit reached (${HINT_MAX_PER_QUESTION} per question). No more hints available.`,
        hintsUsed: used,
        hintsRemaining: 0,
      });
    }

    // 5. Check team has enough points to afford the hint
    const team = await Team.findById(user.teamId);
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    if (team.score < HINT_POINT_COST) {
      return res.status(402).json({
        error: `Not enough points. A hint costs ${HINT_POINT_COST} pts but your team only has ${team.score} pts.`,
        pointsRequired: HINT_POINT_COST,
        teamScore: team.score,
      });
    }

    // 6. Get or generate the hint (cached per question)
    let hint = hintCache.get(questionId);
    let source = 'cache';

    if (!hint) {
      // Try LLM first
      const llmHint = await generateHintFromLLM(
        question.title,
        question.description,
        question.type
      );

      if (llmHint) {
        hint = llmHint;
        source = 'gemini';
      } else {
        hint = buildFallbackHint(question.title, question.description, question.type);
        source = 'fallback';
      }

      hintCache.set(questionId, hint);
    }

    // 7. Deduct points and record hint usage
    await Team.findByIdAndUpdate(team._id, { $inc: { score: -HINT_POINT_COST } });
    hintUsage.set(key, used + 1);

    const hintsUsed = used + 1;
    const hintsRemaining = HINT_MAX_PER_QUESTION - hintsUsed;

    console.log(
      `[Hint] Team ${team.name} used hint for Q${question.order} (${source}). ` +
        `Used ${hintsUsed}/${HINT_MAX_PER_QUESTION}. Deducted ${HINT_POINT_COST} pts.`
    );

    return res.json({
      hint,
      source,
      pointsDeducted: HINT_POINT_COST,
      hintsUsed,
      hintsRemaining,
      teamScoreAfter: team.score - HINT_POINT_COST,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to generate hint.' });
  }
};
