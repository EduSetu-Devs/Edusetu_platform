const crypto = require('crypto');

const SESSION_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'edusetu_session';
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'edusetu_csrf';
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const isProduction = () => process.env.NODE_ENV === 'production';

const parseDurationMs = (value, fallback = DEFAULT_MAX_AGE_MS) => {
  if (!value) return fallback;
  if (/^\d+$/.test(String(value))) return Number(value) * 1000;

  const match = String(value).trim().match(/^(\d+)\s*(s|m|h|d)$/i);
  if (!match) return fallback;

  const amount = Number(match[1]);
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * unitMs[match[2].toLowerCase()];
};

const getCookieMaxAgeMs = () => parseDurationMs(process.env.JWT_EXPIRES_IN || '7d');

const getSameSite = () => {
  const configured = String(process.env.AUTH_COOKIE_SAMESITE || 'lax').toLowerCase();
  return ['lax', 'strict', 'none'].includes(configured) ? configured : 'lax';
};

const shouldUseSecureCookie = () => {
  if (process.env.AUTH_COOKIE_SECURE === 'true') return true;
  if (process.env.AUTH_COOKIE_SECURE === 'false' && !isProduction()) return false;
  return isProduction() || getSameSite() === 'none';
};

const serializeCookie = (name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);

  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge / 1000))}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite[0].toUpperCase()}${options.sameSite.slice(1)}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);

  return parts.join('; ');
};

const buildCookieOptions = ({ httpOnly }) => ({
  httpOnly,
  secure: shouldUseSecureCookie(),
  sameSite: getSameSite(),
  domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
  maxAge: getCookieMaxAgeMs()
});

const parseCookies = (reqOrHeaders) => {
  const header = reqOrHeaders?.headers?.cookie || reqOrHeaders?.headers?.Cookie || reqOrHeaders?.cookie || '';
  const cookies = {};

  if (!header || typeof header !== 'string') return cookies;

  for (const pair of header.split(';')) {
    const separator = pair.indexOf('=');
    if (separator === -1) continue;
    const name = pair.slice(0, separator).trim();
    if (!name) continue;
    const rawValue = pair.slice(separator + 1).trim();
    try {
      cookies[name] = decodeURIComponent(rawValue);
    } catch {
      cookies[name] = rawValue;
    }
  }

  return cookies;
};

const setAuthCookies = (res, token) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const sessionOptions = buildCookieOptions({ httpOnly: true });
  const csrfOptions = buildCookieOptions({ httpOnly: false });

  res.setHeader('Set-Cookie', [
    serializeCookie(SESSION_COOKIE_NAME, token, sessionOptions),
    serializeCookie(CSRF_COOKIE_NAME, csrfToken, csrfOptions)
  ]);

  return csrfToken;
};

const refreshCsrfCookie = (res) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.setHeader('Set-Cookie', [
    serializeCookie(CSRF_COOKIE_NAME, csrfToken, buildCookieOptions({ httpOnly: false }))
  ]);
  return csrfToken;
};

const clearAuthCookies = (res) => {
  const base = { maxAge: 0, domain: process.env.AUTH_COOKIE_DOMAIN || undefined };
  res.setHeader('Set-Cookie', [
    serializeCookie(SESSION_COOKIE_NAME, '', { ...base, httpOnly: true, secure: shouldUseSecureCookie(), sameSite: getSameSite() }),
    serializeCookie(CSRF_COOKIE_NAME, '', { ...base, httpOnly: false, secure: shouldUseSecureCookie(), sameSite: getSameSite() })
  ]);
};

const timingSafeStringEqual = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

/**
 * Double-submit CSRF protection for cookie-authenticated state-changing requests.
 * Bearer-token requests are exempt because browsers do not attach them automatically.
 */
const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.headers.authorization?.startsWith('Bearer ')) return next();

  const cookies = parseCookies(req);
  if (!cookies[SESSION_COOKIE_NAME]) return next();

  const headerToken = req.get('x-csrf-token') || req.get('x-xsrf-token');
  if (!headerToken || !cookies[CSRF_COOKIE_NAME] || !timingSafeStringEqual(headerToken, cookies[CSRF_COOKIE_NAME])) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token. Refresh the page and try again.',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  return next();
};

module.exports = {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  parseCookies,
  setAuthCookies,
  refreshCsrfCookie,
  clearAuthCookies,
  csrfProtection,
  timingSafeStringEqual,
  getCookieMaxAgeMs,
  shouldUseSecureCookie
};
