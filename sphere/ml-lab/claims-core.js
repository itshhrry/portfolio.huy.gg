/* Copied from scripts/sphere/analysis/ml/claims-core.js by dev/sync-ml-lab.mjs; edit the original. */
// Chooses each finding's label and sentence from its figures, so the page's words follow its numbers. The same evaluator
// as claims.py: both answer claims_cases.json identically, so a threshold never means one thing in Python and another on
// the page. A band holds only when the whole interval clears its edges at the shown precision.
// A plain script rather than a module, so a page opened from disk can load it with a script tag; Node reaches it through
// claims.mjs.
(function (root, make) {
  const api = make();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Claims = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const MINUS = "−";
  const isNum = (x) => typeof x === "number" && Number.isFinite(x);
  const lit = (s) => (s === "null" ? null : s.trim() !== "" && !Number.isNaN(Number(s)) ? Number(s) : s);

  // A dotted path; [k=v,k2=v2] picks the array member whose keys match, [3] picks by position. Missing gives null.
  function resolve(snapshot, path) {
    let cur = snapshot;
    for (const seg of path.split(".")) {
      const [, key, sel] = /^([^[\]]*)((?:\[[^\]]*\])*)$/.exec(seg);
      if (key) cur = cur && typeof cur === "object" && !Array.isArray(cur) && key in cur ? cur[key] : null;
      for (const [, s] of sel.matchAll(/\[([^\]]*)\]/g)) {
        if (!Array.isArray(cur)) return null;
        if (/^\d+$/.test(s)) cur = Number(s) < cur.length ? cur[Number(s)] : null;
        else {
          const want = s.split(",").map((p) => { const i = p.indexOf("="); return [p.slice(0, i), lit(p.slice(i + 1))]; });
          cur = cur.find((m) => m && typeof m === "object" && want.every(([k, v]) => (k in m ? m[k] : null) === v)) ?? null;
        }
      }
      if (cur === null || cur === undefined) return null;
    }
    return cur;
  }

  // A number, a [point, lo, hi] triple, or an object with mean, median, rate, or point plus lo and hi.
  function figure(raw) {
    if (isNum(raw)) return { point: raw, lo: null, hi: null };
    if (Array.isArray(raw) && raw.length === 3) return { point: raw[0], lo: raw[1], hi: raw[2] };
    if (raw && typeof raw === "object") {
      for (const k of ["mean", "median", "rate", "point"]) if (k in raw) return { point: raw[k], lo: raw.lo ?? null, hi: raw.hi ?? null };
    }
    return null;
  }

  function shift(fig, other, op) {
    if (!fig || !isNum(other) || (op === "over" && other === 0)) return null;
    const f = op === "minus" ? (x) => x - other : (x) => x / other;
    return Object.fromEntries(Object.entries(fig).map(([k, v]) => [k, isNum(v) ? f(v) : v]));
  }

  // Rounds the way the page's own formatter does: toFixed on the exact stored value, halves away from zero. Multiplying
  // first would round 0.495, stored just under, up to 0.50 beside a page that prints 0.49.
  const scaled = (x, form) => (form === "percent" || form === "points" ? x * 100 : x);
  // The figure as the page shows it, back in its own units, so a band compares exactly what a reader sees.
  const shown = (x, form, precision) => { const v = Number(scaled(x, form).toFixed(precision)); return form === "percent" || form === "points" ? v / 100 : v; };

  function sign(v, precision) {
    const s = Math.abs(v).toFixed(precision);
    return v < 0 && Number(s) !== 0 ? MINUS + s : s;
  }

  function fmt(x, form, precision) {
    if (form === "count") {
      if (x < 0) throw new Error("negative count");
      return Number(x.toFixed(0)).toLocaleString("en-US");
    }
    if (form === "percent" && x > 1) throw new Error("percentage above 100");
    return sign(scaled(x, form), precision) + (form === "percent" ? "%" : "");
  }

  function fill(sentence, slots) {
    return sentence.replace(/\{(\w+)\}/g, (_, k) => {
      if (!(k in slots)) throw new Error(`unknown placeholder ${k}`);
      return slots[k];
    });
  }

  // The band, label, sentence, reason, and section for one figure. values maps a placeholder to {value, format}.
  function judgeFigure(entry, fig, n = null, values = null) {
    const p = entry.precision, form = entry.format;
    const minN = entry.min_n ?? null;
    const slots = { min_n: minN !== null ? String(minN) : "" };
    for (const [k, v] of Object.entries(values || {})) slots[k] = isNum(v.value) ? fmt(v.value, v.format || "number", p) : "";
    const out = (band, choice, reason) => {
      const section = entry.section || {};
      return { id: entry.id ?? null, band, label: choice.label, sentence: fill(choice.sentence, slots), reason,
        section: choice.label in section ? section[choice.label] : section.default ?? null,
        tone: choice.tone ?? null, head: choice.head ? fill(choice.head, slots) : null };
    };
    const count = (x) => Math.trunc(x).toLocaleString("en-US");

    if (!fig || !isNum(fig.point)) {
      Object.assign(slots, { point: "", lo: "", hi: "", n: n !== null && n !== undefined ? String(n) : "", need: "" });
      return out("insufficient", entry.insufficient, "figure cannot be computed");
    }
    const both = isNum(fig.lo) && isNum(fig.hi);
    const point = fig.point, lo = both ? fig.lo : point, hi = both ? fig.hi : point;
    Object.assign(slots, { point: fmt(point, form, p), lo: fmt(lo, form, p), hi: fmt(hi, form, p), n: isNum(n) ? count(n) : "", need: "" });
    if (minN !== null && !isNum(n)) return out("insufficient", entry.insufficient, "n is missing");
    if (minN !== null && n < minN) {
      slots.need = count(minN - n);
      return out("insufficient", entry.insufficient, `n ${Math.trunc(n)} is under ${minN}`);
    }
    const rlo = shown(lo, form, p), rhi = shown(hi, form, p);
    for (const [i, b] of entry.bands.entries()) {
      if ((!("above" in b) || rlo > b.above) && (!("below" in b) || rhi < b.below)) return out(i, b, `${slots.lo} to ${slots.hi} lies inside band ${i}`);
    }
    return out("uncertain", entry.uncertain, `${slots.lo} to ${slots.hi} crosses a band edge`);
  }

  // judgeFigure on the figure, sample size, and named values the entry's paths reach in a snapshot.
  function judge(entry, snapshot) {
    let fig = figure(resolve(snapshot, entry.metric));
    for (const op of ["minus", "over"]) if (fig && entry[op]) fig = shift(fig, resolve(snapshot, entry[op]), op);
    const n = typeof entry.n === "string" ? resolve(snapshot, entry.n) : null;
    const values = Object.fromEntries(Object.entries(entry.values || {}).map(([k, v]) => [k, { value: resolve(snapshot, v.path), format: v.format || "number" }]));
    return judgeFigure(entry, fig, n, values);
  }

  return { resolve, figure, fmt, judgeFigure, judge };
});
