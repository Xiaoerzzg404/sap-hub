"use client";

import { useState, type ReactNode } from "react";
import type { Lesson } from "@/types/lesson";
import { LessonStepper } from "./LessonStepper";

export function LessonStepShell({
  lesson,
  warmup,
  phrases,
  shadowing,
  micro,
  consultant
}: {
  lesson: Lesson;
  warmup: ReactNode;
  phrases: ReactNode;
  shadowing: ReactNode;
  micro: ReactNode;
  consultant: ReactNode;
}) {
  const [step, setStep] = useState(0);
  const slots = [warmup, phrases, shadowing, micro, consultant];

  return (
    <div className="space-y-6">
      <LessonStepper lessonId={lesson.id} onStepChange={setStep} />
      <div>{slots[step]}</div>
    </div>
  );
}
