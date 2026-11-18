/* ML lab helpers over the data lab's window.L: polar geometry for the circular plates, arc and sector paths, a tween that
   honors Pause motion and reduced motion, the hour states and kinds of day as the lab names and colors them, verdict badges,
   switches, and the text helpers that fill every sentence from window.ML, so a rerun redraws the copy with the charts. */
"use strict";
(() => {
  const { svg, h } = L;
  const K = (window.K = {});
  const TAU = (K.TAU = Math.PI * 2);
  const f2 = (v) => Math.round(v * 100) / 100;

  // Angle 0 is twelve o'clock and angles run clockwise, as on a dial.
  K.pt = (cx, cy, r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  K.arc = (cx, cy, r, a0, a1) => {
    const [x0, y0] = K.pt(cx, cy, r, a0), [x1, y1] = K.pt(cx, cy, r, a1);
    return `M${f2(x0)} ${f2(y0)}A${f2(r)} ${f2(r)} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} ${a1 >= a0 ? 1 : 0} ${f2(x1)} ${f2(y1)}`;
  };
  // An annular sector from r0 to r1 between two angles, a0 < a1.
  K.sector = (cx, cy, r0, r1, a0, a1) => {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const [x0, y0] = K.pt(cx, cy, r1, a0), [x1, y1] = K.pt(cx, cy, r1, a1), [x2, y2] = K.pt(cx, cy, r0, a1), [x3, y3] = K.pt(cx, cy, r0, a0);
    return `M${f2(x0)} ${f2(y0)}A${f2(r1)} ${f2(r1)} 0 ${large} 1 ${f2(x1)} ${f2(y1)}L${f2(x2)} ${f2(y2)}A${f2(r0)} ${f2(r0)} 0 ${large} 0 ${f2(x3)} ${f2(y3)}Z`;
  };
  K.poly = (pts, close) => pts.map(([x, y], i) => `${i ? "L" : "M"}${f2(x)} ${f2(y)}`).join("") + (close ? "Z" : "");
  // A closed Catmull-Rom curve through the points, for the roses: the shape reads as painted rather than plotted.
  K.smooth = (pts) => {
    const n = pts.length;
    let d = `M${f2(pts[0][0])} ${f2(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += `C${f2(p1[0] + (p2[0] - p0[0]) / 6)} ${f2(p1[1] + (p2[1] - p0[1]) / 6)} ${f2(p2[0] - (p3[0] - p1[0]) / 6)} ${f2(p2[1] - (p3[1] - p1[1]) / 6)} ${f2(p2[0])} ${f2(p2[1])}`;
    }
    return d + "Z";
  };
  // The pointer in the SVG's own units, and as an angle and radius about a center.
  K.local = (svgEl, evt) => {
    const r = svgEl.getBoundingClientRect(), vb = svgEl.viewBox && svgEl.viewBox.baseVal, k = vb && r.width ? vb.width / r.width : 1;
    return [(evt.clientX - r.left) * k, (evt.clientY - r.top) * k];
  };
  K.polar = (svgEl, evt, cx, cy) => {
    const [x, y] = K.local(svgEl, evt);
    let a = Math.atan2(x - cx, -(y - cy));
    if (a < 0) a += TAU;
    return { a, r: Math.hypot(x - cx, y - cy), x, y };
  };
  K.clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  // A value drawn on a plate's scale is held at the edge it passes, and `cut` says which edge, so the plate can mark it
  // instead of drawing it as a real value at that edge.
  K.cut = (v, lo, hi) => ({ v: Math.min(hi, Math.max(lo, v)), cut: v < lo ? -1 : v > hi ? 1 : 0 });
  K.cutMark = (g, x, y, title, value, side) => {
    const c = svg("circle", { class: "cutmark", cx: Math.round(x * 10) / 10, cy: Math.round(y * 10) / 10, r: 4.2, tabindex: 0 }, g);
    L.hover(c, title, () => [{ value, label: side < 0 ? "below the scale" : "above the scale" }]);
    return c;
  };
  K.cutKey = (lg) => { const sp = h("span", {}, lg); h("i", { class: "cut" }, sp); sp.append("a value past the scale; hover it for the value"); };
  K.median = (arr) => {
    const v = arr.filter((x) => x != null && isFinite(x)).sort((a, b) => a - b);
    if (!v.length) return null;
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  };
  K.quantile = (arr, q) => {
    const v = arr.filter((x) => x != null && isFinite(x)).sort((a, b) => a - b);
    return v.length ? v[Math.min(v.length - 1, Math.max(0, Math.round(q * (v.length - 1))))] : null;
  };

  // One tween per key, so a new one cancels the old. Pause motion and reduced motion land on the last frame at once.
  K.easeIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const live = new Map();
  K.tween = (key, dur, step, done) => {
    if (live.has(key)) cancelAnimationFrame(live.get(key));
    live.delete(key);
    if (L.paused || L.reduced || !dur || typeof requestAnimationFrame !== "function") { step(1); if (done) done(); return; }
    const t0 = performance.now();
    const frame = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      step(K.easeIO(k));
      if (k < 1) live.set(key, requestAnimationFrame(frame));
      else { live.delete(key); if (done) done(); }
    };
    live.set(key, requestAnimationFrame(frame));
  };
  // A canvas needs the look's colors resolved; an SVG mark keeps var() and repaints itself.
  // In Sphere the lab's node carries its own accent, so the tokens are read there.
  // The lab's tokens are set on its plates, the only place its stylesheet reaches.
  K.css = (name, fallback = "#888") => (getComputedStyle(L.mount === document.body ? document.documentElement : L.mount.querySelector(".ml-plates") || L.mount).getPropertyValue(name) || "").trim() || fallback;

  // The four hour states and the two kinds of day, named, colored, and marked as the data lab draws them.
  K.STATES = [
    { name: "Working with Claude", short: "Working", color: "var(--c2)", tok: "--c2", shape: "circle" },
    { name: "The long route", short: "Long route", color: "var(--c1)", tok: "--c1", shape: "square" },
    { name: "The Pi's night shift", short: "Pi's night", color: "var(--c3)", tok: "--c3", shape: "triangle" },
    { name: "Still", short: "Still", color: "var(--c0)", tok: "--faint", shape: "ring" },
  ];
  // The main process puts each night's groups in these slots by signature; a slot no group matched is keyed "new".
  ((window.ML && window.ML.hours && window.ML.hours.states) || []).forEach((k, i) => { if (k === "new" && K.STATES[i]) Object.assign(K.STATES[i], { name: "A new state", short: "New" }); });
  // A state's name inside a sentence: the leading article drops to lowercase, and Claude and the Pi keep their capitals.
  K.inline = (st) => st.name.replace(/^The /, "the ");
  // The sixteen hourly signals in everyday words, for hover cards, the readout panels, and the case studies.
  K.SIGNAL_WORDS = {
    "ELLIE cpu": "how hard the desktop's processor worked", "ELLIE memory": "how much of the desktop's memory was in use", "Pi temperature": "how warm the Raspberry Pi ran",
    "Pi load": "how busy the Raspberry Pi was", "carbon memory": "memory in use on the carbon laptop server", "Claude's processes": "how many programs Claude Code started",
    prompts: "messages you typed to Claude", friction: "messages that showed frustration", "phone opens": "times an app was opened on the iPhone",
    "█████ activity": "how much █████ logged", "█████ errors": "errors from █████, mostly its SSH agent", "routine failures": "scheduled jobs that failed",
    "Sphere alerts": "alerts Sphere raised", "Windows errors": "errors in Windows' own logs", "network weather": "how slow the connection to your own services was, all of them at once",
    "ELLIE traffic": "data the desktop sent and received",
  };
  // Each measure the page reports, in one plain sentence, for hover cards and captions beside the number.
  K.PLAIN = {
    r2: "R² says how much better the forecast is than guessing the average: 0 is no better, below 0 is worse, and 1 would be perfect.",
    auc: "AUC is how often the model ranks a prompt that carried the signal above one that did not: 0.5 is a coin flip, and 1 is perfect.",
    ari: "Adjusted Rand says how closely two groupings agree: 0 is what chance gives, and 1 is the same grouping.",
    eta: "η² is the share of a signal's ups and downs that lies between the states; the rest lies inside them. Near 1, the signal tells the states apart.",
    perm: "Importance is how much worse the forecast gets when that one input is shuffled, so the model can no longer use it.",
    sil: "Silhouette says how clearly each member sits in its own group compared with the next one: 1 is clean, and 0 is on the border.",
    mae: "Mean error is how far off the forecast is on a typical hour, in the same units as the thing forecast.",
  };
  // A deviation from the signal's usual hour, in words: the scale every hour signal on the page shares.
  K.zWords = (z) => {
    if (z == null || !isFinite(z)) return "no reading";
    const a = Math.abs(z), side = z > 0 ? "above" : "below";
    return a < 0.5 ? "about usual" : a < 1 ? `a little ${side} usual` : a < 2 ? `well ${side} usual` : `far ${side} usual`;
  };
  K.KINDS = [
    { name: "Quiet days", one: "quiet day", color: "var(--c1)", tok: "--c1" },
    { name: "Build days", one: "build day", color: "var(--c2)", tok: "--c2" },
  ];
  K.mark = (g, shape, r, fill) => {
    if (shape === "circle") return svg("circle", { r, fill }, g);
    if (shape === "square") return svg("rect", { x: -r * 0.88, y: -r * 0.88, width: r * 1.76, height: r * 1.76, fill }, g);
    if (shape === "triangle") return svg("path", { d: `M0 ${-r * 1.15}L${r * 1.05} ${r * 0.75}L${-r * 1.05} ${r * 0.75}Z`, fill }, g);
    return svg("circle", { r: r * 0.8, fill: "none", stroke: fill, "stroke-width": 1.6 }, g);
  };
  K.markSvg = (shape, color, size = 14) => {
    const s = svg("svg", { width: size, height: size, viewBox: "-7 -7 14 14", "aria-hidden": "true" });
    K.mark(s, shape, 4.6, color);
    return s;
  };
  // Diverging fill for a robust z: cool below usual, warm above, the panel at usual; it saturates at three deviations.
  K.div = (z) => {
    if (z == null || !isFinite(z)) return "var(--sunk)";
    const p = Math.round(Math.min(1, Math.abs(z) / 3) * 94);
    return p < 5 ? "var(--panel2)" : `color-mix(in oklab, var(${z > 0 ? "--hot" : "--cold"}) ${p}%, var(--panel2))`;
  };

  const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  K.fmt = {
    hour: (s) => L.when(L.date(s)),
    day: (s) => L.day(L.date(s)),
    wday: (s) => WD[L.date(s).getDay()],
    r2: (v) => (v == null ? "n/a" : (v < 0 ? "−" : "") + Math.abs(v).toFixed(2)),
    signed: (v, d = 2) => (v == null ? "n/a" : (v < 0 ? "−" : "+") + Math.abs(v).toFixed(d)),
    num: (v, d = 2) => (v == null ? "n/a" : (v < 0 ? "−" : "") + Math.abs(v).toFixed(d)),
    pct: (v, d = 1) => (v == null ? "n/a" : (v * 100).toFixed(d) + "%"),
    x: (v) => v.toFixed(1) + "×",
    int: L.fmt.int,
  };
  // Signal names as the lab wrote them, with the column names of the daily and hourly tables made readable.
  const NAMES = {
    prompts: "prompts", prompts_frustrated: "frustrated prompts", prompts_praise: "praise prompts", tok_out_k: "output tokens", replies: "replies",
    prompt_chars_k: "characters typed", commits: "commits", phone_min: "phone minutes", phone_opens: "phone opens", vault_files_edited: "vault files edited",
    claude_hours: "hours in Claude", last_prompt_hour: "last prompt's hour", prev_last_prompt_hour: "last prompt's hour, day before", sleep_h: "sleep",
    sleep_h_prev_day: "sleep, night before", exercise_min: "exercise", sober: "sober", dow: "day of the week", mood_prev: "yesterday's mood",
    productivity_prev: "yesterday's productivity", energy_prev: "yesterday's energy", ellie_cpu: "CPU this hour", ellie_ram_gb: "memory",
    cpu_lag1: "CPU an hour before", cpu_yday: "CPU this hour yesterday", hod_s: "hour of day (sine)", hod_c: "hour of day (cosine)",
    at_keyboard: "at the keyboard", fg_claude: "Claude in front", fg_terminal: "terminal in front", fg_browser: "browser in front", fg_obsidian: "Obsidian in front",
    ram_claude_gb: "Claude's memory", ram_browser_gb: "browser memory", ram_obsidian_gb: "Obsidian memory", ram_node_gb: "node memory", ellie_cpu_s: "CPU seconds",
    net_mb: "network traffic", proc_starts: "process starts", task_fail: "failed tasks", op_unlock: "█████ unlocks", op_ssh: "█████ SSH",
    win_err: "Windows errors", vault_log_edits: "log edits", commits_carbon: "carbon commits", commits_sphere: "Sphere commits", tok_in_k: "input tokens",
    tok_cache_read_m: "cache reads", sessions: "sessions", idx: "place in the session", gap_min: "minutes since the last prompt", sess_min: "minutes into the session",
    prev_fric: "last prompt had friction", prev_praise: "last prompt praised", prev_swear: "last prompt swore", fric_last3: "friction in the last three",
    day_n: "prompts so far today",
  };
  K.name = (k) => NAMES[k] || (/^m_/.test(k) ? `model: ${k.slice(2)}` : /^e_/.test(k) ? `effort: ${k.slice(2)}` : k);

  // Text: every sentence is built from window.ML and set with L.rich, which allows <b> and <code> and nothing else.
  K.rich = (el, s) => { el.replaceChildren(); return L.rich(el, s); };
  K.set = (id, s) => { const el = document.getElementById(id); if (el) K.rich(el, s); return el; };
  K.ev = (id, items) => {
    const ul = document.getElementById(id);
    if (!ul) return;
    ul.replaceChildren();
    items.filter(Boolean).forEach((s) => L.rich(h("li", {}, ul), s));
  };
  K.vb = (parent, v) => {
    const s = h("span", { class: `vb${v.cls ? " " + v.cls : ""}` }, parent, v.word);
    if (v.small) h("small", {}, s, v.small);
    return s;
  };
  // An evidence row marked .flow continues its list under the anchor tile, so the two columns end on one baseline. Items
  // move from the end of the left column, in order, while the right column stays no taller than the left; the grid then
  // stretches the right column to the left's height and its list spreads to meet the bottom.
  K.flowEv = (row) => {
    const left = row.querySelector(":scope > .evs"), col2 = row.querySelector(":scope > .evcol2"), more = col2 && col2.querySelector(":scope > .ev.more");
    if (!left || !more) return;
    const lists = [...left.querySelectorAll(":scope > .ev")];
    [...more.children].forEach((li) => lists[li._home].appendChild(li));
    const items = lists.flatMap((ul, q) => [...ul.children].map((li) => { li._home = q; return li; }));
    row.style.alignItems = "start";
    const hL = () => left.getBoundingClientRect().height, hR = () => col2.getBoundingClientRect().height;
    for (let i = items.length - 1; i > 0; i--) {
      more.prepend(items[i]);
      if (hR() > hL()) { lists[items[i]._home].appendChild(items[i]); break; }
    }
    row.style.alignItems = "";
  };
  K.anchor = (id, v, callout) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.replaceChildren();
    K.vb(el, v);
    if (!callout) return;
    const lc = h("div", { class: `lc ${callout.cls || "idea"}` }, el);
    h("span", {}, h("header", {}, lc), callout.head);
    L.rich(h("p", { class: "tx" }, lc), callout.text);
  };
  // A segmented switch in the plate's control row; on(k) runs with the chosen key.
  // Sphere's chip group, so every switch on the page looks and answers the same; the id gives each group a glass capsule
  // of its own, since its chips carry no data attributes for glass.js to tell the groups apart by.
  let switches = 0;
  K.seg = (parent, label, opts, cur, on) => {
    const g = h("span", { class: "grp" }, parent);
    if (label) h("span", {}, g, label);
    const seg = h("div", { class: "lanes sphere-ui", id: `lab-sw-${++switches}`, role: "group", "aria-label": label || "View" }, g);
    const btns = opts.map(([k, lab]) => {
      const b = h("button", { type: "button", class: "lane", "aria-pressed": String(k === cur) }, seg, lab);
      b.addEventListener("click", () => {
        btns.forEach((x, i) => x.setAttribute("aria-pressed", String(opts[i][0] === k)));
        on(k);
      });
      return b;
    });
    return seg;
  };
  // Each plate queues its renderer; the boot draws them once every card has its faces, and adds each to the lab's redraw
  // list, so a card's Chart face and a resize both draw it again. A plate that throws is reported and the rest still draw.
  const R = (window.LABR = window.LABR || []);
  const queue = [];
  K.reg = (id, fn) => queue.push([id, fn]);
  K.drawAll = () => queue.forEach(([id, fn]) => {
    const node = document.getElementById(id);
    if (!node) return;
    R.push([node, fn]);
    try { fn(node); } catch (e) { console.error(`plate ${id}:`, e); }
  });
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => R.forEach(([nd, fn]) => { if (nd.isConnected && nd.offsetParent !== null) fn(nd); }), 180); }, { signal: L.signal });
  // The height a sheet's chart should take so its lower edge meets the side column's last line: the side column's content,
  // less everything else in the chart's column. It never drops below the chart's own base height.
  // W is the drawing's viewBox width: a sheet's SVG shows at most 880 px wide, so a wider drawing is scaled down and needs
  // proportionally more height in its own units.
  K.fill = (node, base, W) => {
    const grid = node.closest(".sheet-grid"), side = grid && grid.querySelector(".side"), vis = node.closest(".vis");
    if (!side || !vis || grid.closest(".sheet.wide")) return base;
    // The side column's own height, read with it unstretched for a moment, so a chart that already fills the row cannot
    // feed its height back into the measure.
    const was = side.style.alignSelf;
    side.style.alignSelf = "start";
    const sideH = side.getBoundingClientRect().height;
    side.style.alignSelf = was;
    const holder = [...vis.children].find((c) => c.contains(node));
    const others = [...vis.children].filter((c) => c !== holder && c.offsetParent !== null);
    const otherH = others.reduce((a, c) => a + c.getBoundingClientRect().height, 0) + 8 * others.length;
    const inner = holder && holder !== node ? holder.getBoundingClientRect().height - node.getBoundingClientRect().height : 0;
    const scale = W ? W / Math.min(W, 880) : 1;
    return Math.round(Math.max(base, (sideH - otherH - Math.max(0, inner)) * scale));
  };
  // Keyboard reading for a hover-driven plate: the arrow keys step through its n marks, each step sending the plate the
  // same pointer move a hover would at that mark's point (given in viewBox units), and Enter or Space sends the click
  // that keeps it. The plate's own Escape handler lets go.
  K.keySteps = (s, n, posOf) => {
    let i = null;
    const at = (type) => {
      const r = s.getBoundingClientRect(), vb = s.viewBox.baseVal, k = r.width / vb.width, [x, y] = posOf(i);
      const init = { clientX: r.left + x * k, clientY: r.top + y * k, bubbles: true };
      s.dispatchEvent(type === "click" ? new MouseEvent("click", init) : new PointerEvent("pointermove", init));
    };
    if (!s.hasAttribute("tabindex")) s.setAttribute("tabindex", "0");
    s.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (step) { e.preventDefault(); i = i == null ? 0 : (i + step + n) % n; at("move"); return; }
      if ((e.key === "Enter" || e.key === " ") && i != null) { e.preventDefault(); at("click"); }
    });
    s.addEventListener("blur", () => L.tip.hide());
  };
  // A chart focused by a click draws no outline; one reached by the keyboard keeps it. The pointer marks the chart it
  // pressed, and the Tab key clears every mark.
  document.addEventListener("pointerdown", (e) => { const sv = e.target.closest && e.target.closest(".plate .chart svg"); if (sv) sv.classList.add("pointed"); }, { capture: true, signal: L.signal });
  document.addEventListener("keydown", (e) => { if (e.key === "Tab") document.querySelectorAll("svg.pointed").forEach((sv) => sv.classList.remove("pointed")); }, { capture: true, signal: L.signal });
  // L.table keeps one table per parent element, so each of a chart's tables gets its own holder inside the card, made once
  // and kept across redraws so a redraw replaces its tables in place.
  K.tables = (node, list) => {
    const card = node.closest(".panel");
    if (!card) return;
    card._holders = card._holders || {};
    list.forEach(([cap, head, rows], q) => {
      const key = `${node.id}:${q}`;
      if (!card._holders[key]) { card._holders[key] = h("div", { hidden: "" }); card.appendChild(card._holders[key]); }
      L.table(card._holders[key], cap, head, rows.map((r) => r.map((c) => (c == null ? "" : String(c)))));
    });
  };
  // A plate's entrance: the card unrolls as a lab card does, then the plate's own motion starts.
  // A redraw before the card is revealed replaces the waiting callback, so the motion still starts on the reveal. A redraw
  // during the reveal runs its own motion and clears the waiting one, which would otherwise restart the motion on the
  // discarded drawing and cancel the live drawing's partway.
  K.enter = (node, fn) => {
    const card = node.closest(".panel");
    if (card) card._enter = null;
    if (!card || card.classList.contains("in")) { fn(); return; }
    card._enter = fn;
    if (!card.dataset.entered) { card.dataset.entered = "1"; L.watch(card, () => card._enter && card._enter()); }
  };
})();
