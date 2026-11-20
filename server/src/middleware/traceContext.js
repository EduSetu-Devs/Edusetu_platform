const crypto = require('crypto');

// Minimal W3C Trace Context support (traceparent) without external dependencies.
// Format: 00-<32 hex trace-id>-<16 hex span-id>-<2 hex flags>

const generateId = (bytes) => crypto.randomBytes(bytes).toString('hex');

const parseTraceparent = (header) => {
  if (typeof header !== 'string') return null;
  const parts = header.trim().split('-');
  if (parts.length !== 4) return null;
  const [version, traceId, parentId, flags] = parts;
  if (version !== '00') return null;
  if (!/^[0-9a-f]{32}$/.test(traceId) || /^0{32}$/.test(traceId)) return null;
  if (!/^[0-9a-f]{16}$/.test(parentId) || /^0{16}$/.test(parentId)) return null;
  if (!/^[0-9a-f]{2}$/.test(flags)) return null;
  return { traceId, parentId, flags };
};

const traceContextMiddleware = (req, res, next) => {
  const parsed = parseTraceparent(req.headers.traceparent);
  const traceId = parsed ? parsed.traceId : generateId(16);
  const spanId = generateId(8);
  const parentSpanId = parsed ? parsed.parentId : undefined;
  const flags = parsed ? parsed.flags : '01';

  req.traceContext = { traceId, spanId, parentSpanId, flags };
  res.setHeader('traceparent', `00-${traceId}-${spanId}-${flags}`);
  next();
};

module.exports = { traceContextMiddleware, parseTraceparent };