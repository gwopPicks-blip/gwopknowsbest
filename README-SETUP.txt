BTC DASHBOARD — TRADINGVIEW-ONLY PRICE FEED

IMPORTANT
This setup uses TradingView chart data sent by a TradingView alert webhook. It does not scrape TradingView's website or read an embedded chart iframe. Prices/candles come from the BTC symbol/feed you select in TradingView. The dashboard continues to use Kalshi's market discovery/settlement logic for the contract target/outcome.

FILES
- index.html: dashboard updated to read only the TradingView feed endpoint (no Binance fallback)
- netlify/functions/tv-feed.mjs: authenticated webhook receiver and latest-feed endpoint
- netlify.toml, package.json: Netlify function configuration and dependency
- tradingview/BTC_15m_Netlify_Webhook.pine: Pine Script that sends the latest 90 one-minute candles at each bar close

SETUP
1. Deploy this folder to your existing Netlify site as a new manual deploy (upload the ZIP through Netlify Deploys, or replace the site files in your connected repository). Do not upload only index.html: the function and config are required.
2. In Netlify site settings, add environment variable TV_WEBHOOK_KEY with a long random secret string. Example format: tvfeed-<your-own-random-long-string>. Use the exact same string in the TradingView webhook URL query parameter. Do not post it publicly.
3. Open TradingView, select the BTC symbol/feed you want to use, and change chart interval to 1 minute. Open Pine Editor, paste the full contents of tradingview/BTC_15m_Netlify_Webhook.pine, save, and Add to chart.
4. Create an alert. Condition: “BTC 15m Netlify Feed (TradingView only)” → “Any alert() function call”. Frequency: Once Per Bar Close. Enable Webhook URL and use:
   https://btcgwoppicks617.netlify.app/.netlify/functions/tv-feed?key=YOUR_EXACT_TV_WEBHOOK_KEY
   Replace YOUR_EXACT_TV_WEBHOOK_KEY with the same secret from step 2. Leave the alert message default; Pine supplies the JSON payload.
5. Ensure TradingView account has 2-factor authentication enabled for webhooks. TradingView webhook requests can fail; check the alert log/webhook status if no data arrives.
6. Wait for the next one-minute candle close. Then open the dashboard and refresh. The status should read TRADINGVIEW FEED with a fresh timestamp. Function endpoint returns 404 until the first valid alert is received.

NOTES / LIMITS
- This is a webhook feed updated on each completed 1-minute candle, not tick-by-tick streaming. TradingView alert delivery can be delayed or fail.
- If you use a different symbol or quote currency (e.g. COINBASE:BTCUSD vs BINANCE:BTCUSDT), the price scale can differ. Choose the symbol matching your intended contract reference as closely as possible.
- This does not make TradingView's feed identical to Kalshi's official settlement index. Always use the contract's published settlement rules for final results.
- The existing 80% threshold is a heuristic score threshold, not a calibrated 80% win probability. Signal-only mode is preserved.
- Kalshi target discovery remains a separate integration; this change makes the BTC price/candle feed TradingView-only.
