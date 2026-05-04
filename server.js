var express = require(“express”);
var cors = require(“cors”);
var https = require(“https”);
var app = express();
var PORT = process.env.PORT || 3000;
var KEY = “d7s72khr01qm28g8hls0”;
app.use(cors());
app.get(”/”, function(req, res) { res.json({ok:1}); });
app.get(”/stock/:t”, function(req, res) {
var t = req.params.t.toUpperCase();
var range = req.query.range || “5y”;
var interval = range === “1d” ? “5m” : range === “1w” ? “60m” : “1d”;
var yr = range === “1w” ? “5d” : range;
var url = “https://query1.finance.yahoo.com/v8/finance/chart/” + t + “?interval=” + interval + “&range=” + yr;
var opts = {headers:{“User-Agent”:“Mozilla/5.0”,“Accept”:“application/json”}};
https.get(url, opts, function(r) {
var d = “”;
r.on(“data”, function(c) { d += c; });
r.on(“end”, function() {
try {
var j = JSON.parse(d);
var res0 = j.chart.result[0];
var out = res0.timestamp.map(function(ts, i) {
return {date: new Date(ts*1000).toISOString().slice(0,10), c: res0.indicators.quote[0].close[i], v: res0.indicators.quote[0].volume[i]||0};
}).filter(function(x) { return x.c && x.c > 0; });
res.json({ticker:t, data:out});
} catch(e) { res.status(500).json({error:“err”}); }
});
}).on(“error”, function() { res.status(500).json({error:“err”}); });
});
app.get(”/fgi”, function(req, res) {
var url = “https://production.dataviz.cnn.io/index/fearandgreed/graphdata/” + new Date().toISOString().slice(0,10);
var opts = {headers:{“User-Agent”:“Mozilla/5.0”,“Accept”:“application/json”}};
https.get(url, opts, function(r) {
var d = “”;
r.on(“data”, function(c) { d += c; });
r.on(“end”, function() {
try {
var j = JSON.parse(d);
var cur = j.fear_and_greed;
var hist = (j.fear_and_greed_historical && j.fear_and_greed_historical.data) || [];
res.json({score:cur.score, rating:cur.rating, prev:cur.previous_close, week:hist.length>5?hist[hist.length-6].y:null, month:hist.length>21?hist[hist.length-22].y:null});
} catch(e) { res.status(500).json({error:“err”}); }
});
}).on(“error”, function() { res.status(500).json({error:“err”}); });
});
app.get(”/news/:t”, function(req, res) {
var t = req.params.t.toUpperCase();
var today = new Date().toISOString().slice(0,10);
var week = new Date(Date.now()-7*86400000).toISOString().slice(0,10);
var url = “https://finnhub.io/api/v1/company-news?symbol=” + t + “&from=” + week + “&to=” + today + “&token=” + KEY;
var opts = {headers:{“User-Agent”:“Mozilla/5.0”}};
https.get(url, opts, function(r) {
var d = “”;
r.on(“data”, function(c) { d += c; });
r.on(“end”, function() {
try { var j = JSON.parse(d); res.json(Array.isArray(j)?j.slice(0,10):[]); }
catch(e) { res.json([]); }
});
}).on(“error”, function() { res.json([]); });
});
app.listen(PORT, function() { console.log(“running “ + PORT); });
