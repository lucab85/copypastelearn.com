"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicQuestion } from "@/lib/assessment";
import { InlineMarkdown } from "@/components/course/simple-markdown";
import {
  submitAssessment,
  type SubmitAssessmentResult,
} from "@/server/actions/assessment";

interface Props {
  courseSlug: string;
  questions: PublicQuestion[];
}

export function AssessmentClient({ courseSlug, questions }: Props) {
  const [answers, setAnswers] = useState<(string | null)[]>(() =>
    questions.map(() => null)
  );
  const [outcome, setOutcome] = useState<SubmitAssessmentResult | null>(null);
  const [pending, startTransition] = useTransition();

  const answered = answers.filter(Boolean).length;
  const result = outcome?.result;

  function submit() {
    startTransition(async () => {
      setOutcome(await submitAssessment(courseSlug, answers));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function retry() {
    setAnswers(questions.map(() => null));
    setOutcome(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {result && (
        <div
          role="status"
          className={`mb-8 rounded-xl border p-6 ${
            result.passed
              ? "border-green-600/30 bg-green-600/5"
              : "border-amber-600/30 bg-amber-600/5"
          }`}
        >
          <p className="text-2xl font-bold">
            {result.score} / {result.total} ({result.percent}%)
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.passed
              ? "Passed. Read the explanations below, they are part of the course."
              : "Not passed yet. Read the explanations, watch the lessons again and retry."}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
            Try again
          </Button>
        </div>
      )}
      {outcome && !outcome.ok && (
        <p role="alert" className="mb-6 rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
          {outcome.error}
        </p>
      )}

      <ol className="space-y-8">
        {questions.map((q, i) => {
          const graded = result?.questions[i];
          const lesson = outcome?.relevantLessons?.[i];
          return (
            <li key={i} className="rounded-xl border p-5">
              <fieldset disabled={!!result || pending}>
                <legend className="mb-4 flex gap-3 font-medium">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                    {i + 1}
                  </span>
                  <span><InlineMarkdown text={q.prompt} /></span>
                </legend>
                <div className="space-y-2">
                  {q.options.map((o) => {
                    const chosen = answers[i] === o.key;
                    const isCorrect = graded?.correct === o.key;
                    const wrongPick = graded && chosen && !isCorrect;
                    return (
                      <label
                        key={o.key}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                          graded
                            ? isCorrect
                              ? "border-green-600/50 bg-green-600/5"
                              : wrongPick
                                ? "border-red-600/50 bg-red-600/5"
                                : "opacity-70"
                            : chosen
                              ? "border-primary bg-primary/5"
                              : "hover:bg-accent/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${i}`}
                          value={o.key}
                          checked={chosen}
                          onChange={() =>
                            setAnswers((a) => a.map((v, j) => (j === i ? o.key : v)))
                          }
                          className="mt-0.5"
                        />
                        <span className="flex-1">
                          <span className="font-medium">{o.key})</span>{" "}
                          <InlineMarkdown text={o.text} />
                          {graded && !isCorrect && graded.incorrect[o.key] && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              <InlineMarkdown text={graded.incorrect[o.key]} />
                            </span>
                          )}
                        </span>
                        {graded && isCorrect && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" aria-label="Correct answer" />
                        )}
                        {wrongPick && (
                          <XCircle className="h-4 w-4 shrink-0 text-red-600" aria-label="Your answer, incorrect" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              {graded && (
                <div className="mt-4 rounded-lg bg-muted/40 p-4 text-sm">
                  <p>
                    <span className="font-semibold">Explanation:</span>{" "}
                    <InlineMarkdown text={graded.explanation} />
                  </p>
                  {lesson && (
                    <p className="mt-2">
                      <span className="font-semibold">Watch again:</span>{" "}
                      <Link
                        href={`/courses/${courseSlug}/lessons/${lesson.slug}`}
                        className="text-primary hover:underline"
                      >
                        {lesson.title}
                      </Link>
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!result && (
        <div className="mt-8 flex items-center gap-4">
          <Button onClick={submit} disabled={pending || answered < questions.length}>
            {pending ? "Checking..." : "Submit answers"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {answered} of {questions.length} answered
          </span>
        </div>
      )}
    </div>
  );
}
