/* Analytics tab wiring: load snapshot, filters, sections, refresh. */
(function () {
  const D = AN.data, R = AN.render;
  const $ = (id) => document.getElementById(id);
  const form = $("an-filters");
  let snap = null, channelOrder = [];

  const FAILURES = { studio_canvas_blank: "Blank canvas", studio_template_load_failed: "Template failed",
    studio_artwork_restore_failed: "Restore failed", studio_upload_failed: "Upload failed",
    studio_save_failed: "Save failed", studio_mockup_failed: "Mockup failed", studio_add_to_cart_failed: "Add to cart failed" };

  const filters = () => Object.fromEntries(new FormData(form).entries());
  const hours = (a, b) => (Date.parse(b) - Date.parse(a)) / 3600000;

  function fillSelect(name, values) {
    const sel = form.elements[name], keep = sel.value;
    sel.innerHTML = '<option value="">All</option>' + values.map((v) => `<option>${R.esc(v)}</option>`).join("");
    sel.value = values.includes(keep) ? keep : "";
  }

  function populateFilters() {
    const users = snap.supabase.users || [], orders = snap.supabase.orders || [];
    const uniq = (xs) => [...new Set(xs.filter(Boolean))].sort();
    channelOrder = D.countBy(users, (u) => u.source).map(([k]) => k);
    fillSelect("source", channelOrder);
    fillSelect("utm_source", uniq(users.map((u) => u.ft_utm_source)));
    fillSelect("utm_campaign", uniq([...users.map((u) => u.ft_utm_campaign), ...((snap.meta && snap.meta.daily) || []).map((m) => m.campaign)]));
    fillSelect("purpose", uniq(users.map((u) => u.purpose)));
    fillSelect("coupon", uniq(orders.filter((o) => o.paid).map((o) => o.coupon || "(none)")));
  }

  function renderSources() {
    $("an-sources").innerHTML = ["supabase", "posthog", "meta"].map((k) => {
      const s = (snap[k] && snap[k].status) || "error";
      const tip = (snap[k] && (snap[k].error || snap[k].hint)) || "";
      return `<span class="an-src ${s}" title="${R.esc(tip)}">${k} · ${s.replace("_", " ")}</span>`;
    }).join("");
    $("an-pulled").textContent = `Last pulled: ${snap.generated_at.replace("T", " ").slice(0, 16)} (Bangkok) · auto-pull daily after 17:00 Bangkok`;
  }

  function renderSummary(v, rg) {
    const c = D.kpis(v, rg.cur), p = rg.prev ? D.kpis(v, rg.prev) : {}, hasAds = snap.meta && snap.meta.status === "ok";
    const wk = (rows, ts, val) => D.weekly(rows, rg.cur, ts, val).values;
    const noPh = snap.posthog.status !== "ok" && "PostHog not connected";
    R.tiles($("an-tiles"), [
      { label: "Revenue", value: c.revenue, prev: p.revenue, fmt: R.thb, spark: wk(v.orders, (o) => o.ts, (o) => o.total) },
      { label: "Paid orders", value: c.orders, prev: p.orders, fmt: R.int, spark: wk(v.orders, (o) => o.ts) },
      { label: "Median order", value: c.aov, prev: p.aov, fmt: R.thb },
      { label: "Shirts sold", value: c.units, prev: p.units, fmt: R.int, spark: wk(v.orders, (o) => o.ts, (o) => o.qty) },
      { label: "New signups", value: c.signups, prev: p.signups, fmt: R.int, spark: wk(v.users, (u) => u.signup) },
      noPh ? { label: "New visitors", na: noPh } : { label: "New visitors", value: c.visitors, prev: p.visitors, fmt: R.int, spark: wk(v.persons, (x) => x.first_seen) },
      noPh ? { label: "Visitor → signup", na: noPh } : { label: "Visitor → signup", value: c.visitorToSignup, prev: p.visitorToSignup, fmt: (x) => R.pct(x, 1) },
      { label: "Signup → paid (cohort)", value: c.signupToPaid, prev: p.signupToPaid, fmt: (x) => R.pct(x, 1) },
      hasAds ? { label: "Ad spend", value: c.spend, prev: p.spend, fmt: R.thb, higherIsBetter: false } : { label: "Ad spend", na: "Meta not connected" },
      hasAds ? { label: "Blended CAC", value: c.cac, prev: p.cac, fmt: R.thb, higherIsBetter: false } : { label: "Blended CAC", na: "Meta not connected" },
      hasAds ? { label: "MER (revenue ÷ spend)", value: c.mer, prev: p.mer, fmt: R.ratio } : { label: "MER", na: "Meta not connected" },
    ]);
    const ICON = { critical: "⛔ Critical", warning: "⚠ Warning", good: "✓ Good", info: "ℹ Info" };
    $("an-insights").innerHTML = (snap.insights || []).map((i) => `<li class="${i.level}">
      <div class="tag">${ICON[i.level] || i.level} · ${R.esc(i.area)}</div><div class="t">${R.esc(i.title)}</div><div class="d">${R.esc(i.detail)}</div></li>`).join("");
  }

  function renderAcquisition(v, rg) {
    const vis = D.weekly(v.persons, rg.cur, (x) => x.first_seen), sig = D.weekly(v.users, rg.cur, (u) => u.signup);
    R.chart("ch-visitors", vis.labels, snap.posthog.status === "ok"
      ? [{ label: "New visitors", values: vis.values }, { label: "Signups", values: sig.values }]
      : [{ label: "Signups", values: sig.values }]);
    const top = channelOrder.slice(0, 6), other = channelOrder.length > 6;
    const series = [...top, ...(other ? ["Other"] : [])].map((ch) => ({
      label: ch, values: D.weekly(v.users.filter((u) => (ch === "Other" ? !top.includes(u.source) : u.source === ch)), rg.cur, (u) => u.signup).values }));
    R.chart("ch-channels", sig.labels, series, { type: "bar", stacked: true });

    const key = $("channel-key").value;
    R.table($("tb-channels"), [
      { key: "channel", label: "Channel" }, { key: "signups", label: "Signups", num: true, bar: true, fmt: R.int },
      { key: "designers", label: "Designed", num: true, fmt: (x, r) => `${x} (${R.pct(x / r.signups)})` },
      { key: "carts", label: "Carted", num: true, fmt: (x, r) => `${x} (${R.pct(x / r.signups)})` },
      { key: "payers", label: "Paid", num: true, fmt: (x, r) => `${x} (${R.pct(x / r.signups, 1)})` },
      { key: "revenue", label: "Revenue", num: true, bar: true, fmt: R.thb },
    ], D.channelTable(v, rg.cur, key), { empty: key === "source" ? "No signups in this range." : "No UTM-tagged signups yet: they start after the attribution release." });

    const visitors = v.persons.filter((x) => D.inRange(x.first_seen, rg.cur));
    const group = (fn) => {
      const m = {};
      for (const x of visitors) {
        const k = fn(x) || "(none)", row = m[k] || (m[k] = { key: k, visitors: 0, studio: 0, signed: 0 });
        row.visitors++; row.studio += !!x.studio_opened; row.signed += !!v.usersById[x.distinct_id];
      }
      return Object.values(m).sort((a, b) => b.visitors - a.visitors);
    };
    const cols = (label) => [{ key: "key", label }, { key: "visitors", label: "Visitors", num: true, bar: true, fmt: R.int },
      { key: "studio", label: "Opened studio", num: true, fmt: (x, r) => R.pct(x / r.visitors) },
      { key: "signed", label: "Signed in", num: true, fmt: (x, r) => R.pct(x / r.visitors) }];
    const ph = snap.posthog.status === "ok" ? null : "PostHog not connected.";
    R.table($("tb-landing"), cols("Landing path"), ph ? [] : group((x) => (x.landing || "").replace(/\/studio\/.+/, "/studio/:id")), { limit: 15, empty: ph || undefined });
    R.table($("tb-referrers"), cols("Referrer"), ph ? [] : group((x) => (x.referrer || "").replace(/^www\.|^l\.|^m\./, "")), { limit: 15, empty: ph || undefined });
  }

  function renderFunnels(v, rg) {
    const cohort = v.users.filter((u) => D.inRange(u.signup, rg.cur));
    R.funnel($("fn-signup"), [["Signed up", cohort.length], ["Created a design", cohort.filter((u) => u.first_design).length],
      ["Added to cart", cohort.filter((u) => u.first_cart).length], ["Started checkout", cohort.filter((u) => u.first_checkout).length],
      ["Paid", cohort.filter((u) => u.first_paid).length]], "Users who signed up in the range, and how far they got (at any time).");
    if (snap.posthog.status !== "ok") { R.funnel($("fn-studio"), [], "PostHog not connected."); return; }
    // Strictly sequential: each step counts people who also passed every earlier step.
    let pool = v.persons.filter((x) => D.inRange(x.studio_opened, rg.cur));
    const steps = [["Opened studio", "studio_opened"], ["Canvas loaded", "studio_canvas_ready"], ["Added artwork", "studio_artwork_added"],
      ["Saved design", "studio_save_succeeded"], ["Opened order panel", "studio_order_opened"], ["Added to cart", "studio_add_to_cart"],
      ["Paid", (x) => (v.usersById[x.distinct_id] || {}).first_paid]].map(([label, k]) => {
      pool = pool.filter((x) => (typeof k === "function" ? k(x) : x[k]));
      return [label, pool.length];
    });
    R.funnel($("fn-studio"), steps, "People who opened the studio in the range. Paid = identified people with a paid order.");
  }

  function renderStudio(v, rg) {
    const ok = snap.posthog.status === "ok";
    const labels = D.weeks(rg.cur);
    const series = Object.entries(FAILURES).map(([ev, label]) => ({ label,
      values: D.weekly(v.daily.filter((r) => r.event === ev), rg.cur, (r) => r.d, (r) => r.n).values })).filter((s) => D.sum(s.values));
    if (series.length) R.chart("ch-failures", labels, series, { type: "bar", stacked: true });
    else R.chart("ch-failures", labels, [{ label: "Failures", values: labels.map(() => 0) }], { type: "bar" });
    const ready = v.ready.filter((r) => D.inRange(r.d, rg.cur));
    R.chart("ch-ready", ready.map((r) => r.d), [{ label: "Median", values: ready.map((r) => Math.round(r.p50)) },
      { label: "90th percentile", values: ready.map((r) => Math.round(r.p90)) }]);
    const opened = v.persons.filter((x) => D.inRange(x.studio_opened, rg.cur));
    $("studio-note").textContent = ok ? `${opened.length} people opened the studio in this range; ${opened.filter((x) => x.left_empty).length} left at least once without adding artwork. ` +
      `Mobile ${opened.filter((x) => x.device === "mobile").length} · Desktop ${opened.filter((x) => x.device === "desktop").length}.` : "PostHog not connected.";
  }

  function renderOrders(v, rg) {
    const orders = v.orders.filter((o) => D.inRange(o.ts, rg.cur));
    const rev = D.weekly(v.orders, rg.cur, (o) => o.ts, (o) => o.total);
    R.chart("ch-revenue", rev.labels, [{ label: "Revenue", values: rev.values }], { type: "bar", yFmt: R.thb });
    const buckets = [["1", 1, 1], ["2–4", 2, 4], ["5–9", 5, 9], ["10–24", 10, 24], ["25+", 25, 1e9]];
    R.chart("ch-ordersize", buckets.map((b) => b[0]), [{ label: "Orders", values: buckets.map(([, lo, hi]) => orders.filter((o) => o.qty >= lo && o.qty <= hi).length) }],
      { type: "bar", labelFmt: (x) => x });
    const lines = orders.flatMap((o) => o.items);
    const share = (fn) => D.countBy(lines, fn, (i) => i.qty).map(([k, units]) => ({ k, units, revenue: D.sum(lines.filter((i) => fn(i) === k), (i) => i.qty * i.unit) }));
    const cols = (l) => [{ key: "k", label: l }, { key: "units", label: "Shirts", num: true, bar: true, fmt: R.int }, { key: "revenue", label: "Revenue", num: true, fmt: R.thb }];
    R.table($("tb-colors"), cols("Colour"), share((i) => i.color));
    R.table($("tb-sizes"), cols("Size"), share((i) => i.size));
    const pay = D.countBy(orders, (o) => o.pay).map(([k, n]) => ({ k: "Pay: " + k, n, v: D.sum(orders.filter((o) => o.pay === k), (o) => o.total) }));
    const cps = D.countBy(orders, (o) => o.coupon || "(no coupon)").map(([k, n]) => ({ k: "Coupon: " + k, n, v: D.sum(orders.filter((o) => (o.coupon || "(no coupon)") === k), (o) => o.discount) }));
    const gifts = lines.filter((i) => i.gift).length;
    R.table($("tb-pay"), [{ key: "k", label: "Split" }, { key: "n", label: "Orders", num: true }, { key: "v", label: "฿ (revenue / discount)", num: true, fmt: R.thb }],
      [...pay, ...cps, { k: "Gift lines", n: gifts, v: null }]);
    R.table($("tb-orders"), [{ key: "ts", label: "Paid (BKK)", fmt: (x) => x.replace("T", " ") }, { key: "qty", label: "Shirts", num: true },
      { key: "total", label: "Total", num: true, bar: true, fmt: R.thb }, { key: "discount", label: "Discount", num: true, fmt: R.thb },
      { key: "coupon", label: "Coupon", fmt: (x) => R.esc(x || "—") }, { key: "pay", label: "Payment" }, { key: "status", label: "Status" },
      { key: "user_id", label: "Signup channel", fmt: (x) => R.esc((v.usersById[x] || {}).source || "?") }],
      [...orders].sort((a, b) => b.ts.localeCompare(a.ts)));
  }

  function renderCohorts(v, rg) {
    const rows = D.weeks(rg.cur).map((w) => {
      const c = v.users.filter((u) => D.weekOf(u.signup) === w);
      const within = (k, h) => c.filter((u) => u[k] && hours(u.signup, u[k]) <= h).length;
      return { w, n: c.length, d1: within("first_design", 24), d: c.filter((u) => u.first_design).length, p7: within("first_paid", 168), p: c.filter((u) => u.first_paid).length };
    }).filter((r) => r.n).reverse();
    const pc = (k) => (x, r) => `${x} (${R.pct(x / r.n)})`;
    R.table($("tb-cohorts"), [{ key: "w", label: "Week of", fmt: R.shortWeek }, { key: "n", label: "Signups", num: true, bar: true },
      { key: "d1", label: "Designed ≤24h", num: true, fmt: pc() }, { key: "d", label: "Designed ever", num: true, fmt: pc() },
      { key: "p7", label: "Paid ≤7d", num: true, fmt: pc() }, { key: "p", label: "Paid ever", num: true, fmt: pc() }], rows);
    const payers = v.users.filter((u) => u.first_paid && D.inRange(u.first_paid, rg.cur));
    const b = [["< 1 hour", 0, 1], ["1–24 hours", 1, 24], ["1–7 days", 24, 168], ["7–30 days", 168, 720], ["30+ days", 720, 1e9]];
    R.chart("ch-ttfo", b.map((x) => x[0]), [{ label: "Customers", values: b.map(([, lo, hi]) => payers.filter((u) => { const h = hours(u.signup, u.first_paid); return h >= lo && h < hi; }).length) }],
      { type: "bar", labelFmt: (x) => x });
    const signups = v.users.filter((u) => D.inRange(u.signup, rg.cur));
    R.table($("tb-purpose"), [{ key: "k", label: "Purpose" }, { key: "n", label: "Signups", num: true, bar: true }, { key: "p", label: "Paid", num: true }],
      D.countBy(signups, (u) => u.purpose).map(([k, n]) => ({ k, n, p: signups.filter((u) => u.purpose === k && u.first_paid).length })));
  }

  function renderAll() {
    if (!snap) return;
    const f = filters();
    document.querySelectorAll(".an-custom").forEach((el) => (el.hidden = f.range !== "custom"));
    const today = snap.generated_at.slice(0, 10);
    const firstDay = ((snap.supabase.users || []).map((u) => u.signup).filter(Boolean).sort()[0] || today).slice(0, 10);
    const rg = D.ranges(f, today, firstDay), v = D.apply(snap, f);
    renderSources(); renderSummary(v, rg); renderAcquisition(v, rg); renderFunnels(v, rg);
    renderStudio(v, rg); AN.ads.render(snap, v, rg); renderOrders(v, rg); renderCohorts(v, rg);
  }

  async function load() {
    const res = await fetch("/analytics/data.json", { cache: "no-store" });
    if (!res.ok) { $("an-pulled").textContent = "No snapshot yet: click Refresh now."; return; }
    snap = await res.json();
    populateFilters(); renderAll();
  }

  async function refresh() {
    const btn = $("an-refresh");
    btn.disabled = true; btn.textContent = "Pulling…";
    await fetch("/analytics/refresh", { method: "POST" });
    for (;;) {
      await new Promise((r) => setTimeout(r, 2000));
      const s = await (await fetch("/analytics/status", { cache: "no-store" })).json();
      if (!s.running) { if (s.error) alert("Refresh failed: " + s.error); break; }
    }
    btn.disabled = false; btn.textContent = "Refresh now";
    await load();
  }

  form.addEventListener("change", renderAll);
  $("channel-key").addEventListener("change", renderAll);
  $("an-reset").addEventListener("click", () => { form.reset(); renderAll(); });
  $("an-refresh").addEventListener("click", refresh);
  load().then(() => { if ($("an-root").dataset.stale === "true") refresh(); });
})();
