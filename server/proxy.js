import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
// Diagnostic check in case module resolution changes
if (typeof createProxyMiddleware !== 'function') {
  console.error('[proxy] createProxyMiddleware import is not a function. Actual type:', typeof createProxyMiddleware);
}
import crypto from 'crypto';

// Robust development proxy using http-proxy-middleware
// Goal: Allow embedding external sites inside an <iframe> during local dev.
// Features:
//  - Dynamic target via ?url= full absolute URL
//  - Strips/rewrites frame-blocking headers (X-Frame-Options, CSP frame-ancestors)
//  - Removes Set-Cookie (avoid credential leakage between origins in dev)
//  - Adds permissive dev-only CSP: frame-ancestors *
//  - Adds permissive CORS headers (Access-Control-Allow-Origin: *)
//  - Detailed, correlated logging of each request lifecycle stage
//  - Host allowlist (env ALLOW_PROXY_HOSTS, comma separated) optional
//  - Graceful error handling & clear diagnostics

const app = express();
const PORT = process.env.PORT || 3001;
const LOG_LEVEL = (process.env.LOG_LEVEL || 'debug').toLowerCase();
const ALLOW_HOSTS = (process.env.ALLOW_PROXY_HOSTS || '')
  .split(',')
  .map(h => h.trim())
  .filter(Boolean);

// --- Utility logging helpers -------------------------------------------------
const levels = ['error','warn','info','debug','trace'];
function shouldLog(level) {
  const idx = levels.indexOf(level);
  const base = levels.indexOf(LOG_LEVEL);
  return idx <= base || LOG_LEVEL === 'trace';
}
function log(level, id, msg, meta) {
  if (!shouldLog(level)) return;
  const time = new Date().toISOString();
  const prefix = `[proxy][${time}][${id}][${level.toUpperCase()}]`;
  if (meta) console.log(prefix, msg, meta); else console.log(prefix, msg);
}

process.on('uncaughtException', err => log('error','process','uncaughtException', {err}));
process.on('unhandledRejection', (reason) => log('error','process','unhandledRejection', {reason}));

// --- Core helpers ------------------------------------------------------------
function parseTarget(raw) {
  try {
    if (!raw) return null;
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) return null; // only http/https
    return u;
  } catch { return null; }
}

function hostAllowed(hostname) {
  if (ALLOW_HOSTS.length === 0) return true; // open if no allowlist
  return ALLOW_HOSTS.some(pattern => {
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1); // remove *
      return hostname.endsWith(suffix);
    }
    return hostname === pattern;
  });
}

function sanitizeHeadersForIframe(headers) {
  const h = { ...headers };
  const removeList = [
    'x-frame-options','X-Frame-Options',
    'content-security-policy','content-security-policy-report-only'
  ];
  for (const k of removeList) delete h[k];
  // Remove frame-ancestors from an existing CSP if present
  if (headers['content-security-policy']) {
    const csp = headers['content-security-policy'];
    const newCsp = csp
      .split(';')
      .map(part => part.trim())
      .filter(part => !/^frame-ancestors\b/i.test(part))
      .join('; ');
    if (newCsp) h['content-security-policy'] = newCsp + '; frame-ancestors *';
    else h['content-security-policy'] = 'frame-ancestors *';
  } else {
    h['content-security-policy'] = 'frame-ancestors *';
  }
  delete h['set-cookie'];
  return h;
}

function addDevCors(headers) {
  headers['access-control-allow-origin'] = '*';
  headers['access-control-allow-credentials'] = 'false';
  headers['access-control-allow-methods'] = 'GET,HEAD,OPTIONS';
  headers['access-control-allow-headers'] = '*';
  headers['cross-origin-resource-policy'] = 'cross-origin';
  return headers;
}

// Lightweight request id
function newReqId() { return crypto.randomBytes(4).toString('hex'); }

// --- Global header sanitization (safety net) ---------------------------------
// Ensures NO route ever leaks an X-Frame-Options header; also guarantees a
// permissive frame-ancestors directive even for non-proxied routes so that
// accidental navigation to / (root) won't trigger iframe denial.
app.use((req, res, next) => {
  const id = newReqId();
  const origWriteHead = res.writeHead;
  res.writeHead = function patchedWriteHead(statusCode, headers) {
    // Normalize & strip X-Frame-Options supplied via writeHead call
    if (headers) {
      for (const k of Object.keys(headers)) {
        if (k.toLowerCase() === 'x-frame-options') {
          log('debug', id, 'Stripping X-Frame-Options from writeHead headers', { route: req.originalUrl });
          delete headers[k];
        }
      }
    }
    // Remove any header set earlier
    if (this.getHeader('X-Frame-Options')) {
      log('debug', id, 'Removing pre-existing X-Frame-Options header', { route: req.originalUrl });
      this.removeHeader('X-Frame-Options');
    }
    // Guarantee CSP frame-ancestors * (append if existing)
    const existingCsp = this.getHeader('Content-Security-Policy');
    if (existingCsp && !/frame-ancestors/i.test(String(existingCsp))) {
      this.setHeader('Content-Security-Policy', String(existingCsp) + '; frame-ancestors *');
    } else if (!existingCsp) {
      this.setHeader('Content-Security-Policy', 'frame-ancestors *');
    }
    return origWriteHead.apply(this, arguments);
  };
  next();
});

// Quick health endpoint
app.get('/ping', (_req, res) => res.send('ok'));

// We handle OPTIONS early for CORS preflight (though iframe loads usually GET)
app.options('/proxy', (req, res) => {
  const id = newReqId();
  log('debug', id, 'OPTIONS preflight received');
  res.set(addDevCors({})).status(204).end();
});

// Dynamic proxy endpoint: /proxy?url=<encoded absolute URL>
app.use('/proxy', (req, res, next) => {
  const id = newReqId();
  const raw = req.query.url;
  const targetUrl = parseTarget(raw);
  if (!targetUrl) {
    log('warn', id, 'Invalid or missing target url param', { raw });
    return res.status(400).json({ error: 'Invalid or missing ?url (must be absolute http/https URL)' });
  }
  if (!hostAllowed(targetUrl.hostname)) {
    log('warn', id, 'Target host not allowed', { host: targetUrl.hostname });
    return res.status(403).json({ error: 'Target host not allowed in dev proxy' });
  }

  // Attach metadata to req for downstream router/pathRewrite/onProxyRes
  req._proxyMeta = { id, targetUrl };
  log('info', id, 'Incoming proxy request', {
    method: req.method,
    originalUrl: req.originalUrl,
    target: targetUrl.href,
    headers: req.headers,
  });
  next();
},
createProxyMiddleware({
  target: 'http://placeholder', // will be overridden by router
  changeOrigin: true,
  ws: false,
  followRedirects: true,
  selfHandleResponse: false, // we only tweak headers, streaming stays internal
  secure: false, // allow self-signed in dev (adjust if needed)
  // Dynamically pick origin (protocol + host)
  router: (req) => {
    const { targetUrl } = req._proxyMeta || {};
    return targetUrl ? `${targetUrl.protocol}//${targetUrl.host}` : 'http://invalid';
  },
  pathRewrite: (path, req) => {
    const { targetUrl } = req._proxyMeta || {};
    if (!targetUrl) return path; // fallback
    return targetUrl.pathname + targetUrl.search; // exact path+query from target
  },
  onProxyReq: (proxyReq, req, res) => {
    const { id, targetUrl } = req._proxyMeta || {};
    log('debug', id, 'onProxyReq start', {
      target: targetUrl && targetUrl.href,
      headers: proxyReq.getHeaders(),
    });
    // Optionally remove Accept-Encoding to simplify (leave as-is by default)
    // proxyReq.removeHeader('accept-encoding');
  },
  onProxyRes: (proxyRes, req, res) => {
    const { id, targetUrl } = req._proxyMeta || {};
    const originalHeaders = { ...proxyRes.headers };
    // Sanitize for iframe embedding
    const sanitized = sanitizeHeadersForIframe(originalHeaders);
    addDevCors(sanitized);
    // Apply sanitized headers back onto proxyRes
    for (const hName of Object.keys(proxyRes.headers)) delete proxyRes.headers[hName];
    for (const [k,v] of Object.entries(sanitized)) {
      if (v !== undefined && v !== null) proxyRes.headers[k] = v;
    }
    log('info', id, 'onProxyRes headers sanitized', {
      status: proxyRes.statusCode,
      target: targetUrl && targetUrl.href,
      removed: Object.keys(originalHeaders).filter(k => !(k in sanitized)),
      finalHeaders: sanitized,
    });
    proxyRes.once('end', () => log('debug', id, 'proxyRes end'));
    proxyRes.once('close', () => log('debug', id, 'proxyRes close'));
    proxyRes.once('error', err => log('error', id, 'proxyRes error', { err }));
    res.once('finish', () => log('info', id, 'client response finished'));
    res.once('close', () => log('debug', id, 'client response closed'));
  },
  onError: (err, req, res) => {
    const { id, targetUrl } = req._proxyMeta || { id: 'unknown' };
    log('error', id, 'Proxy error', { error: err.message, stack: err.stack, target: targetUrl && targetUrl.href });
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy error', detail: err.message });
    }
  },
  logProvider: () => ({
    log: (...args) => log('info','internal','http-proxy-middleware log', { args }),
    debug: (...args) => log('debug','internal','http-proxy-middleware debug', { args }),
    info: (...args) => log('info','internal','http-proxy-middleware info', { args }),
    warn: (...args) => log('warn','internal','http-proxy-middleware warn', { args }),
    error: (...args) => log('error','internal','http-proxy-middleware error', { args }),
  }),
}));

// Fallback / root info
app.get('/', (_req, res) => {
  res.type('text/plain').send('Dev proxy running. Use /proxy?url=https://example.com');
});

app.listen(PORT, () => {
  console.log(`Dev proxy (http-proxy-middleware) listening on http://localhost:${PORT}`);
  if (ALLOW_HOSTS.length) {
    console.log('Allowed hosts:', ALLOW_HOSTS.join(', '));
  } else {
    console.log('No host allowlist set (ALL hosts allowed in dev). Set ALLOW_PROXY_HOSTS to restrict.');
  }
});
