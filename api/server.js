'use strict';

const http = require('node:http');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.ESV_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://biblical-christian.onrender.com';

function send(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Vary': 'Origin'
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && origin !== ALLOWED_ORIGIN) return send(res, 403, { error: 'Origin not allowed.' });

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    });
    return res.end();
  }

  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/health') {
    return send(res, 200, { ok: true, service: 'Biblical Christian ESV passage service', configured: Boolean(API_KEY) });
  }
  if (req.method !== 'GET' || url.pathname !== '/api/passage') {
    return send(res, 404, { error: 'Not found.' });
  }
  if (!API_KEY) return send(res, 503, { error: 'The ESV API key has not been configured yet.' });

  const reference = (url.searchParams.get('reference') || '').trim();
  if (!reference || reference.length > 120 || !/^[A-Za-z0-9 .,:;–—-]+$/.test(reference)) {
    return send(res, 400, { error: 'Please provide a valid Bible reference.' });
  }

  try {
    const params = new URLSearchParams({
      q: reference.replace(/[–—]/g, '-'),
      'include-passage-references': 'true',
      'include-verse-numbers': 'true',
      'include-headings': 'false',
      'include-footnotes': 'false',
      'include-short-copyright': 'true'
    });
    const upstream = await fetch('https://api.esv.org/v3/passage/text/?' + params.toString(), {
      headers: { Authorization: 'Token ' + API_KEY },
      signal: AbortSignal.timeout(12000)
    });
    if (!upstream.ok) {
      const upstreamBody = await upstream.text();
      // Log only the upstream status and a short error body; never log the API key.
      console.error('ESV upstream error:', upstream.status, upstreamBody.slice(0, 500));
      const message = upstream.status === 401 || upstream.status === 403
        ? 'The ESV API rejected the server key. Please check that the key is active and correctly saved in Render.'
        : upstream.status === 429
          ? 'The ESV API rate limit was reached. Please wait a moment and try again.'
          : 'The ESV service could not return that passage (HTTP ' + upstream.status + '). Please try again.';
      return send(res, upstream.status === 429 ? 429 : 502, { error: message, upstreamStatus: upstream.status });
    }
    const data = await upstream.json();
    if (!Array.isArray(data.passages) || !data.passages.length) {
      return send(res, 404, { error: 'No ESV passage was found for that reference.' });
    }
    return send(res, 200, {
      reference: data.canonical || reference,
      passages: data.passages,
      translation: 'ESV'
    });
  } catch (error) {
    return send(res, 502, { error: 'The ESV service is temporarily unavailable. Please try again.' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('ESV passage service listening on port ' + PORT);
});
