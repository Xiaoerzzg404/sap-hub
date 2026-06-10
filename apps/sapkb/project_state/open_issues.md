# 未决问题
（Run 01 跑通后回填）

## Run 01 双审遗留（低优先，排 Run 02）
- W3：authors UPSERT 按 id 判存而非 UNIQUE(platform,platform_uid)——当前 id 由 (platform,uid) 推导，逻辑对齐，留观察。
- W4：dedup.py 在 collect_lib import 失败时有等价 fallback（pragma no cover 守卫），主路径真复用，可接受。
- 近重复转载（fixture 行10/11「月结/月末（转载版）」）属 stage2 embedding 去重范畴，Run 02 实现（阈值 0.92）。
