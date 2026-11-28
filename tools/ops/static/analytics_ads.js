/* Meta Ads section: spend + delivery from the Marketing API, joined to on-site results via UTM names. */
(function () {
  const META_SOURCES = new Set(["meta", "facebook", "instagram", "fb", "ig"]);
  const LEVEL_UTM = { campaign: ["campaign", "ft_utm_campaign"], adset: ["adset", "ft_utm_term"], ad: ["ad", "ft_utm_content"] };
  let level = "campaign";

  function setupCard(meta) {
    const err = meta && meta.status === "error" ? `<p><strong>Last error:</strong> ${AN.render.esc(meta.error)}</p>` : "";
    return `<div class="an-empty">${err}<strong>Connect Meta Ads</strong> to see spend, CPM, CTR, CPC and cost per signup and order.
      <ol>
        <li>Business Settings → Users → System users → Add (Employee role) → Assign assets → your ad account (View performance).</li>
        <li>Generate a token for the system user with the <code>ads_read</code> permission.</li>
        <li>Add to <code>tools/.env</code>: <code>META_ACCESS_TOKEN=…</code> and <code>META_AD_ACCOUNT_ID=act_…</code>, then click <em>Refresh now</em>.</li>
        <li>Tag every ad with the URL parameters in <code>docs/marketing/ads-utm.md</code> so on-site results join to ads.</li>
      </ol></div>`;
  }

  function siteResults(v, r, utmKey) {
    const D = AN.data, out = {};
    const metaUsers = v.users.filter((u) => META_SOURCES.has((u.ft_utm_source || "").toLowerCase()));
    const revenueByUser = {};
    for (const o of v.orders) if (D.inRange(o.ts, r)) revenueByUser[o.user_id] = (revenueByUser[o.user_id] || 0) + o.total;
    for (const u of metaUsers) {
      const k = u[utmKey] || "(untagged)";
      const row = out[k] || (out[k] = { signups: 0, payers: 0, revenue: 0 });
      row.signups += D.inRange(u.signup, r) ? 1 : 0;
      row.payers += D.inRange(u.first_paid, r) ? 1 : 0;
      row.revenue += revenueByUser[u.id] || 0;
    }
    return out;
  }

  function fatigued(rows) {
    const byDay = AN.data.countBy(rows, (x) => x.d, (x) => x.impressions).map(([d]) => d).sort();
    const last = byDay.slice(-4);
    if (last.length < 4) return false;
    const ctr = last.map((d) => {
      const day = rows.filter((x) => x.d === d), imp = AN.data.sum(day, (x) => x.impressions);
      return imp ? AN.data.sum(day, (x) => x.link_clicks) / imp : 0;
    });
    return ctr[1] < ctr[0] && ctr[2] < ctr[1] && ctr[3] < ctr[2];
  }

  function aggregate(v, r) {
    const [metaKey, utmKey] = LEVEL_UTM[level];
    const rows = v.meta.filter((m) => AN.data.inRange(m.d, r));
    const groups = {};
    for (const m of rows) (groups[m[metaKey]] = groups[m[metaKey]] || []).push(m);
    const site = siteResults(v, r, utmKey), S = AN.data.sum;
    return Object.entries(groups).map(([name, g]) => {
      const spend = S(g, (x) => x.spend), imp = S(g, (x) => x.impressions), reach = S(g, (x) => x.reach);
      const clicks = S(g, (x) => x.link_clicks), s = site[name] || { signups: 0, payers: 0, revenue: 0 };
      const freq = reach ? imp / reach : 0;
      return {
        name, spend, imp, clicks, ctr: imp ? clicks / imp : null, cpc: clicks ? spend / clicks : null,
        cpm: imp ? (spend / imp) * 1000 : null, freq, px_reg: S(g, (x) => x.registrations), px_purch: S(g, (x) => x.purchases),
        signups: s.signups, payers: s.payers, revenue: s.revenue,
        cps: s.signups ? spend / s.signups : null, cpa: s.payers ? spend / s.payers : null,
        roas: spend ? s.revenue / spend : null, fatigue: freq > 3 || (level === "ad" && fatigued(g)),
      };
    }).sort((a, b) => b.spend - a.spend);
  }

  function render(snap, v, rg) {
    const body = document.getElementById("ads-body"), R = AN.render, D = AN.data;
    if (!snap.meta || snap.meta.status !== "ok") { body.innerHTML = setupCard(snap.meta); return; }
    body.innerHTML = `<div class="an-tiles" id="ads-tiles"></div>
      <div class="an-card" style="margin-top:1rem"><h4>Spend per week (฿)</h4><canvas id="ch-spend"></canvas></div>
      <div class="an-card"><h4>Performance by
        <select id="ads-level" class="an-inline-select"><option value="campaign">Campaign</option><option value="adset">Ad set</option><option value="ad">Ad</option></select></h4>
        <div id="tb-ads"></div>
        <p class="muted">Pixel = what Meta reports. Site = signups/orders whose first touch carried utm_source=meta and this name. A big gap means broken tagging or pixel over-counting. Break-even CPA ≈ median order ${R.thb(D.median(v.orders.map((o) => o.total)))}${snap.unit_cost_thb ? " minus unit cost" : ""}.</p></div>`;
    document.getElementById("ads-level").value = level;
    document.getElementById("ads-level").onchange = (e) => { level = e.target.value; render(snap, v, rg); };

    const cur = v.meta.filter((m) => D.inRange(m.d, rg.cur)), prev = rg.prev ? v.meta.filter((m) => D.inRange(m.d, rg.prev)) : null;
    const tot = (rows, f) => (rows ? D.sum(rows, (x) => x[f]) : null);
    const ctr = (rows) => (rows && tot(rows, "impressions") ? tot(rows, "link_clicks") / tot(rows, "impressions") : null);
    const cpc = (rows) => (rows && tot(rows, "link_clicks") ? tot(rows, "spend") / tot(rows, "link_clicks") : null);
    const cpm = (rows) => (rows && tot(rows, "impressions") ? (tot(rows, "spend") / tot(rows, "impressions")) * 1000 : null);
    R.tiles(document.getElementById("ads-tiles"), [
      { label: "Spend", value: tot(cur, "spend"), prev: tot(prev, "spend"), fmt: R.thb, higherIsBetter: false },
      { label: "Impressions", value: tot(cur, "impressions"), prev: tot(prev, "impressions"), fmt: R.int },
      { label: "Link CTR", value: ctr(cur), prev: ctr(prev), fmt: (x) => R.pct(x, 2) },
      { label: "CPC", value: cpc(cur), prev: cpc(prev), fmt: R.thb, higherIsBetter: false },
      { label: "CPM", value: cpm(cur), prev: cpm(prev), fmt: R.thb, higherIsBetter: false },
      { label: "Pixel purchases", value: tot(cur, "purchases"), prev: tot(prev, "purchases"), fmt: R.int },
    ]);
    const wk = D.weekly(v.meta, rg.cur, (m) => m.d, (m) => m.spend);
    R.chart("ch-spend", wk.labels, [{ label: "Spend", values: wk.values }], { type: "bar", yFmt: R.thb });
    R.table(document.getElementById("tb-ads"), [
      { key: "name", label: level, fmt: (x, r) => R.esc(x) + (r.fatigue ? ' <span class="an-fatigue">⚠ fatigue</span>' : "") },
      { key: "spend", label: "Spend", num: true, bar: true, fmt: R.thb },
      { key: "imp", label: "Impr.", num: true, fmt: R.int },
      { key: "ctr", label: "CTR", num: true, fmt: (x) => R.pct(x, 2) },
      { key: "cpc", label: "CPC", num: true, fmt: R.thb },
      { key: "cpm", label: "CPM", num: true, fmt: R.thb },
      { key: "freq", label: "Freq ≈", num: true, fmt: (x) => x.toFixed(1) },
      { key: "px_reg", label: "Pixel signups", num: true, fmt: R.int },
      { key: "px_purch", label: "Pixel purch.", num: true, fmt: R.int },
      { key: "signups", label: "Site signups", num: true, fmt: R.int },
      { key: "payers", label: "Site buyers", num: true, fmt: R.int },
      { key: "cps", label: "Cost / signup", num: true, fmt: R.thb },
      { key: "cpa", label: "Cost / buyer", num: true, fmt: R.thb },
      { key: "roas", label: "Site ROAS", num: true, fmt: R.ratio },
    ], aggregate(v, rg.cur), { empty: "No ad delivery in this range." });
  }

  window.AN = window.AN || {};
  window.AN.ads = { render };
})();
