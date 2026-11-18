/* Data lab helpers shared by every section: element builders, scales, the tooltip, card faces (chart, numbers, case study),
   entrances, looks, and the background scene each look draws. Exposed as window.L so the section scripts stay plain script,
   loadable from file:// without a server. */
"use strict";
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const root = document.documentElement;
  const reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const L = { reduced, paused: reduced };
  // In Sphere the page is one node inside Insights, where the ruler mounts; the tooltip and the case-study sheet mount in
  // a layer over Sphere's header, the page scrolls inside #main, a redrawn night aborts the old listeners, and Sphere owns
  // the look and the ground.
  const EMBED = window.LAB_EMBED || null;
  L.mount = EMBED ? EMBED.mount : document.body;
  L.layer = EMBED ? EMBED.layer : document.body;
  L.scroller = EMBED ? EMBED.scroller : window;
  L.signal = EMBED ? EMBED.signal : undefined;

  // SVG and HTML builders. A fill or stroke holding var() goes through style, so the look's tokens resolve at paint time.
  L.svg = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if ((k === "fill" || k === "stroke") && String(v).includes("(")) e.style.setProperty(k, v);
      else e.setAttribute(k, v);
    }
    if (parent) parent.appendChild(e);
    return e;
  };
  L.h = (tag, attrs = {}, parent, text) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === "class") e.className = v;
      else e.setAttribute(k, v);
    }
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  L.text = (parent, x, y, str, cls, extra = {}) => {
    const t = L.svg("text", { x, y, class: cls, ...extra }, parent);
    t.textContent = str;
    return t;
  };

  // Scales and ticks.
  L.scale = (d0, d1, r0, r1) => {
    const span = (d1 - d0) || 1;
    const f = (v) => r0 + ((v - d0) / span) * (r1 - r0);
    f.inv = (p) => d0 + ((p - r0) / ((r1 - r0) || 1)) * span;
    return f;
  };
  L.logScale = (d0, d1, r0, r1) => {
    const a = Math.log10(d0), b = Math.log10(d1);
    return (v) => r0 + ((Math.log10(Math.max(v, d0)) - a) / (b - a)) * (r1 - r0);
  };
  L.ticks = (lo, hi, n = 4) => {
    const raw = (hi - lo) / n;
    const mag = 10 ** Math.floor(Math.log10(raw || 1));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  };
  L.fmt = {
    int: (v) => Math.round(v).toLocaleString("en-US"),
    pct: (v, d = 1) => (v * 100).toFixed(d) + "%",
    n1: (v) => (+v).toFixed(1),
    n2: (v) => (+v).toFixed(2),
    signed: (v, d = 2) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(d),
    compact: (v) => (Math.abs(v) >= 1000 ? (v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1) + "K" : String(Math.round(v))),
  };
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  L.date = (s) => {
    const [d, t = "00"] = s.split("T");
    const [Y, M, D] = d.split("-").map(Number);
    const [hh, mm = 0] = t.split(":").map(Number);
    return new Date(Y, M - 1, D, hh, mm);
  };
  L.day = (d) => `${MON[d.getMonth()]} ${d.getDate()}`;
  L.clock = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  L.when = (d) => `${L.day(d)}, ${L.clock(d)}`;
  L.width = (node, fallback = 760) => Math.max(280, Math.floor((node && node.clientWidth) || fallback));
  // A chart marked .fill takes the height its row leaves it (the row is as tall as the text beside it), never less than its base.
  L.fill = (node, base, reserve = 0) => Math.round(Math.max(base, ((node && node.clientHeight) || 0) - reserve));

  // One tooltip for the page. Values lead, labels follow; rows key their series with a short stroke.
  const tip = L.h("div", { class: "tip", role: "status", "aria-live": "polite" }, L.layer);
  L.tip = {
    show(evt, title, rows) {
      tip.replaceChildren();
      if (title) L.h("div", { class: "tt" }, tip, title);
      for (const r of rows) {
        // A note row is a sentence under the row above it, for a variable that needs its meaning beside its value.
        if (r.note) { L.h("div", { class: "tn" }, tip, r.note); continue; }
        const row = L.h("div", { class: "tr" }, tip);
        if (r.color) L.h("i", { class: "tk", style: `background:${r.color}` }, row);
        L.h("b", {}, row, r.value);
        if (r.label) L.h("span", {}, row, r.label);
      }
      tip.classList.add("on");
      L.tip.move(evt);
    },
    move(evt) {
      const pad = 14, w = tip.offsetWidth || 180, hgt = tip.offsetHeight || 60;
      let x = (evt.clientX || 0) + pad, y = (evt.clientY || 0) + pad;
      if (x + w > innerWidth - 8) x = (evt.clientX || 0) - w - pad;
      if (y + hgt > innerHeight - 8) y = (evt.clientY || 0) - hgt - pad;
      tip.style.transform = `translate(${Math.max(4, x)}px, ${Math.max(4, y)}px)`;
    },
    // Keyboard focus shows the same readout, anchored to the focused mark.
    at(node, title, rows) {
      const r = node.getBoundingClientRect ? node.getBoundingClientRect() : { right: 0, top: 0 };
      L.tip.show({ clientX: r.right, clientY: r.top }, title, rows);
    },
    hide() { tip.classList.remove("on"); },
  };
  L.hover = (node, title, rows) => {
    node.addEventListener("pointerenter", (e) => L.tip.show(e, title, rows()));
    node.addEventListener("pointermove", (e) => L.tip.move(e));
    node.addEventListener("pointerleave", () => L.tip.hide());
    node.addEventListener("focus", () => L.tip.at(node, title, rows()));
    node.addEventListener("blur", () => L.tip.hide());
  };

  // Card faces. A card shows its chart, its numbers, or its case study inside one footprint: switching away from the chart
  // locks the body at the chart's height and the other face scrolls inside it, so opening the numbers never lengthens the page.
  // Case-study prose allows two inline marks, <b> and <code>; everything else is set as text, never parsed as HTML.
  L.rich = (el, str) => {
    String(str).split(/(<b>[\s\S]*?<\/b>|<code>[\s\S]*?<\/code>)/).forEach((part) => {
      const m = part.match(/^<(b|code)>([\s\S]*)<\/(?:b|code)>$/);
      if (m) L.h(m[1], {}, el, m[2]);
      else if (part) el.appendChild(document.createTextNode(part));
    });
    return el;
  };
  // Margin notes: each note's term is wrapped where it first appears in the prose, and the note sits in a rail beside the text,
  // joined to that line by a leader through the gutter. Under 760px, too narrow for the reading measure and a rail together, the
  // rail folds away and each note follows its paragraph.
  const wrapTerm = (art, term) => {
    for (const p of art.querySelectorAll("p")) {
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const i = node.data.indexOf(term);
        if (i < 0) continue;
        const hit = node.splitText(i);
        hit.splitText(term.length);
        const span = L.h("span", { class: "term" });
        hit.replaceWith(span);
        span.appendChild(hit);
        return span;
      }
    }
    return null;
  };
  const NOTE_KIND = { why: "Why", context: "Context" };
  const placeNotes = (wrap) => {
    const items = wrap._notes, art = wrap.querySelector(".case"), rail = wrap.querySelector(".case-rail"), leads = wrap.querySelector(".case-leads");
    if (!items.length || !wrap.clientWidth) return;
    const narrow = wrap.clientWidth < 760;
    wrap.classList.toggle("narrow", narrow);
    leads.replaceChildren();
    if (narrow) {
      const last = new Map();
      items.forEach(({ span, note }) => { const p = span.closest("p"); (last.get(p) || p).after(note); last.set(p, note); note.style.top = ""; });
      wrap.style.minHeight = "";
      return;
    }
    items.forEach(({ note }) => rail.appendChild(note));
    const wr = wrap.getBoundingClientRect(), x1 = art.getBoundingClientRect().right - wr.left + 10, x2 = rail.getBoundingClientRect().left - wr.left - 8;
    // Each note wants its title level with its term's line. Notes that would overlap merge into a run centered on the lines they
    // explain (the least-squares top), so a crowded paragraph spreads its notes above and below it, never only downward.
    const GAP = 14;
    const want = items.map((it) => {
      const r = it.span.getClientRects()[0] || it.span.getBoundingClientRect(), ly = r.top - wr.top + r.height / 2;
      return { it, ly, d: ly - 9, h: it.note.offsetHeight + GAP };
    });
    const runs = [];
    want.forEach((n) => {
      let run = { m: [n], top: Math.max(0, n.d), h: n.h };
      for (let prev = runs[runs.length - 1]; prev && prev.top + prev.h > run.top; prev = runs[runs.length - 1]) {
        runs.pop();
        const m = prev.m.concat(run.m);
        let off = 0, sum = 0;
        m.forEach((x) => { sum += x.d - off; off += x.h; });
        run = { m, top: Math.max(0, sum / m.length), h: off };
      }
      runs.push(run);
    });
    // Within a run, elbows step left as the jog grows, which keeps the verticals in the gutter apart and out of each other's way.
    let bottom = 0;
    runs.forEach((run) => {
      let off = 0;
      run.m.forEach((x) => { x.top = Math.round(run.top + off); off += x.h; x.ny = Math.abs(x.top + 9 - x.ly) < 2 ? x.ly : x.top + 9; });
      const order = run.m.slice().sort((a, b) => Math.abs(a.ny - a.ly) - Math.abs(b.ny - b.ly));
      const step = order.length > 1 ? Math.min(5, (x2 - x1 - 9) / (order.length - 1)) : 0;
      order.forEach((x, i) => { x.xm = x2 - 6 - step * i; });
      bottom = Math.max(bottom, run.top + run.h);
    });
    want.forEach((x) => {
      x.it.note.style.top = x.top + "px";
      x.it.path = L.svg("path", { d: `M${x1} ${x.ly.toFixed(1)}H${x.xm.toFixed(1)}V${x.ny.toFixed(1)}H${x2}` }, leads);
      x.it.dot = L.svg("circle", { cx: x1, cy: x.ly.toFixed(1), r: 2 }, leads);
    });
    wrap.style.minHeight = Math.round(bottom) + "px";
  };
  const buildCase = (face, key, back) => {
    face.dataset.built = "1";
    const c = (window.LAB_CASES || {})[key];
    const wrap = L.h("div", { class: "case-wrap" }, face);
    const art = L.h("article", { class: "case" }, wrap);
    if (!c) { L.h("p", {}, art, "This case study is not written yet."); return; }
    L.rich(L.h("p", { class: "case-lede" }, art), c.lede);
    if (c.written) L.h("p", { class: "case-date" }, art, c.written);
    const toc = L.h("nav", { class: "case-toc", "aria-label": "Case study sections" }, art);
    c.sections.forEach((s, i) => {
      const id = `${key}-s${i}`;
      const a = L.h("a", { href: "#" + id }, toc, s.h);
      a.addEventListener("click", (e) => {
        e.preventDefault();
        // Jumps the reader sheet rather than gliding it: a smooth scroll on the fixed sheet stalls on its first call.
        const target = face.querySelector("#" + id), sc = face.closest(".reader-sheet") || face;
        sc.scrollTop += target.getBoundingClientRect().top - sc.getBoundingClientRect().top - (parseFloat(getComputedStyle(target).scrollMarginTop) || 6);
      });
      L.h("h4", { id }, art, s.h);
      s.p.forEach((para) => L.rich(L.h("p", {}, art), para));
    });
    const rail = L.h("aside", { class: "case-rail", "aria-label": "Margin notes" }, wrap);
    L.svg("svg", { class: "case-leads", "aria-hidden": "true" }, wrap);
    wrap._notes = (c.notes || []).map((n) => {
      const span = wrapTerm(art, n.term);
      if (!span) return null;
      const note = L.h("div", { class: "cnote" }, rail);
      if (NOTE_KIND[n.kind]) L.h("span", { class: "cn-k" }, note, NOTE_KIND[n.kind]);
      else L.h("span", { class: "cn-t" }, note, n.label || n.term);
      L.rich(L.h("span", { class: "cn-x" }, note), n.text);
      const it = { span, note };
      const hot = (on) => { [span, note, it.path, it.dot].forEach((el) => el && el.classList.toggle("hot", on)); };
      [span, note].forEach((el) => { el.addEventListener("pointerenter", () => hot(true)); el.addEventListener("pointerleave", () => hot(false)); });
      return it;
    }).filter(Boolean).sort((a, b) => (a.span.compareDocumentPosition(b.span) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    const b = L.h("button", { class: "btn back", type: "button" }, face, "Back to the chart");
    b.addEventListener("click", back);
    // Place on first show, again when the face changes width, and once the web fonts have set the lines.
    let lastW = 0;
    const place = () => { if (wrap.clientWidth && wrap.clientWidth !== lastW) { lastW = wrap.clientWidth; placeNotes(wrap); } };
    face._place = () => { lastW = 0; place(); };
    if (window.ResizeObserver) { const ro = new ResizeObserver(place); ro.observe(wrap); L.signal?.addEventListener("abort", () => ro.disconnect()); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(face._place);
    face._place();
  };
  // The case study reads in a sheet over the page at the window's full height, so a long study never scrolls inside a
  // chart-sized box and the page under it keeps its length. Close, Esc, the scrim, or Back to the chart returns to the card.
  let reader = null;
  // Open to the page too, so a lens's case study reads in the same sheet as a plate's.
  const openReader = L.openReader = (title, fCase, trigger, build) => {
    if (!reader) {
      reader = L.h("div", { class: "reader", hidden: "" }, L.layer);
      const scrim = L.h("div", { class: "reader-scrim" }, reader);
      const sheet = L.h("section", { class: "reader-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "reader-h", tabindex: -1 }, reader);
      const hd = L.h("header", { class: "reader-hd" }, sheet);
      const tt = L.h("div", {}, hd);
      L.h("span", { class: "reader-k" }, tt, "Case study");
      L.h("h2", { id: "reader-h" }, tt);
      // Sphere's drawn x, the mark its rail and docks close on; the name stays for a screen reader.
      const x = L.h("button", { class: "btn reader-x", type: "button", "aria-label": "Close", title: "Close" }, hd);
      const xs = L.svg("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" }, x);
      L.svg("path", { d: "M7 7l10 10M17 7L7 17" }, xs);
      reader._slot = L.h("div", { class: "reader-slot" }, sheet);
      reader._sheet = sheet;
      [scrim, x].forEach((el) => el.addEventListener("click", () => reader._close()));
      // Esc closes, and Tab cycles inside the sheet while it is open.
      reader.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { e.preventDefault(); reader._close(); return; }
        if (e.key !== "Tab") return;
        const f = [...sheet.querySelectorAll("a[href], button")].filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && (document.activeElement === f[0] || document.activeElement === sheet)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      });
    }
    reader.querySelector("#reader-h").textContent = title;
    reader._slot.replaceChildren(fCase);
    fCase.hidden = false;
    reader.hidden = false;
    document.documentElement.classList.add("reading");
    reader._sheet.scrollTop = 0;
    reader._close = () => {
      reader.hidden = true;
      document.documentElement.classList.remove("reading");
      fCase.hidden = true;
      trigger.focus();
    };
    build();
    reader._sheet.focus();
  };
  let faceN = 0;
  L.faces = (card) => {
    if (card._faces) return card._faces;
    const head = card.querySelector(":scope > .ph");
    const body = L.h("div", { class: "fbody" });
    const fChart = L.h("div", { class: "face f-chart", role: "tabpanel" });
    [...card.childNodes].filter((n) => n !== head).forEach((n) => fChart.appendChild(n));
    body.appendChild(fChart);
    const fNum = L.h("div", { class: "face f-num", role: "tabpanel", tabindex: 0, hidden: "" }, body);
    const numBack = L.h("button", { class: "btn back", type: "button" }, fNum, "Back to the chart");
    const caseKey = card.dataset.case;
    // The case study is built on its first open and shown in the reader sheet, so it is not one of the card's faces.
    const fCase = caseKey ? L.h("div", { class: "face f-case", hidden: "" }) : null;
    card.appendChild(body);
    // Chart and Numbers as Sphere's chips, the same switch every card on the page carries.
    const seg = L.h("div", { class: "lanes sphere-ui fseg", id: `lab-face-${++faceN}`, role: "group", "aria-label": "Card view" }, head || card);
    if (fCase) {
      const cb = L.h("button", { class: "fcase", type: "button", "aria-haspopup": "dialog" }, head || card, "Case study");
      cb.insertAdjacentHTML("beforeend", `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 8.5l5-5M4.5 3.5h4v4"/></svg>`);
      const title = head && head.querySelector("h3") ? head.querySelector("h3").textContent.trim() : "Case study";
      cb.addEventListener("click", () => openReader(title, fCase, cb, () => { if (!fCase.dataset.built) buildCase(fCase, caseKey, () => reader._close()); else fCase._place(); }));
    }
    const views = [["chart", "Chart", fChart], ["num", "Numbers", fNum]];
    let current = "chart";
    const show = (k) => {
      if (k === current) return;
      // The body is a flex item, so the lock sets its flex basis; a height alone would be overridden by flex: 1.
      if (current === "chart") { const hgt = Math.max(body.offsetHeight, 220); body.style.flex = `0 0 ${hgt}px`; body.style.height = hgt + "px"; }
      if (k === "chart") { body.style.flex = ""; body.style.height = ""; }
      views.forEach(([kk, , face], i) => {
        face.hidden = kk !== k;
        btns[i].setAttribute("aria-pressed", String(kk === k));
      });
      current = k;
      if (k === "num") fNum.querySelectorAll(".tblock").forEach((b) => { if (b._fill) { b._fill(); b._fill = null; } });
      const face = views.find((v) => v[0] === k)[2];
      face.scrollTop = 0;
      // A chart drawn while its face was hidden had no width; draw it again now it shows.
      if (k === "chart") (window.LABR || []).forEach(([n, fn]) => { if (card.contains(n)) fn(n); });
    };
    const btns = views.map(([k, lab], i) => {
      const b = L.h("button", { type: "button", class: "lane", "aria-pressed": String(k === "chart") }, seg, lab);
      b.addEventListener("click", () => show(k));
      return b;
    });
    numBack.addEventListener("click", () => { show("chart"); btns[0].focus(); });
    card._faces = { fChart, fNum, fCase, numBack, show, body };
    return card._faces;
  };

  // Every chart's numbers go to its card's Numbers face; a redraw replaces its own table in place.
  const tkeys = new WeakMap();
  let tseq = 0;
  L.table = (parent, caption, head, rows) => {
    const block = L.h("section", { class: "tblock" });
    L.h("div", { class: "tcap" }, block, caption);
    const t = L.h("table", {}, block);
    const tr = L.h("tr", {}, L.h("thead", {}, t));
    head.forEach((c) => L.h("th", { scope: "col" }, tr, c));
    const tb = L.h("tbody", {}, t);
    const fill = () => rows.forEach((r) => { const row = L.h("tr", {}, tb); r.forEach((c) => L.h("td", {}, row, c)); });
    const card = parent.closest(".panel");
    if (!card) {
      // Outside a card, the table sits under a disclosure whose label says what pressing it will do.
      fill();
      const d = L.h("details", { class: "tv" }, parent);
      const sum = L.h("summary", {}, d, "Show the numbers");
      d.appendChild(block);
      const close = L.h("button", { class: "btn back", type: "button" }, d, "Close the numbers");
      close.addEventListener("click", () => { d.open = false; });
      d.addEventListener("toggle", () => { sum.textContent = d.open ? "Hide the numbers" : "Show the numbers"; });
      return d;
    }
    const F = L.faces(card);
    if (!tkeys.has(parent)) tkeys.set(parent, "t" + ++tseq);
    block.dataset.for = tkeys.get(parent);
    // A card's rows wait in a hidden face, and they were most of the page's nodes, so they are built when that face opens.
    if (F.fNum.hidden) block._fill = fill; else fill();
    const old = F.fNum.querySelector(`[data-for="${block.dataset.for}"]`);
    if (old) old.replaceWith(block);
    else F.fNum.insertBefore(block, F.numBack);
    return block;
  };

  // A crosshair over an x-indexed chart: snaps to the nearest index and lists every series there.
  L.crosshair = (svgEl, { x0, x1, y0, y1, n, xAt, onIndex }) => {
    const hit = L.svg("rect", { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0), fill: "transparent", tabindex: 0, "aria-label": "Chart readout; use the arrow keys" }, svgEl);
    // Hidden while idle: the charts draw with overflow visible, so a line parked off the plot would still show.
    const line = L.svg("line", { class: "xh", y1: y0, y2: y1, x1: x0, x2: x0, visibility: "hidden" }, svgEl);
    let idx = n - 1;
    const place = (i, evt) => {
      idx = Math.max(0, Math.min(n - 1, i));
      const x = xAt(idx);
      line.setAttribute("x1", x);
      line.setAttribute("x2", x);
      line.setAttribute("visibility", "visible");
      onIndex(idx, evt || { clientX: (svgEl.getBoundingClientRect().left || 0) + x, clientY: svgEl.getBoundingClientRect().top || 0 });
    };
    const fromEvt = (evt) => {
      const r = svgEl.getBoundingClientRect();
      const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
      const k = vb && r.width ? vb.width / r.width : 1;
      const px = (evt.clientX - r.left) * k;
      let best = 0, bd = Infinity;
      for (let i = 0; i < n; i++) {
        const d = Math.abs(xAt(i) - px);
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    };
    const clear = () => { line.setAttribute("visibility", "hidden"); L.tip.hide(); };
    hit.addEventListener("pointermove", (e) => place(fromEvt(e), e));
    hit.addEventListener("pointerenter", (e) => place(fromEvt(e), e));
    hit.addEventListener("pointerleave", clear);
    hit.addEventListener("focus", () => place(idx));
    hit.addEventListener("blur", clear);
    hit.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { place(idx - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { place(idx + 1); e.preventDefault(); }
    });
    return hit;
  };

  // Axes: hairline grid at y ticks, labels outside the plot.
  L.yGrid = (g, ticks, y, x0, x1, fmt) => {
    const grid = L.svg("g", { class: "grid" }, g);
    ticks.forEach((t) => {
      L.svg("line", { x1: x0, x2: x1, y1: y(t), y2: y(t) }, grid);
      L.text(g, x0 - 6, y(t) + 3.5, fmt(t), "end");
    });
  };

  // Entrances: a card unrolls top-down at 1.5 px per ms, then its children rise. Skipped under reduced motion.
  const afterIn = new WeakMap();
  const reveal = (node) => {
    if (node.classList.contains("in")) return;
    const hgt = node.offsetHeight || 300;
    const dur = Math.min(1200, Math.max(200, hgt / 1.5));
    node.style.setProperty("--unroll", dur + "ms");
    node.style.setProperty("--w", (node.offsetWidth || 900) + "px");
    [...node.children].forEach((c, i) => c.style.setProperty("--rise", dur + i * 70 + "ms"));
    node.classList.add("in");
    const cb = afterIn.get(node);
    if (cb) setTimeout(cb, dur);
  };
  // A scroll that jumps a card from below the window to above it never reports an intersection, so a cheap sweep on scroll
  // reveals anything already passed; the observer still handles the ordinary case.
  const pending = new Set();
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { pending.delete(e.target); reveal(e.target); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" }) : null;
  // Reading a position inside a skipped section forces its layout, so the sweep runs only after a jump the observer could
  // have missed, never on an ordinary scroll frame.
  let sweepQueued = false, sweptAt = 0;
  // Only plate boxes are read for a plate off screen: its contents are skipped, and reading a card inside would lay it out.
  // A plate wholly above the window shows its cards at once, with no entrance to watch; a plate on screen is already laid
  // out, so its cards are measured as before; a plate below waits.
  const sweep = () => {
    sweepQueued = false; sweptAt = L.scroller.scrollTop;
    const plates = new Map(), line = innerHeight * 0.94, passed = [];
    pending.forEach((n) => {
      const p = n.closest(".ml-plates");
      if (!p) { if (n.getBoundingClientRect().top < line) passed.push([n, true]); return; }
      if (!plates.has(p)) plates.set(p, p.getBoundingClientRect());
      const r = plates.get(p);
      if (r.bottom < 0) passed.push([n, false]);
      else if (r.top < innerHeight && n.getBoundingClientRect().top < line) passed.push([n, true]);
    });
    passed.forEach(([n, onScreen]) => {
      pending.delete(n); if (io) io.unobserve(n);
      if (onScreen) { reveal(n); return; }
      n.classList.add("in", "still");
      const cb = afterIn.get(n); if (cb) cb();
    });
  };
  L.scroller.addEventListener("scroll", () => { if (!sweepQueued && pending.size && Math.abs(L.scroller.scrollTop - sweptAt) > innerHeight * 0.8) { sweepQueued = true; setTimeout(sweep, 120); } }, { passive: true, signal: L.signal });
  L.signal?.addEventListener("abort", () => { if (io) io.disconnect(); pending.clear(); });
  L.watch = (node, cb) => {
    if (cb) afterIn.set(node, cb);
    if (L.reduced || !io) { node.classList.add("rv", "in", "still"); if (cb) cb(); return; }
    node.classList.add("rv");
    pending.add(node);
    io.observe(node);
  };

  // Looks: the three share every token name; the choice is kept under the same key the app uses.
  const LOOKS = ["washi", "sumi", "cosmos"];
  L.setLook = (look) => {
    root.dataset.look = look;
    try { localStorage.setItem("sphere-look", look); } catch (e) { /* storage blocked; the look still applies */ }
    document.querySelectorAll("[data-look-btn]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lookBtn === look)));
    document.dispatchEvent(new CustomEvent("lookchange"));
  };
  L.initLook = () => {
    if (EMBED) return;
    let look = new URLSearchParams(location.search).get("look");
    if (!LOOKS.includes(look)) { try { look = localStorage.getItem("sphere-look"); } catch (e) { look = null; } }
    L.setLook(LOOKS.includes(look) ? look : "cosmos");
  };
  L.setPaused = (p) => {
    L.paused = p;
    root.classList.toggle("paused", p);
    document.dispatchEvent(new CustomEvent("motionchange"));
  };

  /* The background scene, one per look, on a single 2D canvas (no WebGL context), capped at 30 frames a second. It draws a still
     composition when motion is paused or reduced and stops while the tab is hidden. Static layers (the notebook's ruling, the
     paper's fibers) are drawn once per size into an offscreen canvas. */
  L.sky = (() => {
    if (EMBED) return null;
    const cv = document.getElementById("sky");
    const ctx = cv && cv.getContext ? cv.getContext("2d") : null;
    if (!ctx) return { start() {} };
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0, look = "", scene = null;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const css = (n, f) => getComputedStyle(root).getPropertyValue(n).trim() || f;
    const offscreen = () => {
      const c = document.createElement("canvas");
      c.width = Math.max(1, W * dpr); c.height = Math.max(1, H * dpr);
      const x = c.getContext("2d");
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      return [c, x];
    };
    const ease = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

    // Cosmos: sparse stars that breathe, broken lapis arcs, and now and then a spark that runs an arc.
    const cosmos = () => {
      const m = Math.min(W, H);
      const stars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({ x: rnd(0, W), y: rnd(0, H), r: Math.random() < 0.08 ? rnd(1.1, 1.7) : rnd(0.35, 0.9), p: rnd(0, 6.28), s: rnd(0.3, 1.1) }));
      const arcs = Array.from({ length: 3 }, () => ({ cx: rnd(W * 0.15, W * 0.95), cy: rnd(H * 0.1, H * 0.9), r: rnd(m * 0.35, m * 0.75), a0: rnd(0, 6.28), len: rnd(0.7, 1.5) }));
      let sparks = [], t = 0;
      return {
        draw(dt) {
          t += dt;
          ctx.clearRect(0, 0, W, H);
          const lp = css("--lapis", "#7fa3bd");
          ctx.lineWidth = 1;
          for (const a of arcs) {
            ctx.strokeStyle = lp;
            ctx.globalAlpha = 0.16;
            for (const [f0, f1] of [[0, 0.28], [0.36, 0.62], [0.71, 1]]) { ctx.beginPath(); ctx.arc(a.cx, a.cy, a.r, a.a0 + a.len * f0, a.a0 + a.len * f1); ctx.stroke(); }
          }
          ctx.fillStyle = "#e8e1d3";
          for (const s of stars) {
            ctx.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(s.p + t * 0.001 * s.s));
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
          }
          if (dt) {
            sparks = sparks.filter((s) => t - s.t0 < s.dur);
            if (!sparks.length && Math.random() < 0.012) sparks.push({ arc: Math.floor(Math.random() * arcs.length), t0: t, dur: rnd(1600, 2600) });
          }
          for (const sp of sparks) {
            const a = arcs[sp.arc], k = (t - sp.t0) / sp.dur, ang = a.a0 + a.len * k, x = a.cx + a.r * Math.cos(ang), y = a.cy + a.r * Math.sin(ang);
            const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
            g.addColorStop(0, "rgba(255,241,194,.9)"); g.addColorStop(1, "rgba(255,241,194,0)");
            ctx.globalAlpha = Math.sin(Math.PI * k); ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.283); ctx.fill();
          }
          ctx.globalAlpha = 1;
        },
      };
    };

    // Sumi: an ink-stone notebook. Faint ruling and a brass margin line, and fine construction drawings (a ruled line with ticks,
    // a broken compass arc, a hatch) that sketch themselves in paper-white ink, hold, and fade; a brass spark sometimes runs a line.
    const sumi = () => {
      const ink = css("--ink", "#ece4d6"), brass = css("--brass", "#d6b062");
      const [rule, rx] = offscreen();
      rx.lineWidth = 1;
      rx.strokeStyle = ink; rx.globalAlpha = 0.032;
      for (let y = 30.5; y < H; y += 30) { rx.beginPath(); rx.moveTo(0, y); rx.lineTo(W, y); rx.stroke(); }
      rx.strokeStyle = brass; rx.globalAlpha = 0.08;
      rx.beginPath(); rx.moveTo(56.5, 0); rx.lineTo(56.5, H); rx.stroke();
      const wob = (s, seed) => Math.sin(s * 0.08 + seed) * 0.7 + Math.sin(s * 0.021 + seed * 2) * 1.1;
      const make = (settled) => {
        const x = rnd(W * 0.03, W * 0.97), y = rnd(H * 0.05, H * 0.95), a = (Math.round(rnd(0, 11)) * 15 * Math.PI) / 180, len = rnd(120, 280), seed = rnd(0, 50);
        const strokes = [{ kind: "rule", x, y, a, len, ticks: Math.max(4, Math.round(len / 16)) }];
        if (Math.random() < 0.8) strokes.push({ kind: "arc", x: x + Math.cos(a) * len, y: y + Math.sin(a) * len, r: rnd(36, 110), a0: rnd(0, 6.28), span: rnd(2.2, 4.4) });
        if (Math.random() < 0.6) strokes.push({ kind: "hatch", x: x + Math.cos(a) * len * 0.35 + rnd(-30, 30), y: y + Math.sin(a) * len * 0.35 + rnd(-30, 30), a: a + Math.PI / 2 + 0.5, n: Math.round(rnd(4, 8)) });
        const per = 1300, hold = rnd(4500, 7500);
        return { strokes, seed, per, draw: strokes.length * per, hold, fade: 2200, age: settled ? strokes.length * per + rnd(0, hold * 0.6) : 0, spark: Math.random() < 0.4 };
      };
      const items = Array.from({ length: L.reduced ? 3 : 2 }, () => make(true));
      let next = rnd(1500, 3000);
      const strokeAt = (s, p, seed) => {
        ctx.beginPath();
        if (s.kind === "rule") {
          const n = 40, px = -Math.sin(s.a), py = Math.cos(s.a);
          for (let i = 0; i <= n * p; i++) { const d = (i / n) * s.len, w = wob(d, seed); const X = s.x + Math.cos(s.a) * d + px * w, Y = s.y + Math.sin(s.a) * d + py * w; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
          ctx.stroke();
          for (let i = 0; i <= s.ticks * p; i++) {
            const d = (i / s.ticks) * s.len, tl = i % 5 === 0 ? 7 : 3.5, X = s.x + Math.cos(s.a) * d, Y = s.y + Math.sin(s.a) * d;
            ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + px * tl, Y + py * tl); ctx.stroke();
          }
        } else if (s.kind === "arc") {
          // broken: a gap near the middle of the sweep, so no ring closes
          const end = s.span * p, gap0 = s.span * 0.44, gap1 = s.span * 0.53, n = 48;
          let pen = false;
          for (let i = 0; i <= n; i++) {
            const f = (i / n) * end;
            if (f > gap0 && f < gap1) { pen = false; continue; }
            const r = s.r + wob(f * 60, seed) * 0.6, X = s.x + Math.cos(s.a0 + f) * r, Y = s.y + Math.sin(s.a0 + f) * r;
            pen ? ctx.lineTo(X, Y) : (ctx.moveTo(X, Y), (pen = true));
          }
          ctx.stroke();
        } else {
          for (let i = 0; i < s.n * p; i++) {
            const ox = s.x + Math.cos(s.a - Math.PI / 2) * i * 6, oy = s.y + Math.sin(s.a - Math.PI / 2) * i * 6;
            ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(s.a) * 14, oy + Math.sin(s.a) * 14); ctx.stroke();
          }
        }
      };
      return {
        draw(dt) {
          ctx.clearRect(0, 0, W, H);
          ctx.globalAlpha = 1;
          ctx.drawImage(rule, 0, 0, W, H);
          if (dt) {
            next -= dt;
            if (next <= 0 && items.length < 4) { items.push(make(false)); next = rnd(2500, 5000); }
          }
          for (let k = items.length - 1; k >= 0; k--) {
            const it = items[k];
            it.age += dt;
            const life = it.draw + it.hold + it.fade;
            if (it.age > life) { items.splice(k, 1); continue; }
            const alpha = it.age > it.draw + it.hold ? 1 - (it.age - it.draw - it.hold) / it.fade : 1;
            ctx.strokeStyle = ink; ctx.lineWidth = 0.9; ctx.globalAlpha = 0.26 * alpha; ctx.lineCap = "round";
            it.strokes.forEach((s, i) => { const p = Math.min(1, Math.max(0, (it.age - i * it.per) / it.per)); if (p > 0) strokeAt(s, ease(p), it.seed); });
            if (it.spark && it.age > it.draw && it.age < it.draw + 1100) {
              const s = it.strokes[0], k2 = (it.age - it.draw) / 1100, d = s.len * k2, X = s.x + Math.cos(s.a) * d, Y = s.y + Math.sin(s.a) * d;
              const g = ctx.createRadialGradient(X, Y, 0, X, Y, 12);
              g.addColorStop(0, brass); g.addColorStop(1, "rgba(0,0,0,0)");
              ctx.globalAlpha = Math.sin(Math.PI * k2) * 0.9; ctx.fillStyle = g;
              ctx.beginPath(); ctx.arc(X, Y, 12, 0, 6.283); ctx.fill();
            }
          }
          ctx.globalAlpha = 1;
        },
      };
    };

    // Washi, as the design system names it: wisps, ink blooms, and paper fibers, with life coming from current. Brushed wisps drift
    // on a slow wind, ions ride the air between them, ink blooms and dries, and now and then a particle's track or a gold seam.
    const washi = () => {
      const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
      const ink = css("--ink", "#171615"), faint = css("--faint", "#5f574d"), brass = css("--brass", "#c5a059"), cin = css("--crit", "#c84b29"), lapis = css("--lapis", "#2b4657");
      const [paper, px] = offscreen();
      for (let i = 0, n = Math.round((W * H) / 5200); i < n; i++) { const x = rnd(0, W), y = rnd(0, H), a = rnd(0, 6.28), l = rnd(12, 70), c = rnd(-0.7, 0.7), light = Math.random() < 0.22; px.strokeStyle = light ? "#ffffff" : faint; px.globalAlpha = light ? rnd(0.3, 0.55) : rnd(0.035, 0.085); px.lineWidth = rnd(0.35, 1.05); px.beginPath(); px.moveTo(x, y); px.quadraticCurveTo(x + Math.cos(a + c) * l * 0.5, y + Math.sin(a + c) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); px.stroke(); }
      let t = 0;
      // Wisps are filled bands drawn at a quarter of the canvas size and scaled up, which softens their edges without a blur filter;
      // each band is one filled outline, since overlapping strokes would bead where their caps meet.
      const QS = 4, cw = Math.max(1, Math.ceil(W / QS)), chh = Math.max(1, Math.ceil(H / QS)), wc = document.createElement("canvas");
      wc.width = cw; wc.height = chh;
      const wx = wc.getContext("2d");
      const mkWisp = (x) => ({ x: x == null ? rnd(-0.3 * W, W) : x, y: rnd(H * 0.05, H * 0.95), len: rnd(W * 0.26, W * 0.55), amp: rnd(12, 40), freq: rnd(1.1, 2.4), tilt: rnd(-0.1, 0.1), wmax: rnd(14, 40), v: rnd(0.004, 0.01), ph: rnd(0, 6.28), sp: rnd(0.00008, 0.0002), tint: Math.random() < 0.7 ? lapis : ink, a: rnd(0.06, 0.1) });
      const wisps = Array.from({ length: Math.max(4, Math.round(W / 260)) }, () => mkWisp());
      const band = (w, scale, alpha) => {
        const N = 40, pts = [];
        for (let i = 0; i <= N; i++) { const u = i / N; pts.push([w.x + (u - 0.5) * w.len, w.y + Math.sin(u * Math.PI * w.freq + w.ph + t * w.sp) * w.amp + (u - 0.5) * w.len * w.tilt, Math.pow(Math.sin(Math.PI * u), 0.85) * w.wmax * scale * (0.85 + 0.15 * Math.sin(t * w.sp * 2 + u * 5))]); }
        const left = [], right = [];
        pts.forEach(([x, y, wd], i) => { const [ax, ay] = pts[Math.max(0, i - 1)], [bx, by] = pts[Math.min(N, i + 1)], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l; left.push([(x + (nx * wd) / 2) / QS, (y + (ny * wd) / 2) / QS]); right.push([(x - (nx * wd) / 2) / QS, (y - (ny * wd) / 2) / QS]); });
        wx.beginPath(); wx.moveTo(left[0][0], left[0][1]);
        left.forEach(([x, y]) => wx.lineTo(x, y));
        for (let i = right.length - 1; i >= 0; i--) wx.lineTo(right[i][0], right[i][1]);
        wx.closePath(); wx.globalAlpha = alpha; wx.fillStyle = w.tint; wx.fill();
      };
      const drawWisps = () => { wx.clearRect(0, 0, cw, chh); for (const w of wisps) { band(w, 2.4, w.a * 0.3); band(w, 1, w.a); } };
      // Ink blooms where a drop lands and dries away, now and then cinnabar.
      const mkBloom = (settled) => ({ x: rnd(W * 0.03, W * 0.97), y: rnd(H * 0.05, H * 0.95), R: rnd(40, 120), grow: rnd(6000, 9000), hold: rnd(3000, 5000), fade: rnd(5000, 7000), col: Math.random() < 0.17 ? cin : ink, k: [rnd(0, 6.28), rnd(0, 6.28), rnd(0, 6.28)], amp: rnd(0.08, 0.18), age: settled ? rnd(6000, 9000) : 0 });
      const blooms = [mkBloom(true)];
      let nextBloom = rnd(6000, 10000);
      const bloomPath = (b, e) => { ctx.beginPath(); for (let i = 0; i <= 64; i++) { const th = (i / 64) * 6.283, r = b.R * e * (1 + b.amp * (Math.sin(3 * th + b.k[0]) * 0.5 + Math.sin(5 * th + b.k[1]) * 0.3 + Math.sin(7 * th + b.k[2]) * 0.2)), X = b.x + Math.cos(th) * r, Y = b.y + Math.sin(th) * r; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.closePath(); };
      // Ions ride a wind field that swirls slowly; most are ink, some brass, a few cinnabar, and a track's start sheds a short burst.
      const ion = (x, y, vx, vy, life) => ({ x, y, vx: vx || 0, vy: vy || 0, r: rnd(0.7, 1.7), q: Math.random() < 0.07 ? 2 : Math.random() < 0.17 ? 1 : 0, life: life || 0, age: 0 });
      const ions = Array.from({ length: Math.round((W * H) / 8000) }, () => ion(rnd(0, W), rnd(0, H)));
      const wind = (x, y) => Math.sin(x * 0.0019 + t * 0.00006) * 1.3 + Math.cos(y * 0.0024 - t * 0.00004) * 1.1 + 0.4, S = 0.014;
      // A particle's track through the vapor: an alpha's short straight stroke or a beta's tightening spiral, drawn fast, then condensing.
      const mkTrack = (settled) => {
        const kind = Math.random() < 0.45 ? "alpha" : "beta", pts = [];
        let x = rnd(W * 0.05, W * 0.95), y = rnd(H * 0.08, H * 0.92), a = rnd(0, 6.28);
        if (kind === "alpha") { const len = rnd(70, 150); for (let i = 0; i <= 16; i++) pts.push([x + (Math.cos(a) * len * i) / 16 + rnd(-0.6, 0.6), y + (Math.sin(a) * len * i) / 16 + rnd(-0.6, 0.6)]); }
        else { const k = rnd(0.002, 0.006) * (Math.random() < 0.5 ? -1 : 1), stepL = rnd(2.4, 4); for (let i = 0; i <= 90; i++) { pts.push([x, y]); a += k * stepL * (1 + (i / 90) * 3); x += Math.cos(a) * stepL; y += Math.sin(a) * stepL; } }
        const col = Math.random() < 0.12 ? cin : Math.random() < 0.35 ? lapis : ink, draw = kind === "alpha" ? 240 : 700, hold = rnd(800, 1400), fade = rnd(3000, 5200);
        return { kind, pts, col, w: kind === "alpha" ? 2.2 : 1, core: kind === "alpha" ? 0.38 : 0.32, draw, hold, fade, age: settled ? draw + hold + rnd(0, fade * 0.5) : 0, shed: settled };
      };
      const tracks = [mkTrack(true)];
      let nextTrack = rnd(3000, 6000);
      // Gold seams stay, one at a time and rare, so the kintsugi reads as an event among the particles.
      const mkSeam = (settled) => { const pts = [[rnd(W * 0.08, W * 0.92), rnd(H * 0.1, H * 0.9)]]; let a = rnd(0, 6.28); for (let i = 0, segs = Math.round(rnd(9, 15)); i < segs; i++) { a += rnd(-0.65, 0.65); const l = rnd(16, 42), [qx, qy] = pts[pts.length - 1]; pts.push([qx + Math.cos(a) * l, qy + Math.sin(a) * l]); } let total = 0; const cum = [0]; for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(total); } return { pts, cum, total, draw: 2600, hold: 5200, fade: 2600, age: settled ? rnd(2600, 7800) : 0 }; };
      const seams = [mkSeam(true)];
      let nextSeam = rnd(9000, 16000);
      const stroke = (pts, n, frac) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (frac > 0 && n < pts.length) { const a0 = pts[n - 1], a1 = pts[n]; ctx.lineTo(a0[0] + (a1[0] - a0[0]) * frac, a0[1] + (a1[1] - a0[1]) * frac); } ctx.stroke(); };
      return { draw(dt) {
        t += dt;
        ctx.clearRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.drawImage(paper, 0, 0, W, H);
        for (let k = wisps.length - 1; k >= 0; k--) { const w = wisps[k]; w.x += w.v * dt; if (w.x - w.len * 0.55 > W) wisps[k] = mkWisp(-w.len * 0.55); }
        drawWisps();
        ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true; ctx.drawImage(wc, 0, 0, W, H);
        if (dt) {
          nextTrack -= dt; nextSeam -= dt; nextBloom -= dt;
          if (nextTrack <= 0 && tracks.length < 3) { tracks.push(mkTrack(false)); nextTrack = rnd(4000, 8000); }
          if (nextSeam <= 0 && seams.length < 2) { seams.push(mkSeam(false)); nextSeam = rnd(9000, 16000); }
          if (nextBloom <= 0 && blooms.length < 2) { blooms.push(mkBloom(false)); nextBloom = rnd(8000, 13000); }
        }
        for (let k = blooms.length - 1; k >= 0; k--) { const b = blooms[k]; b.age += dt; if (b.age > b.grow + b.hold + b.fade) { blooms.splice(k, 1); continue; } const e = ease(b.age / b.grow), fade = b.age > b.grow + b.hold ? 1 - (b.age - b.grow - b.hold) / b.fade : 1, g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.R * e * 1.15 + 1); g.addColorStop(0, b.col); g.addColorStop(0.7, b.col); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.globalAlpha = 0.05 * fade; bloomPath(b, e); ctx.fill(); ctx.strokeStyle = b.col; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.065 * fade; bloomPath(b, e); ctx.stroke(); }
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        for (let k = tracks.length - 1; k >= 0; k--) {
          const tr = tracks[k]; tr.age += dt;
          if (tr.age > tr.draw + tr.hold + tr.fade) { tracks.splice(k, 1); continue; }
          if (!tr.shed && tr.kind === "alpha") { tr.shed = true; const [sx, sy] = tr.pts[0]; for (let i = 0; i < 8; i++) { const a = rnd(0, 6.28), sp = rnd(0.02, 0.06); ions.push(ion(sx, sy, Math.cos(a) * sp, Math.sin(a) * sp, rnd(900, 1800))); } }
          const reach = ease(tr.age / tr.draw) * (tr.pts.length - 1), n = Math.min(tr.pts.length - 1, Math.floor(reach)) + 1, frac = reach - Math.floor(reach);
          const cond = clamp((tr.age - tr.draw) / tr.hold, 0, 1), fade = tr.age > tr.draw + tr.hold ? 1 - (tr.age - tr.draw - tr.hold) / tr.fade : 1;
          ctx.strokeStyle = tr.col;
          ctx.globalAlpha = 0.07 * fade * (0.4 + cond); ctx.lineWidth = tr.w * (4 + 4 * cond); stroke(tr.pts, n, frac);
          ctx.globalAlpha = tr.core * fade; ctx.lineWidth = tr.w * (1 + 0.8 * cond); stroke(tr.pts, n, frac);
        }
        for (let k = ions.length - 1; k >= 0; k--) {
          const p = ions[k];
          if (dt) {
            const a = wind(p.x, p.y), m = Math.min(1, dt * 0.002);
            p.vx += (Math.cos(a) * S - p.vx) * m + rnd(-1, 1) * 0.0006 * dt; p.vy += (Math.sin(a) * S * 0.6 - p.vy) * m + rnd(-1, 1) * 0.0006 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.life) { p.age += dt; if (p.age > p.life) { ions.splice(k, 1); continue; } }
            else { if (p.x > W + 10) p.x = -10; else if (p.x < -10) p.x = W + 10; if (p.y > H + 10) p.y = -10; else if (p.y < -10) p.y = H + 10; }
          }
          const life = p.life ? 1 - p.age / p.life : 1, col = p.q === 2 ? cin : p.q === 1 ? brass : ink;
          ctx.strokeStyle = col; ctx.lineWidth = p.r * 0.8; ctx.globalAlpha = 0.1 * life;
          ctx.beginPath(); ctx.moveTo(p.x - p.vx * 90, p.y - p.vy * 90); ctx.lineTo(p.x, p.y); ctx.stroke();
          if (p.q) { const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.globalAlpha = 0.16 * life; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.283); ctx.fill(); }
          ctx.globalAlpha = (p.q === 2 ? 0.55 : p.q === 1 ? 0.7 : 0.24) * life; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        }
        for (let k = seams.length - 1; k >= 0; k--) { const s = seams[k]; s.age += dt; if (s.age > s.draw + s.hold + s.fade) { seams.splice(k, 1); continue; } const reach = s.total * ease(s.age / s.draw), fade = s.age > s.draw + s.hold ? 1 - (s.age - s.draw - s.hold) / s.fade : 1; ctx.save(); ctx.strokeStyle = brass; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.9 * fade; ctx.shadowColor = brass; ctx.shadowBlur = 8; ctx.beginPath(); ctx.moveTo(s.pts[0][0], s.pts[0][1]); for (let i = 1; i < s.pts.length; i++) { if (s.cum[i] <= reach) ctx.lineTo(s.pts[i][0], s.pts[i][1]); else { const f = (reach - s.cum[i - 1]) / (s.cum[i] - s.cum[i - 1]); ctx.lineTo(s.pts[i - 1][0] + (s.pts[i][0] - s.pts[i - 1][0]) * f, s.pts[i - 1][1] + (s.pts[i][1] - s.pts[i - 1][1]) * f); break; } } ctx.stroke(); ctx.restore(); }
        ctx.globalAlpha = 1;
      } };
    };
    const build = () => { look = root.dataset.look; scene = ({ cosmos, sumi, washi }[look] || cosmos)(); };
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };
    const frame = (now) => {
      raf = 0;
      if (root.dataset.look !== look) build();
      const still = L.paused || document.hidden;
      if (still) { scene.draw(0); last = 0; return; }
      if (last && now - last < 33) { raf = requestAnimationFrame(frame); return; }
      const dt = last ? Math.min(100, now - last) : 16;
      last = now;
      scene.draw(dt);
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
    let rt = 0;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); start(); }, 150); });
    document.addEventListener("visibilitychange", start);
    document.addEventListener("lookchange", start);
    document.addEventListener("motionchange", start);
    size();
    return { start };
  })();

  window.L = L;
})();
