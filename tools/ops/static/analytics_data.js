/* Pure filtering + aggregation over the snapshot. Timestamps are Bangkok "YYYY-MM-DDTHH:MM". */
(function () {
  const DAY = 86400000;

  const d2ms = (d) => Date.parse(d.slice(0, 10) + "T00:00:00Z");
  const ms2d = (ms) => new Date(ms).toISOString().slice(0, 10);
  const addDays = (d, n) => ms2d(d2ms(d) + n * DAY);
  const daysBetween = (a, b) => Math.round((d2ms(b) - d2ms(a)) / DAY);

  function weekOf(ts) {
    const ms = d2ms(ts);
    const dow = (new Date(ms).getUTCDay() + 6) % 7; // Monday = 0
    return ms2d(ms - dow * DAY);
  }

  const inRange = (ts, r) => !!ts && ts.slice(0, 10) >= r.start && ts.slice(0, 10) < r.end;

  /** Current + previous window of equal length. end is exclusive. */
  function ranges(f, today, firstDay) {
    let start, end = addDays(today, 1);
    if (f.range === "custom" && f.from && f.to) { start = f.from; end = addDays(f.to, 1); }
    else if (f.range === "all") start = firstDay;
    else start = addDays(today, -(Number(f.range) - 1));
    const len = Math.max(1, daysBetween(start, end));
    const prev = f.range === "all" ? null : { start: addDays(start, -len), end: start };
    return { cur: { start, end }, prev, len };
  }

  function weeks(r) {
    const out = [];
    for (let w = weekOf(r.start); w < r.end; w = addDays(w, 7)) out.push(w);
    return out;
  }

  // ── filtering ────────────────────────────────────────────────────────────
  const USER_DIMS = ["source", "utm_source", "utm_campaign", "purpose"];
  const hasUserDim = (f) => USER_DIMS.some((k) => f[k]);

  function userMatch(u, f) {
    if (!u) return false;
    if (f.source && u.source !== f.source) return false;
    if (f.purpose && u.purpose !== f.purpose) return false;
    if (f.utm_source && u.ft_utm_source !== f.utm_source) return false;
    if (f.utm_campaign && u.ft_utm_campaign !== f.utm_campaign) return false;
    return true;
  }

  function orderMatch(o, f, usersById) {
    if (f.size === "bulk" && o.qty < 10) return false;
    if (f.size === "single" && o.qty >= 10) return false;
    if (f.coupon && (o.coupon || "(none)") !== f.coupon) return false;
    if (!hasUserDim(f)) return true;
    const u = usersById[o.user_id];
    const merged = u ? { ...u, ft_utm_source: o.ft_utm_source || u.ft_utm_source,
      ft_utm_campaign: o.ft_utm_campaign || u.ft_utm_campaign } : null;
    return userMatch(merged, f);
  }

  function personMatch(p, f, usersById) {
    if (f.lang && ((p.landing || "").startsWith("/th") ? "th" : "en") !== f.lang) return false;
    if (f.device && p.device !== f.device) return false;
    if (f.utm_source && p.utm_source !== f.utm_source) return false;
    if (f.utm_campaign && p.utm_campaign !== f.utm_campaign) return false;
    if (f.source || f.purpose) return userMatch(usersById[p.distinct_id], { source: f.source, purpose: f.purpose });
    return true;
  }

  function apply(snap, f) {
    const db = snap.supabase || {}, ph = snap.posthog || {};
    const users = db.users || [];
    const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
    return {
      usersById, personOnly: !!(f.lang || f.device),
      users: users.filter((u) => userMatch(u, f)),
      orders: (db.orders || []).filter((o) => o.paid && orderMatch(o, f, usersById)),
      persons: ph.status === "ok" ? ph.persons.filter((p) => personMatch(p, f, usersById)) : [],
      daily: ph.status === "ok" ? ph.daily.filter((r) => !f.lang || r.lang === f.lang) : [],
      pages: ph.status === "ok" ? ph.pages.filter((r) => !f.lang || (r.path || "").startsWith("/th") === (f.lang === "th")) : [],
      ready: ph.status === "ok" ? ph.ready : [],
      meta: (snap.meta && snap.meta.status === "ok" ? snap.meta.daily : [])
        .filter((r) => !f.utm_campaign || r.campaign === f.utm_campaign),
    };
  }

  // ── aggregation ──────────────────────────────────────────────────────────
  const sum = (xs, fn) => xs.reduce((s, x) => s + (fn ? fn(x) : x), 0);
  function median(xs) {
    if (!xs.length) return 0;
    const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function kpis(v, r) {
    const orders = v.orders.filter((o) => inRange(o.ts, r));
    const signups = v.users.filter((u) => inRange(u.signup, r));
    const newPayers = v.users.filter((u) => inRange(u.first_paid, r));
    const vis = v.persons.filter((p) => inRange(p.first_seen, r)), visitors = vis.length;
    // Language/device only exist on visitors: then count signups among those visitors (identified only).
    const signedUp = v.personOnly
      ? vis.filter((p) => inRange((v.usersById[p.distinct_id] || {}).signup, r)).length
      : signups.length;
    const spend = sum(v.meta.filter((m) => inRange(m.d, r)), (m) => m.spend);
    const revenue = sum(orders, (o) => o.total);
    return {
      revenue, orders: orders.length, aov: median(orders.map((o) => o.total)),
      units: sum(orders, (o) => o.qty), signups: signups.length, visitors,
      visitorToSignup: visitors ? signedUp / visitors : null,
      signupToPaid: signups.length ? signups.filter((u) => u.first_paid).length / signups.length : null,
      spend, cac: spend && newPayers.length ? spend / newPayers.length : null,
      mer: spend ? revenue / spend : null,
    };
  }

  /** Bucket rows into the range's weeks. valueFn(row) → number; tsFn(row) → ts. */
  function weekly(rows, r, tsFn, valueFn = () => 1) {
    const ws = weeks(r), idx = Object.fromEntries(ws.map((w, i) => [w, i]));
    const out = ws.map(() => 0);
    for (const row of rows) {
      const ts = tsFn(row);
      if (!inRange(ts, r)) continue;
      const i = idx[weekOf(ts)];
      if (i !== undefined) out[i] += valueFn(row);
    }
    return { labels: ws, values: out };
  }

  function countBy(rows, keyFn, valueFn = () => 1) {
    const m = new Map();
    for (const row of rows) {
      const k = keyFn(row);
      m.set(k, (m.get(k) || 0) + valueFn(row));
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }

  function channelTable(v, r, key) {
    const revenueByUser = {};
    for (const o of v.orders) revenueByUser[o.user_id] = (revenueByUser[o.user_id] || 0) + o.total;
    const rows = {};
    for (const u of v.users.filter((x) => inRange(x.signup, r))) {
      const ch = u[key] || "(none)";
      const row = rows[ch] || (rows[ch] = { channel: ch, signups: 0, designers: 0, carts: 0, payers: 0, revenue: 0 });
      row.signups++; row.designers += !!u.first_design; row.carts += !!u.first_cart;
      row.payers += !!u.first_paid; row.revenue += revenueByUser[u.id] || 0;
    }
    return Object.values(rows).sort((a, b) => b.signups - a.signups);
  }

  window.AN = window.AN || {};
  Object.assign(window.AN, {
    data: { ranges, weeks, weekOf, inRange, addDays, daysBetween, apply, kpis, weekly, countBy,
      channelTable, median, sum, hasUserDim },
  });
})();
