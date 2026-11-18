/* Every sentence on the page, filled from window.ML: the hero, the index of findings, each sheet's quick explanation and
   "How to read it", each section's evidence and verdict, what did not hold, and the method table. A rerun rewrites the
   copy with the charts, so no figure here is typed by hand. */
"use strict";
(() => {
  const M = window.ML, H = M.hours, Dd = M.days, Cp = M.cpu, Pm = M.prompts, A = M.atlas, S = K.STATES, F = K.fmt;
  const { h } = L;
  const pct = (v, d = 1) => F.pct(v, d), n2 = (v) => F.num(v, 2), int = F.int;
  const sc = (t, lag) => M.scores.find((e) => e.target === t && (lag ? e.lag : !e.lag));
  const tgt = (k) => Pm.targets.find((x) => x.name === k);
  const sit = (lab) => Pm.situations.find((x) => x.label === lab);
  const lift = (t) => t.deciles[9][1] / t.deciles[9][0] / t.rate_test;
  const agreeH = H.confusion.reduce((a, r, i) => a + r[i], 0);
  const agreeD = Dd.confusion.reduce((a, r, i) => a + r[i], 0);
  const span = (B, k) => B.heights[k - 2] - B.heights[k - 1];
  const day = (s) => F.day(s.slice(0, 10));
  const snap = L.date(M.snapshot.replace(" ", "T"));
  const swear = tgt("swear"), fric = tgt("friction"), praise = tgt("praise");
  const mood = sc("mood", true), moodN = sc("mood", false), energy = sc("energy", true), energyN = sc("energy", false), prod = sc("productivity", true);
  const r2s = [mood, moodN, energy, energyN].flatMap((e) => [e.rf.r2, e.ridge.r2]);
  const shareCC = M.lineage.share["Claude Code"];
  const parents = M.lineage.parents.slice().sort((a, b) => b[1] - a[1]), ptotal = M.lineage.n ?? parents.reduce((a, p) => a + p[1], 0);
  const kid = (par) => M.lineage.edges.filter((e) => e[0] === par).sort((a, b) => b[2] - a[2])[0];
  const kindsN = [Dd.kinds[0].n, Dd.kinds[1].n];
  const gainHolds = Cp.gain.lo > 0, gainLoses = Cp.gain.hi < 0;
  // The resample block and rep count ride with the gain; an older night without them used six-hour blocks.
  const blockH = Cp.gain.block_hours ?? 6, gainReps = Cp.gain.reps ?? 2000;
  // Four groups are called the longest-lasting cut only when the tree's merge heights say so.
  const spans = [3, 4, 5].map((k) => span(H, k)), fourLongest = spans[1] >= Math.max(spans[0], spans[2]);
  const LIN = M.lineage, linWindow = LIN.first && LIN.last ? `from ${day(LIN.first)} to ${day(LIN.last)}` : "over every logged start";
  const topOf = (q) => H.signals.map((nm, j) => [nm, K.med[q][j]]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
  const firstDay = A ? A.days[0] : Dd.day[0], lastDay = A ? A.days[A.days.length - 1] : Dd.day[Dd.n - 1];
  const set = K.set;
  K.facts = { agreeH, agreeD, lift, sc, tgt, sit, gainHolds, shareCC, parents, ptotal, kid, topOf, firstDay, lastDay, span, fourLongest, blockH, LIN, linWindow };

  const top = document.getElementById("top-date");
  if (top) top.textContent = `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][snap.getDay()]} • ${L.day(snap)} • ${snap.getFullYear()}`;
  set("lede", `Hierarchical grouping and random forests, run read-only on sphere.db at the ${L.when(snap)} snapshot: <b>${int(Pm.n)}</b> typed prompts in ${int(Pm.sessions)} sessions, the data lab's ${H.n} hours of telemetry, and ${Dd.n} waking days. Every figure on the page comes from that run, every plate has its numbers behind it, and each one opens a case study.`);

  // The header tiles: the four strongest findings, those that hold first, each with its finding's own sentence.
  const C = K.claim, noDot = (s) => s.replace(/\.$/, "");
  const facts = document.getElementById("facts");
  if (facts) {
    facts.replaceChildren();
    const afterF = sit("after a friction prompt");
    const TILES = [
      ["hour-states", "Hour states", String(S.length), `${agreeH} of ${H.n} hours land in the same state when the grouping tree and the lab's k-means each sort them. ${C("hour-states").sentence}`],
      ["swear-ahead", "Swear ranking", swear.auc_rf[0].toFixed(2), `${C("swear-ahead").sentence} Scored on the ${int(Pm.n_test)} prompts held out from ${day(Pm.test_from)} to ${day(Pm.last)}.`],
      ["lineage-share", "Process starts", pct(shareCC, 0), C("lineage-share").sentence],
      ["friction-runs", "Friction in runs", pct(afterF.friction[0], 0), C("friction-runs").sentence],
      ["mood-forecast", "Mood", F.r2(Math.max(mood.rf.r2, mood.ridge.r2)), `R² for the logged mood on ${mood.n} days, with yesterday's mood as an input. ${C("mood-forecast").sentence}`],
      ["cpu-next-hour", "ELLIE's next hour", `${n2(Cp.gain.mean)} pts`, C("cpu-next-hour").sentence],
    ];
    TILES.map((t, i) => [t, i]).sort(([a, i], [b, j]) => (K.holds(b[0]) - K.holds(a[0])) || i - j).slice(0, 4).forEach(([[, lab, big, sub]]) => {
      const t = h("div", { class: "tile" }, facts);
      h("div", { class: "lab" }, t, lab);
      h("div", { class: "big" }, t, big);
      h("div", { class: "sub" }, t, sub);
    });
  }

  // The index: one line per finding, its headline and badge from the registry and a link to its section.
  const ideas = document.getElementById("ideas");
  const both = (a, b, name) => (K.tone(a) === K.tone(b) ? `for ${name}` : `${name.split(" and ")[1]}: ${K.lower(C(b).label)}`);
  const IDEAS = [
    [C("hour-states").head, `The grouping tree, told nothing about the lab's states: adjusted Rand <b>${n2(H.byk[4].ari)}</b> against them, ${n2(H.boot.median)} against its own full-data grouping when whole days are resampled, and ${H.others && H.others.spectral ? n2(H.others.spectral.ari_lab) : "n/a"} for spectral clustering, which groups by a different rule.`, K.badge("hour-states"), "#states", "Four states"],
    [C("kinds-of-day-steady").head, `${kindsN[1]} build days and ${kindsN[0]} quiet days, agreeing with the lab on ${agreeD} of ${Dd.n}; resampled, the median adjusted Rand is ${n2(Dd.boot.median)}.`, K.badge("kinds-of-day-steady"), "#days", "Two kinds of day"],
    [C("lineage-share").head, `<b>${pct(shareCC)}</b> of process starts trace back to it; ${parents[0][0]} alone parented ${int(parents[0][1])} of the ${int(ptotal)}.`, K.badge("lineage-share", "from the data lab"), "#lineage", "Who starts ELLIE's processes"],
    [K.heads("mood-forecast", "energy-forecast"), `Forest and ridge R² run from ${F.r2(Math.min(...r2s))} to ${F.r2(Math.max(...r2s))}, against ${F.r2(mood.base.r2)} for guessing mood from the days before.`, K.badge("mood-forecast", both("mood-forecast", "energy-forecast", "mood and energy")), "#scores", "What a forest can know"],
    [C("productivity-forecast").head, `Forest R² <b>${F.r2(prod.rf.r2)}</b> against ${F.r2(prod.base.r2)} for guessing from the days before, led by ${K.name(prod.imp[0][0])}; ${prod.skill ? `its skill over that guess is ${n2(prod.skill[0])} of R² (${n2(prod.skill[1])} to ${n2(prod.skill[2])}), read from the same day rather than forecast ahead.` : `forecasting forward in time, the forest misses by ${n2(prod.forward.rf)} points and the guess by ${n2(prod.forward.base)}.`}`, K.badge("productivity-forecast"), "#scores", "What a forest can know"],
    [C("cpu-next-hour").head, C("cpu-next-hour").sentence, K.badge("cpu-next-hour"), "#cpu", "ELLIE's next hour"],
    [K.heads("swear-ahead", "praise-ahead"), `AUC <b>${swear.auc_rf[0].toFixed(2)}</b> for swears and ${fric.auc_rf[0].toFixed(2)} for any friction; praise scores ${praise.auc_rf[0].toFixed(2)}.`, K.badge("swear-ahead", `praise: ${K.lower(C("praise-ahead").label)}`), "#prompts", "The next prompt"],
    [C("friction-runs").head, C("friction-runs").sentence, K.badge("friction-runs", "within sessions"), "#patience-sec", "Patience"],
  ];
  if (ideas) {
    ideas.replaceChildren();
    IDEAS.forEach(([head, body, v, href, lab]) => {
      const li = h("li", {}, ideas), sp = h("span", {}, li);
      L.rich(sp, `<b>${head}</b> ${body}`);
      const meta = h("span", { class: "meta" }, li);
      K.vb(meta, v);
      h("a", { href }, meta, lab);
    });
  }

  /* ---------- The hours ---------- */
  set("states-claim", noDot(C("hour-states").head));
  set("tree-meta", `${H.n} hours from ${day(H.t[0])}, sixteen signals`);
  set("tree-desc", `A hierarchical grouping joins the two most alike hours, then the two most alike groups, until one tree holds all ${H.n}. ${fourLongest ? "Cut at the height where four groups last longest" : "Cut at four groups to match the lab, though another count lasts longer down the tree"}, it leaves four groups, and <b>${agreeH} of ${H.n}</b> hours land in the same state the lab's k-means gives them.`);
  set("tree-howto", "Read from the center out. The root sits in the middle and each leaf on the rim is one hour; two hours that join near the rim were alike from the start. Past the leaves, the first ring is the hour's state by the grouping tree, the second its state by the lab, and the sixteen thin rings are its signals, cool below usual and warm above, with the signals that best separate the states innermost. Point anywhere along a radius for that hour, and at a ring for that signal first. Click to keep the hour and its ring: the rest dims, and the panel below the color key reads it out. Press a state under the plate for that state's summary.");
  set("tree-src", `Data: the data lab's ${H.n} hours from ${day(H.t[0])}, each signal in median absolute deviations from its own median. Method: Ward linkage in scipy, cut at four groups.`);
  const dk = document.getElementById("tree-dkey");
  if (dk) { dk.replaceChildren(); h("span", {}, dk, "below usual"); h("span", { class: "bar" }, dk); h("span", {}, dk, "above usual"); }
  const shapes = S.map((st, q) => { const [nm, v] = topOf(q); return `${K.inline(st)} on ${nm} (${F.signed(v, 1)})`; });
  set("pc-desc", `The same ${H.n} hours, each a closed line through sixteen spokes, so a state reads as a shape. Each state reaches farthest on one signal: ${shapes.join(", ")}.`);
  set("pc-howto", "Each spoke is a signal, with usual on the solid ring and above usual farther out. Thin lines are single hours, bold lines each state's median. Drag along a spoke to keep only the hours inside the drag; a click on the spoke clears it. Flat unrolls the circle into parallel axes, with the first axis repeated at the right end so every line stays whole.");
  set("pc-src", "Axes grouped by the state that runs highest on them, then by η², the share of a signal's variation that lies between the states. Values beyond −4 and +6 sit at the edge.");
  const E = (M.web.edges || []).length;
  set("web-desc", `The ${H.n} hours run clockwise from ${day(H.t[0])}, each a spike as long as the hour sat far from a usual hour. Inside is the data lab's influence web: ${E} lagged links among the signals that held once each signal's daily rhythm and momentum were removed.`);
  set("web-howto", "A spike's color is the hour's state and its length the hour's distance from usual. Inside, each node is a signal, larger with more links. A warm link means two signals rise together, a cool one that they move opposite, and a dashed link with an arrow that one leads the other by an hour or more. Hover a node to isolate its links.");
  set("web-src", `Links: the data lab's exp11, ${M.web.tests ? `${int(M.web.tests)} ` : ""}lagged correlation tests at lags of 0 to 3 hours against 1,000 circular shifts, Benjamini-Hochberg q < 0.10.`);
  set("cascade-desc", "Each state as an orb sized by its hours, with a curve to every signal it moves by half a deviation or more. The inner orb is the part of the state's hours the lab placed there too.");
  set("cascade-howto", "Follow a curve from an orb to a signal. Solid means the state runs above usual on it and dashed below, and the thicker the curve, the larger the move; the dot and its figure give the state's median. Hover an orb or a signal to isolate its curves.");
  set("cascade-src", "Medians of the same deviations as Plate I.");
  const sp = spans;
  K.ev("states-ev", [
    `The grouping tree on the lab's ${H.n} hours and sixteen signals, cut at four groups, puts <b>${agreeH} of ${H.n}</b> hours in the lab's state (adjusted Rand <b>${n2(H.byk[4].ari)}</b>).`,
    `Resampled ${H.boot.reps} times, the four groups come back with a median adjusted Rand of <b>${n2(H.boot.median)}</b> against the full-data grouping, from ${n2(H.boot.lo)} to ${n2(H.boot.hi)}.`,
    `${fourLongest ? "Four groups last longest" : "Four groups do not last longest"} as the cut comes down the tree: the merge heights fall from ${n2(H.heights[2])} to ${n2(H.heights[3])}, a span of <b>${n2(sp[1])}</b>, against ${n2(sp[0])} for three groups and ${n2(sp[2])} for five.`,
    `The groups: ${S.map((st, q) => `${K.inline(st)}, ${K.counts[q]} hours`).join("; ")}.`,
    `Silhouette at four groups is ${n2(H.byk[4].sil)} and the tree's cophenetic correlation ${n2(H.coph)}: many hours sit near the border between two states.`,
    H.others ? `The grouping tree and k-means share a criterion, the spread inside each group, so a method with another one tests the states: spectral clustering agrees at <b>${n2(H.others.spectral.ari_lab)}</b>, while complete linkage (${n2(H.others["complete linkage"].ari_lab)}), average linkage (${n2(H.others["average linkage"].ari_lab)}), a Gaussian mixture (${n2(H.others["Gaussian mixture"].ari_lab)}), and HDBSCAN (${n2(H.others.HDBSCAN.ari_lab)}, calling ${H.others.HDBSCAN.noise} hours noise) split them differently.` : "",
  ]);
  K.anchor("states-anchor", K.badge("hour-states"), { head: "How far to trust a state", text: `An hour's state is firmest where the grouping tree and the lab's k-means agree, which they do for ${pct(agreeH / H.n, 0)} of hours; an hour where they part sits near a border.` });

  /* ---------- The days ---------- */
  set("days-claim", noDot(C("kinds-of-day-steady").head));
  set("spiral-meta", `${Dd.n} waking days, ${day(Dd.day[0])} to ${day(Dd.day[Dd.n - 1])}`);
  set("spiral-desc", `Every waking day with ten or more prompts, wound four weeks to a turn from ${day(Dd.day[0])} at the center outward. The grouping tree on each day's 24-hour shape and volume splits them into <b>${kindsN[1]} build days</b> and <b>${kindsN[0]} quiet days</b>; inside is the shape of each kind's day.`);
  set("spiral-howto", `Each dot is a day, larger with more prompts and colored by its kind. A ring marks a day the lab's k-means put in the other kind, and a small diamond one of the ${Dd.split.n} days a third cut splits off. The spokes line up the weekdays, weekends drawn darker. The rose in the middle runs around the day from 06:00 at the top.`);
  set("spiral-src", `Days run 06:00 to 06:00. Shape: each hour's share of the day's prompts, weighted so it carries ${pct(Dd.shape_share, 0)} of the variance the tree splits; volume: the log of the day's prompts.`);
  if (A) {
    set("score-desc", `Every calendar day from ${day(firstDay)} to ${day(lastDay)}, three ways. Above, the days are stretched by their share of the prompts and fan down onto the true calendar. Below the calendar hang each day's prompts by what they carried, then a row for every source Sphere records.`);
    const pulse = A.sources.find((x) => x.name === "Pulse"), pf = pulse ? pulse.counts.findIndex((v) => v > 0) : -1;
    set("score-howto", `Where the fan's lines bunch, little happened; where one spreads wide, that day held much of the work. A line's strength and width are its day's rank by prompts, so the busiest days stand out and a quiet one is faint. Point at a day to make it glow; click to keep it lit while the rest dim. A day's bar is its typed prompts: calm, with friction, and with praise. Each dot row is one source, sized against that source's own busiest day, so a row that starts late shows when the source joined${pf >= 0 ? `; Pulse, in the accent, joins on ${day(A.days[pf])}` : ""}.`);
    set("score-src", "Prompts: prompt_signals, typed source alone. Sources: rows per calendar day in host_samples (ELLIE, Pulse, the Pi, carbon, the router), phone_events, process_starts, endpoint_samples, lan_device_samples, task_runs, win_events, onepw_events, claude_limits, and wellness_days.");
  }
  K.ev("days-ev", [
    `The grouping tree splits ${Dd.n} waking days into <b>${kindsN[1]} build days</b> (median ${Dd.kinds[1].prompts} prompts) and <b>${kindsN[0]} quiet days</b> (median ${Dd.kinds[0].prompts}), agreeing with the lab's k-means on <b>${agreeD} of ${Dd.n}</b> days (adjusted Rand ${n2(Dd.byk[2].ari)}).`,
    `Across resamples, the border moves: a median adjusted Rand of ${n2(Dd.boot.median)}, from ${n2(Dd.boot.lo)} to ${n2(Dd.boot.hi)}. Silhouette at two kinds is ${n2(Dd.byk[2].sil)}.`,
    `On logged days, build days average productivity <b>${n2(Dd.kinds[1].productivity)}</b> against ${n2(Dd.kinds[0].productivity)}, energy ${n2(Dd.kinds[1].energy)} against ${n2(Dd.kinds[0].energy)}, and mood ${n2(Dd.kinds[1].mood)} against ${n2(Dd.kinds[0].mood)}.`,
    `A third cut splits ${Dd.split.n} days off the ${Dd.split.of ? "build" : "quiet"} days, with a median of ${Dd.split.prompts} prompts and average productivity ${n2(Dd.split.productivity)}.`,
  ]);
  const silGap = Dd.byk[5].sil - Dd.byk[2].sil;
  K.anchor("days-anchor", K.badge("kinds-of-day-steady"), { head: "How far to trust a kind", text: `Two kinds hold best for the days far from the border; the days near it change kind between resamples. Five kinds separate the days ${Math.abs(silGap) < 0.05 ? "about as well as" : silGap > 0 ? "better than" : "worse than"} two: silhouette ${n2(Dd.byk[5].sil)} at five against ${n2(Dd.byk[2].sil)} at two.` });
  set("days-note-tx", "Days here run 06:00 to 06:00, as in the data lab, so a session past midnight counts toward the day it belongs to. The atlas uses calendar days, because every source in it is recorded by calendar day.");

  /* ---------- Lineage ---------- */
  set("lineage-claim", noDot(C("lineage-share").head));
  set("lineage-desc", `ELLIE's process starts ${linWindow}, by the executable that started them (inner ring) and what each one started (outer ring). In the center, the share the data lab traced back to Claude Code through each start's whole chain of parents.`);
  set("lineage-howto", "Read around the circle. Each inner segment is a parent, as wide as its share of all starts; the outer segments are its children, cut from the same width. A child nearly as wide as its parent is most of what that parent ever started.");
  set("lineage-src", `The data lab's exp4b: each start matched to its parent by pid and start time${LIN.matched != null ? `, ${pct(LIN.matched)} matched` : ""}.`);
  const k0 = kid(parents[0][0]);
  K.ev("lineage-ev", [
    `${parents[0][0]} parented <b>${int(parents[0][1])}</b> starts, ${pct(parents[0][1] / ptotal)} of all, most often ${k0 ? `${k0[1]} (${int(k0[2])})` : "another shell"}.`,
    `${parents[1][0]} parented ${int(parents[1][1])}, and ${parents[2][0]} ${int(parents[2][1])}.`,
    `Traced through the whole chain, <b>${pct(shareCC)}</b> of starts descend from Claude Code.`,
  ]);
  K.anchor("lineage-anchor", K.badge("lineage-share", "from the data lab"));

  /* ---------- Scores ---------- */
  set("scores-claim", noDot(K.heads("productivity-forecast", "mood-forecast", "energy-forecast")));
  set("gauges-desc", `Random forests and ridge regression, each given the day's prompts, typing, commits, phone use, hours in Claude, and logged sleep, scored by R² on days they never saw. Sleep counts only nights of 2 to 14 hours. Zero is the held-out days' own average, which no forecast could know in advance; guessing each held-out day with the training days' average scores ${F.r2(mood.base.r2)} for mood, ${F.r2(energy.base.r2)} for energy, and ${F.r2(prod.base.r2)} for productivity.`);
  set("gauges-howto", "Each dial is one logged score, with zero, the held-out days' own average, at the top. A needle right of zero beats that average; left of it, in the warm wash, the model does worse than the average no forecast could know. The thick needle is the forest and the thin one ridge, each wedge spanning one spread either side across the cross-validation folds; the ring on the rim is the forest's out-of-bag score.");
  set("gauges-src", `${mood.n} logged days; five-fold cross-validation repeated ten times; sleep outside 2 to 14 hours dropped as no night. The skill interval resamples whole weeks.`);
  set("roses-desc", "What each score leans on: every input's permutation importance, measured on days the forest never saw. A longer petal means the forecast gets worse when that input is shuffled.");
  set("roses-howto", "A petal per input, in the same place on all three roses, so the roses compare. A cool stub means shuffling the input did not hurt the forecast. The four longest petals carry their names; hover any petal for its value.");
  set("roses-src", "Permutation importance, ten repeats on each of five held-out folds, averaged.");
  K.ev("scores-ev", [
    `Mood with yesterday's mood as an input: forest R² <b>${F.r2(mood.rf.r2)}</b>, ridge ${F.r2(mood.ridge.r2)}; guessing each held-out day with the training days' average misses by ${n2(mood.base.mae)} points, the forest by ${n2(mood.rf.mae)}.`,
    `Forecast forward in time, learning only from earlier days: mood's forest misses by ${n2(mood.forward.rf)} against the guess's ${n2(mood.forward.base)}, energy's by ${n2(energy.forward.rf)} against ${n2(energy.forward.base)}, and productivity's by ${n2(prod.forward.rf)} against ${n2(prod.forward.base)}.`,
    `Energy: forest R² ${F.r2(energy.rf.r2)}, ridge ${F.r2(energy.ridge.r2)}.`,
    `Productivity: forest R² ${F.r2(prod.rf.r2)} (out of bag ${F.r2(prod.rf.oob)}), ridge <b>${F.r2(prod.ridge.r2)}</b>; its strongest input is ${K.name(prod.imp[0][0])}.`,
    mood.imp[0][0] === "mood_prev" ? `Yesterday's mood is the strongest input to mood, and the forest ${mood.rf.r2 < mood.base.r2 ? "still loses to" : "beats"} guessing from the days before (${F.r2(mood.rf.r2)} against ${F.r2(mood.base.r2)}).` : `The strongest input to mood is ${K.name(mood.imp[0][0])}.`,
  ]);
  const shown = ["mood-forecast", "energy-forecast"].filter(K.holds).map((id) => id.split("-")[0]);
  K.anchor("scores-anchor", K.badge("mood-forecast", `mood: ${K.lower(C("mood-forecast").label)}; productivity: ${K.lower(C("productivity-forecast").label)}`), { head: "What it means for the scores", text: `${shown.length ? `The ${shown.join(" and ")} reading held and can be shown with its interval.` : "No mood or energy reading held, so none is shown as a forecast."} ${K.holds("productivity-forecast") ? "Productivity holds as a same-day reading of how much was typed, never as a forecast of the day ahead." : ""}`.trim() });

  /* ---------- CPU ---------- */
  set("cpu-claim", noDot(C("cpu-next-hour").head));
  set("orbits-meta", `${Cp.n_test} held-out hours, ${day(Cp.test_from)} to ${day(Cp.test_to)}`);
  set("orbits-desc", `A forest trained on the first ${Cp.n_train} hours forecasts ELLIE's CPU an hour ahead for the last ${Cp.n_test}, the final week. It misses by <b>${n2(Cp.mae.rf)}</b> points on an average hour; saying the next hour will match this one misses by ${n2(Cp.mae.persistence)}.`);
  set("orbits-howto", "Each ring is one held-out day, midnight at the top, running clockwise. ELLIE's CPU rides outside its ring in ink, farther out when busier; the chosen forecast rides beside it in color, and the shaded band between them is the miss. Switch forecasters above to compare their bands.");
  set("orbits-src", "ELLIE's hourly CPU from sphere.db's hourly rollups. Lags read the clock, and the same hour yesterday is 24 hours before the hour being forecast.");
  K.ev("cpu-ev", [
    `Mean error over ${Cp.n_test} held-out hours: forest <b>${n2(Cp.mae.rf)}</b>, no change ${n2(Cp.mae.persistence)}, ridge ${n2(Cp.mae.ridge)}, the same hour yesterday ${n2(Cp.mae.yesterday)}.`,
    `The forest's gain over no change is ${n2(Cp.gain.mean)} points, with a 95% interval from ${n2(Cp.gain.lo)} to ${n2(Cp.gain.hi)} by a paired ${blockH}-hour-block bootstrap of ${int(gainReps)} draws${gainHolds ? ": the forest is closer" : gainLoses ? ": the forest misses by more than no change" : ": the interval includes zero"}.`,
    `The forest leans on ${K.name(Cp.imp[0][0])} and ${K.name(Cp.imp[1][0])}; every other input adds little.`,
    Cp.mae.yesterday > Math.max(Cp.mae.rf, Cp.mae.persistence, Cp.mae.ridge) ? "The same hour yesterday is the worst guess: ELLIE's load follows sessions, and sessions keep no daily schedule." : "",
  ]);
  K.anchor("cpu-anchor", K.badge("cpu-next-hour"), { head: "What it means for Home", text: K.holds("cpu-next-hour") ? "The next hour's load can be read as a lean, with its interval beside it; the routine schedule stays exact on the Next list." : "The next hour's load is read no better from this forest than from the hour now, so Home shows none; the routine schedule stays exact on the Next list." });

  /* ---------- Prompts ---------- */
  set("prompts-claim", noDot(K.heads("swear-ahead", "praise-ahead")));
  set("brush-meta", `${int(Pm.n_test)} held-out prompts from ${day(Pm.test_from)}`);
  set("brush-desc", "A forest trained on the earlier days rates every later prompt's chance of carrying a swear, any friction, or praise from what came before it: the last prompts' signals, the wait, the place in the session, the hour, and the model.");
  set("brush-howto", "Every bristle is one held-out prompt, sorted clockwise from least to most likely and as long as the forest's chance; gold bristles did carry the signal. When the forest ranks well, the gold gathers at the end of the sweep. The figure at each tenth is that tenth's rate against the base rate. Switch the signal above and the bristles re-sort.");
  set("brush-src", `prompt_signals, typed source alone: ${int(Pm.n)} prompts in ${int(Pm.sessions)} sessions; trained before ${day(Pm.test_from)} and tested after; AUC intervals resample whole sessions.`);
  K.ev("prompts-ev", [
    `Swear: AUC <b>${swear.auc_rf[0].toFixed(2)}</b> (${swear.auc_rf[1].toFixed(2)} to ${swear.auc_rf[2].toFixed(2)}); the tenth the forest rates likeliest swears <b>${lift(swear).toFixed(1)} times</b> the held-out base rate of ${pct(swear.rate_test, 2)}.`,
    `Any friction: AUC ${fric.auc_rf[0].toFixed(2)} (${fric.auc_rf[1].toFixed(2)} to ${fric.auc_rf[2].toFixed(2)}); its likeliest tenth runs ${lift(fric).toFixed(1)} times the base rate.`,
    `Praise: AUC <b>${praise.auc_rf[0].toFixed(2)}</b> (${praise.auc_rf[1].toFixed(2)} to ${praise.auc_rf[2].toFixed(2)}), ${K.lower(C("praise-ahead").label)}.`,
    (() => {
      const gap = Math.max(...[swear, fric, praise].map((t) => Math.abs(t.auc_lr[0] - t.auc_rf[0])));
      const seen = [["swears", "swear-ahead"], ["friction", "friction-ahead"]].filter(([, id]) => K.holds(id)).map(([nm]) => nm);
      return `Logistic regression lands within ${n2(gap)} of the forest on all three${gap < 0.05 && seen.length ? `, so for ${seen.join(" and ")} the pattern is a simple one, carried by the prompts just before` : ""}.`;
    })(),
  ]);
  K.anchor("prompts-anchor", K.badge("swear-ahead", `friction: ${K.lower(C("friction-ahead").label)}; praise: ${K.lower(C("praise-ahead").label)}`), { head: "What it means for the aftershocks", text: `Friction clusters. ${C("friction-ahead").head}` });

  /* ---------- Patience ---------- */
  const quick = sit("under a minute"), late = sit("15 to 60 minutes");
  set("patience-claim", noDot(C("friction-runs").head) + (quick.friction[1] > late.friction[2] ? ", most often in quick replies" : ""));
  set("patience-desc", `Every week from ${day(firstDay)} to ${day(lastDay)} as a column: its sessions, its prompts that carried friction, a swear, or praise, and its days. Under the columns, each signal's share of the week's prompts, and the week's logged scores.`);
  set("patience-howto", "Read across like a score. In each column the hollow orb is the week's session-days and the filled orbs its friction, swears, and praise, each sized against its busiest week; the small bars are the week's days, weekends darker. Below, each line is one signal's share of the week's prompts, named where it peaks; the dashed lines at the foot are the logged scores.");
  set("patience-src", "prompt_signals, typed source alone; a prompt counts once for each signal it carries. Weeks run Monday to Sunday.");
  const fast = sit("under a minute"), slow = sit("15 to 60 minutes"), afterF = sit("after a friction prompt"), afterC = sit("after a calm prompt"), afterS = sit("after a swear"), afterP = sit("after praise");
  K.ev("patience-ev", [
    `After a friction prompt the next carries friction <b>${pct(afterF.friction[0])}</b> of the time; after a calm one, ${pct(afterC.friction[0])}. After a swear, the next swears ${pct(afterS.swear[0])}.`,
    `Replies sent under a minute after the last prompt carry friction <b>${pct(fast.friction[0])}</b>; after 15 to 60 minutes, ${pct(slow.friction[0])}.`,
    `After praise, the next prompt praises ${pct(afterP.praise[0])}, against ${pct(afterC.praise[0])} after a calm one.`,
  ]);
  K.anchor("patience-anchor", K.badge("friction-runs", "co-movement within sessions"), { head: "Reading it", text: "Read each week against its own session count: a week of few sessions swings its shares on a handful of prompts." });

  /* ---------- Readouts: the side column's plain-word panel under each plate's key ---------- */
  // Each panel answers what a reader without statistics training would ask first: what the groups are, what a word
  // means, or how to read the one number the plate leads with.
  const panel = (id, head, paras, rows) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.replaceChildren();
    h("div", { class: "rh" }, el, head);
    (rows || []).forEach(([shape, color, body]) => { const r = h("div", { class: "ri" }, el); r.appendChild(K.markSvg(shape, color)); L.rich(h("div", {}, r), body); });
    paras.forEach((p) => L.rich(h("p", {}, el), p));
  };
  const BR = window.ML_BRIDGE;
  panel("spiral-readout", "Two kinds of day, in plain words", [
    BR ? `Resampled, <b>${BR.days.kinds[1].core.n} of ${BR.days.kinds[1].core.n + BR.days.kinds[1].border.n}</b> build days keep their kind at least nine times in ten, against ${BR.days.kinds[0].core.n} of ${BR.days.kinds[0].core.n + BR.days.kinds[0].border.n} quiet days.${K.holds("build-days-keep") && BR.days.kinds[0].stability < 0.9 ? " A build day is a real pattern; a quiet day is best read as a day that was not a build day." : ""}` : "",
  ].filter(Boolean), [
    ["circle", K.KINDS[1].color, `<b>Build days</b>: ${Dd.kinds[1].n} days of heavy work with Claude, a median of ${Dd.kinds[1].prompts} prompts, with average productivity ${n2(Dd.kinds[1].productivity)} on the days you logged it.`],
    ["circle", K.KINDS[0].color, `<b>Quiet days</b>: ${Dd.kinds[0].n} days with a median of ${Dd.kinds[0].prompts} prompts, average productivity ${n2(Dd.kinds[0].productivity)}.`],
  ]);
  const PROG = { bash: "a command shell; Claude Code runs its commands through it", node: "the JavaScript engine Claude Code and many tools run on", claude: "Claude Code itself", git: "version control, which records changes to code",
    python: "the Python language, which runs scripts such as this lab's analysis", bun: "a fast JavaScript engine some tools use", powershell: "Windows' own command shell", pwsh: "Windows' own command shell, the newer edition",
    cmd: "Windows' older command prompt", conhost: "the Windows host that gives a command-line program its window", "other parents": "every other program, grouped together" };
  panel("lineage-readout", "The programs, in plain words", [`A <b>parent</b> is the program that started another one; tracing each start back through its parents is how ${pct(shareCC)} reach Claude Code.`],
    parents.slice(0, 9).map(([nm, c]) => { const d = nm.replace(/\.exe$/, ""); return [d, d.replace(/^python[\d.]+$/, "python"), c]; }).filter(([, k]) => PROG[k]).map(([d, k, c]) => ["square", "var(--faint)", `<b>${d}</b>, ${int(c)} starts: ${d === k ? PROG[k] : `${PROG[k]}, in its ${d.slice(k.length)} edition`}.`]));
  panel("gauges-readout", "Reading a dial", [K.PLAIN.r2,
    `Mood's forest scores ${F.r2(mood.rf.r2)}: its forecasts were ${mood.rf.r2 < 0 ? "further off than" : "closer than"} guessing the average of the days it was tested on. Guessing each day with the average of the days before scores ${F.r2(mood.base.r2)}, so the fair baseline sits ${mood.base.r2 < 0 ? "below" : "above"} zero. ${C("mood-forecast").sentence}`]);
  const ROSE = [["mood-forecast", "Mood's", mood], ["energy-forecast", "energy's", energy], ["productivity-forecast", "productivity's", prod]];
  const readable = ROSE.filter(([id]) => K.holds(id)), hints = ROSE.filter(([id]) => !K.holds(id));
  panel("roses-readout", "Reading a rose", [K.PLAIN.perm,
    `A rose shows what the forest leaned on, not what drives the score.${hints.length ? ` ${hints.map(([, nm, e]) => `${nm} forest (R² ${F.r2(e.rf.r2)})`).join(" and ").replace(/^./, (c) => c.toUpperCase())} ${hints.length > 1 ? "lose" : "loses"} to the fair guess, so ${hints.length > 1 ? "those roses are weak hints" : "that rose is a weak hint"}.` : ""}${readable.length ? ` ${readable.map(([, nm, e]) => `${nm} (${F.r2(e.rf.r2)}), leaning on ${K.name(e.imp[0][0])},`).join(" and ").replace(/^./, (c) => c.toUpperCase())} ${readable.length > 1 ? "are" : "is"} worth reading.` : ""}`]);
  panel("brush-readout", "Reading the number in the middle", [K.PLAIN.auc,
    `Swear ${swear.auc_rf[0].toFixed(2)}: given one prompt that swore and one that did not, the forest rates the swearing one higher about ${Math.round(swear.auc_rf[0] * 100)} times in 100. ${C("praise-ahead").sentence}`]);
  panel("schema-readout", "Words used here", [
    "<b>Fact sheet</b>: a sheet of readings, one row per day for one machine, container, service, or event.",
    "<b>Dimension</b>: a sheet of the things those readings are about (days, machines, containers, services), which every reading links to.",
    "<b>Rollup</b>: a column on a dimension that sums up its linked readings, such as a day's average CPU.",
    "<b>Galaxy schema</b>: more than one fact sheet sharing the same dimensions, so one day or one machine gathers every reading about it."]);

  /* ---------- What did not hold, each asked a second way ---------- */
  // Each failure keeps its card on the left; the right card is the same question asked another way by the nightly build's bridge.py,
  // under the same checks, with its own verdict, so a failure is never quietly replaced by an easier question.
  const B = window.ML_BRIDGE;
  const tel = A ? A.sources.filter((s) => !["Claude prompts", "wellness log"].includes(s.name)).map((s) => s.counts.filter((v) => v > 0).length) : [];
  const telSpan = tel.length ? `${Math.min(...tel)} to ${Math.max(...tel)} days` : "a short window";
  const CARD = { no: "crit", weak: "warn", wait: "info", held: "good" };
  // Each card names the finding it reports; a finding that holds leaves this section, and its second ask leaves with it.
  const NOHOLD = [
    [["mood-forecast", "energy-forecast"], "Mood and energy", `${K.heads("mood-forecast", "energy-forecast")} Forest and ridge R² run from ${F.r2(Math.min(...r2s))} to ${F.r2(Math.max(...r2s))}.`, F.r2(Math.max(...r2s))],
    [["praise-ahead"], "Praise", `${C("praise-ahead").sentence} The tenth the forest rates likeliest praises at ${pct(praise.deciles[9][1] / praise.deciles[9][0], 1)} against a base rate of ${pct(praise.rate_test, 1)}.`, `AUC ${praise.auc_rf[0].toFixed(2)}`],
    [["cpu-next-hour"], "ELLIE's next hour", C("cpu-next-hour").sentence, `${F.signed(Cp.gain.mean, 2)} pts`],
    [["kinds-of-day-steady"], "The border between kinds", C("kinds-of-day-steady").sentence, `ARI ${n2(Dd.boot.median)}`],
    [[], "Data notes", `Sleep counts only nights of 2 to 14 hours; a 0 or a bedtime typed as hours is no night. The kinds use 06:00 days and the atlas calendar days. Telemetry sources span ${telSpan} in this run, so every link here is co-movement inside that window.`, telSpan],
  ];
  const asked = [];
  if (B) {
    const ms = B.scores.mood, lk = B.need.links.mood, sl = B.need.sleep && B.need.sleep.mood;
    const me = ms.links.find((l) => l[0] === "energy");
    const pr = B.praise, at = (lab) => pr.at.find((a) => a.label === lab);
    const c1 = B.cpu.find((c) => c.h === 1), c12 = B.cpu.find((c) => c.h === 12);
    const [q0, q1] = B.days.kinds, qN = q0.core.n + q0.border.n;
    const rhythm = c12.over_clock.lo < 0 && c12.over_clock.hi > 0;
    const answered = [["busy-next-hour", "busy-hour"], ["build-days-keep", "build-day"]].filter(([id]) => K.holds(id)).map(([, nm]) => nm);
    asked.push(
      [K.badge("mood-sleep-link", K.tone("mood-sleep-link") === "wait" && sl && sl.days != null && sl.days > sl.have ? `about ${sl.days - sl.have} more logged nights` : undefined), "Which way, and what moves with it",
        `${C("mood-direction").sentence} From yesterday's mood alone it scores ${n2(ms.direction.yesterday[0])}. ${C("energy-direction").sentence} ${C("mood-sleep-link").sentence} Mood and energy track each other at ${n2(me[1])}, matched by ${pct(me[2], 0)} of shifted copies${me[1] >= 0.7 ? ", so the two logs act as one score" : ""}.`,
        `r ${n2(sl ? sl.r : lk.r)}`],
      [K.badge("praise-place"), "Where in a session it lands",
        `${C("praise-place").sentence} After friction it runs ${pct(at("after friction").rate, 1)} (${pct(at("after friction").lo, 1)} to ${pct(at("after friction").hi, 1)}) against ${pct(at("after a calm prompt").rate, 1)} after a calm prompt, and days with more commits praise ${Math.abs(pr.commits.r) < 0.2 ? "no more" : pr.commits.r > 0 ? "more" : "less"} (rank ${n2(pr.commits.r)} over ${pr.commits.n} days).${!K.holds("praise-place") && !K.holds("praise-ahead") ? " Praise is spread evenly through the work, so no earlier prompt signals it." : ""}`,
        `${F.signed(pr.close_minus_open.mean * 100, 2)} points`],
      [K.badge("busy-next-hour", K.holds("busy-next-hour") && K.holds("cpu-12h") ? "as busy hours, and half a day out" : undefined), "Busy or not, and further out",
        `Whether the next hour runs busy, above ${Math.round(c1.busy.threshold)}% CPU: ${K.lower(C("busy-next-hour").sentence)}${c1.busy.diff_lo == null ? "" : c1.busy.diff_lo > 0 ? " The forest adds to the hour now." : c1.busy.diff_hi < 0 ? " The forest does worse than the hour now." : " The forest adds nothing to the hour now."} ${C("cpu-12h").sentence}${rhythm && K.holds("cpu-12h") ? ` That gain is the day's rhythm: each hour of the day's training average does as well, within ${n2(c12.over_clock.mean)} points (${n2(c12.over_clock.lo)} to ${n2(c12.over_clock.hi)}).` : ""}`,
        c1.busy.auc_now ? `AUC ${n2(c1.busy.auc_now[0])}` : "no AUC"],
      [K.badge("build-days-keep", "for build days"), "Which days keep their kind",
        `${C("build-days-keep").sentence} Of ${qN} quiet days, ${q0.core.n} keep their kind that often (median ${pct(q0.stability, 0)}).${K.holds("build-days-keep") && q0.stability < 0.9 ? " Build days form a stable group; quiet days are the days that are not build days, and the border moves through them." : ""} The steady build days average productivity ${n2(q1.core.productivity)} on ${q1.core.logged} logged days, against ${n2(q0.border.productivity)} for the quiet days that switch kinds.`,
        `${q1.core.n} of ${q1.core.n + q1.border.n}`],
      [K.toneBadge("wait"), "What more days would buy",
        `${B.need.cpu_test_hours != null ? `At its present size, the forest's one-hour gain would need about <b>${int(B.need.cpu_test_hours)}</b> held-out hours to clear zero, near ${Math.round(B.need.cpu_days)} days of hourly telemetry against the ${Math.round(B.need.cpu_have_days)} behind this run.` : "The forest's one-hour gain is not above zero, so no count of extra hours would make it clear zero."} Mood's link to ${K.name(lk.feature)} needs about ${lk.days} logged nights against ${lk.have}.${answered.length ? ` The ${answered.join(" and ")} answers hold now.` : ""}`,
        B.need.cpu_days != null ? `~${Math.round(B.need.cpu_days)} days` : "no count"]);
  }
  const rows = NOHOLD.map((r, i) => [r, asked[i]]).filter(([[ids]]) => !ids.length || !ids.every(K.holds));
  set("nohold-title", B ? "What did not hold, asked another way" : "What did not hold");
  const nh = document.getElementById("nohold-cards");
  if (nh) {
    nh.replaceChildren();
    nh.classList.toggle("bridged", !!B);
    rows.forEach(([[ids, head, tx, fig], pair]) => {
      const cls = ids.length ? CARD[ids.map(K.tone).find((t) => t !== "held") || "held"] : "info";
      const row = B ? h("div", { class: "br-row rvx" }, nh) : nh;
      const c = h("div", { class: `lc ${cls}${B ? "" : " rvx"}` }, row);
      h("span", {}, h("header", {}, c), head);
      L.rich(h("p", { class: "tx" }, c), tx);
      if (!B) return;
      const [v, ahead, atx, tfig] = pair;
      const k = v.cls === "no" ? "crit" : v.cls === "weak" ? "warn" : v.cls === "inf" ? "lapis" : "good";
      const arc = h("div", { class: "br-arc", style: `--k:var(--${k})` }, row);
      h("span", { class: `br-from${cls === "info" ? " note" : ""}` }, arc, fig);
      const s = L.svg("svg", { viewBox: "0 0 100 44", "aria-hidden": "true" }, arc);
      L.svg("path", { d: "M4 40 Q50 -8 96 40", class: `br-path${v.cls === "no" || v.cls === "inf" ? " open" : ""}` }, s);
      L.svg("circle", { cx: 4, cy: 40, r: 2.6, class: "br-end" }, s);
      L.svg("circle", { cx: 96, cy: 40, r: 2.6, class: "br-end on" }, s);
      h("span", { class: "br-to" }, arc, tfig);
      const a = h("div", { class: `lc asked ${k === "lapis" ? "info" : k}` }, row);
      const hd = h("header", {}, a);
      h("span", {}, hd, ahead);
      K.vb(h("p", { class: "br-v" }, a), v);
      L.rich(h("p", { class: "tx" }, a), atx);
    });
    if (B) {
      const c1 = B.cpu.find((c) => c.h === 1);
      L.rich(h("p", { class: "note br-src" }, nh), `Second asks: <code>bridge.py</code> in <code>scripts/sphere/analysis/ml/</code> at the same snapshot. Directions forecast forward with a seven-day block bootstrap; same-day links are tested against every circular shift of the logged days, with Benjamini-Hochberg across inputs; praise intervals resample whole sessions; ELLIE's horizons hold out the final week, resample it in 24-hour blocks, and use the training hours' average for each hour of the day as a second baseline; each day's kind is counted across resamples of the days. The one-hour rerun holds ${c1.n_test} test hours where the run above held ${Cp.n_test}.`);
    }
  }

  /* ---------- Method ---------- */
  const mr = document.getElementById("method-rows");
  if (mr) {
    mr.replaceChildren();
    [["I to IV", "Do the hours fall into states without being told?", "Ward linkage on sixteen robust deviations, cut at four groups", "Adjusted Rand against the lab's k-means; 200 resamples of whole days against the full-data grouping; silhouette", `ARI ${n2(H.byk[4].ari)}; resampled ${n2(H.boot.median)}; silhouette ${n2(H.byk[4].sil)}`],
      ["V, VI", "Do days come in kinds?", "Ward linkage on the 24-hour shape and volume of 06:00 days", "Adjusted Rand against the lab; 200 resamples", `${kindsN[1]} build and ${kindsN[0]} quiet days; ARI ${n2(Dd.byk[2].ari)}; resampled ${n2(Dd.boot.median)}`],
      ["VII", "Who starts ELLIE's processes?", "The data lab's pid lineage", "99.9% of starts matched to a parent", `${pct(shareCC)} from Claude Code`],
      ["VIII, IX", "Can a forest forecast the logged scores?", "Random forest (500 trees) and ridge on eighteen daily inputs", "Five-fold cross-validation repeated ten times; out of bag; permutation importance on held-out folds", `Mood ${F.r2(mood.rf.r2)}, energy ${F.r2(energy.rf.r2)}, productivity ${F.r2(prod.rf.r2)}`],
      ["X", "Can ELLIE's next hour be forecast?", "Random forest and ridge on the hour's telemetry, lags read by the clock", `The final week held out; paired ${blockH}-hour-block bootstrap of the gain`, `Forest ${n2(Cp.mae.rf)} against no change ${n2(Cp.mae.persistence)}; gain ${n2(Cp.gain.mean)} (${n2(Cp.gain.lo)} to ${n2(Cp.gain.hi)})`],
      ["XI, XII", "Which prompts carry a swear, friction, or praise?", "Random forest and logistic regression on the session so far", "Day split 70/30; AUC with a session bootstrap; lift by tenth", `Swear ${swear.auc_rf[0].toFixed(2)}, friction ${fric.auc_rf[0].toFixed(2)}, praise ${praise.auc_rf[0].toFixed(2)}`]].forEach((r) => {
      const tr = h("tr", {}, mr);
      r.forEach((c) => h("td", {}, tr, c));
    });
  }
  set("method-note", `Run: the nightly ML build, <code>scripts/sphere/analysis/ml/nightly.py</code>, at the ${L.when(snap)} snapshot, with numpy, pandas, scipy, and scikit-learn. Every link on this page is co-movement inside these windows, never shown to cause the other.`);
})();
