var express = require("express");
var cors = require("cors");
var https = require("https");
var app = express();
app.use(cors());
app.get("/", function(req, res) { res.json({ok:1}); });
app.get("/stock/:t", function(req, res) {
var t = req.params.t.toUpperCase();
var url = "https://query1.finance.yahoo.com/v8/finance/chart/" + t + "?interval=1d&range=2y";
https.get(url, {headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"}}, function(r) {
var d = "";
r.on("data", function(c) { d += c; });
r.on("end", function() {
try {
var j = JSON.parse(d);
var ts = j.chart.result[0].timestamp;
var cl = j.chart.result[0].indicators.quote[0].close;
var out = [];
for (var i = 0; i < ts.length; i++) { if (cl[i] && cl[i] > 0) out.push({date:new Date(ts[i]*1000).toISOString().slice(0,10),c:cl[i]}); }
res.json({ticker:t,data:out});
} catch(e) { res.status(500).json({error:"err"}); }
});
}).on("error", function() { res.status(500).json({error:"err"}); });
});
app.listen(process.env.PORT || 3000, function() { console.log("running"); });
