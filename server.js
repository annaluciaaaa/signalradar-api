var express = require(‘express’);
var cors = require(‘cors’);
var https = require(‘https’);
var app = express();
app.use(cors());
app.get(’/’, function(req, res) { res.json({ok:1}); });
app.get(’/stock/:t’, function(req, res) {
var t = req.params.t.toUpperCase();
var url = ‘https://query1.finance.yahoo.com/v8/finance/chart/’ + t + ‘?interval=1d&range=2y’;
var opt = { headers: { ‘User-Agent’: ‘Mozilla/5.0’, ‘Accept’: ‘application/json’ } };
https.get(url, opt, function(r) {
var d = ‘’;
r.on(‘data’, function(c) { d += c; });
r.on(‘end’, function() {
try {
var j = JSON.parse(d);
var result = j.chart.result[0];
var out = [];
for (var i = 0; i < result.timestamp.length; i++) {
var c = result.indicators.quote[0].close[i];
if (c && c > 0) out.push({ date: new Date(result.timestamp[i]*1000).toISOString().slice(0,10), c: c });
}
res.json({ ticker: t, data: out });
} catch(e) { res.status(500).json({ error: ‘err’ }); }
});
}).on(‘error’, function() { res.status(500).json({ error: ‘err’ }); });
});
app.listen(process.env.PORT || 3000, function() { console.log(‘running’); });
