# TEACHER_GUIDE · 讲师使用手册

- updated_by: codex
- updated_at: 2026-05-21T12:10:00+09:00
- audience: SAP 日语训练营讲师

## 1. 登录与权限

讲师也使用 magic link 登录。

1. 打开 `https://sap-jp.training/login`。
2. 输入讲师邮箱。
3. 勾选隐私政策。
4. 点击邮件里的确认登录链接。
5. 进入 `/teacher`。

讲师权限不能自己申请，也没有前台 self-promote endpoint。

Ryan 或 admin 必须在数据库里手动把用户角色改成 `teacher`：

```sql
update users
set role = 'teacher', updated_at = now()
where email = 'teacher@example.com';
```

admin 角色同理必须手动 SQL 设置，不允许从前台开放。

## 2. 讲师能看什么

讲师页面包括：

- `/teacher`：课程资料浏览、待复核术语入口、录音作业入口。
- `/teacher/recordings`：学生录音列表。
- `/teacher/recordings/:id`：单条录音详情和反馈表。
- `/teacher/review-terms`：待复核术语表。

安全边界：

- `teacher` 只能看自己负责班级里 active enrollment 的学生。
- `admin` 可以查看全部学生录音。
- 学生访问讲师 API 会返回 403。
- 未登录访问讲师 API 会返回 401。

## 3. 查看学生录音

进入 `/teacher/recordings` 后可以按条件筛选：

- 学生。
- 课次。
- 录音状态。
- 是否已有反馈。

列表中每条录音会显示：

- 学生邮箱和姓名。
- lessonId。
- practiceType。
- 创建时间。
- 录音状态。
- 讲师反馈状态。

点击录音进入详情页后，可以播放学生录音。播放链接是 R2 presigned GET URL，有短有效期，不要复制到公开渠道。

## 4. 提交评分与反馈

详情页反馈表包含：

- 总分。
- pronunciation。
- fluency。
- naturalness。
- sapAccuracy。
- consultantLike。
- 文字留言。
- correctedJapanese。

建议反馈结构：

1. 先确认做得好的地方。
2. 指出一个最重要的问题。
3. 给出可直接背诵的自然日语替代表达。
4. 给下一次录音任务。

提交后：

- `teacher_feedback` 会 upsert，一条录音最多保留一条当前反馈。
- 系统会尝试用 Resend 通知学生。
- 邮件失败时 API 返回错误，反馈记录本身仍会返回在响应中。

## 5. 待复核术语

`/teacher/review-terms` 用来标记课程数据中的术语或 ASR 可疑项。

讲师处理原则：

- 真实 SAP 项目表达优先。
- 不确定的 SAP 配置路径、事务码、版本差异不要硬改成确定语气。
- 需要 Ryan 判断的项目，保留 `mustReview` 或在课后记录给 admin。
- 不把课程噪音、片头片尾、广告语当成正式日语素材。

## 6. 删除与隐私

学生可以删除自己的录音。

删除后：

- 学生列表不再显示。
- 讲师列表不再显示。
- DB row 标记 `deleted_at`。
- 30 天后硬删除。

讲师不要把学生录音下载、转发或贴到公开群。若需要教学案例，必须先征得学生明确同意并做匿名化处理。

## 7. 常见问题

看不到学生：

- 确认讲师账号 role 是 `teacher`。
- 确认班级的 `teacher_id` 是当前讲师 user id。
- 确认学生 enrollment 状态是 `active`。

播放失败：

- 刷新页面重新获取 presigned URL。
- 如果仍失败，请让 admin 检查 R2 object 是否存在。

反馈提交后学生没收到邮件：

- 先让学生进 `/review` 查看。
- 再让 admin 检查 Resend dashboard。
