import Link from "next/link";
import { notFound } from "next/navigation";
import { allLessons, getLesson, nextLesson } from "@/lib/content-loader";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonObjective } from "@/components/lesson/LessonObjective";
import { ScenarioMap } from "@/components/lesson/ScenarioMap";
import { TermCard } from "@/components/lesson/TermCard";
import { PhraseCard } from "@/components/lesson/PhraseCard";
import { ClassroomScriptViewer } from "@/components/lesson/ClassroomScriptViewer";
import { LessonAssignment } from "@/components/lesson/LessonAssignment";
import { SelfAssessmentRubric } from "@/components/lesson/SelfAssessmentRubric";
import { ShadowingCard } from "@/components/speaking/ShadowingCard";
import { MicroTrainingTimer } from "@/components/speaking/MicroTrainingTimer";
import { ConsultantOutputRecorder } from "@/components/speaking/ConsultantOutputRecorder";
import { RolePlayRecorder } from "@/components/speaking/RolePlayRecorder";
import { SubstitutionDrillCard } from "@/components/speaking/SubstitutionDrillCard";

export function generateStaticParams() {
  return allLessons.map((lesson) => ({ lessonId: lesson.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();
  const next = nextLesson(lesson.id);

  return (
    <div className="page-shell space-y-6">
      <LessonHeader lesson={lesson} />
      <LessonObjective lesson={lesson} />
      <ScenarioMap items={lesson.scenarioMap} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">术语卡</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {lesson.terms.slice(0, 6).map((term) => (
            <TermCard key={term.id} term={term} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">句型卡</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {lesson.phrases.slice(0, 6).map((phrase) => (
            <PhraseCard key={phrase.id} phrase={phrase} />
          ))}
        </div>
      </section>

      <ClassroomScriptViewer markdown={lesson.transcriptMarkdown} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Shadowing</h2>
        <div className="grid gap-4">
          {lesson.shadowingItems.slice(0, 3).map((item) => (
            <ShadowingCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Substitution Drill</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {lesson.substitutionDrills.slice(0, 4).map((drill) => (
            <SubstitutionDrillCard key={drill.id} drill={drill} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">30 秒 Micro Training</h2>
        {lesson.microTrainings.map((task) => (
          <MicroTrainingTimer key={task.id} task={task} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">60 秒 Consultant Output</h2>
        {lesson.consultantOutputs.map((task) => (
          <ConsultantOutputRecorder key={task.id} task={task} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Role Play</h2>
        {lesson.rolePlays.map((rolePlay) => (
          <RolePlayRecorder key={rolePlay.id} rolePlay={rolePlay} />
        ))}
      </section>

      <LessonAssignment assignments={lesson.assignments} />
      <SelfAssessmentRubric />
      <div className="flex justify-end">
        {next ? (
          <Link className="btn-primary" href={`/courses/lessons/${next.id}`}>
            下一课：{next.title}
          </Link>
        ) : (
          <Link className="btn-primary" href="/review">
            进入复盘中心
          </Link>
        )}
      </div>
    </div>
  );
}
