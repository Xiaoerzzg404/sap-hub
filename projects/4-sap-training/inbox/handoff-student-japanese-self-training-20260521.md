# 交接 · 学员日语自训升级 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: 学员侧 Japanese Coach 层与自训工作台

## 改了什么

- 在每个 lesson detail page 增加学员侧 Japanese Coach 面板：
  - `projects/4-sap-training/web/components/lesson/JapaneseCoachPanel.tsx`
  - 由 `projects/4-sap-training/web/app/courses/lessons/[lessonId]/page.tsx` 接入
- 新增 `/speaking/self-training`：
  - lesson selector
  - 句型拆解
  - NG 改写
  - 对话补全
  - 60 秒输出
  - 通过现有 `RecordingPanel` 接入 recording hooks
  - 每课本地笔记，用于记录弱表达、老师提醒和模块替换句
- 更新入口：
  - header CTA 指向 self-training
  - sidebar/mobile nav 增加 `日语自训`
  - `/speaking` hub 增加 `日语自训工作台`
- 复用现有结构化 `web/data/japanese-coach.json` 讲师/学员 coach 数据，没有另造平行来源。
- `/speaking/self-training` 改用 `getAllLessons()` 加载 lesson metadata，避免把完整课程内容塞进巨大 client payload。

## 已补上的内容缺口

- 旧 lesson 页面有 terms/phrases/recording flow，但没有清晰说明一个日语句子为什么适合真实 SAP 项目会议。
- 学员有录音工具，但缺少紧凑 drill 页面来练 NG-to-OK 改写、对话补全和 60 秒顾问输出。
- 学员在训练流程里没有本地位置保存每课弱日语表达和改写尝试。
- coach 数据现在进入学员 flow，而不只用于讲师备课。

## 验证

- `npm run typecheck`：PASS。
- `npm run lint`：PASS。
- `CI=true DATABASE_URL=postgres://mock:mock@localhost:5432/mock AUTH_SECRET=local-build-secret NEXTAUTH_URL=http://localhost:3000 NEXT_PUBLIC_SENTRY_DSN= npm run build`：清理 stale `.next` 后 PASS。
- Browser smoke on `http://127.0.0.1:3211`：
  - public header 显示 `开始自训`
  - sidebar 显示 `日语自训`
  - 未登录 `/speaking/self-training` 跳转到 `/login?callbackUrl=%2Fspeaking%2Fself-training`
- Cookie-scoped local render smoke：
  - `/courses/lessons/lesson_01`：200，包含 `日本人老师提示`、`讲解任务`、`本课常用套路`
  - `/speaking/self-training`：200，包含 `日语自训工作台`、`句型拆解`、`NG 改写`、`对话补全`、`60 秒输出`、`我的笔记`

## 未运行

- 未跑真实 authenticated student recording E2E，因为没有提供 test student session。
- 未跑真实 teacher feedback loop。

## 下一步

使用测试学员账号打开 `/speaking/self-training`，完成一个 NG 改写和一个 60 秒输出录音，然后评估 checklist 文案对初级中国 SAP 顾问是否足够清楚。
