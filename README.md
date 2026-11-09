# dsh-arch-advisor-offline · DSH 离线架构顾问插件 · 标准 Agent Skill

[English](#english) · 中文

## 一句话说明

**一份知识库，两种形态。** 把开源知识库
[awesome-architecture](https://github.com/study8677/awesome-architecture)
（40 篇教程 + T01 基础模型训练决策专题、31 个模板、6 个案例，中英全量）**打包进包本体**，
运行时**零网络依赖**——适合完全断网或只信任固定内容快照的环境。

- **形态 A｜DSH 插件**：工具名带 **`_offline`** 后缀（如 `arch_read_offline`），可与在线版 `dsh-arch-advisor` **同时安装**，互不冲突。
- **形态 B｜Agent Skill**（v0.4.0 新增）：`skill/dsh-arch-advisor-offline/SKILL.md`，目录**自包含** `lib/` 与 `content/`，复制进宿主技能目录即可用（Claude Code、CodeBuddy 等），能力与插件同源。
- 内容与上游同步于打包时的版本；上游更新后需更新本包获取新内容。
- 数据来源：[awesome-architecture](https://github.com/study8677/awesome-architecture)（MIT）。本包不包含/改写其内容，仅打包分发。

## 适配的 DSH 版本

| 项 | 版本 | 说明                    |
| --- | --- |-----------------------|
| **DeepSeek Harness** | **0.2.1-rc.5** | 本版（0.4.0）实际验证的宿主版本    |
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
| `arch_docs_offline` | **双体系文档骨架**：旧版 5 类 + 国标 25 类（`docType="list"` 看两套对比） |
| `arch_version_offline` | 文档标识与修订记录规范（不建 `archive/` 副本） |

## 文档能力：两套体系并存（v0.3.3）

生成文档前**先让用户选体系**，两套都保留：

| | A 旧版 5 类 | B 国标版 25 类 |
|---|---|---|
| 文档 | arch 架构方案 / prd 需求 / hld 概要设计 / lld 详细设计 / dbd 数据库设计 | GB/T 8567—2006 第 7 章的 25 类（FAR…CPM） |
| 章节来源 | 早期实践样例，非标准 | 国标，已逐条核对 |
| 代码约束 | 无 | 有（8 档代码策略） |
| 适用 | 续写存量项目、沿用老模板 | 新项目、对外交付、评审/投标 |
| 取值 | `arch` `prd` `hld` `lld` `dbd` | `1`~`25` 或 `FAR`…`CPM` |

- 先看对比：`arch_docs_offline(docType="list")`
- 旧版：`docType="prd", spec="legacy"` → 返回旧版 PRD 骨架（抬头标注"非国标"，并给出对应的国标文档）
- 国标：`docType="SRS", spec="gb"` 或 `docType="11", spec="gb"`
- **`spec` 必填**（硬闸门）：不带 `spec` 取骨架会被拒绝并返回两套对比页，强制先确认体系
- 传错体系会明确报错：`docType="prd", spec="gb"` → 提示改用 `spec="legacy"`

**代码策略**（仅国标版有约束，解决"概要设计里塞代码"）：

| 档位 | 谁能用 |
|---|---|
| 禁止代码 | FAR、SDP、STP、STrP、OCD、SSS、IRS、**SSDD（概要设计）**、SRS、DRD、STR、SCMP、SQAP、DPMR、PDSR、SVD |
| 仅命令 | SIP、SUM、COM |
| 仅签名 | IDD |
| 仅伪代码 | **SDD（软件结构设计）**，且必须标注"伪代码，非交付源码" |
| 允许 DDL | DBDD |
| 仅测试数据 | STD |
| 允许片段 / 只引用 | CPM / SPS |

**修订记录固定放文档头部**（紧跟一级标题），两套体系一致；升版只在修订记录表追加一行。`archive/` 快照机制已移除——历史版本交给 git。

## 安装

```sh
# GitHub 直装
dsh plugin --profile web add github:LeeGuanWei-a/dsh-arch-advisor-offline

# 或发布 npm 后
dsh plugin --profile web add dsh-arch-advisor-offline
```

重启后开新会话即可用（无网络也可）。

## 作为 Agent Skill 使用（v0.4.0 新增）

DSH 之外的宿主（Claude Code、CodeBuddy、其他支持 Agent Skills 的客户端）走 skill 入口：
`skill/dsh-arch-advisor-offline/`，内含 `SKILL.md`、`scripts/arch.mjs`、`references/`，以及**自包含的** `lib/`（CLI 实现）与 `content/`（知识库，163 篇 md，约 3.5MB）。

### 安装：复制 skill 目录即可（v0.4.0 起自包含）

`skill/dsh-arch-advisor-offline/` **自带** `lib/`（CLI 实现）与 `content/`（知识库），整目录复制进宿主技能目录就能用，不再依赖包根：

| 宿主 | 技能目录 |
| --- | --- |
| Claude Code | `~/.claude/skills/` |
| CodeBuddy | `~/.codebuddy/skills/` |
| 其他 | 按该宿主的 skill 目录约定 |

```sh
# macOS / Linux
cp -r skill/dsh-arch-advisor-offline ~/.claude/skills/
# Windows
xcopy /E /I /Q skill\dsh-arch-advisor-offline "%USERPROFILE%\.claude\skills\dsh-arch-advisor-offline"
```

如果喜欢「升级自动生效」，也可以软链（Windows 目录联接无需管理员）：

```bat
mklink /J "%USERPROFILE%\.claude\skills\dsh-arch-advisor-offline" "D:\path\to\dsh-arch-advisor-offline\skill\dsh-arch-advisor-offline"
```

```sh
ln -s /path/to/dsh-arch-advisor-offline/skill/dsh-arch-advisor-offline ~/.claude/skills/dsh-arch-advisor-offline
```

非常规位置可用环境变量兜底：`ARCH_ADVISOR_ROOT=/path/to/dsh-arch-advisor-offline`（指向含 `lib/` 与 `content/` 的目录）。

路径解析顺序：`ARCH_ADVISOR_ROOT` → **skill 目录内的自包含副本** → 从脚本位置向上找 `lib/cli.js`（仓库内/软链命中）→ npm 模块解析。全部失败时 CLI 打印修复步骤并以退出码 2 结束，不会静默返回空结果。

> 维护者注意：`skill/.../lib` 与 `skill/.../content` 是包根同名目录的**副本**（由 `scripts/build-skill.mjs` 生成，源仍只有一份）。改完 `lib/` 或更新 `content/` 后执行 `npm run skill:sync`；`npm run smoke` 会逐字节校验副本与源是否一致，`npm pack` 前的 `prepack` 也会自动同步。体积代价：包内两份内容，解包约 7MB（每份约 3.5MB）。

### 验证

```sh
node <技能目录>/scripts/arch.mjs where      # 打印知识库根、包根、163 篇 md 的统计
node <技能目录>/scripts/arch.mjs search 支付系统
```

`where` 能打印出「知识库根」就说明路径通了。

### skill 侧命令（与 7 个工具同源）

| 命令 | 作用 | 对应 DSH 工具 |
| --- | --- | --- |
| `arch.mjs where` | 打印知识库根与内容统计 | —（skill 专用） |
| `arch.mjs roadmap` | 知识库总览与学习路径 | `arch_roadmap_offline` |
| `arch.mjs search <关键词>` | 目录检索，返回条目 id | `arch_search_offline` |
| `arch.mjs read <ref>` | 读条目（目录+预览；`--full` 全文） | `arch_read_offline` |
| `arch.mjs ask <描述>` | 想法 → 教程+模板+案例映射 | `arch_ask_offline` |
| `arch.mjs design <step>` | 六阶段引导式设计 | `arch_design_offline` |
| `arch.mjs docs <docType>` | 文档清单/骨架（`--spec` 必填） | `arch_docs_offline` |
| `arch.mjs version` | 文档标识与修订记录规范 | `arch_version_offline` |

全部命令支持 `--json`（输出 `{ command, args, text }`）；退出码 `1` = 用法错误，`2` = 知识库缺失。正文阅读走宿主的读文件工具直接读 `content/` 下的 md，只有检索与文档骨架走命令行——省上下文，也不丢原文。

### 双形态对照

| | 形态 A：DSH 插件 | 形态 B：Agent Skill |
| --- | --- | --- |
| 入口 | `lib/index.js` + `cordis.patch.yml` | `skill/dsh-arch-advisor-offline/SKILL.md` |
| 宿主 | DeepSeek Harness | Claude Code / CodeBuddy 等 |
| 能力暴露 | 7 个工具 + 2 段系统提示（自动触发） | SKILL.md 工作流 + 命令行 |
| 安装 | `dsh plugin add` | 复制 skill 目录 / 软链 / `ARCH_ADVISOR_ROOT` |
| 额外依赖 | `@deepseek-ai/dsh-tools` | 仅 Node ≥ 18.17 |
| 数据源 | 包根 `content/` + `lib/` | skill 内副本（`npm run skill:sync` 生成，与源逐字节一致） |

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
# 插件形态
dsh plugin --profile web list        # 应看到 dsh-arch-advisor-offline
# 断网状态下问：帮我设计一个电商秒杀系统 → arch_ask_offline 应能正常返回

# skill 形态
node skill/dsh-arch-advisor-offline/scripts/arch.mjs where
node skill/dsh-arch-advisor-offline/scripts/arch.mjs search 支付系统

# 能力回归（18 项断言，含 skill 自包含副本漂移校验；装了 dsh-tools 时额外校验 7 工具 + 2 段 section）
node scripts/smoke.mjs
```

## 与在线版的取舍

| | 在线版 dsh-arch-advisor | 离线版（本插件） |
|---|---|---|
| 内容 | 运行时拉取，永远最新 | 打包内置，固定快照 |
| 网络 | 必须能访问 GitHub | 完全不需要 |
| 包体积 | ~KB | ~7MB（包根 + skill 自包含副本各一份内容） |
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
②「生成文档 / 说明书 / 把 xx 写成文档」→ 先问用旧版 5 类还是国标 25 类，再 `arch_docs_offline(docType="list")` 看对比、逐份取骨架；版本与修订记录用 `arch_version_offline`。
若仍不触发，依次检查：插件在当前 profile 是否已加载（改代码/升级后需重载或重启 DSH）、当前模型的工具调用倾向（可换更稳的模型或提高 reasoning effort）、该会话是否真的装了本插件（`web`/`desktop` profile 各自独立）。

**Q：同一个包既是插件又是 skill，会不会变两份逻辑？**
A：不会。7 个能力只在 `lib/core.js` 实现一次，插件层（`lib/index.js`）与命令行层（`lib/cli.js`）都调它，skill 的 `scripts/arch.mjs` 只是把参数透传给 CLI。改一处，三种入口同时生效。

**Q：skill 报「找不到知识库（lib/cli.js 与 content/）」怎么办？**
A：说明复制不完整——skill 是自包含的，`lib/` 与 `content/` 必须跟 `SKILL.md` 一起复制（常见于只挑了顶层文件、或用工具跳过子目录）。按 stderr 提示任选：① 重新复制整个 `skill/dsh-arch-advisor-offline/` 目录（约 3.5MB）；② 在包根跑 `npm run skill:sync` 重新生成副本再复制；③ 改用软链/目录联接；④ 设 `ARCH_ADVISOR_ROOT` 指向含 `lib/` 与 `content/` 的包根。

**Q：skill 形态还需要 DSH 吗？**
A：不需要。skill 只需要 Node ≥ 18.17；宿主不允许执行命令时，SKILL.md 里有降级方案（直接读 `content/` 下的 md + `references/` 的目录与文档清单）。

---

## English

**One knowledge base, two shapes.** The awesome-architecture knowledge base
(tutorials/templates/cases, zh+en) is **bundled into the package** — zero network access
at runtime.

- **Shape A — DSH plugin** (sister of `dsh-arch-advisor`): tool names carry an `_offline`
  suffix so it can be installed alongside the online version without conflicts.
- **Shape B — Agent Skill** (new in v0.4.0): `skill/dsh-arch-advisor-offline/SKILL.md` is a
  standard Agent Skills entry (name/description frontmatter + `scripts/` + `references/`),
  usable from Claude Code, CodeBuddy and any skill-aware host. Both shapes share
  `lib/core.js`, so results are identical.

**Requirements**: DeepSeek Harness **0.2.1-rc.5** or later (verified with cordis 4.0.5
and dsh-tools 0.2.1-rc.5). Declared via `engines.dsh: ">=0.2.1-rc.5"` and peer ranges
`@deepseek-ai/cordis ~4.0.5` / `@deepseek-ai/dsh-tools >=0.2.1-rc.5`.

**Documents (v0.3.3)**: `arch_docs_offline` now returns skeletons for the **25 document
types of GB/T 8567—2006**, each with a hard code policy (SSDD/SRS = no code; SDD =
pseudocode only; DBDD = DDL; CPM = snippets; SPS = by reference). `arch_version_offline`
maintains the document-control block and revision table at the top of each file — no
`archive/` snapshots, history lives in git.

**Install as a DSH plugin**:

```sh
dsh plugin --profile web add github:LeeGuanWei-a/dsh-arch-advisor-offline
```

**Install as an Agent Skill** — the skill directory is **self-contained** (its own
`lib/` and `content/`), so copying the directory is enough:

```sh
# macOS / Linux
cp -r skill/dsh-arch-advisor-offline ~/.claude/skills/

# Windows
xcopy /E /I /Q skill\dsh-arch-advisor-offline "%USERPROFILE%\.claude\skills\dsh-arch-advisor-offline"
```

Symlinking works too and picks up package upgrades automatically:

```sh
ln -s /path/to/dsh-arch-advisor-offline/skill/dsh-arch-advisor-offline ~/.claude/skills/dsh-arch-advisor-offline
mklink /J "%USERPROFILE%\.claude\skills\dsh-arch-advisor-offline" "D:\path\to\dsh-arch-advisor-offline\skill\dsh-arch-advisor-offline"
```

`ARCH_ADVISOR_ROOT` still works as a fallback. Maintainers: `skill/.../lib` and
`skill/.../content` are generated copies — run `npm run skill:sync` after changing the
package's `lib/` or `content/`; `npm run smoke` fails on any drift. Verify with:

```sh
node <skill-dir>/scripts/arch.mjs where     # prints the knowledge-base root + 163 markdown files
```

Skill commands (`where / roadmap / search / read / ask / design / docs / version`) mirror the
7 DSH tools one-to-one; `--json` is supported, exit code `1` = usage error, `2` = knowledge
base missing. Content freezes at pack time; update the package to refresh (upstream refreshes ~weekly).

Data source: [awesome-architecture](https://github.com/study8677/awesome-architecture) (MIT).
