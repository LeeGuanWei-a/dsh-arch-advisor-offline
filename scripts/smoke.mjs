#!/usr/bin/env node
// 冒烟测试：不联网、不依赖宿主。
// ① 直接测试 lib/core.js 的 7 个能力（插件与 CLI 的共同实现）；
// ② 如果当前环境装了 @deepseek-ai/dsh-tools，再用假 ctx 跑一次 apply()，校验 7 工具 + 2 段 prompt section。
// 用法: npm run smoke
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createAdvisor } from '../lib/core.js';
import { LIB_FILES, SKILL_DIR } from './build-skill.mjs';

const advisor = createAdvisor();
let failed = 0;

function check(label, text, mustContain) {
  const ok = typeof text === 'string' && text.length > 0 && mustContain.every((s) => text.includes(s));
  process.stdout.write((ok ? '✓ ' : '✗ ') + label + (ok ? '' : '\n    期望包含: ' + mustContain.join(' | ') + '\n    实际: ' + String(text).slice(0, 200)) + '\n');
  if (!ok) failed += 1;
}

check('roadmap:', await advisor.roadmap({}), ['Awesome Architecture', '教程', '模板', '案例']);
check('search 支付:', await advisor.search({ q: '支付' }), ['template:payment-system']);
check('search kind=case:', await advisor.search({ q: 'RAG', kind: 'case' }), ['case:documind-rag']);
check('read tutorial:04:', await advisor.read({ ref: 'tutorial:04' }), ['目录', '开头预览']);
check('read 宽松写法:', await advisor.read({ ref: '模板 支付' }), ['支付系统']);
check('read --lang en:', await advisor.read({ ref: 'tutorial:04', lang: 'en' }), ['English']);
check('ask:', await advisor.ask({ question: '企业文档问答 RAG 产品' }), ['建议先读', '下一步']);
check('design clarify:', await advisor.design({ step: 'clarify' }), ['需求澄清', '进入下一阶段标准']);
check('design 非法 step:', await advisor.design({ step: 'nope' }), ['clarify/constraints/structure/decisions/roadmap/review']);
check('docs list:', await advisor.docs({ docType: 'list' }), ['旧版 5 类', '国标版 25 类']);
check('docs 无 spec 闸门:', await advisor.docs({ docType: 'SRS' }), ['未确认文档体系']);
check('docs gb SRS:', await advisor.docs({ docType: 'SRS', spec: 'gb' }), ['软件需求规格说明', '代码策略']);
check('docs gb 编号:', await advisor.docs({ docType: '11', spec: 'gb' }), ['SRS']);
check('docs legacy prd:', await advisor.docs({ docType: 'prd', spec: 'legacy' }), ['需求文档', '旧版规范']);
check('docs 体系传错:', await advisor.docs({ docType: 'prd', spec: 'gb' }), ['spec="legacy"']);
check('version:', await advisor.version({ doc: 'SRS', next: 'v0.2' }), ['修订记录', 'v0.2']);

// ③ skill 自包含副本：与源逐字节一致（不一致说明忘了 npm run skill:sync）
const REPO_ROOT = join(SKILL_DIR, '..', '..');
const skillLib = join(SKILL_DIR, 'lib');
const skillContent = join(SKILL_DIR, 'content');

function walkRel(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkRel(full, base, out);
    else out.push(full.slice(base.length + 1).replace(/\\/g, '/'));
  }
  return out.sort();
}

function diffDir(srcDir, dstDir) {
  const listSrc = walkRel(srcDir);
  const listDst = walkRel(dstDir);
  const problems = [];
  for (const rel of listSrc) {
    if (!existsSync(join(dstDir, rel))) problems.push('缺失: ' + rel);
    else if (!readFileSync(join(srcDir, rel)).equals(readFileSync(join(dstDir, rel)))) problems.push('内容不一致: ' + rel);
  }
  for (const rel of listDst) if (!listSrc.includes(rel)) problems.push('多余: ' + rel);
  return problems;
}

if (!existsSync(skillLib) || !existsSync(skillContent)) {
  process.stdout.write('✗ skill 自包含副本缺失（先跑 npm run skill:sync）\n');
  failed += 1;
} else {
  const srcLib = join(REPO_ROOT, 'lib');
  const skillPkgPath = join(SKILL_DIR, 'package.json');
  let pkgProblems = [];
  if (!existsSync(skillPkgPath)) pkgProblems = ['缺失: skill/package.json'];
  else {
    try {
      const rootPkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
      const skillPkg = JSON.parse(readFileSync(skillPkgPath, 'utf8'));
      if (skillPkg.version !== rootPkg.version) pkgProblems = ['版本号不一致: skill/package.json ' + skillPkg.version + ' ≠ ' + rootPkg.version];
      else if (skillPkg.type !== 'module') pkgProblems = ['type 必须为 module: skill/package.json'];
    } catch (err) {
      pkgProblems = ['无法解析 skill/package.json: ' + err.message];
    }
  }
  const problems = [
    ...LIB_FILES.filter((f) => !existsSync(join(skillLib, f))).map((f) => '缺失: lib/' + f),
    ...LIB_FILES.filter((f) => existsSync(join(skillLib, f)) && !readFileSync(join(srcLib, f)).equals(readFileSync(join(skillLib, f)))).map((f) => '内容不一致: lib/' + f),
    ...diffDir(join(REPO_ROOT, 'content'), skillContent),
    ...pkgProblems,
  ];
  const contentCount = walkRel(skillContent).length;
  const ok = problems.length === 0;
  process.stdout.write((ok ? '✓' : '✗') + ' skill 自包含副本与源一致（lib ' + LIB_FILES.length + ' 个模块，content ' + contentCount + ' 个文件）\n');
  if (!ok) {
    failed += 1;
    problems.slice(0, 5).forEach((p) => process.stdout.write('    ' + p + '\n'));
    process.stdout.write('    修复: npm run skill:sync\n');
  }

  // ④ 只复制 skill 目录的安装场景：直接跑自包含副本
  try {
    const out = execFileSync(process.execPath, [join(SKILL_DIR, 'scripts', 'arch.mjs'), 'where'], { encoding: 'utf8' });
    check('skill 自包含 CLI（只复制 skill 目录也能跑）:', out, ['知识库根', join('skill', 'dsh-arch-advisor-offline', 'content')]);
  } catch (err) {
    process.stdout.write('✗ skill 自包含 CLI 运行失败: ' + String(err.stdout || err.message).slice(0, 300) + '\n');
    failed += 1;
  }
}

// ② 插件层：只在 dsh-tools 可用时跑（发布包不强制安装 peer 依赖）
try {
  const { apply } = await import('../lib/index.js');
  const tools = new Map();
  const sections = [];
  apply({
    tools: { register: (t) => tools.set(t.name, t) },
    systemPrompt: { section: (s) => sections.push(s) },
  });
  const expectTools = ['arch_roadmap_offline', 'arch_search_offline', 'arch_read_offline', 'arch_ask_offline', 'arch_design_offline', 'arch_docs_offline', 'arch_version_offline'];
  const missing = expectTools.filter((n) => !tools.has(n));
  const sectionNames = sections.map((s) => s.name);
  if (missing.length === 0) process.stdout.write('✓ plugin apply: ' + tools.size + ' 工具、' + sections.length + ' 段 prompt section（' + sectionNames.join(', ') + '）\n');
  else { process.stdout.write('✗ plugin apply: 缺工具 ' + missing.join(', ') + '\n'); failed += 1; }
  const orders = sections.map((s) => s.order).sort((a, b) => a - b);
  const orderOk = orders.length === 2 && orders[0] === 5099 && orders[1] === 5100;
  process.stdout.write((orderOk ? '✓' : '✗') + ' plugin apply: section order ' + orders.join('/') + '\n');
  if (!orderOk) failed += 1;
} catch (err) {
  process.stdout.write('· 跳过插件层测试（' + (err && err.code === 'ERR_MODULE_NOT_FOUND' ? '未安装 @deepseek-ai/dsh-tools' : err.message) + '）\n');
}

if (failed > 0) {
  process.stderr.write('\n✗ ' + failed + ' 项失败\n');
  process.exitCode = 1;
} else {
  process.stdout.write('\n✓ 全部通过\n');
}
