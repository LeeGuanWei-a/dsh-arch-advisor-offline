// dsh-arch-advisor-offline — DeepSeek Harness persistent plugin (fully offline).
// Registers 7 model tools with _offline suffix: arch_roadmap_offline / arch_search_offline /
// arch_read_offline / arch_ask_offline / arch_design_offline + arch_docs_offline / arch_version_offline.
// Knowledge content is bundled locally under ./content — zero network access.
import { defineTool } from '@deepseek-ai/dsh-tools';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TUT, TUT_EN, TPL, TPL_GROUP, CAS } from './catalog.js';

const HERE = dirname(fileURLToPath(import.meta.url)); // .../lib
const CONTENT_DIR = join(HERE, '..', 'content');      // .../content
// 出处链接（离线版仅作标注，不联网访问）
const SRC_REPO = 'https://github.com/study8677/awesome-architecture';

export const name = 'dsh-arch-advisor-offline';

// 离线版不依赖 web；tools/systemPrompt 为硬依赖（标准 Cordis 语义）。
export const inject = ['tools', 'systemPrompt'];

export function apply(ctx) {
  const cache = new Map();

  // 触发规范（prompt section，每个会话每步推理可见）：用户要「生成文档/说明书」时，
  // 先弹文档类型多选（arch/prd/hld/lld/dbd），确认后按 arch_docs_offline 规范逐份产出并建档。
  ctx.systemPrompt.section({
    name: 'awesome-architecture-offline:doc-workflow',
    order: 5100,
    text: '当用户要求“生成文档 / 说明书 / 把 xx 写成文档”，且场景属于系统设计或开发文档时：'
      + '① 先用 ask_user_question 弹出文档类型多选：架构方案(arch) / 需求文档(prd) / 概要设计(hld) / 详细设计(lld) / 数据库设计(dbd)，可多选；'
      + '同时确认针对的系统/需求对象。② 按勾选逐份产出：先 arch_docs_offline(docType) 取规范骨架，结合已有讨论内容填写，落盘 docs/<项目名>-<文档>.md。'
      + '③ 每份用 arch_version_offline 建档：当前版放 docs/ 顶层（无后缀），新版本先冻结 archive/<文档>-vX.md。'
      + '④ 信息不足时先补关键澄清再动笔。仅当用户要“写代码/普通回答”时不要触发此流程。',
  });

  // 本地文件读取（离线）：路径安全 — 只允许 content 下的相对路径；文件不存在返回 null。
  function readContent(relPath) {
    const safe = String(relPath).replace(/\\/g, '/').replace(/^\/+/, '');
    if (safe.includes('..')) return null;
    const full = join(CONTENT_DIR, safe);
    const canonDir = CONTENT_DIR.replace(/\\/g, '/');
    const canonFull = full.replace(/\\/g, '/');
    if (!canonFull.startsWith(canonDir)) return null;
    try {
      return readFileSync(full, 'utf8');
    } catch {
      return null;
    }
  }

  // Offline fetcher: read the bundled file; fall back to zh when an en mirror is missing.
  async function fetchDoc(path) {
    if (cache.has(path)) return cache.get(path);
    let text = readContent(path);
    if (text === null && path.startsWith('en/')) {
      const zhPath = path.slice(3); // en/tutorial/… → tutorial/…
      text = readContent(zhPath);
    }
    if (text !== null) cache.set(path, text);
    return text;
  }

  function zhTitle(base) { const i = base.indexOf('-'); return i >= 0 ? base.slice(i + 1) : base; }
  function tutHasEn(base) { const m = base.match(/^(\d{2})/); return !!m && TUT_EN.has(m[1]); }

  function tokens(s) {
    const low = String(s).toLowerCase();
    const out = [];
    const add = (x) => { if (x && x.length > 0 && out.indexOf(x) < 0) out.push(x); };
    (low.match(/[a-z0-9][a-z0-9.+-]*/g) || []).forEach(add);
    (low.match(/[\u4e00-\u9fff]+/g) || []).forEach((run) => {
      for (let n = Math.min(run.length, 5); n >= 2; n--) {
        for (let i = 0; i + n <= run.length; i++) add(run.slice(i, i + n));
      }
    });
    return out;
  }
  const hay = (a, b, c) => `${(a || '')} ${(b || '')} ${(c || '')}`.toLowerCase();

  function scoreAll(q) {
    const ts = tokens(q);
    if (ts.length === 0) return [];
    const res = [];
    for (const row of TUT) {
      const base = row[0];
      const h = hay(zhTitle(base), row[1], base);
      let s = 0;
      for (const t of ts) if (h.indexOf(t) >= 0) s += 1;
      if (s > 0) res.push({ kind: 'tutorial', id: 'tutorial:' + (base.indexOf('-') >= 0 ? base.split('-')[0] : base), no: base.split('-')[0] || '', zh: zhTitle(base), en: row[1], hasEn: tutHasEn(base), score: s, meta: '教程' });
    }
    TPL.forEach((row, idx) => {
      const h = hay(row[1], row[2], row[3]);
      let s = 0;
      for (const t of ts) if (h.indexOf(t) >= 0) s += 1;
      if (s > 0) res.push({ kind: 'template', id: 'template:' + row[0], zh: row[1], en: row[2], hasEn: true, score: s, meta: '模板[' + TPL_GROUP[idx] + ']' });
    });
    for (const row of CAS) {
      const h = hay(row[1], row[2], row[3]);
      let s = 0;
      for (const t of ts) if (h.indexOf(t) >= 0) s += 1;
      if (s > 0) res.push({ kind: 'case', id: 'case:' + row[0], zh: row[1], en: row[2], hasEn: true, score: s, meta: '案例' });
    }
    res.sort((x, y) => y.score - x.score);
    return res;
  }

  function parseRef(rawRef) {
    const s = String(rawRef || '').trim().toLowerCase();
    if (!s) return null;
    let m;
    m = s.match(/^t(?:utorial)?[:\s]*(\d{1,2})$/);
    if (m) return { kind: 'tutorial', no: m[1] };
    if (/^\d{1,2}$/.test(s)) return { kind: 'tutorial', no: s };
    if (s.indexOf('术语') >= 0 || s === 'glossary') return { kind: 'tutorial', no: 'g' };
    if (s.indexOf('信号') >= 0 || s.indexOf('触发') >= 0) return { kind: 'tutorial', no: 's' };
    m = s.match(/^t(?:emplate|p)?[:\s]+([a-z0-9-]+)$/);
    if (m) return { kind: 'template', slug: m[1] };
    m = s.match(/^c(?:ase)?[:\s]+([a-z0-9-]+)$/);
    if (m) return { kind: 'case', slug: m[1] };
    return null;
  }

  function tutPath(no) {
    if (no === 'g') return { zh: 'tutorial/术语表.md', en: null, zhName: '术语表' };
    if (no === 's') return { zh: 'tutorial/演进触发信号.md', en: null, zhName: '演进触发信号' };
    const base = TUT.find((r) => r[0].split('-')[0] === no);
    if (!base) return null;
    return { zh: 'tutorial/' + base[0] + '.md', en: tutHasEn(base[0]) ? 'en/tutorial/' + base[0] + '.md' : null, zhName: zhTitle(base[0]), enName: base[1] };
  }
  function tplPath(slug) {
    const row = TPL.find((r) => r[0] === slug);
    return row ? { zh: `templates/${slug}/README.md`, en: `en/templates/${slug}/README.md`, zhName: row[1], enName: row[2] } : null;
  }
  function casPath(slug) {
    const row = CAS.find((r) => r[0] === slug);
    return row ? { zh: `cases/${slug}/README.md`, en: `en/cases/${slug}/README.md`, zhName: row[1], enName: row[2] } : null;
  }

  function outline(md) {
    const heads = [];
    md.split('\n').forEach((ln) => {
      const mm = ln.match(/^(#{1,4})\s+(.*)$/);
      if (mm) heads.push('  '.repeat(mm[1].length - 1) + '- ' + mm[2]);
    });
    return heads.join('\n');
  }
  function clean(md) {
    let s = md.replace(/^---[\s\S]*?---\n?/, '');
    if (s.length > 20000) s = s.slice(0, 20000) + '\n\n…(已截断)';
    return s;
  }

  async function readEntry(ref, lang, wantFull) {
    let p;
    if (ref.kind === 'tutorial') p = tutPath(ref.no);
    else if (ref.kind === 'template') p = tplPath(ref.slug);
    else p = casPath(ref.slug);
    if (!p) return '未找到该条目，可用 arch_search_offline 检索目录。';
    const useEn = lang === 'en' && !!p.en;
    if (lang === 'en' && !p.en) return '该条目不提供英文版（仅中文）。可改用 lang: zh，或用 arch_search_offline 找可英文化的相邻条目。';
    const md = await fetchDoc(useEn ? p.en : p.zh);
    if (md === null) return '该条目内容未包含在当前离线包中（可能上游新增）。可更新离线插件到最新版本，或用 arch_search_offline 在目录层确认可用条目。';
    const title = useEn ? (p.enName || p.zhName) : p.zhName;
    const url = SRC_REPO + '/blob/main/' + (useEn ? p.en : p.zh);
    const head = '# ' + title + '\n原文: ' + url + '\n' + (useEn ? '(English)' : '(中文)') + '\n\n';
    if (wantFull) return head + '\n---- 全文 ----\n\n' + md;
    const toc = outline(md);
    const ex = clean(md).slice(0, 2600);
    return head + '---- 目录 ----\n' + (toc.length ? toc : '(无标题结构)') + '\n\n---- 开头预览 ----\n\n' + ex + '\n\n(预览截断；full:true 取全文，lang 切换语言)';
  }

  function register(name, description, parameters, execute) {
    ctx.tools.register(defineTool({
      name,
      description,
      parameters,
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: String(value) }],
      },
      execute,
    }));
  }

  // 1. arch_roadmap_offline
  register('arch_roadmap_offline', 'Awesome Architecture 知识库总览与学习路径。需要确定学习顺序/在教程、模板、案例间定位时调用。输出各篇定位与用法。section 可选: all(默认)|tutorial|template|case。',
    { section: { type: 'string', description: '范围: all(默认)/tutorial/template/case' } },
    async (args) => {
      const sec = args.section || 'all';
      const L = [];
      L.push('🧭 Awesome Architecture 知识库 — 架构优先的系统设计（只讲判断，不讲语法）');
      L.push(`来源: ${SRC_REPO} （MIT，中英双语；离线打包，无需联网）\n`);
      if (sec === 'all' || sec === 'tutorial') {
        L.push('📚 教程 tutorial/ — 像架构师一样思考（40 章 + 术语表 + 演进触发信号；01-34 有英文版）');
        [
          ['01-03', '建立思维：为什么先有架构思维 / 思考框架 / 读懂与画好架构图'],
          ['04-06', '工具箱：十大架构模式 / 数据与状态 / 质量属性与取舍'],
          ['07-09', '实战入门：从0到1设计 / ADR与演进 / 架构品味'],
          ['10-17', '进阶·硬骨头：分布式 / 一致性 / 失败设计 / 规模化 / 拆分演进 / 组织即架构 / 安全多租户 / LLM时代'],
          ['18-22', '实战演练：拆解 / 完整设计 / MVP演进 / 拆分迁移 / AI原生系统'],
          ['23-26', 'AI协同设计：规格即架构 / 审查清单 / 评测驱动 / vibe vs spec'],
          ['27-34', '技术选型：语言 / 数据库 / 缓存MQ / API / 云原生 / 可观测 / AI基础设施 / 决策树'],
          ['35-40', 'AI原生组织：组织架构 / 超级个体 / 共享上下文 / 工作流 / 责任治理 / 演进路线'],
        ].forEach((st) => L.push('  ▪ ' + st[0] + '  ' + st[1]));
        L.push('  另: 术语表 / 演进触发信号（配合 20 章）\n');
      }
      if (sec === 'all' || sec === 'template') {
        L.push('🗺️ 模板 templates/ — 真实系统架构地图（31 个正式模板 + 专题入口，均有英文版）');
        [
          '经典/通用(16) 与 AI原生(5)、AI编码/Agent(4)、系统提示词(1)、工业/嵌入式(5)',
          '每个模板统一结构: 解决什么问题→部件与数据流→关键决策与权衡→规模化死点→演进路线→真实产品',
          '→ arch_search_offline q=你要做的系统 kind=template 找最贴近的架构图，再 arch_read_offline 细读',
        ].forEach((g) => L.push('  ▪ ' + g));
        L.push('');
      }
      if (sec === 'all' || sec === 'case') {
        L.push('🧪 案例 cases/ — 从 0 到上线到真实压力的完整推演（6 个，有英文版）');
        CAS.forEach((c) => L.push('  ▪ ' + c[1]));
        L.push('  读法: 不背图，盯住「起始架构为何合理 → 哪个量化信号逼它升级 → 新架构选了什么放弃什么」\n');
      }
      L.push('🛠 用法建议');
      L.push('· 有了想法 → arch_ask_offline 映射到 教程+模板+案例');
      L.push('· 引导式设计 → arch_design_offline 分步走');
      L.push('· 要写开发文档 → arch_docs_offline 拿章节模板，arch_version_offline 管版本');
      L.push('· 面试复习 → arch_search_offline 高频考点');
      return L.join('\n');
    });

  // 2. arch_search_offline
  register('arch_search_offline', '在 awesome-architecture 目录内关键词检索（中/英文，匹配标题/主题/代表产品）。返回条目 id。kind: tutorial|template|case 默认全部。拿到 id 后 arch_read_offline 读全文。',
    { q: { type: 'string', required: true, description: '检索词，如 支付 / RAG / 实时聊天 / agent' }, kind: { type: 'string', description: 'tutorial|template|case，默认全部' } },
    async (args) => {
      const q = String(args.q || '').trim();
      if (!q) return 'arch_search_offline 需要 q 参数。例: arch_search_offline q=支付系统';
      const kind = args.kind || 'all';
      let hits = scoreAll(q);
      if (kind !== 'all') hits = hits.filter((h) => h.kind === kind);
      if (hits.length === 0) return `目录未命中「${q}」。换个更宽的关键词，或 arch_roadmap_offline 看全部内容。`;
      hits = hits.slice(0, 10);
      const L = [];
      L.push(`🔍 「${q}」 相关条目（${hits.length}）:\n`);
      hits.forEach((h, i) => {
        const mark = h.hasEn ? '中/EN' : '中文';
        L.push(`${i + 1}. [${h.meta} · ${mark}] ${h.zh || ''}` + (h.en && h.en !== h.zh ? ' / ' + h.en : ''));
        L.push(`    id: ${h.id}   → arch_read_offline ref=${h.id}  (lang: zh|en, full:true 全文)`);
      });
      return L.join('\n');
    });

  // 3. arch_read_offline
  register('arch_read_offline', '读取 awesome-architecture 某条目正文（默认中文：目录+开头预览；full:true 全文；lang:en 英文版，仅 01-34 教程/模板/案例有英文）。ref 用 arch_search_offline 的 id: tutorial:NN / template:slug / case:slug；也接受 tutorial 5 / 模板 支付 / case documind 等宽松写法（模糊定位）。',
    { ref: { type: 'string', required: true, description: 'tutorial:NN / template:slug / case:slug 或自然语言' }, lang: { type: 'string', description: 'zh(默认)|en' }, full: { type: 'boolean', description: 'true=全文(单篇可达 40KB)' } },
    async (args) => {
      let ref = parseRef(args.ref);
      if (!ref) {
        const hits = scoreAll(String(args.ref || ''));
        if (hits.length === 0) return '无法解析 ref: ' + args.ref + '。先 arch_search_offline 拿标准 id。';
        ref = { kind: hits[0].kind, no: hits[0].no, slug: hits[0].slug };
      }
      return readEntry(ref, args.lang === 'en' ? 'en' : 'zh', !!args.full);
    });

  // 4. arch_ask_offline
  register('arch_ask_offline', '把「你想做一个什么」映射到 awesome-architecture 最相关的 教程+模板+案例，抓取摘录给出建议路线与待澄清问题。适合系统/功能从想法起步时调用。question 描述目标/场景/已知约束越具体越好。',
    { question: { type: 'string', required: true, description: '你的系统想法与场景，如：企业文档问答 RAG 产品、多租户' }, focus: { type: 'string', description: '可选: tutorial|template|case 偏重哪类' }, lang: { type: 'string', description: '摘录语言 zh(默认)|en' } },
    async (args) => {
      const q = String(args.question || '').trim();
      if (!q) return 'arch_ask_offline 需要 question 参数。';
      const lang = args.lang === 'en' ? 'en' : 'zh';
      const focus = args.focus || 'all';
      const hits = scoreAll(q);
      if (hits.length === 0) return '目录未检索到相关条目，换种说法或用 arch_roadmap_offline 看全库。';
      const L = [];
      L.push('🤖 针对「' + q + '」\n');
      L.push('📍 最相关条目（按相关度）:');
      let shown = 0;
      hits.slice(0, 12).forEach((h) => {
        if (focus !== 'all' && h.kind !== focus) return;
        shown += 1;
        L.push(`${shown}. ${h.meta} — ${h.zh}` + (h.en && h.en !== h.zh ? ' / ' + h.en : '') + `  (${h.id})`);
      });
      if (shown === 0) { L.push(`(focus=${focus} 无命中，改列全局)`); hits.slice(0, 8).forEach((h) => L.push(`${++shown}. ${h.zh} (${h.id})`)); }
      L.push('');
      const topTut = hits.find((h) => h.kind === 'tutorial');
      const topTpl = hits.find((h) => h.kind === 'template');
      const topCas = hits.find((h) => h.kind === 'case');
      const toRead = [];
      [topTut, topTpl || topCas, topCas && topTpl ? topCas : null].forEach((it) => { if (it && toRead.length < 3) toRead.push(it); });
      for (const it of toRead) {
        const p = it.kind === 'tutorial' ? tutPath(it.no) : (it.kind === 'template' ? tplPath(it.slug) : casPath(it.slug));
        if (!p) continue;
        const useEn = lang === 'en' && !!p.en;
        if (lang === 'en' && !p.en) continue;
        const md = await fetchDoc(useEn ? p.en : p.zh);
        if (md === null) continue;
        const title = useEn ? (p.enName || p.zhName) : p.zhName;
        const url = SRC_REPO + '/blob/main/' + (useEn ? p.en : p.zh);
        L.push('📖 建议先读 — ' + title + '  (' + it.id + ')' + (useEn ? ' [EN]' : ''));
        L.push('   ' + url);
        const toc = outline(md).split('\n').slice(0, 12).map((x) => '   ' + x).join('\n');
        if (toc.trim()) L.push(toc);
        const ex = clean(md).replace(/\s+/g, ' ').slice(0, 700);
        L.push('   摘录: ' + ex + '…\n');
      }
      L.push('✅ 下一步');
      L.push('· arch_read_offline ref=… full:true 精读 1-2 篇「关键决策与权衡/常见误区」');
      L.push('· 想一步步设计方案 → arch_design_offline');
      L.push('· 想继续讨论 → 告诉我使用人数/数据量/必须强一致的部分/成本约束，我再收敛取舍');
      return L.join('\n');
    });

  // 5. arch_design_offline
  const DESIGN = {
    clarify: { title: '① 需求澄清', goal: '产出: 一句话系统定位 + 核心用户场景 + 范围边界(不做清单) + 触发使用的真实事件。', refs: ['tutorial:02', 'tutorial:07'], questions: ['想做的这件事，谁在用、什么场景？（一句话定位）', '用户核心的 1-3 个动作/流程是什么？哪个是「没它产品不成立」的？', '第一批真实用户规模/数据量级？数据从哪来、什么形态（结构化/文档/事件）？', '首版明确不做什么？（登录/多语言/移动端/复杂权限先划掉）', '内部工具还是上线产品？时间/预算/合规（支付、隐私）约束？'], done: '能一句话说清：是什么、给谁、做什么、首版边界。' },
    constraints: { title: '② 约束与质量属性', goal: '定 性能/可用性/一致性/成本/安全 目标与优先级，识别最强约束（通常数据一致性或外部依赖）。', refs: ['tutorial:06', 'tutorial:10', 'tutorial:11'], questions: ['哪些必须强一致？哪些可最终一致/异步？（支付余额 vs 点赞数）', '可用性要求？能接受降级吗？RTO/RPO 大概多少？', '量级档位: 日活/写入/数据量在 10K/1M/100M 哪档？多久到？', '最强外部依赖（支付/LLM/第三方 API）不可用时系统如何表现？', '成本敏感度：创业 MVP / 企业预算 / 极致性价比？贵组件必须省哪些？'], done: '约束清单：强一致范围、可用性/延迟目标、量级档、最强依赖、成本画像。' },
    structure: { title: '③ 结构设计', goal: '产出 C4 容器级草稿: 模块/存储/读写路径/边界通信，并预判瓶颈先出现在哪。', refs: ['tutorial:03', 'tutorial:04', 'tutorial:05', 'tutorial:13'], questions: ['主干数据流：请求进→处理→落库→通知/回读 长什么样？', '按什么切模块：业务能力还是技术层？', '哪里需要队列/事件/缓存？哪里有读热点或写放大？', '状态放哪、谁是事实源（单一写者）？副本同步还是异步？', '先画「最简单能跑」的图，再标：量×10 时第一个瓶颈在哪？'], done: '一张容器/模块图 + 主读写路径 + 最先失效点预判。' },
    decisions: { title: '④ 关键决策与 ADR', goal: '识别 3-5 个关键决策点，逐个写 ADR(上下文→决策→后果)，对照同类系统取舍。', refs: ['tutorial:08', 'tutorial:34'], questions: ['最关键 3-5 个决策是什么？（单体还是微服务 / SQL还是文档库 / 同步还是异步 / 自研还是SaaS）', '每个决策的备选方案牺牲了什么？（没有免费的架构）', '哪个选择会锁死演进？退出方案是什么？', '用 arch_search_offline 找最贴近模板，精读「关键决策与权衡」。', '先不定具体框架名——先定这类问题的答案，再定技术。'], done: '3-5 个 ADR（含备选与放弃项）+ 选型决策树。' },
    roadmap: { title: '⑤ 演进路线', goal: 'MVP 范围、第一个升级触发信号、每个里程碑的量化指标与放弃项。', refs: ['tutorial:20', '演进触发信号', 'tutorial:12'], questions: ['MVP 最小闭环是哪条端到端路径？', '哪个量化信号（P99延迟/单表>10M/告警数）触发第一次升级？', '每个里程碑敢砍什么？怎么飞行中换引擎（绞杀者/灰度）？', '哪些升级永远不会发生？（标记「不做直到有信号」）'], done: 'MVP 路径 + 触发信号清单 + 2-3 个里程碑。' },
    review: { title: '⑥ 方案审查', goal: '按生产级 checklist 挑毛病：失败设计/安全/一致性/可观测/权限。', refs: ['tutorial:24', 'tutorial:12', 'tutorial:16', 'tutorial:32'], questions: ['单点故障在哪？有熔断/重试/降级/幂等吗？会级联吗？', '数据损坏/丢失/重复路径都补幂等与校验了吗？多租户隔离清楚吗？', '用户视角 SLO 定了吗？指标/日志/链路/告警怎么落地？', 'AI 组件: 输出校验/提示注入/成本失控/评测回归怎么管？', '给外行看 5 分钟，他能看出「哪会先崩、拿什么换什么」吗？'], done: '一轮找茬后的修订定稿 + 遗留风险清单。' },
  };
  register('arch_design_offline', '分步引导式架构设计。把「想法」推进成完整方案，一次调用推进一个阶段: clarify→constraints→structure→decisions→roadmap→review。返回: 阶段目标、要与你逐条讨论的问题清单、完成标准、建议阅读。step 必填；context 携带已确认信息以便承接。',
    { step: { type: 'string', required: true, description: 'clarify|constraints|structure|decisions|roadmap|review' }, context: { type: 'string', description: '已确认信息摘要，多轮讨论时把结论带进来' } },
    async (args) => {
      const step = String(args.step || '').trim();
      const d = DESIGN[step];
      if (!d) return 'step 必须是 clarify/constraints/structure/decisions/roadmap/review 之一。流程从需求澄清开始。';
      const L = [];
      L.push('# arch_design_offline · ' + d.title);
      L.push('\n🎯 目标: ' + d.goal);
      if (args.context) L.push('\n📝 已确认信息:\n' + String(args.context));
      L.push('\n❓ 请与我逐条讨论（可先答最确定的，我帮你收敛）:');
      d.questions.forEach((qt, i) => L.push(`${i + 1}. ${qt}`));
      L.push('\n✅ 进入下一阶段标准: ' + d.done);
      L.push('\n📖 建议阅读(arch_read_offline): ' + d.refs.join(' / '));
      return L.join('\n');
    });

  // 6. arch_docs_offline（工程文档规范）
  const DOC_SPECS = {
    arch: { title: '架构方案（方案/ADR）', usage: '系统从想法到方案的第一份文档；回答“为什么这么做”。前置用 arch_ask_offline/arch_design_offline 引导讨论。', sections: [['1. 系统定位', '一句话定位 + 表格：使用方/触发方式/数据形态/范围边界/不做清单（核心用户动作必做项）'], ['2. 约束与质量属性', '一致性/可靠性/校验模式/审计/性能/成本 的目标表；标注“最强约束”'], ['3. 总体架构', 'ASCII 容器图 + 模块清单表（模块/职责/要点）+ 数据模型核心表 + 批次/流程状态机'], ['4. 关键决策 ADR', '编号表：决策点/采纳方案/放弃的备选与代价；标注“演进锁死点”'], ['5. 里程碑', 'M1..Mn 阶段表（内容/验收）+ “本次不做，直到有信号”清单'], ['6. 审查与遗留风险', '已覆盖项（失败设计/幂等/权限/一致性/可观测）+ 编号风险清单 R1..Rn'], ['7. 参考来源', '引用的 arch_read_offline 条目/模板/案例，供追溯']], checks: ['给外行看 5 分钟能看出：哪会先崩、拿什么换什么', '每个 ADR 都写了放弃的备选', '里程碑含触发升级的量化信号'], example: '参考 金融数据加工系统 实战样例（架构方案.md）' },
    prd: { title: '需求文档（PRD）', usage: '回答“做什么”；从 arch_design_offline clarify/constraints 阶段的结论落笔。业务规则必须精确到可开发。', sections: [['1. 文档信息与版本', '版本号 + 变更历史（每版写清相对上版改了什么）'], ['2. 背景与目标', '为什么做 / 目标清单 / 成功标准 / 非目标（不做清单）'], ['3. 术语表', '统一业务/技术术语，避免歧义'], ['4. 用户角色与使用场景', '角色表（动作/频率）+ 关键场景 S1/S2/S3 走查'], ['5. 总体需求', '范围图 + 核心规则总表（各业务模块 字段/L1校验/L2比对）'], ['6. 功能需求', '文件导入与批次/自动校验(L1)/错误明细与重跑/业务模块需求(按模块细化到字段表)/跨业务比对(L2)/审批复核/统计报表/审计'], ['7. 非功能需求', '一致性/可靠性/性能/审计合规/安全/可用性 目标表'], ['8. 权限与角色', 'RBAC 权限点矩阵'], ['9. 边界与不做清单', '首版明确不做'], ['10. 验收标准', '可测试条目清单'], ['附录A 待确认问题清单', 'A-1..An：未定事项显式列出（建议带默认值），避免开发带问号开工'], ['附录B 业务回填模板', '其余业务按统一模板补充']], checks: ['每个业务字段表含：类型/必填/校验规则', 'L1(字段级)与L2(跨模块)两层校验分开写清失败处理（是否入库！）', '未定项都在附录A且给了建议默认', '版本历史记载每版变更'], example: '参考 金融数据加工系统 实战样例（需求文档 v0.1→v0.3 演进）' },
    hld: { title: '概要设计（HLD）', usage: '回答“怎么做的大结构”：模块划分、核心流程与状态机、接口清单、数据概要。与 prd/arch 一一对应。', sections: [['1. 设计目标与约束回顾', '从 prd/arch 摘录关键约束（勿重复大段正文）'], ['2. 逻辑架构与模块划分', '工程结构树 + 组件职责表 + 扩展 SPI 说明'], ['3. 核心流程设计', '状态机图 + 主链路时序(ASCII) + 关键机制（幂等/断点续跑/重跑/归档）'], ['4. 数据设计（概要）', 'schema 布局 + 核心表 + 关键索引/查询说明'], ['5. 接口清单', '对外 REST 表(方法/路径/说明/权限) + 内部 SPI'], ['6. 关键技术决策', 'HD-1..n 表（决策/理由/影响）'], ['7. 部署视图', '概念部署图 + 并发/恢复策略'], ['8. 风险与待定项', 'P1..Pn（项/影响/归属文档）']], checks: ['状态机覆盖异常分支与重跑语义', '每个 prd 业务需求都能找到对应模块/流程', '跨模块交互（比对/审批）有时序'], example: '参考 金融数据加工系统 实战样例（概要设计.md）' },
    lld: { title: '详细设计（LLD）', usage: '回答“具体怎么实现”，细到类/接口/方法签名/关键逻辑，开发可直接编码；测试据此写用例。', sections: [['1. 总体包结构', '细化到包/目录'], ['2. 领域模型与枚举', '核心实体字段 + 状态枚举与合法流转'], ['3. 框架机制', '动态schema路由/事务边界/审计切面 等实现方案'], ['4. 核心引擎详细设计', '批处理编排/幂等守卫/分批提交与断点续跑 等：伪代码+关键方法'], ['5. 校验引擎', 'L1 规则链接口 + 内置规则 + L2 比对执行（含“失败仍入库”的落点）'], ['6. 业务模块实现', 'SPI 契约 + 各业务具体类定义'], ['7. 审批旁路', 'Flowable 触发/回调/事务边界'], ['8. 审计/报表/Web/安全', '按模块细化'], ['9. 错误码', 'code/含义 表'], ['10. 并发与线程模型', '锁/线程池/限流'], ['11. 测试关注点', '给测试的重点场景编号列表'], ['12. 需求变更记录', '确认项→回填位置 表']], checks: ['每条特殊业务规则都能在代码位置找到实现锚点', '测试关注点覆盖需求里所有“差异点/边界”', '错误码覆盖主要失败路径'], example: '参考 金融数据加工系统 实战样例（详细设计.md）' },
    dbd: { title: '数据库设计', usage: '数据落点：schema/表/索引/DDL 草案/约定。字段以需求文档为准，禁止自行发明。', sections: [['1. 总览', 'schema 布局表 + 命名约定（表统一名便于路由/跨库查询）'], ['2. common 表', '批次/错误明细/审计/文件副本/锁 等，含索引与幂等查询注释'], ['3-5. 各业务 schema', '每模块主表(有效行) + 归档表(history) 的结构与索引、业务字段注释'], ['6. 索引与查询说明', '每个关键查询 → 命中索引 对照表'], ['7. DDL 约定', '金额decimal/时间精度/字符集/归档重跑/迁移工具'], ['8. 外部引擎表', 'Flowable 等自带表放独立 schema'], ['9. 需求变更记录', '确认项→DDL 落点']], checks: ['字段与需求文档逐项一致（含“仅必填不验格式”等特殊规则）', '唯一索引语义与“主表只留有效行/归档”一致', '金额字段类型/精度标注清晰'], example: '参考 金融数据加工系统 实战样例（数据库设计.md）' },
  };
  register('arch_docs_offline', '工程开发文档规范引导。需要产出/完善某类开发文档时调用，返回该文档类型的章节骨架、每章要点、完成标准(checklist)与参考样例。docType: arch(架构方案)|prd(需求文档)|hld(概要设计)|lld(详细设计)|dbd(数据库设计)。生成文档时应严格按返回骨架组织，并结合已有讨论内容填写。',
    { docType: { type: 'string', required: true, description: 'arch|prd|hld|lld|dbd' }, context: { type: 'string', description: '可选：已确认的系统信息/约束/需求摘要，便于按需裁剪章节' } },
    async (args) => {
      const t = String(args.docType || '').trim().toLowerCase();
      const s = DOC_SPECS[t];
      if (!s) return 'docType 必须是 arch / prd / hld / lld / dbd 之一。';
      const L = [];
      L.push('# 📋 ' + s.title + ' — 文档规范');
      L.push('\n用途: ' + s.usage);
      if (args.context) L.push('\n📝 本次上下文(按需裁剪章节):\n' + String(args.context));
      L.push('\n## 章节骨架与要点\n');
      s.sections.forEach((sec) => { L.push('### ' + sec[0]); L.push(sec[1]); L.push(''); });
      L.push('## ✅ 完成标准（checklist）');
      s.checks.forEach((c, i) => L.push(`${i + 1}. ${c}`));
      L.push('\n## 📎 样例');
      L.push(s.example);
      L.push('\n## 🗂 版本管理提醒');
      L.push('落盘规则: docs/ 第一层只放当前版(无后缀)；定稿新版本时先冻结 archive/<文档>-vX.md 再改当前文件。可用 arch_version_offline 查看规范。');
      return L.join('\n');
    });

  // 7. arch_version_offline
  register('arch_version_offline', '开发文档版本管理规范。每次需要把某份开发文档升级新版本、或想了解版本快照约定时调用。输出：目录组织规则、升级新版的操作步骤(冻结旧版→改当前)、文件命名、注意事项。doc 可选指定要建档的文档(需求文档/架构方案/概要设计/详细设计/数据库设计/全部)。',
    { doc: { type: 'string', description: '指定文档名或“全部”，默认全部' }, next: { type: 'string', description: '可选：计划中的新版本号，如 v0.4' } },
    async (args) => {
      const doc = args.doc || '全部';
      const next = args.next ? `（目标版本: ${String(args.next)}）` : '';
      const L = [];
      L.push('# 🗂 开发文档版本管理规范 ' + next);
      L.push('\n适用范围: ' + doc);
      L.push('\n## 目录约定');
      L.push('· docs/ 第一层 = 当前有效文档（无后缀，永远指向最新版，开发直接打开）');
      L.push('· docs/archive/ = 历史版本快照（每版独立文件，双击即看，可对比）');
      L.push('\n## 升级到新版本的标准步骤');
      L.push('1. 确认变更内容，形成「相对上版的差异摘要」');
      L.push('2. 先冻结：把当前文件复制为 docs/archive/<文档>-v<新号>.md（如 需求文档-v0.4.md）');
      L.push('3. 再修改：在 docs/ 下无后缀的当前文件上做编辑');
      L.push('4. 同步更新当前文件头部：版本号 + 版本历史 + 差异摘要');
      L.push('5. 若改动涉及其他文档（如需求改动牵动概要/详细/DB），逐份重复 2-4（各自生成新快照）');
      L.push('\n## 命名规则');
      L.push('· 当前版: <文档名>.md（如 金融数据加工系统-需求文档.md）');
      L.push('· 历史版: archive/<文档名>-v0.1.md、-v0.2.md …');
      L.push('\n## 注意事项');
      L.push('· 历史快照一经冻结不再修改（还原当时真实状态）');
      L.push('· 每次文档变更都生成新版本号，避免覆盖式修改丢失历史');
      L.push('· 同一次需求变更应联动建档：需求文档牵头，其余受影响文档跟着升版');
      L.push('\n📎 实践样例: 需求文档 v0.1→v0.3 的 archive 快照即按此规范建立。');
      return L.join('\n');
    });
}
