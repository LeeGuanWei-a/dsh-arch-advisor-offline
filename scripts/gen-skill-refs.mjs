#!/usr/bin/env node
// 由 lib 下的数据源生成 skill 的 references/*.md。
// 为什么要有这个脚本：目录清单、25 类文档表、两段触发规则都来自同一份数据；
// 手写副本一旦与数据脱节，skill 与插件就会给出不同答案。生成物入库，安装方无需运行。
// 用法: npm run skill:refs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TUT, TUT_EN, TPL, TPL_GROUP, CAS, REPO } from '../lib/catalog.js';
import { CROP_ADVICE, DESIGN, DESIGN_WORKFLOW, DOC_CONTROL_BLOCK, DOC_WORKFLOW, LEGACY_HINT } from '../lib/core.js';
import { CODE_POLICY, DOCS, byStage } from '../lib/docs-gbt.js';
import { LEGACY_DOCS } from '../lib/docs-legacy.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '..', 'skill', 'dsh-arch-advisor-offline', 'references');

const zhTitle = (base) => { const i = base.indexOf('-'); return i >= 0 ? base.slice(i + 1) : base; };
const hasEn = (base) => TUT_EN.has(base.indexOf('-') >= 0 ? base.split('-')[0] : base);
const cell = (v) => String(v === undefined || v === null || v === '' ? '—' : v).replace(/\|/g, '\\|');
// 规则文案里带有 ``` 字样，直接输出会打断 Markdown 渲染，统一转义成行内代码。
const inline = (v) => cell(v).replace(/```/g, '\\`\\`\\`');

function header(title, intro) {
  return [
    '# ' + title,
    '',
    intro,
    '',
    '> 本文件由 `npm run skill:refs` 从 `lib/` 数据源生成，**请勿手改**；要改内容请改数据源后重新生成。',
    '',
  ].join('\n');
}

function catalogMarkdown() {
  const L = [header(
    '知识库总目录（awesome-architecture 离线快照）',
    `来源：\`${REPO}\`（MIT，中英双语）。这是定位用的索引；正文请用 \`arch.mjs read\` 或宿主读文件工具读取 \`content/\` 下同名路径。`,
  )];

  L.push('## 教程 tutorial/（40 章 + T01 专题 + 术语表 + 演进触发信号）');
  L.push('');
  L.push('| id | 编号 | 中文标题 | 英文标题 | 英文版 | 路径 |');
  L.push('| --- | --- | --- | --- | --- | --- |');
  for (const row of TUT) {
    const base = row[0];
    const dashed = base.indexOf('-') >= 0;
    const no = dashed ? base.split('-')[0] : '—';
    const id = dashed ? 'tutorial:' + no : (base.indexOf('术语') >= 0 ? 'tutorial:g' : 'tutorial:s');
    const en = row[1];
    L.push(`| ${cell(id)} | ${cell(no)} | ${cell(zhTitle(base))} | ${cell(en)} | ${hasEn(base) ? '有' : '无'} | \`tutorial/${base}.md\` |`);
  }
  L.push('');
  L.push('术语表 / 演进触发信号是单篇专题，无编号、无英文版；演进触发信号与教程 20 章配合使用。');
  L.push('');

  L.push('## 模板 templates/（31 个 + 1 个专题入口）');
  L.push('');
  L.push('每个模板固定结构：解决什么问题 → 部件与数据流 → 关键决策与权衡 → 规模化死点 → 演进路线 → 真实产品。');
  L.push('');
  L.push('| id | 分组 | 中文标题 | 英文标题 | 关键词 | 路径 |');
  L.push('| --- | --- | --- | --- | --- | --- |');
  TPL.forEach((row, idx) => {
    L.push(`| template:${row[0]} | ${cell(TPL_GROUP[idx])} | ${cell(row[1])} | ${cell(row[2])} | ${cell(row[3])} | \`templates/${row[0]}/README.md\` |`);
  });
  L.push('');
  L.push('英文镜像：同一路径加 `en/` 前缀（`en/templates/<slug>/README.md`）。');
  L.push('');

  L.push('## 案例 cases/（6 个）');
  L.push('');
  L.push('案例读法：起始架构为何合理 → 哪个量化信号逼它升级 → 新架构选了什么、放弃了什么。');
  L.push('');
  L.push('| id | 中文标题 | 英文标题 | 关键词 | 路径 |');
  L.push('| --- | --- | --- | --- | --- |');
  for (const row of CAS) {
    L.push(`| case:${row[0]} | ${cell(row[1])} | ${cell(row[2])} | ${cell(row[3])} | \`cases/${row[0]}/README.md\` |`);
  }
  L.push('');
  return L.join('\n');
}

function docsGbtMarkdown() {
  const L = [header(
    '文档体系参考：GB/T 8567—2006 的 25 类 + 旧版 5 类',
    '生成文档前必须先确认体系（旧版 5 类 / 国标 25 类），再取骨架。本文件是骨架清单与代码策略的速查，具体章节树用 `arch.mjs docs <编号|简称> --spec gb` 获取。',
  )];

  L.push('## 代码策略档位');
  L.push('');
  L.push('| 档位键 | 名称 | 规则 |');
  L.push('| --- | --- | --- |');
  for (const [key, v] of Object.entries(CODE_POLICY)) {
    L.push(`| \`${key}\` | ${cell(v.label)} | ${inline(v.rule)} |`);
  }
  L.push('');
  L.push('「禁止代码」类文档出现 ``` 代码块即判不合格；「仅伪代码」必须标注「伪代码，非交付源码」。');
  L.push('');

  L.push('## 国标 25 类清单（按阶段）');
  L.push('');
  for (const group of byStage()) {
    L.push('### ' + group.stage);
    L.push('');
    L.push('| 编号 | 简称 | 标题 | 代码策略 |');
    L.push('| --- | --- | --- | --- |');
    for (const d of group.docs) {
      L.push(`| ${d.no} | ${d.abbr} | ${cell(d.title)} | ${cell(CODE_POLICY[d.code].label)} |`);
    }
    L.push('');
  }
  L.push(`共 ${DOCS.length} 类。`);
  L.push('');

  L.push('## 裁剪建议（标准第 6 章允许剪裁）');
  L.push('');
  CROP_ADVICE.forEach((ln) => L.push(ln));
  L.push('');

  L.push('## 旧版 5 类 → 国标对应');
  L.push('');
  L.push('| 旧版键 | 标题 | 国标对应 |');
  L.push('| --- | --- | --- |');
  for (const [key, doc] of Object.entries(LEGACY_DOCS)) {
    L.push(`| \`${key}\` | ${cell(doc.title)} | ${cell(LEGACY_HINT[key])} |`);
  }
  L.push('');
  L.push('调用示例：`arch.mjs docs SRS --spec gb`、`arch.mjs docs prd --spec legacy`、`arch.mjs docs list`（两套对比）。');
  L.push('');
  return L.join('\n');
}

function workflowsMarkdown() {
  const L = [header(
    '工作流原文：文档生成与引导式设计',
    'SKILL.md 里是摘要，这里是与 DSH 插件逐字一致的两段触发规则原文，以及六阶段设计的问题清单。拿不准流程细节时读这里。',
  )];

  L.push('## 1. 文档工作流（doc-workflow 原文）');
  L.push('');
  L.push('> ' + inline(DOC_WORKFLOW.text));
  L.push('');
  L.push(`注入名：\`${DOC_WORKFLOW.name}\`，order ${DOC_WORKFLOW.order}。`);
  L.push('');

  L.push('## 2. 设计工作流（design-workflow 原文）');
  L.push('');
  L.push('> ' + inline(DESIGN_WORKFLOW.text));
  L.push('');
  L.push(`注入名：\`${DESIGN_WORKFLOW.name}\`，order ${DESIGN_WORKFLOW.order}。`);
  L.push('');

  L.push('## 3. 六阶段设计的阶段定义');
  L.push('');
  for (const [key, d] of Object.entries(DESIGN)) {
    L.push(`### \`${key}\` · ${d.title}`);
    L.push('');
    L.push('**目标**：' + d.goal);
    L.push('');
    L.push('**要问用户的问题**：');
    L.push('');
    d.questions.forEach((q, i) => L.push(`${i + 1}. ${q}`));
    L.push('');
    L.push('**进入下一阶段的标准**：' + d.done);
    L.push('');
    L.push('**建议阅读**：' + d.refs.map((r) => '`' + r + '`').join(' / '));
    L.push('');
  }

  L.push('## 4. 文档控制块（每份文档开头固定使用）');
  L.push('');
  L.push('```markdown');
  DOC_CONTROL_BLOCK.split('\n').forEach((ln) => L.push(ln));
  L.push('```');
  L.push('');
  L.push('修订记录表紧随其后；升版只追加一行，不建 `archive/` 副本（历史由 git 承担）。');
  L.push('');

  L.push('## 5. 旧版 5 类骨架摘要');
  L.push('');
  for (const [key, doc] of Object.entries(LEGACY_DOCS)) {
    L.push(`### \`${key}\` · ${doc.title}`);
    L.push('');
    L.push('用途：' + doc.usage);
    L.push('');
    L.push('章节：');
    L.push('');
    doc.sections.forEach((sec) => L.push(`- **${sec[0]}** — ${sec[1]}`));
    L.push('');
    L.push('完成标准：');
    L.push('');
    doc.checks.forEach((c, i) => L.push(`${i + 1}. ${c}`));
    L.push('');
    L.push('样例：' + doc.example);
    L.push('');
  }
  return L.join('\n');
}

mkdirSync(OUT_DIR, { recursive: true });
const files = [
  ['catalog.md', catalogMarkdown()],
  ['docs-gbt.md', docsGbtMarkdown()],
  ['workflows.md', workflowsMarkdown()],
];
for (const [name, text] of files) {
  writeFileSync(join(OUT_DIR, name), text, 'utf8');
  process.stdout.write('✓ ' + join('skill', 'dsh-arch-advisor-offline', 'references', name) + ' (' + text.split('\n').length + ' 行)\n');
}
