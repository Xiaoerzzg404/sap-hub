# SAPKB Harvest Runner 使用说明

## 文件说明
- `scripts/harvest_runner.sh`
  - Bash 任务脚本。
  - 按 `apps/sapkb/_design/configs/acquisition_sources.yaml` 读取采集源。
  - 仅执行 `fixture_csdn` 与 `sap_community_blogs` 两个支持源。
  - 只运行 `enabled` 且 `reachable` 为 `true` 的条目。
  - 按顺序调用 `/usr/bin/python3 cli.py harvest --source <id>`。
  - 每次执行写入 `apps/sapkb/logs/harvest_<YYYYMMDD>.log`。

- `launchd/com.ryan.sapkb.harvest-at-0630.plist`
  - launchd 调度定义（06:30 每天触发）。
  - 含有手动执行示例与加载命令注释。

- `logs/`
  - 用于保存 harvest 日志和 launchd 标准输出/错误日志。

## 手动执行 runner
```bash
/usr/bin/bash apps/sapkb/scripts/harvest_runner.sh
```

## 什么时候要 load/unload
本次按要求不默认 load，由 Lead 决定是否启用。

### 手动 load
```bash
launchctl load /Users/openclawxiaoer/sap-hub/apps/sapkb/launchd/com.ryan.sapkb.harvest-at-0630.plist
```

### 手动 unload
```bash
launchctl unload /Users/openclawxiaoer/sap-hub/apps/sapkb/launchd/com.ryan.sapkb.harvest-at-0630.plist
```

## 为什么默认不 load
1. 避让晚间 19:00 / 20:30 / 21:30 / 22:00 流水线窗口，交由 Ryan 人工决策是否接管。
2. 先保留 draft-only 自动化边界，避免上线阶段误触发发布行为。
3. 便于先核查 `acquisition_sources.yaml` 和 pipeline 行为后再统一接管。
