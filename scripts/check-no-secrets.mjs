import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ignored = new Set([".git", "node_modules", "dist"]);
const suspicious = [
  /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /\b(seed phrase|mnemonic)\s*[:=]\s*["'][^"']+["']/i,
  /\b(private[_-]?key|secret[_-]?key|api[_-]?key)\s*[:=]\s*["'][^"']{12,}["']/i
];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (ignored.has(entry)) continue;
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      walk(path);
      continue;
    }
    if (!/\.(md|mjs|json|ts|tsx|js)$/.test(entry)) continue;
    const text = readFileSync(path, "utf8");
    for (const pattern of suspicious) {
      if (pattern.test(text)) {
        throw new Error(`Potential secret found in ${path}`);
      }
    }
  }
}

walk(process.cwd());
console.log("No obvious secrets detected.");
