// dsh-arch-advisor-offline — DeepSeek Harness persistent plugin (fully offline).
// Registers 7 model tools with _offline suffix: arch_roadmap_offline / arch_search_offline /
// arch_read_offline / arch_ask_offline / arch_design_offline + arch_docs_offline / arch_version_offline.
// Knowledge content is bundled locally under ./content — zero network access.
import { defineTool } from '@deepseek-ai/dsh-tools';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TUT, TUT_EN, TPL, TPL_GROUP, CAS } from './catalog.js';
import { DOCS, CODE_POLICY, findDoc, LEGACY, byStage } from './docs-gbt.js';

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
  // 先定文档清单（GB/T 8567—2006 的 25 类里裁），再按 arch_docs_offline 骨架逐份产出。
  ctx.systemPrompt.section({
    name: 'awesome-architecture-offline:doc-workflow',
    order: 5100,
    text: '当用户要求“生成文档 / 说明书 / 把 xx 写成文档”，且场景属于系统设计或开发文档时，按 GB/T 8567—2006 走：'
      + '① 先问清四件事：项目/系统名、项目规模（代码行数或人数）、交付对象（内部/客户/投标）、是否涉密。'
      + '② 调 arch_docs_offline(docType="list") 取 25 类清单与裁剪建议，和用户确认本次要产出哪几份——不要默认全出，也不要凭记忆自己列文档类型。'
      + '③ 逐份 arch_docs_offline(docType=<编号或简称>) 取骨架，按返回的「填写要点」结合已确认信息填写，落盘 docs/<项目名>-<两位编号>-<简称>-<文档名>.md。'
      + '④ 每份文件开头固定放「文档控制块 + 修订记录」，位置永远在正文最前面，不得改放文末；升版只在修订记录表追加一行，不生成 archive/ 副本（历史由 git 承担）。'
      + '⑤ 严格遵守每份文档返回的「代码策略」：策略为「禁止代码」的不得出现 ``` 代码块；「仅伪代码」只能写 IF/THEN 式伪代码并标注「伪代码，非交付源码」；越界代码必须改写为文字、表格或图。'
      + '⑥ 旧代号 arch/prd/hld/lld/dbd 已停用（v0.3 起），遇到时按工具返回的迁移提示纠正为 25 类中的对应文档。'
      + '⑦ 信息不足先补关键澄清再动笔。仅当用户要“写代码/普通回答”时不要触发此流程。',
  });

  // 触发规范（design 路径，与上面的文档路径并列）：用户说「想一个方案 / 设计一个系统 /
  // 从想法起步」时必须先走 arch_ask_offline（想法→知识库映射），再按需 arch_design_offline 分步推进。
  // 为什么必须有这段：工具调用是模型的决策，只有 prompt section 里的显式触发规则才管得住；
  // 单靠工具 description 的软提示，模型会跳过插件直接凭记忆给方案。
  ctx.systemPrompt.section({
    name: 'awesome-architecture-offline:design-workflow',
    order: 5099,
    text: '当用户表达「想做一个 X / 帮我想个方案 / 设计一个系统 / 这个系统怎么做 / 有个想法想落地」这类"从想法起步"的架构诉求时：'
      + '① 先调 arch_ask_offline(question=用户原话或提炼后的场景) 把想法映射到最相关的 教程+模板+案例，基于返回内容再展开讨论；'
      + '② 需要继续推进时用 arch_design_offline 分步走（clarify→constraints→structure→decisions→roadmap→review），一次只推进一个阶段，并把已确认信息放进 context；'
      + '③ 不要跳过插件、直接凭记忆一次性给整篇方案；只有工具不可用或用户明确说"不用查资料/随便聊聊"时才退回普通回答。'
      + '④ 「生成文档」诉求走 doc-workflow 段，「想方案/设计方案」诉求走本段，两者不要互相顶替。',
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
  function tutHasEn(base) { return TUT_EN.has(base.indexOf('-') >= 0 ? base.split('-')[0] : base); }

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
    // Txx 专题（如 T01）：tutorial:T01 / t:t01 / 大写 T01。
    // 用 [:\s]+ 以及「原始输入以大写 T 开头」来限定，避免抢走 t5（= 教程 05）这类既有写法。
    m = s.match(/^t(?:utorial)?[:\s]+t0?(\d{1,2})$/);
    if (m) return { kind: 'tutorial', no: 'T' + m[1].padStart(2, '0') };
    if (/^T/.test(String(rawRef || '').trim()) && /^t0?\d{1,2}$/.test(s)) {
      const n = s.slice(1).replace(/^0+/, '');
      return { kind: 'tutorial', no: 'T' + (n || '1').padStart(2, '0') };
    }
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
    md.split(/\r?\n/).forEach((ln) => {
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
        L.push('📚 教程 tutorial/ — 像架构师一样思考（40 章 + T01 基础模型训练决策专题 + 术语表 + 演进触发信号；01-34 与 T01 有英文版）');
        [
          ['01-03', '建立思维：为什么先有架构思维 / 思考框架 / 读懂与画好架构图'],
          ['04-06', '工具箱：十大架构模式 / 数据与状态 / 质量属性与取舍'],
          ['07-09', '实战入门：从0到1设计 / ADR与演进 / 架构品味'],
          ['10-17', '进阶·硬骨头：分布式 / 一致性 / 失败设计 / 规模化 / 拆分演进 / 组织即架构 / 安全多租户 / LLM时代'],
          ['18-22', '实战演练：拆解 / 完整设计 / MVP演进 / 拆分迁移 / AI原生系统'],
          ['23-26', 'AI协同设计：规格即架构 / 审查清单 / 评测驱动 / vibe vs spec'],
          ['27-34', '技术选型：语言 / 数据库 / 缓存MQ / API / 云原生 / 可观测 / AI基础设施 / 决策树'],
          ['35-40', 'AI原生组织：组织架构 / 超级个体 / 共享上下文 / 工作流 / 责任治理 / 演进路线'],
          ['T01', '基础模型训练决策专题：训练方案不按算法新旧排队，先把决策分层（中英双语）'],
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
      L.push('· 要写项目文档 → arch_docs_offline(docType="list") 看 25 类与裁剪建议，再逐份取骨架；版本与修订记录用 arch_version_offline');
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
  register('arch_read_offline', '读取 awesome-architecture 某条目正文（默认中文：目录+开头预览；full:true 全文；lang:en 英文版，01-34 教程、T01 专题、全部模板/案例有英文）。ref 用 arch_search_offline 的 id: tutorial:NN / tutorial:T01 / template:slug / case:slug；也接受 tutorial 5 / 模板 支付 / case documind 等宽松写法（模糊定位）。',
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
  register('arch_ask_offline', '把「你想做一个什么」映射到 awesome-architecture 最相关的 教程+模板+案例，抓取摘录给出建议路线与待澄清问题。适合系统/功能从想法起步时调用。用户说「想一个方案 / 帮我设计一个系统 / 从 0 做 X / 有个想法」时优先调用本工具，不要先凭记忆直接给方案。question 描述目标/场景/已知约束越具体越好。',
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
  register('arch_design_offline', '分步引导式架构设计。把「想法」推进成完整方案，一次调用推进一个阶段: clarify→constraints→structure→decisions→roadmap→review。返回: 阶段目标、要与你逐条讨论的问题清单、完成标准、建议阅读。step 必填；context 携带已确认信息以便承接。用户要「一步步把想法推进成完整方案」时，在 arch_ask_offline 之后逐阶段调用本工具。',
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

  // 6. arch_docs_offline（GB/T 8567—2006 文档规范）
  const CTRL_BLOCK = [
    '| 项 | 内容 |',
    '| --- | --- |',
    '| 文档标识号 | <项目编号>-<两位编号>-<简称> |',
    '| 文档名称 | <中文名>（<简称>） |',
    '| 版本 / 发行号 | v0.1 / R0 |',
    '| 密级 | 内部 |',
    '| 编制 / 审核 / 批准 | <姓名> / <姓名> / <姓名> |',
    '| 修订记录 | v0.1 初稿（YYYY-MM-DD） |',
  ].join('\n');

  function renderDocList() {
    const L = [];
    L.push('# 📚 GB/T 8567—2006 · 25 类软件文档清单');
    L.push('');
    L.push('依据：GB/T 8567—2006《计算机软件文档编制规范》第 7 章（现行版，2022 年复审继续有效）。');
    L.push('');
    byStage().forEach((g) => {
      L.push('## ' + g.stage);
      g.docs.forEach((d) => L.push('- **' + d.no + ' ' + d.abbr + '** ' + d.title + ' — ' + d.purpose));
      L.push('');
    });
    L.push('## 裁剪建议（标准第 6 章允许剪裁）');
    L.push('');
    L.push('| 项目规模 | 建议保留 |');
    L.push('| --- | --- |');
    L.push('| 小（< 5000 行 / 1~2 人） | FAR · SRS · SDD · STP · STR · SUM |');
    L.push('| 中（1~5 万行） | 再加 SDP · IRS · DBDD · STD · SCMP · DPMR · PDSR |');
    L.push('| 大 / 涉密 / 多方分包 | 25 类按需全上，另加 SSS · SSDD · IDD · SIP · STrP · SQAP · SPS · SVD |');
    L.push('');
    L.push('## 代码策略速查');
    L.push('');
    Object.keys(CODE_POLICY).forEach((k) => {
      const p = CODE_POLICY[k];
      const list = DOCS.filter((d) => d.code === k).map((d) => d.abbr);
      if (list.length) L.push('- **' + p.label + '**：' + p.rule + ' → ' + list.join(' '));
    });
    L.push('');
    L.push('用法：arch_docs_offline(docType=<编号或简称>)，1~25 或 FAR/SRS/SSDD… 都认。');
    return L.join('\n');
  }

  function renderDoc(d, context) {
    const c = CODE_POLICY[d.code];
    const L = [];
    L.push('# 📋 ' + d.title + '（' + d.abbr + '） — GB/T 8567—2006 第 7.' + d.no + ' 条');
    L.push('');
    L.push('## ⛔ 代码策略：' + c.label);
    L.push(c.rule);
    if (d.code === 'none') L.push('出现 ``` 代码块即判不合格；算法与流程请用文字、表格或图描述。');
    L.push('');
    L.push('用途：' + d.purpose);
    L.push('阶段：' + d.stage + ' · 编号：' + d.no + ' · 简称：' + d.abbr);
    if (context) L.push('\n已确认上下文（据此裁剪章节）：\n' + String(context));
    L.push('');
    L.push('## 文档控制块（固定放正文最前面，位置不得变化）');
    L.push(CTRL_BLOCK);
    L.push('');
    L.push('## 章节骨架（标准第 7.' + d.no + ' 条，' + d.sections.length + ' 条）');
    d.sections.forEach((s) => {
      const m = s.match(/^([\d.]+)\s/);
      const depth = m ? m[1].split('.').filter(Boolean).length - 1 : 0;
      L.push('  '.repeat(Math.max(0, depth - 1)) + '- ' + s);
    });
    L.push('');
    L.push('## 填写要点');
    d.keys.forEach((k, i) => L.push((i + 1) + '. ' + k));
    L.push('');
    L.push('## ✅ 完成标准');
    L.push('1. 章节齐全：骨架每条都有内容，不适用写「不适用」并说明理由');
    L.push('2. 文档控制块在正文最前面，修订记录与本次改动一致');
    L.push('3. 条目有编号、可追踪，能与其他文档互引');
    L.push('4. 无越界代码：当前策略为「' + c.label + '」');
    L.push('');
    L.push('## 落盘');
    L.push('文件：docs/<项目名>-' + String(d.no).padStart(2, '0') + '-' + d.abbr + '-' + d.title + '.md');
    L.push('修订记录放文档头部；不建 archive/ 副本，历史由 git 承担。');
    return L.join('\n');
  }

  register('arch_docs_offline',
    'GB/T 8567—2006 文档规范引导。传 docType 取某份文档的章节骨架、填写要点、代码策略与完成标准；传 docType="list" 取 25 类清单与裁剪建议。docType 支持编号(1~25)或简称(FAR/SDP/STP/SIP/STrP/OCD/SSS/IRS/SSDD/IDD/SRS/DRD/SDD/DBDD/STD/STR/SCMP/SQAP/DPMR/PDSR/SPS/SVD/SUM/COM/CPM)。生成文档时严格按骨架组织，并遵守返回的代码策略。',
    {
      docType: { type: 'string', required: true, description: "编号(1~25)、简称(FAR…CPM) 或 list" },
      context: { type: 'string', description: '可选：已确认的系统/需求摘要，便于裁剪章节' },
    },
    async (args) => {
      const raw = String(args.docType || '').trim();
      if (!raw) return 'docType 必填。传 1~25 或简称，或传 list 看全部清单。';
      if (/^(list|all|清单|全部)$/i.test(raw)) return renderDocList();
      const d = findDoc(raw);
      if (d) return renderDoc(d, args.context);
      const legacy = LEGACY[raw.toLowerCase()];
      if (legacy) {
        return 'docType「' + raw + '」已停用：v0.3 起按 GB/T 8567—2006 的 25 类，不再使用 arch/prd/hld/lld/dbd。\n'
          + '最接近的替代：' + legacy + '。\n'
          + '可用 arch_docs_offline(docType="list") 看全部 25 类。';
      }
      return '未找到该文档类型：' + raw + '。\n可用编号 1~25 或简称（如 SRS、SSDD、DBDD），或传 docType="list" 查看清单。';
    });

  // 7. arch_version_offline（文档标识与修订记录，不再建 archive/）
  register('arch_version_offline',
    '文档标识与修订记录规范。文档升版、需要写版本号或补修订记录时调用。输出：文档控制块字段、版本号规则、修订记录表格式、跨文档联动规则。不生成 archive/ 副本——历史由 git 承担。doc 可选指定文档名，next 可选给目标版本号。',
    {
      doc: { type: 'string', description: '文档名或「全部」，默认全部' },
      next: { type: 'string', description: '可选：目标版本号，如 v0.2' },
    },
    async (args) => {
      const doc = args.doc || '全部';
      const next = args.next ? '（目标版本：' + String(args.next) + '）' : '';
      const L = [];
      L.push('# 🗂 文档标识与修订记录规范 ' + next);
      L.push('');
      L.push('适用范围：' + doc);
      L.push('');
      L.push('## 1. 文档控制块（固定放正文最前面）');
      L.push('');
      L.push('| 项 | 内容 |');
      L.push('| --- | --- |');
      L.push('| 文档标识号 | <项目编号>-<两位编号>-<简称> |');
      L.push('| 版本 / 发行号 | v0.2 / R0 |');
      L.push('| 密级 | 内部 |');
      L.push('| 编制 / 审核 / 批准 | <姓名> / <姓名> / <姓名> |');
      L.push('| 修订记录 | 见下表 |');
      L.push('');
      L.push('位置要求：紧跟一级标题，**永远在正文第一屏**。不要放文末，也不要另建文件。');
      L.push('');
      L.push('## 2. 修订记录表（放在控制块之后）');
      L.push('');
      L.push('| 版本 | 日期 | 修订人 | 变更摘要 | 依据 |');
      L.push('| --- | --- | --- | --- | --- |');
      L.push('| v0.1 | YYYY-MM-DD | 张三 | 初稿 | 需求讨论 |');
      L.push('| v0.2 | YYYY-MM-DD | 李四 | 补安全需求与验收标准 | 评审意见 R-03 |');
      L.push('');
      L.push('## 3. 版本号规则');
      L.push('- `v0.x`：草稿期，每次评审/返工递增次版本');
      L.push('- `v1.0`：首次定稿（随首版产品发布），发行号 `R1`');
      L.push('- `v1.x`：小改（勘误、补充说明）；`v2.0`：范围或结构变化（需重新评审）');
      L.push('- 版本号写在文档里，**不写进文件名**');
      L.push('');
      L.push('## 4. 升版标准步骤');
      L.push('1. 在修订记录表**追加一行**（不改旧行）');
      L.push('2. 更新控制块里的版本 / 发行号');
      L.push('3. 按变更点修改正文，检查受影响章节的交叉引用是否同步');
      L.push('4. 同一次需求变更牵动的其他文档（如 SRS → SDD → STD），各自加一行，版本叙事保持一致');
      L.push('');
      L.push('## 5. 与配置管理 / git 的分工');
      L.push('- 历史版本追溯：由 git（或 SCMP 定义的配置库）承担，**不再复制 archive/ 快照**');
      L.push('- 文档内只留「人读得懂的变更叙事」，不贴 diff');
      L.push('- 基线（发布点）用 tag 或 SCMP 的基线记录标记，不靠目录复制');
      return L.join('\n');
    });
}
