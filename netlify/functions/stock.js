const https = require(“https”);

function fetchUrl(url) {
return new Promise(function(resolve, reject) {
https.get(url, {headers:{“User-Agent”:“Mozilla/5.0”,“Accept”:“application/json”}}, function(r) {
var d = “”;
r.on(“data”, function(c) { d += c; });
r.on(“end”, function() {
try { resolve(JSON.parse(d)); }
catch(e) { reject(e); }
});
}).on(“error”, reject);
});
}

exports.handler = async function(event) {
var headers = {“Access-Control-Allow-Origin”:”*”,“Content-Type”:“application/json”};

try {
var path = event.path.replace(”/.netlify/functions/stock”,””);
var parts = path.split(”/”).filter(Boolean);
var action = parts[0];
var param = parts[1];
var range = (event.queryStringParameters && event.queryStringParameters.range) || “5y”;

```
if (action === "fgi") {
  var today = new Date().toISOString().slice(0,10);
  var j = await fetchUrl("https://production.dataviz.cnn.io/index/fearandgreed/graphdata/" + today);
  var cur = j.fear_and_greed;
  var hist = (j.fear_and_greed_historical && j.fear_and_greed_historical.data) || [];
  return {statusCode:200, headers:headers, body:JSON.stringify({
    score:cur.score, rating:cur.rating, prev:cur.previous_close,
    week:hist.length>5?hist[hist.length-6].y:null,
    month:hist.length>21?hist[hist.length-22].y:null
  })};
}

if (action === "news" && param) {
  var t = param.toUpperCase();
  var today2 = new Date().toISOString().slice(0,10);
  var week = new Date(Date.now()-7*86400000).toISOString().slice(0,10);
  var url = "https://finnhub.io/api/v1/company-news?symbol="+t+"&from="+week+"&to="+today2+"&token=d7s72khr01qm28g8hls0";
  var news = await fetchUrl(url);
  return {statusCode:200, headers:headers, body:JSON.stringify(Array.isArray(news)?news.slice(0,10):[])};
}

if (action === "stock" && param) {
  var t2 = param.toUpperCase();
  var iv = range==="1d"?"5m":range==="1w"?"60m":"1d";
  var yr = range==="1w"?"5d":range;
  var stockUrl = "https://query1.finance.yahoo.com/v8/finance/chart/"+t2+"?interval="+iv+"&range="+yr;
  var sj = await fetchUrl(stockUrl);
  var res0 = sj.chart.result[0];
  var out = res0.timestamp.map(function(ts,i) {
    return {date:new Date(ts*1000).toISOString().slice(0,10), c:res0.indicators.quote[0].close[i], v:res0.indicators.quote[0].volume[i]||0};
  }).filter(function(x){return x.c&&x.c>0;});
  return {statusCode:200, headers:headers, body:JSON.stringify({ticker:t2, data:out})};
}

return {statusCode:200, headers:headers, body:JSON.stringify({ok:1})};
```

} catch(e) {
return {statusCode:500, headers:headers, body:JSON.stringify({error:e.message})};
}
};
