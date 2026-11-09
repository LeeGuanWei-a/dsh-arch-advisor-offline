---
name: dsh-arch-advisor-offline
description: 离线架构顾问：内置 awesome-architecture 知识库（40 篇教程 + 31 个模板 + 6 个案例，中英双语，零联网），把「我想做一个 X / 帮我想个方案 / 设计一个系统」映射到教程+模板+案例，按六阶段推进架构设计，并生成符合 GB/T 8567—2006 的 25 类或旧版 5 类文档骨架、维护文档标识与修订记录。只要用户提到系统设计、架构方案、架构评审、技术选型、容量/一致性/可用性取舍、微服务拆分、AI 原生架构、需求/概要设计/详细设计/数据库设计文档、投标或交付文档、文档升版，就应使用本 skill——即使他没说出"架构"或"文档"这两个词。先查知识库再回答，不要凭记忆编架构方案。
compatibility: 自包含：`lib/` 与 `content/` 与本文件同目录，复制整个 skill 目录即可安装。需要 Node.js ≥ 18.17（用于 `scripts/arch.mjs`）；无 Node 时可按「无命令环境」小节降级为直接读文件。全程离线，不发起任何网络请求。
license: MIT
---

# 离线架构顾问（awesome-architecture）

本 skill 把 [awesome-architecture](https://github.com/study8677/awesome-architecture) 的知识库打包在本地（`content/`，163 个 Markdown，中英双语），用来做三件事：**把想法映射到现成架构**、**分阶段把方案推完整**、**产出可交付的架构文档**。

它与同名 DSH 插件同源：下面命令的输出，和宿主里 `arch_ask_offline` / `arch_docs_offline` 等工具逐字一致。命令只是手段，**判断依据永远来自知识库正文**。

## 何时用 / 何时不用

用：

- 用户说「想做一个 X」「帮我想个方案」「设计一个系统」「这个功能怎么落地」——先从想法起步。
- 技术选型、容量估算、一致性/可用性/成本取舍、拆分与迁移、架构评审、技术债与演进路线。
- 要写或重写文档：需求、概要设计、详细设计、数据库设计、测试计划、投标/交付文档、文档升版与修订记录。
- 用户在做 AI 原生系统、RAG、Agent 平台、推理服务、网关、嵌入式/IoT 等，需要对照真实系统的架构图与死点。

不用（或用了也只是负担）：

- 纯编码问题（语法、报错、重构具体函数）——直接把代码写好。
- 与架构无关的通用问答、闲聊、翻译。
- 用户明确说「不用查资料，随便聊聊」——尊重，直接回答。

## 0. 先定位知识库（每个会话一次）

```bash
node <skill目录>/scripts/arch.mjs where
```

输出里有 **知识库根**（`…/content`）。后面读正文就用宿主的读文件工具直接读 `<知识库根>/tutorial/04-十大核心架构模式.md` 这类路径——**正文不进命令行**，只有目录级检索和文档骨架走 CLI，这样既不浪费上下文，也能让模型看到原文。

本 skill 是**自包含**的：`lib/`（CLI 实现）与 `content/`（知识库）都与 `SKILL.md` 同目录，所以 `where` 打印的「知识库根」通常就是 `<技能目录>/content`。

拿不到路径时：`scripts/arch.mjs` 会说明缺了什么并给出修复步骤（重新完整复制目录 / `npm run skill:sync` / 软链 / `ARCH_ADVISOR_ROOT`）。按提示修，不要瞎猜路径。

## 工作流 A：从想法到可执行方案

适用于「想做一个 X」。

1. **先映射，别先给方案**

   ```bash
   node <skill>/scripts/arch.mjs ask "中小企业多租户工单 SaaS，日活 5 千，需要权限与附件"
   ```

   输出会列出最相关的教程/模板/案例，并给出 1-3 篇建议精读的目录与摘录。**基于这些内容再展开讨论**——直接凭记忆写方案，很容易给出「网上到处都有」的通用答案。

2. **分阶段推进，一次一个阶段**

   ```bash
   node <skill>/scripts/arch.mjs design clarify
   node <skill>/scripts/arch.mjs design constraints --context "已确认：多租户 SaaS，日活 5k…"
   ```

   顺序固定：`clarify → constraints → structure → decisions → roadmap → review`。每个阶段输出「目标 / 要问用户的问题清单 / 进入下一阶段的标准 / 建议阅读」。把用户已答的结论塞进 `--context` 再调下一次，否则会重复问同样的问题。

3. **精读关键篇章**

   拿到 `arch.mjs ask` 给出的条目 id 后，读原文（尤其「关键决策与权衡」「规模化死点」「常见误区」章节）：

   ```bash
   node <skill>/scripts/arch.mjs read tutorial:04          # 目录 + 开头预览
   node <skill>/scripts/arch.mjs read template:payment-system --full   # 全文
   ```

   全文可达 40KB，除非必要不要 `--full`；需要时也可以直接用读文件工具读 `content/` 下的对应 Markdown。

4. **收尾**：给出方案时，明确写清「哪会先崩、拿什么换什么、什么信号触发升级」，这是知识库反复强调的判断标准。

## 工作流 B：生成 / 重新生成文档（有硬闸门，别跳步）

用户说「生成文档 / 重新生成 / 重做 / 说明书 / 把 xx 写成文档」时，**按顺序执行，不能跳步**：

1. **第一步必须是问体系**（用宿主的提问工具，一次问两个问题）：
   - Q1「用哪套文档体系?」A 旧版 5 类（arch / prd / hld / lld / dbd，存量项目续写、沿用老模板）；B 国标版（GB/T 8567—2006 的 25 类，新项目、对外交付、评审投标）。
   - Q2「这批文档给谁看?」内部 / 客户交付 / 投标评审。

   **即使本会话之前已经生成过、也不管上一轮选了哪套，重新生成时必须重新问一遍**；只有用户在**本条消息里**明确写了「旧版 / 国标 / 25 类 / 5 类」才可跳过 Q1。在拿到答案前，不得取骨架、不得写文件。

2. **看清单并裁剪**：

   ```bash
   node <skill>/scripts/arch.mjs docs list
   ```

   让用户确认本次产出哪几份。不要默认全出（尤其是 25 类全量），也不要凭记忆自己列类型。

3. **逐份取骨架**（`--spec` 必填，不带会被拒并返回对比页）：

   ```bash
   node <skill>/scripts/arch.mjs docs SRS --spec gb
   node <skill>/scripts/arch.mjs docs 11 --spec gb          # 编号等价于简称
   node <skill>/scripts/arch.mjs docs prd --spec legacy
   ```

   传错体系会明确报错（`prd --spec gb` 会提示改用 `legacy`），照提示改，不要自己编章节。

4. **落盘**：`docs/<项目名>-<编号或简称>-<文档名>.md`，按骨架逐条填写，不适用的条目写「不适用」+ 理由。文件开头**固定**放文档控制块 + 修订记录（位置永远在正文最前面，不许挪到文末）。

5. **遵守代码策略**：每份骨架都会返回档位。禁止代码类（SSDD 概要设计、SRS、STP…）出现 ``` 代码块即判不合格；「仅伪代码」（SDD）只写 IF/THEN 式伪代码并标注「伪代码，非交付源码」；DDL 只给 DBDD；越界代码改写成文字、表格或图。

6. **升版与修订记录**：

   ```bash
   node <skill>/scripts/arch.mjs version --doc SRS --next v0.2
   ```

   只在修订记录表**追加一行**（旧行不动），更新控制块版本号；不建 `archive/` 副本——历史交给 git。同一需求牵动的多份文档各自加一行，版本叙事保持一致。

## 工作流 C：检索与定位

```bash
node <skill>/scripts/arch.mjs roadmap                      # 全库总览与学习路径
node <skill>/scripts/arch.mjs roadmap --section template   # 只看模板
node <skill>/scripts/arch.mjs search RAG --kind template    # 目录检索，拿到条目 id
```

命中为空时换更宽的关键词（如「支付」而不是「支付网关幂等对账」）；仍然为空就 `roadmap` 看全库，别声称知识库没有该主题。

## 命令速查

| 目的 | 命令 |
| --- | --- |
| 定位知识库根、看内容统计 | `arch.mjs where` |
| 总览 / 学习路径 | `arch.mjs roadmap [--section all\|tutorial\|template\|case]` |
| 目录检索 | `arch.mjs search <关键词> [--kind tutorial\|template\|case]` |
| 读条目（目录+预览） | `arch.mjs read <ref> [--lang zh\|en] [--full]` |
| 想法 → 教程/模板/案例 | `arch.mjs ask <描述> [--focus ...] [--lang zh\|en]` |
| 分阶段设计 | `arch.mjs design <step> [--context "…"]` |
| 文档清单 / 骨架 | `arch.mjs docs <list\|编号\|简称\|legacy键> [--spec legacy\|gb] [--context "…"]` |
| 文档标识与修订 | `arch.mjs version [--doc 名称] [--next v0.2]` |

所有命令都支持 `--json`：输出 `{ command, args, text }`，便于解析。退出码 `1` = 用法错误，`2` = 知识库缺失（按提示修路径）。

> 输出文本里出现的 `arch_roadmap_offline` / `arch_read_offline` / `arch_docs_offline` 等名字，是同一能力的 DSH 插件工具名；在 skill 环境里等价于上表同义的 `arch.mjs` 子命令（例如「→ arch_read_offline ref=…」就读作「`arch.mjs read ref=…`」）。别去找不存在的工具。

`ref` 写法：`tutorial:04`、`tutorial:T01`、`template:payment-system`、`case:documind-rag`；也接受 `tutorial 5`、`模板 支付` 这类宽松写法。

## 知识库布局

| 目录 | 内容 | 说明 |
| --- | --- | --- |
| `content/tutorial/` | 40 章 + T01 专题 + 术语表 + 演进触发信号 | 架构判断力的主干；01-34 与 T01 有英文版 |
| `content/templates/` | 31 个模板 + 1 个专题入口 | 每篇固定结构：解决什么问题→部件与数据流→关键决策与权衡→规模化死点→演进路线→真实产品 |
| `content/cases/` | 6 个案例 | 从 0 到上线到真实压力的完整推演 |
| `content/en/` | 英文镜像 | 同一路径去掉 `en/` 前缀即为中文版 |

读法：模板看「关键决策与权衡 + 规模化死点」，案例盯「起始架构为何合理 → 哪个量化信号逼它升级 → 新架构放弃了什么」。不背图。

## 硬规则

- **先查后答**：涉及具体系统/选型/文档时，至少过一次 `ask` 或 `search`；没有命中要说明，而不是编造出处。
- **不虚构**：知识库没覆盖就直说"知识库没覆盖，以下是通用经验"，并标明这是经验判断。
- **不联网**：本 skill 完全离线，正文里的 GitHub 链接只作为出处标注，不要去抓取。
- **不越过文档闸门**：没确认 `--spec` 就不出骨架；不落盘未经用户确认的文档类型。
- **证据优先**：给方案时给出「量化信号 + 取舍代价 + 触发升级的阈值」，比罗列技术名词有用。

## 无命令环境（宿主不能执行 shell）

降级顺序：① 用读文件工具直接读 `content/` 下的 Markdown（文件名即标题，中文名带编号前缀）；② 用 `references/catalog.md` 的目录表做定位（教程/模板/案例的 id 与路径对应）；③ 文档骨架按 `references/docs-gbt.md` 的 25 类清单与代码策略手写，章节结构照 `content/` 内对应模板，不要自由发挥。降级时仍需遵守工作流 B 的全部闸门。

## 排错

| 现象 | 处理 |
| --- | --- |
| `找不到知识库（lib/cli.js 与 content/）` | 复制不完整：`lib/` 与 `content/` 要跟 `SKILL.md` 一起复制；按 stderr 提示重新复制、`npm run skill:sync`、软链或设 `ARCH_ADVISOR_ROOT` |
| `找到了 lib/cli.js 但缺少 content/` | 同上，缺的是知识库目录；优先整目录重新复制 |
| `ARCH_ADVISOR_ROOT` 设了却仍报错 | 它要指向**含 `lib/` 与 `content/` 的目录**，不是 skill 子目录 |
| `该条目内容未包含在当前离线包中` | 上游新增内容尚未打包；改用 `search` 在目录层找相邻条目，或提示用户升级包 |
| `该条目不提供英文版` | 只有 01-34 教程、T01、全部模板/案例有英文；改 `--lang zh` |
| 检索无命中 | 换更宽关键词 / `roadmap` 看全库；实在没有就说明未覆盖 |
| 文档骨架被拒（`⛔ 未确认文档体系`） | 这是设计意图：先问用户选 A 旧版还是 B 国标，再带 `--spec` 重调 |

## 延伸参考

- `references/catalog.md`：40 篇教程 + 31 模板 + 6 案例的完整目录（id / 中英标题 / 路径 / 模板分组），用于精确定位与"该读哪篇"的判断。
- `references/docs-gbt.md`：GB/T 8567—2006 的 25 类文档（编号 / 简称 / 阶段 / 代码策略）+ 裁剪建议 + 与旧版 5 类的映射。
- `references/workflows.md`：两条触发规则的完整原文（文档体系 Q1/Q2、五步落盘流程、六阶段设计的问题清单与完成标准），当 SKILL.md 的摘要不够用时再读。

> 内容快照：awesome-architecture `96226d2`（2026-09-21，MIT）。上游更新后需升级本 skill 才能拿到新内容。
