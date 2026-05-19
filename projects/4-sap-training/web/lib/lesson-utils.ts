import type { Lesson } from "@/types/lesson";

export function lessonNumberLabel(lesson: Pick<Lesson, "order">) {
  return `第 ${String(lesson.order).padStart(2, "0")} 课`;
}

export function estimatedLessonMinutes(lesson: Lesson) {
  return 15 + lesson.shadowingItems.length * 2 + lesson.microTrainings.length * 4 + lesson.consultantOutputs.length * 6;
}

export function oralTaskCount(lesson: Lesson) {
  return (
    lesson.shadowingItems.length +
    lesson.substitutionDrills.length +
    lesson.microTrainings.length +
    lesson.consultantOutputs.length +
    lesson.rolePlays.length
  );
}
