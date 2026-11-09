#!/usr/bin/env node
// dsh-arch-advisor-offline · 命令行入口（与 DSH 的 7 个工具同源，纯本地、零网络）。
// 供不支持 DSH 工具的宿主（Agent Skill、脚本、CI）使用：
//   arch-advisor-offline search "支付系统"
//   node lib/cli.js docs SRS --spec gb
// 约定：stdout 只放结果，错误信息走 stderr；退出码 1 = 用法错误，2 = 知识库缺失。
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAdvisor, DEFAULT_CONTENT_DIR } from './core.js';

const SELF = fileURLToPath(import.meta.url);
const PKG_ROOT = join(dirname(SELF), '..');

const USAGE = `dsh-arch-advisor-offline · 离线架构顾问 CLI

用法:
  arch-advisor-offline <command> [参数] [--json]

命令:
  roadmap [--section all|tutorial|template|case]   知识库总览与学习路径
  search <关键词> [--kind tutorial|template|case]   目录检索，返回条目 id
  read <ref> [--lang zh|en] [--full]               读某条目（默认目录+预览；--full 全文）
  ask <描述> [--focus tutorial|template|case] [--lang zh|en]
                                                   想法 → 最相关教程/模板/案例映射
  design <step> [--context "..."]                  分步设计: clarify|constraints|structure|decisions|roadmap|review
  docs <docType> [--spec legacy|gb] [--context "..."]
                                                   文档骨架；docType=list 先看两套体系对比
                                                   spec 必填（legacy 旧版 5 类 / gb 国标 25 类）
  version [--doc 名称] [--next v0.2]               文档标识与修订记录规范
  where                                            打印知识库根路径与内容统计

全局:
  --json    输出 { command, args, text } 结构，便于宿主解析
  --help    显示本帮助
`;

function usageError(msg) {
  process.stderr.write('✗ ' + msg + '\n\n' + USAGE);
  return 1;
}

// 解析 argv：位置参数 + --key value / --key=value / 布尔开关
function parseArgs(argv) {
  const positional = [];
  const opts = {};
  const BOOL = new Set(['full', 'json', 'help']);
  for (let i = 0; i < argv.length; i++) {
    const a = String(argv[i]);
    if (a === '--') { positional.push(...argv.slice(i + 1)); break; }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > 0) { opts[a.slice(2, eq)] = a.slice(eq + 1); continue; }
      const k = a.slice(2);
      if (BOOL.has(k)) { opts[k] = true; continue; }
      const next = argv[i + 1];
      if (next === undefined || String(next).startsWith('--')) { opts[k] = true; continue; }
      opts[k] = String(next);
      i++;
      continue;
    }
    if (a === '-h') { opts.help = true; continue; }
    positional.push(a);
  }
  return { positional, opts };
}

function countMarkdown(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) n += countMarkdown(full);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) n += 1;
  }
  return n;
}

function where(advisor) {
  const pkgPath = join(PKG_ROOT, 'package.json');
  let pkg = {};
  try { pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); } catch { pkg = {}; }
  const L = [];
  L.push('📦 dsh-arch-advisor-offline' + (pkg.version ? ' v' + pkg.version : ''));
  L.push('知识库根: ' + advisor.contentDir);
  L.push('包根:     ' + PKG_ROOT);
  L.push('知识库存在: ' + (existsSync(advisor.contentDir) ? '是' : '否（请检查安装，或设置 ARCH_ADVISOR_ROOT 指向包根）'));
  L.push('Markdown 文件数: ' + countMarkdown(advisor.contentDir));
  L.push('');
  L.push('子目录:');
  for (const sub of ['tutorial', 'templates', 'cases', 'en']) {
    const p = join(advisor.contentDir, sub);
    L.push('  ' + sub.padEnd(10) + (existsSync(p) && statSync(p).isDirectory() ? '✓ ' + countMarkdown(p) + ' 篇' : '✗ 缺失'));
  }
  return L.join('\n');
}

/**
 * 执行一次 CLI 调用。
 * @param {string[]} argv 不含 node 与脚本路径的参数
 * @returns {Promise<number>} 退出码
 */
export async function run(argv) {
  const { positional, opts } = parseArgs(argv || []);
  const asJson = !!opts.json;
  const cmd = positional.shift();
  const rest = positional.join(' ').trim();

  if (!cmd || opts.help || cmd === 'help') {
    process.stdout.write(USAGE);
    return cmd || opts.help ? 0 : 1;
  }

  const advisor = createAdvisor(process.env.ARCH_ADVISOR_ROOT
    ? { contentDir: join(process.env.ARCH_ADVISOR_ROOT, 'content') }
    : {});

  // 知识库缺失时明确报错，避免宿主拿到「条目未包含在离线包中」这类误导性提示。
  if (!existsSync(advisor.contentDir)) {
    process.stderr.write('✗ 未找到知识库目录: ' + advisor.contentDir + '\n'
      + '  修复方式（任选其一）:\n'
      + '  1) 用软链把 skill 目录指回本包: mklink /J <技能目录> "' + join(PKG_ROOT, 'skill', 'dsh-arch-advisor-offline') + '"（Windows）或 ln -s\n'
      + '  2) 复制整个包（含 content/ 与 lib/），不要只复制 skill 子目录\n'
      + '  3) 设置环境变量 ARCH_ADVISOR_ROOT 指向包含 content/ 与 lib/ 的包根\n');
    return 2;
  }

  let text;
  switch (cmd) {
    case 'roadmap':
      text = await advisor.roadmap({ section: opts.section || 'all' });
      break;
    case 'search': {
      const q = rest || opts.q || opts.question || '';
      if (!q) return usageError('search 需要一个关键词，例如: search 支付系统');
      text = await advisor.search({ q, kind: opts.kind || 'all' });
      break;
    }
    case 'read': {
      const ref = rest || opts.ref || '';
      if (!ref) return usageError('read 需要一个 ref，例如: read tutorial:04');
      text = await advisor.read({ ref, lang: opts.lang || 'zh', full: !!opts.full });
      break;
    }
    case 'ask': {
      const question = rest || opts.question || '';
      if (!question) return usageError('ask 需要一段描述，例如: ask 多租户工单 SaaS');
      text = await advisor.ask({ question, focus: opts.focus || 'all', lang: opts.lang || 'zh' });
      break;
    }
    case 'design': {
      const step = (positional[0] || opts.step || '').toString().trim();
      if (!step) return usageError('design 需要 step: clarify|constraints|structure|decisions|roadmap|review');
      text = await advisor.design({ step, context: opts.context });
      break;
    }
    case 'docs': {
      const docType = (positional[0] || opts.docType || opts.type || '').toString().trim();
      if (!docType) return usageError('docs 需要 docType（list 看两套体系对比；国标传编号或简称，旧版传 arch/prd/hld/lld/dbd）');
      text = await advisor.docs({ docType, spec: opts.spec, context: opts.context });
      break;
    }
    case 'version':
      text = await advisor.version({ doc: opts.doc, next: opts.next });
      break;
    case 'where':
      text = where(advisor);
      break;
    default:
      return usageError('未知命令: ' + cmd);
  }

  if (asJson) {
    process.stdout.write(JSON.stringify({ command: cmd, args: { ...opts, positional }, text }, null, 2) + '\n');
  } else {
    process.stdout.write(text + '\n');
  }
  return 0;
}

// 直接执行（bin / node lib/cli.js）时跑一次；被 skill 脚本动态 import 时只导出 run。
// 用 realpath 比较：npm 在 macOS/Linux 上把 bin 做成软链，argv[1] 是软链路径而非真实文件。
function isMain() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(SELF);
  } catch {
    return false;
  }
}

if (isMain()) {
  process.exitCode = await run(process.argv.slice(2));
}
