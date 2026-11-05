# dsh-arch-advisor-offline · DeepSeek Harness 离线架构顾问插件

[English](#english) · 中文

## 一句话说明

**在线版的"完全离线"姊妹插件。** 把开源知识库
[awesome-architecture](https://github.com/study8677/awesome-architecture)
（40 篇教程 + T01 基础模型训练决策专题、31 个模板、6 个案例，中英全量）**打包进插件本体**，
运行时**零网络依赖**——适合完全断网或只信任固定内容快照的环境。

- 工具名带 **`_offline`** 后缀（如 `arch_read_offline`），可与在线版 `dsh-arch-advisor` **同时安装**，互不冲突。
- 内容与上游同步于打包时的版本；上游更新后需更新本插件获取新内容。
- 数据来源：[awesome-architecture](https://github.com/study8677/awesome-architecture)（MIT）。本插件不包含/改写其内容，仅打包分发。

## 适配的 DSH 版本

| 项 | 版本 | 说明 |
| --- | --- | --- |
| **DeepSeek Harness** | **0.2.1-rc.5** | 本版（0.3.0）实际验证的宿主版本 |
| `@deepseek-ai/cordis` | `~4.0.5` | `peerDependencies` 声明 |
| `@deepseek-ai/dsh-tools` | `>=0.2.1-rc.5` | `peerDependencies` 声明 |
| `engines.dsh` | `>=0.2.1-rc.5` | 低于此版本安装会被拦截 |

**为什么是这个下限**：插件只用到三个公开 API —— `defineTool`、`ctx.tools.register`、`ctx.systemPrompt.section`，三者在 0.2.1-rc.5 中签名未变，因此本版按该版本验证并声明。

**注意 semver 陷阱**：`dsh-tools` 的 peer 范围必须写成 `>=0.2.1-rc.5`。写成 `>=0.1.0` 这类普通范围时，npm 的语义是**不匹配任何预发布版**（预发布只在同 `major.minor.patch` 三元组的范围内才被接受），会导致 0.2.1-rc.5 环境安装报 peer 冲突。

**更低版本**：0.1.x / 0.2.0 未做验证，`engines` 会拦截。确实需要旧版时，可临时移除 `engines.dsh` 后自行测试，但 `defineTool` / `systemPrompt.section` 若在旧版有差异需自行适配。

**验证方式**（2026-11-05，Windows + DSH 0.2.1-rc.5）：

1. `node --check lib/index.js lib/docs-gbt.js` 语法通过；
2. 用假 ctx 跑 `apply()`，确认注册 7 个工具、2 段 prompt section；
3. 冒烟四个分支：`docType="list"`、`docType="SRS"`、`docType="prd"`（应返回迁移提示）、`arch_version_offline`。

## 7 个工具（全部 _offline 后缀）

| 工具 | 作用 |
|---|---|
| `arch_roadmap_offline` | 知识库总览与学习路径 |
| `arch_search_offline` | 目录关键词检索 |
| `arch_read_offline` | 读某篇正文（目录+预览/full/zh·en） |
| `arch_ask_offline` | 想法 → 映射到相关 教程+模板+案例 |
| `arch_design_offline` | 分步引导式架构设计 |
| `arch_docs_offline` | **GB/T 8567—2006 的 25 类文档骨架**（`docType="list"` 看清单与裁剪建议） |
| `arch_version_offline` | 文档标识与修订记录规范（不建 `archive/` 副本） |

## 项目文档能力（v0.3 起按 GB/T 8567—2006）

从 v0.3 开始，文档能力不再是自造的 5 类（arch/prd/hld/lld/dbd），而是**国标第 7 章的 25 类**：

- 取骨架：`arch_docs_offline(docType="SRS")` 或 `docType="11"`，编号 1~25 与简称都认；
- 每份返回四块：**代码策略** → **文档控制块** → **章节骨架** → **填写要点 + 完成标准**；
- 清单与裁剪：`docType="list"` 给出按阶段分组的 25 类、三档规模裁剪建议、代码策略速查。

**代码策略**（解决"概要设计里塞代码"的问题）：

| 档位 | 谁能用 |
|---|---|
| 禁止代码 | FAR、SDP、STP、STrP、OCD、SSS、IRS、**SSDD（概要设计）**、SRS、DRD、STR、SCMP、SQAP、DPMR、PDSR、SVD |
| 仅命令 | SIP、SUM、COM |
| 仅签名 | IDD |
| 仅伪代码 | **SDD（软件结构设计）**，且必须标注"伪代码，非交付源码" |
| 允许 DDL | DBDD |
| 仅测试数据 | STD |
| 允许片段 / 只引用 | CPM / SPS |

**修订记录固定放文档头部**（紧跟一级标题），不再出现"有时头部有时文末"；升版只在修订记录表追加一行。`archive/` 快照机制已移除——历史版本交给 git。

旧代号（arch/prd/hld/lld/dbd）会返回迁移提示，不再静默兼容。

## 安装

```sh
# GitHub 直装
dsh plugin --profile web add github:LeeGuanWei-a/dsh-arch-advisor-offline

# 或发布 npm 后
dsh plugin --profile web add dsh-arch-advisor-offline
```

重启后开新会话即可用（无网络也可）。

## 内容更新

awesome-architecture 约一两周更新一次。更新本离线包：

1. 上游 clone 拉到最新：`git -C <你的awesome-architecture克隆> pull`
2. 重新同步 content/（`sync-content` 由作者执行）：把 `tutorial/ cases/ templates/ en/` 及顶层 md 复制回 `content/`
3. 升版本号 → 发布

**当前快照**：同步自上游 commit `96226d2`（2026-09-21，*为每个页面注入 canonical 与 Open Graph/Twitter 元数据 (#46)*）。
本次逐文件与上游核对并同步了教程 / 模板 / 案例全部正文。其中**实质性更新**的是：T01「基础模型训练决策专题」中英文（新增）、`tutorial/README.md`、`en/tutorial/README.md`、`README.md`、`README_en.md`、`templates/ai-gateway/README.md`、`en/templates/ai-gateway/README.md`（补 Bifrost）；其余文件逐行核对后确认已与上游一致，未改写。
行尾说明：被更新过的文件为 LF，未改动的文件保持原 CRLF；`lib/index.js` 的目录解析（`outline()`）已同时兼容 CRLF 与 LF。

> 需要作者提供一个一键同步脚本的话，说明即可。

## 验证

```sh
dsh plugin --profile web list        # 应看到 dsh-arch-advisor-offline
# 断网状态下问：帮我设计一个电商秒杀系统 → arch_ask_offline 应能正常返回
```

## 与在线版的取舍

| | 在线版 dsh-arch-advisor | 离线版（本插件） |
|---|---|---|
| 内容 | 运行时拉取，永远最新 | 打包内置，固定快照 |
| 网络 | 必须能访问 GitHub | 完全不需要 |
| 包体积 | ~KB | ~3.5MB（含内容） |
| 可同装 | — | ✅ 工具名 _offline 不冲突 |

## 常见问题

**Q：为什么工具名带 _offline？**
A：避免与在线版同名工具重复注册冲突；两版可同时安装按需使用。

**Q：内容会过期吗？**
A：会——冻结在打包时刻。上游更新后更新本插件即可（见"内容更新"）。

**Q：对 dsh 版本要求？**
A：**DSH ≥ 0.2.1-rc.5**（cordis 4.0.5、dsh-tools 0.2.1-rc.5 验证通过）。见上方「适配的 DSH 版本」。安装时 `engines.dsh` 与 peer 校验会自动拦截过旧 host；注意 `dsh-tools` 的 peer 必须写成 `>=0.2.1-rc.5`，普通范围（如 `>=0.1.0`）不接受预发布版。

**Q：为什么说"想一个方案"时，它有时不调用工具？**
A：工具是否被调用最终由模型决定；插件能控制的只有两件事——注册工具、往系统提示注入触发规则。本插件注入了两条规则：
①「想做一个 X / 帮我想个方案 / 设计一个系统 / 从想法起步」→ 先 `arch_ask_offline` 映射知识库，再按需 `arch_design_offline` 分阶段推进；
②「生成文档 / 说明书 / 把 xx 写成文档」→ 先 `arch_docs_offline(docType="list")` 定文档清单（25 类里裁），再逐份取骨架、按代码策略填写；版本与修订记录用 `arch_version_offline`。
若仍不触发，依次检查：插件在当前 profile 是否已加载（改代码/升级后需重载或重启 DSH）、当前模型的工具调用倾向（可换更稳的模型或提高 reasoning effort）、该会话是否真的装了本插件（`web`/`desktop` profile 各自独立）。

---

## English

**Fully-offline sister plugin of `dsh-arch-advisor`.** The awesome-architecture
knowledge base (tutorials/templates/cases, zh+en) is **bundled into the package** —
zero network access at runtime. Tool names carry an `_offline` suffix so it can be
installed alongside the online version without conflicts.

**Requirements**: DeepSeek Harness **0.2.1-rc.5** or later (verified with cordis 4.0.5
and dsh-tools 0.2.1-rc.5). Declared via `engines.dsh: ">=0.2.1-rc.5"` and peer ranges
`@deepseek-ai/cordis ~4.0.5` / `@deepseek-ai/dsh-tools >=0.2.1-rc.5`.

**Documents (v0.3)**: `arch_docs_offline` now returns skeletons for the **25 document
types of GB/T 8567—2006**, each with a hard code policy (SSDD/SRS = no code; SDD =
pseudocode only; DBDD = DDL; CPM = snippets; SPS = by reference). `arch_version_offline`
maintains the document-control block and revision table at the top of each file — no
`archive/` snapshots, history lives in git.

**Install**:

```sh
dsh plugin --profile web add github:LeeGuanWei-a/dsh-arch-advisor-offline
```

Content freezes at pack time; update the plugin to refresh (upstream refreshes ~weekly).

Data source: [awesome-architecture](https://github.com/study8677/awesome-architecture) (MIT).
