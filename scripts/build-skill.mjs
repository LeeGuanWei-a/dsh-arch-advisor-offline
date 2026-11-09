#!/usr/bin/env node
// 把 skill 目录做成「自包含」：复制 lib 的运行子集 + content 到 skill/dsh-arch-advisor-offline/。
//
// 为什么需要：宿主（Claude Code / CodeBuddy 等）通常只允许把 **skill 目录本身** 拷进技能目录，
// 不会带上包根的 content/ 与 lib/。若不复制，单纯复制 skill 目录就会报「找不到知识库包」。
// 复制物入库（从 GitHub 直接下载目录也能用），并由 npm run smoke 做漂移校验，源仍是包根一份。
//
// 用法: npm run skill:sync（npm pack / publish 前会自动执行 prepack）
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
export const SKILL_DIR = join(ROOT, 'skill', 'dsh-arch-advisor-offline');

// 只复制运行必需的模块：index.js 是 DSH 插件入口（依赖 @deepseek-ai/dsh-tools），skill 用不到。
export const LIB_FILES = ['cli.js', 'core.js', 'catalog.js', 'docs-gbt.js', 'docs-legacy.js'];

export const SYNC_MARKER = [
  '# 本目录由 scripts/build-skill.mjs 生成，请勿手改',
  '',
  '`skill/dsh-arch-advisor-offline/lib/` 与 `skill/dsh-arch-advisor-offline/content/` 是包根同名目录的副本，',
  '目的是让「复制 skill 目录即可安装」成立。要改内容请改包根的 `lib/`、`content/`，然后运行：',
  '',
  '```sh',
  'npm run skill:sync',
  '```',
  '',
  '`npm run smoke` 会校验副本与源是否一致（不一致即失败）。',
  '',
].join('\n');

function dirSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += dirSize(full);
    else if (entry.isFile()) total += statSync(full).size;
  }
  return total;
}

export function syncSkill() {
  const srcLib = join(ROOT, 'lib');
  const srcContent = join(ROOT, 'content');
  const dstLib = join(SKILL_DIR, 'lib');
  const dstContent = join(SKILL_DIR, 'content');

  if (!existsSync(srcContent)) throw new Error('源 content/ 不存在，无法同步');
  for (const f of LIB_FILES) {
    if (!existsSync(join(srcLib, f))) throw new Error('源 lib/' + f + ' 不存在，无法同步');
  }

  rmSync(dstLib, { recursive: true, force: true });
  rmSync(dstContent, { recursive: true, force: true });
  mkdirSync(dstLib, { recursive: true });
  for (const f of LIB_FILES) cpSync(join(srcLib, f), join(dstLib, f));
  writeFileSync(join(dstLib, 'README.md'), SYNC_MARKER, 'utf8');
  cpSync(srcContent, dstContent, { recursive: true });

  // 独立安装后 skill 目录没有 package.json，Node 会按 CommonJS 试探并告警，`where` 也读不到版本号。
  // 这里放一份最小 package.json（type=module + 版本），让副本脱离包根也能安静运行。
  const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  writeFileSync(join(SKILL_DIR, 'package.json'), JSON.stringify({
    name: rootPkg.name,
    version: rootPkg.version,
    type: 'module',
    private: true,
    description: rootPkg.description,
  }, null, 2) + '\n', 'utf8');

  return { libFiles: LIB_FILES.length, bytes: dirSize(dstContent), version: rootPkg.version };
}

function main() {
  const out = syncSkill();
  const mb = (out.bytes / 1024 / 1024).toFixed(1);
  process.stdout.write('✓ skill 自包含同步完成: skill/dsh-arch-advisor-offline/{lib,content}\n');
  process.stdout.write('  lib: ' + out.libFiles + ' 个模块 + README.md\n');
  process.stdout.write('  content: ' + mb + ' MB\n');
}

// 直接执行才同步；被其他脚本 import（例如取 LIB_FILES 做漂移校验）时保持无副作用。
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main();
}
