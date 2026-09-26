#!/usr/bin/env node
/**
 * Build-time guard: what backend URL will this build actually call?
 *
 * Vite injects VITE_API_URL at build time, so a wrong value silently ships a
 * site that talks to localhost (which worked only on the machine running the
 * backend, and looked like "results feed offline" everywhere else). This runs
 * automatically before `npm run build` (package.json "prebuild") and fails the
 * build instead of shipping a broken site.
 *
 * This file lives INSIDE the frontend project on purpose. Vercel builds with
 * the frontend directory as the project root, so a script under ../scripts is
 * not part of the deployment and the build dies with
 * "Cannot find module '/vercel/scripts/check-production-build.mjs'".
 *
 *   npm run build                                        # runs automatically
 *   node scripts/check-production-build.mjs              # run it on its own
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
const ALLOW_LOCAL = process.argv.includes('--allow-local');

/**
 * The fallback the app itself uses, read from source so this guard can never
 * drift away from what the bundle actually does.
 */
function readAppFallback() {
  try {
    const source = fs.readFileSync(API_BASE_FILE, 'utf8');
    const match = source.match(/PRODUCTION_API_URL\s*=\s*'([^']+)'/);
    return match ? match[1].trim().replace(/\/+$/, '') : null;
  } catch {
    return null;
  }
}

/** The value Vite will inline: process env first, then .env.production. */
function readBuildEnvUrl() {
  if (process.env.VITE_API_URL) {
    return { url: process.env.VITE_API_URL, source: 'process.env.VITE_API_URL' };
  }
  if (fs.existsSync(ENV_FILE)) {
    for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*VITE_API_URL\s*=\s*(.+?)\s*$/);
      if (match) return { url: match[1], source: path.relative(FRONTEND, ENV_FILE) };
    }
  }
  return { url: '', source: 'not set, using the fallback in src/utils/apiBase.js' };
}

const { url, source } = readBuildEnvUrl();
const cleaned = url ? url.trim().replace(/\/+$/, '') : '';
const appFallback = readAppFallback();
const FALLBACK = appFallback || 'https://nfl-prediction-backend.onrender.com';
const resolved = cleaned || FALLBACK;

const problems = [];
if (resolved.startsWith('/')) {
  problems.push('it is a relative path, so it would hit the frontend domain itself');
}
if (!/^https?:\/\//i.test(resolved)) problems.push('it is not an absolute URL');
if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(resolved) && !ALLOW_LOCAL) {
  problems.push('it points at localhost, which no visitor but you can reach');
}
if (/^http:\/\//i.test(resolved) && !ALLOW_LOCAL) {
  problems.push('it is plain http; a deployed HTTPS page would block it as mixed content');
}
if (appFallback && FALLBACK === appFallback && /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(appFallback) && !ALLOW_LOCAL) {
  problems.push('the app fallback in src/utils/apiBase.js points at localhost');
}

console.log(`[build-check] API base for visitors : ${resolved}`);
console.log(`[build-check] source                : ${source}`);
console.log(`[build-check] app fallback          : ${appFallback || '(could not read src/utils/apiBase.js)'}`);

if (problems.length) {
  console.error('\n[build-check] BUILD STOPPED, the production frontend would not be able to load results:');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nFix VITE_API_URL in Vercel (Settings -> Environment Variables) or in');
  console.error('frontend/.env.production, then redeploy. Use --allow-local only if you');
  console.error('really are building for a LAN address.\n');
  process.exit(1);
}

console.log('[build-check] ok, every visitor will call the deployed backend\n');
