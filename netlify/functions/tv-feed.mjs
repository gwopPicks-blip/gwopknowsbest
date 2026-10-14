
exports.handler = async () => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    const feedUrl = process.env.TV_FEED_URL;

    if (!feedUrl) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          error: "TradingView feed is not configured",
          source: "TradingView",
          candles: []
        })
      };
    }

    const response = await fetch(feedUrl, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Feed returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const raw = Array.isArray(data)
      ? data
      : data.candles;

    if (!Array.isArray(raw)) {
      throw new Error("Feed did not return a candles array");
    }

    const minute = 60000;
    const currentMinute = Math.floor(Date.now() / minute) * minute;

    const candles = raw
      .map(c => ({
        time: Number(c.time),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume ?? 0)
      }))
      .filter(c =>
        Number.isFinite(c.time) &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close) &&
        c.time < currentMinute &&
        c.open > 0 &&
        c.low <= c.high &&
        c.low <= Math.min(c.open, c.close) &&
        c.high >= Math.max(c.open, c.close)
      )
      .sort((a, b) => a.time - b.time);

    if (!candles.length) {
      throw new Error("No completed one-minute candles available");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        source: "TradingView",
        symbol: "BTCUSD",
        interval: "1m",
        candles: candles.slice(-500)
      })
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: error.message,
        candles: []
      })
    };
  }
};
