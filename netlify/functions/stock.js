const https = require(“https”);

function fetch(url) {
return new Promise((resolve, reject) => {
https.get(url, {headers:{“User-Agent”:“Mozilla/5.0”,“Accept”:“application/json”}}, (r) => {
let d = “”;
r.on(“data”, (c) => { d += c; });
r.on(“end”, () => {
try { resolve(JSON.parse(d)); }
catch(e) { reject(e); }
});
}).on(“error”, reject);
});
}

const CORS = {
“Access-Control-Allow-Origin”: “*”,
“Access-Control-Allow-Methods”: “GET, OPTIONS”,
“Access-Control-Allow-Headers”: “*”,
“Content-Type”: “application/json”
};

exports.handler = async (event) => {
if (event.httpMethod === “OPTIONS”) {
return { statusCode: 204, headers: CORS, body: “” };
}

const path = (event.path || “”).replace(”/.netlify/functions/stock”, “”);
const parts = path.split(”/”).filter(Boolean);
const action = parts[0];
const param = parts[1];
const range = (event.queryStringParameters || {}).range || “5y”;

try {
if (action === “fgi”) {
const today = new Date().toISOString().slice(0, 10);
const j = await fetch(“https://production.dataviz.cnn.io/index/fearandgreed/graphdata/” + today);
const cur = j.fear_and_greed;
const hist = (j.fear_and_greed_historical && j.fear_and_greed_historical.data) || [];
return {
statusCode: 200, headers: CORS,
body: JSON.stringify({
score: cur.score, rating: cur.rating, prev: cur.previous_close,
week: hist.length > 5 ? hist[hist.length - 6].y : null,
month: hist.length > 21 ? hist[hist.length - 22].y : null
})
};
}

```
if (action === "news" && param) {
  const t = param.toUpperCase();
  const today = new Date().toISOString().slice(0, 10);
  const week = new Date(Date.now() - 604800000).toISOString().slice(0, 10);
  const j = await fetch("https://finnhub.io/api/v1/company-news?symbol=" + t + "&from=" + week + "&to=" + today + "&token=d7s72khr01qm28g8hls0");
  return { statusCode: 200, headers: CORS, body: JSON.stringify(Array.isArray(j) ? j.slice(0, 10) : []) };
}

if (action === "stock" && param) {
  const t = param.toUpperCase();
  const iv = range === "1d" ? "5m" : range === "1w" ? "60m" : "1d";
  const yr = range === "1w" ? "5d" : range;
  const j = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/" + t + "?interval=" + iv + "&range=" + yr);
  const res = j.chart.result[0];
  const out = res.timestamp.map((ts, i) => ({
    date: new Date(ts * 1000).toISOString().slice(0, 10),
    c: res.indicators.quote[0].close[i],
    v: res.indicators.quote[0].volume[i] || 0
  })).filter(x => x.c > 0);
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ticker: t, data: out }) };
}

return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: 1 }) };
```

} catch (e) {
return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
}
};