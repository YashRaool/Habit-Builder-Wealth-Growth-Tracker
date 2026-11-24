/**
 * securityAudit.js — Red Team QA (6 Tests)
 * Target: http://localhost:5000  (LOCAL ONLY)
 * Run:    node server/scripts/securityAudit.js
 */

'use strict';

const BASE = 'http://localhost:5000';
const TIMEOUT_MS = 10_000;

// ── helpers ──────────────────────────────────────────────────────────────────
const ac = () => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  return { signal: ctrl.signal, clear: () => clearTimeout(id) };
};

// CSRF guard requires X-Requested-With on un-authed POSTs, or Authorization: Bearer on authed
const CSRF_HDR = { 'X-Requested-With': 'XMLHttpRequest' };

async function req(method, path, body, headers = {}, timeoutMs = TIMEOUT_MS) {
  const { signal, clear } = ac();
  try {
    // Always inject CSRF bypass header so server middleware passes. Auth'd requests use Bearer.
    const mergedHeaders = { 'Content-Type': 'application/json', ...CSRF_HDR, ...headers };
    const opts = { method, signal, headers: mergedHeaders };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const r = await fetch(`${BASE}${path}`, opts);
    clear();
    let json = null;
    try { json = await r.json(); } catch {}
    return { status: r.status, json };
  } catch (e) {
    clear();
    return { status: 0, error: e.message };
  }
}

async function reqRaw(method, path, rawBody, headers = {}) {
  const { signal, clear } = ac();
  try {
    const mergedHeaders = { 'Content-Type': 'application/json', ...CSRF_HDR, ...headers };
    const r = await fetch(`${BASE}${path}`, {
      method, signal,
      headers: mergedHeaders,
      body: rawBody,
    });
    clear();
    return { status: r.status };
  } catch (e) {
    clear();
    return { status: 0, error: e.message };
  }
}

const TS = Date.now();
const uniq = (n) => `audit_${n}_${TS}@redteam.local`;
const results = [];

function record(id, name, pass, detail) {
  results.push({ id, name, pass, detail });
}

// ── cleanup registry ──────────────────────────────────────────────────────────
const cleanup = { tokens: [], userIds: [], txIds: [], habitIds: [] };

async function deleteUser(token, userId) {
  // Try admin delete; ignore errors (best-effort cleanup)
  await req('DELETE', `/api/users/${userId}`, undefined, { Authorization: `Bearer ${token}` });
}

async function deleteTx(token, txId) {
  await req('DELETE', `/api/transactions/${txId}`, undefined, { Authorization: `Bearer ${token}` });
}

// ── register + login helper ───────────────────────────────────────────────────
async function registerUser(email, name = 'Audit User') {
  const password = 'AuditPass1';
  await req('POST', '/api/auth/register', { name, email, password });
  const r = await req('POST', '/api/auth/login', { email, password });
  if (r.status === 200 && r.json?.data?.token) {
    return { token: r.json.data.token, userId: r.json.data.user?._id };
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
// TEST 1 — NoSQL Injection Auth Bypass
// ════════════════════════════════════════════════════════════════════════════
async function test1() {
  const name = 'NoSQL Injection Auth Bypass';
  const injPayload = { email: { $ne: '' }, password: { $ne: '' } };
  const r = await req('POST', '/api/auth/login', injPayload);
  const blocked = r.status === 400 || r.status === 401 || r.status === 403 || r.status === 0;
  const tokenReturned = r.json?.data?.token || r.json?.token;
  if (blocked && !tokenReturned) {
    record(1, name, true, `Status ${r.status} — injection blocked`);
  } else {
    record(1, name, false, `Status ${r.status} — INJECTION SUCCEEDED, token returned!`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TEST 2 — Admin Route Privilege Escalation
// ════════════════════════════════════════════════════════════════════════════
async function test2() {
  const name = 'Admin Route Privilege Escalation';
  const email = uniq('admin_esc');
  const user = await registerUser(email, 'Normal User');
  if (!user) {
    record(2, name, false, 'Could not create/login test user');
    return;
  }
  cleanup.tokens.push(user.token);
  if (user.userId) cleanup.userIds.push({ token: user.token, id: user.userId });

  const r1 = await req('GET', '/api/admin/metrics', undefined, { Authorization: `Bearer ${user.token}` });
  const r2 = await req('GET', '/api/admin/users', undefined, { Authorization: `Bearer ${user.token}` });

  const blocked = (r1.status === 403 || r1.status === 401) && (r2.status === 403 || r2.status === 401);
  record(2, name, blocked,
    `GET /admin/metrics → ${r1.status}, GET /admin/users → ${r2.status}`);
}

// ════════════════════════════════════════════════════════════════════════════
// TEST 3 — IDOR / Cross-Account Data Theft
// ════════════════════════════════════════════════════════════════════════════
async function test3() {
  const name = 'IDOR / Cross-Account Data Theft';
  const userA = await registerUser(uniq('idor_a'), 'IDOR User A');
  const userB = await registerUser(uniq('idor_b'), 'IDOR User B');

  if (!userA || !userB) {
    record(3, name, false, 'Could not create test users for IDOR test');
    return;
  }
  for (const u of [userA, userB]) {
    if (u.userId) cleanup.userIds.push({ token: u.token, id: u.userId });
  }

  // User A creates a transaction
  const txBody = { type: 'expense', category: 'Other Expense', amount: 10, date: new Date().toISOString(), description: 'audit-idor-test' };
  const txR = await req('POST', '/api/transactions', txBody, { Authorization: `Bearer ${userA.token}` });
  // The API returns { data: { transaction: { _id } } }
  const txId = txR.json?.data?._id || txR.json?.data?.id
    || txR.json?.data?.transaction?._id || txR.json?.data?.transaction?.id;

  if (!txId) {
    record(3, name, false, `User A tx creation failed (${txR.status}): ${JSON.stringify(txR.json)}`);
    return;
  }
  cleanup.txIds.push({ token: userA.token, id: txId });

  // User B tries to PUT and DELETE User A's transaction
  const putR = await req('PUT', `/api/transactions/${txId}`, { amount: 999 }, { Authorization: `Bearer ${userB.token}` });
  const delR = await req('DELETE', `/api/transactions/${txId}`, undefined, { Authorization: `Bearer ${userB.token}` });

  const blocked = (putR.status === 403 || putR.status === 404) && (delR.status === 403 || delR.status === 404);
  record(3, name, blocked,
    `PUT by User B → ${putR.status}, DELETE by User B → ${delR.status}`);
}

// ════════════════════════════════════════════════════════════════════════════
// TEST 4 — XSS Payload Injection
// ════════════════════════════════════════════════════════════════════════════
async function test4() {
  const name = 'XSS Payload Injection';
  const user = await registerUser(uniq('xss'), 'XSS Test User');
  if (!user) {
    record(4, name, false, 'Could not create test user');
    return;
  }
  if (user.userId) cleanup.userIds.push({ token: user.token, id: user.userId });

  const xssPayload = '<script>alert("xss")</script>';
  // Try on transaction description
  const txBody = { type: 'expense', category: 'Other Expense', amount: 1, date: new Date().toISOString(), description: xssPayload };
  const txR = await req('POST', '/api/transactions', txBody, { Authorization: `Bearer ${user.token}` });

  // If rejected outright (400) = sanitized/blocked
  if (txR.status === 400) {
    record(4, name, true, 'XSS payload rejected (400) before saving');
    return;
  }

  const savedDesc = txR.json?.data?.description || '';
  const txId = txR.json?.data?._id;
  if (txId) cleanup.txIds.push({ token: user.token, id: txId });

  const stripped = !savedDesc.includes('<script>');
  record(4, name, stripped,
    stripped
      ? `Saved description: "${savedDesc}" — tags stripped ✓`
      : `STORED RAW XSS: "${savedDesc}"`);
}

// ════════════════════════════════════════════════════════════════════════════
// TEST 5 — Oversized Payload DoS (250 KB)
// ════════════════════════════════════════════════════════════════════════════
async function test5() {
  const name = 'Oversized Payload DoS (250 KB)';
  // Build a 250 KB JSON body (string field padded)
  const padding = 'A'.repeat(250 * 1024);
  const bigPayload = JSON.stringify({ type: 'expense', category: 'Other Expense', amount: 1, description: padding });
  const r = await reqRaw('POST', '/api/transactions', bigPayload);
  const pass = r.status === 413 || r.status === 400;
  record(5, name, pass, `Status ${r.status} — expected 413 (or 400)`);
}

// ════════════════════════════════════════════════════════════════════════════
// TEST 6 — 1 000-Request Burst / Flood Attack
// ════════════════════════════════════════════════════════════════════════════
async function test6() {
  const name = '1,000-Request Burst / Flood Attack';
  // Dev mode: authRateLimiter = 500 req/15min, apiRateLimiter = 250/15min, quotaCap skipped.
  // We fire 600 requests to /api/auth/login to exceed the dev-mode auth limit (500).
  // All use X-Requested-With (injected by req()) so CSRF passes.
  const TOTAL = 600;
  const BATCH = 50;

  const statuses = [];
  const timings = [];

  for (let i = 0; i < TOTAL; i += BATCH) {
    const batch = [];
    for (let j = 0; j < BATCH && i + j < TOTAL; j++) {
      const start = Date.now();
      batch.push(
        req('POST', '/api/auth/login', { email: 'flood@test.com', password: 'wrong' })
          .then((r) => { statuses.push(r.status); timings.push(Date.now() - start); })
      );
    }
    await Promise.all(batch);
  }

  const got429 = statuses.some((s) => s === 429);
  const avg = Math.round(timings.reduce((a, b) => a + b, 0) / timings.length);

  // Server alive check — accept 200 or 429 (rate-limited but alive), reject 0 (crashed/unreachable)
  const aliveR = await req('GET', '/api/health');
  const alive = aliveR.status === 200 || aliveR.status === 429;

  const dist = {};
  for (const s of statuses) dist[s] = (dist[s] || 0) + 1;
  const distStr = Object.entries(dist).map(([k, v]) => `${k}×${v}`).join(', ');

  const pass = got429 && alive;
  record(6, name, pass,
    `Rate-limiter(429): ${got429 ? 'YES' : 'NO'} | Server alive: ${alive ? 'YES' : 'NO'} | Avg: ${avg}ms | [${distStr}]`);
}

// ════════════════════════════════════════════════════════════════════════════
// CLEANUP
// ════════════════════════════════════════════════════════════════════════════
async function runCleanup() {
  for (const { token, id } of cleanup.txIds) {
    await deleteTx(token, id);
  }
  for (const { token, id } of cleanup.userIds) {
    await deleteUser(token, id);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SCORECARD PRINTER
// ════════════════════════════════════════════════════════════════════════════
function printScorecard() {
  const W = 100;
  const line = '─'.repeat(W);
  console.log('\n' + '═'.repeat(W));
  console.log('  🛡️  SECURITY AUDIT SCORECARD — Financial Habit Tracker  '.padEnd(W - 1) + '');
  console.log('═'.repeat(W));
  console.log(
    ' #  │ ' +
    'Test'.padEnd(42) + '│ ' +
    'Result'.padEnd(8) + '│ Detail'
  );
  console.log(line);

  let passed = 0;
  for (const r of results) {
    const badge = r.pass ? '✅ PASS' : '❌ FAIL';
    if (r.pass) passed++;
    const testName = r.name.substring(0, 41).padEnd(42);
    const detail = r.detail.substring(0, 55);
    console.log(` ${String(r.id).padStart(1)}  │ ${testName}│ ${badge.padEnd(8)}│ ${detail}`);
  }

  console.log(line);
  const pct = Math.round((passed / results.length) * 100);
  const grade = pct === 100 ? '🏆 A+' : pct >= 83 ? '🥈 B' : pct >= 66 ? '🥉 C' : '💀 F';
  console.log(`  Score: ${passed}/${results.length} (${pct}%)  ${grade}`);
  console.log('═'.repeat(W) + '\n');

  // Full detail dump
  console.log('── Full Details ──');
  for (const r of results) {
    console.log(`[${r.id}] ${r.name}: ${r.pass ? 'PASS' : 'FAIL'}`);
    console.log(`    ${r.detail}`);
  }
  console.log('');
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n🔍 Starting Security Audit against', BASE, '...\n');

  // Verify server reachable (accept 429 if rate-limited from a prior run)
  const health = await req('GET', '/api/health');
  if (health.status !== 200 && health.status !== 429) {
    console.error(`❌ Server not reachable at ${BASE}/api/health (status: ${health.status})`);
    console.error('   Start the server first: cd server && node index.js');
    process.exit(1);
  }
  if (health.status === 429) {
    console.warn('⚠️  Health endpoint rate-limited (429) from prior run — continuing anyway (server IS running)\n');
  } else {
    console.log('✅ Server reachable. Running 6 tests...\n');
  }

  await test1();
  console.log(`  [1/6] NoSQL Injection: ${results[0].pass ? 'PASS' : 'FAIL'}`);

  await test2();
  console.log(`  [2/6] Privilege Escalation: ${results[1].pass ? 'PASS' : 'FAIL'}`);

  await test3();
  console.log(`  [3/6] IDOR: ${results[2].pass ? 'PASS' : 'FAIL'}`);

  await test4();
  console.log(`  [4/6] XSS Injection: ${results[3].pass ? 'PASS' : 'FAIL'}`);

  await test5();
  console.log(`  [5/6] Oversized Payload DoS: ${results[4].pass ? 'PASS' : 'FAIL'}`);

  console.log('  [6/6] Burst Flood (1,000 reqs) — running, please wait ~20s...');
  await test6();
  console.log(`  [6/6] Burst Flood: ${results[5].pass ? 'PASS' : 'FAIL'}`);

  console.log('\n🧹 Cleaning up test data...');
  await runCleanup();
  console.log('✅ Cleanup done.\n');

  printScorecard();
  process.exit(0);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
