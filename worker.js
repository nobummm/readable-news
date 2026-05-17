const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function corsResponse(body, init = {}) {
  const res = new Response(body, init);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return corsResponse('Method Not Allowed', { status: 405 });
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get('url');

    if (!target) {
      return corsResponse('Missing ?url= parameter', { status: 400 });
    }

    try {
      const upstream = await fetch(target, {
        headers: { 'User-Agent': 'readable-news-proxy/1.0' },
        redirect: 'follow',
      });

      const body = await upstream.arrayBuffer();
      const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

      return corsResponse(body, {
        status: upstream.status,
        headers: { 'Content-Type': contentType },
      });
    } catch (e) {
      return corsResponse(`Fetch error: ${e.message}`, { status: 502 });
    }
  },
};
