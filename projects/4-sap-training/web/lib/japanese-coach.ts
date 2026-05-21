import coachEntries from "@/data/japanese-coach.json";
import type { JapaneseCoachData, JapaneseCoachEntry } from "@/types/japanese-coach";

const rawCoachData = coachEntries as unknown;
const coachData = Array.isArray(rawCoachData)
  ? ({
      updatedBy: "unknown",
      updatedAt: "",
      teachingPrinciples: [],
      forbiddenHabits: [],
      classFlow: [],
      feedbackRubric: [],
      grammarNotes: [],
      routinePhrases: [],
      lessonEntries: rawCoachData as JapaneseCoachEntry[],
    } satisfies JapaneseCoachData)
  : (rawCoachData as JapaneseCoachData);
const entries = coachData.lessonEntries;
const byLessonId = new Map(entries.map((entry) => [entry.lessonId, entry]));

export function getJapaneseCoachData() {
  return coachData;
}

export function getJapaneseCoachEntries() {
  return entries;
}

export function getJapaneseCoachByLessonId(lessonId: string) {
  return byLessonId.get(lessonId);
}
