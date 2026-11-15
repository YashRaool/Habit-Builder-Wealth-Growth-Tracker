'use strict';

/**
 * security.js — Parts 1 & 2 of production security checklist
 * - NoSQL/SQL injection protection
 * - XSS / input sanitization
 * - File upload / payload validation
 * - Security headers (X-Content-Type-Options, HSTS, COOP, etc.)
 * - CSRF guard (X-Requested-With on mutating requests)
 * - IP rate limiters (auth + general)
 * - Circuit-breaker / quota cap
 */

const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// ── ObjectId param guard ──────────────────────────────────────────────────────

/**
 * validateObjectId — rejects requests where :id is not a valid MongoDB ObjectId.
 * Mount per-router: router.param('id', validateObjectId)
 */
function validateObjectId(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid resource ID.' });
  }
  next();
}

// ── Constants ───────────────────────────────────────────────────────────────
const MAX_STRING_LEN = 2000;
const MAX_AVATAR_B64_BYTES = 500 * 1024; // 500 KB
const SAFE_B64_IMAGE_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
const SAFE_HTTPS_IMAGE_RE = /^https:\/\/.+\.(png|jpe?g|webp|gif)(\?.*)?$/i;

const SQL_PATTERNS = [
  /--/,
  /;\s*drop\s+/i,
  /union\s+select\s/i,
  /'\s*or\s*'1'\s*=\s*'1/i,
  /xp_cmdshell/i,
];

const XSS_TOKENS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript\s*:/gi,
  /on(error|load|click|mouse\w+|focus|blur|change|submit|key\w+)\s*=/gi,
  /<\/?(?:script|iframe|object|embed|form|input|button|link|meta|style|base)[^>]*>/gi,
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Recursively strip dangerous object keys (NoSQL injection via $ / dot keys) */
function sanitizeObject(obj, depth = 0) {
  if (depth > 10 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => sanitizeObject(v, depth + 1));

  const clean = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) continue; // drop operator / dot keys
    clean[key] = sanitizeObject(obj[key], depth + 1);
  }
  return clean;
}

/** Sanitize a single string — strip XSS tokens & enforce length */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  let s = str.slice(0, MAX_STRING_LEN);
  for (const re of XSS_TOKENS) s = s.replace(re, '');
  return s;
}

/** Recursively sanitize all strings inside an object */
function sanitizeStrings(obj, depth = 0) {
  if (depth > 10) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map((v) => sanitizeStrings(v, depth + 1));
  if (obj !== null && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = sanitizeStrings(obj[k], depth + 1);
    return out;
  }
  return obj;
}

/** Check a flat string map (req.query / req.params) for SQL meta-patterns */
function hasSQLInjection(value) {
  if (typeof value !== 'string') return false;
  return SQL_PATTERNS.some((re) => re.test(value));
}

function checkQueryForSQL(queryObj) {
  for (const v of Object.values(queryObj || {})) {
    if (hasSQLInjection(v)) return true;
  }
  return false;
}

/** Validate avatar / image field anywhere in body */
function validateImageField(value) {
  if (typeof value !== 'string') return true; // not a string — not our concern here
  if (value === '') return true; // allow clearing

  // Block SVG, HTML, executable extensions
  if (/\.(svg|html?|js|php|exe|sh)(\?|$)/i.test(value)) return false;

  // Allow safe https image URL
  if (value.startsWith('https://')) return SAFE_HTTPS_IMAGE_RE.test(value);

  // Allow safe base64 image under 500 KB
  if (value.startsWith('data:')) {
    if (!SAFE_B64_IMAGE_RE.test(value)) return false;
    const base64Data = value.split(',')[1] || '';
    return base64Data.length * 0.75 <= MAX_AVATAR_B64_BYTES;
  }

  return false; // anything else is rejected
}

function validateImagesInBody(obj, depth = 0) {
  if (depth > 5 || obj === null || typeof obj !== 'object') return true;
  for (const [key, value] of Object.entries(obj)) {
    if (/avatar|photo|image|picture|logo/i.test(key)) {
      if (!validateImageField(value)) return false;
    } else if (typeof value === 'object') {
      if (!validateImagesInBody(value, depth + 1)) return false;
    }
  }
  return true;
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * noSQLInjection — strips $-prefixed / dot keys from body, query, params
 */
function noSQLInjection(req, res, next) {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
}

/**
 * sqlInjectionGuard — blocks SQL meta-patterns in query params
 */
function sqlInjectionGuard(req, res, next) {
  if (checkQueryForSQL(req.query) || checkQueryForSQL(req.params)) {
    return res.status(400).json({ success: false, message: 'Invalid request parameters.' });
  }
  next();
}

/**
 * xssSanitizer — strips XSS vectors from body & query strings
 */
function xssSanitizer(req, res, next) {
  if (req.body) req.body = sanitizeStrings(req.body);
  if (req.query) req.query = sanitizeStrings(req.query);
  next();
}

/**
 * fileUploadGuard — validates avatar/image fields in request body
 */
function fileUploadGuard(req, res, next) {
  if (req.body && !validateImagesInBody(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid image. Only https:// image URLs or safe base64 images under 500 KB are accepted.',
    });
  }
  next();
}

// ── Security Headers ─────────────────────────────────────────────────────────

/**
 * securityHeaders — sets hardened HTTP response headers.
 * Note: COOP is set to same-origin-allow-popups to preserve Google OAuth popup.
 */
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.removeHeader('X-Powered-By'); // fingerprint removal
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

// ── CSRF Guard ────────────────────────────────────────────────────────────────

/**
 * csrfGuard — requires state-changing requests to carry either
 * X-Requested-With: XMLHttpRequest  OR  Authorization: Bearer <token>.
 * Skips GET / HEAD / OPTIONS.
 */
function csrfGuard(req, res, next) {
  const MUTATING = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!MUTATING.includes(req.method)) return next();

  const hasXRW = req.headers['x-requested-with'] === 'XMLHttpRequest';
  const hasBearer =
    req.headers.authorization && req.headers.authorization.startsWith('Bearer ');

  if (!hasXRW && !hasBearer) {
    return res.status(403).json({ success: false, message: 'Forbidden: missing CSRF token.' });
  }
  next();
}

// ── Rate Limiters ─────────────────────────────────────────────────────────────

/** Strict limiter for auth endpoints: 25 req / 15 min per IP */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 500 : 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
  keyGenerator: (req) => req.ip,
});

/** General API limiter: 250 req / 15 min per IP */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  keyGenerator: (req) => req.ip,
});

// ── Circuit Breaker / Quota Cap ───────────────────────────────────────────────

/**
 * requestQuotaCap — hard per-IP cap (500 req / 5 min) to block runaway
 * automated spikes before they exhaust DB / OAuth quotas.
 */
const requestQuotaCap = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Request quota exceeded. Automated access is not permitted.' },
  keyGenerator: (req) => req.ip,
  skip: () => process.env.NODE_ENV === 'development',
});

module.exports = {
  noSQLInjection,
  sqlInjectionGuard,
  xssSanitizer,
  fileUploadGuard,
  securityHeaders,
  csrfGuard,
  authRateLimiter,
  apiRateLimiter,
  requestQuotaCap,
  validateObjectId,
};

