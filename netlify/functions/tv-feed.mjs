import { getStore } from '@netlify/blobs';

export default async (request) => {
  const store = getStore('tradingview-btc-feed');
  if (request.method === 'GET') {
    const latest = await store.get('latest', { type: 'json' });
    if (!latest) return Response.json({ error: 'No TradingView alert received yet' }, { status: 404 });
    return Response.json(latest, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const expected = process.env.TV_WEBHOOK_KEY;
  const supplied = new URL(request.url).searchParams.get('key');
  if (!expected || !supplied || supplied !== expected) return new Response('Unauthorized', { status: 401 });
  let payload;
  try { payload = await request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  if (payload?.schema !== 'tv-btc-15m-v1' || !Array.isArray(payload.candles) || payload.candles.length < 60 || !Number.isFinite(Number(payload.price))) {
    return new Response('Invalid TradingView payload', { status: 400 });
  }
  const clean = {
    symbol: String(payload.symbol || 'BTC'), timeframe: String(payload.timeframe || '1'),
    price: Number(payload.price), change15: Number(payload.change15 || 0),
    candles: payload.candles.slice(-180).map(c => ({ t:Number(c.t), o:Number(c.o), h:Number(c.h), l:Number(c.l), c:Number(c.c), v:Number(c.v) })),
    barTime: Number(payload.barTime || Date.now()), receivedAt: Date.now()
  };
  if (clean.candles.some(c => ![c.t,c.o,c.h,c.l,c.c,c.v].every(Number.isFinite))) return new Response('Invalid candle values', { status: 400 });
  await store.setJSON('latest', clean);
  return Response.json({ ok: true, receivedAt: clean.receivedAt });
};
