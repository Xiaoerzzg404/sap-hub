# 交接 · A 站 Phase1 Batch2（G2 动作级步骤完成）· 2026-06-10

- updated_by: claude (cowork)
- updated_at: 2026-06-10
- status: code_done_build_verified_committed

## 范围

Ryan 批准「跑 build + 验收 + commit + 继续 Batch2」三件事，本轮全部自助完成。只动 A 的 `web/`，未碰 B、未部署、未 push。

## 修改文件（commit ce749c0）

- `web/components/lesson/LessonStepper.tsx`（重写：完成态由动作驱动）
- `web/lib/progress-storage.ts`（新增 `completedLessonSteps` 列 + `lesson_step_done` 事件映射）
- `web/types/progress.ts`（`ProgressState` 增 `completedLessonSteps: string[]`）

## 做了什么（G2）

把步骤完成从「位置式」（点过就算完）改为「动作式」：
- 新增进度列 `completedLessonSteps`，refId 形如 `lesson_01:shadowing`，复用既有 `toggleProgressList` → 写 `lesson_step_done` 事件（本地+服务端，跨设备一致）。
- Stepper 完成态 = 学员显式「标记这步完成 ✓」∪ 本课已有对应练习类型的真实录音（shadowing→shadowing；micro→micro-training；consultant→consultant-output/role-play，读既有 `GET /api/recordings` 自动推断）。
- 视觉：完成步绿色 + CheckCircle，未完成 Circle 描边；底部新增「动作完成 N / 5 步」与显式确认按钮。导航（位置）与完成（动作）解耦。

## 验证

- `tsc --noEmit`：PASS；`eslint`（3 文件）：PASS。
- 生产 `npm run build`：PASS（Compiled successfully，Generating static pages 58/58，路由表正常）。
- dev 路由编译 smoke：`/courses/lessons/lesson_01`、`lesson_02` → 307→login（HTTP）；`/login` 200；`/` 307。
- 已 commit：Batch1 `ea48490`、Batch2 `ce749c0`（分支 `codex/sap-jp-content-audit-20260521`，husky pre-commit lint-staged 通过）。

## 事故与修复（已闭环，留作教训）

验证 Batch2 时，我对 A 的**实时 dev server 共享的 `.next`** 跑了 `npm run build`，污染 dev manifest，触发 Next 15.5 devtools（`segment-explorer-node`）的 React Client Manifest bug → `/login` 一度 500（与 Batch2 代码无关，lesson 路由仍 307）。
处理：kill dev 进程 → `rm -rf .next` → 新 detached screen 会话 `sap-jp-training-3214` 重启 `npx next dev -p 3214`。复测 `/login` 200、lesson 307，已恢复。临时重启脚本用完已删。
**今后纪律**：验证 A 时，生产 `npm run build` 不得与正在运行的 dev server 共用同一 `.next`（另开目录或先停 dev）。

## 停手点 / 下一步

- 未部署、未 push、未动 DB、未碰 B。
- 仍缺**登录态可视验收**（护栏禁我用真实账号登录）：建议 Ryan 登录后打开任一 lesson 页，确认①五步条的「动作完成 N/5」与绿勾随录音/确认变化；②课末收束卡可标记完成。
- Claude 待命 Batch3（G4 `/me`「继续上次」入口 + 动作完成回灌）与 Batch4（G5 三态统一 / G6 回流页收口）。说「继续」即推进。
