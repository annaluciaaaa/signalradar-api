const express = require(‘express’);
const cors = require(‘cors’);
const https = require(‘https’);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get(’/’, function(req, res) {
res.json({ status: ‘SignalRadar API running’ });
});

app.get(’/stock/:ticker’, function(req, res) {
const ticker = req.params.ticker.toUpperCase();
const range = req.query.range || ‘2y’;
const url = ‘https://query1.finance.yahoo.com/v8/finance/chart/’ + ticker + ‘?interval=1d&range=’ + range;

const options = {
headers: {
‘User-Agent’: ‘Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36’,
‘Accept’: ‘application/json’
}
};

https.get(url, options, function(apiRes) {
let data = ‘’;
apiRes.on(‘data’, function(chunk) { data += chunk; });
apiRes.on(‘end’, function() {
try {
const json = JSON.parse(data);
const result = json.chart && json.chart.result && json.chart.result[0];
if (!result || !result.timestamp) {
return res.status(404).json({ error: ’No data for: ’ + ticker });
}
const timestamps = result.timestamp;
const closes = result.indicators.quote[0].close;
const formatted = timestamps
.map(function(ts, i) {
return {
date: new Date(ts * 1000).toISOString().slice(0, 10),
c: closes[i] ? parseFloat(closes[i].toFixed(2)) : null
};
})
.filter(function(d) { return d.c && d.c > 0; });
res.json({ ticker: ticker, data: formatted });
} catch(e) {
res.status(500).json({ error: ‘Parse error’ });
}
});
}).on(‘error’, function(e) {
res.status(500).json({ error: ‘Fetch error’ });
});
});

app.listen(PORT, function() {
console.log(’SignalRadar API on port ’ + PORT);
});
