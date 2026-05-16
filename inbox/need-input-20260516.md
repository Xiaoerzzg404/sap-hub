# need-input-20260516 · systems/ 三个软链接路径待确认

蓝图第 1 节要求 systems/ 下挂 4 个软链接，已建 1，其余 3 个路径不明，
按蓝图"不要猜"原则停下来等输入。

| 软链接名 | 目标含义 | 当前状态 |
|---|---|---|
| systems/media-pipeline | 现有日更流水线 | 已建 → ~/news/studio |
| systems/video-kb       | sap-video-kb 目录 | **待确认绝对路径** |
| systems/course-codex   | codex 那套课程系统目录 | **待确认绝对路径** |
| systems/course-cc      | claude code 那套课程系统目录 | **待确认绝对路径** |

## 请用户/大脑回填（任选一种格式）

```
video-kb:     <绝对路径>  或  跳过
course-codex: <绝对路径>  或  跳过
course-cc:    <绝对路径>  或  跳过
```

回填后，下一个动手的 agent 用以下命令建链：

```bash
ln -s <绝对路径> ~/sap-hub/systems/<软链接名>
```

## 风险
- 提示但不阻塞：缺这三个软链接不影响 AGENTS.md / 六个 project 的工作启动
- 蓝图明确 systems/ 内的现成系统逻辑不改写，软链接只是入口指针
