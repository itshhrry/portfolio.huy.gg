/* The case study for the confusion matrices and data checks, in the reader and voice of ml-cases.js. Every figure is read
   from window.ML_METRICS (the nightly build's metrics.py, which counts the typed source alone) and window.ML.prompts, so the prose
   moves when a rerun does. Each margin note's term appears word for word in the study. */
"use strict";
(() => {
  const MT = window.ML_METRICS, P = window.ML && window.ML.prompts, F = K.fmt;
  if (!MT || !P) return;
  const sec = (hh, ...p) => ({ h: hh, p: p.filter(Boolean) });
  const pct = (v, d = 1) => F.pct(v, d), int = F.int, x1 = (v) => v.toFixed(1), x2 = (v) => v.toFixed(2), x3 = (v) => v.toFixed(3);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const md = (s) => `${MONTHS[+s.slice(5, 7) - 1]} ${+s.slice(8, 10)}`;
  const N = MT.next_prompt, sw = N.swear, fr = N.friction, pr = N.praise, B = MT.busy_hour, b = B.rule, St = MT.states, Dy = MT.days, I = MT.integrity;
  const flags = sw.top_tenth.tp + sw.top_tenth.fp;
  const lift = (t) => t.top_tenth.precision / t.base;
  const dropped = (k) => { const d = MT.drivers_dropped[k]; return d ? [d.auc.all, Object.values(d.auc)[1], K.name(d.lead)] : null; };
  const [swAll, swWo, lead] = dropped("swear") || [], [frAll, frWo] = dropped("friction") || [];
  const second = sw.drivers[1] ? K.name(sw.drivers[1][0]) : null;
  const busyN = b.tp + b.fn, stN = St.confusion.flat().reduce((a, c) => a + c, 0), stAgree = St.confusion.reduce((a, r, i) => a + r[i], 0);
  const dc = Dy.confusion, dyN = dc.flat().reduce((a, c) => a + c, 0);
  const hr = I["hourly.csv"], dl = I["daily.csv"], ps = I.prompt_signals, cv = I.daily_vs_prompts;

  window.LAB_CASES = Object.assign(window.LAB_CASES || {}, {
    metrics: {
      lede: `The swear and friction forests find about half of what they look for, and a prompt they flag carries it ${x1(lift(fr))} to ${x1(lift(sw))} times as often as the average prompt. The praise forest does no better than chance.`,
      sections: [
        sec("Introduction",
          "Six sorters on this page put things into groups. Three random forests rate each typed prompt by how likely the next prompt is to carry a swear, friction, or praise. A one-line rule calls ELLIE's next hour busy or quiet from this hour's processor use. Ward's method sorts hours into four states and days into two kinds.",
          "This section scores each sorter against what happened, counts its two kinds of mistake, and checks the tables the sorters read for flaws that would change a result.",
        ),
        sec("Method and data collection",
          `A random forest is 500 decision trees, each a chain of yes-or-no questions about a prompt (minutes since the last message, how many of the last three showed friction, the hour, the model), and the forest's rating is the share of trees that vote yes. Each forest learned from the <b>${int(P.n_train)}</b> typed prompts sent before ${md(P.test_from)} and was scored on the <b>${int(P.n_test)}</b> sent from ${md(P.test_from)} to ${md(P.last)}, across ${P.test_sessions} sessions. Those prompts were held out, so the score measures the forest on messages that had not been sent when it learned.`,
          `A forest gives every prompt a rating, and a sorter needs a line: a prompt above it is flagged. The cards draw every forest at one line, its likeliest tenth, which flags ${int(flags)} of the ${int(sw.top_tenth.n)} prompts. metrics.json also records a rating of one half, and the line that gives the best F1 on these same prompts. That last line is picked after seeing the answers, so new prompts would score below it.`,
          "Every rated prompt lands in one of four cells. A <b>hit</b> is a flagged prompt that carried what its forest looks for, a swear for the swear forest; a <b>miss</b> carried it without a flag; a <b>false alarm</b> was flagged and did not carry it; a <b>correct pass</b> was neither. Precision is hits divided by flags: when the forest raised a flag, how often it was right. Recall is hits divided by every prompt that carried it: how much of it the forest caught. F1 combines the two into one score from 0 to 1. The base rate is the share of all prompts that carried it, and precision divided by the base rate is the lift: how many times more often a flagged prompt carries it than the average prompt.",
          "To find what each forest leans on, every input was shuffled ten times, which breaks its link to the answer, and the drop in the forest's AUC recorded; the input whose shuffle costs most leads. For swear and friction, the forest was then retrained without its lead input to measure how much of the result rests on it.",
          `The busy rule calls ELLIE's next hour busy when this hour's processor use is above ${B.threshold} percent, and an hour counts as busy when its own use is above the same line. It was scored on ${B.n} held-out hours. Ward's states and kinds have no answer key, so the data lab's k-means groups stand in as the reference: the matrices count where the two methods agree.`,
          "The data checks read each table the sorters use for duplicates, gaps, empty values, and values outside their possible range, and compare the daily prompt counts with the prompts themselves. A flaw is material when rerunning without it moves a finding on the page.",
        ),
        sec("Presentation",
          "Each card is a confusion matrix. Down the side is what happened, across the top what the sorter said. Green cells are agreement, warm cells the two mistakes, and the fill in each cell is its share of its row, so a row that is mostly green is a kind of thing the sorter gets right. Under each matrix, precision, recall, and F1 are written out with the base rate beside them.",
          "The four hour states take a wider card, four rows by four columns, with each state's F1 at the end of its row. The Numbers face holds every count and every rate in one table. Below the cards, each data check names the table, the flaw, and in its last sentence whether the flaw is material.",
        ),
        sec("Findings",
          `<b>Swear.</b> ${sw.top_tenth.tp} hits, ${sw.top_tenth.fn} misses, and ${int(sw.top_tenth.fp)} false alarms: recall ${pct(sw.top_tenth.recall, 0)}, precision ${pct(sw.top_tenth.precision)} against a base rate of ${pct(sw.base, 2)}, a lift of ${x1(lift(sw))}, and an AUC of ${x3(sw.auc)}. At a rating of one half the forest flags ${sw.half.tp + sw.half.fp} prompts, and precision rises to ${pct(sw.half.precision, 0)} while recall falls to ${pct(sw.half.recall, 0)}.`,
          `Friction follows the same pattern, weaker: ${fr.top_tenth.tp} of ${fr.positives} caught, recall ${pct(fr.top_tenth.recall, 0)}, precision ${pct(fr.top_tenth.precision)} against ${pct(fr.base, 2)}, a lift of ${x1(lift(fr))}, and an AUC of ${x3(fr.auc)}.`,
          `Praise has ${pr.top_tenth.tp} hits among ${pr.top_tenth.tp + pr.top_tenth.fp} flags, a precision of ${pct(pr.top_tenth.precision)} against a base rate of ${pct(pr.base, 2)}, and an AUC of ${x3(pr.auc)}${K.holds("praise-ahead") ? "." : ": flagging prompts at random would do as well."}`,
          lead ? `Both forests lean first on ${lead}. Retrained without it, the swear forest's AUC falls from ${x3(swAll)} to ${x3(swWo)} and the friction forest's from ${x3(frAll)} to ${x3(frWo)}. ${swWo > 0.5 && frWo > 0.5 ? "Both stay above" : swWo > 0.5 || frWo > 0.5 ? "Only one stays above" : "Neither stays above"} a coin flip${second ? `, and the next input in line is ${second}` : ""}.` : null,
          `The busy rule caught ${b.tp} of ${busyN} busy hours (recall ${pct(b.recall, 0)}), and ${pct(b.precision, 0)} of the hours it called busy were (precision). It was right on ${pct(b.accuracy, 0)} of all ${b.n} hours, where calling every hour quiet is right on ${pct(1 - b.base, 0)}.${busyN >= 30 && B.auc_now ? ` This hour's processor use ranks a busy next hour above a quiet one with an AUC of ${x2(B.auc_now[0])}, ${x2(B.auc_now[1])} to ${x2(B.auc_now[2])} at 95 percent.` : ` With ${busyN} busy hour${busyN === 1 ? "" : "s"} in the test, too few to rank, no AUC is read.`}`,
          `Ward's method and the lab agree on ${stAgree} of ${stN} hours (${pct(St.accuracy)}, macro F1 ${x2(St.macro_f1)}) and on ${dc[0][0] + dc[1][1]} of ${dyN} days (${pct(Dy.accuracy)}, build-day F1 ${x2(Dy.build.f1)}). Of the ${stN - stAgree} hours they disagree on, ${St.confusion[0][3]} are hours Ward's method calls working with Claude and the lab calls still.`,
          `The data checks: sleep is material to the findings (${dl.sleep_dropped} logged values dropped as no night)${dl.scores_outside_1_to_10 ? `; ${dl.scores_outside_1_to_10} productivity score${dl.scores_outside_1_to_10 > 1 ? "s" : ""} outside 1 to 10 ${dl.scores_outside_1_to_10 > 1 ? "move" : "moves"} the same-day figure` : ""}; the hourly table misses ${int(hr.missing_hours)} hours, none of them read by the CPU forecasts; the prompts carry ${ps.duplicate_ts_in_session} duplicate timestamps among ${int(ps.typed)} typed; and the daily table and the prompts ${cv.days_differing ? `differ on ${cv.days_differing} of ${cv.days_compared} days` : `agree on all ${cv.days_compared} days, ${int(cv.total_typed)} prompts in both`}.`,
        ),
        sec("What it means",
          `On a rare event, accuracy says almost nothing. A swear forest that never flags anything is right on ${pct(1 - sw.base, 1)} of prompts, so the swear and friction results stand on recall and lift. Flagging the likeliest tenth finds ${pct(sw.top_tenth.recall, 0)} of swears, and ${pct(1 - sw.top_tenth.precision, 0)} of those flags are false alarms. ${K.holds("friction-ahead") ? "That supports reading friction as a likelihood, the chance the next prompt carries friction given the last three, and rules out" : "The forest does not rank friction above chance, which rules out both a likelihood and"} a yes-or-no warning, which would be wrong about ${Math.round((1 - sw.top_tenth.precision) * 10)} times in 10.`,
          K.claim("swear-recent").band === "insufficient" ? null : K.claim("swear-recent").sentence,
          `${K.holds("praise-ahead") ? "The forest ranks prompts with praise above the rest, so the page can state a praise forecast." : "The forest does not rank prompts with praise above the rest, so no claim on the page rests on it."} ${(() => { const d = Math.round((b.accuracy - (1 - b.base)) * 100); return d > 0 ? `The busy rule beats calling every hour quiet by ${d} points of accuracy` : d < 0 ? `The busy rule falls short of calling every hour quiet by ${-d} points of accuracy` : "The busy rule does no better than calling every hour quiet"; })()} and catches ${b.tp} of ${busyN} busy hours. Agreement between Ward's method and the lab says the states and kinds come back under a second method; it cannot say they are correct, because neither method has an answer key.`,
          (() => {
            const logged = dl.rows - dl.nulls.sleep_h, BR = window.ML_BRIDGE, nights = BR ? (BR.need.sleep?.mood?.have ?? BR.need.links.mood.have) : logged - dl.sleep_dropped;
            return `The prompt and hour tables are complete where the findings use them. Mood's link to sleep rests on ${nights} nights, because ${dl.sleep_dropped} of the ${logged} logged sleep values${dl.sleep_dropped * 2 > logged ? ", more than half," : ""} are dropped.`;
          })(),
        ),
        sec("Limitations",
          `Each forest was scored on one split in time, at ${md(P.test_from)}; a different split date would move every figure. The counts are small where the events are rare: ${sw.positives} swears, ${pr.positives} praise prompts, and ${busyN} busy hours, so one more hit moves swear recall by 1 point${busyN ? ` and busy-hour recall by ${x1(100 / busyN)}` : ""}.`,
          `hourly.csv is rebuilt every night, so the ${B.n} test hours behind the busy rule change with each rebuild; the figures here are from the ${MT.snapshot} snapshot. The states and kinds are scored against the lab's k-means, and k-means is a model too, so a disagreement does not say which method is wrong.`,
        ),
      ],
      notes: [
        { term: "AUC", kind: "term", text: "The area under the ROC curve: the chance the forest rates a randomly chosen prompt that carried a swear above one that did not. 0.5 is a coin toss and 1 is perfect." },
        { term: "F1 combines the two", kind: "term", text: "Their harmonic mean, 2 × precision × recall ÷ (precision + recall). It is low whenever either one is low." },
        { term: "every input was shuffled ten times", kind: "term", text: "Permutation importance, scored here by the drop in AUC on the held-out prompts." },
        { term: "held out", kind: "context", text: "The split is by calendar day: every prompt before the split date trained the forests, and every prompt from it on tested them." },
      ],
    },
  });
})();
