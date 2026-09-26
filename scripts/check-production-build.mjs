#!/usr/bin/env node
/**
 * Build-time guard: where will a deployed build actually send its API calls?
 *
 * Vite inlines env vars at build time, and the browser hides cross-origin
 * failures from JavaScript, so a wrong API base ships silently and looks like
 * "the backend is not responding" rather than a config error. This runs before
 * `npm run build` (package.json "prebuild") and fails the build instead.
 *
 * It validates the two ways a deployed build can reach the backend:
 *   1. the same-origin proxy: /api/* must be forwarded to the deployed backend
 *      by vercel.json, so the request is same-origin and CORS never applies
 *   2. VITE_API_DIRECT_URL: an absolute https backend called directly, which
 *      then depends on that backend allowing the site's origin through CORS
 *
 * This file lives INSIDE the frontend project on purpose. Vercel builds with the
 * frontend directory as the project root, so a script under ../scripts is not
 * part of the deployment and the build dies with "Cannot find module".
 *
 *   npm run build                                          # runs automatically
 *   node scripts/check-production-build.mjs                # run it on its own
 *   node scripts/check-production-build.mjs --allow-local  # for LAN builds
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// This file is <frontend>/scripts/check-production-build.mjs
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.join(HERE, '..');
const ENV_FILE = path.join(FRONTEND, '.env.production');
const API_BASE_FILE = path.join(FRONTEND, 'src', 'utils', 'apiBase.js');
const VERCEL_FILE = path.join(FRONTEND, 'vercel.json');
const ALLOW_LOCAL = process.argv.includes('--allow-local');

/** Read the constants the app itself uses, so this guard cannot drift from it. */
function readApiBaseConstants() {
  const source = fs.existsSync(API_BASE_FILE) ? fs.readFileSync(API_BASE_FILE, 'utf8') : '';
  const pick = (name) => {
    const match = source.match(new RegExp(`${name}\\s*=\\s*'([^']+)'`));
    return match ? match[1].trim().replace(/\/+$/, '') : null;
  };
  return { proxy: pick('PROXY_PATH'), deployed: pick('PRODUCTION_API_URL') };
}

/** Values from frontend/.env.production, if it exists. */
function readEnvFile() {
  const vars = {};
  if (!fs.existsSync(ENV_FILE)) return vars;
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (match) vars[match[1]] = match[2];
  }
  return vars;
}

const { proxy, deployed } = readApiBaseConstants();
const envVars = readEnvFile();
const directOverride = (process.env.VITE_API_DIRECT_URL || envVars.VITE_API_DIRECT_URL || '')
  .trim().replace(/\/+$/, '');
const devOverride = (process.env.VITE_API_URL || envVars.VITE_API_URL || '').trim();

const problems = [];
const notes = [];

if (!proxy) problems.push('src/utils/apiBase.js does not define PROXY_PATH, so a deployed build has no API base');
if (!deployed) problems.push('src/utils/apiBase.js does not define PRODUCTION_API_URL');
if (deployed && !/^https:\/\//i.test(deployed)) {
  problems.push('PRODUCTION_API_URL is not an https URL, which a deployed HTTPS page would refuse as mixed content');
}
if (deployed && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(deployed) && !ALLOW_LOCAL) {
  problems.push('PRODUCTION_API_URL points at localhost, which no visitor but you can reach');
}

/** The proxy only helps if vercel.json actually forwards it. */
function proxyWiring() {
  if (!fs.existsSync(VERCEL_FILE)) return { ok: false, detail: 'vercel.json is missing' };
  let config;
  try {
    config = JSON.parse(fs.readFileSync(VERCEL_FILE, 'utf8'));
  } catch (err) {
    return { ok: false, detail: `vercel.json is not valid JSON (${err.message})` };
  }
  const rewrites = Array.isArray(config.rewrites) ? config.rewrites : [];
  const rule = rewrites.find((r) => typeof r.source === 'string' && proxy && r.source.startsWith(proxy));
  if (!rule) return { ok: false, detail: `no rewrite forwards ${proxy}/*` };
  const destination = String(rule.destination || '');
  if (deployed && destination.startsWith(deployed)) {
    return { ok: true, detail: `${rule.source} -> ${destination}` };
  }
  return { ok: false, detail: `the ${rule.source} rewrite points at ${destination || 'nothing'}` };
}

let servedBy;
let proxyDetail = '';
if (directOverride) {
  servedBy = directOverride;
  if (!/^https?:\/\//i.test(directOverride)) {
    problems.push('VITE_API_DIRECT_URL is not an absolute URL');
  }
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(directOverride) && !ALLOW_LOCAL) {
    problems.push('VITE_API_DIRECT_URL points at localhost, which no visitor but you can reach');
  }
  if (/^http:\/\//i.test(directOverride) && !ALLOW_LOCAL) {
    problems.push('VITE_API_DIRECT_URL is plain http, which a deployed HTTPS page would block as mixed content');
  }
  notes.push('VITE_API_DIRECT_URL bypasses the same-origin proxy, so this build depends on the backend allowing the site origin through CORS');
} else {
  servedBy = proxy || '/api';
  const wiring = proxyWiring();
  proxyDetail = wiring.detail;
  if (!wiring.ok) {
    problems.push(`a deployed build would request ${servedBy}/... from the frontend domain, but vercel.json does not forward it to the backend (${wiring.detail})`);
  }
}

console.log(`[build-check] deployed API base : ${servedBy}${directOverride ? ' (direct)' : ' (same-origin proxy)'}`);
if (!directOverride) console.log(`[build-check] proxy wiring      : ${proxyDetail}`);
console.log(`[build-check] backend           : ${deployed || '(not defined)'}`);
console.log(`[build-check] fallback          : ${directOverride ? '(disabled: this build is already direct)' : `${deployed} (tried only if the proxy fails)`}`);
if (devOverride) {
  console.log(`[build-check] dev override      : ${devOverride} (development builds only, never used in production)`);
}

if (problems.length) {
  console.error('\n[build-check] BUILD STOPPED, a deployed build would not be able to load results:');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nFix src/utils/apiBase.js or vercel.json, then rebuild. Use --allow-local only');
  console.error('if you really are building for a LAN address.\n');
  process.exit(1);
}

for (const note of notes) console.log(`[build-check] note              : ${note}`);
console.log('[build-check] ok, every visitor reaches the deployed backend\n');
