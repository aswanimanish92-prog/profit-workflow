"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { useMockData } from "@/context/MockDataContext";
import { BottomSheet } from "@/components/shell/BottomSheet";
import { cn } from "@/lib/utils";
import type { FeedbackQuestion } from "@/types/mockData";

/** On Overview, after the Profit flow is submitted (once per session): the questions in src/data/feedback.json one at a time, then a thank-you. */
export function FeedbackSheet() {
  const { data, feedbackOpen, submitFeedback, closeFeedback } = useMockData();
  const questions = data.feedback;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const q = questions[step];
  const last = step === questions.length - 1;
  const picked = q ? answers[q.id] : undefined;

  const next = () => {
    if (!last) return setStep(step + 1);
    submitFeedback(answers);
    setDone(true);
  };

  // Dismissing midway still keeps the answers already given.
  const close = () => {
    if (!done && Object.keys(answers).length) submitFeedback(answers);
    closeFeedback();
  };

  return (
    <BottomSheet open={feedbackOpen} onClose={close} label="Feedback">
      {done || !q ? (
        <div className="flex flex-col items-center py-4 text-center">
          <CircleCheck className="size-10 text-[#15803D]" />
          <h2 className="mt-3 text-xl font-bold">Thank you!</h2>
          <p className="mt-1 text-sm text-[#5B6170]">Your answers help us make this better.</p>
          <button onClick={closeFeedback} className="mt-5 h-12 w-full rounded-full bg-[#1D4FD7] text-[15px] font-bold text-white">
            Done
          </button>
        </div>
      ) : (
        <>
          {questions.length > 1 && (
            <p className="text-[13px] font-semibold text-[#5B6170]">
              Question {step + 1} of {questions.length}
            </p>
          )}
          <h2 className="mt-1 text-xl font-bold">{q.question}</h2>
          <Scale q={q} value={picked} onPick={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
          <button
            disabled={picked === undefined}
            onClick={next}
            className="mt-5 h-12 w-full rounded-full bg-[#1D4FD7] text-[15px] font-bold text-white disabled:opacity-40"
          >
            {last ? "Submit" : "Next"}
          </button>
          <button onClick={close} className="mt-2 h-10 w-full text-sm font-semibold text-[#5B6170]">
            Not now
          </button>
        </>
      )}
    </BottomSheet>
  );
}

function Scale({ q, value, onPick }: { q: FeedbackQuestion; value?: number; onPick: (v: number) => void }) {
  const chip = (selected: boolean) =>
    cn("rounded-full text-sm font-semibold", selected ? "bg-[#1D4FD7] text-white" : "bg-[#ECECE8] text-[#16181D]");

  if (q.scale.kind === "labels") {
    return (
      <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label={q.question}>
        {q.scale.options.map((label, i) => (
          <button key={label} role="radio" aria-checked={value === i + 1} onClick={() => onPick(i + 1)} className={cn("h-11", chip(value === i + 1))}>
            {label}
          </button>
        ))}
      </div>
    );
  }

  const { min, max, low, high } = q.scale;
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className="mt-4">
      <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={q.question}>
        {values.map((v) => (
          <button key={v} role="radio" aria-checked={value === v} onClick={() => onPick(v)} className={cn("h-11", chip(value === v))}>
            {v}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-[#5B6170]">
        <span>
          {min} = {low}
        </span>
        <span>
          {max} = {high}
        </span>
      </div>
    </div>
  );
}
