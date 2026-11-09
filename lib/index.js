// dsh-arch-advisor-offline — DeepSeek Harness persistent plugin (fully offline).
// Registers 7 model tools with _offline suffix: arch_roadmap_offline / arch_search_offline /
// arch_read_offline / arch_ask_offline / arch_design_offline + arch_docs_offline / arch_version_offline.
// Knowledge content is bundled locally under ./content — zero network access.
//
// 本文件只做「注册层」：工具描述、参数 schema、两段 systemPrompt 触发规则。
// 全部能力实现在 ./core.js，与命令行（./cli.js）及 Agent Skill（skill/…/scripts/arch.mjs）同源。
import { defineTool } from '@deepseek-ai/dsh-tools';
import { createAdvisor, DOC_WORKFLOW, DESIGN_WORKFLOW } from './core.js';

export const name = 'dsh-arch-advisor-offline';

// 离线版不依赖 web；tools/systemPrompt 为硬依赖（标准 Cordis 语义）。
export const inject = ['tools', 'systemPrompt'];

export function apply(ctx) {
  const advisor = createAdvisor();

  // 触发规范（prompt section，每个会话每步推理可见）：用户要「生成/重新生成文档」时，
  // 第一件事必须弹体系选择，未确认前不得落盘。文案见 core.js 的 DOC_WORKFLOW（与 skill 共用单源）。
  ctx.systemPrompt.section(DOC_WORKFLOW);

  // 触发规范（design 路径，与上面的文档路径并列）：用户说「想一个方案 / 设计一个系统 /
  // 从想法起步」时必须先走 arch_ask_offline（想法→知识库映射），再按需 arch_design_offline 分步推进。
  // 为什么必须有这段：工具调用是模型的决策，只有 prompt section 里的显式触发规则才管得住；
  // 单靠工具 description 的软提示，模型会跳过插件直接凭记忆给方案。
  ctx.systemPrompt.section(DESIGN_WORKFLOW);

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
    async (args) => advisor.roadmap(args));

  // 2. arch_search_offline
  register('arch_search_offline', '在 awesome-architecture 目录内关键词检索（中/英文，匹配标题/主题/代表产品）。返回条目 id。kind: tutorial|template|case 默认全部。拿到 id 后 arch_read_offline 读全文。',
    { q: { type: 'string', required: true, description: '检索词，如 支付 / RAG / 实时聊天 / agent' }, kind: { type: 'string', description: 'tutorial|template|case，默认全部' } },
    async (args) => advisor.search(args));

  // 3. arch_read_offline
  register('arch_read_offline', '读取 awesome-architecture 某条目正文（默认中文：目录+开头预览；full:true 全文；lang:en 英文版，01-34 教程、T01 专题、全部模板/案例有英文）。ref 用 arch_search_offline 的 id: tutorial:NN / tutorial:T01 / template:slug / case:slug；也接受 tutorial 5 / 模板 支付 / case documind 等宽松写法（模糊定位）。',
    { ref: { type: 'string', required: true, description: 'tutorial:NN / template:slug / case:slug 或自然语言' }, lang: { type: 'string', description: 'zh(默认)|en' }, full: { type: 'boolean', description: 'true=全文(单篇可达 40KB)' } },
    async (args) => advisor.read(args));

  // 4. arch_ask_offline
  register('arch_ask_offline', '把「你想做一个什么」映射到 awesome-architecture 最相关的 教程+模板+案例，抓取摘录给出建议路线与待澄清问题。适合系统/功能从想法起步时调用。用户说「想一个方案 / 帮我设计一个系统 / 从 0 做 X / 有个想法」时优先调用本工具，不要先凭记忆直接给方案。question 描述目标/场景/已知约束越具体越好。',
    { question: { type: 'string', required: true, description: '你的系统想法与场景，如：企业文档问答 RAG 产品、多租户' }, focus: { type: 'string', description: '可选: tutorial|template|case 偏重哪类' }, lang: { type: 'string', description: '摘录语言 zh(默认)|en' } },
    async (args) => advisor.ask(args));

  // 5. arch_design_offline
  register('arch_design_offline', '分步引导式架构设计。把「想法」推进成完整方案，一次调用推进一个阶段: clarify→constraints→structure→decisions→roadmap→review。返回: 阶段目标、要与你逐条讨论的问题清单、完成标准、建议阅读。step 必填；context 携带已确认信息以便承接。用户要「一步步把想法推进成完整方案」时，在 arch_ask_offline 之后逐阶段调用本工具。',
    { step: { type: 'string', required: true, description: 'clarify|constraints|structure|decisions|roadmap|review' }, context: { type: 'string', description: '已确认信息摘要，多轮讨论时把结论带进来' } },
    async (args) => advisor.design(args));

  // 6. arch_docs_offline（双规范：旧版 5 类 / GB/T 8567—2006 的 25 类）
  register('arch_docs_offline',
    '文档规范引导，支持两套体系：旧版 5 类（arch/prd/hld/lld/dbd）与 GB/T 8567—2006 的 25 类。'
      + 'docType="list" 返回两套对比与清单，供用户先选体系。'
      + '国标版传编号(1~25)或简称(FAR/SDP/STP/SIP/STrP/OCD/SSS/IRS/SSDD/IDD/SRS/DRD/SDD/DBDD/STD/STR/SCMP/SQAP/DPMR/PDSR/SPS/SVD/SUM/COM/CPM)，'
      + '返回章节骨架、填写要点、代码策略与完成标准；旧版传 arch/prd/hld/lld/dbd。生成文档时严格按骨架组织，并遵守返回的代码策略。',
    {
      docType: { type: 'string', required: true, description: '旧版: arch|prd|hld|lld|dbd；国标: 1~25 或简称；list=两套清单' },
      spec: { type: 'string', required: true, description: '必填：legacy(旧版5类) | gb(国标25类)。未确认体系时不得取骨架' },
      context: { type: 'string', description: '可选：已确认的系统/需求摘要，便于裁剪章节' },
    },
    async (args) => advisor.docs(args));

  // 7. arch_version_offline（文档标识与修订记录，不再建 archive/）
  register('arch_version_offline',
    '文档标识与修订记录规范。文档升版、需要写版本号或补修订记录时调用。输出：文档控制块字段、版本号规则、修订记录表格式、跨文档联动规则。不生成 archive/ 副本——历史由 git 承担。doc 可选指定文档名，next 可选给目标版本号。',
    {
      doc: { type: 'string', description: '文档名或「全部」，默认全部' },
      next: { type: 'string', description: '可选：目标版本号，如 v0.2' },
    },
    async (args) => advisor.version(args));
}
