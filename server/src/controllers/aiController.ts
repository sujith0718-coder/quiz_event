import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Question } from '../models/Question.js';

export const getAIHint = async (req: AuthRequest, res: Response) => {
  try {
    const { questionId } = req.body;
    if (!questionId) {
      return res.status(400).json({ error: 'Question ID is required' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an AI assistant for a competitive programming & riddle quiz platform. 
Provide a subtle, encouraging, 1-sentence hint for the following riddle/question without giving away the exact correct answer.

Title: ${question.title}
Description: ${question.description}
Question Type: ${question.type}

Hint:`,
                  },
                ],
              },
            ],
          }),
        });

        const data = await response.json();
        const hintText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (hintText) {
          return res.json({
            hint: hintText.trim(),
            source: 'Gemini AI',
          });
        }
      } catch (geminiErr) {
        console.warn('[AI Controller] Gemini API call failed, using fallback hint engine:', geminiErr);
      }
    }

    // Smart Local Fallback Hint Generator
    let fallbackHint = `Think about the core concept in "${question.title}". Focus on the physical or logical properties mentioned in the prompt!`;

    if (question.type === 'RIDDLE') {
      if (question.title.toLowerCase().includes('design') || question.description.toLowerCase().includes('keys')) {
        fallbackHint = '💡 Hint: It is an everyday hardware component connected to your workstation!';
      } else if (question.description.toLowerCase().includes('background')) {
        fallbackHint = '💡 Hint: Think of Unix system services that run silently without a user interface.';
      } else {
        fallbackHint = `💡 Hint: Break down the metaphors in the riddle. Compare what it has versus what it lacks.`;
      }
    } else {
      fallbackHint = `💡 Hint: Recall the basic data structures and their operating order (LIFO vs FIFO vs Direct Access).`;
    }

    return res.json({
      hint: fallbackHint,
      source: 'AI Assistant',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to generate AI hint' });
  }
};
