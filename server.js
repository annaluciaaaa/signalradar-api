var express=require(“express”);
var cors=require(“cors”);
var https=require(“https”);
var app=express();
app.use(cors());
app.get(”/”,function(q,r){r.json({ok:1})});
app.get(”/stock/:t”,function(q,r){
var t=q.params.t.toUpperCase();
var rng=q.query.range||“5y”;
var iv=rng===“1d”?“5m”:rng===“1w”?“60m”:“1d”;
var yr=rng===“1w”?“5d”:rng;
https.get(“https://query1.finance.yahoo.com/v8/finance/chart/”+t+”?interval=”+iv+”&range=”+yr,{headers:{“User-Agent”:“Mozilla/5.0”}},function(s){var d=””;s.on(“data”,function(c){d+=c});s.on(“end”,function(){try{var j=JSON.parse(d),rs=j.chart.result[0],out=rs.timestamp.map(function(ts,i){return{date:new Date(ts*1000).toISOString().slice(0,10),c:rs.indicators.quote[0].close[i],v:rs.indicators.quote[0].volume[i]||0}}).filter(function(x){return x.c>0});r.json({ticker:t,data:out})}catch(e){r.status(500).json({error:“err”})}})}).on(“error”,function(){r.status(500).json({error:“err”})})});
app.get(”/fgi”,function(q,r){https.get(“https://production.dataviz.cnn.io/index/fearandgreed/graphdata/”+new Date().toISOString().slice(0,10),{headers:{“User-Agent”:“Mozilla/5.0”}},function(s){var d=””;s.on(“data”,function(c){d+=c});s.on(“end”,function(){try{var j=JSON.parse(d),cur=j.fear_and_greed,hist=(j.fear_and_greed_historical&&j.fear_and_greed_historical.data)||[];r.json({score:cur.score,rating:cur.rating,prev:cur.previous_close,week:hist.length>5?hist[hist.length-6].y:null,month:hist.length>21?hist[hist.length-22].y:null})}catch(e){r.status(500).json({error:“err”})}})}).on(“error”,function(){r.status(500).json({error:“err”})})});
app.get(”/news/:t”,function(q,r){var t=q.params.t.toUpperCase(),td=new Date().toISOString().slice(0,10),wk=new Date(Date.now()-604800000).toISOString().slice(0,10);https.get(“https://finnhub.io/api/v1/company-news?symbol=”+t+”&from=”+wk+”&to=”+td+”&token=d7s72khr01qm28g8hls0”,{headers:{“User-Agent”:“Mozilla/5.0”}},function(s){var d=””;s.on(“data”,function(c){d+=c});s.on(“end”,function(){try{r.json(JSON.parse(d).slice(0,10))}catch(e){r.json([])}})}).on(“error”,function(){r.json([])})});
app.listen(process.env.PORT||3000,function(){console.log(“ok”)});
