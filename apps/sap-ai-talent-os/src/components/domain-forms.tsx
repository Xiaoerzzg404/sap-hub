import {
  coachTypes,
  consultantSources,
  consultantStatuses,
  contentStatuses,
  contentTopics,
  contentTypes,
  demandStatuses,
  englishLevels,
  japaneseLevels,
  productStages,
  productTypes,
  projectStages,
  chineseLevels
} from "@/lib/dictionaries";
import { formatDateInput } from "@/lib/format";
import { Checkbox, Field, FormGrid, FormSection, Select, SubmitButton, Textarea } from "@/components/forms";

type Action = (formData: FormData) => void | Promise<void>;
type AnyRecord = Record<string, unknown>;

function valueOf(record: AnyRecord | undefined, key: string) {
  const value = record?.[key];
  if (value instanceof Date) return formatDateInput(value);
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value;
  return "";
}

function boolOf(record: AnyRecord | undefined, key: string) {
  return Boolean(record?.[key]);
}

export function ConsultantForm({ action, consultant }: { action: Action; consultant?: AnyRecord }) {
  return (
    <form action={action} className="grid gap-5">
      <FormSection title="基础信息">
        <FormGrid>
          <Field label="姓名" name="name" defaultValue={valueOf(consultant, "name") as string} required />
          <Field label="所在地" name="location" defaultValue={valueOf(consultant, "location") as string} required />
          <Field
            label="可工作国家 / 时区"
            name="workCountriesTimezones"
            defaultValue={valueOf(consultant, "workCountriesTimezones") as string}
            required
            placeholder="日本，UTC+9 / 远程"
          />
          <Field label="邮箱" name="email" defaultValue={valueOf(consultant, "email") as string} type="email" />
          <Field label="电话 / 微信 / LinkedIn" name="phone" defaultValue={valueOf(consultant, "phone") as string} />
          <Field label="联系方式备注" name="contactNote" defaultValue={valueOf(consultant, "contactNote") as string} />
          <Select label="当前状态" name="status" options={consultantStatuses} defaultValue={valueOf(consultant, "status") as string} />
          <Select label="来源" name="source" options={consultantSources} defaultValue={valueOf(consultant, "source") as string} />
        </FormGrid>
      </FormSection>

      <FormSection title="SAP 能力">
        <FormGrid>
          <Field label="SAP 模块" name="sapModules" defaultValue={valueOf(consultant, "sapModules") as string} required placeholder="FI，CO，FICO" />
          <Field label="项目年限" name="yearsOfExperience" defaultValue={valueOf(consultant, "yearsOfExperience") as number} type="number" min={0} max={60} />
          <Field label="行业经验" name="industries" defaultValue={valueOf(consultant, "industries") as string} required placeholder="制造，零售，金融" />
          <Field label="擅长流程" name="processes" defaultValue={valueOf(consultant, "processes") as string} required placeholder="GL，AP，AR，Closing" />
        </FormGrid>
        <Textarea label="代表项目" name="representativeProjects" defaultValue={valueOf(consultant, "representativeProjects") as string} required />
        <div className="grid gap-3 md:grid-cols-3">
          <Checkbox label="有 S/4HANA 经验" name="hasS4Hana" defaultChecked={boolOf(consultant, "hasS4Hana")} />
          <Checkbox label="有 Rollout 经验" name="hasRollout" defaultChecked={boolOf(consultant, "hasRollout")} />
          <Checkbox label="有日本项目经验" name="hasJapanProject" defaultChecked={boolOf(consultant, "hasJapanProject")} />
        </div>
      </FormSection>

      <FormSection title="语言与合作">
        <FormGrid>
          <Select label="日语水平" name="japaneseLevel" options={japaneseLevels} defaultValue={valueOf(consultant, "japaneseLevel") as string} />
          <Select label="英语水平" name="englishLevel" options={englishLevels} defaultValue={valueOf(consultant, "englishLevel") as string} />
          <Select label="中文水平" name="chineseLevel" options={chineseLevels} defaultValue={valueOf(consultant, "chineseLevel") as string} />
          <Field label="可参与方式" name="participationModes" defaultValue={valueOf(consultant, "participationModes") as string} required placeholder="学习，助教，项目协作" />
          <Field label="期望单价" name="expectedRate" defaultValue={valueOf(consultant, "expectedRate") as string} />
          <Field label="最近可用时间" name="availableFrom" defaultValue={valueOf(consultant, "availableFrom") as string} type="date" />
        </FormGrid>
        <div className="grid gap-3 md:grid-cols-3">
          <Checkbox label="完成训练营" name="completedBootcamp" defaultChecked={boolOf(consultant, "completedBootcamp")} />
          <Checkbox label="通过模拟面试" name="passedMockInterview" defaultChecked={boolOf(consultant, "passedMockInterview")} />
          <Checkbox label="可推荐给企业" name="recommendable" defaultChecked={boolOf(consultant, "recommendable")} />
        </div>
      </FormSection>

      <FormSection title="评分">
        <FormGrid>
          <Field label="SAP 模块能力分" name="moduleScore" defaultValue={(valueOf(consultant, "moduleScore") as number) || 0} type="number" min={0} max={100} />
          <Field label="项目经验真实性分" name="experienceScore" defaultValue={(valueOf(consultant, "experienceScore") as number) || 0} type="number" min={0} max={100} />
          <Field label="日语 / 英语沟通分" name="languageScore" defaultValue={(valueOf(consultant, "languageScore") as number) || 0} type="number" min={0} max={100} />
          <Field label="文档与交付习惯分" name="deliveryScore" defaultValue={(valueOf(consultant, "deliveryScore") as number) || 0} type="number" min={0} max={100} />
          <Field label="AI 应用能力分" name="aiScore" defaultValue={(valueOf(consultant, "aiScore") as number) || 0} type="number" min={0} max={100} />
          <Field label="责任感与稳定性分" name="reliabilityScore" defaultValue={(valueOf(consultant, "reliabilityScore") as number) || 0} type="number" min={0} max={100} />
        </FormGrid>
        <Textarea label="备注" name="notes" defaultValue={valueOf(consultant, "notes") as string} />
      </FormSection>

      <div className="flex justify-end">
        <SubmitButton>保存顾问档案</SubmitButton>
      </div>
    </form>
  );
}

export function ClientDemandForm({ action, demand }: { action: Action; demand?: AnyRecord }) {
  return (
    <form action={action} className="grid gap-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
        涉及职业介绍、派遣、收费转介或代沟通时，需要先做日本合规确认。本系统只记录需求、评估和项目协作候选人。
      </div>
      <FormSection title="客户需求">
        <FormGrid>
          <Field label="客户名称" name="clientName" defaultValue={valueOf(demand, "clientName") as string} required />
          <Field label="行业" name="industry" defaultValue={valueOf(demand, "industry") as string} required />
          <Field label="国家 / 地区" name="countryRegion" defaultValue={valueOf(demand, "countryRegion") as string} required />
          <Select label="项目阶段" name="projectStage" options={projectStages} defaultValue={valueOf(demand, "projectStage") as string} />
          <Field label="模块需求" name="requiredModules" defaultValue={valueOf(demand, "requiredModules") as string} required placeholder="FI，CO，AI" />
          <Field label="需要人数" name="headcount" defaultValue={(valueOf(demand, "headcount") as number) || 1} type="number" min={1} />
          <Field label="语言要求" name="languageRequirements" defaultValue={valueOf(demand, "languageRequirements") as string} required />
          <Field label="远程 / 现场" name="workMode" defaultValue={valueOf(demand, "workMode") as string} required />
          <Field label="开始时间" name="startDate" defaultValue={valueOf(demand, "startDate") as string} type="date" />
          <Field label="预计周期" name="duration" defaultValue={valueOf(demand, "duration") as string} required />
          <Field label="预算区间" name="budgetRange" defaultValue={valueOf(demand, "budgetRange") as string} />
          <Select label="需求状态" name="status" options={demandStatuses} defaultValue={valueOf(demand, "status") as string} />
        </FormGrid>
        <Textarea label="工作内容" name="workContent" defaultValue={valueOf(demand, "workContent") as string} required />
        <Textarea label="关键风险" name="keyRisks" defaultValue={valueOf(demand, "keyRisks") as string} />
        <div className="grid gap-3 md:grid-cols-3">
          <Checkbox label="需要培训" name="needsTraining" defaultChecked={boolOf(demand, "needsTraining")} />
          <Checkbox label="需要 PoC" name="needsPoc" defaultChecked={boolOf(demand, "needsPoc")} />
          <Checkbox label="需要长期支援" name="needsLongTermSupport" defaultChecked={boolOf(demand, "needsLongTermSupport")} />
        </div>
        <Textarea label="备注" name="notes" defaultValue={valueOf(demand, "notes") as string} />
      </FormSection>
      <div className="flex justify-end">
        <SubmitButton>保存客户需求</SubmitButton>
      </div>
    </form>
  );
}

export function ContentForm({ action, item }: { action: Action; item?: AnyRecord }) {
  return (
    <form action={action} className="grid gap-5">
      <FormSection title="内容资产">
        <FormGrid>
          <Field label="标题" name="title" defaultValue={valueOf(item, "title") as string} required />
          <Select label="内容类型" name="contentType" options={contentTypes} defaultValue={valueOf(item, "contentType") as string} />
          <Select label="主题分类" name="topicCategory" options={contentTopics} defaultValue={valueOf(item, "topicCategory") as string} />
          <Field label="目标读者" name="targetReader" defaultValue={valueOf(item, "targetReader") as string} required />
          <Field label="来源" name="source" defaultValue={valueOf(item, "source") as string} required />
          <Select label="状态" name="status" options={contentStatuses} defaultValue={valueOf(item, "status") as string} />
          <Field label="发布渠道" name="channels" defaultValue={valueOf(item, "channels") as string} required />
          <Field label="计划发布时间" name="plannedPublishAt" defaultValue={valueOf(item, "plannedPublishAt") as string} type="date" />
          <Field label="实际发布时间" name="actualPublishAt" defaultValue={valueOf(item, "actualPublishAt") as string} type="date" />
          <Field label="关联产品" name="relatedProduct" defaultValue={valueOf(item, "relatedProduct") as string} />
          <Field label="关联顾问 / 客户需求" name="relatedEntity" defaultValue={valueOf(item, "relatedEntity") as string} />
          <Field label="CTA" name="cta" defaultValue={valueOf(item, "cta") as string} required />
        </FormGrid>
        <Textarea label="内容摘要" name="summary" defaultValue={valueOf(item, "summary") as string} required />
        <Textarea label="备注" name="notes" defaultValue={valueOf(item, "notes") as string} />
      </FormSection>
      <div className="flex justify-end">
        <SubmitButton>保存内容</SubmitButton>
      </div>
    </form>
  );
}

export function ProductForm({ action, product }: { action: Action; product?: AnyRecord }) {
  return (
    <form action={action} className="grid gap-5">
      <FormSection title="产品资产">
        <FormGrid>
          <Field label="产品名称" name="name" defaultValue={valueOf(product, "name") as string} required />
          <Select label="产品类型" name="productType" options={productTypes} defaultValue={valueOf(product, "productType") as string} />
          <Field label="目标客户" name="targetCustomer" defaultValue={valueOf(product, "targetCustomer") as string} required />
          <Select label="产品阶段" name="stage" options={productStages} defaultValue={valueOf(product, "stage") as string} />
          <Field label="价格区间" name="priceRange" defaultValue={valueOf(product, "priceRange") as string} />
          <Field label="交付形式" name="deliveryFormat" defaultValue={valueOf(product, "deliveryFormat") as string} required />
          <Field label="关联内容" name="relatedContent" defaultValue={valueOf(product, "relatedContent") as string} />
          <Field label="关联客户需求" name="relatedDemand" defaultValue={valueOf(product, "relatedDemand") as string} />
        </FormGrid>
        <Textarea label="交付物清单" name="deliverables" defaultValue={valueOf(product, "deliverables") as string} required />
        <Textarea label="销售话术" name="salesMessage" defaultValue={valueOf(product, "salesMessage") as string} required />
        <Textarea label="备注" name="notes" defaultValue={valueOf(product, "notes") as string} />
      </FormSection>
      <div className="flex justify-end">
        <SubmitButton>保存产品资产</SubmitButton>
      </div>
    </form>
  );
}

export function CoachForm({ action, coach }: { action: Action; coach?: AnyRecord }) {
  return (
    <form action={action} className="grid gap-5">
      <FormSection title="教练资源">
        <FormGrid>
          <Field label="姓名" name="name" defaultValue={valueOf(coach, "name") as string} required />
          <Select label="类型" name="type" options={coachTypes} defaultValue={valueOf(coach, "type") as string} />
          <Field label="专长" name="specialty" defaultValue={valueOf(coach, "specialty") as string} required />
          <Field label="联系方式" name="contact" defaultValue={valueOf(coach, "contact") as string} />
          <Field label="合作方式" name="cooperationMode" defaultValue={valueOf(coach, "cooperationMode") as string} required />
          <Field label="建议沟通频率" name="suggestedFrequency" defaultValue={valueOf(coach, "suggestedFrequency") as string} required />
          <Field label="上次沟通日期" name="lastContactDate" defaultValue={valueOf(coach, "lastContactDate") as string} type="date" />
          <Field label="下次沟通日期" name="nextContactDate" defaultValue={valueOf(coach, "nextContactDate") as string} type="date" />
        </FormGrid>
        <Textarea label="本次请教问题" name="currentQuestion" defaultValue={valueOf(coach, "currentQuestion") as string} />
        <Textarea label="给出的建议" name="advice" defaultValue={valueOf(coach, "advice") as string} />
        <Textarea label="下一步行动" name="nextAction" defaultValue={valueOf(coach, "nextAction") as string} />
        <Textarea label="备注" name="notes" defaultValue={valueOf(coach, "notes") as string} />
      </FormSection>
      <div className="flex justify-end">
        <SubmitButton>保存教练资源</SubmitButton>
      </div>
    </form>
  );
}

export function WeeklyReviewForm({
  action,
  review
}: {
  action: Action;
  review?: AnyRecord;
}) {
  return (
    <form action={action} className="grid gap-5">
      <FormSection title="本周经营指标">
        <FormGrid>
          <Field label="周开始日期" name="weekStart" defaultValue={valueOf(review, "weekStart") as string} type="date" required />
          <Field label="周结束日期" name="weekEnd" defaultValue={valueOf(review, "weekEnd") as string} type="date" required />
          <Field label="本周新增内容数" name="newContentCount" defaultValue={(valueOf(review, "newContentCount") as number) || 0} type="number" min={0} />
          <Field label="新增线索数" name="newLeadCount" defaultValue={(valueOf(review, "newLeadCount") as number) || 0} type="number" min={0} />
          <Field label="新增顾问档案数" name="newConsultantCount" defaultValue={(valueOf(review, "newConsultantCount") as number) || 0} type="number" min={0} />
          <Field label="新增客户访谈数" name="newClientInterviewCount" defaultValue={(valueOf(review, "newClientInterviewCount") as number) || 0} type="number" min={0} />
          <Field label="社群活跃人数" name="communityActiveCount" defaultValue={(valueOf(review, "communityActiveCount") as number) || 0} type="number" min={0} />
          <Field label="课程报名人数" name="courseSignupCount" defaultValue={(valueOf(review, "courseSignupCount") as number) || 0} type="number" min={0} />
          <Field label="企业咨询机会数" name="enterpriseOpportunityCount" defaultValue={(valueOf(review, "enterpriseOpportunityCount") as number) || 0} type="number" min={0} />
          <Field label="可推荐顾问数" name="recommendableConsultantCount" defaultValue={(valueOf(review, "recommendableConsultantCount") as number) || 0} type="number" min={0} />
          <Field label="本周收入" name="weeklyRevenue" defaultValue={(valueOf(review, "weeklyRevenue") as number) || 0} type="number" min={0} />
          <Field label="本周老板投入小时" name="founderHours" defaultValue={(valueOf(review, "founderHours") as number) || 0} type="number" min={0} />
        </FormGrid>
      </FormSection>
      <FormSection title="复盘内容">
        <Textarea label="本周完成事项" name="completedItems" defaultValue={valueOf(review, "completedItems") as string} required />
        <Textarea label="本周最大问题" name="biggestProblem" defaultValue={valueOf(review, "biggestProblem") as string} required />
        <Textarea label="本周学到什么" name="learning" defaultValue={valueOf(review, "learning") as string} required />
        <Textarea label="下周最重要一件事" name="nextMostImportantThing" defaultValue={valueOf(review, "nextMostImportantThing") as string} required />
        <Textarea label="下周 Top 3 Todo" name="nextTop3Todos" defaultValue={valueOf(review, "nextTop3Todos") as string} required />
        <Textarea label="需要分发出去的任务" name="delegatedTasks" defaultValue={valueOf(review, "delegatedTasks") as string} />
        <Textarea label="需要找谁帮忙" name="peopleToAsk" defaultValue={valueOf(review, "peopleToAsk") as string} />
        <Textarea label="备注" name="notes" defaultValue={valueOf(review, "notes") as string} />
      </FormSection>
      <div className="flex justify-end">
        <SubmitButton>保存每周复盘</SubmitButton>
      </div>
    </form>
  );
}
