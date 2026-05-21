import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLessons, getLessonById, getNextLesson } from "@/lib/content/lessons";
import { getJapaneseCoachByLessonId, getJapaneseCoachData } from "@/lib/japanese-coach";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonObjective } from "@/components/lesson/LessonObjective";
import { ScenarioMap } from "@/components/lesson/ScenarioMap";
import { TermCard } from "@/components/lesson/TermCard";
import { PhraseCard } from "@/components/lesson/PhraseCard";
import { JapaneseCoachPanel } from "@/components/lesson/JapaneseCoachPanel";
import { LessonAssetsTabs } from "@/components/lesson/LessonAssetsTabs";
import { LessonAssetBadge } from "@/components/lesson/LessonAssetBadge";
import { LessonAssignment } from "@/components/lesson/LessonAssignment";
import { SelfAssessmentRubric } from "@/components/lesson/SelfAssessmentRubric";
import { LessonStepShell } from "@/components/lesson/LessonStepShell";
import { ShadowingCard } from "@/components/speaking/ShadowingCard";
import { MicroTrainingTimer } from "@/components/speaking/MicroTrainingTimer";
import { ConsultantOutputRecorder } from "@/components/speaking/ConsultantOutputRecorder";
import { RolePlayRecorder } from "@/components/speaking/RolePlayRecorder";
import { SubstitutionDrillCard } from "@/components/speaking/SubstitutionDrillCard";

export async function generateStaticParams() {
  const allLessons = await getAllLessons();
  return allLessons.map((lesson) => ({ lessonId: lesson.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);
  if (!lesson) notFound();
  const next = await getNextLesson(lesson.id);
  const coach = getJapaneseCoachByLessonId(lesson.id);
  const coachData = getJapaneseCoachData();

  return (
    <div className="page-shell space-y-6">
      <LessonHeader lesson={lesson} />
      <LessonAssetBadge assets={(lesson.assets ?? []).filter((a) => a.visibility !== "teacher")} />
      <LessonObjective lesson={lesson} />
      <ScenarioMap items={lesson.scenarioMap} />
      <LessonAssetsTabs lesson={lesson} viewerRole="student" />
      <JapaneseCoachPanel
        coach={coach}
        grammarNotes={coachData.grammarNotes}
        routinePhrases={coachData.routinePhrases}
      />

      <LessonStepShell
        lesson={lesson}
        warmup={
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">术语卡</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {lesson.terms.slice(0, 6).map((term) => (
                <TermCard key={term.id} term={term} />
              ))}
            </div>
          </section>
        }
        phrases={
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">句型卡</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {lesson.phrases.slice(0, 6).map((phrase) => (
                <PhraseCard key={phrase.id} phrase={phrase} />
              ))}
            </div>
          </section>
        }
        shadowing={
          <div className="space-y-6">
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
              {lesson.substitutionDrills.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {lesson.substitutionDrills.slice(0, 4).map((drill) => (
                    <SubstitutionDrillCard key={drill.id} drill={drill} />
                  ))}
                </div>
              ) : (
                <div className="panel p-4 text-sm text-slate-500">
                  替换训练素材暂未接入，先完成 Shadowing。
                </div>
              )}
            </section>
          </div>
        }
        micro={
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">30 秒 Micro Training</h2>
            {lesson.microTrainings.map((task) => (
              <MicroTrainingTimer key={task.id} task={task} />
            ))}
          </section>
        }
        consultant={
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-ink">60 秒 Consultant Output</h2>
              {lesson.consultantOutputs.map((task) => (
                <ConsultantOutputRecorder key={task.id} task={task} />
              ))}
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-ink">Role Play</h2>
              {lesson.rolePlays.length ? (
                lesson.rolePlays.map((rolePlay) => (
                  <RolePlayRecorder key={rolePlay.id} rolePlay={rolePlay} />
                ))
              ) : (
                <div className="panel p-4 text-sm text-slate-500">
                  Role Play 素材暂未抽取到合格真实日语句，等待内容修复。
                </div>
              )}
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
        }
      />
    </div>
  );
}
