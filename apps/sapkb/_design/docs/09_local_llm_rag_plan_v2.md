# 09｜本地模型与 RAG 方案 v2（需求 5）

> 需求 5：在本地构建专属大模型做内容采集/转化/入库。
> v1 的判断（RAG 优先、别从零训）是对的，v2 完全认同并把它**接到 Mac mini 的硬件现实**，给出三阶段可落地路线。

## 一、先纠一个常见误区

“本地专属大模型”≠ 从零训练一个 SAP 大模型。在单台 Mac mini 上从零训不现实，也没必要。
**真正要的是“懂你 SAP 知识库的本地 AI 助手”**，路线是：

```text
RAG + 本地 embedding/reranker + SAP 术语词典 + 专属评测集 →（很久以后，且仅在必要时）LoRA
```

## 二、三阶段定义（每阶段都有明确产出和判据）

### 阶段 1：RAG 助手（MVP，先做这个）
- 本地 LLM：Ollama（候选如 qwen 系；**v3 注：具体模型不在设计稿写死**——实施时以
  Ollama 当期可用的中文模型，用 50 题评测集实测选型，落 decisions.md）。
- 本地 embedding：候选 bge-m3 / bge-large-zh 一类中英双语模型，同样实测后定版
  （选定后写入 chunks.embedding_model，换模型可识别需重嵌块）。
- 检索：FTS5（关键词/tcode 精确）+ 向量（语义）混合 → reranker 重排。
- 产出：断网也能本地搜索、摘要、问答（带来源、标置信层）。
- **判据**：50 道 SAP 问答评测集，引用正确率 + 无幻觉率达标即可。

### 阶段 2：SAP 专属增强（知识够了再做）
- SAP 术语词典：模块/tcode/表/字段/Fiori/BAPI/IDoc/配置路径/常见报错，喂给实体识别和检索。
- 专属 Prompt 库：摘要/分类/事务码解释/配置整理/选题/引用检查。
- 专属评测集：300+ 标准问答（带标准答案和来源），持续回归。
- **判据**：评测集稳定通过、标签准确率达标。

### 阶段 3：LoRA 微调（绝大多数情况都不需要，最后才碰）
仅当**同时**满足：
1. 知识块 ≥ 5000，且质量过审；
2. 标准问答样本 ≥ 300；
3. RAG 已稳定，但模型在“日中英混合 SAP 表达 / 项目口吻”上仍明显不足。

- Mac 现实：LoRA 训练在 Apple Silicon 上可做（MLX / unsloth 路线），但**先把前两阶段吃透**。
- 微调只改“说话方式/术语习惯”，**不改事实**——事实永远靠 RAG（可更新、可审计、保来源）。

## 三、为什么 RAG 永远优先于微调（对 SAP 尤其成立）
- SAP 知识更新快（ECC→S/4、年度 release）；微调把旧事实焊死，RAG 改一条文档就更新。
- 项目知识私密；RAG 可隔离、可标 confidential，微调会把机密揉进权重。
- RAG 保来源引用，可审计——直接支撑需求 10 的“答案必须有来源”。

## 四、统一模型接口（便于本地/云端替换）

```python
class LLMProvider:
    def generate(self, prompt: str, **kwargs) -> str: ...

class EmbeddingProvider:
    def embed(self, texts: list[str]) -> list[list[float]]: ...

class RerankerProvider:
    def rerank(self, query: str, docs: list[str]) -> list[float]: ...
```

实现可切换：Ollama / llama.cpp / vLLM / 云端 API。
**默认本地优先**；只有非敏感、需要更强能力的任务（如复杂选题）才允许走云端，且 confidential 内容禁止出本地。

## 五、RAG 检索流程（标置信层）

```text
Query
 → Query Analyzer（识别模块/tcode/表/流程）
 → Hybrid Search（FTS5 + 向量）
 → Reranker 重排
 → Context Builder（拼上下文，附来源 + confidence_tier）
 → Answer Generator
 → Citation Guard（无来源不输出结论）
 → Quality Guard（幻觉/冲突/过期检查）
 → Final Answer（权威来源直接信，参考来源标“需验证”）
```

## 六、硬件现实提示（Mac mini）
- 阶段 1/2 在 Mac mini（建议 ≥16GB，跑 7B 量化 + embedding 舒适）完全可行。
- 向量库用 Chroma/LanceDB 本地文件，无需服务化。
- 大规模 embedding 首次入库可分批跑，放在晨间 launchd 档。
