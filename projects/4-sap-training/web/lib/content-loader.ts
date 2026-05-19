import lessons from "@/data/lessons.json";
import glossary from "@/data/glossary.json";
import phrases from "@/data/phrases.json";
import roleplays from "@/data/roleplays.json";
import assignments from "@/data/assignments.json";
import reviewTerms from "@/data/review-terms.json";
import tracks from "@/data/tracks.json";
import library from "@/data/library.json";
import type { Assignment } from "@/types/assignment";
import type { GlossaryTerm } from "@/types/glossary";
import type { LibraryItem } from "@/types/library";
import type { Lesson, ReviewItem, RolePlay } from "@/types/lesson";
import type { Phrase } from "@/types/phrase";
import type { Track, TrackId } from "@/types/track";

export const allLessons = lessons as Lesson[];
export const allGlossary = glossary as GlossaryTerm[];
export const allPhrases = phrases as Phrase[];
export const allRoleplays = roleplays as RolePlay[];
export const allAssignments = assignments as Assignment[];
export const allReviewTerms = reviewTerms as ReviewItem[];
export const allTracks = tracks as Track[];
export const allLibraryItems = library as LibraryItem[];

export function getLesson(lessonId: string) {
  return allLessons.find((lesson) => lesson.id === lessonId);
}

export function nextLesson(lessonId: string) {
  const index = allLessons.findIndex((lesson) => lesson.id === lessonId);
  return index >= 0 ? allLessons[index + 1] : undefined;
}

export function getTrack(id: TrackId): Track | undefined {
  return allTracks.find((t) => t.id === id);
}

export function getLessonsByTrack(trackId: TrackId) {
  return allLessons.filter((lesson) => lesson.trackId === trackId);
}
