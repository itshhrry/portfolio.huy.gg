/* Plate XV, the time machine: carbon's sheets drawn after two Accurat pieces for La Lettura. Above the rail, "Crazy market
   bubbles": every burst, a run of days when a sheet carried twice its usual rows or more, as a bubble placed by its peak
   day and by how many times its usual day it reached, as large as the rows it carried. Below the rail, "Art movie time
   machine": one arc per sheet from the day carbon got the sheet back up to the first day its rows describe, with a footer
   under each foot. Counts come from schema_data.js, the same rows as Plates XIII and XIV. */
"use strict";
(() => {
  const { svg, h, text } = L;
  const SD = window.SCHEMA_DATA, S = K.SCHEMA, F = K.fmt;
  const fx = (v) => v.toFixed(1);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const md = (s) => `${MONTHS[+s.slice(5, 7) - 1]} ${+s.slice(8)}`;

  const FAMS = [
    { key: "host", name: "Hosts", src: "host_rollups", sheets: ["Host Days", "Host CPU", "Host Load", "Host Disk", "Host Temp", "Host Memory"] },
    { key: "container", name: "Containers", src: "container_rollups", sheets: ["Container Days"] },
    { key: "endpoint", name: "Endpoints", src: "endpoint_rollups", sheets: ["Endpoint Days", "Endpoint Latency", "Endpoint Certs"] },
    { key: "event", name: "Events", src: "events", sheets: ["Events", "Event Details"] },
    { key: "telemetry", name: "Claude telemetry", src: "dash.json", sheets: ["Telemetry Days", "Model Days"] },
    { key: "planned", name: "Planned", src: "queued", sheets: ["Wellness Days", "Backup Runs", "Prompt Days"], planned: true },
  ];
  // The commit that first wrote each sheet into collector/carbon/create_tables.py or collector/mirror.mjs, by git log -S;
  // the planned sheets have no commit yet and take their queue entry instead.
  const BUILT = [
    { day: "2026-09-26", label: "Sep 26", ref: "641d655", sheets: ["Telemetry Days"] },
    { day: "2026-10-21", label: "Oct 21", ref: "d4018a4", sheets: ["Host Days", "Host CPU", "Host Load", "Host Disk", "Host Temp", "Container Days", "Endpoint Days", "Events", "Event Details"] },
    { day: "2026-10-21", label: "Oct 21", ref: "662b24c", sheets: ["Host Memory", "Endpoint Latency", "Endpoint Certs"] },
    { day: "2026-10-24", label: "Oct 24", ref: "b78c976", sheets: ["Model Days"] },
    { day: null, label: "Queued", ref: "queued", sheets: ["Wellness Days", "Backup Runs", "Prompt Days"] },
  ];
  const LINKS_TO = {
    "Container Days": ["Machines", "Containers"], "Endpoint Days": ["Machines", "Services"], "Endpoint Latency": ["Machines", "Services"],
    "Endpoint Certs": ["Machines", "Services"], Events: ["Machines"], "Event Details": [], "Telemetry Days": [], "Wellness Days": [],
    "Backup Runs": ["Machines"], "Prompt Days": ["Models"], "Model Days": ["Models"],
  };
  const linksOf = (sheet) => LINKS_TO[sheet] || ["Machines"];
  const famOf = (sheet) => FAMS.find((f) => f.sheets.includes(sheet));
  const colOf = (fam) => (fam.planned ? "var(--muted)" : S.FAM[fam.key].color);
  const LETTER = { host_rollups: "h", container_rollups: "c", endpoint_rollups: "e", events: "v", "dash.json": "d" };
  const QSRC = { "Wellness Days": "w", "Backup Runs": "b", "Prompt Days": "p" };
  const letterOf = (sheet) => QSRC[sheet] || LETTER[famOf(sheet).src];

  // A sheet's usual day is the median of its days with rows; a burst is a run of days at twice that or more.
  function profile(sheet) {
    const c = SD.sheets[sheet] ? SD.sheets[sheet].counts : [];
    const f = c.findIndex((v) => v > 0);
    if (f < 0) return null;
    const act = c.slice(f).filter((v) => v > 0).sort((a, b) => a - b), m = act.length;
    const med = m % 2 ? act[(m - 1) / 2] : (act[m / 2 - 1] + act[m / 2]) / 2;
    const bursts = [];
    let run = null;
    for (let i = f; i <= c.length; i++) {
      if (i < c.length && c[i] >= 2 * med) { run = run || { a: i, b: i }; run.b = i; continue; }
      if (run) {
        const seg = c.slice(run.a, run.b + 1), pk = Math.max(...seg), p = run.a + seg.indexOf(pk);
        bursts.push({ sheet, a: run.a, b: run.b, p, peak: pk, med, ratio: pk / med, rows: seg.reduce((x, y) => x + y, 0), parts: SD.sheets[sheet].parts[p] });
        run = null;
      }
    }
    return { sheet, first: f, med, rows: c.reduce((x, y) => x + y, 0), days: c.filter((v) => v > 0).length, bursts };
  }

  const PROF = SD && S ? Object.fromEntries(FAMS.flatMap((fm) => fm.sheets).map((sh) => [sh, profile(sh)]).filter(([, p]) => p)) : {};
  const BURSTS = Object.values(PROF).flatMap((p) => p.bursts);
  // The tallest burst in each family carries a numbered ring and a note, numbered by date.
  const FEAT = FAMS.map((fm) => BURSTS.filter((b) => fm.sheets.includes(b.sheet)).sort((a, b) => b.ratio - a.ratio || b.rows - a.rows)[0]).filter(Boolean).sort((a, b) => a.p - b.p);
  // The rail's time scale. Before the first host row only Claude telemetry and the queued sheets have rows, so those days
  // share a quarter of the rail; after it each month takes room in proportion to its rows, so the month the bursts fall in
  // gets the room they need and a new month joins on its own. A floor keeps a thin month readable.
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function monthAxis(days, rowsOn, split, cut = 0.25, floor = 0.08) {
    const N = days.length, segs = [];
    for (let i = split; i < N; i++) {
      const m = days[i].slice(0, 7);
      if (!segs.length || segs[segs.length - 1].month !== m) segs.push({ month: m, name: MONTH_NAMES[+m.slice(5) - 1], from: i, to: i + 1, rows: 0 });
      const g = segs[segs.length - 1]; g.to = i + 1; g.rows += rowsOn(i);
    }
    const total = segs.reduce((a, g) => a + g.rows, 0) || 1, w = segs.map((g) => Math.max(g.rows / total, floor)), W = w.reduce((a, b) => a + b, 0) || 1;
    let at = cut;
    segs.forEach((g, k) => { g.start = at; g.share = (w[k] / W) * (1 - cut); at += g.share; });
    const frac = (t) => {
      if (t < split) return (t / split) * cut;
      if (t >= N) return 1;
      const g = segs.find((x) => t < x.to) || segs[segs.length - 1];
      return g.start + ((t - g.from) / (g.to - g.from)) * g.share;
    };
    const widest = segs.reduce((a, g) => (!a || g.share / (g.to - g.from) > a.share / (a.to - a.from) ? g : a), null);
    return { segs, frac, widest };
  }
  const SPLIT = SD ? Math.max(1, SD.sheets["Host Days"].counts.findIndex((c) => c > 0)) : 1;
  const AXIS = SD ? monthAxis(SD.days, (i) => Object.values(SD.sheets).reduce((a, x) => a + (x.counts[i] || 0), 0), SPLIT) : null;
  const shareWords = AXIS ? AXIS.segs.map((g) => `${g.name} ${Math.round(g.share * 100)}%`).join(", ") : "";
  K.LANES = { BUILT, PROF, BURSTS, FEAT, FAMS, monthAxis, AXIS };
  const topParts = (parts, k = 3) => Object.entries(parts || {}).sort((a, b) => b[1] - a[1]).slice(0, k).map(([n, v]) => `${n.replace(/_/g, " ")} ${v}`).join(", ");

  if (SD && S) {
    const sheets = Object.keys(PROF).length, made = BUILT.filter((g) => g.day), built = made.reduce((a, g) => a + g.sheets.length, 0);
    // The section's claim spans all three plates, so it is set here, where the build dates and the day span are both known.
    const span = Math.round((Date.parse(made[made.length - 1].day) - Date.parse(made[0].day)) / 864e5), months = Math.round((Date.parse(SD.last) - Date.parse(SD.first)) / 864e5 / 30.4);
    K.set("schema-claim", `The mirror is a <b>galaxy schema</b> around Days and Machines, built in ${span} days of commits and holding ${months} months of days`);
    K.set("lanes-meta", `${sheets} sheets, ${BURSTS.length} bursts, ${md(SD.first)} to ${md(SD.last)}, after Accurat's "Crazy market bubbles" and "Art movie time machine"`);
    K.set("lanes-desc", `The mirror wrote ${built} of carbon's sheets on ${new Set(made.map((g) => g.day)).size} days of commits, and those sheets reach back months. Below the rail, each arc runs from the day a sheet was written into the mirror up to the first day its rows describe, so the farther an arc leans left, the older carbon's first row is than the sheet that holds it. Above the rail, every <b>burst</b>, a run of days when a sheet carried twice its usual rows or more, rises as a bubble: across by its peak day, up by how many times its usual day it reached, and as large as the rows it carried.`);
    K.set("lanes-howto", "Start on the lower rail, where each sheet stands on the commit that built it. Follow its arc up to the upper rail for the first day it holds; dashed arcs are sheets still queued. Under each foot hang its rows (the bar), one dot for each dimension it links to besides Days, and a letter for the table it reads. Above, a bubble is one burst, its color the sheet's family; a numbered ring marks each family's tallest, captioned at the upper left and explained in the notes below the plate. The upper rail is itself a chart: one stream per family, its rows a day, each scaled to its own busiest day. Point anywhere above or on the rail for that day's rows and the bursts running then; click a foot, an arc, or a bubble to keep that sheet and dim the rest, and click again to let go.");
    K.set("lanes-src", `Rows counted by the nightly ML build's schema_data.py from sphere.db and dash.json with the rules of collector/mirror.mjs, days ending before ${md(SD.snapshot)}; a sheet's build date is the commit that first wrote it, by git log. The days before ${md(SD.days[SPLIT])} share a quarter of the time axis, and after them each month takes room by its rows: ${shareWords}. Forms from Accurat's La Lettura pieces, carded in the Research Hub's data visualization library.`);
    const lg = document.getElementById("lanes-legend");
    if (lg) {
      lg.replaceChildren();
      FAMS.forEach((fm) => { const sp = h("span", {}, lg); h("i", { style: fm.planned ? "background:none;border:1.4px dashed var(--muted);box-sizing:border-box" : `background:${colOf(fm)}` }, sp); sp.append(fm.name); });
    }
    const smp = document.getElementById("lanes-sample");
    if (smp) {
      smp.replaceChildren();
      const s = svg("svg", { viewBox: "0 0 300 170", "aria-hidden": "true" }, smp);
      svg("circle", { cx: 70, cy: 36, r: 18, fill: "var(--c2)", "fill-opacity": 0.28, stroke: "var(--c2)", "stroke-width": 1.2 }, s);
      svg("circle", { cx: 70, cy: 36, r: 23, fill: "none", stroke: "var(--ink)", "stroke-width": 0.8 }, s);
      text(s, 70, 40, "1", "ink", { "text-anchor": "middle", "font-size": 11 });
      text(s, 104, 24, "a burst: peak day across,", "", {});
      text(s, 104, 38, "times its usual day up,", "", {});
      text(s, 104, 52, "rows in it as size", "", {});
      svg("rect", { x: 10, y: 70, width: 280, height: 9, fill: "var(--sunk)" }, s);
      svg("rect", { x: 10, y: 122, width: 280, height: 9, fill: "var(--sunk)" }, s);
      svg("path", { d: "M60 79C60 104 200 98 200 122", fill: "none", stroke: "var(--c2)", "stroke-width": 1.6 }, s);
      svg("rect", { x: 196, y: 134, width: 8, height: 24, fill: "var(--c2)", opacity: 0.8 }, s);
      [0, 1].forEach((q) => svg("circle", { cx: 212, cy: 138 + q * 7, r: 2.2, fill: "var(--ink)" }, s));
      text(s, 220, 145, "rows, links,", "", {});
      text(s, 220, 159, "the table read", "", {});
      text(s, 12, 66, "first day it holds", "", {});
      text(s, 188, 147, "built on", "", { "text-anchor": "end" });
    }
    const notes = FEAT.map((b, i) => {
      const d0 = SD.days[b.a], d1 = SD.days[b.b], dp = SD.days[b.p], plan = famOf(b.sheet).planned;
      return `<b>${i + 1}.</b> ${b.sheet}${plan ? " (queued)" : ""}, ${d0 === d1 ? md(dp) : `${md(d0)} to ${md(d1)}`}: <b>${F.int(b.peak)}</b> rows on ${md(dp)} against a usual ${F.num(b.med, b.med % 1 ? 1 : 0)}, ${b.ratio.toFixed(1)} times, and ${F.int(b.rows)} rows across the run${b.parts ? `; that day by ${famOf(b.sheet).key === "event" ? "kind" : "part"}: ${topParts(b.parts)}` : ""}.`;
    });
    const quiet = Object.values(PROF).filter((p) => !p.bursts.length).map((p) => p.sheet);
    notes.push(`${quiet.length} sheets never burst: ${quiet.join(", ")}. A sheet that writes one row per machine or service per day stays at its usual day until a new machine or service starts writing to it.`);
    const tl = PROF["Telemetry Days"];
    const mdP = PROF["Model Days"], mdB = BUILT.find((g) => g.sheets.includes("Model Days"));
    if (tl && mdP && mdB) notes.push(`Model Days draws the longest arc: written ${md(mdB.day)} in ${mdB.ref}, it reaches back to ${md(SD.days[mdP.first])}, past Telemetry Days, written ${md(BUILT[0].day)}. Its bar counts ${F.int(mdP.rows)} model-days on ${mdP.days} days in dash.json, the same rows carbon's Model Days holds since fe5e32d kept the synthetic model's entry.`);
    K.ev("lanes-ev", notes);
  }

  function lanesPlate(node) {
    node.replaceChildren();
    if (!SD || !S) { h("p", { class: "note" }, node, "This plate needs schema_data.js and Plate XIII's ml-schema.js."); return; }
    // A fixed drawing size: the card scales with the window, so text and marks grow together.
    const W = 1400, Hh = 1060, N = SD.days.length;
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, role: "img", tabindex: 0, class: "tmach", "aria-label": `Carbon's sheets from ${md(SD.first)} to ${md(SD.last)}: ${BURSTS.length} bursts as bubbles above a time rail, and one arc per sheet from the day it was built to the first day it holds.` }, node);
    const x0 = 178, x1 = W - 26;
    const split = SPLIT, { frac, segs, widest } = AXIS;
    const X = (i) => x0 + frac(i + 0.5) * (x1 - x0);
    // The upper rail is a band of each family's rows a day, so the streams share the bubbles' time axis and the arcs
    // land on its lower edge.
    const BH = 16, yTop = 50, yBot = 333, yU = 374, yUB = yU + FAMS.length * BH, yL = 707, RAIL = 15;
    const maxR = Math.max(2.4, ...BURSTS.map((b) => b.ratio)) * 1.08;
    const Y = (r) => yBot - (Math.log(r / 2) / Math.log(maxR / 2)) * (yBot - yTop);
    const maxRows = Math.max(1, ...BURSTS.map((b) => b.rows)), Rb = (rows) => 5 + 30 * Math.sqrt(rows / maxRows);
    const gB = svg("g", {}, s), gA = svg("g", {}, s), gD = svg("g", {}, s), gT = svg("g", {}, s), gH = svg("g", {}, s);
    const hits = [];

    // The scatter's scale: times the sheet's usual day.
    [2, 3, 4, 5, 6, 8].filter((r) => r <= maxR).forEach((r) => {
      const y = Y(r);
      svg("path", { class: "guide dash", d: `M${x0} ${fx(y)}L${x1} ${fx(y)}` }, gB);
      text(gT, x0 - 8, fx(y + 4), `${r}×`, "", { "text-anchor": "end" });
    });
    text(gT, x0 - 8, fx(yTop - 10), "TIMES ITS USUAL DAY", "eng", { "text-anchor": "end" });

    // The upper rail: one stream per family, each scaled to its own busiest day and named in the gutter with that day's rows.
    svg("rect", { x: x0, y: fx(yU), width: x1 - x0, height: yUB - yU, fill: "var(--sunk)" }, gB);
    text(gT, x0 - 8, fx(yU - 7), "ROWS A DAY", "eng", { "text-anchor": "end" });
    const famRows = FAMS.map((fm) => SD.days.map((_, i) => fm.sheets.reduce((a, x) => a + (SD.sheets[x] ? SD.sheets[x].counts[i] : 0), 0)));
    FAMS.forEach((fm, q) => {
      const v = famRows[q], mx = Math.max(1, ...v), base = yU + (q + 1) * BH - 2, amp = BH - 4;
      if (q) svg("path", { d: `M${x0} ${fx(yU + q * BH)}L${x1} ${fx(yU + q * BH)}`, stroke: "var(--panel2)", "stroke-width": 1 }, gB);
      const on = v.map((c, i) => c > 0 || (i && v[i - 1] > 0) || (i < v.length - 1 && v[i + 1] > 0));
      const a = on.indexOf(true), b = on.lastIndexOf(true);
      if (a >= 0) {
        const pts = v.slice(a, b + 1).map((c, j) => [X(a + j), base - (c / mx) * amp]);
        const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${fx(x)} ${fx(y)}`).join("");
        if (!fm.planned) svg("path", { d: `${line}L${fx(pts[pts.length - 1][0])} ${fx(base)}L${fx(pts[0][0])} ${fx(base)}Z`, fill: colOf(fm), opacity: 0.22 }, gD);
        svg("path", { d: line, fill: "none", stroke: colOf(fm), "stroke-width": 1.2, "stroke-dasharray": fm.planned ? "3 2" : null }, gD);
      }
      text(gT, x0 - 8, fx(base - 2), `${fm.name}, up to ${mx}`, "it", { "text-anchor": "end", "font-size": 11, fill: colOf(fm) });
    });
    // Month starts, plus every Monday inside the widest month, where a day is wide enough to name.
    let lastX = -1e9;
    SD.days.forEach((d, i) => {
      const mon = new Date(`${d}T12:00`).getDay() === 1;
      if (!(d.slice(8) === "01" || i === 0 || (widest && i >= widest.from && i < widest.to && mon))) return;
      const x = x0 + frac(i) * (x1 - x0), first = d.slice(8) === "01" || i === 0;
      svg("path", { class: first ? "guide dash" : "guide", d: `M${fx(x)} ${fx(yTop)}L${fx(x)} ${fx(yUB)}`, opacity: first ? null : 0.45 }, gB);
      if (x - lastX < 46) return;
      text(gT, fx(x + 4), fx(yU - 6), first && i ? MONTHS[+d.slice(5, 7) - 1] : md(d), "eng t halo", { fill: first ? "var(--ink)" : null });
      lastX = x;
    });
    // A zigzag break marks each change of time scale; its hover says what the scale on either side is.
    const room = (g) => `${g.name}'s ${g.to - g.from} days take ${Math.round(g.share * 100)}% of the rail, for its ${F.int(g.rows)} rows`;
    [[split, `Before ${md(SD.days[split])}, ${split} days share a quarter of the rail; from here, ${room(segs[0])}.`],
      ...segs.slice(1).map((g) => [g.from, `From here, ${room(g)}.`])].forEach(([t, say]) => {
      const xb = x0 + frac(t) * (x1 - x0) - 6;
      const zz = svg("path", { d: `M${fx(xb - 3)} ${fx(yU - 3)}L${fx(xb + 3)} ${fx(yU + 4)}L${fx(xb - 3)} ${fx(yU + 11)}L${fx(xb + 3)} ${fx(yU + 18)}`, fill: "none", stroke: "var(--ink)", "stroke-width": 1 }, gT);
      const hz = svg("rect", { x: fx(xb - 8), y: fx(yU - 6), width: 16, height: 28, fill: "transparent" }, gT);
      L.hover(hz, "The time scale changes", () => [{ note: say }]);
      zz.setAttribute("pointer-events", "none");
    });
    const bi = SD.days.indexOf(SD.bookmarks.day);
    if (bi >= 0) {
      const xc = x0 + frac(bi + 1) * (x1 - x0);
      svg("path", { class: "cutline", d: `M${fx(xc)} ${fx(yTop)}L${fx(xc)} ${fx(yUB)}` }, gB);
      text(gT, fx(xc - 5), fx(yBot + 22), `carbon holds through ${md(SD.bookmarks.day)}`, "it halo", { "text-anchor": "end", "font-size": 11 });
    }

    // Bubbles, largest first so the small ones stay on top; each family's tallest burst wears a numbered ring.
    BURSTS.slice().sort((a, b) => b.rows - a.rows).forEach((b) => {
      const fm = famOf(b.sheet), col = colOf(fm), r = Rb(b.rows), cx = X(b.p), cy = Y(b.ratio);
      svg("circle", { cx: fx(cx), cy: fx(cy), r: fx(r), fill: fm.planned ? "none" : col, "fill-opacity": 0.24, stroke: col, "stroke-width": 1.1, "stroke-dasharray": fm.planned ? "3 2.5" : null, "data-sheet": b.sheet, class: "sh" }, gD);
      hits.push({ kind: "burst", x: cx, y: cy, r, b });
    });
    FEAT.forEach((b, i) => {
      const r = Rb(b.rows) + 5, cx = X(b.p), cy = Y(b.ratio), gF = svg("g", { "data-sheet": b.sheet, class: "sh" }, gT);
      svg("circle", { cx: fx(cx), cy: fx(cy), r: fx(r), fill: "none", stroke: "var(--ink)", "stroke-width": 0.9 }, gF);
      const a = -Math.PI / 4, lx = cx + Math.cos(a) * r, ly = cy + Math.sin(a) * r;
      svg("circle", { cx: fx(lx), cy: fx(ly), r: 8, fill: "var(--panel2)", stroke: "var(--ink)", "stroke-width": 0.9 }, gF);
      text(gF, fx(lx), fx(ly + 0.5), String(i + 1), "serif", { "text-anchor": "middle", "dominant-baseline": "central", "font-size": 10.5 });
      text(gF, fx(lx + 12), fx(ly + 4), b.sheet, "it ink halo", { "font-size": 11.5 });
    });

    // The plate's claim and the numbered captions sit in the quiet months, where no built sheet has a burst.
    const big = BUILT[1], bigFirst = Math.min(...big.sheets.concat(BUILT[2].sheets).filter((x) => PROF[x]).map((x) => PROF[x].first));
    const cx0 = x0 + 18;
    text(gT, cx0, fx(yTop + 22), `${big.sheets.length + BUILT[2].sheets.length} sheets written into carbon on ${big.label}`, "it big", { "font-size": 19 });
    text(gT, cx0, fx(yTop + 46), `hold rows back to ${md(SD.days[bigFirst])}; Claude telemetry, written ${BUILT[0].label}, back to ${md(SD.first)}.`, "it big", { "font-size": 19 });
    FEAT.forEach((b, i) => {
      const y = yTop + 84 + i * 21, d0 = SD.days[b.a], d1 = SD.days[b.b];
      svg("circle", { cx: cx0 + 8, cy: fx(y - 4), r: 8, fill: "var(--panel2)", stroke: "var(--ink)", "stroke-width": 0.9 }, gT);
      text(gT, cx0 + 8, fx(y - 3.5), String(i + 1), "serif", { "text-anchor": "middle", "dominant-baseline": "central", "font-size": 10.5 });
      text(gT, cx0 + 24, fx(y), `${b.sheet}${famOf(b.sheet).planned ? ", queued" : ""}, ${d0 === d1 ? md(d0) : `${md(d0)} to ${md(d1)}`}: ${F.int(b.peak)} rows against a usual ${F.num(b.med, b.med % 1 ? 1 : 0)}`, "it ink", { "font-size": 12.5 });
    });

    // The lower rail: the commit that built each sheet, one slot per sheet, a gap between commits.
    const slots = [];
    BUILT.forEach((g, q) => g.sheets.forEach((sh) => { if (PROF[sh]) slots.push({ sh, g, q }); }));
    const gaps = BUILT.length - 1, slot = (x1 - x0) / (slots.length + gaps * 0.9);
    let cur = x0, lastQ = 0;
    slots.forEach((o) => { if (o.q !== lastQ) { cur += slot * 0.9; lastQ = o.q; } o.x = cur + slot / 2; cur += slot; });
    text(gT, x0 - 8, fx(yL + 11), "BUILT", "eng", { "text-anchor": "end" });
    BUILT.forEach((g, q) => {
      const mine = slots.filter((o) => o.q === q);
      if (!mine.length) return;
      const a = mine[0].x - slot / 2 + 2, b = mine[mine.length - 1].x + slot / 2 - 2;
      svg("rect", { x: fx(a), y: fx(yL), width: fx(b - a), height: RAIL, fill: "var(--sunk)", stroke: g.day ? "none" : "var(--muted)", "stroke-dasharray": g.day ? null : "3 3" }, gB);
      text(gT, fx(a + 3), fx(yL + 11), mine.length > 1 ? `${g.label}, ${g.ref}` : g.label, "it ink", { "font-size": 10.5 });
      if (mine.length === 1) text(gT, fx(a + 3), fx(yL - 5), g.ref, "it halo", { "font-size": 10 });
    });

    // Arcs from each foot up to the first day the sheet holds, and the footer under each foot.
    const maxSheet = Math.max(...Object.values(PROF).map((p) => p.rows));
    slots.forEach((o) => {
      const p = PROF[o.sh], fm = famOf(o.sh), col = colOf(fm), hx = X(p.first), k = (yL - yUB) * 0.62;
      const d = `M${fx(o.x)} ${fx(yL)}C${fx(o.x)} ${fx(yL - k)} ${fx(hx)} ${fx(yUB + k)} ${fx(hx)} ${fx(yUB)}`;
      const g = svg("g", { "data-sheet": o.sh, class: "sh" }, gA);
      svg("path", { d, fill: "none", stroke: col, "stroke-width": fm.planned ? 1.2 : 1.7, opacity: fm.planned ? 0.45 : 0.85, "stroke-dasharray": fm.planned ? "4 3" : null }, g);
      svg("circle", { cx: fx(hx), cy: fx(yUB), r: 2.6, fill: col }, g);
      svg("circle", { cx: fx(o.x), cy: fx(yL), r: 2.6, fill: col }, g);
      const fy = yL + RAIL + 6, bh = 6 + 54 * Math.sqrt(p.rows / maxSheet);
      svg("rect", { x: fx(o.x - 4), y: fx(fy), width: 8, height: fx(bh), fill: fm.planned ? "none" : col, stroke: col, "stroke-dasharray": fm.planned ? "2 2" : null, opacity: 0.85 }, g);
      text(g, fx(o.x + 7), fx(fy + 9), F.int(p.rows), "it", { "font-size": 10 });
      const links = linksOf(o.sh);
      links.forEach((_, j) => svg("circle", { cx: fx(o.x), cy: fx(fy + bh + 7 + j * 7), r: 2.2, fill: "var(--ink)" }, g));
      const ly = fy + bh + 10 + links.length * 7;
      text(g, fx(o.x), fx(ly + 10), letterOf(o.sh), "serif", { "text-anchor": "middle", "font-size": 12, fill: col });
      text(g, fx(o.x + 3), fx(ly + 22), o.sh, "it", { "font-size": 11.5, transform: `rotate(52 ${fx(o.x + 3)} ${fx(ly + 22)})` });
      hits.push({ kind: "sheet", x: o.x, y: yL, r: 10, o, p }, { kind: "sheet", x: o.x, y: fy + bh / 2, r: 9, o, p }, { kind: "sheet", x: hx, y: yUB, r: 6, o, p });
    });

    // A click on a sheet's foot, arc head, or bubble locks it: its arc and bubbles stay and the other sheets dim.
    let lock = null;
    const setLock = (sheet) => {
      lock = lock === sheet ? null : sheet;
      s.classList.toggle("locked", !!lock);
      s.querySelectorAll("[data-sheet]").forEach((el) => el.classList.toggle("off", !!lock && el.getAttribute("data-sheet") !== lock));
    };
    const ring = svg("circle", { fill: "none", stroke: "var(--ink)", "stroke-width": 1.2, visibility: "hidden" }, gH);
    const dayLine = svg("path", { class: "cutline", visibility: "hidden", style: "opacity:.9" }, gH);
    const hide = () => { ring.setAttribute("visibility", "hidden"); dayLine.setAttribute("visibility", "hidden"); L.tip.hide(); };
    const XS = SD.days.map((_, i) => X(i));
    const pick = (e) => {
      const [px, py] = K.local(s, e);
      let best = null, bd = Infinity;
      hits.forEach((o) => { const dd = Math.hypot(o.x - px, o.y - py) - o.r; if (dd < 8 && dd < bd) { bd = dd; best = o; } });
      if (best || px < x0 || px > x1 || py < yTop - 10 || py > yUB + 4) return best;
      let i = 0;
      XS.forEach((x, j) => { if (Math.abs(x - px) < Math.abs(XS[i] - px)) i = j; });
      return { kind: "day", i };
    };
    s.addEventListener("click", (e) => { const b = pick(e); if (b && b.kind !== "day") setLock(b.kind === "burst" ? b.b.sheet : b.o.sh); else if (lock) setLock(lock); });
    s.addEventListener("pointermove", (e) => {
      const best = pick(e);
      if (!best) { hide(); return; }
      if (best.kind === "day") {
        // Every series that shares the time axis answers the same hover: each family's rows and the bursts running that day.
        const i = best.i, x = XS[i], runs = BURSTS.filter((b) => b.a <= i && i <= b.b);
        ring.setAttribute("visibility", "hidden");
        dayLine.setAttribute("d", `M${fx(x)} ${fx(yTop)}L${fx(x)} ${fx(yUB)}`); dayLine.setAttribute("visibility", "visible");
        L.tip.show(e, `${F.wday(SD.days[i])} ${md(SD.days[i])}`, [
          ...FAMS.map((fm, q) => ({ value: F.int(famRows[q][i]), label: `${fm.name} rows`, color: colOf(fm) })),
          ...(runs.length ? runs.map((b) => ({ value: `${F.int(SD.sheets[b.sheet].counts[i])}, ${(SD.sheets[b.sheet].counts[i] / b.med).toFixed(1)}× usual`, label: `${b.sheet} in a burst`, color: colOf(famOf(b.sheet)) })) : [{ value: "none", label: "bursts that day" }]),
        ]);
        return;
      }
      dayLine.setAttribute("visibility", "hidden");
      ring.setAttribute("cx", fx(best.x)); ring.setAttribute("cy", fx(best.y)); ring.setAttribute("r", fx(best.r + 3)); ring.setAttribute("visibility", "visible");
      if (best.kind === "burst") {
        const b = best.b, d0 = SD.days[b.a], d1 = SD.days[b.b];
        L.tip.show(e, `${b.sheet}, ${d0 === d1 ? md(d0) : `${md(d0)} to ${md(d1)}`}`, [
          { value: `${F.int(b.peak)} on ${md(SD.days[b.p])}`, label: "peak rows" },
          { value: `${F.num(b.med, b.med % 1 ? 1 : 0)}, so ${b.ratio.toFixed(1)}×`, label: "usual day" },
          { value: F.int(b.rows), label: "rows in the run" },
          ...(b.parts ? [{ value: topParts(b.parts, 4), label: "peak day by" }] : []),
        ]);
      } else {
        const { o, p } = best;
        L.tip.show(e, o.sh, [
          { value: o.g.day ? `${md(o.g.day)}, ${o.g.ref}` : `queued, ${o.g.ref}`, label: "built" },
          { value: md(SD.days[p.first]), label: "first day held" },
          { value: `${F.int(p.rows)} on ${p.days} days`, label: "rows" },
          { value: linksOf(o.sh).length ? linksOf(o.sh).join(", ") : "Days only", label: "links to" },
          { value: `${p.bursts.length}`, label: "bursts" },
        ]);
      }
    });
    s.addEventListener("pointerleave", hide);
    K.keySteps(s, N, (i) => [XS[i], (yU + yUB) / 2]);

    // The key along the foot of the plate: what hangs under each foot, which table each letter names, and the breaks.
    const yK = Hh - 92, kw = (x1 - x0) / 4, kc = (q) => x0 + q * kw;
    const keyCol = (q, head, lines) => {
      text(gT, fx(kc(q)), fx(yK), head, "eng", {});
      lines.forEach((ln, k) => text(gT, fx(kc(q)), fx(yK + 20 + k * 17), ln, "it", { "font-size": 12 }));
    };
    keyCol(0, "UNDER EACH FOOT", ["the bar: the sheet's rows across all its days", "a dot for each dimension it links to besides Days", "the letter: the table its rows are read from"]);
    keyCol(1, "THE LETTERS", ["h host_rollups, c container_rollups, e endpoint_rollups", "v events, d dash.json (Claude telemetry)", "queued: w wellness_days, b pull_runs, p daily_totals"]);
    keyCol(2, "THE ZIGZAGS ON THE RAIL", [`a change of time scale: ${md(SD.first)} to ${md(SD.days[split - 1])}`, "share a quarter of the rail, and after that", `each month's room follows its rows: ${shareWords}`]);
    // The circles, drawn as they appear above the rail, each beside its meaning.
    const cx3 = kc(3) + 8;
    text(gT, fx(kc(3)), fx(yK), "THE CIRCLES", "eng", {});
    svg("circle", { cx: fx(cx3), cy: fx(yK + 16), r: 6, fill: S.FAM.event.color, "fill-opacity": 0.24, stroke: S.FAM.event.color, "stroke-width": 1.1 }, gT);
    text(gT, fx(cx3 + 14), fx(yK + 20), "filled: a burst on a sheet carbon already has", "it", { "font-size": 12 });
    svg("circle", { cx: fx(cx3), cy: fx(yK + 33), r: 6, fill: "none", stroke: "var(--muted)", "stroke-width": 1.1, "stroke-dasharray": "3 2.5" }, gT);
    text(gT, fx(cx3 + 14), fx(yK + 37), "hollow, dashed: a burst on a queued sheet", "it", { "font-size": 12 });
    svg("circle", { cx: fx(cx3), cy: fx(yK + 50), r: 5, fill: S.FAM.host.color, "fill-opacity": 0.24, stroke: S.FAM.host.color }, gT);
    svg("circle", { cx: fx(cx3), cy: fx(yK + 50), r: 8, fill: "none", stroke: "var(--ink)", "stroke-width": 0.9 }, gT);
    text(gT, fx(cx3 + 14), fx(yK + 54), "a ring and a number: a family's tallest burst", "it", { "font-size": 12 });

    K.tables(node, [
      ["Each burst: a run of days at twice the sheet's usual rows or more", ["Sheet", "From", "To", "Peak", "Usual day", "Times", "Rows in the run"],
        BURSTS.slice().sort((a, b) => a.p - b.p).map((b) => [b.sheet, md(SD.days[b.a]), md(SD.days[b.b]), F.int(b.peak), F.num(b.med, b.med % 1 ? 1 : 0), b.ratio.toFixed(1), F.int(b.rows)])],
      ["Each sheet: when it was built and how far back it reaches", ["Sheet", "Built", "First day held", "Rows", "Days with rows", "Bursts"],
        slots.map((o) => [o.sh, o.g.day ? `${md(o.g.day)}, ${o.g.ref}` : `queued, ${o.g.ref}`, md(SD.days[PROF[o.sh].first]), F.int(PROF[o.sh].rows), PROF[o.sh].days, PROF[o.sh].bursts.length])],
    ]);
  }

  K.reg("lanes", lanesPlate);
})();
