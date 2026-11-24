'use strict';

const http = require('node:http');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.ESV_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://biblical-christian.onrender.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL;
const contactRate = new Map();

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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  if (req.method === 'POST' && url.pathname === '/api/contact') {
    if (!RESEND_API_KEY || !CONTACT_TO_EMAIL) {
      return send(res, 503, { error: 'The contact service is not configured yet. Please try again later.' });
    }

    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim();
    const now = Date.now();
    const recent = (contactRate.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
    if (recent.length >= 4) return send(res, 429, { error: 'Too many messages have been sent. Please wait a little before trying again.' });

    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 12000) return send(res, 413, { error: 'Your message is too long. Please shorten it and try again.' });
      }
      const body = JSON.parse(raw || '{}');
      if (body.website) return send(res, 200, { ok: true });
      const name = String(body.name || '').trim().slice(0, 100);
      const email = String(body.email || '').trim().slice(0, 254);
      const subject = String(body.subject || 'General enquiry').trim().replace(/[\\r\\n]+/g, ' ').slice(0, 120);
      const message = String(body.message || '').trim().slice(0, 5000);
      if (!name || !email || !message || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || message.length < 10) {
        return send(res, 400, { error: 'Please provide a valid name, email address and a message of at least 10 characters.' });
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Biblical Christian <onboarding@resend.dev>',
          to: [CONTACT_TO_EMAIL],
          reply_to: email,
          subject: '[Biblical Christian] ' + subject,
          text: 'Name: ' + name + '\\nEmail: ' + email + '\\nSubject: ' + subject + '\\n\\n' + message
        }),
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) {
        console.error('Contact email provider error:', response.status);
        return send(res, 502, { error: 'Your message could not be sent right now. Please try again later.' });
      }
      contactRate.set(ip, [...recent, now]);
      return send(res, 200, { ok: true, message: 'Your message has been sent. Thank you for getting in touch.' });
    } catch (error) {
      if (error instanceof SyntaxError) return send(res, 400, { error: 'Please submit a valid message.' });
      console.error('Contact service request failed:', error.name || 'Error');
      return send(res, 502, { error: 'The contact service is temporarily unavailable. Please try again.' });
    }
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
