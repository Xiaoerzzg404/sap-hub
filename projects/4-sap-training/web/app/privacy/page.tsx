export default function PrivacyPage() {
  return (
    <div className="page-shell max-w-3xl">
      <h1 className="text-3xl font-bold text-ink">隐私政策</h1>
      <p className="mt-2 text-sm text-slate-500">最后更新：2026-05-21</p>

      <h2 className="mt-6 text-xl font-bold text-ink">我们收集什么</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-slate-700">
        <li>注册邮箱和用户名，用于账号登录和课程通知。</li>
        <li>姓名或显示名，用于讲师识别学员。</li>
        <li>学习进度，包括完成课次、跟读次数、收藏术语和句型。</li>
        <li>你主动录制并保存的录音音频。</li>
        <li>自评分数、讲师评分和讲师反馈。</li>
      </ul>

      <h2 className="mt-6 text-xl font-bold text-ink">我们怎么使用</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-slate-700">
        <li>录音仅用于课程训练和讲师反馈。</li>
        <li>录音不公开、不出售、不用于训练 AI 模型。</li>
        <li>讲师只能查看自己班级学生的数据；admin 仅在运营和故障处理需要时访问。</li>
        <li>除法律强制要求外，不向第三方分享你的个人信息。</li>
      </ul>

      <h2 className="mt-6 text-xl font-bold text-ink">你的权利</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-slate-700">
        <li>可以在 /review 页面查看自己的录音和反馈。</li>
        <li>可以删除任一录音；删除后会先软删除，30 天后硬删除。</li>
        <li>
          如需注销账号，请发邮件到{" "}
          <a href="mailto:zzg404@gmail.com" className="text-sap underline">
            zzg404@gmail.com
          </a>
          ，我们会在 14 天内处理。
        </li>
        <li>如需导出个人数据，也请发邮件到上述邮箱。</li>
      </ul>

      <h2 className="mt-6 text-xl font-bold text-ink">存储位置</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-slate-700">
        <li>账号和学习数据：Neon Postgres。</li>
        <li>录音音频：Cloudflare R2 私有 bucket，仅你本人和授权讲师可访问。</li>
        <li>通知邮件：Resend，用于发送讲师反馈提醒等必要通知。</li>
      </ul>

      <h2 className="mt-6 text-xl font-bold text-ink">联系我们</h2>
      <p className="mt-2 text-sm text-slate-700">
        平台运营：Ryan / SAP 日语口语训练平台
        <br />
        邮箱：
        <a href="mailto:zzg404@gmail.com" className="text-sap underline">
          zzg404@gmail.com
        </a>
      </p>
    </div>
  );
}
