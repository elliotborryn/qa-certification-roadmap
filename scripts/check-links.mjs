#!/usr/bin/env node
// Checks that every certification URL in data/certifications.json still loads.
// Plain Node 18+, no dependencies.
// Usage: node scripts/check-links.mjs [--report report.md]
//
// Exit code 1 if any link is broken (404/410, DNS failure, timeout...).
// Links that answer 401/403/429 are listed as "blocked": vendor sites often
// refuse automated requests, so check those by hand before treating them as dead.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

// Some vendor sites (e.g. tricentis.com) send more than Node's default 16 KB of response
// headers, which fetch rejects. Re-run this script once with a larger limit.
const HEADER_FLAG = "--max-http-header-size=65536";
if (!process.execArgv.includes(HEADER_FLAG)) {
  const { status } = spawnSync(process.execPath, [...process.execArgv, HEADER_FLAG, fileURLToPath(import.meta.url), ...process.argv.slice(2)], { stdio: "inherit" });
  process.exit(status ?? 1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const reportPath = args.includes("--report") ? args[args.indexOf("--report") + 1] : null;
const data = JSON.parse(readFileSync(join(root, "data", "certifications.json"), "utf8"));

const HEADERS = {
  // A regular browser user agent: some vendor sites stall requests from obvious bots
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,*/*;q=0.8",
};
const BLOCKED = new Set([401, 403, 405, 429, 999]);

// One request per unique URL; remember which certifications use it
const byUrl = new Map();
for (const c of data.certifications) byUrl.set(c.url, [...(byUrl.get(c.url) || []), c.code]);

async function request(url, method) {
  const res = await fetch(url, { method, headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(20000) });
  res.body?.cancel().catch(() => {});
  return res.status;
}
async function check(url) {
  try {
    let status = await request(url, "HEAD");
    if (status >= 400) status = await request(url, "GET"); // some servers reject HEAD
    if (status < 400) return { kind: "ok", status };
    return { kind: BLOCKED.has(status) ? "blocked" : "broken", status };
  } catch (e) {
    return { kind: "broken", status: e.name === "TimeoutError" ? "timeout" : (e.cause?.code || e.message) };
  }
}

const results = [];
const urls = [...byUrl.keys()];
for (let i = 0; i < urls.length; i += 6) {
  results.push(...await Promise.all(urls.slice(i, i + 6).map(async url => ({ url, codes: byUrl.get(url), ...await check(url) }))));
}

const line = r => `- ${r.codes.join(", ")}: ${r.url} (${r.status})`;
const broken = results.filter(r => r.kind === "broken");
const blocked = results.filter(r => r.kind === "blocked");
const ok = results.length - broken.length - blocked.length;

console.log(`Checked ${results.length} unique URLs: ${ok} ok, ${blocked.length} blocked, ${broken.length} broken.`);
if (blocked.length) console.log(`\nBlocked (probably bot protection; check by hand):\n${blocked.map(line).join("\n")}`);
if (broken.length) console.error(`\n✗ Broken:\n${broken.map(line).join("\n")}`);

if (reportPath) {
  const md = [
    `The monthly link check found **${broken.length}** broken link${broken.length === 1 ? "" : "s"} in \`data/certifications.json\`.`,
    "", "### Broken", ...broken.map(line),
    ...(blocked.length ? ["", "### Blocked (probably bot protection, check by hand)", ...blocked.map(line)] : []),
    "", "Find the new official page for each certification (or confirm it was retired), update the data, and run `node scripts/validate.mjs`.",
    "", "With Claude Code, ask: *\"Fix the broken certification links from this issue.\"*",
  ].join("\n");
  writeFileSync(reportPath, md + "\n");
}
process.exit(broken.length ? 1 : 0);
