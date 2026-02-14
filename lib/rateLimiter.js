'use strict';

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function createRateLimiter(options = {}) {
  const windowMs = toPositiveInt(options.windowMs, 60000);
  const max = toPositiveInt(options.max, 60);
  const keyPrefix = options.keyPrefix || 'global';
  const hits = new Map();
  let lastCleanup = Date.now();

  return function rateLimiter(req, res, next) {
    if (req.method === 'OPTIONS') return next();

    const now = Date.now();
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${clientIp}`;

    if (now - lastCleanup > windowMs) {
      for (const [entryKey, entry] of hits.entries()) {
        if (entry.resetTime <= now) hits.delete(entryKey);
      }
      lastCleanup = now;
    }

    let entry = hits.get(key);
    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime: now + windowMs };
    }

    entry.count += 1;
    hits.set(key, entry);

    const remaining = Math.max(0, max - entry.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: 'Demasiadas peticiones. Inténtalo más tarde.'
      });
    }

    next();
  };
}

module.exports = {
  createRateLimiter,
  toPositiveInt
};
