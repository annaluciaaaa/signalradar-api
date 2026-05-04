const express = require(‘express’);
const cors = require(‘cors’);
const https = require(‘https’);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get(’/’, function(req, res) {
res.json({ status: ‘ok’ });
});

app.get(’/stock/:ticker’, function(req, res) {
const ticker = req.params.ticker.toUpperCase();
const url = ‘https://query1.finance.yahoo.com/v8/finance/chart/’ + ticker + ‘?interval=1d&range=2y’;
const options = {
headers: {
‘User-Agent’: ‘Mozilla/5.0’,
‘Accept’: ‘application/json’
}
};
https.get(url, options, function(apiRes) {
let data = ‘’;
apiRes.on(‘data’, function(chunk) { data += chunk; });
apiRes.on(‘end’, function() {
try {
const json = JSON.parse(data);
const result = json.chart.result[0];
const out = result.timestamp.map(function(ts, i) {
return { date: new Date(ts * 1000).toISOString().slice(0, 10), c: result.indicators.quote[0].close[i] };
}).filter(function(d) { return d.c && d.c > 0; });
res.json({ ticker: ticker, data: out });
} catch(e) {
res.status(500).json({ error: ‘error’ });
}
});
}).on(‘error’, function() {
res.status(500).json({ error: ‘error’ });
});
});

app.listen(PORT, function() {
console.log(’running on port ’ + PORT);
});
