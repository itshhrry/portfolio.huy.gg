/* "How to read it": a small annotated drawing for each sheet, set like the construction drawings of an editorial data
   poster. Each draws one example of its plate's marks with dotted leaders to italic notes; the marks are illustrations,
   so their values are invented, while the encodings match the plate exactly. */
"use strict";
(() => {
  const { svg, text } = L;
  const S = K.STATES, KD = K.KINDS, TAU = K.TAU;
  const fx = (v) => v.toFixed(1);
  const pad = (id, hh) => {
    const host = document.getElementById(id);
    if (!host) return null;
    host.replaceChildren();
    return svg("svg", { viewBox: `0 0 300 ${hh}`, "aria-hidden": "true" }, host);
  };
  // A note: italic lines ending at (tx, ty), with a dotted leader from the text's end to the mark it explains. Notes are
  // queued and drawn by untangle() at the end, which reorders each column's notes so no two leaders cross.
  const queued = [];
  const note = (s, mark, tx, ty, str) => queued.push({ s, mark, tx, ty, str, n: str.split("\n").length });
  const drawNote = ({ s, mark: [x, y], tx, ty, str }) => {
    svg("path", { class: "lead", d: `M${fx(tx + 2)} ${fx(ty)}L${fx(x)} ${fx(y)}` }, s);
    const lines = str.split("\n"), t = text(s, fx(tx - 3), fx(ty + 4 - (lines.length - 1) * 13), "", "", { "text-anchor": "end" });
    lines.forEach((ln, i) => { const sp = svg("tspan", { x: fx(tx - 3), dy: i ? 13 : 0 }, t); sp.textContent = ln; });
    svg("circle", { cx: fx(x), cy: fx(y), r: 1.6, fill: "var(--ink)" }, s);
  };
  const crosses = (a, b, c, d) => {
    const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
  };
  const perms = (a) => (a.length < 2 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
  // For each drawing, try every order of each column's notes over that column's slots, laying each order out so every note
  // clears the one above by 8 px (a note pushed down by a taller one above it moves down), and keep the order with the
  // fewest crossing leaders, the shortest leaders breaking ties.
  function untangle() {
    new Set(queued.map((q) => q.s)).forEach((s) => {
      const mine = queued.filter((q) => q.s === s);
      const cols = [...new Set(mine.map((q) => q.tx))];
      cols.forEach((tx) => {
        const col = mine.filter((q) => q.tx === tx);
        if (col.length < 2 || col.length > 7) return;
        const slots = col.map((q) => q.ty).sort((a, b) => a - b);
        const lay = (order) => {
          const ys = [];
          order.forEach((q, k) => { let y = slots[k]; if (k) { const prev = ys[k - 1] + 4 + 8, top = y - (q.n - 1) * 13 - 9; if (top < prev) y += prev - top; } ys.push(y); });
          return ys;
        };
        const score = (order) => {
          const ys = lay(order), placed = mine.map((q) => { const k = order.indexOf(q); return k < 0 ? q : { ...q, ty: ys[k] }; });
          let c = 0, len = 0;
          placed.forEach((p, i) => { len += Math.hypot(p.mark[0] - p.tx, p.mark[1] - p.ty); placed.slice(i + 1).forEach((r) => { if (crosses([p.tx + 2, p.ty], p.mark, [r.tx + 2, r.ty], r.mark)) c++; }); });
          return c * 1e6 + len;
        };
        let best = null, bestScore = Infinity;
        perms(col).forEach((order) => { const v = score(order); if (v < bestScore) { bestScore = v; best = order; } });
        const ys = lay(best);
        best.forEach((q, k) => { q.ty = ys[k]; });
      });
    });
    queued.forEach(drawNote);
  }
  const P = (cx, cy, r, a) => K.pt(cx, cy, r, a);

  // Plate I: a wedge of the tree with its rings.
  (() => {
    const s = pad("tree-sample", 210);
    if (!s) return;
    const C = [262, 200], A = [-1.18, -0.98, -0.78, -0.58, -0.38], wd = 0.09, st = [0, 0, 1, 1, 2], lab = [0, 0, 1, 2, 2];
    const z = [[2.4, 1.6, -0.8, -2.2, 0.2], [0.1, 0.6, 2.6, 2, -0.6], [-1.2, -2.4, 0, 0.6, 3]];
    const br = (r, a0, a1, rc0, rc1) => svg("path", { d: `M${P(...C, rc0, a0).map(fx).join(" ")}L${P(...C, r, a0).map(fx).join(" ")}A${r} ${r} 0 0 1 ${P(...C, r, a1).map(fx).join(" ")}L${P(...C, rc1, a1).map(fx).join(" ")}`, fill: "none", stroke: "var(--muted)", "stroke-width": 1.4 }, s);
    br(84, A[0], A[1], 100, 100); br(76, A[2], A[3], 100, 100);
    br(52, (A[0] + A[1]) / 2, (A[2] + A[3]) / 2, 84, 76); br(30, (A[0] + A[3]) / 2, A[4], 52, 100);
    svg("path", { d: K.arc(...C, 64, A[0] - 0.12, A[4] + 0.12), fill: "none", stroke: "var(--ink)", "stroke-dasharray": "3 4", opacity: 0.6 }, s);
    A.forEach((a, i) => {
      svg("path", { d: K.sector(...C, 106, 113, a - wd, a + wd), fill: S[st[i]].color }, s);
      svg("path", { d: K.sector(...C, 115, 118, a - wd, a + wd), fill: S[lab[i]].color }, s);
      z.forEach((row, q) => svg("path", { d: K.sector(...C, 122 + q * 9, 129 + q * 9, a - wd, a + wd), fill: K.div(row[i]) }, s));
    });
    note(s, P(...C, 100, A[1]), 118, 20, "one hour per leaf");
    note(s, P(...C, 86, (A[0] + A[1]) / 2), 118, 62, "joined near the rim:\nalike from the start");
    note(s, P(...C, 110, A[0] - wd), 118, 96, "The tree's state");
    note(s, P(...C, 138, A[0] - wd + 0.02), 118, 130, "signals: cool below\nusual, warm above");
    note(s, P(...C, 117, A[0] - wd), 118, 166, "the lab's state");
    note(s, P(...C, 64, A[4] + 0.06), 196, 204, "the cut that leaves\nfour states");
  })();

  // Plate II: three spokes, one hour, one median, one brush.
  (() => {
    const s = pad("pc-sample", 190);
    if (!s) return;
    const C = [222, 100], A = [-1.05, 0.25, 1.55], r0 = 16, R = 84;
    svg("circle", { cx: C[0], cy: C[1], r: 42, fill: "none", stroke: "var(--line2)" }, s);
    A.forEach((a) => { const [x0, y0] = P(...C, r0, a), [x1, y1] = P(...C, R, a); svg("line", { x1: fx(x0), y1: fx(y0), x2: fx(x1), y2: fx(y1), class: "spoke", stroke: "var(--line2)" }, s); });
    const poly = (rs) => K.poly([...rs.map((r, i) => P(...C, r, A[i])), P(...C, rs[0], A[0])]);
    svg("path", { d: poly([58, 32, 72]), fill: "none", stroke: S[2].color, "stroke-width": 1, opacity: 0.8 }, s);
    svg("path", { d: poly([66, 38, 62]), fill: "none", stroke: S[2].color, "stroke-width": 2.6 }, s);
    const [b0x, b0y] = P(...C, 50, A[1]), [b1x, b1y] = P(...C, 74, A[1]);
    svg("line", { x1: fx(b0x), y1: fx(b0y), x2: fx(b1x), y2: fx(b1y), stroke: "var(--acc)", "stroke-width": 8, "stroke-linecap": "round", opacity: 0.35 }, s);
    note(s, P(...C, R, A[0]), 128, 22, "a spoke per signal");
    note(s, P(...C, 42, -2.3), 128, 70, "the solid ring: usual;\nfarther out, above it");
    note(s, P(...C, 32, A[1]), 128, 118, "a thin line: one hour");
    note(s, P(...C, 62, A[2]), 128, 150, "bold: the state's median");
    note(s, [b1x, b1y], 128, 182, "drag along a spoke to filter");
  })();

  // Plate III: a run of spikes and two links.
  (() => {
    const s = pad("web-sample", 180);
    if (!s) return;
    const C = [236, 186], L0 = [22, 30, 14, 40, 52, 18, 26, 12, 36, 20], cols = [0, 0, 1, 1, 0, 3, 3, 2, 2, 0];
    L0.forEach((len, i) => { const a = -0.95 + i * 0.13, [x0, y0] = P(...C, 92, a), [x1, y1] = P(...C, 92 + len, a); svg("line", { x1: fx(x0), y1: fx(y0), x2: fx(x1), y2: fx(y1), stroke: S[cols[i]].color, "stroke-width": 3, "stroke-linecap": "round" }, s); });
    const N1 = [196, 160], N2 = [262, 150], N3 = [232, 120];
    svg("path", { d: `M${N1}Q228 168 ${N2}`, fill: "none", stroke: "var(--hot)", "stroke-width": 3 }, s);
    svg("path", { d: `M${N2}Q236 146 ${N3}`, fill: "none", stroke: "var(--cold)", "stroke-width": 2, "stroke-dasharray": "5 3" }, s);
    svg("path", { d: "M236 124L244 128L238 131Z", fill: "var(--cold)" }, s);
    [[N1, 7, 0], [N2, 5, 1], [N3, 4, 2]].forEach(([p, r, q]) => svg("circle", { cx: p[0], cy: p[1], r, fill: S[q].color, stroke: "var(--panel2)", "stroke-width": 2 }, s));
    note(s, P(...C, 132, -0.95 + 4 * 0.13), 132, 20, "an hour: the longer,\nthe less usual");
    note(s, P(...C, 100, -0.95 + 5 * 0.13), 132, 58, "color: its state");
    note(s, N1, 132, 96, "a signal; larger,\nmore links");
    note(s, [228, 163], 132, 140, "warm: they rise together");
    note(s, [242, 132], 132, 172, "cool, dashed, arrowed:\none leads by an hour");
  })();

  // Plate IV: an orb and two of its curves.
  (() => {
    const s = pad("cascade-sample", 170);
    if (!s) return;
    const O = [200, 74], r = 30, ri = 18;
    svg("circle", { cx: O[0], cy: O[1], r, fill: S[1].color, opacity: 0.5 }, s);
    svg("circle", { cx: O[0], cy: O[1] + r - ri, r: ri, fill: S[1].color, opacity: 0.9 }, s);
    svg("path", { d: `M${O[0] + 28} 66C258 66 262 28 296 28`, fill: "none", stroke: S[1].color, "stroke-width": 3.4, opacity: 0.7 }, s);
    svg("path", { d: `M${O[0] + 27} 86C258 86 262 128 296 128`, fill: "none", stroke: S[1].color, "stroke-width": 1.6, "stroke-dasharray": "4 3", opacity: 0.7 }, s);
    svg("circle", { cx: 262, cy: 46, r: 3, fill: "var(--ink)" }, s);
    text(s, 267, 42, "+2.8", "", { "font-size": 10.5 });
    note(s, [O[0] - 22, O[1] - 20], 140, 18, "a state, sized by its hours");
    note(s, [O[0] - 10, O[1] + 18], 140, 60, "inside: the hours the\nlab placed there too");
    note(s, [262, 46], 140, 100, "solid: above usual;\nthe dot, its median");
    note(s, [262, 112], 140, 150, "dashed: below usual");
  })();

  // Plate V: a stretch of the spiral.
  (() => {
    const s = pad("spiral-sample", 180);
    if (!s) return;
    const C = [250, 175], pts = [], days = [[0.0, 1, 0.8, 0, 0], [0.12, 1, 0.5, 0, 0], [0.24, 0, 0.25, 0, 1], [0.36, 1, 1, 1, 0], [0.48, 0, 0.35, 0, 0], [0.6, 1, 0.7, 0, 0]];
    for (let t = -0.1; t <= 0.75; t += 0.02) pts.push(P(...C, 96 + t * 22, -1.3 + t * 1.6));
    svg("path", { d: K.poly(pts), fill: "none", stroke: "var(--line2)" }, s);
    const [s0x, s0y] = P(...C, 70, -0.5), [s1x, s1y] = P(...C, 132, -0.5);
    svg("line", { x1: fx(s0x), y1: fx(s0y), x2: fx(s1x), y2: fx(s1y), stroke: "var(--line2)" }, s);
    const spot = days.map(([t, k, sz, ring, dia]) => {
      const [x, y] = P(...C, 96 + t * 22, -1.3 + t * 1.6), r = 2.5 + 5 * sz;
      svg("circle", { cx: fx(x), cy: fx(y), r: fx(r), fill: KD[k].color, stroke: "var(--panel2)", "stroke-width": 1.2 }, s);
      if (ring) svg("circle", { cx: fx(x), cy: fx(y), r: fx(r + 3), fill: "none", stroke: "var(--ink)", "stroke-width": 1.1 }, s);
      if (dia) svg("rect", { x: fx(x - 2.4), y: fx(y - 2.4), width: 4.8, height: 4.8, transform: `rotate(45 ${fx(x)} ${fx(y)})`, fill: "var(--ink)" }, s);
      return [x, y];
    });
    note(s, spot[0], 140, 20, "a build day; larger,\nmore prompts");
    note(s, spot[2], 140, 66, "a quiet day; the diamond,\nthe third group");
    note(s, spot[3], 140, 110, "ring: the lab called it\nthe other kind");
    note(s, [s1x, s1y], 140, 160, "a turn is four weeks,\nso weekdays line up");
  })();

  // Plate VI: a stretch of the atlas.
  (() => {
    const s = pad("score-sample", 214);
    if (!s) return;
    const x0 = 160, x1 = 296, yA = 22, yB = 82, ds = [0, 3, 40, 22, 2, 30];
    const tot = ds.reduce((a, b) => a + Math.max(b, 2), 0);
    let acc = x0;
    const top = ds.map((v) => { const w = (Math.max(v, 2) / tot) * (x1 - x0), c = acc + w / 2; acc += w; return c; }), bot = ds.map((_, i) => x0 + (i + 0.5) * ((x1 - x0) / ds.length));
    svg("line", { x1: x0, x2: x1, y1: yA, y2: yA, stroke: "var(--ink)" }, s);
    svg("line", { x1: x0, x2: x1, y1: yB, y2: yB, stroke: "var(--ink)" }, s);
    ds.forEach((v, i) => svg("path", { d: `M${fx(top[i])} ${yA}C${fx(top[i])} 58 ${fx(bot[i])} 50 ${fx(bot[i])} ${yB}`, fill: "none", stroke: v > 10 ? "var(--c2)" : "var(--c1)", opacity: 0.8 }, s));
    ds.forEach((v, i) => { if (!v) return; const calm = v * 0.75, fr = v * 0.18, pr = v * 0.07; let y = yB + 8; [[calm, "var(--line2)"], [fr, "var(--hot)"], [pr, "var(--c3)"]].forEach(([u, c]) => { svg("rect", { x: fx(bot[i] - 7), y: fx(y), width: 14, height: fx(u * 0.9), fill: c }, s); y += u * 0.9; }); });
    [["ELLIE", [1, 2, 3, 4, 5], "var(--muted)"], ["Pulse", [4, 5], "var(--acc)"]].forEach(([nm, on, c], q) => {
      const y = 170 + q * 16;
      svg("line", { x1: x0, x2: x1, y1: y, y2: y, stroke: "var(--line)", "stroke-dasharray": "1 3" }, s);
      on.forEach((i) => svg("circle", { cx: fx(bot[i]), cy: y, r: 2.6, fill: c }, s));
      text(s, x0 - 4, y + 4, nm, "", { "text-anchor": "end", "font-size": 10.5 });
    });
    note(s, [top[2], yA], 118, 14, "attention: each day as\nwide as its prompts");
    note(s, [bot[1], yB], 118, 64, "the calendar: equal days");
    note(s, [bot[2] + 7, yB + 20], 118, 112, "the day's prompts: calm,\nfriction, praise");
    note(s, [bot[4], 186], 118, 152, "a source's dots: from its\nfirst day, sized by its rows");
  })();

  // Plate VII: a parent and its children.
  (() => {
    const s = pad("lineage-sample", 150);
    if (!s) return;
    const C = [262, 150];
    svg("path", { d: K.sector(...C, 40, 76, -1.4, -0.35), fill: "var(--c2)", opacity: 0.85 }, s);
    svg("path", { d: K.sector(...C, 80, 126, -1.4, -0.75), fill: "color-mix(in oklab, var(--c2) 85%, var(--panel2))" }, s);
    svg("path", { d: K.sector(...C, 80, 108, -0.74, -0.52), fill: "color-mix(in oklab, var(--c2) 60%, var(--panel2))" }, s);
    svg("path", { d: K.sector(...C, 80, 98, -0.51, -0.35), fill: "color-mix(in oklab, var(--c2) 40%, var(--panel2))" }, s);
    note(s, P(...C, 58, -1.2), 128, 112, "inside: the parent,\nas wide as its starts");
    note(s, P(...C, 110, -1.1), 128, 50, "outside: what it\nstarted, cut from it");
    note(s, P(...C, 92, -0.43), 128, 140, "a thin child: a rare start");
  })();

  // Plate VIII: a half dial.
  (() => {
    const s = pad("gauges-sample", 160);
    if (!s) return;
    const C = [214, 130], R = 70, ang = (v) => (v / 0.5) * (Math.PI / 2);
    svg("path", { d: K.sector(...C, R - 14, R, -Math.PI / 2, 0), fill: "var(--hot)", opacity: 0.16 }, s);
    svg("path", { d: K.arc(...C, R, -Math.PI / 2, Math.PI / 2), fill: "none", stroke: "var(--ink)" }, s);
    svg("path", { d: K.sector(...C, R - 28, R - 16, ang(-0.25), ang(0.05)), fill: "var(--c1)", opacity: 0.25 }, s);
    const [nx, ny] = P(...C, R - 6, ang(-0.1)), [rx, ry] = P(...C, R - 24, ang(0.06));
    svg("line", { x1: C[0], y1: C[1], x2: fx(nx), y2: fx(ny), stroke: "var(--c1)", "stroke-width": 2.6, "stroke-linecap": "round" }, s);
    svg("line", { x1: C[0], y1: C[1], x2: fx(rx), y2: fx(ry), stroke: "var(--c2)", "stroke-width": 1.6, "stroke-linecap": "round" }, s);
    note(s, P(...C, R, 0), 140, 22, "zero, at the top: the\nheld-out days' average");
    note(s, P(...C, R - 7, -1.2), 140, 70, "left: worse than\nthat average");
    note(s, [nx, ny], 140, 104, "thick: the forest; its\nwedge, the spread");
    note(s, [rx, ry], 140, 146, "thin: ridge regression");
  })();

  // Plate IX: a rose.
  (() => {
    const s = pad("roses-sample", 150);
    if (!s) return;
    const C = [230, 78], L8 = [0.9, 0.35, 0.15, 0.6, 0, 0.25, 0.1, 0.45];
    L8.forEach((v, k) => { const a0 = (k / 8) * TAU, a1 = a0 + (TAU / 8) * 0.82; svg("path", { d: K.sector(...C, 10, 10 + Math.max(2, 58 * Math.sqrt(v)), a0, a1), fill: v ? "var(--acc)" : "var(--cold)", opacity: v ? 0.75 : 0.35 }, s); });
    note(s, P(...C, 50, 0.3), 140, 24, "a petal per input,\nin the same place on each");
    note(s, P(...C, 30, (4.4 / 8) * TAU), 140, 132, "a cool stub: shuffling\nit did not hurt");
    note(s, P(...C, 40, (3.4 / 8) * TAU), 140, 82, "longer: the score\nleans on it more");
  })();

  // Plate X: one day's orbit.
  (() => {
    const s = pad("orbits-sample", 160);
    if (!s) return;
    const C = [250, 150], rb = 72, cpu = [20, 30, 55, 70, 64, 40, 35, 52, 80, 60], fc = [25, 26, 40, 62, 68, 50, 38, 45, 66, 70];
    svg("path", { d: K.arc(...C, rb, -1.45, 0.2), fill: "none", stroke: "var(--line2)", "stroke-dasharray": "2 4" }, s);
    const a = (i) => -1.4 + i * 0.17, A1 = cpu.map((v, i) => P(...C, rb + v * 0.5, a(i))), B1 = fc.map((v, i) => P(...C, rb + v * 0.5, a(i)));
    svg("path", { d: K.poly([...A1, ...B1.slice().reverse()], true), fill: "var(--c1)", opacity: 0.2 }, s);
    svg("path", { d: K.poly(A1), fill: "none", stroke: "var(--ink)", "stroke-width": 1.7 }, s);
    svg("path", { d: K.poly(B1), fill: "none", stroke: "var(--c1)", "stroke-width": 1.4 }, s);
    note(s, P(...C, rb, -1.45), 140, 140, "a ring: one day,\nmidnight at the top");
    note(s, A1[3], 140, 30, "ink: ELLIE's CPU,\nfarther out when busier");
    note(s, B1[8], 140, 76, "color: the forecast");
    note(s, P(...C, rb + 31, a(5)), 140, 104, "shaded: the miss");
  })();

  // Plate XI: a sweep of bristles.
  (() => {
    const s = pad("brush-sample", 170);
    if (!s) return;
    const C = [250, 170], n = 40;
    for (let i = 0; i < n; i++) {
      const a = -1.5 + (i / n) * 1.6, ch = Math.pow(i / n, 2.2), hit = i > 31 ? i % 2 === 0 : i === 20, [x0, y0] = P(...C, 50, a), [x1, y1] = P(...C, 52 + ch * 90, a);
      svg("line", { x1: fx(x0), y1: fx(y0), x2: fx(x1), y2: fx(y1), stroke: hit ? "var(--c2)" : "var(--faint)", "stroke-width": hit ? 1.6 : 1, opacity: hit ? 1 : 0.5 }, s);
    }
    const [tx, ty] = P(...C, 150, -1.5 + 0.9 * 1.6);
    text(s, fx(tx + 4), fx(ty), "5.9×", "", { "font-size": 12 });
    note(s, P(...C, 56, -1.45), 140, 150, "a bristle: one prompt;\nleast likely first");
    note(s, P(...C, 120, -1.5 + 0.8 * 1.6), 140, 100, "length: the forest's\nchance");
    note(s, P(...C, 128, -1.5 + (34 / n) * 1.6), 140, 58, "gold: it carried the signal");
    note(s, [tx + 4, ty - 4], 140, 18, "the last tenth's rate\nagainst the base rate");
  })();

  // Plate XII: one week's column.
  (() => {
    const s = pad("patience-sample", 190);
    if (!s) return;
    const x = 236;
    svg("line", { x1: x, x2: x, y1: 14, y2: 130, stroke: "var(--line2)" }, s);
    svg("circle", { cx: x, cy: 30, r: 13, fill: "none", stroke: "var(--ink)", "stroke-width": 1.1 }, s);
    svg("circle", { cx: x, cy: 62, r: 9, fill: "var(--hot)", opacity: 0.6 }, s);
    svg("circle", { cx: x, cy: 86, r: 5, fill: "var(--ink)", opacity: 0.75 }, s);
    svg("circle", { cx: x, cy: 106, r: 4, fill: "var(--c3)", opacity: 0.75 }, s);
    [20, 34, 12, 28, 40, 6, 9].forEach((v, d) => svg("rect", { x: x - 17 + d * 5, y: 130 - v * 0.6, width: 4, height: v * 0.6, fill: d >= 5 ? "var(--ink)" : "var(--muted)" }, s));
    svg("path", { d: "M196 176C214 164 230 150 246 158C262 166 276 160 294 154", fill: "none", stroke: "var(--hot)", "stroke-width": 2 }, s);
    note(s, [x - 13, 30], 150, 22, "the week's session-days");
    note(s, [x - 9, 62], 150, 56, "friction, then swears,\nthen praise");
    note(s, [x - 15, 122], 150, 118, "the week's days,\nweekends darker");
    note(s, [214, 162], 150, 166, "a signal's share of\nthe week's prompts");
  })();
  untangle();
})();
