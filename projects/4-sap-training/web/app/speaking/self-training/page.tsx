import { getAllLessons } from "@/lib/content/lessons";
import { getJapaneseCoachData, getJapaneseCoachEntries } from "@/lib/japanese-coach";
import { JapaneseSelfTrainingClient } from "@/components/pages/JapaneseSelfTrainingClient";

export default async function JapaneseSelfTrainingPage() {
  const lessons = await getAllLessons();
  const coaches = getJapaneseCoachEntries();
  const coachData = getJapaneseCoachData();

  return (
    <JapaneseSelfTrainingClient
      lessons={lessons}
      coaches={coaches}
      grammarNotes={coachData.grammarNotes}
      routinePhrases={coachData.routinePhrases}
    />
  );
}
