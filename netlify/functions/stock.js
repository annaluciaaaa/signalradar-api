const https = require("https");

function get(url, cb) {
  https
    .get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
      },
      function (r) {
        let d = "";
        r.on("data", function (c) {
          d += c;
        });
        r.on("end", function () {
          try {
            cb(null, JSON.parse(d));
          } catch (e) {
            cb(e);
          }
        });
      }
    )
    .on("error", cb);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

exports.handler = function (event, context, done) {
  if (event.httpMethod === "OPTIONS") {
    return done(null, { statusCode: 204, headers: corsHeaders, body: "" });
  }

  const ok = function (d) {
    done(null, {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(d),
    });
  };
  const err = function (m) {
    done(null, {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: m || "err" }),
    });
  };

  const p = (event.path || "")
    .replace("/.netlify/functions/stock", "")
    .split("/")
    .filter(Boolean);
  const a = p[0];
  const b = p[1];
  const rng = (event.queryStringParameters || {}).range || "5y";

  if (a === "fgi") {
    get(
      "https://production.dataviz.cnn.io/index/fearandgreed/graphdata/" +
        new Date().toISOString().slice(0, 10),
      function (e, j) {
        if (e) return err("fgi");
        try {
          const c = j.fear_and_greed;
          const h2 =
            (j.fear_and_greed_historical && j.fear_and_greed_historical.data) ||
            [];
          ok({
            score: c.score,
            rating: c.rating,
            prev: c.previous_close,
            week: h2.length > 5 ? h2[h2.length - 6].y : null,
            month: h2.length > 21 ? h2[h2.length - 22].y : null,
          });
        } catch (ex) {
          err("parse");
        }
      }
    );
  } else if (a === "news" && b) {
    const t = b.toUpperCase();
    const td = new Date().toISOString().slice(0, 10);
    const wk = new Date(Date.now() - 604800000).toISOString().slice(0, 10);
    get(
      "https://finnhub.io/api/v1/company-news?symbol=" +
        t +
        "&from=" +
        wk +
        "&to=" +
        td +
        "&token=d7s72khr01qm28g8hls0",
      function (e, j) {
        if (e) return err("news");
        ok(Array.isArray(j) ? j.slice(0, 10) : []);
      }
    );
  } else if (a === "stock" && b) {
    const t2 = b.toUpperCase();
    const iv = rng === "1d" ? "5m" : rng === "1w" ? "60m" : "1d";
    const yr = rng === "1w" ? "5d" : rng;
    get(
      "https://query1.finance.yahoo.com/v8/finance/chart/" +
        t2 +
        "?interval=" +
        iv +
        "&range=" +
        yr,
      function (e, j) {
        if (e) return err("fetch");
        try {
          const r = j.chart.result[0];
          const out = r.timestamp
            .map(function (ts, i) {
              return {
                date: new Date(ts * 1000).toISOString().slice(0, 10),
                c: r.indicators.quote[0].close[i],
                v: r.indicators.quote[0].volume[i] || 0,
              };
            })
            .filter(function (x) {
              return x.c > 0;
            });
          ok({ ticker: t2, data: out });
        } catch (ex) {
          err("parse");
        }
      }
    );
  } else {
    ok({ ok: 1, path: event.path });
  }
};
