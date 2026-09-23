#!/usr/bin/env node
// Validates data/certifications.json. Plain Node, no dependencies.
// Usage: node scripts/validate.mjs [path/to/certifications.json] [--fail-if-stale]
//
// Also warns when meta.lastChecked is more than STALE_MONTHS old. With --fail-if-stale
// that warning becomes an error (exit code 2); the monthly workflow uses this.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const failIfStale = args.includes("--fail-if-stale");
const file = args.find(a => !a.startsWith("--")) || join(root, "data", "certifications.json");
const shown = relative(process.cwd(), file) || file;

const REQUIRED = ["code", "name", "vendor", "domain", "level", "price", "status", "source", "url", "what", "before"];
// index.html has a colour variable (--c-<key>) and an icon (ICONS) for exactly these domains
const DOMAIN_KEYS = ["ana", "auto", "agile", "spec", "sec", "a11y", "ai", "mgmt"];
const STATUSES = ["active", "new", "beta", "prereq"];
const SOURCES = ["vendor", "reports"];
// Prices without a USD amount. The page shows these as written; everything else needs "$<number>".
const PRICE_TEXTS = ["Free", "See vendor", "Varies by exam board", "No separate exam"];
const STALE_MONTHS = 6;

const errors = [];
const fail = msg => errors.push(msg);
const isText = v => typeof v === "string" && v.trim() !== "";

let data;
try {
  data = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error(`✗ ${shown}: could not read or parse JSON.\n  ${e.message}`);
  process.exit(1);
}

// meta
if (!data.meta || !/^\d{4}-(0[1-9]|1[0-2])$/.test(data.meta.lastChecked ?? "")) {
  fail(`meta.lastChecked must be a "YYYY-MM" string (got ${JSON.stringify(data.meta?.lastChecked)}).`);
}

// domains
const domainKeys = new Set();
if (!Array.isArray(data.domains) || data.domains.length === 0) {
  fail(`"domains" must be a non-empty array.`);
} else {
  data.domains.forEach((d, i) => {
    for (const f of ["key", "name", "proves"]) if (!isText(d?.[f])) fail(`domains[${i}] is missing "${f}".`);
    if (isText(d?.key) && !DOMAIN_KEYS.includes(d.key)) {
      fail(`domains[${i}]: key "${d.key}" is not one of: ${DOMAIN_KEYS.join(", ")} (a new domain also needs a colour and icon in index.html).`);
    }
    if (domainKeys.has(d?.key)) fail(`domains[${i}]: duplicate key "${d.key}".`);
    domainKeys.add(d?.key);
  });
}

// levels
const levelNums = new Set();
if (!Array.isArray(data.levels) || data.levels.length === 0) {
  fail(`"levels" must be a non-empty array.`);
} else {
  data.levels.forEach((l, i) => {
    if (!Number.isInteger(l?.level)) fail(`levels[${i}]: "level" must be an integer.`);
    for (const f of ["name", "description"]) if (!isText(l?.[f])) fail(`levels[${i}] is missing "${f}".`);
    if (levelNums.has(l?.level)) fail(`levels[${i}]: duplicate level ${l.level}.`);
    levelNums.add(l?.level);
  });
}

// certifications
const codes = new Map();
if (!Array.isArray(data.certifications) || data.certifications.length === 0) {
  fail(`"certifications" must be a non-empty array.`);
} else {
  data.certifications.forEach((c, i) => {
    const where = `certifications[${i}]${isText(c?.code) ? ` (${c.code})` : ""}`;
    for (const f of REQUIRED) {
      const v = c?.[f];
      if (f === "level" ? v === undefined : !isText(v)) fail(`${where}: missing or empty "${f}".`);
    }
    for (const f of Object.keys(c ?? {})) if (!REQUIRED.includes(f)) fail(`${where}: unknown field "${f}".`);
    if (c?.domain !== undefined && !domainKeys.has(c.domain)) {
      fail(`${where}: domain "${c.domain}" is not one of: ${[...domainKeys].join(", ")}.`);
    }
    if (c?.level !== undefined && !levelNums.has(c.level)) {
      fail(`${where}: level ${JSON.stringify(c.level)} is not one of: ${[...levelNums].join(", ")} (use a number, not a string).`);
    }
    if (c?.status !== undefined && !STATUSES.includes(c.status)) {
      fail(`${where}: status "${c.status}" must be one of: ${STATUSES.join(", ")}.`);
    }
    if (c?.source !== undefined && !SOURCES.includes(c.source)) {
      fail(`${where}: source "${c.source}" must be one of: ${SOURCES.join(", ")}.`);
    }
    if (isText(c?.price) && !(PRICE_TEXTS.includes(c.price) || /\$\d/.test(c.price))) {
      fail(`${where}: price "${c.price}" must be one of ${PRICE_TEXTS.map(t => `"${t}"`).join(", ")}, or contain a USD amount like "$150".`);
    }
    if (isText(c?.price) && /[€£¥₹]/.test(c.price)) {
      fail(`${where}: price "${c.price}" must be in USD; the page converts it to other currencies.`);
    }
    if (typeof c?.url === "string" && !c.url.startsWith("https://")) {
      fail(`${where}: url must start with https:// (got "${c.url}").`);
    }
    if (isText(c?.code)) {
      if (codes.has(c.code)) fail(`${where}: code "${c.code}" is already used by certifications[${codes.get(c.code)}].`);
      else codes.set(c.code, i);
    }
  });
}

if (errors.length) {
  console.error(`✗ ${shown}: ${errors.length} problem${errors.length === 1 ? "" : "s"} found\n`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

const certs = data.certifications;
const shownCount = certs.filter(c => c.status !== "prereq").length;
console.log(`✓ ${shown} is valid: ${shownCount} certifications (+${certs.length - shownCount} prerequisite), ${data.domains.length} domains, ${data.levels.length} levels.`);

// Staleness
const [y, m] = data.meta.lastChecked.split("-").map(Number);
const now = new Date();
const age = (now.getFullYear() * 12 + now.getMonth() + 1) - (y * 12 + m);
if (age > STALE_MONTHS) {
  console.warn(`⚠ Data was last checked ${age} months ago (${data.meta.lastChecked}). Re-check the certifications against vendor pages and update meta.lastChecked.`);
  if (failIfStale) process.exit(2);
} else {
  console.log(`  Last checked ${data.meta.lastChecked} (${age} month${age === 1 ? "" : "s"} ago).`);
}
