"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const requiredDocs = [
  "AGENTS.md",
  "docs/README.md",
  "docs/production-rules.md",
  "docs/ui-display-rules.md",
  "docs/platform-and-release.md",
  "docs/accessibility-wcag.md",
  "docs/current-game-spec.md",
  "docs/issues-and-prevention.md",
  "docs/qa-test-matrix.md",
  "docs/visual-qa.md",
  "docs/reference-integration-audit.md",
  "docs/combat-character-render-contract.md"
];

function collectMarkdown(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", ".agents", ".codex", "node_modules", "www", "android"].includes(entry.name)) return [];
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectMarkdown(absolute);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".md") ? [absolute] : [];
  });
}

function stripCodeFences(source) {
  return source.replace(/```[\s\S]*?```/g, "");
}

function localLinkTarget(rawTarget) {
  let target = rawTarget.trim();
  if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
  target = target.split(/\s+["']/)[0].split("#")[0];
  if (!target || target.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(target)) return null;
  return decodeURIComponent(target);
}

function runDocChecks() {
  for (const relative of requiredDocs) {
    assert.ok(fs.existsSync(path.join(root, relative)), `required authority document missing: ${relative}`);
  }

  const markdownFiles = collectMarkdown(root);
  assert.ok(markdownFiles.length >= requiredDocs.length, "Markdown inventory is unexpectedly small");
  const brokenLinks = [];
  const replacementCharacters = [];

  for (const file of markdownFiles) {
    const source = fs.readFileSync(file, "utf8");
    if (source.includes("\uFFFD")) replacementCharacters.push(path.relative(root, file));
    const content = stripCodeFences(source);
    const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
    for (const match of content.matchAll(linkPattern)) {
      const target = localLinkTarget(match[1]);
      if (!target) continue;
      const resolved = path.resolve(path.dirname(file), target);
      if (!fs.existsSync(resolved)) {
        brokenLinks.push(`${path.relative(root, file)} -> ${target}`);
      }
    }
  }

  assert.deepEqual(replacementCharacters, [], `UTF-8 replacement characters found: ${replacementCharacters.join(", ")}`);
  assert.deepEqual(brokenLinks, [], `broken local Markdown links:\n${brokenLinks.join("\n")}`);

  const index = fs.readFileSync(path.join(root, "docs", "README.md"), "utf8");
  for (const relative of requiredDocs.filter((item) => item.startsWith("docs/") && item !== "docs/README.md")) {
    assert.ok(index.includes(path.basename(relative)), `docs/README.md must link authority document: ${relative}`);
  }
  assert.ok(!/本目錄目前共\s*\d+\s*份/.test(index), "docs index must not hard-code a stale Markdown file count");

  console.log(`Documentation check passed: ${markdownFiles.length} Markdown files, no broken local links or replacement characters.`);
  return { markdownFiles: markdownFiles.length };
}

if (require.main === module) runDocChecks();

module.exports = { runDocChecks };
