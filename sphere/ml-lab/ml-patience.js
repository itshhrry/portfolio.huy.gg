/* Plate XII, patience week by week: a column per week like a line of a score, with orbs for its sessions and for the
   prompts that carried friction, a swear, or praise, the week's days as small bars, and below them the share of prompts
   carrying each signal and the logged scores drawn as lines across the weeks. */
"use strict";
(() => {
  const { svg, h, text } = L;
  const M = window.ML, F = K.fmt;
  const fx = (v) => v.toFixed(1);
  // An open Catmull-Rom curve, so a weekly line reads as drawn rather than plotted. With a floor, every control point
  // stays at or above it, so a share's line never dips below zero between two weeks.
  const curve = (pts, floor = Infinity) => {
    if (pts.length < 2) return "";
    let d = `M${fx(pts[0][0])} ${fx(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += `C${fx(p1[0] + (p2[0] - p0[0]) / 6)} ${fx(Math.min(floor, p1[1] + (p2[1] - p0[1]) / 6))} ${fx(p2[0] - (p3[0] - p1[0]) / 6)} ${fx(Math.min(floor, p2[1] - (p3[1] - p1[1]) / 6))} ${fx(p2[0])} ${fx(p2[1])}`;
    }
    return d;
  };
  const SIGNALS = [["frustration", "frustration words", "var(--hot)"], ["swears", "swears", "var(--ink)"], ["caps", "all caps", "var(--c1)"], ["reversal", "reversals", "var(--c2)"], ["repeat", "repeats", "var(--muted)"], ["praise", "praise", "var(--c3)"]];
  const SCORES = [["mood", "mood", "var(--c2)"], ["energy", "energy", "var(--c1)"], ["productivity", "productivity", "var(--c3)"]];

  function weeks() {
    const A = M.atlas, out = [];
    A.days.forEach((day, i) => {
      const dt = L.date(day), mon = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - ((dt.getDay() + 6) % 7));
      const key = `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
      let w = out[out.length - 1];
      if (!w || w.key !== key) { w = { key, days: new Array(7).fill(0), prompts: 0, sessions: 0, friction: 0, swears: 0, praise: 0, frustration: 0, caps: 0, reversal: 0, repeat: 0, logs: { mood: [], energy: [], productivity: [] } }; out.push(w); }
      w.days[(dt.getDay() + 6) % 7] = A.prompts[i];
      ["prompts", "sessions", "friction", "swears", "praise", "frustration", "caps", "reversal", "repeat"].forEach((k) => { w[k] += (A[k] || [])[i] || 0; });
      SCORES.forEach(([k]) => { const v = (A[k] || [])[i]; if (v != null) w.logs[k].push(v); });
    });
    out.forEach((w) => SCORES.forEach(([k]) => { w[k] = w.logs[k].length ? w.logs[k].reduce((a, b) => a + b, 0) / w.logs[k].length : null; }));
    return out;
  }

  function patiencePlate(node) {
    node.replaceChildren();
    const A = M.atlas;
    if (!A || !A.frustration) { h("p", { class: "note" }, node, "This night carries no weekly record; the next nightly ML build writes one."); return; }
    const Wk = weeks(), n = Wk.length;
    const W = Math.round(K.clamp(L.width(node, 960), 360, 1120)), x0 = 120, x1 = W - 84, cw = (x1 - x0) / n, cx = (q) => x0 + (q + 0.5) * cw;
    // Height beyond the base goes to the two line bands, so the plate meets the side column's last line.
    const ex = Math.max(0, K.fill(node, 578, W) - 578);
    const yTop = 50, rows = [["sessions", 88], ["friction", 130], ["swears", 168], ["praise", 202]], yBase = 280, yE0 = 308, yE1 = 438 + ex * 0.55, yS0 = 468 + ex * 0.55, yS1 = 558 + ex, Hh = 578 + ex;
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, class: "patience", role: "img", tabindex: 0, "aria-label": `${n} weeks of typed prompts, each a column: orbs for its sessions and for prompts carrying friction, a swear, or praise, its days as bars, and below, the share of prompts carrying each signal and the weekly logged scores as lines.` }, node);
    // Row names at the left, as a score names its staves.
    rows.forEach(([k, y]) => { text(s, x0 - 14, y + 4, k, "it", { "text-anchor": "end" }); svg("line", { x1: x0 - 6, x2: x1, y1: y, y2: y, stroke: "var(--line)", "stroke-dasharray": "1 3" }, s); });
    text(s, x0 - 14, yBase - 18, "the days", "it", { "text-anchor": "end" });
    text(s, x0 - 14, yE0 + 8, "share of prompts", "it", { "text-anchor": "end" });
    text(s, x0 - 14, yS0 - 10, "logged scores", "it", { "text-anchor": "end" });
    const mxS = Math.max(...Wk.map((w) => w.sessions), 1), mxF = Math.max(...Wk.map((w) => Math.max(w.friction, w.swears, w.praise)), 1), mxD = Math.max(...Wk.flatMap((w) => w.days), 1);
    const orb = (v, mx) => (v > 0 ? 2 + 13 * Math.sqrt(v / mx) : 0);
    Wk.forEach((w, q) => {
      const x = cx(q), g = svg("g", { class: "wk", "data-q": q }, s);
      svg("line", { x1: fx(x), x2: fx(x), y1: yTop + 10, y2: yBase, stroke: "var(--line2)", "stroke-dasharray": "1 3", opacity: 0.7 }, g);
      const dt = L.date(w.key);
      text(g, fx(x - 2), yTop - 2, L.day(dt), "it", { "text-anchor": "start", "font-size": 10.5, transform: `rotate(-38 ${fx(x - 2)} ${yTop - 2})` });
      const rs = orb(w.sessions, mxS);
      if (rs) svg("circle", { cx: fx(x), cy: rows[0][1], r: fx(rs), fill: "none", stroke: "var(--ink)", "stroke-width": 1.1, opacity: 0.8 }, g);
      [["friction", "var(--hot)", 0.55], ["swears", "var(--ink)", 0.75], ["praise", "var(--c3)", 0.7]].forEach(([k, col, op], r) => {
        const rr = orb(w[k], mxF);
        if (rr) svg("circle", { cx: fx(x), cy: rows[r + 1][1], r: fx(rr), fill: col, opacity: op, filter: "url(#paint)", class: "wash" }, g);
      });
      const bw = Math.max(1.2, cw / 9);
      w.days.forEach((v, d) => { if (!v) return; const hh = (v / mxD) * 46; svg("rect", { x: fx(x - 3.5 * bw + d * bw), y: fx(yBase - hh), width: fx(bw - 0.6), height: fx(hh), fill: d >= 5 ? "var(--ink)" : "var(--muted)", opacity: 0.8 }, g); });
    });
    // The lines of patience: each signal's weekly share of prompts, labeled where it peaks.
    const shares = SIGNALS.map(([k]) => Wk.map((w) => (w.prompts ? w[k] / w.prompts : null))), smax = Math.max(...shares.flat().filter((v) => v != null), 0.01);
    const ye = (v) => yE1 - (v / smax) * (yE1 - yE0);
    [0, smax / 2, smax].forEach((v) => { svg("line", { x1: x0, x2: x1, y1: fx(ye(v)), y2: fx(ye(v)), stroke: "var(--line)" }, s); text(s, x1 + 6, fx(ye(v) + 3.5), F.pct(v, 1), ""); });
    SIGNALS.forEach(([k, lab, col], q) => {
      const pts = shares[q].map((v, i) => (v == null ? null : [cx(i), ye(v)])).filter(Boolean);
      svg("path", { d: curve(pts, ye(0)), fill: "none", stroke: col, "stroke-width": k === "frustration" || k === "swears" ? 2 : 1.5, opacity: 0.9 }, s);
      let pi = 0;
      shares[q].forEach((v, i) => { if (v != null && v > (shares[q][pi] || 0)) pi = i; });
      // A label near the right edge ends at its peak, so it clears the scale's figures beside the plot.
      if (shares[q][pi] != null) text(s, fx(cx(pi) - (cx(pi) > x1 - 70 ? 10 : 0)), fx(ye(shares[q][pi]) - 7), lab, "it halo", { "text-anchor": cx(pi) > x1 - 70 ? "end" : "middle", fill: col, style: `fill:${col}` });
    });
    // The logged scores across the same weeks, on their own scale.
    const ys = (v) => yS1 - ((v - 4) / 4) * (yS1 - yS0);
    [4, 6, 8].forEach((v) => { svg("line", { x1: x0, x2: x1, y1: fx(ys(v)), y2: fx(ys(v)), stroke: "var(--line)" }, s); text(s, x0 - 6, fx(ys(v) + 3.5), String(v), "", { "text-anchor": "end" }); });
    let cutAny = false;
    SCORES.forEach(([k, lab, col]) => {
      const pts = Wk.map((w, i) => (w[k] == null ? null : [cx(i), ys(K.cut(w[k], 4, 8).v)])).filter(Boolean);
      if (pts.length < 2) return;
      svg("path", { d: curve(pts), fill: "none", stroke: col, "stroke-width": 1.6, "stroke-dasharray": "5 3" }, s);
      Wk.forEach((w, i) => {
        const c = w[k] == null ? null : K.cut(w[k], 4, 8);
        if (c && c.cut) { K.cutMark(s, cx(i), ys(c.v), `${lab}, week of ${w.key}`, w[k].toFixed(2), c.cut); cutAny = true; }
      });
      const last = pts[pts.length - 1];
      text(s, fx(last[0] + 6), fx(last[1] + 4), lab, "it", { style: `fill:${col}` });
    });
    // The hover answers the mark under the pointer: an orb says what it counts and how big it is against the busiest week,
    // a day bar names its day, and anywhere else the card covers the whole week. A click keeps a week and dims the rest.
    const xh = svg("line", { class: "xh", y1: yTop + 6, y2: Hh - 8, visibility: "hidden", style: "stroke-dasharray:1 3;opacity:.5" }, s);
    const WD = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const ORB = { sessions: ["session-days", "each Claude session, counted once for every day it ran in", mxS], friction: ["prompts with friction", "frustration words, a swear, all caps, a reversal, or a repeat", mxF], swears: ["prompts with a swear", "a swear word anywhere in the prompt", mxF], praise: ["prompts with praise", "thanks or praise for the answer", mxF] };
    let keep = null;
    const weekRows = (w) => [{ value: F.int(w.prompts), label: "typed prompts" }, { value: F.int(w.sessions), label: "session-days" },
      ...SIGNALS.map(([k, lab, col]) => ({ value: w.prompts ? F.pct(w[k] / w.prompts, 1) : "n/a", label: `${lab} (${w[k]})`, color: col })),
      ...SCORES.map(([k, lab, col]) => ({ value: w[k] == null ? "no log" : w[k].toFixed(1), label: `average ${lab}`, color: col }))];
    s.addEventListener("pointermove", (e) => {
      const [x, y] = K.local(s, e), q = Math.floor((x - x0) / cw);
      if (q < 0 || q >= n) { xh.setAttribute("visibility", "hidden"); L.tip.hide(); return; }
      const w = Wk[q], title = `Week of ${L.day(L.date(w.key))}`, hint = { note: keep === q ? "Click again, or press Escape, to let this week go." : "Click to keep this week and dim the rest." };
      xh.setAttribute("x1", fx(cx(q))); xh.setAttribute("x2", fx(cx(q))); xh.setAttribute("visibility", "visible");
      const row = rows.find(([, ry]) => Math.abs(y - ry) <= 17);
      if (row) {
        const [k] = row, [lab, what, mx] = ORB[k];
        L.tip.show(e, title, [{ value: F.int(w[k]), label: lab }, { note: `${what}.` }, ...(k === "sessions" ? [] : [{ value: w.prompts ? F.pct(w[k] / w.prompts, 1) : "n/a", label: `of the week's ${F.int(w.prompts)} prompts` }]), { value: F.pct(w[k] / mx, 0), label: "of the busiest week's count, which sets the orb's size" }, hint]);
        return;
      }
      const bw = Math.max(1.2, cw / 9), d = Math.floor((x - (cx(q) - 3.5 * bw)) / bw);
      if (y > yBase - 52 && y <= yBase + 2 && d >= 0 && d < 7) {
        const dt = L.date(w.key);
        dt.setDate(dt.getDate() + d);
        L.tip.show(e, `${WD[d]}, ${L.day(dt)}`, [{ value: F.int(w.days[d]), label: "typed prompts that day" }, { note: `Each bar is one day of the week, Monday first; weekends are darker, and the tallest bar on the plate is the busiest day (${F.int(mxD)} prompts).` }, hint]);
        return;
      }
      L.tip.show(e, title, [...weekRows(w), hint]);
    });
    s.addEventListener("pointerleave", () => { xh.setAttribute("visibility", "hidden"); L.tip.hide(); });
    const setKeep = (q) => { keep = q; s.classList.toggle("locked", q != null); s.querySelectorAll(".wk").forEach((g) => g.classList.toggle("on", q != null && +g.getAttribute("data-q") === q)); };
    s.addEventListener("click", (e) => { const [x] = K.local(s, e), q = Math.floor((x - x0) / cw); setKeep(q < 0 || q >= n || q === keep ? null : q); });
    s.addEventListener("keydown", (e) => { if (e.key === "Escape") setKeep(null); });
    K.keySteps(s, n, (q) => [cx(q), (yE0 + yE1) / 2]);
    const lg = document.getElementById("patience-legend");
    if (lg) { lg.replaceChildren(); SIGNALS.forEach(([, lab, col]) => { const sp = h("span", {}, lg); h("i", { style: `background:${col}` }, sp); sp.append(lab); }); SCORES.forEach(([, lab, col]) => { const sp = h("span", {}, lg); h("i", { class: "dash", style: `color:${col}` }, sp); sp.append(lab); }); }
    if (lg && cutAny) K.cutKey(lg);
    K.tables(node, [["Each week (Monday to Sunday): typed prompts, signal counts, and average logged scores", ["Week of", "Prompts", "Session-days", "Friction", "Swears", "Praise", "Frustration words", "All caps", "Reversals", "Repeats", "Mood", "Energy", "Productivity"],
      Wk.map((w) => [w.key, w.prompts, w.sessions, w.friction, w.swears, w.praise, w.frustration, w.caps, w.reversal, w.repeat, ...SCORES.map(([k]) => (w[k] == null ? "" : w[k].toFixed(2)))])]]);
    K.patienceWeeks = Wk;
  }
  K.weeks = weeks;
  K.reg("patience", patiencePlate);
})();
