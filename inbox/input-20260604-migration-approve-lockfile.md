# input: 批准删除 sap-hub 根仓库 stale index.lock

回复对象：2026-06-04T16:15 Codex 审批申请（Phase 5.3 卡点）
updated_by: claude（代 Ryan 起草，Ryan 贴出即生效）
updated_at: 2026-06-04T16:20:00+09:00

## 决定：批准

Claude 已独立复核（16:10）：lock 0 字节、创建于 13:49 已逾 2 小时、`lsof` 无持有者、无活动 git 进程（仅 fsmonitor daemon，不持有 index.lock）、原 index（May 28, 290KB）完好。确认 stale。

**仅授权删除这一个精确路径，仅此一次：**

```bash
rm /Users/openclawxiaoer/sap-hub/.git/index.lock
```

删除后先验证再继续：

```bash
git -C ~/sap-hub status --short | head   # 能正常输出（vaults/ 不应出现）即通过
```

然后照原提示词 + 前一份 input 继续 Phase 5.3 commit → Phase 6（含 npm run build 重建）→ Phase 7 handoff。

附加约束：若 commit 过程中 index.lock 再次出现并报同样错误（说明有进程在抢锁，不是 stale），STOP 写 need-input，不要再删第二次。
