/* The editorial plates. Plate IV cascades from each hour state's orb to the signals it moves; Plate V winds the waking days
   into a calendar spiral around the shape of each kind's day; Plate VI sets every calendar day as an atlas, attention fanning
   down onto the calendar over each day's prompts and a row of dots for every source Sphere records; Plate VII rings ELLIE's
   process starts by parent and child. The kinds-of-day comparison is the linear companion. */
"use strict";
(() => {
  const { svg, h, text, ticks } = L;
  const M = window.ML, H = M.hours, Dd = M.days, S = K.STATES, KD = K.KINDS, TAU = K.TAU, F = K.fmt;
  const fx = (v) => v.toFixed(1);
  const NS = H.signals.length;
  const dayIdx = (s) => Math.round((L.date(s) - L.date(Dd.day[0])) / 864e5);

  /* ---------- Plate IV: the cascade, from each state's orb to the signals it moves ---------- */
  function cascadePlate(node) {
    node.replaceChildren();
    // A click keeps one state's or one signal's curves isolated until a second click or Escape.
    let keepOn = null;
    const leave = (on) => { if (keepOn !== on) on(false); if (keepOn && keepOn !== on) keepOn(true); L.tip.hide(); };
    const click = (on) => { const was = keepOn; if (was) was(false); keepOn = was === on ? null : on; if (keepOn) on(true); };
    const { AX, med, counts } = K;
    const W = Math.round(K.clamp(L.width(node, 900), 340, 980)), Hh = Math.round(K.clamp(W * 0.7, 420, 660));
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, role: "img", "aria-label": "Each hour state as an orb sized by its hours, with a curve to every signal it moves well above or below usual." }, node);
    const total = counts.reduce((a, b) => a + b, 0), rMax = Math.min(W * 0.085, Hh * 0.11);
    const ox = rMax + 170, slots = S.map((_, q) => 34 + (q + 0.5) * ((Hh - 60) / S.length));
    const agree = S.map((_, q) => H.confusion[q][q]);
    const lx = W - 170, ly = (k) => 26 + k * ((Hh - 50) / (NS - 1));
    const gC = svg("g", {}, s), gO = svg("g", {}, s), gL = svg("g", {}, s);
    const curves = [];
    S.forEach((st, q) => {
      const r = rMax * Math.sqrt(counts[q] / Math.max(...counts)), cy = slots[q];
      const g = svg("g", { class: "orb", tabindex: 0 }, gO);
      svg("circle", { cx: fx(ox), cy: fx(cy), r: fx(r), fill: st.color, opacity: 0.5, filter: "url(#paint)", class: "wash" }, g);
      const ri = r * Math.sqrt(agree[q] / counts[q]);
      svg("circle", { cx: fx(ox), cy: fx(cy + r - ri), r: fx(ri), fill: st.color, opacity: 0.9, filter: "url(#paint)" }, g);
      text(g, fx(ox - r - 10), fx(cy - 4), st.name, "serif", { "text-anchor": "end" });
      text(g, fx(ox - r - 10), fx(cy + 12), `${counts[q]} hours, ${agree[q]} as the lab`, "it", { "text-anchor": "end" });
      // A curve to every signal this state moves by half a deviation or more, solid above usual and dashed below.
      AX.forEach((j, k) => {
        const m = med[q][j];
        if (m == null || Math.abs(m) < 0.5) return;
        const y0 = cy + (k - (NS - 1) / 2) * (r * 1.3 / NS), x0 = ox + Math.sqrt(Math.max(0, r * r - (y0 - cy) ** 2)), y1 = ly(k), x1 = lx - 8;
        const d = `M${fx(x0)} ${fx(y0)}C${fx(x0 + (x1 - x0) * 0.5)} ${fx(y0)} ${fx(x1 - (x1 - x0) * 0.35)} ${fx(y1)} ${fx(x1)} ${fx(y1)}`;
        const c = svg("path", { d, fill: "none", stroke: st.color, "stroke-width": fx(0.8 + 1.6 * Math.min(4, Math.abs(m))), "stroke-dasharray": m < 0 ? "4 3" : null, opacity: 0.6, class: "cv" }, gC);
        // The marker sits farther along the curve the larger the deviation, and carries its value.
        const t = 0.32 + 0.5 * Math.min(1, Math.abs(m) / 5), mt = 1 - t;
        const px = mt ** 3 * x0 + 3 * mt * mt * t * (x0 + (x1 - x0) * 0.5) + 3 * mt * t * t * (x1 - (x1 - x0) * 0.35) + t ** 3 * x1;
        const py = mt ** 3 * y0 + 3 * mt * mt * t * y0 + 3 * mt * t * t * y1 + t ** 3 * y1;
        const dot = svg("circle", { cx: fx(px), cy: fx(py), r: 3.2, fill: "var(--ink)", class: "cv" }, gC);
        text(gC, fx(px + 6), fx(py - 4), F.signed(m, 1), "it", { "font-size": 10.5, class: "cv it" });
        curves.push({ q, k, j, m, els: [c, dot] });
        L.hover(c, `${st.name}, ${H.signals[j]}`, () => [{ value: F.signed(m, 2), label: `the state's typical hour, ${K.zWords(m)}`, color: st.color }, { note: `${H.signals[j]}: ${K.SIGNAL_WORDS[H.signals[j]] || "its own measure"}.` }]);
      });
      const on = (v) => curves.forEach((cv) => cv.els.forEach((e) => e.setAttribute("opacity", v ? (cv.q === q ? 0.95 : 0.06) : e.tagName === "path" ? 0.6 : 1)));
      g.addEventListener("pointerenter", (e) => { on(true); L.tip.show(e, st.name, [{ note: K.STATE_LINE[q] }, ...curves.filter((cv) => cv.q === q).sort((a, b) => Math.abs(b.m) - Math.abs(a.m)).map((cv) => ({ value: F.signed(cv.m, 1), label: `${H.signals[cv.j]}, ${K.zWords(cv.m)}` }))]); });
      g.addEventListener("pointerleave", () => leave(on));
      g.addEventListener("click", () => click(on));
      g.addEventListener("focus", () => on(true));
      g.addEventListener("blur", () => { if (keepOn !== on) on(false); });
    });
    AX.forEach((j, k) => {
      const y = ly(k), g = svg("g", { tabindex: 0 }, gL);
      svg("circle", { cx: fx(lx - 4), cy: fx(y), r: 2.4, fill: "var(--faint)" }, g);
      text(g, fx(lx + 4), fx(y + 4), H.signals[j], "serif", { "font-size": 12 });
      const on = (v) => curves.forEach((cv) => cv.els.forEach((e) => e.setAttribute("opacity", v ? (cv.j === j ? 0.95 : 0.06) : e.tagName === "path" ? 0.6 : 1)));
      g.addEventListener("pointerenter", (e) => { on(true); L.tip.show(e, H.signals[j], [{ note: `${H.signals[j]}: ${K.SIGNAL_WORDS[H.signals[j]] || "its own measure"}.` }, ...S.map((st, q) => ({ value: F.signed(med[q][j], 1), label: `${st.name}, ${K.zWords(med[q][j])}`, color: st.color }))]); });
      g.addEventListener("pointerleave", () => leave(on));
      g.addEventListener("click", () => click(on));
    });
    K.tables(node, [["Each curve: a state's median on a signal it moves by half a deviation or more", ["State", "Signal", "Median"], curves.map((c) => [S[c.q].name, H.signals[c.j], F.signed(c.m, 2)])]]);
  }

  /* ---------- Plate V: the spiral of days ---------- */
  function spiralPlate(node) {
    node.replaceChildren();
    const W = Math.round(K.clamp(L.width(node, 760), 320, 800)), C = W / 2;
    const s = svg("svg", { viewBox: `0 0 ${W} ${W}`, role: "img", "aria-label": `The ${Dd.n} waking days from ${F.day(Dd.day[0])} to ${F.day(Dd.day[Dd.n - 1])} on a spiral, four weeks to a turn, each colored by its kind; inside, the shape of each kind's day.` }, node);
    const T = dayIdx(Dd.day[Dd.n - 1]) + 1, TURN = 28, rIn = C * 0.34, R = C - 34;
    const pos = (d) => K.pt(C, C, rIn + (d / T) * (R - rIn), (d / TURN) * TAU);
    // Twenty-eight spokes, one per weekday position; the four turns line each weekday up on its own four spokes.
    const g0 = svg("g", {}, s), first = L.date(Dd.day[0]);
    for (let q = 0; q < TURN; q++) {
      const a = (q / TURN) * TAU, wd = (first.getDay() + q) % 7, [x0, y0] = K.pt(C, C, rIn - 8, a), [x1, y1] = K.pt(C, C, R + 8, a), [tx, ty] = K.pt(C, C, R + 20, a);
      svg("line", { x1: fx(x0), y1: fx(y0), x2: fx(x1), y2: fx(y1), stroke: wd === 0 || wd === 6 ? "var(--line2)" : "var(--line)" }, g0);
      text(g0, fx(tx), fx(ty + 3.5), "SMTWTFS"[wd], "eng", { "text-anchor": "middle" });
    }
    let d = "";
    for (let t = 0; t <= T; t += 0.25) { const [x, y] = pos(t); d += `${t ? "L" : "M"}${fx(x)} ${fx(y)}`; }
    svg("path", { d, fill: "none", stroke: "var(--line2)", "stroke-width": 1 }, s);
    // Month marks along the spiral.
    for (let t = 0; t < T; t++) {
      const dt = new Date(first.getFullYear(), first.getMonth(), first.getDate() + t);
      if (dt.getDate() !== 1) continue;
      const [x, y] = pos(t), a = (t / TURN) * TAU, [lx, ly] = K.pt(C, C, rIn + (t / T) * (R - rIn) - 12, a);
      svg("circle", { cx: fx(x), cy: fx(y), r: 2, fill: "var(--ink)" }, s);
      text(s, fx(lx), fx(ly + 3), L.day(dt).split(" ")[0], "it", { "text-anchor": "middle", "font-size": 11 });
    }
    // The rose: each kind's share of a day's prompts by hour, 06:00 at the top.
    const rr = rIn - 22, mx = Math.max(...Dd.shape_ward.flat());
    const gR = svg("g", { class: "wash" }, s);
    Dd.shape_ward.forEach((sh, k) => {
      const pts = sh.map((v, hh) => K.pt(C, C, 6 + (rr - 6) * (v / mx), (hh / 24) * TAU));
      svg("path", { d: K.smooth(pts), fill: KD[k].color, opacity: 0.38, filter: "url(#paint)" }, gR);
      svg("path", { d: K.smooth(pts), fill: "none", stroke: KD[k].color, "stroke-width": 1.6 }, s);
    });
    [["06", 0], ["12", 6], ["18", 12], ["00", 18]].forEach(([lab, hh]) => { const [x, y] = K.pt(C, C, rr + 9, (hh / 24) * TAU); text(s, fx(x), fx(y + 3.5), lab, "eng t", { "text-anchor": "middle" }); });
    // The days.
    const pmax = Math.max(...Dd.prompts), gD = svg("g", {}, s), spots = [];
    Dd.day.forEach((day, i) => {
      const [x, y] = pos(dayIdx(day) + 0.5), r = 2.2 + 5.4 * Math.sqrt(Dd.prompts[i] / pmax);
      svg("circle", { cx: fx(x), cy: fx(y), r: fx(r), fill: KD[Dd.ward[i]].color, stroke: "var(--panel2)", "stroke-width": 1.2 }, gD);
      if (Dd.lab[i] !== Dd.ward[i]) svg("circle", { cx: fx(x), cy: fx(y), r: fx(r + 3), fill: "none", stroke: "var(--ink)", "stroke-width": 1.1 }, gD);
      if (Dd.sub[i]) svg("rect", { x: fx(x - 2.4), y: fx(y - 2.4), width: 4.8, height: 4.8, transform: `rotate(45 ${fx(x)} ${fx(y)})`, fill: "var(--ink)" }, gD);
      spots.push([x, y, i]);
    });
    s.addEventListener("pointermove", (e) => {
      const [x, y] = K.local(s, e);
      let best = null, bd = 16;
      spots.forEach(([px, py, i]) => { const dd = Math.hypot(px - x, py - y); if (dd < bd) { bd = dd; best = i; } });
      if (best == null) { L.tip.hide(); return; }
      const i = best;
      L.tip.show(e, `${F.wday(Dd.day[i])}, ${F.day(Dd.day[i])}`, [
        { value: KD[Dd.ward[i]].one, label: "by the grouping tree", color: KD[Dd.ward[i]].color }, { value: KD[Dd.lab[i]].one, label: "by the lab" },
        { value: F.int(Dd.prompts[i]), label: "prompts" }, ...[["productivity", "productivity"], ["energy", "energy"], ["mood", "mood"]].filter(([k]) => Dd[k][i] != null).map(([k, lab]) => ({ value: String(Dd[k][i]), label: lab })),
        ...(Dd.sleep[i] != null ? [{ value: `${Dd.sleep[i]} h`, label: "sleep" }] : []),
      ]);
    });
    s.addEventListener("pointerleave", () => L.tip.hide());
    const lg = document.getElementById("spiral-legend");
    if (lg) {
      lg.replaceChildren();
      KD.slice().reverse().forEach((k) => { const sp = h("span", {}, lg); h("i", { class: "box", style: `background:${k.color};border-radius:50%` }, sp); sp.append(k.name); });
      const r1 = h("span", {}, lg); h("i", { class: "ring" }, r1); r1.append("the lab called it the other kind");
      const r2 = h("span", {}, lg); h("i", { class: "dia" }, r2); r2.append(`the ${Dd.split.n} days a third cut splits off`);
    }
    K.tables(node, [["Every waking day (06:00 to 06:00) with ten or more prompts", ["Day", "The tree's kind", "The lab's kind", "Prompts", "Productivity", "Energy", "Mood", "Sleep (h)"],
      Dd.day.map((day, i) => [day, KD[Dd.ward[i]].one, KD[Dd.lab[i]].one, Dd.prompts[i], Dd.productivity[i], Dd.energy[i], Dd.mood[i], Dd.sleep[i]])]]);
  }

  /* ---------- Plate VI: the atlas of days ---------- */
  function atlasPlate(node) {
    node.replaceChildren();
    const A = M.atlas;
    if (!A) { h("p", { class: "note" }, node, "This night carries no atlas; the next nightly ML build writes one."); return; }
    const N = A.days.length, src = A.sources;
    const W = Math.round(K.clamp(L.width(node, 960), 360, 1100)), lab = 104, x0 = lab + 12, x1 = W - 10;
    // The plate meets the side column's last line: any height beyond its base goes to the fan, the bars, and the rows.
    const base = 34 + 190 + 20 + 86 + 28 + src.length * 18 + 16, extra = Math.max(0, K.fill(node, base, W) - base);
    const yA = 34, yB = Math.round(224 + extra * 0.4), barH = Math.round(86 + extra * 0.25), yC = yB + 20 + barH + 28, rowH = 18 + (extra * 0.35) / src.length, Hh = Math.round(yC + src.length * rowH + 16);
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, class: "atlas", role: "img", tabindex: 0, "aria-label": `Every calendar day from ${F.day(A.days[0])} to ${F.day(A.days[N - 1])}: the days stretched by their prompts above, fanning down to the calendar, the day's prompts by signal, and a row of dots for each source Sphere records.` }, node);
    const cw = (x1 - x0) / N, cx = (i) => x0 + (i + 0.5) * cw;
    // The attention axis: each day as wide as its share of the prompts, with a floor so a silent day still shows.
    const pm = A.prompts.reduce((a, b) => a + b, 0) / N, wts = A.prompts.map((p) => Math.max(p, pm * 0.06)), wsum = wts.reduce((a, b) => a + b, 0);
    const ax = [];
    let acc = x0;
    wts.forEach((w) => { const ww = (w / wsum) * (x1 - x0); ax.push(acc + ww / 2); acc += ww; });
    // No ruled axes: each timeline is its row of days, one dot each. Every mark of a day carries data-d, so a hover makes
    // that day glow and a click keeps it while the other days dim.
    text(s, x0 - 8, yA + 4, "attention", "it", { "text-anchor": "end" });
    text(s, x0 - 8, yB + 4, "the calendar", "it", { "text-anchor": "end" });
    const gF = svg("g", {}, s), pmax = Math.max(...A.prompts);
    // Each day's rank among the days with prompts, from just above 0 for the quietest to 1 for the busiest.
    const order = A.prompts.map((p, i) => [p, i]).filter(([p]) => p > 0).sort((a, b2) => a[0] - b2[0]), rank = [];
    order.forEach(([, i], q) => { rank[i] = (q + 1) / order.length; });
    A.days.forEach((day, i) => {
      const k = A.kind[i], p = A.prompts[i];
      // A day's line fades and thins by its rank among the days' prompts, so the busiest days stand near solid and an
      // ordinary day recedes: a rank spreads the many mid-volume days apart, where a share of the busiest day bunches them.
      const col = k >= 0 ? KD[k].color : "var(--faint)", rk = p ? rank[i] : 0, op = p ? 0.05 + 0.95 * rk ** 2.2 : 0.03;
      svg("path", { d: `M${fx(ax[i])} ${yA}C${fx(ax[i])} ${fx(yA + (yB - yA) * 0.62)} ${fx(cx(i))} ${fx(yB - (yB - yA) * 0.55)} ${fx(cx(i))} ${yB}`, fill: "none", stroke: col, "stroke-width": fx(p ? 0.5 + 2.2 * rk ** 1.6 : 0.4), opacity: op.toFixed(3), class: "dd", "data-d": i, color: col }, gF);
      svg("circle", { cx: fx(ax[i]), cy: yA, r: fx(p ? 1 + 2.6 * Math.sqrt(p / pmax) : 0.8), fill: "var(--ink)", opacity: p ? 0.85 : 0.3, class: "dd", "data-d": i, color: "var(--ink)" }, s);
      svg("circle", { cx: fx(cx(i)), cy: yB, r: 1.6, fill: col, opacity: p ? 0.9 : 0.35, class: "dd", "data-d": i, color: col }, s);
    });
    // Months on both axes, so the stretch reads as a distortion of the same calendar.
    A.days.forEach((day, i) => {
      if ((+day.slice(8, 10) !== 1 && i !== 0) || (i === 0 && +day.slice(8, 10) > 24)) return;
      const m = L.day(L.date(day)).split(" ")[0];
      text(s, fx(ax[i]), yA - 9, m, "eng t", { "text-anchor": "middle" });
      text(s, fx(cx(i) + 3), yB + 16, m, "eng t", {});
    });
    // A faint guide drops from each day's place on the calendar through its bar and every source row, so the lower half
    // reads against the upper, as the calendar's own ticks would if they ran the length of the plate.
    const gGd = svg("g", { class: "guides" }, s);
    A.days.forEach((_, i) => svg("line", { x1: fx(cx(i)), x2: fx(cx(i)), y1: yB, y2: fx(yC + (src.length - 1) * rowH), stroke: "var(--line2)", "stroke-width": 0.5, opacity: +A.days[i].slice(8, 10) === 1 ? 0.9 : 0.35 }, gGd));
    // The day's prompts by what they carried, hanging below the calendar.
    const gBar = svg("g", {}, s), bh = (v) => (v / pmax) * barH;
    A.days.forEach((day, i) => {
      const p = A.prompts[i];
      if (!p) return;
      const fr = A.friction[i], pr = A.praise[i], calm = Math.max(0, p - fr - pr), w = Math.max(1, cw - 1), x = cx(i) - w / 2;
      let y = yB + 20;
      [[calm, "var(--line2)"], [fr, "var(--hot)"], [pr, "var(--c3)"]].forEach(([v, col]) => { if (!v) return; svg("rect", { x: fx(x), y: fx(y), width: fx(w), height: fx(Math.max(0.6, bh(v))), fill: col, class: "dd", "data-d": i, color: col }, gBar); y += bh(v); });
    });
    text(s, x0 - 8, yB + 30, "prompts", "it", { "text-anchor": "end" });
    // A row of dots for every source; a dot's size follows that source's count that day, against its own busiest day.
    src.forEach((sr, q) => {
      const y = yC + q * rowH, mx = Math.max(...sr.counts, 1), firstI = sr.counts.findIndex((v) => v > 0);
      const isPulse = sr.name === "Pulse";
      svg("line", { x1: x0, x2: x1, y1: y, y2: y, stroke: "var(--line)", "stroke-dasharray": "1 3" }, s);
      text(s, x0 - 8, y + 4, sr.name, isPulse ? "it ink" : "it", { "text-anchor": "end", "font-weight": isPulse ? 600 : null });
      sr.counts.forEach((v, i) => { if (v > 0) svg("circle", { cx: fx(cx(i)), cy: y, r: fx(sr.name === "wellness log" ? 2 : 0.9 + 2.5 * Math.sqrt(v / mx)), fill: isPulse ? "var(--acc)" : "var(--muted)", class: "dd", "data-d": i, color: isPulse ? "var(--acc)" : "var(--ink)" }, s); });
      if (firstI > 0) text(s, fx(cx(firstI) - 6), y + 4, `from ${F.day(A.days[firstI])}`, "it", { "text-anchor": "end", "font-size": 10.5 });
    });
    // The crosshair reads one day across every band.
    // A click keeps one day lit until a second click or Escape, so its column can be read down the plate; the hover's
    // dotted guide is the only line drawn across the bands.
    const xh = svg("line", { class: "xh", y1: yA - 4, y2: Hh - 6, visibility: "hidden", style: "stroke-dasharray:1 3;opacity:.5" }, s);
    let kept = null, hot = null;
    const mark = (i, cls, on) => s.querySelectorAll(`.dd[data-d="${i}"]`).forEach((el) => el.classList.toggle(cls, on));
    const glow = (i) => { if (hot === i) return; if (hot != null) mark(hot, "hot", false); hot = i; if (i != null) mark(i, "hot", true); };
    s.addEventListener("click", (e) => {
      const [x] = K.local(s, e), i = Math.floor((x - x0) / cw);
      if (kept != null) mark(kept, "on", false);
      kept = i < 0 || i >= N || i === kept ? null : i;
      s.classList.toggle("locked", kept != null);
      if (kept != null) mark(kept, "on", true);
    });
    s.addEventListener("keydown", (e) => { if (e.key === "Escape" && kept != null) { mark(kept, "on", false); kept = null; s.classList.remove("locked"); } });
    const at = (e) => {
      const [x] = K.local(s, e), i = Math.floor((x - x0) / cw);
      if (i < 0 || i >= N) { xh.setAttribute("visibility", "hidden"); glow(null); L.tip.hide(); return; }
      glow(i);
      xh.setAttribute("x1", fx(cx(i))); xh.setAttribute("x2", fx(cx(i))); xh.setAttribute("visibility", "visible");
      const on = src.filter((sr) => sr.counts[i] > 0).map((sr) => sr.name);
      L.tip.show(e, `${F.wday(A.days[i])}, ${F.day(A.days[i])}`, [
        ...(A.kind[i] >= 0 ? [{ value: KD[A.kind[i]].one, label: "The tree's kind", color: KD[A.kind[i]].color }] : []),
        { value: F.int(A.prompts[i]), label: "typed prompts" }, { value: F.int(A.friction[i]), label: "with friction", color: "var(--hot)" },
        { value: F.int(A.swears[i]), label: "with a swear" }, { value: F.int(A.praise[i]), label: "with praise", color: "var(--c3)" },
        { value: `${on.length} of ${src.length}`, label: on.length ? `sources: ${on.join(", ")}` : "sources reporting" },
        { note: kept === i ? "Click again, or press Escape, to let this day go." : "Click to keep this day lit and dim the rest." },
      ]);
    };
    s.addEventListener("pointermove", at);
    s.addEventListener("pointerleave", () => { xh.setAttribute("visibility", "hidden"); glow(null); L.tip.hide(); });
    K.keySteps(s, N, (i) => [cx(i), yB + 10]);
    const lg = document.getElementById("score-legend");
    if (lg) {
      lg.replaceChildren();
      [["var(--line2)", "calm prompts"], ["var(--hot)", "prompts with friction"], ["var(--c3)", "prompts with praise"], ["var(--c2)", "fan: a build day"], ["var(--c1)", "fan: a quiet day"]].forEach(([c, t]) => { const sp = h("span", {}, lg); h("i", { class: "box", style: `background:${c}` }, sp); sp.append(t); });
    }
    K.tables(node, [["Every calendar day: typed prompts by signal and each source's row count", ["Day", "Prompts", "Friction", "Swears", "Praise", ...src.map((x) => x.name)],
      A.days.map((day, i) => [day, A.prompts[i], A.friction[i], A.swears[i], A.praise[i], ...src.map((x) => x.counts[i])])]]);
  }

  /* ---------- The kinds against the logged scores ---------- */
  // Every logged day is a dot at the score it was given, build days piled above each row and quiet days below, so the two
  // averages are read against the spread they summarize. A click keeps one day lit in all three rows.
  const SCORES = [["productivity", "Productivity"], ["energy", "Energy"], ["mood", "Mood"]];
  const loggedOf = (k) => Dd.day.map((d, i) => ({ i, v: Dd[k][i], kk: Dd.ward[i] })).filter((o) => o.v != null);
  const meanOf = (a) => a.reduce((x, o) => x + o.v, 0) / a.length;
  const medOf = (a) => { const v = a.map((o) => o.v).sort((x, y) => x - y), m = v.length; return m % 2 ? v[(m - 1) / 2] : (v[m / 2 - 1] + v[m / 2]) / 2; };
  // The gap between the kinds, measured against how far one day's score usually strays from the average day's.
  const gapWord = (r) => (r >= 0.8 ? "a clear gap" : r >= 0.4 ? "a modest gap" : "inside the everyday spread");
  const KS = SCORES.map(([k, lab]) => {
    const all = loggedOf(k), q = all.filter((o) => !o.kk), b = all.filter((o) => o.kk), mu = meanOf(all);
    const sd = Math.sqrt(all.reduce((x, o) => x + (o.v - mu) ** 2, 0) / (all.length - 1)), gap = meanOf(b) - meanOf(q);
    return { k, lab, all, q, b, m0: meanOf(q), m1: meanOf(b), gap, sd, r: gap / sd, med1: medOf(b), reach: q.filter((o) => o.v >= medOf(b)).length };
  });
  function kindsPlate(node) {
    node.replaceChildren();
    const W = L.width(node, 760), step = 5.4, wide = 4, gapY = 8, rowGap = 30;
    const x0 = 112, x1 = W - 176, x = (v) => x0 + (v / 10) * (x1 - x0);
    const piles = KS.map((r) => [r.q, r.b].map((a) => { const c = {}; a.forEach((o) => { c[o.v] = (c[o.v] || 0) + 1; }); return Math.ceil(Math.max(1, ...Object.values(c)) / wide); }));
    const ys = [];
    let top = 34;
    piles.forEach(([q, b]) => { ys.push(top + b * step + gapY); top += (b + q) * step + gapY * 2 + rowGap; });
    const Hh = top - rowGap + 10;
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, class: "kinds", tabindex: 0, role: "img", "aria-label": "Every day with a logged productivity, energy, or mood score, as a dot at its score: build days piled above each row, quiet days below, with each kind's average." }, node);
    for (let v = 0; v <= 10; v++) {
      svg("line", { x1: fx(x(v)), x2: fx(x(v)), y1: 20, y2: Hh - 6, stroke: "var(--line2)", "stroke-dasharray": "1 3" }, s);
      text(s, fx(x(v)), 13, String(v), "", { "text-anchor": "middle" });
    }
    text(s, x0 - 14, 13, "score", "eng", { "text-anchor": "end" });
    KS.forEach((r, q) => {
      const y = ys[q];
      text(s, x0 - 14, y + 4, r.lab, "it", { "text-anchor": "end" });
      text(s, x0 - 14, y - 12, "build", "eng", { "text-anchor": "end" });
      text(s, x0 - 14, y + 22, "quiet", "eng", { "text-anchor": "end" });
      [r.b, r.q].forEach((a) => {
        const seen = {}, cnt = {};
        a.forEach((o) => { cnt[o.v] = (cnt[o.v] || 0) + 1; });
        a.forEach((o) => {
          // A pile's last, partly filled line is centered on its score, like the full lines below it.
          const j = (seen[o.v] = (seen[o.v] || 0) + 1) - 1, col = j % wide, ln = Math.floor(j / wide), inLine = Math.min(wide, cnt[o.v] - ln * wide);
          const cx = x(o.v) + (col - (inLine - 1) / 2) * step, cy = o.kk ? y - gapY - (ln + 0.5) * step : y + gapY + (ln + 0.5) * step;
          const c = svg("circle", { cx: fx(cx), cy: fx(cy), r: 2.2, fill: KD[o.kk].color, class: "kd", "data-i": o.i, color: KD[o.kk].color }, s);
          L.hover(c, `${F.day(Dd.day[o.i])}, a ${KD[o.kk].one}`, () => [
            { value: String(o.v), label: r.lab.toLowerCase(), color: KD[o.kk].color },
            { value: String(Dd.prompts[o.i]), label: "prompts that day" },
            { value: KD[Dd.lab[o.i]].one, label: "the lab's kind" },
            { note: "Click to keep this day lit in all three rows." },
          ]);
        });
      });
      svg("line", { x1: fx(x(r.m0)), x2: fx(x(r.m1)), y1: y, y2: y, stroke: "var(--ink)", "stroke-width": 1.4, opacity: 0.5 }, s);
      [[r.m0, 0], [r.m1, 1]].forEach(([v, kk]) => {
        const lv = Dd.lab_kinds[kk][r.k];
        svg("circle", { cx: fx(x(lv)), cy: y, r: 8.5, fill: "none", stroke: KD[kk].color, "stroke-width": 1.4 }, s);
        const c = svg("circle", { cx: fx(x(v)), cy: y, r: 6, fill: KD[kk].color, stroke: "var(--panel)", "stroke-width": 1.5 }, s);
        L.hover(c, `${KD[kk].name}, average ${r.lab.toLowerCase()}`, () => [
          { value: v.toFixed(2), label: "by the grouping tree", color: KD[kk].color },
          { value: lv.toFixed(2), label: "by the lab's kinds" },
          { value: String((kk ? r.b : r.q).length), label: "days with this score logged" },
        ]);
      });
      text(s, x1 + 22, y - 3, `build days ${F.signed(r.gap, 1)}`, "it", {});
      text(s, x1 + 22, y + 13, gapWord(r.r), "it", {});
    });
    let kept = null;
    const mark = (i, on) => s.querySelectorAll(`.kd[data-i="${i}"]`).forEach((el) => el.classList.toggle("on", on));
    s.addEventListener("click", (e) => {
      const el = e.target.closest(".kd"), i = el ? +el.dataset.i : null;
      if (kept != null) mark(kept, false);
      kept = i === kept ? null : i;
      s.classList.toggle("locked", kept != null);
      if (kept != null) mark(kept, true);
    });
    s.addEventListener("keydown", (e) => { if (e.key === "Escape" && kept != null) { mark(kept, false); kept = null; s.classList.remove("locked"); } });
    const lg = document.getElementById("kinds-legend");
    if (lg) {
      lg.replaceChildren();
      KD.forEach((kk, i) => { const sp = h("span", {}, lg); h("i", { class: "box", style: `background:${kk.color};border-radius:50%` }, sp); sp.append(`${kk.name}: ${Dd.kinds[i].n} by the tree, ${Dd.lab_kinds[i].n} by the lab; median ${Dd.kinds[i].prompts} prompts`); });
      const sp = h("span", {}, lg); h("i", { class: "ring" }, sp); sp.append("ring: the lab's average; solid: the tree's");
    }
    K.tables(node, [["Average logged scores and median prompts by kind of day", ["Kind", "Method", "Days", "Days logged", "Median prompts", "Productivity", "Energy", "Mood"],
      [0, 1].flatMap((kk) => [[KD[kk].name, "Tree", Dd.kinds[kk].n, Dd.kinds[kk].logged, Dd.kinds[kk].prompts, Dd.kinds[kk].productivity, Dd.kinds[kk].energy, Dd.kinds[kk].mood],
        [KD[kk].name, "the lab", Dd.lab_kinds[kk].n, Dd.lab_kinds[kk].logged, Dd.lab_kinds[kk].prompts, Dd.lab_kinds[kk].productivity, Dd.lab_kinds[kk].energy, Dd.lab_kinds[kk].mood]])],
      ["Every logged day", ["Day", "The tree's kind", "The lab's kind", "Prompts", "Productivity", "Energy", "Mood"],
        Dd.day.map((d, i) => [d, KD[Dd.ward[i]].one, KD[Dd.lab[i]].one, Dd.prompts[i], Dd.productivity[i], Dd.energy[i], Dd.mood[i]]).filter((r) => r[4] != null || r[5] != null || r[6] != null)]]);
  }
  {
    const [p, e, m] = KS, n2 = (v) => v.toFixed(2), n1 = (v) => v.toFixed(1);
    const feel = e.r < 0.8 && m.r < 0.8 ? "; it was not clearly a day you felt better" : "";
    K.set("kinds-meta", `${p.all.length} days with productivity logged, by the tree's kinds`);
    K.set("kinds-desc", `Did the two kinds of day feel different? Each dot is one day you logged a score, placed at the score you gave it: build days pile above each row and quiet days below. The solid mark is each kind's average by the grouping tree, and the ring the lab's. Build days average <b>${n2(p.m1)}</b> productivity against <b>${n2(p.m0)}</b> on quiet days, ${gapWord(p.r)} of ${n1(p.gap)} points; energy differs by ${n1(e.gap)}, ${gapWord(e.r)}, and mood by ${n1(m.gap)}, ${gapWord(m.r)}. A gap is called clear when it reaches 0.8 of how far one day's score usually strays from the average day, and modest from 0.4. The piles overlap: ${p.reach} of ${p.q.length} quiet days scored productivity at or above a typical build day's ${p.med1}. A build day has more prompts in it, a median of ${Dd.kinds[1].prompts} against ${Dd.kinds[0].prompts}${p.r >= 0.4 ? `, and you rated it ${p.m1 > p.m0 ? "more" : "less"} productive${feel}` : ", and its productivity rating sits inside the everyday spread"}.`);
    const zero = p.all.filter((o) => o.v === 0), q0 = p.q.filter((o) => o.v !== 0);
    K.set("kinds-src", `The scores are the ratings logged for each day in Sphere's wellness log, the wellness_days table: productivity, energy, and mood. ${p.all.length} of the ${Dd.n} days carry a productivity score.${zero.length ? ` ${zero.length === 1 ? "One day carries" : `${zero.length} days carry`} productivity 0, which the data checks flag as a missing value stored as zero; without ${zero.length === 1 ? "it" : "them"}, quiet days average ${n2(meanOf(q0))} and the gap is ${n1(p.m1 - meanOf(q0))}.` : ""}`);
  }

  /* ---------- Plate VII: who spawns what ---------- */
  function lineagePlate(node) {
    node.replaceChildren();
    const Lg = M.lineage, W = Math.round(K.clamp(L.width(node, 720), 320, 760)), C = W / 2;
    const s = svg("svg", { viewBox: `0 0 ${W} ${W}`, role: "img", "aria-label": "ELLIE's process starts as two rings: the parent executable inside, and what each parent started outside, each as wide as its share." }, node);
    const parents = Lg.parents.slice().sort((a, b) => b[1] - a[1]), top = parents.slice(0, 7), rest = parents.slice(7).reduce((a, p) => a + p[1], 0);
    const total = parents.reduce((a, p) => a + p[1], 0), r0 = C * 0.3, r1 = C * 0.5, r2 = C * 0.53, r3 = C * 0.74;
    const HUES = ["var(--c2)", "var(--c1)", "var(--c3)", "var(--hot)", "var(--cold)", "var(--acc)", "var(--muted)"];
    let a = 0;
    const gI = svg("g", { filter: "url(#paint)" }, s), gO = svg("g", { filter: "url(#paint)" }, s), gT = svg("g", {}, s);
    // Segments are found by angle, not by the pointer landing on a path, so a sliver a pixel wide is as easy to reach as a
    // wide one: the ring is chosen by radius, then the segment whose span holds the pointer's angle.
    const segs = [];
    const seg = (g, ra, rb, a0, a1, fill, op, title, rows) => { const el = svg("path", { d: K.sector(C, C, ra, rb, a0, a1 - 0.004), fill, opacity: op, class: "lseg" }, g); segs.push({ ring: g === gI ? 0 : 1, a0, a1, ra, rb, el, title, rows }); return el; };
    [...top.map((p) => [p[0], p[1]]), ["other parents", rest]].forEach(([name, cnt], q) => {
      const span = (cnt / total) * TAU, col = q < top.length ? HUES[q % HUES.length] : "var(--faint)";
      seg(gI, r0, r1, a, a + span, col, 0.85, name, () => [{ value: F.int(cnt), label: "process starts it parented" }, { value: F.pct(cnt / total), label: "of all starts" }]);
      if (span > 0.16) { const [tx, ty] = K.pt(C, C, (r0 + r1) / 2, a + span / 2); text(gT, fx(tx), fx(ty + 4), name.replace(".exe", ""), "serif", { "text-anchor": "middle", "font-size": 11.5 }); }
      if (q < top.length) {
        const kids = Lg.edges.filter((e) => e[0] === name).sort((x, y) => y[2] - x[2]), listed = kids.reduce((s2, e) => s2 + e[2], 0);
        let b = a;
        [...kids, ...(cnt - listed > 0 ? [[name, "other children", cnt - listed]] : [])].forEach(([, exe, c2], kq) => {
          const sp = (c2 / total) * TAU;
          seg(gO, r2, r2 + (r3 - r2) * (0.45 + 0.55 * Math.sqrt(c2 / cnt)), b, b + sp, `color-mix(in oklab, ${col} ${Math.max(28, 92 - kq * 14)}%, var(--panel2))`, 0.95, `${name} started ${exe}`, () => [{ value: F.int(c2), label: "starts" }, { value: F.pct(c2 / cnt), label: `of what ${name} started` }]);
          if (sp > 0.07) { const am = b + sp / 2, [lx, ly] = K.pt(C, C, r3 + 10, am), sx = Math.sin(am); text(gT, fx(lx), fx(ly + 4), exe.replace(".exe", ""), "it", { "text-anchor": sx > 0.15 ? "start" : sx < -0.15 ? "end" : "middle", "font-size": 11.5 }); }
          b += sp;
        });
      }
      a += span;
    });
    const ring = svg("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 1.4, visibility: "hidden", "pointer-events": "none" }, s);
    let keep = null;
    const at = (e) => {
      const p = K.polar(s, e, C, C), r = p.r, rg = r >= r0 - 4 && r <= r1 + 1 ? 0 : r >= r2 - 1 && r <= r3 + 24 ? 1 : -1;
      if (rg < 0) return null;
      const list = segs.filter((g) => g.ring === rg);
      return list.find((g) => p.a >= g.a0 && p.a < g.a1) || list.reduce((b, g) => { const d = Math.min(Math.abs(p.a - g.a0), Math.abs(p.a - g.a1)); return !b || d < b.d ? { d, g } : b; }, null).g;
    };
    const show = (g, e) => {
      ring.setAttribute("d", K.sector(C, C, g.ra - 2, Math.max(g.rb, g.ring ? r3 : r1) + 3, g.a0 - 0.006, g.a1 + 0.002));
      ring.setAttribute("visibility", "visible");
      const rows = g.rows();
      L.tip.show(e, g.title, [...rows, { note: keep === g ? "Click again, or press Escape, to let go." : "Click to keep this slice and dim the rest." }]);
    };
    s.addEventListener("pointermove", (e) => { const g = at(e); if (g) show(g, e); else { if (!keep) ring.setAttribute("visibility", "hidden"); L.tip.hide(); } });
    s.addEventListener("pointerleave", () => { L.tip.hide(); if (!keep) ring.setAttribute("visibility", "hidden"); });
    const setKeep = (g) => { keep = g; segs.forEach((x) => x.el.classList.toggle("off", !!g && x !== g && !(g.ring === 0 && x.ring === 1 && x.a0 >= g.a0 - 1e-9 && x.a1 <= g.a1 + 1e-9))); };
    s.addEventListener("click", (e) => { const g = at(e); setKeep(g && g !== keep ? g : null); if (keep) show(keep, e); else ring.setAttribute("visibility", "hidden"); });
    s.addEventListener("keydown", (e) => { if (e.key === "Escape") { setKeep(null); ring.setAttribute("visibility", "hidden"); } });
    s.setAttribute("tabindex", "0");
    K.keySteps(s, segs.length, (i) => K.pt(C, C, (segs[i].ra + segs[i].rb) / 2, (segs[i].a0 + segs[i].a1) / 2));
    const cc = Lg.share && Lg.share["Claude Code"];
    if (cc != null) {
      text(s, C, fx(C + 4), F.pct(cc), "big", { "text-anchor": "middle" });
      text(s, C, fx(C + 24), "trace back to Claude Code", "it", { "text-anchor": "middle" });
    }
    K.tables(node, [
      ["Parent executables, by the starts they parented", ["Parent", "Starts", "Distinct children", "Entropy (bits)", "Busiest minute"], parents.map((p) => [p[0], F.int(p[1]), p[2], p[3], p[4]])],
      ["Parent and child pairs", ["Parent", "Child", "Starts"], Lg.edges.map((e) => [e[0], e[1], F.int(e[2])])],
    ]);
  }

  K.reg("cascade", cascadePlate);
  K.reg("spiral", spiralPlate);
  K.reg("score", atlasPlate);
  K.reg("kinds", kindsPlate);
  K.reg("lineage-chart", lineagePlate);
})();
