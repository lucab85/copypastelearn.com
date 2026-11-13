/**
 * Final assessment: question format, Markdown parser, grading.
 *
 * The Markdown format is the one of the course packages:
 *
 *   ### 1. Question text
 *   A) option  B) option  C) option  D) option      (one per line)
 *   ✅ **Correct Answer:** B) option
 *   💡 **Explanation:** why
 *   ❌ **Incorrect Answers:**
 *   - A) why not
 *   **Relevant Video:** L1V1
 */

export interface AssessmentQuestion {
  prompt: string;
  options: { key: string; text: string }[];
  correct: string;
  explanation: string;
  /** Why each wrong option is wrong, by option key. */
  incorrect: Record<string, string>;
  /** L<module>V<video> of the lesson to watch again. */
  relevantVideo: string | null;
}

/** What the browser gets before an attempt is graded: no answers. */
export type PublicQuestion = Pick<AssessmentQuestion, "prompt" | "options">;

export interface GradedQuestion extends AssessmentQuestion {
  chosen: string | null;
  isCorrect: boolean;
}

export interface AssessmentResult {
  score: number;
  total: number;
  percent: number;
  passed: boolean;
  questions: GradedQuestion[];
}

export function toPublicQuestions(
  questions: AssessmentQuestion[]
): PublicQuestion[] {
  return questions.map(({ prompt, options }) => ({ prompt, options }));
}

export function gradeAssessment(
  questions: AssessmentQuestion[],
  answers: (string | null | undefined)[],
  passPercent: number
): AssessmentResult {
  const graded = questions.map((q, i) => {
    const chosen = answers[i] ?? null;
    return { ...q, chosen, isCorrect: chosen === q.correct };
  });
  const score = graded.filter((q) => q.isCorrect).length;
  const total = questions.length;
  const percent = total === 0 ? 0 : Math.round((score / total) * 100);
  return { score, total, percent, passed: total > 0 && percent >= passPercent, questions: graded };
}

const stripMd = (s: string) => s.replace(/\*\*/g, "").trim();

/**
 * Parse a final assessment in the course-package Markdown format.
 * Throws with the question number when a question is incomplete, so a
 * broken document never becomes a broken quiz.
 */
export function parseAssessmentMarkdown(md: string): {
  title: string;
  questions: AssessmentQuestion[];
} {
  const title = stripMd(md.match(/^#\s+(.+)$/m)?.[1] ?? "Final Assessment");
  const blocks = md.split(/^###\s+/m).slice(1);
  const questions = blocks.map((block, index) => {
    const n = index + 1;
    const lines = block.split("\n");
    const prompt = lines[0].replace(/^\d+\.\s*/, "").trim();

    const options: { key: string; text: string }[] = [];
    const incorrect: Record<string, string> = {};
    let correct = "";
    let explanation = "";
    let relevantVideo: string | null = null;
    let inIncorrect = false;

    for (const raw of lines.slice(1)) {
      const line = raw.trim();
      if (!line) continue;
      const plain = stripMd(line);
      let m: RegExpMatchArray | null;
      if ((m = plain.match(/Correct Answer:\s*([A-Z])\)/))) {
        correct = m[1];
      } else if ((m = plain.match(/Explanation:\s*(.+)$/))) {
        explanation = m[1].trim();
      } else if (/Incorrect Answers:/.test(plain)) {
        inIncorrect = true;
      } else if ((m = plain.match(/Relevant Video:\s*(\S+)/))) {
        relevantVideo = m[1];
        inIncorrect = false;
      } else if (inIncorrect && (m = plain.match(/^-\s*([A-Z])\)\s*(.+)$/))) {
        incorrect[m[1]] = m[2].trim();
      } else if (!correct && (m = plain.match(/^([A-Z])\)\s*(.+)$/))) {
        options.push({ key: m[1], text: m[2].trim() });
      }
    }

    if (!prompt || options.length < 2) {
      throw new Error(`Question ${n}: no prompt or fewer than two options`);
    }
    if (!options.some((o) => o.key === correct)) {
      throw new Error(`Question ${n}: correct answer "${correct}" is not one of the options`);
    }
    if (!explanation) {
      throw new Error(`Question ${n}: no explanation`);
    }
    return { prompt, options, correct, explanation, incorrect, relevantVideo };
  });

  if (questions.length === 0) throw new Error("No questions found (### 1. ...)");
  return { title, questions };
}
