import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const work = join(root, ".pages-work");
const out = join(root, "out");

const excluded = new Set([
  ".git",
  ".next",
  ".pages-work",
  "cdk.out",
  "coverage",
  "node_modules",
  "out",
  "playwright-report",
  "test-results",
]);

rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

for (const entry of readdirSync(root)) {
  if (excluded.has(entry)) {
    continue;
  }

  cpSync(join(root, entry), join(work, entry), { recursive: true });
}

rmSync(join(work, "src/app/api"), { recursive: true, force: true });

execFileSync("npx", ["prisma", "generate"], {
  cwd: work,
  env: process.env,
  stdio: "inherit",
});

execFileSync("npx", ["next", "build"], {
  cwd: work,
  env: {
    ...process.env,
    STATIC_EXPORT: "true",
  },
  stdio: "inherit",
});

rmSync(out, { recursive: true, force: true });
cpSync(join(work, "out"), out, { recursive: true });

if (existsSync(join(root, "public/.nojekyll"))) {
  copyFileSync(join(root, "public/.nojekyll"), join(out, ".nojekyll"));
}
