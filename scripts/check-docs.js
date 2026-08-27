"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const docsRoot = path.join(root, "docs");
const requiredDocDirectories = ["standards", "specs", "work", "issues", "qa", "release", "reference", "archive"];
const requiredDocs = [
  "AGENTS.md",
  "docs/README.md",
  "docs/standards/production-rules.md",
  "docs/standards/ui-display-rules.md",
  "docs/standards/accessibility-wcag.md",
  "docs/standards/game-art-bible.md",
  "docs/standards/combat-character-render-contract.md",
  "docs/specs/current-game-spec.md",
  "docs/specs/architecture.md",
  "docs/work/active-backlog.md",
  "docs/issues/known-issues.md",
  "docs/qa/qa-test-matrix.md",
  "docs/qa/visual-qa.md",
  "docs/release/README.md",
  "docs/release/platform-and-release.md",
  "docs/reference/reference-integration-audit.md",
  "docs/archive/README.md"
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
  for (const directory of requiredDocDirectories) {
    assert.ok(fs.statSync(path.join(docsRoot, directory)).isDirectory(), `required document category missing: docs/${directory}`);
  }

  const looseDocs = fs.readdirSync(docsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(looseDocs, ["README.md"], "docs root may only contain README.md; categorize every other Markdown file");

  const markdownFiles = collectMarkdown(root);
  assert.ok(markdownFiles.length >= requiredDocs.length, "Markdown inventory is unexpectedly small");
  const brokenLinks = [];
  const replacementCharacters = [];

  for (const file of markdownFiles) {
    const source = fs.readFileSync(file, "utf8");
    const relative = path.relative(root, file).replaceAll(path.sep, "/");
    if (source.includes("\uFFFD")) replacementCharacters.push(path.relative(root, file));
    if (relative.startsWith("docs/archive/") && relative !== "docs/archive/README.md") {
      assert.match(source.slice(0, 600), /ARCHIVED (?:PLAN|EVALUATION)/, `archive document needs a visible archive header: ${relative}`);
    }
    if (relative.startsWith("docs/standards/")) {
      assert.ok(!/^\s*-\s*\[[ xX~]\]/m.test(source), `standards cannot track completion checkboxes: ${relative}`);
    }
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

  const index = fs.readFileSync(path.join(docsRoot, "README.md"), "utf8");
  for (const relative of requiredDocs.filter((item) => item.startsWith("docs/") && item !== "docs/README.md")) {
    const indexTarget = path.relative(path.join(root, "docs"), path.join(root, relative)).replaceAll(path.sep, "/");
    assert.ok(index.includes(indexTarget), `docs/README.md must link authority document: ${relative}`);
  }
  assert.ok(!/本目錄目前共\s*\d+\s*份/.test(index), "docs index must not hard-code a stale Markdown file count");

  console.log(`Documentation check passed: ${markdownFiles.length} Markdown files, no broken local links or replacement characters.`);
  return { markdownFiles: markdownFiles.length };
}

if (require.main === module) runDocChecks();

module.exports = { runDocChecks };
