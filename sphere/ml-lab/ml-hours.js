/* The hours. Plate I draws the grouping tree over the data lab's hours from the center outward, ringed by each hour's state and its sixteen
   signals; Plate II draws the sixteen signals as radial parallel coordinates that unroll flat; Plate III rings the hours in
   time order as spikes with the lab's influence web inside. Then the agreement chord and where each tree splits. */
"use strict";
(() => {
  const { svg, h, text, ticks } = L;
  const M = window.ML, H = M.hours, S = K.STATES, KD = K.KINDS, TAU = K.TAU, F = K.fmt;
  const n = H.n, NS = H.signals.length;
  const med = S.map((_, s) => H.signals.map((_, j) => K.median(H.z.filter((_, i) => H.ward[i] === s).map((r) => r[j]))));
  const byEta = H.signals.map((_, j) => j).sort((a, b) => H.eta[b] - H.eta[a]);
  // The radial plates group the signals by the state that runs highest on them, so each state draws its own petal.
  const peak = H.signals.map((_, j) => S.reduce((b, _, s) => (med[s][j] > med[b][j] ? s : b), 0));
  const AX = H.signals.map((_, j) => j).sort((a, b) => peak[a] - peak[b] || H.eta[b] - H.eta[a]);
  const counts = S.map((_, s) => H.ward.filter((w) => w === s).length);
  const hodOf = (i) => +H.t[i].slice(11, 13);
  const top = (i, k = 4) => H.signals.map((nm, j) => [nm, H.z[i][j]]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, k);
  const hourRows = (i) => [
    { value: S[H.ward[i]].name, label: "The tree's state", color: S[H.ward[i]].color },
    { value: S[H.lab[i]].name, label: "the lab's state", color: S[H.lab[i]].color },
    ...top(i).map(([nm, z]) => ({ value: F.signed(z, 1), label: nm })),
  ];
  const fx = (v) => v.toFixed(1);

  // Each hour state in plain words, with the days, the usual hour, and the signals that set it apart, for the hover
  // cards and the readout panel; a reader meets "the long route" here before any case study.
  const daysOf = (s) => [...new Set(H.t.filter((_, i) => H.ward[i] === s).map((t) => t.slice(0, 10)))].sort();
  const hoursHist = (s) => { const c = new Array(24).fill(0); H.ward.forEach((w, i) => { if (w === s) c[hodOf(i)]++; }); return c; };
  const hh = (v) => `${String(v).padStart(2, "0")}:00`;
  const nwj = H.signals.indexOf("network weather");
  const lrDays = daysOf(1);
  const STATE_LINE = [
    "The ordinary busy hour, when a little of everything is up at once.",
    `The hours when your computers reached your own services (Jellyfin, Immich, Pi-hole, carbon, huy.gg) on the slow path, most likely while the Mullvad VPN carried the traffic. Every one falls on ${F.day(lrDays[0])} to ${F.day(lrDays[lrDays.length - 1])}.`,
    "The Raspberry Pi doing its scheduled overnight jobs, busy and warm while the rest of the house is quiet.",
    "The house with almost nothing running.",
  ];
  // The signals a state moves by half a step or more, the strongest first; a signal "about usual" says nothing about it.
  const movers = (s, k = 3) => { const all = H.signals.map((nm, j) => [nm, med[s][j]]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])); const big = all.filter(([, z]) => Math.abs(z) >= 0.5).slice(0, k); return big.length ? big : all.slice(0, 1); };
  const zLine = (nm, z) => `${nm} ${K.zWords(z)} (${F.signed(z, 1)})`;
  // An hour's card: its state and what that means, the ring under the pointer first, then the signals that moved most.
  const hourCard = (i, j) => {
    const st = S[H.ward[i]], rows = [{ value: st.name, color: st.color, label: "this hour's state" }, { note: STATE_LINE[H.ward[i]] }];
    if (H.lab[i] !== H.ward[i]) rows.push({ value: S[H.lab[i]].name, color: S[H.lab[i]].color, label: "where the lab's k-means put it instead" });
    const show = j != null ? [[H.signals[j], H.z[i][j]], ...top(i, 4).filter(([nm]) => nm !== H.signals[j]).slice(0, 2)] : top(i, 3);
    show.forEach(([nm, z], q) => {
      rows.push({ value: F.signed(z, 1), label: `${nm}, ${K.zWords(z)}`, color: j != null && !q ? "var(--acc)" : null });
      rows.push({ note: `${nm}: ${K.SIGNAL_WORDS[nm] || "its own measure"}.` });
    });
    rows.push({ note: T1.lock ? "Click again, or press Escape, to let go." : "Click to keep this hour and dim the rest." });
    return rows;
  };

  // A state's numbers in one line: its hours and days, its usual hour, the lab's agreement, and what sets it apart.
  const statOf = (s) => {
    const d = daysOf(s), agree = H.confusion[s][s];
    return `${counts[s]} hours on ${d.length} day${d.length > 1 ? "s" : ""}, most often at ${hh(hoursHist(s).indexOf(Math.max(...hoursHist(s))))}. The lab's k-means agrees on ${agree} of them. Sets itself apart by ${movers(s).map(([nm, z]) => zLine(nm, z)).join(", ")}.`;
  };

  // The readout under Plate I's color key: the four states by default, a pressed state's summary, or the locked hour.
  function readout() {
    const el = document.getElementById("tree-readout");
    if (!el) return;
    el.replaceChildren();
    const item = (s, body, stat) => {
      const r = h("div", { class: "ri" }, el);
      r.appendChild(K.markSvg(S[s].shape, S[s].color));
      L.rich(h("div", {}, r), body);
      if (stat) L.rich(h("div", { class: "rs" }, r), stat);
    };
    if (T1.lock) {
      const i = H.order[T1.lock.k], j = T1.lock.j;
      h("div", { class: "rh" }, el, "The hour you picked");
      h("div", { class: "big" }, el, `${F.wday(H.t[i].slice(0, 10))}, ${F.hour(H.t[i])}`);
      item(H.ward[i], `<b>${S[H.ward[i]].name}.</b> ${STATE_LINE[H.ward[i]]}`, H.lab[i] !== H.ward[i] ? `The lab's k-means put this hour in ${K.inline(S[H.lab[i]])}, one of the ${H.n - H.confusion.reduce((a, r, q) => a + r[q], 0)} hours where the two methods disagree.` : "");
      if (j != null) {
        const z = H.z[i][j], below = H.z.filter((r) => r[j] < z).length;
        L.rich(h("p", {}, el), `<b>${H.signals[j]}</b>, ${K.SIGNAL_WORDS[H.signals[j]] || "its own measure"}: <b>${F.signed(z, 1)}</b>, ${K.zWords(z)}. That is higher than ${below} of the ${H.n} hours. The four states' typical values on it: ${S.map((st, q) => `${K.inline(st)} ${F.signed(med[q][j], 1)}`).join(", ")}.`);
      }
      L.rich(h("p", {}, el), `What moved most this hour: ${top(i, 4).map(([nm, z]) => zLine(nm, z)).join(", ")}.`);
      h("div", { class: "hint" }, el, "Click the hour again, or press Escape, to let go.");
      return;
    }
    if (T1.focus != null) {
      const s = T1.focus;
      h("div", { class: "rh" }, el, "The state you pressed");
      item(s, `<b>${S[s].name}.</b> ${STATE_LINE[s]}`, statOf(s));
      h("div", { class: "hint" }, el, "Press it again to see all four.");
      return;
    }
    L.rich(h("div", { class: "hint" }, el), `The four states stand in the plate's corners, beside the arcs their hours fill. Every signal is measured as how unusual the hour was for it: 0 is an ordinary hour, +2 is twice as far above normal as an ordinary hour usually strays. Click any hour on the plate to keep it and read it here.`);
  }

  // The state key under a plate: a button per state with its hours by hour of day; a press isolates that state.
  function stateKey(host, focus, onPick) {
    host.replaceChildren();
    S.forEach((st, s) => {
      const hrs = new Array(24).fill(0);
      H.ward.forEach((w, i) => { if (w === s) hrs[hodOf(i)]++; });
      const mx = Math.max(...hrs, 1);
      const el = h("button", { type: "button", class: `state${focus != null && focus !== s ? " dim" : ""}`, "aria-pressed": String(focus === s), style: `--sc:${st.color}` }, host);
      const nm = h("div", { class: "nm" }, el);
      nm.appendChild(K.markSvg(st.shape, st.color));
      h("span", {}, nm, st.name);
      const bars = h("div", { class: "hrs", "aria-hidden": "true", style: `color:${st.color}` }, el);
      hrs.forEach((c) => h("i", { style: `height:${Math.round((c / mx) * 100)}%` }, bars));
      h("div", {}, el, `${counts[s]} hours, most often at ${String(hrs.indexOf(mx)).padStart(2, "0")}:00`);
      el.addEventListener("click", () => onPick(focus === s ? null : s));
    });
  }
  const setFocus = (svgEl, f) => { if (f == null) svgEl.removeAttribute("data-focus"); else svgEl.setAttribute("data-focus", f); };

  /* ---------- Plate I: the tree of hours ---------- */
  const T1 = { focus: null, k: null, shown: false, lock: null };
  function treePlate(node) {
    node.replaceChildren();
    // The tree keeps its 860 square, drawn in the middle of a wider sheet whose sides hold the four states' notes.
    const W = 860, C = W / 2, VW = 1400, OX = (VW - W) / 2;
    const wrap = h("div", { class: "tree-wrap" }, node);
    const s = svg("svg", { viewBox: `0 0 ${VW} ${W}`, class: `tree${T1.shown ? "" : " grow"}`, role: "img", tabindex: 0,
      "aria-label": `The grouping tree over ${n} hours, drawn from its root at the center out to one leaf per hour, ringed by each hour's state and its sixteen signals. Arrow keys step through the hours.` }, wrap);
    setFocus(s, T1.focus);
    const g0 = svg("g", { transform: `translate(${OX} 0)` }, s);
    const gap = 0.92, a0 = gap / 2, dA = (TAU - gap) / n;
    const Rout = C - 4, rS = C * 0.5, ringW = (Rout - rS - 20) / NS, rLeaf = rS - 7;
    const pos = [];
    H.order.forEach((leaf, k) => { pos[leaf] = k; });
    const N2 = 2 * n - 1, ang = new Float64Array(N2), rad = new Float64Array(N2), st = new Int8Array(N2), par = new Int32Array(N2).fill(-1);
    const hmax = H.tree[n - 2][2], rh = (v) => 5 + (rLeaf - 5) * (1 - Math.sqrt(Math.max(0, v) / hmax));
    for (let i = 0; i < n; i++) { ang[i] = a0 + (pos[i] + 0.5) * dA; rad[i] = rLeaf; st[i] = H.ward[i]; }
    H.tree.forEach(([a, b, hh], i) => { const p = n + i; ang[p] = (ang[a] + ang[b]) / 2; rad[p] = rh(hh); st[p] = st[a] === st[b] ? st[a] : -1; par[a] = p; par[b] = p; });
    const P = (r, a) => K.pt(C, C, r, a).map(fx).join(" ");
    const elbow = (p, a, b) => `M${P(rad[a], ang[a])}L${P(rad[p], ang[a])}A${fx(rad[p])} ${fx(rad[p])} 0 ${Math.abs(ang[b] - ang[a]) > Math.PI ? 1 : 0} ${ang[b] > ang[a] ? 1 : 0} ${P(rad[p], ang[b])}L${P(rad[b], ang[b])}`;
    const defs = svg("defs", {}, s);

    // Height guides and the cut that leaves four groups, drawn as an architect's construction circles.
    const gG = svg("g", {}, g0);
    [5, 10, 20, 30].filter((v) => v < hmax).forEach((v) => svg("path", { class: "guide dash", d: K.arc(C, C, rh(v), a0, TAU - a0) }, gG));
    svg("path", { class: "cutline", d: K.arc(C, C, rh(H.cut), a0, TAU - a0) }, gG);

    const gB = svg("g", { filter: "url(#ink)" }, g0);
    H.tree.forEach(([a, b, hh, sz], i) => {
      const p = n + i;
      const el = svg("path", { class: `br${st[p] < 0 ? " mix" : ""}`, d: elbow(p, a, b), pathLength: 1, "data-s": st[p] < 0 ? null : st[p], "stroke-width": (0.7 + 2.4 * Math.sqrt(sz / n)).toFixed(2), stroke: st[p] < 0 ? null : S[st[p]].color }, gB);
      el.style.setProperty("--d", `${Math.round((1 - hh / hmax) * 1100)}ms`);
    });

    // The rings: The tree's state, the lab's state, then the sixteen signals, the most separating innermost.
    const gR = svg("g", {}, g0), gSt = svg("g", { filter: "url(#paint)" }, gR), gSig = svg("g", {}, gR);
    for (let k = 0; k < n; k++) {
      const i = H.order[k], aa = a0 + k * dA, bb = aa + dA + 0.0015;
      svg("path", { d: K.sector(C, C, rS, rS + 9, aa, bb), fill: S[H.ward[i]].color, "data-s": H.ward[i] }, gSt);
      svg("path", { d: K.sector(C, C, rS + 11, rS + 15, aa, bb), fill: S[H.lab[i]].color, "data-s": H.ward[i], opacity: 0.85 }, gSt);
      byEta.forEach((j, q) => {
        const r0 = rS + 19 + q * ringW;
        svg("path", { d: K.sector(C, C, r0, r0 + ringW - 0.9, aa, bb), fill: K.div(H.z[i][j]), "data-s": H.ward[i], "data-j": j, class: "sig" }, gSig);
      });
    }
    // Ring names are engraved along each ring inside the open wedge at twelve o'clock, ending where the ring begins.
    const gL = svg("g", {}, g0);
    const engrave = (r, str, id, anchor = "end") => {
      const pid = `p1-${id}`;
      svg("path", { id: pid, d: K.arc(C, C, r, -gap / 2 + 0.035, gap / 2 - 0.03), fill: "none" }, defs);
      const t = svg("text", { class: "eng" }, gL);
      svg("textPath", { href: `#${pid}`, startOffset: anchor === "end" ? "100%" : "50%", "text-anchor": anchor }, t).textContent = str;
    };
    engrave(rS + 1.5, "The tree's state", "w");
    engrave(rS + 11, "The lab's state", "l");
    byEta.forEach((j, q) => engrave(rS + 19 + q * ringW + ringW / 2 - 3.2, H.signals[j], `s${q}`));
    // The cut's name sits level at the top of its circle, inside the open wedge, where no branch passes.
    text(gL, C, fx(C - rh(H.cut) - 5), "four states", "eng", { "text-anchor": "middle" });

    // The four states in the corners the circle leaves empty. Each state's arc is the circular mean of its hours' angles;
    // the states, taken clockwise, go to the corners clockwise from top right, turned to whichever of the four starts sits
    // nearest. A leader leaves the rings at the end of the state's arc nearest its corner and runs to the note's edge,
    // measured after layout.
    const CORNERS = [[Math.PI / 4, "r", "t"], [3 * Math.PI / 4, "r", "b"], [5 * Math.PI / 4, "l", "b"], [7 * Math.PI / 4, "l", "t"]];
    const off = (p1, p2) => { const d = Math.abs(p1 - p2) % TAU; return Math.min(d, TAU - d); };
    const mid = S.map((_, q) => { let x = 0, y = 0; for (let i = 0; i < n; i++) if (H.ward[i] === q) { x += Math.sin(ang[i]); y += Math.cos(ang[i]); } const a = Math.atan2(x, y); return a < 0 ? a + TAU : a; });
    const cornerOf = (mids) => {
      const order = mids.map((_, q) => q).sort((p1, p2) => mids[p1] - mids[p2]);
      let best = null;
      for (let k = 0; k < 4; k++) { const at = []; let cost = 0; order.forEach((q, j) => { at[q] = (j + k) % 4; cost += off(mids[q], CORNERS[(j + k) % 4][0]); }); if (!best || cost < best.cost) best = { at, cost }; }
      return best.at;
    };
    const at = cornerOf(mid), gN = svg("g", { "pointer-events": "none" }, s);
    const anchor = S.map((_, q) => { let a = mid[q], d = Infinity; for (let i = 0; i < n; i++) if (H.ward[i] === q && off(ang[i], CORNERS[at[q]][0]) < d) { d = off(ang[i], CORNERS[at[q]][0]); a = ang[i]; } return a; });
    const notes = S.map((stt, q) => {
      const [, side, row] = CORNERS[at[q]], el = h("div", { class: `tnote ${side} ${row}`, "data-s": q, style: `--sc:${stt.color}` }, wrap);
      const nm = h("div", { class: "tn" }, el);
      nm.appendChild(K.markSvg(stt.shape, stt.color));
      h("span", {}, nm, stt.name);
      h("p", {}, el, STATE_LINE[q]);
      L.rich(h("p", { class: "ts" }, el), statOf(q));
      return el;
    });
    const drawLeads = () => {
      gN.replaceChildren();
      const wr = wrap.getBoundingClientRect();
      if (!wr.width) return;
      const k = VW / wr.width;
      notes.forEach((el, q) => {
        const b = el.getBoundingClientRect(), side = CORNERS[at[q]][1], top = (b.top - wr.top) * k, bot = (b.bottom - wr.top) * k;
        const [x0, y0] = K.pt(OX + C, C, Rout + 6, anchor[q]), [x1, y1] = K.pt(OX + C, C, Rout + 22, anchor[q]);
        const tx = side === "l" ? (b.right - wr.left) * k + 10 : (b.left - wr.left) * k - 10, ty = K.clamp(y1, top + 12, bot - 12);
        // An arc level with its note runs straight in; one above or below it runs level along the outside of the rings first,
        // then turns up or down the note's edge, so the line keeps clear of the rings either way.
        const turn = ty !== y1 ? `L${fx(tx)} ${fx(y1)}` : "";
        svg("path", { class: "tlead", "data-s": q, stroke: S[q].color, d: `M${fx(x0)} ${fx(y0)}L${fx(x1)} ${fx(y1)}${turn}L${fx(tx)} ${fx(ty)}` }, gN);
        svg("circle", { class: "tdot", "data-s": q, cx: fx(x0), cy: fx(y0), r: 3, fill: S[q].color }, gN);
      });
      dimNotes(T1.lock ? H.ward[H.order[T1.lock.k]] : T1.focus);
    };
    if (T1.ro) T1.ro.disconnect();
    T1.ro = typeof ResizeObserver === "function" ? new ResizeObserver(drawLeads) : null;
    if (T1.ro) { T1.ro.observe(wrap); if (L.signal) L.signal.addEventListener("abort", () => T1.ro && T1.ro.disconnect()); }
    requestAnimationFrame(drawLeads);
    const dimNotes = (f) => { wrap.querySelectorAll(".tnote").forEach((x) => x.classList.toggle("dim", f != null && +x.dataset.s !== f)); gN.querySelectorAll("[data-s]").forEach((x) => x.classList.toggle("dim", f != null && +x.dataset.s !== f)); };
    dimNotes(T1.focus);

    // The probe: a hover or an arrow key draws the hour's line through the rings and its path back to the root. A click
    // keeps one hour (and the signal ring under the pointer): its path stays, its state stays, and the rest dims.
    const gLock = svg("g", { "pointer-events": "none" }, g0), gP = svg("g", { "pointer-events": "none" }, g0);
    const drawHour = (g, k, cls) => {
      g.replaceChildren();
      if (k == null) return;
      const i = H.order[k];
      const [x0, y0] = K.pt(C, C, rLeaf, ang[i]), [x1, y1] = K.pt(C, C, Rout + 3, ang[i]);
      svg("line", { class: "probe", x1: x0, y1: y0, x2: x1, y2: y1 }, g);
      let c = i, d = "";
      while (par[c] >= 0) {
        const p = par[c];
        d += `M${P(rad[c], ang[c])}L${P(rad[p], ang[c])}A${fx(rad[p])} ${fx(rad[p])} 0 0 ${ang[p] > ang[c] ? 1 : 0} ${P(rad[p], ang[p])}`;
        c = p;
      }
      svg("path", { class: `path${cls ? " " + cls : ""}`, d }, g);
    };
    const title = (i) => `${F.wday(H.t[i].slice(0, 10))}, ${F.hour(H.t[i])}`;
    const probe = (k, evt, j = null) => {
      drawHour(gP, k);
      if (k == null) { L.tip.hide(); return; }
      const i = H.order[k];
      if (evt) L.tip.show(evt, title(i), hourCard(i, j)); else L.tip.at(s, title(i), hourCard(i, j));
    };
    // Which signal ring sits under the pointer, by radius; null over the tree and the two state rings.
    const ringAt = (r) => { const q = Math.floor((r - rS - 19) / ringW); return r >= rS + 19 && q >= 0 && q < NS ? byEta[q] : null; };
    const hit = (e) => {
      const p = K.polar(s, e, OX + C, C);
      if (p.r > Rout + 6 || p.a < a0 || p.a > TAU - a0) return null;
      return { k: Math.min(n - 1, Math.max(0, Math.floor((p.a - a0) / dA))), j: ringAt(p.r) };
    };
    const applyLock = () => {
      const L1 = T1.lock;
      drawHour(gLock, L1 ? L1.k : null, "lock");
      setFocus(s, L1 ? H.ward[H.order[L1.k]] : T1.focus);
      dimNotes(L1 ? H.ward[H.order[L1.k]] : T1.focus);
      s.classList.toggle("sigfocus", !!(L1 && L1.j != null));
      s.querySelectorAll(".sig.on").forEach((el) => el.classList.remove("on"));
      if (L1 && L1.j != null) s.querySelectorAll(`.sig[data-j="${L1.j}"]`).forEach((el) => el.classList.add("on"));
      readout();
    };
    s.addEventListener("pointermove", (e) => {
      const at = hit(e);
      if (!at) { probe(null); return; }
      T1.k = at.k;
      probe(at.k, e, at.j);
    });
    s.addEventListener("click", (e) => {
      const at = hit(e);
      const same = at && T1.lock && T1.lock.k === at.k && T1.lock.j === at.j;
      T1.lock = !at || same ? null : at;
      applyLock();
      if (at) probe(at.k, e, at.j);
    });
    s.addEventListener("pointerleave", () => probe(null));
    s.addEventListener("blur", () => probe(null));
    s.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && T1.lock) { T1.lock = null; applyLock(); return; }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      T1.k = T1.k == null ? 0 : (T1.k + (e.key === "ArrowRight" ? 1 : n - 1)) % n;
      probe(T1.k);
    });
    if (T1.lock) applyLock();

    // The entrance: branches grow from the root while the rings sweep clockwise from the open wedge.
    if (!T1.shown) {
      const cp = svg("clipPath", { id: "p1-sweep" }, defs), cpp = svg("path", { d: "M0 0" }, cp);
      gR.setAttribute("clip-path", "url(#p1-sweep)");
      K.enter(node, () => {
        T1.shown = true;
        s.classList.add("go");
        K.tween("p1-sweep", 1500, (t) => cpp.setAttribute("d", K.sector(C, C, 0, Rout + 12, a0 - 0.01, a0 - 0.01 + (TAU - gap + 0.02) * t + 0.0005)), () => gR.removeAttribute("clip-path"));
        // The rings never stay cut: whatever stops the sweep, they show whole once it should have ended.
        setTimeout(() => gR.removeAttribute("clip-path"), 1700);
      });
    }

    const key = document.getElementById("tree-key");
    if (key) stateKey(key, T1.focus, function pick(f) { T1.focus = f; T1.lock = null; applyLock(); stateKey(key, f, pick); });
    readout();
    K.tables(node, [
      ["Each state's median on each signal, in deviations from the signal's usual hour; the share of each signal's variation that lies between the states (η²)", ["Signal", "η²", ...S.map((x) => x.short)],
        byEta.map((j) => [H.signals[j], H.eta[j].toFixed(2), ...S.map((_, q) => F.signed(med[q][j], 2))])],
      ["Every hour, in the tree's order", ["Hour", "The tree's state", "The lab's state"], H.order.map((i) => [F.hour(H.t[i]), S[H.ward[i]].name, S[H.lab[i]].name])],
    ]);
  }

  /* ---------- Plate II: sixteen signals, radial parallel coordinates that unroll flat ---------- */
  const T2 = { flat: 0, focus: null, brush: {} };
  const ZLO = -4, ZHI = 6;
  function pcPlate(node) {
    node.replaceChildren();
    const card = node.closest(".panel"), ctl = card && card.querySelector(".pctl");
    const W = Math.round(K.clamp(L.width(node, 680), 320, 780)), C = W / 2;
    const s = svg("svg", { viewBox: `0 0 ${W} ${W}`, class: "pc", role: "img", tabindex: 0,
      "aria-label": `${n} hours drawn across sixteen signals. In the round view each signal is a spoke and each hour a closed line around it; in the flat view the spokes stand side by side as parallel axes.` }, node);
    setFocus(s, T2.focus);
    const r0 = W * 0.12, Rr = C - 70, fx0 = 30, fx1 = W - 24, fy0 = W * 0.16, fy1 = W * 0.78;
    const u = (z) => (K.clamp(z, ZLO, ZHI) - ZLO) / (ZHI - ZLO);
    const RAD = (k, z) => K.pt(C, C, r0 + u(z) * (Rr - r0), ((k % NS) / NS) * TAU);
    const FLAT = (k, z) => [fx0 + (k / NS) * (fx1 - fx0), fy1 - u(z) * (fy1 - fy0)];
    const PT = (k, z, t) => { const a = RAD(k, z), b = FLAT(k, z); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
    const line = (vs, t) => { let d = ""; for (let k = 0; k <= NS; k++) { const [x, y] = PT(k, vs[k % NS], t); d += `${k ? "L" : "M"}${fx(x)} ${fx(y)}`; } return d; };
    const vals = H.z.map((r) => AX.map((j) => r[j]));
    const mvals = S.map((_, q) => AX.map((j) => med[q][j]));

    const gGuide = svg("g", {}, s), gSp = svg("g", {}, s), gH = svg("g", { class: "hrs" }, s), gBand = svg("g", {}, s), gMed = svg("g", {}, s), gHit = svg("g", {}, s), gLr = svg("g", {}, s), gLf = svg("g", {}, s);
    const guides = [-2, 0, 2, 4, 6].map((z) => ({ z, el: svg("path", { class: `guide${z === 0 ? " zero" : " dash"}` }, gGuide) }));
    const gTick = svg("g", {}, gGuide);
    const spokes = Array.from({ length: NS + 1 }, (_, k) => svg("line", { class: "spoke", opacity: k === NS ? 0 : 1 }, gSp));
    const drawOrder = [0, 1, 3, 2].flatMap((q) => H.ward.map((w, i) => (w === q ? i : -1)).filter((i) => i >= 0));
    const hrs = drawOrder.map((i) => ({ i, el: svg("path", { class: "hr", stroke: S[H.ward[i]].color, "data-s": H.ward[i] }, gH) }));
    const meds = S.map((st, q) => [svg("path", { class: "medhalo" }, gMed), svg("path", { class: "med", stroke: st.color, "data-s": q }, gMed)]);
    const bands = {};
    // Axis names: around the rim in the round view, slanted under the axes in the flat one.
    const labR = AX.map((j, k) => {
      const a = (k / NS) * TAU, [x, y] = K.pt(C, C, Rr + 14, a), sx = Math.sin(a);
      return text(gLr, fx(x), fx(y + 3.5 - Math.cos(a) * 4), H.signals[j], "axlab", { "text-anchor": sx > 0.18 ? "start" : sx < -0.18 ? "end" : "middle" });
    });
    const labF = AX.map((j, k) => { const [x] = FLAT(k, ZLO); return text(gLf, fx(x + 3), fx(fy1 + 12), H.signals[j], "axlab", { "text-anchor": "end", transform: `rotate(-38 ${fx(x + 3)} ${fx(fy1 + 12)})` }); });

    const pass = (i) => Object.entries(T2.brush).every(([j, [lo, hi]]) => { const v = K.clamp(H.z[i][+j], ZLO, ZHI); return v >= lo && v <= hi; });
    const countEl = ctl && ctl.querySelector(".count");
    // The readout says in words what the brush keeps: each dragged range, and which states the kept hours belong to.
    const pcRead = (c, by) => {
      const el = document.getElementById("pc-readout");
      if (!el) return;
      el.replaceChildren();
      const br = Object.entries(T2.brush);
      if (!br.length) {
        h("div", { class: "rh" }, el, "The brush");
        L.rich(h("p", {}, el), "Drag along any spoke to keep only the hours whose value there falls inside the drag. Drag a second spoke to narrow further. This panel then says what you kept and which states those hours belong to.");
        return;
      }
      h("div", { class: "rh" }, el, `${c} of ${n} hours kept`);
      br.forEach(([j, [lo, hi]]) => L.rich(h("p", {}, el), `<b>${H.signals[+j]}</b> between ${F.signed(lo, 1)} and ${F.signed(hi, 1)}: ${K.zWords(lo)} to ${K.zWords(hi)}. ${K.SIGNAL_WORDS[H.signals[+j]] || ""}.`));
      S.forEach((st, q) => { if (!by[q]) return; const r = h("div", { class: "ri" }, el); r.appendChild(K.markSvg(st.shape, st.color)); L.rich(h("div", {}, r), `<b>${by[q]}</b> ${st.name}, ${F.pct(by[q] / c, 0)} of what you kept and ${F.pct(by[q] / counts[q], 0)} of that state's hours`); });
    };
    const refilter = () => {
      let c = 0;
      const by = S.map(() => 0);
      hrs.forEach((hr) => { const ok = pass(hr.i); if (hr.ok !== ok) { hr.ok = ok; hr.el.classList.toggle("off", !ok); } if (ok) { c++; by[H.ward[hr.i]]++; } });
      if (countEl) countEl.textContent = Object.keys(T2.brush).length ? `${c} of ${n} hours pass the brush` : `all ${n} hours`;
      pcRead(c, by);
    };
    const paintBands = (t) => Object.entries(bands).forEach(([k, el]) => { const [lo, hi] = T2.brush[AX[+k]] || [0, 0]; const [x1, y1] = PT(+k, lo, t), [x2, y2] = PT(+k, hi, t); el.setAttribute("d", `M${fx(x1)} ${fx(y1)}L${fx(x2)} ${fx(y2)}`); });
    const draw = (t) => {
      guides.forEach(({ z, el }) => { let d = ""; for (let k = 0; k <= NS; k++) { const [x, y] = PT(k, z, t); d += `${k ? "L" : "M"}${fx(x)} ${fx(y)}`; } el.setAttribute("d", d); });
      gTick.replaceChildren();
      guides.forEach(({ z }) => { const [x, y] = PT(0, z, t); text(gTick, fx(x + 4), fx(y - 3), F.signed(z, 0).replace("+0", "0"), "", {}); });
      spokes.forEach((el, k) => { const [x1, y1] = PT(k, ZLO, t), [x2, y2] = PT(k, ZHI, t); el.setAttribute("x1", fx(x1)); el.setAttribute("y1", fx(y1)); el.setAttribute("x2", fx(x2)); el.setAttribute("y2", fx(y2)); el.setAttribute("opacity", k === NS ? t * 0.6 : 1); });
      if (!T2.morphing) hrs.forEach(({ i, el }) => el.setAttribute("d", line(vals[i], t)));
      meds.forEach(([halo, el], q) => { const d = line(mvals[q], t); halo.setAttribute("d", d); el.setAttribute("d", d); });
      paintBands(t);
      hits.forEach((el, k) => { const [x1, y1] = PT(k, ZLO, t), [x2, y2] = PT(k, ZHI, t); el.setAttribute("x1", fx(x1)); el.setAttribute("y1", fx(y1)); el.setAttribute("x2", fx(x2)); el.setAttribute("y2", fx(y2)); });
      gLr.setAttribute("opacity", Math.max(0, 1 - t * 2));
      gLf.setAttribute("opacity", Math.max(0, t * 2 - 1));
      T2.cur = t;
    };
    // Brushing: a drag along an axis keeps only the hours whose value there falls inside the drag; a click clears that axis.
    const project = (k, x, y) => {
      const t = T2.cur || 0, [ax, ay] = PT(k, ZLO, t), [bx, by] = PT(k, ZHI, t), vx = bx - ax, vy = by - ay;
      return ZLO + K.clamp(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1) * (ZHI - ZLO);
    };
    const hits = AX.map((j, k) => {
      const el = svg("line", { class: "axhit" }, gHit);
      el.addEventListener("pointerenter", (e) => L.tip.show(e, H.signals[j], [{ note: `${H.signals[j]}: ${K.SIGNAL_WORDS[H.signals[j]] || "its own measure"}.` }, ...S.map((st, q) => ({ value: F.signed(med[q][j], 1), label: `${st.name}, ${K.zWords(med[q][j])}`, color: st.color })), { value: H.eta[j].toFixed(2), label: "η², how well it tells the states apart" }, { note: K.PLAIN.eta }, { note: "Drag along the spoke to keep only the hours inside the drag." }]));
      el.addEventListener("pointerleave", () => L.tip.hide());
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        L.tip.hide();
        const [x, y] = K.local(s, e), z0 = project(k, x, y);
        let moved = false, frame = 0, last = null;
        s.classList.add("moving");
        // One update a frame: the lines need no new geometry, so a move repaints only the band and the kept hours.
        const apply = () => {
          frame = 0;
          const [x2, y2] = last, z1 = project(k, x2, y2);
          if (Math.abs(z1 - z0) < 0.15) return;
          moved = true;
          T2.brush[j] = [Math.min(z0, z1), Math.max(z0, z1)];
          if (!bands[k]) bands[k] = svg("path", { class: "band", "stroke-width": 9, stroke: "var(--acc)", "stroke-linecap": "round", opacity: 0.35 }, gBand);
          paintBands(T2.cur || 0);
          refilter();
        };
        if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
        const move = (ev) => { last = K.local(s, ev); if (!frame) frame = requestAnimationFrame(apply); };
        const up = () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerup", up);
          el.removeEventListener("pointercancel", up);
          if (frame) { cancelAnimationFrame(frame); apply(); }
          s.classList.remove("moving");
          if (!moved) { delete T2.brush[j]; if (bands[k]) { bands[k].remove(); delete bands[k]; } refilter(); }
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
      });
      return el;
    });
    AX.forEach((j, k) => { if (T2.brush[j]) bands[k] = svg("path", { class: "band", "stroke-width": 9, stroke: "var(--acc)", "stroke-linecap": "round", opacity: 0.35 }, gBand); });

    if (ctl && !ctl.dataset.built) {
      ctl.dataset.built = "1";
      K.seg(ctl, "Layout", [["round", "Round"], ["flat", "Flat"]], T2.flat ? "flat" : "round", (k) => {
        const from = T2.cur || 0, to = k === "flat" ? 1 : 0;
        T2.flat = to;
        // Redrawing 433 lines each frame cannot hold the frame rate, so the axes and medians travel and the hours rejoin at the end.
        T2.morphing = true;
        T2.moving(true);
        K.tween("p2", 1200, (t) => T2.draw(from + (to - from) * t), () => { T2.morphing = false; T2.draw(to); T2.moving(false); });
      });
      const clr = h("button", { type: "button", class: "btn ghost" }, ctl, "Clear the brush");
      clr.addEventListener("click", () => { T2.brush = {}; T2.redraw(); });
      h("span", { class: "count" }, ctl, `all ${n} hours`);
    }
    T2.draw = draw;
    T2.moving = (on) => { s.classList.toggle("moving", on); s.classList.toggle("morphing", on && T2.morphing); };
    T2.morphing = false;
    T2.redraw = () => pcPlate(node);
    draw(T2.flat);
    refilter();
    const key = document.getElementById("pc-key");
    if (key) stateKey(key, T2.focus, function pick(f) { T2.focus = f; setFocus(s, f); stateKey(key, f, pick); });
    K.tables(node, [["The axes in their order around the circle, with each state's median, in deviations from the signal's usual hour", ["Axis", "Signal", "Highest in", "η²", ...S.map((x) => x.short)],
      AX.map((j, k) => [k + 1, H.signals[j], S[peak[j]].name, H.eta[j].toFixed(2), ...S.map((_, q) => F.signed(med[q][j], 2))])]]);
  }

  /* ---------- Plate III: the hours as a ring of spikes, with the influence web inside ---------- */
  const T3 = { focus: null };
  function webPlate(node) {
    node.replaceChildren();
    const W = Math.round(K.clamp(L.width(node, 640), 320, 760)), C = W / 2;
    const s = svg("svg", { viewBox: `0 0 ${W} ${W}`, class: "web2", role: "img", tabindex: 0,
      "aria-label": `The ${n} hours from ${F.hour(H.t[0])} to ${F.hour(H.t[n - 1])} around a ring, each a spike as long as the hour was unusual, with the links among the sixteen signals drawn inside.` }, node);
    setFocus(s, T3.focus);
    const gap = 0.3, a0 = gap / 2, dA = (TAU - gap) / n;
    const rms = H.z.map((r) => Math.sqrt(r.reduce((a, v) => a + v * v, 0) / NS)), rmx = Math.max(...rms);
    const rB = C * 0.68, Rs = C - 26, rN = C * 0.44;
    svg("path", { class: "guide", d: K.arc(C, C, rB, a0, TAU - a0) }, s);
    [0.5, 1].forEach((f) => svg("path", { class: "guide dash", d: K.arc(C, C, rB + (Rs - rB) * f, a0, TAU - a0) }, s));
    const gS = svg("g", { filter: "url(#ink)" }, s);
    const sw = Math.max(1.2, dA * rB * 0.62);
    H.t.forEach((t, i) => {
      const a = a0 + (i + 0.5) * dA, [x1, y1] = K.pt(C, C, rB, a), [x2, y2] = K.pt(C, C, rB + (Rs - rB) * (rms[i] / rmx), a);
      svg("line", { class: "spk", x1: fx(x1), y1: fx(y1), x2: fx(x2), y2: fx(y2), stroke: S[H.ward[i]].color, "stroke-width": sw.toFixed(2), "data-s": H.ward[i] }, gS);
      if (hodOf(i) === 0) {
        const [tx, ty] = K.pt(C, C, rB - 5, a), [ux, uy] = K.pt(C, C, rB - 14, a);
        svg("line", { x1: fx(tx), y1: fx(ty), x2: fx(x1), y2: fx(y1), stroke: "var(--line2)" }, s);
        text(s, fx(ux), fx(uy + 3), F.day(t.slice(0, 10)), "eng halo", { "text-anchor": "middle" });
      }
    });
    text(s, C, fx(C - Rs + 2), "Hours, Oct 12 onward", "eng", { "text-anchor": "middle" });

    // The web: the lab's lagged links among the signals, with the daily rhythm and each signal's momentum removed first.
    const idx = Object.fromEntries(AX.map((j, k) => [H.signals[j], k]));
    const npos = AX.map((_, k) => K.pt(C, C, rN, (k / NS) * TAU));
    const edges = (M.web.edges || []).filter((e) => idx[e.from] != null && idx[e.to] != null);
    const deg = AX.map(() => 0);
    edges.forEach((e) => { deg[idx[e.from]]++; deg[idx[e.to]]++; });
    const gE = svg("g", {}, s), gN = svg("g", {}, s);
    const quad = (A, B, t) => { const cx = C + ((A[0] + B[0]) / 2 - C) * 0.18, cy = C + ((A[1] + B[1]) / 2 - C) * 0.18; const m = 1 - t; return [m * m * A[0] + 2 * m * t * cx + t * t * B[0], m * m * A[1] + 2 * m * t * cy + t * t * B[1]]; };
    const links = edges.map((e) => {
      const A = npos[idx[e.from]], B = npos[idx[e.to]], col = e.r > 0 ? "var(--hot)" : "var(--cold)";
      const cx = C + ((A[0] + B[0]) / 2 - C) * 0.18, cy = C + ((A[1] + B[1]) / 2 - C) * 0.18;
      const g = svg("g", {}, gE);
      const el = svg("path", { class: `lk${e.lag ? " lag" : ""}`, d: `M${fx(A[0])} ${fx(A[1])}Q${fx(cx)} ${fx(cy)} ${fx(B[0])} ${fx(B[1])}`, stroke: col, "stroke-width": (1 + 7 * Math.abs(e.r)).toFixed(2) }, g);
      if (e.lag) {
        const [px, py] = quad(A, B, 0.82), [qx, qy] = quad(A, B, 0.9), ang2 = Math.atan2(qy - py, qx - px), L2 = 7;
        svg("path", { d: `M${fx(qx)} ${fx(qy)}L${fx(qx - L2 * Math.cos(ang2 - 0.45))} ${fx(qy - L2 * Math.sin(ang2 - 0.45))}L${fx(qx - L2 * Math.cos(ang2 + 0.45))} ${fx(qy - L2 * Math.sin(ang2 + 0.45))}Z`, fill: col, class: "lk" }, g);
      }
      L.hover(el, `${e.from} ${e.lag ? "leads" : "moves with"} ${e.to}`, () => [{ value: F.signed(e.r, 2), label: e.r > 0 ? "correlation: they rise together" : "correlation: they move opposite" }, { value: e.lag ? `${e.lag} h` : "same hour", label: "lag" }, { value: e.q != null ? e.q.toFixed(3) : "n/a", label: `q, after the correction across ${window.ML.web.tests ? `${window.ML.web.tests} tests` : "every test"}` }]);
      return { e, g };
    });
    // A click keeps one signal's links isolated until a second click or Escape; hovering another signal still reads it out.
    let keepOn = null;
    s.addEventListener("keydown", (e) => { if (e.key === "Escape" && keepOn) { const f = keepOn; keepOn = null; f(false); } });
    AX.forEach((j, k) => {
      const [x, y] = npos[k], a = (k / NS) * TAU, r = 3.5 + 2.6 * Math.sqrt(deg[k]);
      const g = svg("g", { class: "nd", transform: `translate(${fx(x)} ${fx(y)})`, tabindex: 0 }, gN);
      svg("circle", { r: fx(r), fill: S[peak[j]].color }, g);
      const [lx, ly] = K.pt(0, 0, r + 9, a), sx = Math.sin(a);
      text(g, fx(lx), fx(ly + 3.5), H.signals[j], "", { "text-anchor": sx > 0.2 ? "start" : sx < -0.2 ? "end" : "middle" });
      const mine = links.filter(({ e }) => e.from === H.signals[j] || e.to === H.signals[j]);
      const on = (v) => { g.classList.toggle("on", v); links.forEach(({ g: lg }) => lg.querySelectorAll(".lk").forEach((p) => p.classList.toggle("off", v && !mine.some((m) => m.g === lg)))); };
      g.addEventListener("pointerenter", (e) => { on(true); L.tip.show(e, H.signals[j], [{ note: `${H.signals[j]}: ${K.SIGNAL_WORDS[H.signals[j]] || "its own measure"}.` }, ...(mine.length ? mine.slice(0, 7).map(({ e: ed }) => { const other = ed.from === H.signals[j] ? ed.to : ed.from; return { value: F.signed(ed.r, 2), label: ed.lag ? (ed.from === H.signals[j] ? `leads ${other} by ${ed.lag} h` : `follows ${other} by ${ed.lag} h`) : `${ed.r > 0 ? "rises with" : "moves opposite to"} ${other}`, color: ed.r > 0 ? "var(--hot)" : "var(--cold)" }; }) : [{ value: "none", label: "no link held once rhythm and momentum were removed" }]), { note: "Each figure is a correlation: +1 moves in step, −1 moves opposite, 0 is no link." }]); });
      g.addEventListener("pointerleave", () => { if (keepOn !== on) on(false); if (keepOn && keepOn !== on) keepOn(true); L.tip.hide(); });
      g.addEventListener("click", () => { const was = keepOn; if (was) was(false); keepOn = was === on ? null : on; if (keepOn) on(true); });
      g.addEventListener("focus", () => on(true));
      g.addEventListener("blur", () => { if (keepOn !== on) on(false); });
    });
    // Spikes answer the pointer by angle, since a spike is too thin to aim at.
    s.addEventListener("pointermove", (e) => {
      if (e.target.closest && (e.target.closest(".nd") || e.target.classList.contains("lk"))) return;
      const p = K.polar(s, e, C, C);
      if (p.r < rB - 4 || p.r > Rs + 6 || p.a < a0 || p.a > TAU - a0) { L.tip.hide(); return; }
      const i = Math.min(n - 1, Math.max(0, Math.floor((p.a - a0) / dA)));
      L.tip.show(e, `${F.hour(H.t[i])}, ${F.wday(H.t[i].slice(0, 10))}`, [{ value: rms[i].toFixed(2), label: "distance from a usual hour" }, ...hourRows(i)]);
    });
    s.addEventListener("pointerleave", () => L.tip.hide());
    K.tables(node, [
      ["The links inside the ring: lagged correlations that held at q < 0.10 after removing each signal's daily rhythm and momentum", ["From", "To", "Lag (h)", "r", "q"], edges.map((e) => [e.from, e.to, e.lag, F.signed(e.r, 2), e.q != null ? e.q.toFixed(3) : ""])],
      ["Every hour around the ring, with how far it sat from a usual hour (root mean square of its sixteen deviations)", ["Hour", "The tree's state", "Distance"], H.t.map((t, i) => [F.hour(t), S[H.ward[i]].name, rms[i].toFixed(2)])],
    ]);
  }

  /* ---------- Agreement with the lab: the tree's groups on the left, the lab's on the right, a band for each pairing ---------- */
  const T4 = { mode: "hours" };
  function chordPlate(node) {
    node.replaceChildren();
    const card = node.closest(".panel"), ctl = card && card.querySelector(".pctl");
    if (ctl && !ctl.dataset.built) { ctl.dataset.built = "1"; K.seg(ctl, "", [["hours", "Hours"], ["days", "Days"]], T4.mode, (k) => { T4.mode = k; chordPlate(node); }); }
    const hours = T4.mode === "hours", mat = hours ? H.confusion : M.days.confusion, G = hours ? S : KD;
    const W = Math.round(K.clamp(L.width(node, 460), 300, 640)), Hh = 300;
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, class: "chordp", role: "img", "aria-label": `How the tree's ${hours ? "hour states" : "kinds of day"} line up with the lab's: a band for each pairing, as wide as the ${hours ? "hours" : "days"} they share.` }, node);
    const nG = mat.length, total = mat.flat().reduce((a, b) => a + b, 0), rowT = mat.map((r) => r.reduce((a, b) => a + b, 0)), colT = G.map((_, j) => mat.reduce((a, r) => a + r[j], 0));
    const top = 52, bot = Hh - 10, gap = 10, per = (bot - top - gap * (nG - 1)) / total, xL = 104, bw = 12, xR = W - 104 - bw;
    const lY = [], rY = [];
    let y = top;
    rowT.forEach((v) => { lY.push(y); y += v * per + gap; });
    y = top;
    colT.forEach((v) => { rY.push(y); y += v * per + gap; });
    // Each pairing is a band from the tree's block to the lab's; a level band is agreement, a slanted one a disagreement.
    const gB = svg("g", { class: "wash" }, s), lc = lY.slice(), rc = rY.slice(), xm = (xL + bw + xR) / 2;
    mat.forEach((row, i) => row.forEach((c, j) => {
      if (!c) return;
      const h0 = c * per, y0 = lc[i], y1 = rc[j];
      lc[i] += h0; rc[j] += h0;
      const d = `M${xL + bw} ${fx(y0)}C${fx(xm)} ${fx(y0)} ${fx(xm)} ${fx(y1)} ${xR} ${fx(y1)}L${xR} ${fx(y1 + h0)}C${fx(xm)} ${fx(y1 + h0)} ${fx(xm)} ${fx(y0 + h0)} ${xL + bw} ${fx(y0 + h0)}Z`;
      const el = svg("path", { class: "rib", d, fill: G[i].color, opacity: i === j ? 0.6 : 0.3 }, gB);
      L.hover(el, `${G[i].name} by the tree, ${K.inline(G[j]).replace(/^Still$/, "still")} by the lab`, () => [{ value: `${c}`, label: hours ? "hours" : "days" }, { value: F.pct(c / total), label: `of all ${total}` }]);
    }));
    G.forEach((g, i) => {
      svg("rect", { x: xL, y: fx(lY[i]), width: bw, height: fx(rowT[i] * per), fill: g.color }, s);
      text(s, xL - 8, fx(lY[i] + (rowT[i] * per) / 2 + 4), `${g.short || g.name} ${rowT[i]}`, "ink", { "text-anchor": "end", "font-size": 11 });
      svg("rect", { x: xR, y: fx(rY[i]), width: bw, height: fx(colT[i] * per), fill: g.color }, s);
      text(s, xR + bw + 8, fx(rY[i] + (colT[i] * per) / 2 + 4), `${g.short || g.name} ${colT[i]}`, "ink", { "text-anchor": "start", "font-size": 11 });
    });
    text(s, xL + bw, 14, "THE GROUPING TREE", "eng", { "text-anchor": "end" });
    text(s, xR, 14, "THE LAB'S K-MEANS", "eng", { "text-anchor": "start" });
    const agree = mat.reduce((a, r, i) => a + r[i], 0), ari = (hours ? H.byk[4] : M.days.byk[2]).ari;
    text(s, fx(xm), 30, `adjusted Rand ${ari.toFixed(2)}`, "it big", { "text-anchor": "middle" });
    text(s, fx(xm), 44, `${agree} of ${total} ${hours ? "hours" : "days"} agree`, "it", { "text-anchor": "middle" });
    K.tables(node, [[`The tree's ${hours ? "states" : "kinds"} (rows) against the lab's (columns), in ${hours ? "hours" : "days"}`, ["Tree \\ lab", ...G.map((g) => g.short || g.name)], mat.map((r, i) => [G[i].short || G[i].name, ...r])]]);
  }

  /* ---------- Where each tree splits: how long each number of groups lasts as the cut comes down ---------- */
  const T5 = { mode: "hours" };
  function splitsPlate(node) {
    node.replaceChildren();
    const card = node.closest(".panel"), ctl = card && card.querySelector(".pctl");
    if (ctl && !ctl.dataset.built) { ctl.dataset.built = "1"; K.seg(ctl, "", [["hours", "Hours"], ["days", "Days"]], T5.mode, (k) => { T5.mode = k; splitsPlate(node); }); }
    const hours = T5.mode === "hours", B = hours ? H : M.days, kCut = hours ? 4 : 2;
    const ks = [2, 3, 4, 5, 6, 7, 8, 9, 10], life = ks.map((k) => B.heights[k - 2] - B.heights[k - 1]);
    const W = L.width(node, 620), Hh = 230, half = (W - 40) / 2, top = 18, bot = Hh - 30;
    const s = svg("svg", { viewBox: `0 0 ${W} ${Hh}`, role: "img", "aria-label": `For each number of groups from 2 to 10, how long it lasts as the cut comes down the tree, and the silhouette and agreement with the lab at that number.` }, node);
    // Left: the span of cut heights that leaves exactly k groups; the widest span is the most natural number.
    const x0 = 36, xw = half - 46, bx = (q) => x0 + (q + 0.5) * (xw / ks.length), lmax = Math.max(...life) * 1.12;
    const y = (v) => bot - (v / lmax) * (bot - top);
    ticks(0, lmax, 4).forEach((t) => { svg("line", { x1: x0, x2: x0 + xw, y1: fx(y(t)), y2: fx(y(t)), stroke: "var(--line)" }, s); text(s, x0 - 6, fx(y(t) + 3.5), t.toFixed(0), "end"); });
    ks.forEach((k, q) => {
      const bw = Math.min(22, xw / ks.length - 6), on = k === kCut;
      const el = svg("rect", { x: fx(bx(q) - bw / 2), y: fx(y(life[q])), width: fx(bw), height: fx(bot - y(life[q])), rx: 2, fill: on ? "var(--acc)" : "var(--line2)" }, s);
      text(s, fx(bx(q)), bot + 14, String(k), on ? "mid ink" : "mid");
      if (on) text(s, fx(bx(q)), fx(y(life[q]) - 6), life[q].toFixed(1), "mid ink");
      L.hover(el, `${k} groups`, () => [{ value: life[q].toFixed(2), label: "span of cut heights that leaves this many groups" }, { value: `${B.heights[k - 1]} to ${B.heights[k - 2]}`, label: "the cut's range" }]);
    });
    text(s, x0, 10, "SPAN OF THE CUT THAT LEAVES K GROUPS", "eng");
    // Right: silhouette and agreement with the lab, one shared scale from 0 to 1.
    const x1 = x0 + half + 18, xw2 = half - 30, px = (k) => x1 + ((k - 2) / 8) * xw2, py = (v) => bot - v * (bot - top);
    [0, 0.25, 0.5, 0.75, 1].forEach((t) => { svg("line", { x1, x2: x1 + xw2, y1: fx(py(t)), y2: fx(py(t)), stroke: "var(--line)" }, s); text(s, x1 - 6, fx(py(t) + 3.5), t.toFixed(2), "end"); });
    ks.forEach((k) => text(s, fx(px(k)), bot + 14, String(k), k === kCut ? "mid ink" : "mid"));
    svg("line", { x1: fx(px(kCut)), x2: fx(px(kCut)), y1: top, y2: bot, stroke: "var(--acc)", "stroke-dasharray": "3 4" }, s);
    [["sil", "var(--c1)", "silhouette"], ["ari", "var(--c2)", "agreement with the lab (adjusted Rand)"]].forEach(([key, col, lab]) => {
      const pts = ks.map((k) => [px(k), py(B.byk[k][key])]);
      svg("path", { d: K.poly(pts), fill: "none", stroke: col, "stroke-width": 2 }, s);
      pts.forEach(([x, yy], q) => { const c = svg("circle", { cx: fx(x), cy: fx(yy), r: 4, fill: col, stroke: "var(--panel2)", "stroke-width": 1.5 }, s); L.hover(c, `${ks[q]} groups`, () => [{ value: B.byk[ks[q]][key].toFixed(3), label: lab, color: col }, { value: B.byk[ks[q]].sizes.join(", "), label: hours ? "hours per group" : "days per group" }]); });
    });
    text(s, x1, 10, "SILHOUETTE AND AGREEMENT", "eng");
    const lg = document.getElementById("splits-legend");
    if (lg) { lg.replaceChildren(); [["var(--c1)", "Silhouette: how well each member sits in its own group"], ["var(--c2)", "Agreement with the lab's k-means (adjusted Rand)"], ["var(--acc)", `The cut at ${kCut}`]].forEach(([c, t]) => { const sp = h("span", {}, lg); h("i", { style: `background:${c}` }, sp); sp.append(t); }); }
    K.tables(node, [[`${hours ? "Hours" : "Days"}: each number of groups`, ["Groups", "Span of the cut", "Silhouette", "Adjusted Rand with the lab", "Sizes"], ks.map((k, q) => [k, life[q].toFixed(2), B.byk[k].sil.toFixed(3), B.byk[k].ari.toFixed(3), B.byk[k].sizes.join(", ")])]]);
  }

  K.reg("tree", treePlate);
  K.reg("pc", pcPlate);
  K.reg("web", webPlate);
  K.reg("chord", chordPlate);
  K.reg("splits", splitsPlate);
  Object.assign(K, { AX, peak, med, byEta, counts, STATE_LINE });
})();
