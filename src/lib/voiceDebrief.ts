// Voice Debrief Engine: Web Speech API & Natural Language Habit Extractor

export interface VoiceParseResult {
  matchedAnswers: Record<string, any>;
  transcript: string;
  matchedCount: number;
}

export function parseVoiceTranscript(
  transcript: string,
  questions: Array<{ id: string; prompt: string; type: string; habit_type?: string }>
): VoiceParseResult {
  const matchedAnswers: Record<string, any> = {};
  const lower = transcript.toLowerCase();
  let matchedCount = 0;

  questions.forEach((q) => {
    const promptLower = q.prompt.toLowerCase();
    const promptWords = promptLower.split(/\s+/).filter((w) => w.length > 3);

    // Check if the transcript mentions this habit's key vocabulary
    const isMentioned = promptWords.some((word) => lower.includes(word));

    if (q.type === 'boolean') {
      const isBadHabit = q.habit_type === 'bad';
      if (isMentioned) {
        // Look for negative markers near mention
        const resistedTerms = ['avoided', 'did not', "didn't", 'resisted', 'no ', 'stopped', 'skipped'];
        const completedTerms = ['did', 'done', 'yes', 'completed', 'drank', 'ran', 'exercised', 'read'];

        const hasResisted = resistedTerms.some((t) => lower.includes(`${t} ${promptWords[0]}`) || lower.includes(t));
        
        if (isBadHabit) {
          // Bad habit avoided is successful false
          matchedAnswers[q.id] = hasResisted ? false : false;
        } else {
          matchedAnswers[q.id] = true;
        }
        matchedCount++;
      }
    } else if (q.type === 'number') {
      // Look for numbers near keywords like sleep, pages, glasses
      if (promptLower.includes('sleep') && lower.includes('sleep')) {
        const sleepMatch = lower.match(/(\d+(\.\d+)?)\s*(hours|hrs)/) || lower.match(/slept\s*(\d+(\.\d+)?)/);
        if (sleepMatch) {
          matchedAnswers[q.id] = parseFloat(sleepMatch[1]);
          matchedCount++;
        }
      } else if (promptLower.includes('water') && lower.includes('water')) {
        const waterMatch = lower.match(/(\d+)\s*(glasses|cups|liters)/) || lower.match(/drank\s*(\d+)/);
        if (waterMatch) {
          matchedAnswers[q.id] = parseInt(waterMatch[1], 10);
          matchedCount++;
        }
      }
    } else if (q.type === 'scale_1_to_5') {
      if (promptLower.includes('mood') || promptLower.includes('energy')) {
        const scaleMatch = lower.match(/(mood|energy|rated|score|was)\s*(a|is|was)?\s*([1-5])/);
        if (scaleMatch) {
          matchedAnswers[q.id] = parseInt(scaleMatch[3], 10);
          matchedCount++;
        } else if (lower.includes('great') || lower.includes('amazing')) {
          matchedAnswers[q.id] = 5;
          matchedCount++;
        } else if (lower.includes('good')) {
          matchedAnswers[q.id] = 4;
          matchedCount++;
        } else if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('bad')) {
          matchedAnswers[q.id] = 2;
          matchedCount++;
        }
      }
    } else if (q.type === 'text') {
      // Open reflection gets populated with the debrief transcript
      matchedAnswers[q.id] = transcript.trim();
      matchedCount++;
    }
  });

  return {
    matchedAnswers,
    transcript,
    matchedCount,
  };
}
