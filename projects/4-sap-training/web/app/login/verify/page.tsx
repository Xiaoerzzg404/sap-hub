export default function VerifyPage() {
  return (
    <div className="page-shell">
      <div className="panel mx-auto max-w-md p-6 text-center">
        <h1 className="text-2xl font-bold text-ink">查看你的邮箱</h1>
        <p className="mt-3 text-sm text-slate-600">我们已经发送了一封带登录链接的邮件。点击邮件里的按钮即可登录。</p>
        <p className="mt-2 text-xs text-slate-500">链接 15 分钟内有效。如果没收到，请检查垃圾邮件文件夹。</p>
      </div>
    </div>
  );
}
