# System Prompt Architecture Template

> **Representative products / prototypes**: Claude Fable 5 (claude.ai) — with cross-references to ChatGPT GPT-5.5, Gemini 3.1 Pro, Grok 4.2, Cursor, and OpenAI Codex
> **One-line positioning**: A layered "Agent OS" that wraps the same base LLM into different product shapes — using modular scopes, decision-tree routing, externalized Skills, and runtime injection to unify values, memory, tools, compliance, and output form.

---

## 1. One-line positioning

System prompt architecture = **a layered operating system for large language models**: not a single persona paragraph, but a stack of constitution, memory, execution environment, retrieval/compliance, tool registry, and runtime configuration so every turn **routes in a fixed priority order** — safety and compliance first, then personalization, then output form, then tools, and only then user-facing text.

Claude Fable 5 is the most fully documented public specimen (~3,800 lines, six XML layers). ChatGPT, Gemini, Grok, Cursor, and Codex solve the same class of problems with different module boundaries and trade-offs.

## 2. Business essence: what problem it solves

The same base model must serve general chat, web retrieval, file production, coding agents, multi-tenant personalization, and compliance audits. A "friendly persona" alone leads to:

- **Value drift**: inconsistent safety boundaries across sessions and entry points.
- **Capability chaos**: search when you shouldn't, inline when you should ship a file, web when internal tools suffice.
- **Compliance exposure**: verbatim quotes, child safety, mechanism leakage — all left to model "good behavior."
- **No evolution path**: every new tool or Skill bloats an unmaintainable monolith.

System prompt architecture eliminates **"the model doesn't know which environment it's in, which priorities apply, or which route to take."** Its value is not lyrical copy but **predictable, auditable, extensible** product behavior — aligned with the [AI chat product](../ai-chat-product/README.md) stack (context + tools + compliance), but finer-grained: the prompt *is* part of the product architecture.

**Division of labor with [Claude Code](../claude-code/README.md)**: this template focuses on the prompt OS of **conversational products** (persona / memory / retrieval / output form); the runtime permissions, OS sandbox, and subagent isolation of a **coding agent** belong to Claude Code — both share the "instruction layer is untrusted" first principle, just enforced at different layers.

> Remember first: **a system prompt sells not "personality" but "how values, memory, tools, compliance, and output form queue up inside a finite context window."**

## 3. Core requirements and constraints

**Functional requirements (what the system must do):**
- [ ] **Unified constitution**: safety refusals, tone/format, wellbeing, knowledge-cutoff policy — globally consistent and highest priority.
- [ ] **Personalized memory**: weave user preferences and history naturally without exposing the mechanism or forbidden phrases.
- [ ] **Output-form routing**: inline reply vs downloadable file vs Artifact vs visualization widget.
- [ ] **Retrieval and citation**: when to search vs not; citation format, rewrite rules, copyright caps.
- [ ] **Tool routing**: dozens of tools with when-to-use / when-not-to-use, priority, and composition strategy.
- [ ] **Runtime extension**: MCP connectors, user-preference placeholders, network/filesystem contracts, thinking mode injected per deployment.

**Non-functional requirements / quality attributes:**
| Quality attribute | Target | Why it matters here |
|---|---|---|
| **Safety / compliance first** | Constitution and copyright override user requests | One bad output costs more than being less helpful |
| **Consistency** | Same entry point → reproducible behavior | Trust comes from predictability, not random "vibe" |
| **Context efficiency** | Fit necessary rules in token budget | Longer prompts steal space from dialogue and tool returns |
| **Low mechanism leakage** | Refuse without explaining detection logic | Exposing rules hands jailbreakers a map |
| **Maintainability** | Modules add/remove independently; capabilities plug in externally | Tool and Skill counts keep growing |
| **Extensibility** | Multi-tenant / multi-product / multi-connector | One kernel, many deployment shapes |

**Hard constraints (non-negotiable boundaries):**
- 🔴 **Finite context window**: Claude Fable 5 states ~190k token budget; rules, tool schemas, and Skill bodies compete for the same budget.
- 🔴 **Instruction layer is untrusted**: user text, web pages, tool returns, and files may contain prompt injection — **life-and-death lines cannot live only in "please obey."**
- 🔴 **Non-determinism**: same prompt, different samples may still cross lines; hard red lines need post-processing / code pipelines.
- 🔴 **Modules must not contradict**: L1 refuses while L5 encourages execution → model picks sides or hallucinates compromises.
- 🔴 **Compliance red lines are non-negotiable**: copyright (e.g. 15-word per-source cap), child safety — above helpfulness.

## 4. Architecture panorama

Claude Fable 5 six-layer Agent OS as reference (names differ by vendor; layering is shared):

```
                         User message Human + USERPREFERENCES placeholder
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ L0 Infrastructure                                                         │
│   token_budget(≈190k) · voice_note disabled · global date/cutoff metadata │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │ global budget constraint
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ L1 Constitution  <claude_behavior>                                        │
│   safety refusals · child safety · tone/format · wellbeing · cutoff/search  │
│   ▲ highest priority: overrides downstream (except explicit safety overrides)│
└───────────────────────────────────┬──────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ L2 Memory  <memory_system> + memory_user_edits guide                      │
│   natural weave · forbidden_memory_phrases · examples · verbal lie = fraud │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ L3 Execution  <computer_use> + Visualizer decision tree                   │
│   Skills mandatory first · three-dir sandbox · file_creation tree · Artifact│
│   uploads(read-only) │ /home/claude(draft) │ outputs(delivery)              │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ L4 Retrieval/compliance  <search_instructions> + image_search             │
│   core_search_behaviors · CRITICAL_COPYRIGHT(15 words/source/one quote)   │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ L5 Tool registry  ## tool_name × ~27                                      │
│   JSONSchema + when/when-not · tool_search · internal > web > compose     │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ L6 Runtime deployment  citation · MCP JSON · network/fs · thinking_mode     │
│   <available_skills> summary · user prefs after Human:                    │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    ▼
                          compliant output / tool calls / file delivery
```

> Two souls here. **Top-down priority chain**: L1 constitution > L4 copyright/harmful content > ordinary reply habits. **Decision-tree routing**: file vs inline, search vs not, Visualizer steps 0–3 — collapse fuzzy intent into executable branches instead of free-form improvisation.

## 5. Component responsibilities

- **L0 Infrastructure**: token budget, disabled blocks (e.g. voice_note), global date and knowledge cutoff. *Why*: all downstream modules share one resource ceiling.
- **L1 Constitution `<claude_behavior>`**: product values — refusals, child safety, tone/lists, wellbeing, legal/financial disclaimers, balanced political framing, cutoff and mandatory search triggers. *Why*: without a single constitution, every feature module interprets boundaries differently.
- **L2 Memory `<memory_system>`**: how memory weaves in, forbidden phrases, memory-edit tool rules including "claiming you edited verbally = lying." *Why*: personalization drives retention; exposing mechanism breaks trust.
- **L3 Execution `<computer_use>`**: mandatory Skill scan, file-creation tree, three-directory sandbox, Artifact thresholds, Visualizer four-step routing (MCP / file / inline SVG). *Why*: "can write code" ≠ "what shape to deliver"; environment contract aligns model with real sandbox.
- **L4 Retrieval/compliance `<search_instructions>`**: search vs not, simple fact vs deep research, image-search blocklists, three copyright hard limits and pre-response self-check. *Why*: bad retrieval → confabulation; copyright violations are legal risk.
- **L5 Tool registry**: JSONSchema per tool plus boundaries; lazy-load strategy; priority (internal Drive/Slack > web_search/web_fetch). *Why*: at scale, full inline schemas are infeasible — separate registry from routing table.
- **L6 Runtime deployment**: citation format, MCP connector list, network/filesystem read-only mounts, thinking_mode, USERPREFERENCES after `Human:`, `<available_skills>` summary. *Why*: multi-tenant differences should not fork the whole constitution.

## 6. Key data flows

**Scenario 1: one user message through six layers**
```
User: "Short essay on fisheries policy citing recent reports"
  L1: pass (not refusal class) · check if topic needs search post-cutoff
  L2: weave writing-style prefs if any · never say "according to my memory"
  L3: short essay, conversational → file_creation tree → inline, not standalone file
  L4: current events → core_search_behaviors → web_search
  L5: no internal tool → web_search → maybe web_fetch one article
  L4 post-check: rewrite claims · ≤15 words per source · one quote per source · 6-question self-check
  L6: cite tags · user preference placeholder injected
  → prose essay + compliant paraphrased attribution
```

**Scenario 2: `file_creation` decision tree**
```
User: "2000-word blog post for Medium"
  → standalone deliverable → create file (.md default; docx only if explicit)
  → Skills: if docx → must view /mnt/skills/public/docx/SKILL.md first
  → draft in /home/claude → copy to /mnt/user-data/outputs
User: "Market strategy ideas for product X"
  → conversational → inline prose, no file
```

**Scenario 3: tool priority arbitration**
```
User: "Summarize last week's Drive notes and post to Slack"
  ① internal connectors first (Drive search → read)
  ② avoid web_search unless needed
  ③ compose: read → summarize → Slack send
  ④ each step under L1 permissions and L4 copyright (third-party text still paraphrased)
```

## 7. Data model and storage strategy

No traditional database — **where information lives in context** is the architecture:

| Information | Placement | Why |
|---|---|---|
| Constitution / safety / copyright | **Always resident**, highest-priority blocks | Must be visible every turn |
| Memory rules + forbidden phrases | **Resident**, adjacent to L1 | Core UX + privacy narrative |
| Tool JSONSchemas (~27) | **Resident or lazy-loaded** | Full inline burns tokens; tool_search on demand |
| Skill bodies | **External files**, summary resident | `/mnt/skills/public/*/SKILL.md` viewed when needed |
| MCP connectors | **Runtime JSON injection** | Multi-tenant; not baked into constitution |
| User preferences | **Placeholder after `Human:`** | Per-user at deploy time |
| Uploads | **Sandbox read-only mount** | `/mnt/user-data/uploads`, isolated from draft/delivery |
| Cutoff / current date | **L0 metadata + L1 references** | Drives search decision tree |

Conceptually: **hot resident rules**, **warm lazy capabilities**, **cold runtime injection** per session/tenant.

## 8. Key architectural decisions and trade-offs ⭐

Deep sample: Claude Fable 5. Cross-vendor forks:

**Decision 1: module boundaries — XML scopes vs Markdown sections vs engineering blocks**
- A: **XML namespaces** (Claude Fable 5), clear boundaries, grep-friendly; heavier for humans.
- B: **Markdown headings** (GPT-5.5 `# Environment`, `# Artifacts`), readable; merge conflicts, softer scope.
- C: **Productized blocks** (Cursor `<tone_and_style>`, `<tool_calling>`), great for coding; different shape for general chat.
- **Typical choice**: A or B for chat products; C for coding agents. **Boundaries matter more than syntax.**

**Decision 2: inline capabilities vs externalized Skills**
- A: **everything in system prompt** — simple, token-heavy.
- B: **summary + external SKILL.md** (Claude `/mnt/skills/...`, GPT `/home/oai/skills/...`) — lazy load, version independently; mandatory `view` step.
- **Typical choice**: B at maturity; inline only for MVP with ≤2 capability domains.

**Decision 3: compliance placement — prompt-only vs hard pipeline**
- A: **MUST NOT in prompt** — fast, model may still slip.
- B: **prompt + post-processing** (word counts, classifiers, cite validation) — auditable; engineering cost.
- **Typical choice**: B for copyright 15-word rules, child safety, mechanism leakage; A for tone preferences.

**Decision 4: memory injection**
- A: **natural weave + forbidden phrases** (Claude `memory_system`).
- B: **explicit memory tools** (GPT bio/advanced memory) — auditable writes; more mechanical UX.
- **Typical choice**: A for consumer chat; A+B for enterprise audit needs.

**Decision 5: tool discovery — full inline vs lazy load**
- A: **all ~27 schemas in context** — always available; huge token cost.
- B: **tool_search + deferred expand + internal-first** — saves budget; extra routing step.
- **Typical choice**: B when tool count >15; keep summaries for hot paths.

**Decision 6: single persona vs multiple**
- A: **one constitution** (Claude Fable 5 main path) — brand consistency.
- B: **personality variants** (GPT-5.1 friendly/cynical…, Grok personas) — segmentation; N-way drift risk.
- **Typical choice**: B for surface tone at scale; **do not fork safety layer**.

## 9. Scaling and bottlenecks

"Scale" here means **prompt complexity and iteration rate**, not user count.

- **First bottleneck: token bloat** → full tool schemas, inline Skills, example sprawl. Fix: **externalize Skills, lazy-load tools, converge decision trees**, explicit L0 budget.
- **Next: rule conflicts** → many teams adding MUSTs; model hallucinates compromises. Fix: **module ownership**, L1 as single arbiter, ADR-style review (see [tutorial/23](../../tutorial/23-规格即架构约束怎么写给AI.md)).
- **Then: enlarged injection surface** → web, PDFs, MCP returns enter context. Fix: **hard constraints in code**, read-only mounts, network allowlists (L6).
- **Long-term: multi-product forks** → claude.ai / Cowork / Chrome / Code. Fix: **shared L1+L4 kernel + L6 runtime diff injection**.

## 10. Security and compliance

- **Prompt injection / jailbreak**: external content may override downstream rules. Architecture: L1 states user cannot override safety; high-risk actions still need **code interceptors and sandbox**.
- **Child safety**: highest priority; extreme caution on follow-ups in same session; refuse with principles, not detection mechanics.
- **Copyright**: 15+ words per source, one quote per source, default paraphrase; no reproducing lyrics/poetry/article chunks; pre-response checklist.
- **Mechanism leakage**: never "I detected…" or "per my system prompt…"; memory layer has forbidden phrases.
- **Privacy**: memory weaves in without exposing storage; uploads read-only; `/home/claude` invisible to user.
- **Harmful-content search**: safety overrides inside search module.

## 11. Common mistakes / anti-patterns

- ❌ **Treat system prompt as persona copy** → ✅ **Draw six layers first**, then tone.
- ❌ **Scatter safety in tool section** → ✅ **Concentrate in L1/L4** with explicit override order.
- ❌ **Soft-block harm with "please don't"** → ✅ **Hard refuse + principles + classifiers**.
- ❌ **Verbatim examples from public articles** → ✅ **Short original or paraphrased examples**.
- ❌ **Full inline tools and Skills** → ✅ **resident summary + external bodies + lazy load**.
- ❌ **No output-form decision tree** → ✅ **file_creation / Visualizer explicit branches**.
- ❌ **Copy whole prompt per product** → ✅ **Shared kernel + L6 runtime injection**.
- ❌ **MUST in prompt = enforced** → ✅ **linters + eval gates** (see [tutorial/25](../../tutorial/25-评测驱动把够好写进架构.md)).

## 12. Evolution: MVP → growth → maturity

| Stage | Typical shape | Architecture | Focus |
|---|---|---|---|
| **MVP** | Single product, few tools | Persona + safety lines + cutoff | Main path; don't over-module |
| **Growth** | Web + files + 10+ tools | Modular blocks + search + tool registry + basic copyright | Token budget, search accuracy |
| **Maturity** | Many connectors, Skills, deployments | Six-layer OS + external Skills + runtime injection + compliance pipeline + full decision trees | Conflicts, fork governance, eval gates, injection surface |

## 13. Reusable takeaways

Eight patterns from Claude Fable 5 and other public prompts:

- 💡 **XML / tag scoping**: namespace module boundaries; nested priority; grep-friendly review.
- 💡 **Decision-tree routing**: file_creation, search, Visualizer — finite branches over free improvisation.
- 💡 **Externalized Skills**: bodies on filesystem; prompt keeps summary + mandatory pre-read.
- 💡 **Three-directory sandbox**: uploads (read input) / workspace (draft) / outputs (delivery).
- 💡 **Hard compliance blocks**: e.g. `<CRITICAL_COPYRIGHT_COMPLIANCE>` + self-check lists.
- 💡 **Positive/negative examples**: memory forbidden phrases, copyright good/bad — harder to misread than abstract MUST.
- 💡 **Lazy loading**: tool schemas, MCP, Skill bodies on demand; resident index only.
- 💡 **Runtime injection placeholders**: USERPREFERENCES after `Human:`, MCP JSON, network/fs — multi-tenant without forking constitution.

## 🎯 Quick Quiz

<Quiz
  question="Why can't copyright caps (15 words per source) or child-safety red lines rely on a single MUST NOT in the system prompt?"
  :options="['Because a long prompt exceeds the token budget', 'Because the model is non-deterministic and the instruction layer can be bypassed by prompt injection, so hard red lines need post-processing / code pipelines as a backstop', 'Because MUST NOT sounds impolite']"
  :answer="1"
  explanation="A system prompt is a soft constraint: the same MUST may still be crossed under different sampling, and external content can inject to induce violations. Real red lines (copyright word counts, child safety, mechanism leakage) must drop below the prompt into post-processing / classifiers / validation — the same way Claude Code pushes safety down to deny rules + sandbox. That is the 'instruction layer is untrusted' first principle of the whole piece."
/>

---

## 14. Reference prototypes and further reading

> Based on publicly collected system prompts and architectural analysis for **teaching**: capture shared "layered Agent OS" patterns — **not** any company's internal blueprint or full prompt reproduction.

**🔧 Public prompt corpus (structural comparison):**
- [asgeirtj/system_prompts_leaks](https://github.com/asgeirtj/system_prompts_leaks) — 250+ public system prompts across Anthropic, OpenAI, Google, xAI, Cursor, Microsoft, etc.
- [Anthropic/claude-fable-5.md](https://github.com/asgeirtj/system_prompts_leaks/blob/main/Anthropic/claude-fable-5.md) — six-layer Agent OS primary specimen.
- [OpenAI/gpt-5.5-thinking.md](https://github.com/asgeirtj/system_prompts_leaks/blob/main/OpenAI/gpt-5.5-thinking.md) — Markdown layering + Skills paths + Writing Blocks.
- [Google/gemini-3.1-pro.md](https://github.com/asgeirtj/system_prompts_leaks/blob/main/Google/gemini-3.1-pro.md) — Google chat product structure reference.
- [xAI/grok-4.2.md](https://github.com/asgeirtj/system_prompts_leaks/blob/main/xAI/grok-4.2.md) · [grok-personas.md](https://github.com/asgeirtj/system_prompts_leaks/blob/main/xAI/grok-personas.md) — multi-persona variant architecture.
- [Cursor/cursor.md](https://github.com/asgeirtj/system_prompts_leaks/blob/main/Cursor/cursor.md) — engineering instruction blocks for coding agents.
- [OpenAI/Codex/gpt-5.5.md](https://github.com/asgeirtj/system_prompts_leaks/blob/main/OpenAI/Codex/gpt-5.5.md) — Codex prompt sample vs [Claude Code](../claude-code/README.md).

**📖 Engineering docs / related templates in this repo:**
- [Claude Code architecture template](../claude-code/README.md) — permissions, sandbox, Skills on the coding-agent side.
- [AI chat product template](../ai-chat-product/README.md) — inference, streaming, context, RAG at product layer.
- [AI Agent platform template](../ai-agent-platform/README.md) — action loop, tool sandbox, memory as product.
- [Tutorial 17 · Architecting in the age of LLMs](../../tutorial/17-大模型时代的架构判断.md) — vibe coding, non-determinism, context engineering; the most direct upstream theory for this template.
- [Tutorial 22 · AI-native system design](../../tutorial/22-AI原生系统设计.md) — the three new constraints when upgrading a chat product into an autonomous agent; echoes L3–L6 here.
- [Tutorial 23 · Spec as architecture](../../tutorial/23-规格即架构约束怎么写给AI.md) — writing ADR-style constraints for agents.
- [Anthropic Prompt engineering overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) — official prompt engineering overview.

---

> 📌 One sentence: **system prompt architecture is not "writing personality" but installing a layered OS for the model — constitution holds the floor, memory and runtime injection hold differentiation, decision trees hold routing, external Skills and lazy loading hold scale, compliance blocks and post-processing hold red lines; Claude Fable 5 is the finest public map of that OS, meant to be read as architecture, not copied as copy.**
