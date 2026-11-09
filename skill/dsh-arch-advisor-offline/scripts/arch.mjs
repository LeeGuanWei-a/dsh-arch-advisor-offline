#!/usr/bin/env node
// dsh-arch-advisor-offline · skill 薄包装。
// 只做一件事：定位 CLI（lib/cli.js）并把参数原样透传，不复制任何业务逻辑 ——
// 这样 skill、DSH 插件、终端命令三个入口天然同源，不会出现两份实现漂移。
//
// 定位顺序（自包含优先，逐步降级）：
//   ① ARCH_ADVISOR_ROOT（跨机、非常规安装位置的兜底）；
//   ② skill 目录内的自包含副本 skill/dsh-arch-advisor-offline/lib/cli.js
//      —— 由 scripts/build-skill.mjs 生成并入库，所以「只复制 skill 目录」也能安装；
//   ③ 向上查找包根的 lib/cli.js（在仓库内开发、整包复制、软链进宿主技能目录都命中）；
//   ④ npm 模块解析（作为依赖或全局安装时）。
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)); // .../skill/dsh-arch-advisor-offline/scripts
const SKILL_DIR = resolve(HERE, '..');

function fromRoot(root, how) {
  const cli = join(root, 'lib', 'cli.js');
  const content = join(root, 'content');
  return existsSync(cli) ? { cli, root, how, hasContent: existsSync(content) } : null;
}

function findByWalkingUp() {
  let dir = HERE;
  for (let i = 0; i < 8; i++) {
    const hit = fromRoot(dir, '向上查找包根');
    if (hit) return hit;
    const up = resolve(dir, '..');
    if (up === dir) break;
    dir = up;
  }
  return null;
}

async function resolveCli() {
  // ① 显式指定（跨机复制、非常规安装位置时的兜底）
  if (process.env.ARCH_ADVISOR_ROOT) {
    const hit = fromRoot(resolve(process.env.ARCH_ADVISOR_ROOT), 'ARCH_ADVISOR_ROOT');
    if (hit) return hit;
  }
  // ② skill 自包含副本：只复制本目录即可用
  const local = fromRoot(SKILL_DIR, 'skill 自包含副本');
  if (local) return local;
  // ③ 向上查找（仓库内 / 整包复制 / 软链三种情形都命中）
  const walked = findByWalkingUp();
  if (walked) return walked;
  // ④ 模块解析（npm 安装到 node_modules 或全局）
  try {
    const url = await import.meta.resolve('dsh-arch-advisor-offline/lib/cli.js');
    if (typeof url === 'string' && url.startsWith('file:')) {
      const cli = fileURLToPath(url);
      if (existsSync(cli)) return { cli, root: resolve(cli, '..', '..'), how: 'npm 模块解析', hasContent: true };
    }
  } catch {
    // 未安装成包，落到下面的报错
  }
  return null;
}

const hit = await resolveCli();
if (!hit) {
  process.stderr.write(
    '✗ 找不到知识库（lib/cli.js 与 content/）。\n'
    + '  本 skill 是自包含的：`lib/` 与 `content/` 应与 SKILL.md 同在 skill 目录下。\n'
    + '  看起来这次安装只复制了部分文件，或复制时漏掉了子目录。\n'
    + '\n修复方式（任选其一）：\n'
    + '  1) 重新复制整个 skill 目录（含 lib/ 与 content/，约 3.5MB）\n'
    + '  2) 在包根执行 npm run skill:sync 重新生成自包含副本后，再复制\n'
    + '  3) 改用软链/目录联接，指向包内 skill 目录（升级后自动生效）\n'
    + '     Windows: mklink /J "<宿主技能目录>\\dsh-arch-advisor-offline" "<包根>\\skill\\dsh-arch-advisor-offline"\n'
    + '     macOS/Linux: ln -s "<包根>/skill/dsh-arch-advisor-offline" "<宿主技能目录>/dsh-arch-advisor-offline"\n'
    + '  4) 设置环境变量 ARCH_ADVISOR_ROOT=<包根>（含 lib/ 与 content/ 的目录）\n'
    + '\n当前 skill 目录: ' + SKILL_DIR + '\n',
  );
  process.exit(2);
}

if (!hit.hasContent) {
  process.stderr.write(
    '✗ 找到了 ' + hit.cli + '，但缺少配套的 content/ 知识库目录。\n'
    + '  修复：删除后重新复制整个 skill 目录，或在包根执行 npm run skill:sync。\n'
    + '  根目录: ' + hit.root + '\n',
  );
  process.exit(2);
}

const { run } = await import(pathToFileURL(hit.cli).href);
const code = await run(process.argv.slice(2));
process.exitCode = code;
