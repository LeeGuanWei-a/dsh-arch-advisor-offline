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

## 7 个工具（全部 _offline 后缀）

| 工具 | 作用 |
|---|---|
| `arch_roadmap_offline` | 知识库总览与学习路径 |
| `arch_search_offline` | 目录关键词检索 |
| `arch_read_offline` | 读某篇正文（目录+预览/full/zh·en） |
| `arch_ask_offline` | 想法 → 映射到相关 教程+模板+案例 |
| `arch_design_offline` | 分步引导式架构设计 |
| `arch_docs_offline` | 开发文档规范（arch/prd/hld/lld/dbd） |
| `arch_version_offline` | 文档版本管理规范 |

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
A：cordis 4 体系即可，安装时 peer 校验自动拦截过旧 host。

**Q：为什么说"想一个方案"时，它有时不调用工具？**
A：工具是否被调用最终由模型决定；插件能控制的只有两件事——注册工具、往系统提示注入触发规则。本插件注入了两条规则：
①「想做一个 X / 帮我想个方案 / 设计一个系统 / 从想法起步」→ 先 `arch_ask_offline` 映射知识库，再按需 `arch_design_offline` 分阶段推进；
②「生成文档 / 说明书 / 把 xx 写成文档」→ `arch_docs_offline` 取章节骨架 + `arch_version_offline` 建版本档案。
若仍不触发，依次检查：插件在当前 profile 是否已加载（改代码/升级后需重载或重启 DSH）、当前模型的工具调用倾向（可换更稳的模型或提高 reasoning effort）、该会话是否真的装了本插件（`web`/`desktop` profile 各自独立）。

---

## English

**Fully-offline sister plugin of `dsh-arch-advisor`.** The awesome-architecture
knowledge base (tutorials/templates/cases, zh+en) is **bundled into the package** —
zero network access at runtime. Tool names carry an `_offline` suffix so it can be
installed alongside the online version without conflicts.

**Install**:

```sh
dsh plugin --profile web add github:LeeGuanWei-a/dsh-arch-advisor-offline
```

Content freezes at pack time; update the plugin to refresh (upstream refreshes ~weekly).

Data source: [awesome-architecture](https://github.com/study8677/awesome-architecture) (MIT).
