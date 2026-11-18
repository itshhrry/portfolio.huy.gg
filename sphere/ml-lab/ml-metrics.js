/* How well each sorter sorts: a confusion matrix for every classifier on the page, with precision, recall, and F1 in
   plain words beside the base rate, then the data checks and whether each one is material to a finding. Filled from
   metrics_data.js, written by the nightly build's metrics.py, which counts the typed source alone. */
"use strict";
(() => {
  const MT = window.ML_METRICS, F = K.fmt, { h } = L;
  const host = document.getElementById("metrics-cards"), checks = document.getElementById("metrics-checks");
  if (!MT || !host) return;
  const pct = (v, d = 1) => (v == null ? "n/a" : F.pct(v, d)), int = F.int;

  // One 2x2 card: rows are what happened, columns what the sorter said, each cell shaded by its share of the row.
  const card = (title, sub, m, yes, no, said, notSaid, words) => {
    const c = h("div", { class: "cmx rvx" }, host);
    h("div", { class: "cmt" }, c, title);
    L.rich(h("div", { class: "cms" }, c), sub);
    const g = h("div", { class: "cmg" }, c);
    h("span", {}, g, "");
    h("span", { class: "cmh" }, g, said);
    h("span", { class: "cmh" }, g, notSaid);
    [[yes, m.tp, m.fn, "hit", "miss"], [no, m.fp, m.tn, "false", "right"]].forEach(([lab, a, b, ka, kb]) => {
      const row = a + b || 1;
      h("span", { class: "cmr" }, g, lab);
      h("span", { class: `cmc ${ka}`, style: `--w:${(a / row).toFixed(3)}` }, g, int(a));
      h("span", { class: `cmc ${kb}`, style: `--w:${(b / row).toFixed(3)}` }, g, int(b));
    });
    const ul = h("ul", { class: "cml" }, c);
    words.forEach((w) => L.rich(h("li", {}, ul), w));
  };

  const N = MT.next_prompt, nm = { swear: "a swear", friction: "friction", praise: "praise" };
  ["swear", "friction", "praise"].forEach((k) => {
    const t = N[k], m = t.top_tenth;
    card(`The next prompt: ${nm[k]}`, `The forest's likeliest tenth, ${int(m.tp + m.fp)} of ${int(m.n)} held-out prompts, flagged`, m, `carried ${nm[k]}`, "did not", "flagged", "not flagged", [
      `<b>Precision ${pct(m.precision)}</b>: of the prompts it flagged, this share carried ${nm[k]}, against <b>${pct(m.base, 2)}</b> for any prompt.`,
      `<b>Recall ${pct(m.recall, 0)}</b>: of the ${int(t.positives)} prompts that carried it, this share were flagged.`,
      `<b>F1 ${m.f1.toFixed(2)}</b>, the balance of the two; the best any threshold reaches on these rows is ${t.best.f1.toFixed(2)}, an optimistic ceiling chosen after seeing them.`,
      k === "praise" ? "Its precision sits below the base rate: flagging praise does worse than flagging prompts at random." : `What drives it: ${K.name(t.drivers[0][0])} first.${MT.drivers_dropped[k] ? ` Without it the AUC falls from ${MT.drivers_dropped[k].auc.all.toFixed(3)} to ${Object.values(MT.drivers_dropped[k].auc)[1].toFixed(3)}.` : ""}`,
    ]);
  });
  const B = MT.busy_hour, bm = B.rule;
  card("ELLIE's busy next hour", `The rule calls the next hour busy when this hour's CPU is above ${B.threshold}%, over ${bm.n} held-out hours`, bm, "was busy", "was not", "called busy", "called quiet", [
    `<b>Precision ${pct(bm.precision, 0)}</b>: of the hours it called busy, this share were.`,
    `<b>Recall ${pct(bm.recall, 0)}</b>: of the busy hours, this share it called.`,
    `Scored on the final week of ELLIE's hourly rollups, ${bm.n} hours${B.positives != null ? ` of which ${B.positives} ran busy` : ""}, the same week Plate X's forest was tested on.`,
    `<b>F1 ${bm.f1.toFixed(2)}</b>. Accuracy ${pct(bm.accuracy, 0)}, where always saying "quiet" scores ${pct(1 - bm.base, 0)}. On a rare class, saying no every time already scores high, so precision and recall lead.`,
  ]);
  const Dy = MT.days, dc = Dy.confusion;
  card("Build days, the tree against the lab", "The grouping tree's kinds checked against the data lab's k-means as the reference", { tp: dc[1][1], fn: dc[0][1], fp: dc[1][0], tn: dc[0][0] }, "lab: build", "lab: quiet", "tree: build", "tree: quiet", [
    `<b>Precision ${pct(Dy.build.precision, 0)}</b> and <b>recall ${pct(Dy.build.recall, 0)}</b> for build days; <b>F1 ${Dy.build.f1.toFixed(2)}</b>.`,
    `The two methods agree on ${pct(Dy.accuracy, 0)} of the ${dc.flat().reduce((a, b) => a + b, 0)} days. Agreement says the grouping comes back under a second method. Neither method has an answer key to say the grouping is right.`,
  ]);

  // A plain-words card on reading the matrices, set in the grid's open cell beside the two single cards.
  const hw = h("div", { class: "cmx how rvx" }, host);
  h("div", { class: "cmt" }, hw, "Reading a confusion matrix");
  const hl = h("ul", { class: "cml" }, hw);
  ["Down the side is what happened; across the top is what the model said.",
    "Green cells are where the two agree; warm cells are its two kinds of mistake: a miss, and a false alarm.",
    "<b>Precision</b> asks: when it raised a flag, how often was it right?",
    "<b>Recall</b> asks: of everything it should have flagged, how much did it catch?",
    "<b>F1</b> balances the two on a 0 to 1 scale; each figure reads only against the base rate: how often a swear, friction, praise, or a busy hour happens at all."].forEach((w) => L.rich(h("li", {}, hl), w));

  // The four hour states: a 4x4 grid, the tree's states down, the lab's across, with each state's F1.
  const St = MT.states, S = K.STATES;
  const c4 = h("div", { class: "cmx wide rvx" }, host);
  h("div", { class: "cmt" }, c4, "The four hour states, the tree against the lab");
  L.rich(h("div", { class: "cms" }, c4), `Rows are the tree's states, columns the lab's; the diagonal is where they agree, <b>${pct(St.accuracy)}</b> of the hours, with a macro F1 of <b>${St.macro_f1.toFixed(2)}</b> across the four.`);
  const g4 = h("div", { class: "cmg four" }, c4);
  h("span", {}, g4, "");
  S.forEach((st) => h("span", { class: "cmh" }, g4, st.short));
  h("span", { class: "cmh" }, g4, "F1");
  St.confusion.forEach((row, i) => {
    const tot = row.reduce((a, b) => a + b, 0) || 1;
    h("span", { class: "cmr" }, g4, S[i].short);
    row.forEach((v, j) => h("span", { class: `cmc ${i === j ? "hit" : v ? "false" : "zero"}`, style: `--w:${(v / tot).toFixed(3)}` }, g4, int(v)));
    h("span", { class: "cmf" }, g4, St.per_state[i].f1.toFixed(2));
  });

  // Data checks: what each input table holds, and whether a flaw in it moves any finding on the page.
  if (checks) {
    const prodR2 = window.ML.scores.find((e) => e.target === "productivity" && e.lag).rf.r2;
    const I = MT.integrity, dl = I["daily.csv"], hr = I["hourly.csv"], ps = I.prompt_signals, cv = I.daily_vs_prompts;
    checks.replaceChildren();
    const loggedSleep = dl.rows - dl.nulls.sleep_h, BR = window.ML_BRIDGE, nights = BR ? (BR.need.sleep?.mood?.have ?? BR.need.links.mood.have) : loggedSleep - dl.sleep_dropped;
    [[dl.sleep_dropped * 2 > loggedSleep ? "crit" : "warn", `Sleep: ${dl.sleep_dropped * 2 > loggedSleep ? "more than half" : `${dl.sleep_dropped} of ${loggedSleep}`} of the logged values are impossible nights`, `In daily.csv, ${dl.sleep_dropped} of ${loggedSleep} logged sleep values are under 2 hours or 14 hours and more, so they are dropped and the sleep findings rest on what remains. The high values, 14 to 24, read like a bedtime typed into the hours field; the wellness logger's input is what would settle it. <b>Material</b> to the sleep links: mood's link to sleep runs on ${nights} nights.`],
      dl.scores_outside_1_to_10 ? ["warn", `Productivity: ${dl.scores_outside_1_to_10} logged score${dl.scores_outside_1_to_10 > 1 ? "s" : ""} outside 1 to 10`, `${dl.scores_outside_1_to_10 > 1 ? `${dl.scores_outside_1_to_10} scores fall` : "One score falls"} outside 1 to 10, read here as a slip of the logger rather than a day. <b>Material</b> to the same-day finding: the forest's R² of ${prodR2.toFixed(2)} is fitted with ${dl.scores_outside_1_to_10 > 1 ? "them" : "it"} in, and the productivity label rests on an interval wide enough that one day can move it.`] : null,
      ["info", "The hourly table: not what the CPU forecasts read", `hourly.csv misses ${int(hr.missing_hours)} hours between ${hr.first.slice(0, 10)} and ${hr.last.slice(0, 10)}. The CPU forecasts read ELLIE's hourly rollups in sphere.db rather than this table, so a gap here does not reach them. Not material.`],
      ["info", "Prompts: the typed filter holds", `${int(ps.typed)} typed prompts in ${int(ps.sessions)} sessions; ${int(ps.rows_by_source["security-review"] || 0)} security-review and ${int(ps.rows_by_source.scripted || 0)} scripted rows stay out. ${ps.duplicate_ts_in_session} duplicate timestamps within a session, and ${ps.typed_in_run - ps.typed_now} prompts relabeled out of typed since the run. Not material.`],
      cv.days_differing ? ["warn", "The daily table and the prompts differ", `daily.csv's prompt count differs from the typed rows on ${cv.days_differing} of ${cv.days_compared} days, ${int(cv.total_daily)} prompts against ${int(cv.total_typed)}.`]
        : ["good", "The daily table agrees with the prompts", `daily.csv's prompt count matches the typed rows on all ${cv.days_compared} days compared, ${int(cv.total_typed)} prompts in both.`]].filter(Boolean).forEach(([cls, head, tx]) => {
      const c = h("div", { class: `lc ${cls} rvx` }, checks);
      h("span", {}, h("header", {}, c), head);
      L.rich(h("p", { class: "tx" }, c), tx);
    });
  }
  // The Numbers face: every matrix's four counts and its rates in one table.
  const row = (name, line, m, base) => [name, line, m.tp, m.fn, m.fp, m.tn, base == null ? "" : pct(base, 2), pct(m.precision), pct(m.recall), m.f1.toFixed(2)];
  K.set("metrics-meta", `Six sorters, each against what happened; held-out prompts and hours at the ${MT.snapshot} snapshot`);
  K.tables(host, [["Every sorter's counts and rates", ["Sorter", "Line", "Hits", "Misses", "False alarms", "Correct passes", "Base rate", "Precision", "Recall", "F1"], [
    ...["swear", "friction", "praise"].flatMap((k) => [["top_tenth", "likeliest tenth"], ["half", "rating of one half"], ["best", "best F1 on these rows"]].map(([key, line]) => row(`Next prompt: ${nm[k]}`, line, N[k][key], N[k].base))),
    row("ELLIE's busy next hour", `CPU above ${B.threshold}%`, bm, bm.base),
    row("Build days, the tree against the lab", "the lab as reference", { tp: dc[1][1], fn: dc[0][1], fp: dc[1][0], tn: dc[0][0], precision: Dy.build.precision, recall: Dy.build.recall, f1: Dy.build.f1 }, null),
  ]], ["The four hour states, the tree's (rows) against the lab's (columns)", ["Tree \\ lab", ...S.map((st) => st.short), "Precision", "Recall", "F1"],
    St.confusion.map((r, i) => [S[i].short, ...r, pct(St.per_state[i].precision), pct(St.per_state[i].recall), St.per_state[i].f1.toFixed(2)])]]);
  K.set("metrics-src", `Counted by <code>metrics.py</code> in the nightly ML build at the ${MT.snapshot} snapshot from the run's own held-out predictions; the busy-hour rule reads ELLIE's hourly CPU from sphere.db's hourly rollups. A threshold is named for every matrix, since precision and recall move with it.`);
})();
