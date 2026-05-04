var https=require(“https”);
function get(url,cb){https.get(url,{headers:{“User-Agent”:“Mozilla/5.0”,“Accept”:“application/json”}},function(r){var d=””;r.on(“data”,function(c){d+=c});r.on(“end”,function(){try{cb(null,JSON.parse(d))}catch(e){cb(e)}})}).on(“error”,cb)}
exports.handler=function(ev,ctx,done){
var h={“Access-Control-Allow-Origin”:”*”,“Access-Control-Allow-Methods”:“GET”,“Access-Control-Allow-Headers”:”*”,“Content-Type”:“application/json”};
if(ev.httpMethod===“OPTIONS”){return done(null,{statusCode:200,headers:h,body:“ok”})}
var ok=function(d){done(null,{statusCode:200,headers:h,body:JSON.stringify(d)})};
var err=function(m){done(null,{statusCode:500,headers:h,body:JSON.stringify({error:m||“err”})})};
var p=(ev.path||””).replace(”/.netlify/functions/stock”,””).split(”/”).filter(Boolean);
var a=p[0],b=p[1],rng=(ev.queryStringParameters||{}).range||“5y”;
if(a===“fgi”){
get(“https://production.dataviz.cnn.io/index/fearandgreed/graphdata/”+new Date().toISOString().slice(0,10),function(e,j){
if(e)return err(“fgi”);
var c=j.fear_and_greed,h2=(j.fear_and_greed_historical&&j.fear_and_greed_historical.data)||[];
ok({score:c.score,rating:c.rating,prev:c.previous_close,week:h2.length>5?h2[h2.length-6].y:null,month:h2.length>21?h2[h2.length-22].y:null});
});
}else if(a===“news”&&b){
var t=b.toUpperCase(),td=new Date().toISOString().slice(0,10),wk=new Date(Date.now()-604800000).toISOString().slice(0,10);
get(“https://finnhub.io/api/v1/company-news?symbol=”+t+”&from=”+wk+”&to=”+td+”&token=d7s72khr01qm28g8hls0”,function(e,j){
ok(Array.isArray(j)?j.slice(0,10):[]);
});
}else if(a===“stock”&&b){
var t2=b.toUpperCase(),iv=rng===“1d”?“5m”:rng===“1w”?“60m”:“1d”,yr=rng===“1w”?“5d”:rng;
get(“https://query1.finance.yahoo.com/v8/finance/chart/”+t2+”?interval=”+iv+”&range=”+yr,function(e,j){
if(e)return err(“fetch”);
try{var r=j.chart.result[0],out=r.timestamp.map(function(ts,i){return{date:new Date(ts*1000).toISOString().slice(0,10),c:r.indicators.quote[0].close[i],v:r.indicators.quote[0].volume[i]||0}}).filter(function(x){return x.c>0});ok({ticker:t2,data:out})}catch(ex){err(“parse”)}
});
}else{
ok({ok:1,path:ev.path});
}
};
