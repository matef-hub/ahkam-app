import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = resolve(".");

const directFiles = [
  "server.js",
  "src/index.js",
];

const targetDirs = [
  "src/lib",
  "src/routes",
  "src/ui",
];

const filesToCheck = [...directFiles];

for (const dir of targetDirs) {
  const fullDirPath = join(rootDir, dir);
  try {
    const entries = readdirSync(fullDirPath);
    for (const entry of entries) {
      if (entry.endsWith(".js")) {
        const relativePath = join(dir, entry).replace(/\\/g, "/");
        if (statSync(join(rootDir, relativePath)).isFile()) {
          filesToCheck.push(relativePath);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
    process.exit(1);
  }
}

let hasError = false;

for (const file of filesToCheck) {
  const fullPath = join(rootDir, file);
  const result = spawnSync(process.execPath, ["--check", fullPath], {
    stdio: "pipe",
    encoding: "utf8",
  });

  if (result.status !== 0) {
    hasError = true;
    console.error(`❌ Syntax check failed: ${file}`);
    if (result.stderr) console.error(result.stderr.trim());
    if (result.stdout) console.error(result.stdout.trim());
  } else {
    console.log(`✓ Syntax OK: ${file}`);
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log(`\nAll ${filesToCheck.length} JavaScript files passed syntax verification.`);
}
