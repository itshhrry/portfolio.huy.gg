/* The forests. Plate VIII sets each logged score's R² on a protractor, Plate IX draws what each score leans on as a rose,
   Plate X rings ELLIE's held-out days as orbits with the forecast riding beside the CPU, and Plate XI brushes every held-out
   prompt by the forest's chance that it carries the signal. Their linear companions follow each one. */
"use strict";
(() => {
  const { svg, h, text, ticks } = L;
  const M = window.ML, TAU = K.TAU, F = K.fmt;
  const fx = (v) => v.toFixed(1);
  const TGT = [["mood", "Mood"], ["productivity", "Productivity"], ["energy", "Energy"]];
  const G = { lag: true };
  const entry = (t, lag) => M.scores.find((e) => e.target === t && (lag ? e.lag : !e.lag));

  /* ---------- Plate VIII: three protractors ---------- */
  function gaugesPlate(node) {
    node.replaceChildren();
    const card = node.closest(".panel"), ctl = card && card.querySelector(".pctl");
    if (ctl && !ctl.dataset.built) {
      ctl.dataset.built = "1";
      K.seg(ctl, "Inputs", [["with", "With yesterday's score"], ["without", "Without it"]], G.lag ? "with" : "without", (k) => {
        G.lag = k === "with";
        ["gauges", "roses", "oof"].forEach((id) => { const nd = document.getElementById(id); const r = (window.LABR || []).find(([n2]) => n2 === nd); if (r) r[1](nd); });
      });
    }
    const W = Math.round(K.clamp(L.width(node, 900), 340, 980)), cell = W / 3, rad = Math.min(cell / 2 - 46, 150), cy = rad + 34, Hh = cy + 92;
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, role: "img", "aria-label": "Three half dials, one each for mood, productivity, and energy, with zero, the held-out days' own average, at the top. A needle left of zero means the model does worse than that average." }, node);
    const ang = (v) => (K.cut(v, -0.5, 0.5).v / 0.5) * (Math.PI / 2);
    const needles = [];
    let cutAny = false;
    TGT.forEach(([t, lab], q) => {
      const e = entry(t, G.lag);
      if (!e) return;
      const C = cell * (q + 0.5), g = svg("g", {}, s);
      svg("path", { d: K.sector(C, cy, rad - 18, rad, -Math.PI / 2, 0), fill: "var(--hot)", opacity: 0.14, filter: "url(#paint)" }, g);
      svg("path", { d: K.arc(C, cy, rad, -Math.PI / 2, Math.PI / 2), fill: "none", stroke: "var(--ink)", "stroke-width": 1 }, g);
      for (let v = -0.5; v <= 0.5001; v += 0.05) {
        const a = ang(v), major = Math.abs(Math.round(v * 10) - v * 10) < 1e-6, [x0, y0] = K.pt(C, cy, rad, a), [x1, y1] = K.pt(C, cy, rad + (major ? 8 : 4), a);
        svg("line", { x1: fx(x0), y1: fx(y0), x2: fx(x1), y2: fx(y1), stroke: "var(--ink)", opacity: major ? 0.8 : 0.4 }, g);
        if (major) { const [tx, ty] = K.pt(C, cy, rad + 18, a); text(g, fx(tx), fx(ty + 3.5), Math.abs(v) < 1e-9 ? "0" : F.num(v, 1), "mid"); }
      }
      text(g, C, fx(cy - rad - 26), "HELD-OUT AVERAGE", "eng", { "text-anchor": "middle" });
      const [wx, wy] = K.pt(C, cy, rad - 30, -1.05);
      text(g, fx(wx), fx(wy), "worse than", "it", { "text-anchor": "middle", "font-size": 11 });
      text(g, fx(wx), fx(wy + 13), "that average", "it", { "text-anchor": "middle", "font-size": 11 });
      const wedge = (m, sd, r0, r1, col) => svg("path", { d: K.sector(C, cy, r0, r1, ang(m - sd), ang(m + sd)), fill: col, opacity: 0.22 }, g);
      wedge(e.rf.r2, e.rf.sd, rad - 34, rad - 20, "var(--c1)");
      wedge(e.ridge.r2, e.ridge.sd, rad - 50, rad - 36, "var(--c2)");
      const mk = (val, len, col, w) => { const ln = svg("line", { x1: C, y1: cy, x2: C, y2: cy - len, stroke: col, "stroke-width": w, "stroke-linecap": "round" }, g); needles.push([ln, C, cy, len, ang(val)]); return ln; };
      const nf = mk(e.rf.r2, rad - 8, "var(--c1)", 2.6), nr = mk(e.ridge.r2, rad - 30, "var(--c2)", 1.8);
      [[e.rf.r2, rad - 8, "the forest"], [e.ridge.r2, rad - 30, "ridge regression"]].forEach(([v, len, who]) => {
        const k = K.cut(v, -0.5, 0.5);
        if (!k.cut) return;
        const [x, y] = K.pt(C, cy, len, ang(v));
        K.cutMark(g, x, y, `${lab}: ${who}`, F.r2(v), k.cut); cutAny = true;
      });
      const [ox, oy] = K.pt(C, cy, rad + 2, ang(e.rf.oob));
      svg("circle", { cx: fx(ox), cy: fx(oy), r: 3.6, fill: "var(--panel2)", stroke: "var(--c1)", "stroke-width": 1.6 }, g);
      svg("circle", { cx: C, cy, r: 4, fill: "var(--ink)" }, g);
      text(g, C, cy + 30, F.r2(e.rf.r2), "big", { "text-anchor": "middle" });
      text(g, C, cy + 50, lab, "serif", { "text-anchor": "middle", "font-size": 15 });
      text(g, C, cy + 67, `${e.n} logged days`, "it", { "text-anchor": "middle" });
      const rows = () => [{ value: F.r2(e.rf.r2), label: `forest R², spread ${e.rf.sd.toFixed(2)} across 50 folds`, color: "var(--c1)" }, { value: F.r2(e.rf.oob), label: "forest, out of bag" },
        { value: F.r2(e.ridge.r2), label: `ridge R², spread ${e.ridge.sd.toFixed(2)}`, color: "var(--c2)" }, { value: e.rf.mae.toFixed(2), label: "forest's mean error, in points" }, { value: (e.base ? e.base.mae : e.mean_mae).toFixed(2), label: "the fair guess's mean error" }];
      L.hover(nf, `${lab}: the forest`, rows);
      L.hover(nr, `${lab}: ridge regression`, rows);
    });
    // The needles swing out from zero once the plate is in view.
    const set = (k) => needles.forEach(([ln, C, cy0, len, a]) => { const [x, y] = K.pt(C, cy0, len, a * k); ln.setAttribute("x2", fx(x)); ln.setAttribute("y2", fx(y)); });
    if (!G.shown) { set(0); K.enter(node, () => { G.shown = true; K.tween("gauges", 1400, set); setTimeout(() => set(1), 1600); }); } else set(1);
    const lg = document.getElementById("gauges-legend");
    if (lg) { lg.replaceChildren(); [["var(--c1)", "the forest, with its spread across folds"], ["var(--c2)", "ridge regression"], ["var(--hot)", "below the held-out days' own average"]].forEach(([c, t2]) => { const sp = h("span", {}, lg); h("i", { style: `background:${c}` }, sp); sp.append(t2); }); const sp = h("span", {}, lg); h("i", { class: "ring" }, sp); sp.append("the forest's out-of-bag score"); }
    if (lg && cutAny) K.cutKey(lg);
    K.tables(node, [["R² from five-fold cross-validation repeated ten times; zero is the held-out days' own average, and the fair guess is each fold's training average", ["Score", "Inputs", "Days", "Forest R²", "Spread", "Out of bag", "Ridge R²", "Spread", "Fair guess R²", "Forest error", "Fair guess error", "Forward: forest", "Forward: guess"],
      M.scores.map((e) => [e.target, e.lag ? "with yesterday's" : "without", e.n, e.rf.r2, e.rf.sd, e.rf.oob, e.ridge.r2, e.ridge.sd, e.base ? e.base.r2 : null, e.rf.mae, e.base ? e.base.mae : e.mean_mae, e.forward ? e.forward.rf : null, e.forward ? e.forward.base : null])]]);
  }

  /* ---------- Plate IX: what each score leans on ---------- */
  function rosesPlate(node) {
    node.replaceChildren();
    // Below each rose, its inputs ranked as bars, as many rows as carry the plate down to the side column's last line.
    const W = Math.round(K.clamp(L.width(node, 900), 340, 980)), cell = W / 3, R = Math.min(cell / 2 - 34, 170), base = 2 * R + 146;
    const Hh = K.fill(node, base, W), nRows = Math.max(0, Math.min(10, Math.floor((Hh - base - 30) / 22))), RH = nRows ? K.clamp((Hh - base - 30) / nRows, 22, 38) : 22;
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, role: "img", "aria-label": "Three roses, one per logged score, with a petal per input as long as the score's error grows when that input is shuffled." }, node);
    const es = TGT.map(([t]) => entry(t, G.lag)).filter(Boolean);
    const feats = es[0].imp.map((r) => r[0]).sort(), gmax = Math.max(...es.flatMap((e) => e.imp.map((r) => r[1])), 1e-6);
    es.forEach((e, q) => {
      const C = cell * (q + 0.5), cy = R + 44, r0 = R * 0.16, by = Object.fromEntries(e.imp.map((r) => [r[0], r])), nF = feats.length, g = svg("g", {}, s);
      [0.5, 1].forEach((f) => svg("circle", { cx: fx(C), cy: fx(cy), r: fx(r0 + (R - r0) * f), class: "guide dash" }, g));
      const top = e.imp.slice(0, 4).map((r) => r[0]);
      const gp = svg("g", { filter: "url(#paint)", class: "wash" }, g);
      feats.forEach((f, k) => {
        const a0 = (k / nF) * TAU, a1 = a0 + (TAU / nF) * 0.82, v = by[f] ? by[f][1] : 0, len = Math.max(0, v) / gmax;
        const el = svg("path", { d: K.sector(C, cy, r0, r0 + Math.max(1.5, (R - r0) * Math.sqrt(len)), a0, a1), fill: v > 0 ? "var(--acc)" : "var(--cold)", opacity: v > 0 ? 0.75 : 0.3 }, gp);
        L.hover(el, K.name(f), () => [{ value: by[f] ? by[f][1].toFixed(4) : "n/a", label: "R² lost when shuffled" }, { value: by[f] ? by[f][2].toFixed(4) : "n/a", label: "spread across the five folds" }, { note: K.PLAIN.perm }]);
        if (top.includes(f)) { const am = (a0 + a1) / 2, [lx, ly] = K.pt(C, cy, r0 + (R - r0) * Math.sqrt(len) + 12, am), sx = Math.sin(am); text(g, fx(lx), fx(ly + 4), K.name(f), "it ink", { "text-anchor": sx > 0.2 ? "start" : sx < -0.2 ? "end" : "middle", "font-size": 11.5 }); }
      });
      text(g, fx(C), fx(cy + R + 40), TGT.find(([t]) => t === e.target)[1], "serif", { "text-anchor": "middle", "font-size": 15 });
      text(g, fx(C), fx(cy + R + 57), `forest R² ${F.r2(e.rf.r2)}`, "it", { "text-anchor": "middle" });
      if (e.base && e.rf.r2 < e.base.r2) text(g, fx(C), fx(cy + R + 74), "worse than guessing the average: a weak hint", "it", { "text-anchor": "middle", "font-size": 11, fill: "var(--hot)" });
      if (nRows) {
        const y0 = base + 6, bx0 = cell * q + cell * 0.52, bw = cell * 0.4, top = e.imp.slice(0, nRows), mx = Math.max(...top.map((r) => r[1]), 1e-9);
        text(g, fx(cell * q + 14), fx(y0 - 8), "LEANS ON, MOST FIRST", "eng", {});
        top.forEach(([f, v, sd], k) => {
          const y = y0 + k * RH + 12;
          text(g, fx(bx0 - 8), fx(y + 4), K.name(f), "it", { "text-anchor": "end", "font-size": 11.5 });
          const bar = svg("rect", { x: fx(bx0), y: fx(y - 5), width: fx(Math.max(1.5, (Math.max(0, v) / mx) * bw)), height: 10, fill: v > 0 ? "var(--acc)" : "var(--cold)", opacity: v > 0 ? 0.75 : 0.35 }, g);
          L.hover(bar, K.name(f), () => [{ value: v.toFixed(4), label: "R² lost when shuffled" }, { value: sd.toFixed(4), label: "spread across the five folds" }, { note: K.PLAIN.perm }]);
        });
      }
    });
    K.tables(node, es.map((e) => [`${e.target}: R² lost when each input is shuffled, on held-out days`, ["Input", "Mean", "Spread"], e.imp.map((r) => [K.name(r[0]), r[1].toFixed(4), r[2].toFixed(4)])]));
  }

  /* ---------- Predicted against logged ---------- */
  function oofPlate(node) {
    node.replaceChildren();
    // The scatter takes whatever height carries the plate down to the side column's last line.
    const W = L.width(node, 900), pw = (W - 40) / 3, Hh = K.fill(node, Math.round(K.clamp(pw * 0.9, 220, 320)) + 14, W);
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, role: "img", "aria-label": "For mood, productivity, and energy, each logged day's score against the forecast a forest made without seeing that day." }, node);
    TGT.forEach(([t, lab], q) => {
      const e = entry(t, G.lag);
      if (!e) return;
      const x0 = 44 + q * (pw + 6), x1 = x0 + pw - 34, y0 = 18, y1 = Hh - 40, sx = (v) => x0 + ((v - 2) / 8) * (x1 - x0), sy = (v) => y1 - ((v - 2) / 8) * (y1 - y0);
      [2, 4, 6, 8, 10].forEach((v) => { svg("line", { x1: x0, x2: x1, y1: fx(sy(v)), y2: fx(sy(v)), stroke: "var(--line)" }, s); text(s, x0 - 5, fx(sy(v) + 3.5), String(v), "end"); text(s, fx(sx(v)), y1 + 14, String(v), "mid"); });
      svg("line", { x1: fx(sx(2)), y1: fx(sy(2)), x2: fx(sx(10)), y2: fx(sy(10)), stroke: "var(--ink)", "stroke-dasharray": "3 4", opacity: 0.5 }, s);
      const mean = e.oof.reduce((a, r) => a + r[1], 0) / e.oof.length;
      svg("line", { x1: x0, x2: x1, y1: fx(sy(mean)), y2: fx(sy(mean)), stroke: "var(--hot)", opacity: 0.6 }, s);
      e.oof.forEach(([day, a, p], i) => {
        const j = (((i * 2654435761) % 1000) / 1000 - 0.5) * 0.36;
        const c = svg("circle", { cx: fx(sx(a + j)), cy: fx(sy(p)), r: 3.4, fill: "var(--c1)", opacity: 0.75, stroke: "var(--panel2)", "stroke-width": 1 }, s);
        L.hover(c, `${F.wday(day)}, ${F.day(day)}`, () => [{ value: String(a), label: `what you logged for ${lab.toLowerCase()}` }, { value: p.toFixed(2), label: "what the forest forecast, never having seen this day" }, { value: Math.abs(p - a).toFixed(2), label: "points off" }]);
      });
      text(s, x0, 10, `${lab.toUpperCase()}  R² ${F.r2(e.rf.r2)}`, "eng");
      text(s, fx((x0 + x1) / 2), Hh - 2, "what you logged", "it", { "text-anchor": "middle", "font-size": 11 });
      text(s, fx(x0 - 24), fx((y0 + y1) / 2), "the forecast", "it", { "text-anchor": "middle", "font-size": 11, transform: `rotate(-90 ${fx(x0 - 24)} ${fx((y0 + y1) / 2)})` });
      text(s, fx(sx(9.6)), fx(sy(9.6) + 14), "a perfect forecast", "it halo", { "text-anchor": "end", "font-size": 10.5 });
      text(s, fx(x1), fx(sy(mean) - 5), "the average day", "it halo", { "text-anchor": "end", "font-size": 10.5, fill: "var(--hot)" });
    });
    K.tables(node, TGT.map(([t, lab]) => { const e = entry(t, G.lag); return [`${lab}: logged against the out-of-fold forecasts`, ["Day", "Logged", "Forest", "Ridge"], e ? e.oof.map((r) => [r[0], r[1], r[2], r[3]]) : []]; }));
  }

  /* ---------- Plate X: orbits ---------- */
  const O = { f: 2 };
  const FC = [[2, "Forest"], [4, "No change"], [3, "Ridge"], [5, "Same hour yesterday"]];
  function orbitsPlate(node) {
    node.replaceChildren();
    const Cp = M.cpu, card = node.closest(".panel"), ctl = card && card.querySelector(".pctl");
    if (ctl && !ctl.dataset.built) { ctl.dataset.built = "1"; K.seg(ctl, "Forecast", FC.map(([k, lab]) => [String(k), lab]), String(O.f), (k) => { O.f = +k; orbitsPlate(node); }); }
    const W = Math.round(K.clamp(L.width(node, 760), 320, 800)), C = W / 2;
    const s = svg("svg", { viewBox: `0 0 ${W} ${W}`, role: "img", "aria-label": "Each held-out day as a ring, midnight at the top. ELLIE's CPU rides outside its ring in ink, the chosen forecast beside it, and the gap between them is shaded." }, node);
    const days = [...new Set(Cp.series.map((r) => r[0].slice(0, 10)))].sort(), r0 = C * 0.16, gapR = (C - 40 - r0) / days.length;
    const ringOf = (d) => days.indexOf(d), rb = (q) => r0 + q * gapR, off = (v) => (K.cut(v, 0, 100).v / 100) * gapR * 0.95;
    let cutAny = false;
    const P = (r, hh) => K.pt(C, C, r, ((hh + 0.5) / 24) * TAU);
    for (let hh = 0; hh < 24; hh += 6) { const [x, y] = K.pt(C, C, C - 14, (hh / 24) * TAU); text(s, fx(x), fx(y + 3.5), String(hh).padStart(2, "0"), "eng t", { "text-anchor": "middle" }); }
    for (let hh = 0; hh < 24; hh++) { const [x0, y0] = K.pt(C, C, r0 - 6, (hh / 24) * TAU), [x1, y1] = K.pt(C, C, C - 26, (hh / 24) * TAU); svg("line", { x1: fx(x0), y1: fx(y0), x2: fx(x1), y2: fx(y1), stroke: "var(--line)", opacity: hh % 6 ? 0.45 : 1 }, s); }
    const byDay = days.map((d) => Cp.series.filter((r) => r[0].startsWith(d)).map((r) => ({ hh: +r[0].slice(11, 13), y: r[1], f: r[O.f], row: r })));
    const gW = svg("g", { class: "wash" }, s), gL = svg("g", {}, s);
    byDay.forEach((pts, q) => {
      svg("circle", { cx: C, cy: C, r: fx(rb(q)), class: "guide dash" }, s);
      const [lx, ly] = K.pt(C, C, rb(q), -0.03);
      text(s, fx(lx - 4), fx(ly + 3), F.day(days[q]), "it", { "text-anchor": "end", "font-size": 11 });
      // Consecutive hours draw as one stroke; a missing hour breaks the line.
      const runs = [];
      pts.forEach((p, i) => { if (!i || p.hh !== pts[i - 1].hh + 1) runs.push([]); runs[runs.length - 1].push(p); });
      runs.forEach((run) => {
        if (run.length < 2) return;
        const A = run.map((p) => P(rb(q) + off(p.y), p.hh)), B = run.filter((p) => p.f != null).map((p) => P(rb(q) + off(p.f), p.hh));
        if (B.length === run.length) svg("path", { d: K.poly([...A, ...B.slice().reverse()], true), fill: "var(--c1)", opacity: 0.2, filter: "url(#paint)" }, gW);
        svg("path", { d: K.poly(A), fill: "none", stroke: "var(--ink)", "stroke-width": 1.7, "stroke-linejoin": "round", filter: "url(#ink)" }, gL);
        if (B.length > 1) svg("path", { d: K.poly(B), fill: "none", stroke: "var(--c1)", "stroke-width": 1.4, "stroke-linejoin": "round" }, gL);
      });
      pts.forEach((p) => {
        const k = p.f == null ? null : K.cut(p.f, 0, 100);
        if (!k || !k.cut) return;
        const [x, y] = P(rb(q) + off(p.f), p.hh);
        K.cutMark(gL, x, y, `${F.day(days[q])}, ${String(p.hh).padStart(2, "0")}:00, the forecast`, `${p.f}%`, k.cut); cutAny = true;
      });
    });
    // The CPU scale, read outward from the newest day's ring in the gap before midnight, where no hour is drawn: the day's
    // own ring is 0%, and these ticks show how far out half and all of the CPU ride.
    const qN = days.length - 1;
    [50, 100].forEach((v) => {
      const [tx0, ty0] = K.pt(C, C, rb(qN) + off(v), -0.012), [tx1, ty1] = K.pt(C, C, rb(qN) + off(v), -0.04);
      svg("line", { x1: fx(tx0), y1: fx(ty0), x2: fx(tx1), y2: fx(ty1), stroke: "var(--ink)", "stroke-width": 1.2 }, s);
      text(s, fx(tx1 - 4), fx(ty1 + 3.5), `${v}% CPU`, "it halo", { "font-size": 10.5, "text-anchor": "end" });
    });
    const mae = Cp.mae[{ 2: "rf", 3: "ridge", 4: "persistence", 5: "yesterday" }[O.f]];
    text(s, C, fx(C + 2), mae.toFixed(1), "big", { "text-anchor": "middle" });
    text(s, C, fx(C + 20), "points off, on average", "it", { "text-anchor": "middle", "font-size": 11 });
    s.addEventListener("pointermove", (e) => {
      const p = K.polar(s, e, C, C), q = Math.round((p.r - r0) / gapR - 0.3), hh = Math.floor((p.a / TAU) * 24);
      const pt = q >= 0 && q < days.length ? byDay[q].find((x) => x.hh === hh) : null;
      if (!pt) { L.tip.hide(); return; }
      L.tip.show(e, `${F.day(days[q])}, ${String(hh).padStart(2, "0")}:00`, [{ value: `${pt.y}%`, label: "ELLIE's CPU, what happened" }, ...FC.map(([k, lab]) => ({ value: pt.row[k] == null ? "n/a" : `${pt.row[k]}%`, label: `${lab}${pt.row[k] == null ? "" : `, off by ${Math.abs(pt.row[k] - pt.y).toFixed(1)}`}`, color: k === O.f ? "var(--c1)" : null })), { note: "Each forecast was made an hour before, from what the hour before it looked like." }]);
    });
    s.addEventListener("pointerleave", () => L.tip.hide());
    const lg = document.getElementById("orbits-legend");
    if (lg) { lg.replaceChildren(); [["var(--ink)", "ELLIE's CPU, the next hour"], ["var(--c1)", `the forecast: ${FC.find(([k]) => k === O.f)[1].toLowerCase()}`]].forEach(([c, t2]) => { const sp = h("span", {}, lg); h("i", { style: `background:${c}` }, sp); sp.append(t2); }); const sp = h("span", {}, lg); h("i", { class: "box", style: "background:color-mix(in oklab,var(--c1) 30%,transparent)" }, sp); sp.append("the miss"); }
    if (lg && cutAny) K.cutKey(lg);
    K.tables(node, [["Every held-out hour: ELLIE's CPU and each forecast of it made an hour before, in percent", ["Hour", "CPU", "Forest", "Ridge", "No change", "Same hour yesterday"], Cp.series.map((r) => [F.hour(r[0]), ...r.slice(1)])]]);
  }

  function maePlate(node) {
    node.replaceChildren();
    const Cp = M.cpu, rows = [["rf", "Forest"], ["persistence", "No change"], ["ridge", "Ridge"], ["yesterday", "Same hour yesterday"]];
    const W = L.width(node, 520), Hh = 30 + rows.length * 34, x0 = 150, x1 = W - 50, mx = Math.max(...rows.map(([k]) => Cp.mae[k])) * 1.1, x = (v) => x0 + (v / mx) * (x1 - x0);
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, role: "img", "aria-label": "Mean absolute error of each forecaster of ELLIE's next-hour CPU, lower is better." }, node);
    ticks(0, mx, 4).forEach((t) => { svg("line", { x1: fx(x(t)), x2: fx(x(t)), y1: 8, y2: Hh - 14, stroke: "var(--line)" }, s); text(s, fx(x(t)), Hh - 2, String(t), "mid"); });
    rows.forEach(([k, lab], q) => {
      const y = 14 + q * 34, v = Cp.mae[k];
      text(s, x0 - 10, y + 13, lab, "ink", { "text-anchor": "end" });
      const r = svg("rect", { x: x0, y, width: fx(x(v) - x0), height: 18, rx: 2, fill: k === "rf" ? "var(--c1)" : "var(--line2)" }, s);
      text(s, fx(x(v) + 6), y + 13, v.toFixed(2), "ink", {});
      L.hover(r, lab, () => [{ value: v.toFixed(2), label: "CPU points off, on average" }]);
    });
    K.tables(node, [["Mean absolute error over the held-out hours, in CPU points", ["Forecaster", "Error"], rows.map(([k, lab]) => [lab, Cp.mae[k]])], [`The forest's gain over no change, paired ${Cp.gain.block_hours ?? 6}-hour-block bootstrap`, ["Gain", "95% low", "95% high"], [[Cp.gain.mean, Cp.gain.lo, Cp.gain.hi]]]]);
  }

  function impBars(node, rows, caption, unit) {
    node.replaceChildren();
    const W = L.width(node, 520), Hh = 16 + rows.length * 24, x0 = 190, x1 = W - 20, mx = Math.max(...rows.map((r) => r[1] + (r[2] || 0)), 1e-9), mn = Math.min(0, ...rows.map((r) => r[1] - (r[2] || 0)));
    const x = (v) => x0 + ((v - mn) / (mx - mn)) * (x1 - x0);
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, role: "img", "aria-label": caption }, node);
    svg("line", { x1: fx(x(0)), x2: fx(x(0)), y1: 4, y2: Hh - 4, stroke: "var(--line2)" }, s);
    rows.forEach(([f, v, sd], q) => {
      const y = 8 + q * 24;
      text(s, x0 - 10, y + 11, K.name(f), "ink", { "text-anchor": "end" });
      const r = svg("rect", { x: fx(Math.min(x(0), x(v))), y, width: fx(Math.abs(x(v) - x(0))), height: 14, rx: 2, fill: v >= 0 ? "var(--c1)" : "var(--cold)", opacity: 0.85 }, s);
      if (sd) svg("line", { x1: fx(x(v - sd)), x2: fx(x(v + sd)), y1: y + 7, y2: y + 7, stroke: "var(--ink)", "stroke-width": 1.2 }, s);
      L.hover(r, K.name(f), () => [{ value: v.toFixed(3), label: unit }, { value: sd ? sd.toFixed(3) : "n/a", label: "spread" }]);
    });
    K.tables(node, [[caption, ["Input", "Mean", "Spread"], rows.map((r) => [K.name(r[0]), r[1], r[2]])]]);
  }
  const cpuImp = (node) => impBars(node, M.cpu.imp, "Inputs to the next-hour CPU forest, by how much its error grows when each is shuffled", "CPU points of error added");

  /* ---------- Plate XI: the brush ---------- */
  const B = { t: "swear", ang: null };
  const BT = [["swear", "Swear"], ["friction", "Friction"], ["praise", "Praise"]];
  function brushPlate(node) {
    node.replaceChildren();
    const Pm = M.prompts, card = node.closest(".panel"), ctl = card && card.querySelector(".pctl");
    if (ctl && !ctl.dataset.built) { ctl.dataset.built = "1"; K.seg(ctl, "The signal", BT, B.t, (k) => { B.t = k; brushPlate(node); }); }
    const W = Math.round(K.clamp(L.width(node, 760), 320, 800)), C = W / 2, dpr = Math.min(2, window.devicePixelRatio || 1);
    const tg = Pm.targets.find((x) => x.name === B.t), br = Pm.brush[B.t], N = br.chance.length;
    const cv = h("canvas", { width: W * dpr, height: W * dpr, "aria-hidden": "true" }, node);
    const s = svg("svg", { viewBox: `0 0 ${W} ${W}`, role: "img", "aria-label": `Each of ${N} held-out prompts as a bristle around a circle, sorted clockwise from least to most likely to carry a ${B.t}, as long as the forest's chance; bristles that did carry one are gold.` }, node);
    const gap = 0.32, a0 = gap / 2, dA = (TAU - gap) / N, r0 = C * 0.3, Rm = C - 46;
    const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => br.chance[a] - br.chance[b] || a - b), rank = new Int32Array(N);
    order.forEach((i, k) => { rank[i] = k; });
    const cmax = Math.max(...br.chance), cmin = Math.min(...br.chance), len = (c) => Math.pow((c - cmin) / (cmax - cmin || 1), 1.1) * (Rm - r0);
    const target = Array.from({ length: N }, (_, i) => a0 + (rank[i] + 0.5) * dA), from = B.ang && B.ang.length === N ? B.ang : target;
    const ctx = cv.getContext && cv.getContext("2d");
    const paint = (k) => {
      if (!ctx) return;
      const cur = target.map((a, i) => from[i] + (a - from[i]) * k);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, W);
      ctx.lineCap = "round";
      [[0, K.css("--faint", "#999"), 0.3, 0.9], [1, K.css("--c2", "#c9a227"), 0.95, 1.4]].forEach(([want, col, alpha, lw]) => {
        ctx.strokeStyle = col; ctx.globalAlpha = alpha; ctx.lineWidth = lw; ctx.beginPath();
        for (let i = 0; i < N; i++) {
          if ((br.hit.charCodeAt(i) === 49 ? 1 : 0) !== want) continue;
          const a = cur[i], L2 = len(br.chance[i]), sn = Math.sin(a), cs = Math.cos(a);
          ctx.moveTo(C + r0 * sn, C - r0 * cs); ctx.lineTo(C + (r0 + Math.max(1, L2)) * sn, C - (r0 + Math.max(1, L2)) * cs);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      B.ang = cur;
    };
    K.tween("brush", B.ang ? 1000 : 0, paint);
    // Tenths: each tenth of the prompts is its own arc on the rim, split from the next by a short radial tick, and carries
    // its rate against the held-out base rate at its middle, so a figure plainly belongs to the span beside it.
    const base = tg.rate_test, gT = svg("g", {}, s);
    svg("circle", { cx: C, cy: C, r: fx(r0 - 4), class: "guide" }, gT);
    tg.deciles.forEach(([nq, hq], q) => {
      const aS = a0 + (q / 10) * (TAU - gap), aE = a0 + ((q + 1) / 10) * (TAU - gap), aM = (aS + aE) / 2, [tx, ty] = K.pt(C, C, Rm + 26, aM);
      const lift = nq ? hq / nq / base : 0, sx = Math.sin(aM);
      svg("path", { d: K.arc(C, C, Rm + 10, aS + 0.012, aE - 0.012), fill: "none", stroke: lift >= 1 ? "var(--c2)" : "var(--line2)", "stroke-width": 1 + Math.min(4, lift), "stroke-linecap": "round", opacity: 0.85 }, gT);
      const [x0, y0] = K.pt(C, C, Rm + 4, aS), [x1, y1] = K.pt(C, C, Rm + 16, aS);
      svg("line", { x1: fx(x0), y1: fx(y0), x2: fx(x1), y2: fx(y1), stroke: "var(--ink)", opacity: 0.5 }, gT);
      text(gT, fx(tx), fx(ty + 4), `${lift.toFixed(1)}×`, q === 9 ? "it big" : "it", { "text-anchor": sx > 0.2 ? "start" : sx < -0.2 ? "end" : "middle" });
    });
    const [sx0, sy0] = K.pt(C, C, Rm + 30, a0 + 0.02), [sx1, sy1] = K.pt(C, C, Rm + 30, TAU - a0 - 0.02);
    text(gT, fx(sx0 + 4), fx(sy0 - 10), "least likely", "it", { "text-anchor": "start", "font-size": 11 });
    text(gT, fx(sx1 - 4), fx(sy1 - 10), "most likely", "it", { "text-anchor": "end", "font-size": 11 });
    // The center is the plate's readout, like a dial's face: the AUC at rest, and the bristle under the pointer while it
    // moves, so the figures stay in one place instead of chasing the pointer.
    const big = text(gT, C, fx(C - 6), "", "big", { "text-anchor": "middle" }), eng = text(gT, C, fx(C + 12), "", "eng", { "text-anchor": "middle" });
    const l1 = text(gT, C, fx(C + 27), "", "it", { "text-anchor": "middle", "font-size": 11 }), l2 = text(gT, C, fx(C + 41), "", "it", { "text-anchor": "middle", "font-size": 11 });
    const rest = () => { big.textContent = tg.auc_rf[0].toFixed(2); eng.textContent = "AUC"; l1.textContent = `95% ${tg.auc_rf[1].toFixed(2)} to ${tg.auc_rf[2].toFixed(2)}`; l2.textContent = "point at a bristle"; big.removeAttribute("fill"); };
    rest();
    const hl = svg("line", { stroke: "var(--ink)", "stroke-width": 2, visibility: "hidden", "pointer-events": "none" }, s);
    s.addEventListener("pointermove", (e) => {
      const p = K.polar(s, e, C, C);
      if (p.r < r0 - 6 || p.r > Rm + 10 || p.a < a0 || p.a > TAU - a0) { hl.setAttribute("visibility", "hidden"); rest(); return; }
      const k = Math.min(N - 1, Math.floor((p.a - a0) / dA)), i = order[k], a = target[i], [x0, y0] = K.pt(C, C, r0, a), [x1, y1] = K.pt(C, C, r0 + len(br.chance[i]) + 4, a);
      hl.setAttribute("x1", fx(x0)); hl.setAttribute("y1", fx(y0)); hl.setAttribute("x2", fx(x1)); hl.setAttribute("y2", fx(y1)); hl.setAttribute("visibility", "visible");
      const q = Math.floor((k * 10) / N), [nq, hq] = tg.deciles[q], hit = br.hit[i] === "1";
      big.textContent = F.pct(br.chance[i], 1);
      big.setAttribute("fill", hit ? "var(--c2)" : "var(--ink)");
      eng.textContent = `the forest's chance of a ${B.t}`;
      l1.textContent = `prompt ${F.int(k + 1)} of ${F.int(N)}: ${hit ? `a ${B.t}` : `no ${B.t}`}`;
      l2.textContent = `its tenth: ${(nq ? hq / nq / base : 0).toFixed(1)}× the base rate`;
    });
    s.addEventListener("pointerleave", () => { hl.setAttribute("visibility", "hidden"); rest(); });
    if (!B.look) { B.look = 1; document.addEventListener("lookchange", () => { const nd = document.getElementById("brush"); if (nd) brushPlate(nd); }, { signal: L.signal }); }
    K.tables(node, [[`${B.t}: the held-out prompts by tenth of the forest's chance, from least to most likely`, ["Tenth", "Prompts", `With a ${B.t}`, "Rate", "Times the base rate"], tg.deciles.map(([nq, hq], q) => [q + 1, nq, hq, F.pct(nq ? hq / nq : 0, 2), (nq ? hq / nq / base : 0).toFixed(2)])]]);
  }

  /* ---------- What raises the odds ---------- */
  const SI = { t: "swear" };
  function situPlate(node) {
    node.replaceChildren();
    const Pm = M.prompts, card = node.closest(".panel"), ctl = card && card.querySelector(".pctl");
    if (ctl && !ctl.dataset.built) { ctl.dataset.built = "1"; K.seg(ctl, "", BT, SI.t, (k) => { SI.t = k; situPlate(node); }); }
    const rows = Pm.situations, groups = [["before", "The prompt before"], ["wait", "The wait before it"]];
    const W = L.width(node, 560), lineH = 24, Hh = 30 + rows.length * lineH + groups.length * 22, x0 = 170, x1 = W - 40;
    const mx = Math.max(...rows.map((r) => r[SI.t][2] || 0)) * 1.08, x = (v) => x0 + (v / mx) * (x1 - x0);
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, role: "img", "aria-label": `The share of prompts carrying a ${SI.t} by the prompt before and by the wait before it, with 95% intervals.` }, node);
    ticks(0, mx, 4).forEach((t) => { svg("line", { x1: fx(x(t)), x2: fx(x(t)), y1: 10, y2: Hh - 16, stroke: "var(--line)" }, s); text(s, fx(x(t)), Hh - 3, F.pct(t, t < 0.1 ? 1 : 0), "mid"); });
    const ov = Pm.overall[SI.t][0];
    svg("line", { x1: fx(x(ov)), x2: fx(x(ov)), y1: 10, y2: Hh - 16, stroke: "var(--hot)", "stroke-dasharray": "3 3" }, s);
    text(s, fx(x(ov) + 4), 18, `all prompts ${F.pct(ov, 1)}`, "it", { "font-size": 11 });
    let y = 26;
    groups.forEach(([g, lab]) => {
      text(s, 6, y + 4, lab.toUpperCase(), "eng");
      y += 18;
      rows.filter((r) => r.group === g).forEach((r) => {
        const [p, lo, hi] = r[SI.t];
        text(s, x0 - 10, y + 4, r.label, "ink", { "text-anchor": "end" });
        svg("line", { x1: fx(x(lo)), x2: fx(x(hi)), y1: y, y2: y, stroke: "var(--ink)", "stroke-width": 1.4 }, s);
        const c = svg("circle", { cx: fx(x(p)), cy: y, r: 5, fill: "var(--c1)", stroke: "var(--panel2)", "stroke-width": 1.5 }, s);
        L.hover(c, r.label, () => [{ value: F.pct(p, 1), label: `carry a ${SI.t}` }, { value: `${F.pct(lo, 1)} to ${F.pct(hi, 1)}`, label: "95% interval" }, { value: F.int(r.n), label: "prompts" }]);
        y += lineH;
      });
      y += 4;
    });
    K.tables(node, [["Share of prompts carrying each signal, by situation, with 95% Wilson intervals", ["Situation", "Prompts", "Swear", "Friction", "Praise"],
      rows.map((r) => [r.label, r.n, ...BT.map(([k]) => `${F.pct(r[k][0], 1)} (${F.pct(r[k][1], 1)} to ${F.pct(r[k][2], 1)})`)])]]);
  }

  function aucPlate(node) {
    node.replaceChildren();
    const T = M.prompts.targets, W = L.width(node, 560), Hh = 40 + T.length * 46, x0 = 110, x1 = W - 24, x = (v) => x0 + ((v - 0.4) / 0.6) * (x1 - x0);
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, role: "img", "aria-label": "AUC of the forest and of logistic regression for each signal on the held-out weeks, with 95% intervals; 0.5 is a coin flip." }, node);
    [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].forEach((v) => { svg("line", { x1: fx(x(v)), x2: fx(x(v)), y1: 14, y2: Hh - 16, stroke: v === 0.5 ? "var(--hot)" : "var(--line)", "stroke-dasharray": v === 0.5 ? "3 3" : null }, s); text(s, fx(x(v)), Hh - 3, v.toFixed(1), "mid"); });
    text(s, fx(x(0.5) + 4), 12, "a coin flip", "it", { "font-size": 11 });
    T.forEach((t, q) => {
      const y = 34 + q * 46;
      text(s, x0 - 10, y + 8, t.name[0].toUpperCase() + t.name.slice(1), "ink", { "text-anchor": "end" });
      [["auc_rf", "var(--c1)", "the forest", 0], ["auc_lr", "var(--c2)", "logistic regression", 14]].forEach(([k, col, lab, dy]) => {
        const [v, lo, hi] = t[k];
        svg("line", { x1: fx(x(lo)), x2: fx(x(hi)), y1: y + dy, y2: y + dy, stroke: col, "stroke-width": 1.6 }, s);
        const c = svg("circle", { cx: fx(x(v)), cy: y + dy, r: 5, fill: col, stroke: "var(--panel2)", "stroke-width": 1.5 }, s);
        L.hover(c, `${t.name}: ${lab}`, () => [{ value: v.toFixed(3), label: "AUC" }, { value: `${lo.toFixed(3)} to ${hi.toFixed(3)}`, label: "95% interval, sessions resampled" }, { value: F.int(t.positives), label: "held-out prompts that carried it" }]);
      });
    });
    const lg = document.getElementById("auc-legend");
    if (lg) { lg.replaceChildren(); [["var(--c1)", "the forest"], ["var(--c2)", "logistic regression"]].forEach(([c, t2]) => { const sp = h("span", {}, lg); h("i", { style: `background:${c}` }, sp); sp.append(t2); }); }
    K.tables(node, [["AUC on the held-out weeks with session-bootstrap 95% intervals", ["Signal", "Base rate", "Forest", "Forest 95%", "Logistic", "Logistic 95%", "Top tenth's rate"],
      T.map((t) => [t.name, F.pct(t.rate_test, 2), t.auc_rf[0], `${t.auc_rf[1]} to ${t.auc_rf[2]}`, t.auc_lr[0], `${t.auc_lr[1]} to ${t.auc_lr[2]}`, F.pct(t.deciles[9][1] / t.deciles[9][0], 1)])]]);
  }

  K.reg("gauges", gaugesPlate);
  K.reg("roses", rosesPlate);
  K.reg("oof", oofPlate);
  K.reg("orbits", orbitsPlate);
  K.reg("mae", maePlate);
  K.reg("cpuimp", cpuImp);
  K.reg("brush", brushPlate);
  K.reg("situ", situPlate);
  K.reg("auc", aucPlate);
})();
