var express = require(“express”);
var cors = require(“cors”);
var https = require(“https”);
var app = express();
var PORT = process.env.PORT || 3000;
var FINNHUB_KEY = “d7s72khr01qm28g8hls0”;

app.use(cors());

app.get(”/”, function(req, res) {
res.json({ ok: 1 });
});

function fetchJson(url, cb) {
https.get(url, { headers: { “User-Agent”: “Mozilla/5.0”, “Accept”: “application/json” } }, function(r) {
var d = “”;
r.on(“data”, function(c) { d += c; });
r.on(“end”, function() {
try { cb(null, JSON.parse(d)); }
catch(e) { cb(e); }
});
}).on(“error”, function(e) { cb(e); });
}

app.get(”/stock/:ticker”, function(req, res) {
var t = req.params.ticker.toUpperCase();
var range = req.query.range || “5y”;
var interval = “1d”;
var yahooRange = range;
if (range === “1d”) { interval = “5m”; yahooRange = “1d”; }
else if (range === “1w”) { interval = “60m”; yahooRange = “5d”; }
var url = “https://query1.finance.yahoo.com/v8/finance/chart/” + t + “?interval=” + interval + “&range=” + yahooRange;
fetchJson(url, function(err, j) {
if (err) { res.status(500).json({ error: “fetch error” }); return; }
try {
var result = j.chart.result[0];
var ts = result.timestamp;
var cl = result.indicators.quote[0].close;
var vl = result.indicators.quote[0].volume;
var out = [];
for (var i = 0; i < ts.length; i++) {
if (cl[i] && cl[i] > 0) {
out.push({ date: new Date(ts[i] * 1000).toISOString().slice(0, 10), c: cl[i], v: vl[i] || 0 });
}
}
res.json({ ticker: t, data: out });
} catch(e) { res.status(500).json({ error: “parse error” }); }
});
});

app.get(”/fgi”, function(req, res) {
var today = new Date().toISOString().slice(0, 10);
var url = “https://production.dataviz.cnn.io/index/fearandgreed/graphdata/” + today;
fetchJson(url, function(err, j) {
if (err) { res.status(500).json({ error: “fetch error” }); return; }
try {
var cur = j.fear_and_greed;
var hist = (j.fear_and_greed_historical && j.fear_and_greed_historical.data) || [];
res.json({
score: cur.score,
rating: cur.rating,
prev: cur.previous_close,
week: hist.length > 5 ? hist[hist.length - 6].y : null,
month: hist.length > 21 ? hist[hist.length - 22].y : null
});
} catch(e) { res.status(500).json({ error: “parse error” }); }
});
});

app.get(”/news/:ticker”, function(req, res) {
var t = req.params.ticker.toUpperCase();
var today = new Date().toISOString().slice(0, 10);
var week = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
var url = “https://finnhub.io/api/v1/company-news?symbol=” + t + “&from=” + week + “&to=” + today + “&token=” + FINNHUB_KEY;
fetchJson(url, function(err, j) {
if (err) { res.json([]); return; }
res.json(Array.isArray(j) ? j.slice(0, 10) : []);
});
});

app.listen(PORT, function() {
console.log(“running on port “ + PORT);
});
