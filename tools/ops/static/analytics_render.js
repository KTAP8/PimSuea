/* Rendering helpers: tiles, tables, funnels, Chart.js wrappers (thin marks, recessive grid, hover tooltips). */
(function () {
  const css = (name) => getComputedStyle(document.getElementById("an-root")).getPropertyValue(name).trim();
  const SERIES = () => [1, 2, 3, 4, 5, 6, 7, 8].map((i) => css(`--series-${i}`));
  const charts = {};

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const thb = (x) => (x == null ? "—" : "฿" + Math.round(x).toLocaleString("en-US"));
  const int = (x) => (x == null ? "—" : Math.round(x).toLocaleString("en-US"));
  const pct = (x, digits = 0) => (x == null || !isFinite(x) ? "—" : (x * 100).toFixed(digits) + "%");
  const ratio = (x) => (x == null ? "—" : x.toFixed(2) + "×");

  function sparkline(values) {
    if (!values || values.length < 2) return "";
    const w = 70, h = 22, max = Math.max(...values, 1);
    const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - (v / max) * (h - 4)}`).join(" ");
    return `<svg width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${css("--single")}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  }

  /** spec: {label, value, prev, fmt, spark, higherIsBetter=true, na} */
  function tiles(el, specs) {
    el.innerHTML = specs.map((s) => {
      if (s.na) return `<div class="an-tile na"><div class="lbl">${esc(s.label)}</div><div class="val">${esc(s.na)}</div></div>`;
      let delta = "";
      if (s.prev != null && s.value != null && s.prev !== 0) {
        const ch = s.value / s.prev - 1, good = (ch >= 0) === (s.higherIsBetter !== false);
        delta = `<span class="delta ${good ? "up" : "down"}">${ch >= 0 ? "▲" : "▼"} ${pct(Math.abs(ch))}</span>`;
      } else if (s.prev === 0 && s.value) delta = `<span class="delta up">▲ new</span>`;
      return `<div class="an-tile"><div class="lbl">${esc(s.label)}</div><div class="val">${s.fmt(s.value)}</div>
        <div class="sub"><span>${delta || "&nbsp;"} ${s.prev == null ? "" : `<span title="previous period">vs ${s.fmt(s.prev)}</span>`}</span>${sparkline(s.spark)}</div></div>`;
    }).join("");
  }

  /** cols: [{key, label, fmt?, num?, bar?}] ; bar renders an inline magnitude bar behind the value. */
  function table(el, cols, rows, { empty = "No data in this range.", limit } = {}) {
    if (!rows.length) { el.innerHTML = `<div class="an-empty">${esc(empty)}</div>`; return; }
    const shown = limit ? rows.slice(0, limit) : rows;
    const maxes = Object.fromEntries(cols.filter((c) => c.bar).map((c) => [c.key, Math.max(...shown.map((r) => r[c.key] || 0), 1)]));
    const head = cols.map((c) => `<th class="${c.num ? "num" : ""}">${esc(c.label)}</th>`).join("");
    const body = shown.map((r) => "<tr>" + cols.map((c) => {
      const raw = r[c.key], txt = c.fmt ? c.fmt(raw, r) : esc(raw);
      if (c.bar) return `<td class="num bar-cell"><span class="b" style="width:${((raw || 0) / maxes[c.key]) * 100}%"></span><span class="v">${txt}</span></td>`;
      return `<td class="${c.num ? "num" : ""}">${txt}</td>`;
    }).join("") + "</tr>").join("");
    el.innerHTML = `<div class="tb-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  /** steps: [[label, n]] — width = share of first step; highlights the worst step-to-step conversion. */
  function funnel(el, steps, note) {
    if (!steps.length || !steps[0][1]) { el.innerHTML = `<div class="an-empty">${esc(note || "No data in this range.")}</div>`; return; }
    const top = steps[0][1];
    let worst = -1, worstLoss = -1;
    steps.forEach(([, n], i) => {
      if (i && steps[i - 1][1] >= 5) { const loss = 1 - n / steps[i - 1][1]; if (loss > worstLoss) { worstLoss = loss; worst = i; } }
    });
    el.innerHTML = `<div class="an-funnel">${steps.map(([label, n], i) => {
      const conv = i ? pct(steps[i - 1][1] ? n / steps[i - 1][1] : 0) + " of prev" : "";
      return `<div class="step ${i === worst ? "worst" : ""}" title="${esc(label)}: ${n} (${pct(n / top, 1)} of first step)">
        <span class="lbl">${esc(label)}</span><div class="track"><div class="fill" style="width:${(n / top) * 100}%"></div></div>
        <span class="conv">${int(n)} · ${conv || "100%"}</span></div>`;
    }).join("")}</div>${note ? `<p class="muted">${esc(note)}</p>` : ""}`;
  }

  const shortWeek = (w) => new Date(w + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  function baseOptions({ stacked = false, legend = false, yFmt } = {}) {
    const grid = css("--grid"), muted = "#5c6770";
    return {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: legend, position: "top", align: "start", labels: { boxWidth: 10, boxHeight: 10, color: muted, font: { size: 11 } } },
        tooltip: { callbacks: yFmt ? { label: (c) => `${c.dataset.label}: ${yFmt(c.parsed.y)}` } : {} },
      },
      scales: {
        x: { stacked, grid: { display: false }, ticks: { color: muted, font: { size: 10 }, maxRotation: 0, autoSkipPadding: 12 } },
        y: { stacked, beginAtZero: true, grid: { color: grid }, border: { display: false },
          ticks: { color: muted, font: { size: 10 }, precision: 0, callback: yFmt ? (v) => yFmt(v) : undefined } },
      },
    };
  }

  function draw(id, config) {
    if (charts[id]) charts[id].destroy();
    const el = document.getElementById(id);
    if (!el) return;
    charts[id] = new Chart(el, config);
  }

  /** series: [{label, values}] ; type line|bar ; one series → brand colour, no legend. */
  function chart(id, labels, series, { type = "line", stacked = false, yFmt, labelFmt = shortWeek } = {}) {
    const palette = SERIES(), single = series.length === 1;
    const datasets = series.map((s, i) => {
      const color = single ? css("--single") : palette[i % palette.length];
      return type === "line"
        ? { label: s.label, data: s.values, borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.25 }
        : { label: s.label, data: s.values, backgroundColor: color, borderColor: "#ffffff", borderWidth: stacked ? { top: 2 } : 0,
            borderRadius: stacked ? 0 : { topLeft: 4, topRight: 4 }, borderSkipped: false, maxBarThickness: 28 };
    });
    draw(id, { type, data: { labels: labels.map(labelFmt), datasets }, options: baseOptions({ stacked, legend: !single, yFmt }) });
  }

  /** Top N categories + "Other" (fixed slot order — colour follows rank in the full range, not the filter). */
  function topN(entries, n = 6) {
    const top = entries.slice(0, n), rest = entries.slice(n).reduce((s, [, v]) => s + v, 0);
    return rest ? [...top, ["Other", rest]] : top;
  }

  window.AN = window.AN || {};
  Object.assign(window.AN, { render: { tiles, table, funnel, chart, topN, esc, thb, int, pct, ratio, shortWeek } });
})();
