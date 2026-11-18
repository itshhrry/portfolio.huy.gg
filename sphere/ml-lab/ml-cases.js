/* Case studies for the twelve plates, each opened from its card's Case study button into the data lab's reader sheet. They
   are written for a reader who knows the house but no statistics: everyday words first, an example from the house's own
   record, and the technical name second, in brackets or a margin note. Each study explains its own measures in "Method and
   data collection", so no glossary is needed. Every figure is filled from window.ML. Prose allows <b> and <code> only, and
   each margin note's term appears word for word in its study, which is where the reader hangs it. */
"use strict";
(() => {
  const M = window.ML, H = M.hours, Dd = M.days, Cp = M.cpu, Pm = M.prompts, A = M.atlas, S = K.STATES, F = K.fmt, X = K.facts;
  const pct = (v, d = 0) => F.pct(v, d), n2 = (v) => F.num(v, 2), n1 = (v) => F.num(v, 1), int = F.int, day = (s) => F.day(s.slice(0, 10));
  const sec = (hh, ...p) => ({ h: hh, p: p.filter(Boolean) });
  const list = (a) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")}${a.length > 2 ? "," : ""} and ${a[a.length - 1]}`);
  const per100 = (a, b) => Math.round((a / b) * 100);
  const swear = X.tgt("swear"), fric = X.tgt("friction"), praise = X.tgt("praise");
  const mood = X.sc("mood", true), moodN = X.sc("mood", false), energy = X.sc("energy", true), prod = X.sc("productivity", true);
  const kindsN = [Dd.kinds[0].n, Dd.kinds[1].n];
  const E = M.web.edges || [];

  // The sixteen hourly signals in everyday words, kept in ml-core.js so the plates' hover cards use the same list.
  const SIGNALS = K.SIGNAL_WORDS;
  const signalList = list(H.signals.map((nm) => `<b>${nm}</b>, ${SIGNALS[nm] || "its own measure"}`));

  // What each hour state is, in the run's own numbers.
  const hoursOf = (s) => H.t.map((t, i) => (H.ward[i] === s ? t : null)).filter(Boolean);
  const byDay = (s) => { const c = {}; hoursOf(s).forEach((t) => { c[t.slice(0, 10)] = (c[t.slice(0, 10)] || 0) + 1; }); return Object.entries(c).sort(); };
  const byHour = (s) => { const c = new Array(24).fill(0); hoursOf(s).forEach((t) => c[+t.slice(11, 13)]++); return c; };
  const strongest = (s, k = 3) => H.signals.map((nm, j) => [nm, K.med[s][j]]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, k);
  const moveWords = (s, k = 3) => list(strongest(s, k).map(([nm, v]) => `${nm} ${v > 0 ? "up" : "down"} ${n1(Math.abs(v))}`));
  const busyDays = (s, min) => list(byDay(s).filter(([, c]) => c >= min).map(([d]) => day(d)));
  const span = (s) => { const d = byDay(s); return [day(d[0][0]), day(d[d.length - 1][0]), d.length]; };
  const night = (() => { const top = byHour(2).map((c, hh) => [hh, c]).sort((a, b) => b[1] - a[1]).slice(0, 2); return [top.reduce((a, [, c]) => a + c, 0), top.map(([hh]) => `${String(hh).padStart(2, "0")}:00`).sort()]; })();
  const [lrFirst, lrLast, lrDays] = span(1);
  // The long route's hours on each of its days, and what the other hours of those days were, so the text names its breaks.
  const lrCounts = byDay(1), lrDaySet = new Set(lrCounts.map(([d]) => d));
  const lrGaps = H.t.reduce((c, t, i) => { if (lrDaySet.has(t.slice(0, 10)) && H.ward[i] !== 1) c[H.ward[i]] = (c[H.ward[i]] || 0) + 1; return c; }, {});
  const lrWords = list(lrCounts.map(([d, c]) => `${c} of ${day(d)}'s hours`));
  // Whether the long route's days run unbroken, and whether its hours reach around the clock, read from the run.
  const dayNo = (d) => Date.parse(`${d}T00:00:00Z`) / 864e5;
  const lrInRow = lrCounts.length > 1 && lrCounts.every(([d], i) => i === 0 || dayNo(d) - dayNo(lrCounts[i - 1][0]) === 1);
  const lrAllDay = byHour(1).filter((c) => c > 0).length >= 20;
  const hourDays = new Set(H.t.map((t) => t.slice(0, 10))).size, piEvery = byDay(2).length === hourDays;
  const linksOf = (nm) => E.filter((x) => x.from === nm || x.to === nm).length;
  const O = H.others || {}, oa = (k) => (O[k] ? n2(O[k].ari_lab) : "n/a");
  const STATES_PLAIN = [
    `<b>Working with Claude</b>, ${K.counts[0]} hours: the ordinary busy hour, when a little of everything is up (${moveWords(0)}). It shows up at every hour of the day, most often on ${busyDays(0, 8)}.`,
    `<b>The long route</b>, ${K.counts[1]} hours: named for the network. Your computers reach your own services (jellyfin, immich, pihole, carbon, huy.gg, and the rest) at one of two speeds, and these are the hours on the slow one, most likely while the Mullvad VPN tunnel carried the traffic. Network weather is up ${n1(K.med[1][H.signals.indexOf("network weather")])} here, and the work is quieter than usual. All ${K.counts[1]} hours fall on ${lrDays} days${lrInRow ? " in a row" : ""}, ${lrFirst} to ${lrLast}${lrAllDay ? ", day and night" : ""}.`,
    `<b>The Pi's night shift</b>, ${K.counts[2]} hours: the Raspberry Pi doing its scheduled overnight work, with Pi load up ${n1(K.med[2][H.signals.indexOf("Pi load")])} and its temperature up ${n1(K.med[2][H.signals.indexOf("Pi temperature")])}. ${night[0]} of its ${K.counts[2]} hours fall at ${list(night[1])}${piEvery ? ", on every day of the window" : ""}.`,
    `<b>Still</b>, ${K.counts[3]} hours: the house with almost nothing running (${moveWords(3)}). It falls on ${busyDays(3, 1)}.`,
  ];
  const UNUSUAL = "Every signal is measured in the same way: how unusual the hour was for that signal. Zero means an ordinary hour. +2 means the signal ran twice as far above normal as an ordinary hour usually strays, and −2 the same distance below. That puts CPU percentages, message counts, and milliseconds on one scale, so the sixteen can be compared and combined.";
  const disagree = H.confusion.flatMap((r, i) => r.map((c, j) => [i, j, c])).filter(([i, j, c]) => i !== j && c > 0).sort((a, b) => b[2] - a[2]);
  const wd = (() => { const b = new Array(7).fill(0), t = new Array(7).fill(0); Dd.day.forEach((d, i) => { const w = L.date(d).getDay(); t[w]++; if (Dd.ward[i]) b[w]++; }); return b.map((v, i) => [["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"][i], t[i] ? v / t[i] : 0]).sort((a, c) => c[1] - a[1]); })();
  const linkWords = E.slice().sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 4).map((e) => `${e.from} ${e.lag ? `rises ${e.lag} hour${e.lag > 1 ? "s" : ""} before ${e.r > 0 ? "a rise" : "a drop"} in ${e.to}` : `${e.r > 0 ? "rises and falls with" : "moves opposite to"} ${e.to}`}`);
  const SRC = { "Claude prompts": "every message you typed to Claude", ELLIE: "the desktop's own health readings", Pulse: "the laptop's readings, sent home by the Pulse link", Pi: "the Raspberry Pi's readings", carbon: "the carbon laptop server's readings", router: "the router's readings", phone: "app opens on the iPhone", "process starts": "every program the desktop started", services: "the five-minute checks of how fast each of your services answers", "LAN devices": "which devices were on the home network", routines: "every scheduled job and whether it worked", "Windows events": "warnings and errors from Windows", "█████": "█████'s log lines", "Claude limits": "your 5-hour and 7-day Claude usage", "wellness log": "days you logged mood, energy, and productivity" };
  const srcFirst = A ? A.sources.map((s) => [s.name, s.counts.findIndex((v) => v > 0), s.counts.filter((v) => v > 0).length]) : [];
  const busiest = A ? A.prompts.indexOf(Math.max(...A.prompts)) : -1;
  const wk = (K.weeks ? K.weeks() : []).filter((w) => w.prompts >= 100);
  const worst = wk.length ? wk.reduce((a, b) => (b.friction / b.prompts > a.friction / a.prompts ? b : a)) : null;
  const calmest = wk.length ? wk.reduce((a, b) => (b.friction / b.prompts < a.friction / a.prompts ? b : a)) : null;
  const sitF = X.sit("after a friction prompt"), sitC = X.sit("after a calm prompt"), sitS = X.sit("after a swear"), sitP = X.sit("after praise"), fast = X.sit("under a minute"), slow = X.sit("15 to 60 minutes"), first = X.sit("the first in its session");
  const imps = (e, k = 3) => list(e.imp.slice(0, k).map((r) => K.name(r[0])));
  const decRate = (t, q) => t.deciles[q][1] / t.deciles[q][0];
  const DAY_INPUTS = "how many messages you typed, how many showed frustration or praise, how much Claude wrote back, how many characters you typed, how many code changes you saved (commits), your phone minutes and phone opens, how many vault notes you edited, your hours in Claude, the time of your last message that day and the day before, your logged sleep that night and the night before, exercise, whether you logged the day sober, and the day of the week";
  const PROMPT_INPUTS = "where the message sits in its session, the minutes since your last message, the minutes since the session began, whether your last message showed friction, praise, or a swear, how many of your last three showed friction, how many messages you had sent that day, the hour, the day of the week, the Claude model, and the effort setting";

  window.LAB_CASES = Object.assign(window.LAB_CASES || {}, {
    tree: {
      lede: `Two different ways of sorting the house's hours agree on ${X.agreeH} of ${H.n}. ${K.claim("hour-states").head}`,
      sections: [
        sec("Introduction",
          `Every hour, Sphere records sixteen things about the house. The data lab sorted the ${H.n} hours from ${day(H.t[0])} to ${day(H.t[H.n - 1])} into four kinds, which it calls states, and named each one after what stands out in it:`,
          ...STATES_PLAIN,
          "Any sorting method has habits of its own, so a result found with one method can be partly that method's doing. This plate sorts the same hours again with a different method, Ward's method, and checks whether the same four states come back.",
        ),
        sec("Method and data collection",
          `The sixteen signals, one number each per hour: ${signalList}.`,
          UNUSUAL,
          `Ward's method sorts the hours the way you might sort a shoebox of photos. Start with every photo on its own. Find the two most alike and put them together. Then find the two most alike piles and join those, and keep going until one pile holds everything. The record of what joined what, and how unlike the two sides were when they joined, forms a family tree. Cutting the tree partway down leaves a set of groups. Cut at four groups, this tree's groups were then compared with the lab's four states, hour by hour.`,
          `Two checks were run. The first asks how cleanly the groups separate: whether a typical hour sits much closer to its own group than to the next one. The second reruns the whole sort ${H.boot.reps} times, each time on a random redraw of whole days, the way a poll is retaken with a different sample, to see whether the same groups keep coming back. Whole days are drawn because an hour is much like the hour before it.`,
        ),
        sec("Presentation",
          `Read the picture from the center out. The middle is the trunk of the family tree, and each of the ${H.n} tips on the rim is one hour. Two hours whose branches join near the rim were alike from the start; branches that only meet near the center belong to unlike hours.`,
          "Past the tips, the first ring colors each hour by the state Ward's method gave it, and the thin ring just outside colors it by the lab's state, so a disagreement shows as two different colors stacked. The sixteen thin rings after that are the hour's signals: blue for below normal, orange for above, darker the further from normal, with the signals that best tell the states apart closest in. The dashed circle is where the tree was cut. Hover anywhere along a line from the center for that hour's details.",
        ),
        sec("Findings",
          `The two methods put <b>${X.agreeH} of the ${H.n} hours</b> in the same state, about ${per100(X.agreeH, H.n)} in every 100. Statisticians score this kind of agreement from 0, no better than chance, to 1, perfect; this pair scores <b>${n2(H.byk[4].ari)}</b>.`,
          disagree.length ? `The ${H.n - X.agreeH} hours they disagree on: ${list(disagree.map(([i, j, c]) => `${c} that Ward's method calls ${K.inline(S[i])} and the lab calls ${K.inline(S[j])}`))}. These are borderline hours that share most of their signals with both states.` : "",
          `Across ${H.boot.reps} reshuffles: ${K.lower(K.claim("hour-states").sentence)} ${X.fourLongest ? "Four is also the number of groups that lasts longest as the cut moves down the tree: cutting anywhere across the longest stretch of its height leaves exactly four groups, a longer stretch than for three groups or five." : "Four is not the number of groups that lasts longest as the cut moves down the tree, so the four here follow the lab rather than the tree."} The groups do overlap at their edges, though. On the separation check they score ${n2(H.byk[4].sil)}, where 1 would mean cleanly apart and 0 no gap at all.`,
        ),
        sec("What it means",
          `Ward's method and the lab's k-means both build groups by keeping the spread inside each group small, so their agreement counts as one test, not two. Spectral clustering, which groups hours by their nearest neighbors instead, finds the same four states at an agreement of <b>${oa("spectral")}</b>. Four other methods split the hours differently: complete linkage at ${oa("complete linkage")}, average linkage at ${oa("average linkage")}, a Gaussian mixture at ${oa("Gaussian mixture")}, and HDBSCAN at ${oa("HDBSCAN")}. ${H.others && H.others.spectral && H.others.spectral.ari_lab >= 0.65 ? "The states hold up under one different idea of a group" : "The states do not survive a different idea of a group"}, and many hours sit between two states. On Home, a state should read as the nearest description of the hour, never as a hard label.`,
          `${lrInRow ? "One state is a stretch of the calendar. " : ""}The long route holds ${lrWords}, and no hour on any other day${lrInRow ? ", because the slow network lasted for days at a time" : ""}. Those days have breaks: ${lrGaps[2] || 0} of their hours belong to the Pi's night shift and ${lrGaps[0] || 0} to working with Claude. ${lrInRow ? "It describes a period in the house's life more than a kind of hour." : ""}`,
        ),
        sec("Limitations", `${hourDays} days of readings from one house. Ward's method prefers groups of similar size, and once it joins two hours it never separates them, so an hour joined early to the wrong branch stays there. Methods agreeing shows the groups recur; it says nothing about what caused them. The VPN behind the long route is a reasoned guess, since Sphere does not record whether the VPN is on.`),
      ],
      notes: [
        { term: "Mullvad VPN tunnel", kind: "context", text: "The Network Log measured the tunnel adding about 45 thousandths of a second, close to the gap between the two speeds." },
        { term: "how unusual the hour was", kind: "term", text: "Formally a robust z-score: distance from the signal's median hour, in units of its median absolute deviation. Unusual hours cannot stretch it." },
        { term: "Ward's method", kind: "term", text: "Hierarchical clustering published by Joe H. Ward Jr. in 1963. It always joins the two groups whose union adds the least spread." },
        { term: "how cleanly the groups separate", kind: "term", text: "The silhouette score: for each hour, how much closer it sits to its own group than to the nearest other group, averaged." },
        { term: "Statisticians score this kind of agreement", kind: "term", text: "The adjusted Rand index. It counts pairs of hours the two methods put together or apart alike, discounting lucky matches." },
      ],
    },
    pc: {
      lede: "Each of the four states draws a different shape, reaching farthest on its own signals.",
      sections: [
        sec("Introduction", "Plate I says which state each hour belongs to. This plate shows what each state looks like. Every hour is drawn as one line that visits all sixteen signals, and because the signals sit around a circle, each hour's line closes into a ring-like shape. Hours from the same state make similar shapes, so a state becomes something the eye can recognize, the way you recognize a friend's handwriting.", ...STATES_PLAIN),
        sec("Method and data collection",
          "The sixteen signals are the same ones explained in Plate I's case study: CPU, memory, the Pi, prompts, phone opens, network weather, and the rest. " + UNUSUAL,
          "To keep one wild hour from squashing everything else toward the middle, values beyond −4 and +6 are drawn at the edge. The spokes are arranged so each state's signals sit side by side: signals that run highest in the same state are neighbors, with the ones that best tell the states apart first. The bold line for each state is its typical hour, the middle value of its hours on every signal.",
        ),
        sec("Presentation",
          "Each spoke is one signal. The solid ring marks normal: a line pushing outside it on a spoke means that hour ran above normal on that signal, and a line pulled inside means below. The thin lines are single hours, laid over each other so busy bundles read darker; the bold lines are the four typical hours.",
          "Press Flat and the circle unrolls into a row of upright axes, the usual way this chart is drawn (parallel coordinates). Dragging along a spoke keeps only the hours whose value falls inside your drag, and drags on two or more spokes combine; a click on a spoke clears it. Try dragging Pi load above +3: only the Pi's night shift is left. Drag Claude's processes below −2, and almost only Still remains.",
        ),
        sec("Findings",
          `${list(S.map((st, q) => { const [nm, v] = X.topOf(q); return `${st.name} reaches furthest on ${nm} (${F.signed(v, 1)})`; }))}.`,
          `The signals that best tell the states apart are ${list(K.byEta.slice(0, 3).map((j) => H.signals[j]))}. Others, such as ${H.signals[K.byEta[K.byEta.length - 1]]}, vary as much within each state as between them, so they help little in naming a state.`,
        ),
        sec("What it means", "A state is a pattern across many signals at once, which no single gauge can show. Two of the four come down to one signal each: the long route to network weather and the night shift to Pi load. The other two are many small moves together, so the cascade on Plate IV draws them with many thin curves."),
        sec("Limitations", `This chart only lets you compare neighboring spokes at a glance, so the order chosen decides which pairs are easy to compare. Drawing extreme values at the edge hides how far the most extreme hours went, and with ${H.n} lines, many overlap; dragging along spokes is the way to pull them apart.`),
      ],
      notes: [
        { term: "parallel coordinates", kind: "term", text: "A chart with one axis per measure, where each item is a line through its value on every axis. The round version is sometimes called a radar or star plot." },
        { term: "best tell the states apart", kind: "term", text: "Measured by eta squared (η²): the share of a signal's variation that lies between the states; the rest lies within them." },
      ],
    },
    web: {
      lede: `Once the time of day is taken out, ${E.length} links between the signals remain; the ring around them shows which hours were far from normal.`,
      sections: [
        sec("Introduction", "Two signals can rise together because both follow the clock. Your messages to Claude and the desktop's CPU are both high in the afternoon, whether or not one causes the other. The data lab's link test removed the time of day before looking for links, so a link here means two signals move together beyond what the clock explains. The ring around the links shows every hour in order, so the links can be read against the hours they came from."),
        sec("Method and data collection",
          "The signals are the sixteen explained in Plate I's case study. For each one, the lab first subtracted what is typical for that hour of the day; a busy 3 p.m. is only interesting if it is busier than most 3 p.m.s. It then removed each signal's tendency to carry over from one hour to the next, since a slow-changing signal would otherwise seem linked to everything (statisticians call that carry-over momentum).",
          `What remained was compared pair by pair, both in the same hour and with one signal leading the other by one, two, or three hours. To tell a real link from luck, each comparison was repeated a thousand times with one signal's timeline slid around the calendar by a random amount. That keeps the signal's shape but breaks any real timing, so a link that survives the sliding is unlikely to be chance. With ${M.web.tests ? int(M.web.tests) : "many"} comparisons made, some would pass by luck alone, so a stricter bar was applied across all of them together.`,
          "Each spike on the ring is one hour, as long as that hour was unusual across all sixteen signals combined.",
        ),
        sec("Presentation", `The hours run clockwise from ${day(H.t[0])}, one spike each, colored by state, with a tick and a date at each midnight. Inside, each dot is a signal, larger when it has more links. An orange link means two signals rise together, a blue one that one rises as the other falls, and a thicker link a stronger one. A dashed link with an arrow means one signal moves first and the other follows an hour or more later, pointing from the leader to the follower. Hover a dot to see only its links.`),
        sec("Findings",
          `The strongest links: ${list(linkWords)}.`,
          `${E.filter((e) => e.lag).length} of the ${E.length} links have one signal leading the other. The long route shows on the ring as a blue stretch from ${lrFirst} to ${lrLast}, notched by ${lrGaps[2] || 0} hours of the Pi's night shift, ${linksOf("network weather") ? `and network weather, the signal behind it, carries ${linksOf("network weather")} link${linksOf("network weather") > 1 ? "s" : ""} inside.` : "and network weather, the signal behind it, links to nothing inside: the route changed on its own schedule, and nothing else in the house moved with it."}`,
        ),
        sec("What it means", E.length ? `Once the clock is taken out, ${E.length < H.signals.length ? "most signals show no link" : "the links that remain"}; the strongest, ${linkWords[0]}, is the one to state anywhere in Sphere, as co-movement and never as a cause.` : "Once the clock is taken out, no link between the signals survives the test."),
        sec("Limitations", `Links at the level of whole hours, inside ${hourDays} days. When one signal leads another, it moved first; that does not prove it caused the other, and both could be driven by something Sphere does not record.`),
      ],
      notes: [
        { term: "momentum", kind: "term", text: "Formally an AR(1) term: the share of last hour's value that carries into this hour." },
        { term: "slid around the calendar", kind: "term", text: "A circular shift: the series moves forward by a random amount and wraps around at the end." },
        { term: "a stricter bar", kind: "term", text: "The Benjamini-Hochberg correction, which keeps the expected share of lucky links among those kept below one in ten." },
      ],
    },
    cascade: {
      lede: (() => {
        const moved = K.STATES.map((st, q) => H.signals.filter((nm, j) => K.med[q][j] != null && Math.abs(K.med[q][j]) >= 0.5).length);
        return `Each state differs from normal on ${Math.min(...moved)} to ${Math.max(...moved)} signals, and the cascade draws only those.`;
      })(),
      sections: [
        sec("Introduction", "Each state has a typical value on all sixteen signals, but most of those values sit close to normal and say little. The cascade keeps only the moves that matter and draws each as a curve from the state to the signal, so you can follow what each state does, the way a family tree shows who descends from whom.", ...STATES_PLAIN),
        sec("Method and data collection", "For each state, its typical hour: the middle value of each signal across the state's hours, measured in how far from normal the hour was (zero is normal, +2 twice as far above normal as an ordinary hour strays). Only moves of half a step or more are drawn. The big circle's size follows the state's number of hours, and the smaller circle inside it the hours the lab's own method put in the same state, so a small gap between them means the two methods agreed."),
        sec("Presentation", "A solid curve runs to a signal the state holds above normal and a dashed curve to one it holds below; the thicker the curve, the bigger the move. The dot on each curve carries the size of the move, and sits further along for larger moves. Hover a circle or a signal's name to fade every curve that does not touch it."),
        sec("Findings", `${list(S.map((st, q) => { const big = H.signals.map((nm, j) => [nm, K.med[q][j]]).filter(([, v]) => v != null && Math.abs(v) >= 0.5).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])); return big.length ? `${st.name} moves ${big.length} signal${big.length > 1 ? "s" : ""}, the largest ${big[0][0]} (${F.signed(big[0][1], 1)})` : `${st.name} moves no signal by half a step`; }))}.`),
        sec("What it means", "The cascade is the key to the other hour plates: it says in one look what each state's color stands for, and it gives each state the one-line description it would carry on Home."),
        sec("Limitations", "A typical value hides variety inside a state, so a state that holds two kinds of hour shows only their middle."),
      ],
      notes: [
        { term: "half a step", kind: "why", text: "Below half an ordinary hour's usual wobble, a move is too small to tell apart from chance." },
        { term: "the lab's own method", kind: "term", text: "k-means: pick four centers, give each hour to its nearest center, move each center to the middle of its hours, and repeat until nothing moves." },
      ],
    },
    spiral: {
      lede: `${kindsN[1]} build days and ${kindsN[0]} quiet days, wound four weeks to a turn so the weekdays line up.`,
      sections: [
        sec("Introduction", `The data lab found that your days come in two kinds. A <b>build day</b> is a heavy day with Claude: a typical one has ${Dd.kinds[1].prompts} messages, spread through the day. A <b>quiet day</b> has about ${Dd.kinds[0].prompts}, and they tend to come late. This plate sorts the days again with Ward's method, the photo-sorting method from Plate I, and lays every day on a spiral calendar where streaks and weekdays show.`),
        sec("Method and data collection",
          `${Dd.n} days with at least ten messages to Claude. Each day runs from 06:00 to 06:00 the next morning, so a late-night session counts toward the day it began. A day is described two ways. Its shape is the share of its messages that fell in each hour: a day with most messages at night has a different shape from one spread through the afternoon. Its volume is how many messages it had, measured on a scale where doubling always counts the same, whether from 20 to 40 or from 200 to 400.`,
          `Ward's method then sorted the days into a family tree, cut it into two groups, and compared with the lab's two kinds. The sort was rerun ${Dd.boot.reps} times on random reshuffles of the days to see how steady the result is.`,
        ),
        sec("Presentation", `The spiral starts at ${day(Dd.day[0])} in the middle and winds outward, one turn every 28 days. Twenty-eight days is four weeks, so every Monday sits on one of the same four spokes, and so on for each weekday; the letters at the rim name them, and weekend spokes are darker. Each dot is a day: bigger with more messages, gold for a build day and blue for a quiet day. A ring around a dot means the lab put that day in the other kind, and a small diamond marks the ${Dd.split.n} days a third group would take. In the middle, each kind's average day drawn as a shape: the further it reaches toward an hour, the more of that kind's messages land then, with 06:00 at the top.`),
        sec("Findings",
          `Ward's method agrees with the lab on <b>${X.agreeD} of ${Dd.n}</b> days, about ${per100(X.agreeD, Dd.n)} in every 100. On days you logged, build days averaged productivity <b>${n2(Dd.kinds[1].productivity)}</b> against ${n2(Dd.kinds[0].productivity)} on quiet days, energy ${n2(Dd.kinds[1].energy)} against ${n2(Dd.kinds[0].energy)}, and mood ${n2(Dd.kinds[1].mood)} against ${n2(Dd.kinds[0].mood)}.`,
          `Build days are most common on ${wd[0][0]} (${pct(wd[0][1])} of them) and least common on ${wd[6][0]} (${pct(wd[6][1])}).`,
          `${K.claim("kinds-of-day-steady").sentence} A third group, if allowed, would take ${Dd.split.n} of the quiet days, with about ${Dd.split.prompts} messages each and an average productivity of ${n2(Dd.split.productivity)}.`,
        ),
        sec("What it means", K.tone("kinds-of-day-steady") === "held"
          ? "Two kinds of day is the right number to name, and the line between them holds across resamples, so a pace line on Home can name today's kind once it is clear."
          : K.tone("kinds-of-day-steady") === "no"
            ? "The days do not settle into two kinds, so Home should show today's volume against the usual day and name no kind."
            : "Two kinds of day is the right number to name, but the line between them should be drawn as a gradient. A day near the line is a day of middling volume, and many days are, so a pace line on Home should say how far into build-day territory today has gone, and never switch a label at a cutoff."),
        sec("Limitations", `How much weight to give a day's shape against its volume is a choice; with more weight on volume, the split would follow message counts alone. You logged scores on ${Dd.kinds[0].logged + Dd.kinds[1].logged} of the ${Dd.n} days, and days with fewer than ten messages are left out.`),
      ],
      notes: [
        { term: "06:00 to 06:00", kind: "why", text: "So a session that runs past midnight belongs to the day it began." },
        { term: "doubling always counts the same", kind: "term", text: "A logarithmic scale: each step multiplies the count by the same factor." },
      ],
    },
    atlas: A ? {
      lede: "Which days held your messages to Claude, and which of Sphere's sources were recording on each one.",
      sections: [
        sec("Introduction", "The Timeline on History lists events one at a time. An atlas asks the same record a different question: across all of it, which days held the work, and which sources were recording on each one? It is the page to read before trusting any finding that mixes sources, because a finding can only cover the days when all of its sources were switched on."),
        sec("Method and data collection",
          `Every calendar day from ${day(A.days[0])} to ${day(A.days[A.days.length - 1])}. Your messages to Claude are sorted three ways: calm ones; ones showing friction, meaning a swear, a frustrated word, ALL CAPS, a reversal (taking back an instruction), or a repeat (sending the same request again); and ones with praise.`,
          `Each source is one kind of record Sphere keeps, counted in records per day: ${list(A.sources.map((s) => `<b>${s.name}</b>, ${SRC[s.name] || "its own records"}`))}.`,
        ),
        sec("Presentation", "The top line is your attention: each day is as wide as its share of all your messages, with a small minimum so a quiet day still shows. Curves fall from each day's place on that line to its place on the real calendar below, where every day is the same width. Where curves spread out, a few days held much of the work; where they bunch, little happened. Under the calendar hang each day's messages, split into calm, friction, and praise. At the bottom is one row of dots per source: a dot means the source recorded at least one row that day, and a bigger dot means more, compared with that source's own busiest day."),
        sec("Findings",
          `You messaged Claude on ${srcFirst[0] ? srcFirst[0][2] : 0} of the ${A.days.length} days, and the busiest, ${F.day(A.days[busiest])}, held ${int(A.prompts[busiest])} messages.`,
          `Most of the house's own sources started much later: ${list(srcFirst.slice(1).filter(([, f]) => f >= 0).map(([nm, f, c]) => `${nm} on ${F.day(A.days[f])} (${c} day${c > 1 ? "s" : ""} so far)`))}.`,
        ),
        sec("What it means", "Most of the record is messages and the wellness log; the house's other readings are recent. Any finding that needs both rests on the last few weeks, and the atlas shows that at a glance. Pulse, the newest source, has its own row, and the History Timeline could give it the same row."),
        sec("Limitations", "A source's dots compare it only with itself, since some sources record every minute and others once a day. These are calendar days, midnight to midnight, while the kinds of day use 06:00 to 06:00."),
      ],
      notes: [{ term: "small minimum", kind: "why", text: "Without one, a day with no messages would vanish from the top line and its curve would have nowhere to start." }],
    } : undefined,
    lineage: {
      lede: `${pct(X.shareCC, 1)} of the programs your desktop starts trace back to Claude Code.`,
      sections: [
        sec("Introduction", "On Windows, every program is started by another program, its parent: a terminal starts a shell, the shell starts git, git starts ssh. Your desktop starts over a hundred thousand programs on a busy day. The data lab worked out who started each one, and this plate draws the first two generations of that family."),
        sec("Method and data collection", `Sphere records every program that starts, with an id number for the program and for its parent. The lab matched each start to its parent's most recent start, which found the parent for nearly every start${X.LIN.matched != null ? ` (${pct(X.LIN.matched, 1)})` : ""}, then counted starts by parent program and by each parent and child pair. Following the parents all the way up gives each start an ancestor, such as Claude Code, Sphere's own collector, or Windows itself.`),
        sec("Presentation", "The inner ring holds the parent programs, each as wide as its share of all starts. The outer ring splits each parent into the programs it started, sized the same way, so a thin piece is a rare child. The number in the middle is the share traced back to Claude Code through every generation, grandchildren included, so it is larger than any one piece of the ring."),
        sec("Findings", `${X.parents[0][0]} started <b>${int(X.parents[0][1])}</b> programs, ${pct(X.parents[0][1] / X.ptotal)} of all starts, ${X.kid(X.parents[0][0]) ? `most often another ${X.kid(X.parents[0][0])[1]} (${int(X.kid(X.parents[0][0])[2])} times)` : ""}. Bash is the command shell Claude Code runs its commands in, and bash scripts start more bash. ${X.parents[1][0]} started ${int(X.parents[1][1])} and ${X.parents[2][0]} ${int(X.parents[2][1])}.`),
        sec("What it means", K.holds("lineage-share")
          ? `${K.claim("lineage-share").sentence} So ${pct(X.shareCC)} of the programs the desktop starts descend from Claude Code, and the parents in the inner ring are mostly its shells and tools; the start count says nothing about how long each program ran.`
          : `${K.claim("lineage-share").sentence} The desktop's load is no longer mostly Claude Code's, so Home describes the load by program.`),
        sec("Limitations", `${X.linWindow.startsWith("from") ? `Starts logged ${X.linWindow}. ` : ""}A program id reused within moments could be matched to the wrong parent, and the few unmatched starts are left out.`),
      ],
      notes: [{ term: "nearly every start", kind: "context", text: "A program whose parent started before Sphere began recording has no parent record to match." }],
    },
    gauges: {
      lede: `${K.heads("mood-forecast", "energy-forecast")} ${K.claim("productivity-forecast").head}`,
      sections: [
        sec("Introduction", "If the computers knew how your day felt, a model should be able to forecast the mood, energy, and productivity you log from what the computers recorded. Two kinds of model tried. One is a random forest, which can catch patterns like \"mood drops only when sleep is short and messages are many\". The other is a simple weighted formula, ridge regression, the plain-arithmetic version."),
        sec("Method and data collection",
          `${mood.n} days you logged. For each, the models saw ${DAY_INPUTS}. A second version also saw yesterday's score. Logged sleep outside 2 to 14 hours was set aside as not a real night.`,
          "A random forest is hundreds of small flowcharts (decision trees), each built from a different random slice of the days, with the forecast being their average. The weighted formula is a sum, so much per message and so much per hour of sleep, kept deliberately simple so it cannot memorize the days.",
          "Each model was graded like a student on a fair exam: the days were split into five parts, the model learned from four and forecast the fifth, and the split rotated until every day had been forecast by a model that had never seen it. The whole exam was repeated ten times with different splits.",
        ),
        sec("Presentation", "The score on each dial, called R², compares the model with always predicting the average of the days it is tested on. Zero, at the top of the dial, means exactly that good; to the right is better, and to the left, in the shaded part, worse. No forecast could know that average in advance, so the fair guess, the average of the days the model learned from, already sits a little left of zero. The thick needle is the forest and the thin one the formula; each fan around a needle shows how much the score wobbled from one exam to the next. Below the dials, each day's logged score against the forest's forecast for it: a model that forecast well would line the dots up along the diagonal, while one that cannot draws them flat along the average."),
        sec("Findings",
          `Mood: the forest scores <b>${F.r2(mood.rf.r2)}</b> and the formula ${F.r2(mood.ridge.r2)}, even with yesterday's mood to go on; without it, ${F.r2(moodN.rf.r2)} and ${F.r2(moodN.ridge.r2)}. On a typical day the fair guess misses your logged mood by ${n2(mood.base ? mood.base.mae : mood.mean_mae)} points and the forest by ${n2(mood.rf.mae)}; that guess alone scores ${mood.base ? F.r2(mood.base.r2) : "n/a"} on the dial. ${K.claim("mood-forecast").sentence}`,
          `Energy: ${F.r2(energy.rf.r2)} and ${F.r2(energy.ridge.r2)}. Productivity: the forest scores ${F.r2(prod.rf.r2)} and the formula <b>${F.r2(prod.ridge.r2)}</b>, a step past the fair guess's ${prod.base ? F.r2(prod.base.r2) : "n/a"} when the test days are drawn at random. ${prod.skill ? `Its skill over the fair guess is ${n2(prod.skill[0])} of R², from ${n2(prod.skill[1])} to ${n2(prod.skill[2])} when whole weeks are resampled; this reads the day from its own records, so it says nothing about forecasting the day ahead.` : `Forecast forward in time, the forest misses by ${prod.forward ? n2(prod.forward.rf) : "n/a"} points and the guess by ${prod.forward ? n2(prod.forward.base) : "n/a"}.`} ${K.claim("energy-forecast").sentence}`,
        ),
        sec("What it means", [
          K.holds("mood-forecast") || K.holds("energy-forecast")
            ? `${K.heads("mood-forecast", "energy-forecast")} A forecast that held can appear in Sphere with its interval beside it.`
            : "The computers know how much you typed and little else about how the day felt. A mood or energy forecast anywhere in Sphere would be noise.",
          K.holds("productivity-forecast") ? "The productivity lean holds only on days drawn at random, too faint to show as anything more than the build-day and quiet-day comparison." : "Productivity shows no lean either, so the build-day and quiet-day comparison is the only place it appears.",
        ].join(" ")),
        sec("Limitations", `${mood.n} logged days is small for this kind of model, and a feeling can move for reasons no computer in the house records.`),
      ],
      notes: [
        { term: "random forest", kind: "term", text: "An ensemble of decision trees, each grown on a bootstrap sample of the days and a random subset of inputs; the forecast is their average." },
        { term: "ridge regression", kind: "term", text: "Linear regression with a penalty on large weights, which keeps it from fitting the training days too closely." },
        { term: "fair exam", kind: "term", text: "Five-fold cross-validation, repeated ten times: fifty scores per model, each on days the model never saw." },
        { term: "R²", kind: "term", text: "One minus the model's squared error divided by the squared error of predicting the test days' own average. Below zero means the model's errors are bigger than that average's." },
      ],
    },
    roses: {
      lede: "What each forecast leans on, measured on days the forest never saw.",
      sections: [
        sec("Introduction", "Even a forecast that fails can say which inputs it used. This plate asks, for each of the inputs in Plate VIII's study: if this one were scrambled, how much worse would the forecast get?"),
        sec("Method and data collection", "The inputs are the ones listed in Plate VIII's study: messages, frustration, praise, typing, commits, phone use, vault edits, hours in Claude, the time of your last message, sleep, exercise, sober days, and the day of the week. For each fair exam (five parts, four to learn from and one to forecast), the forest forecast the unseen days; then one input at a time was scrambled, its values shuffled between days so they no longer belong to the right day, and the forecast run again. How much worse it got is that input's importance. Measuring on unseen days matters, since on days it learned from, a forest can make any input look useful."),
        sec("Presentation", "Each rose has one petal per input, in the same place on all three roses, so the same petal can be compared across mood, productivity, and energy. A longer petal means scrambling that input hurt the forecast more, and a short blue stub means scrambling it did not hurt at all. The four longest petals carry their names."),
        sec("Findings", `Mood leans most on ${imps(mood)}. Productivity leans on ${imps(prod)}. Energy leans on ${imps(energy)}.`),
        sec("What it means", `What little the forests pick up comes first from ${list([...new Set([mood, prod, energy].map((e) => K.name(e.imp[0][0])))])}.${K.holds("productivity-forecast") ? ` Only productivity's forest holds against the fair guess, so its lean on ${K.name(prod.imp[0][0])} is the one worth reading; the mood and energy roses show what a failed forecast tried.` : " No forest here holds against the fair guess, so the roses show what failed forecasts tried, not what drives the scores."}`),
        sec("Limitations", "Inputs that move together share their credit. Messages, characters typed, and Claude's replies rise and fall as one, so scrambling one leaves the others to stand in, and each looks less important than the group is."),
      ],
      notes: [{ term: "scrambled", kind: "term", text: "Permutation importance: the drop in accuracy when one input's values are shuffled across days." }],
    },
    orbits: {
      lede: K.claim("cpu-next-hour").sentence,
      sections: [
        sec("Introduction", "If the desktop's load could be forecast, Home could warn you before a heavy hour. The simplest forecast is \"no change\": next hour will look like this hour. Any model worth showing has to beat that. The data lab tried three models on five-minute readings; this plate tries a random forest on hourly readings."),
        sec("Method and data collection", `The forest learned from ${Cp.n_train} hours and was then tested on the ${Cp.n_test} hours that came after, from ${F.hour(Cp.test_from.replace(" ", "T").slice(0, 13))} to ${F.hour(Cp.test_to.replace(" ", "T").slice(0, 13))}. For each hour it saw the desktop's CPU and memory that hour and your messages to Claude, the CPU an hour before, the CPU at the same hour the day before, and the hour and day of the week. Each forecaster is graded by how many CPU points it misses by on an average hour.`),
        sec("Presentation", "Each ring is one day from the test, with midnight at the top and the hours running clockwise. The desktop's actual CPU rides outside its ring in ink, further out when busier. The chosen forecast rides beside it in color, and the shaded band between them is how far off the forecast was. The switch above compares the four forecasters on the same hours."),
        sec("Findings", `On an average hour, the forest missed by <b>${n2(Cp.mae.rf)}</b> points, "no change" by ${n2(Cp.mae.persistence)}, the weighted formula by ${n2(Cp.mae.ridge)}, and "same hour yesterday" by ${n2(Cp.mae.yesterday)}. The forest's edge over "no change" is ${n2(Cp.gain.mean)} points, but rerunning the comparison on random stretches of the test hours puts the edge anywhere from ${n2(Cp.gain.lo)} to ${n2(Cp.gain.hi)}${Cp.gain.lo < 0 && Cp.gain.hi > 0 ? ": it could easily be zero" : Cp.gain.lo > 0 ? ", clear of zero" : ", below zero throughout"}.`),
        sec("What it means", K.holds("cpu-next-hour")
          ? "The forest's small edge holds, so Home can show the next hour's load as a lean with its interval beside it. The Next list on Home stays the schedule of routines, known to the minute."
          : `The desktop's load follows your Claude sessions, and sessions start when you do. No hourly model sees that coming: the forest misses by ${n2(Cp.mae.rf)} points and "no change" by ${n2(Cp.mae.persistence)}. That is why the Next list on Home stays the schedule of routines, known to the minute.`),
        sec("Limitations", `${Cp.n_test} test hours over about ${Math.round(Cp.n_test / 24)} days, where one busy evening can tip the comparison.`),
      ],
      notes: [
        { term: "\"no change\"", kind: "term", text: "Also called persistence: next hour's forecast is this hour's value. The baseline every forecast has to beat." },
        { term: "random stretches", kind: "term", text: `A paired block bootstrap: whole ${X.blockH}-hour stretches are resampled, and both forecasters are compared on the same stretches.` },
      ],
    },
    brush: {
      lede: `${K.claim("swear-ahead").head} ${K.claim("praise-ahead").head}`,
      sections: [
        sec("Introduction", "Frustration with Claude comes in runs. If so, the messages just before a swear should give it away, and a model should be able to say which messages are likely to carry one. Praise is the test of that idea: if praise also came in runs, it would be just as easy to see coming."),
        sec("Method and data collection",
          `${int(Pm.n)} messages you typed, in ${int(Pm.sessions)} sessions. Each message was marked for the signals it carries: a swear; friction, meaning any of a swear, a frustrated word, ALL CAPS, a reversal (taking back an instruction), or a repeat (sending the same request again); and praise.`,
          `For each message, the model saw only what came before it: ${PROMPT_INPUTS}. It learned from the days before ${day(Pm.test_from)} and was tested on the days after, so every message it rated was one it had never seen.`,
        ),
        sec("Presentation", "Every test message is one bristle, sorted around the circle from the one the model rated least likely to carry the signal to the one it rated most likely, and as long as the model's estimate. Gold bristles did carry it. If the model ranks well, the gold gathers at the end of the sweep; if it does no better than chance, the gold scatters evenly. The number at each tenth of the circle says how many times more often than usual that tenth carried the signal."),
        sec("Findings",
          `Take one message that swore and one that did not. The model rates the swearing one as likelier <b>${pct(swear.auc_rf[0])}</b> of the time; a coin flip would be right half the time (this score is called AUC, here ${swear.auc_rf[0].toFixed(2)}). The tenth of messages it rated likeliest swore ${pct(decRate(swear, 9), 1)} of the time, ${X.lift(swear).toFixed(1)} times the usual ${pct(swear.rate_test, 1)}, while the least likely tenth swore ${pct(decRate(swear, 0), 1)} of the time.`,
          (() => {
            const gap = Math.max(...[swear, fric, praise].map((t) => Math.abs(t.auc_lr[0] - t.auc_rf[0])));
            const rc = K.claim("swear-recent"), fc = K.claim("friction-recent");
            return `For friction of any kind, the same score is ${pct(fric.auc_rf[0])}. ${K.claim("praise-ahead").sentence} A plain weighted formula lands within ${n2(gap)} of the forest on all three.${rc.band === "insufficient" ? "" : ` ${rc.sentence}`}${fc.band === "insufficient" ? "" : ` For friction, ${fc.sentence.charAt(0).toLowerCase()}${fc.sentence.slice(1)}`}`;
          })(),
        ),
        sec("What it means", [
          K.holds("swear-ahead") || K.holds("friction-ahead") ? "The forest's likeliest tenth of prompts is where a cue would belong." : "The forest ranks no swear or friction prompt above chance, so no cue would land where it belongs.",
          K.holds("praise-ahead") ? "The forest ranks prompts with praise above the rest, so a cue could anticipate it." : "The forest does not rank prompts with praise above the rest, so nothing should try to anticipate it.",
        ].join(" ")),
        sec("Limitations", `The signals come from word lists, so a pasted error log or a quoted message can count as friction. Praise is rare: only ${praise.positives} test messages carried it.`),
      ],
      notes: [
        { term: "AUC", kind: "term", text: "Area under the ROC curve: the chance a random positive is ranked above a random negative. 0.5 is chance, 1 is perfect." },
        { term: "A plain weighted formula", kind: "term", text: "Logistic regression: a weighted sum of the inputs turned into a probability." },
      ],
    },
    patience: {
      lede: `${K.claim("friction-runs").head}${X.sit("the first in its session").friction[2] < X.sit("after a calm prompt").friction[1] ? " A new session starts calm." : ""}`,
      sections: [
        sec("Introduction", "The wellness log says how a day felt; the signals in your messages say how each exchange with Claude went. This plate sets them side by side, a week to a column, to see whether friction tracks the week or the message just before it."),
        sec("Method and data collection", `Weeks run Monday to Sunday, from ${day(X.firstDay)} to ${day(X.lastDay)}. For each week: the messages you typed; the session-days, meaning each Claude session counted once for each day it ran; how many messages carried each signal (a swear, a frustrated word, ALL CAPS, a reversal, a repeat, or praise; one message can carry more than one); and the average mood, energy, and productivity you logged that week. The figures in the findings below come from every message in the record, one message at a time.`),
        sec("Presentation", "Read across like sheet music. In each column, the hollow circle is the week's session-days and the filled circles its friction, swears, and praise, each sized against its own busiest week; the small bars beneath are the week's seven days, weekends darker. Below, each line is one signal's share of the week's messages, named where it peaks, and the dashed lines at the foot are your logged scores."),
        sec("Findings",
          `After a message with friction, your next message also carries friction <b>${pct(sitF.friction[0])}</b> of the time; after a calm one, ${pct(sitC.friction[0])}. After a swear, the next message swears ${pct(sitS.swear[0])} of the time. ${K.claim("friction-runs").head} A session's first message carries friction ${pct(first.friction[0], 1)} of the time${first.friction[2] < sitC.friction[1] ? ", so a new session starts calm" : ""}.`,
          `Replies sent within a minute of your last message carry friction ${pct(fast.friction[0], 1)} of the time; replies after 15 to 60 minutes, ${pct(slow.friction[0], 1)}. After praise, the next message praises ${pct(sitP.praise[0])} of the time, against ${pct(sitC.praise[0], 1)} after a calm one.`,
          worst && calmest ? `Among weeks of 100 messages or more, the week of ${F.day(worst.key)} carried the most friction, ${pct(worst.friction / worst.prompts, 1)} of ${int(worst.prompts)} messages, and the week of ${F.day(calmest.key)} the least, ${pct(calmest.friction / calmest.prompts, 1)} of ${int(calmest.prompts)}.` : "",
        ),
        sec("What it means", K.holds("friction-runs")
          ? `Friction follows the message before it more than the week: it clusters in runs${fast.friction[1] > slow.friction[2] ? " of quick, frustrated replies" : ""}${first.friction[2] < sitC.friction[1] ? " and drops with a new session" : ""}. A cue that slows a quick reply after a frustrated message would land on the messages where friction clusters.`
          : "Friction does not clearly follow the message before it, so a cue timed to a frustrated message would land no better than one at random."),
        sec("Limitations", "Light weeks swing widely, and the signals come from word lists, so a pasted error can read as frustration. Weekly scores average only the days you logged."),
      ],
      notes: [{ term: "session-days", kind: "term", text: "A session counted once for each day it ran, so one that crosses midnight counts twice." }],
    },
  });
})();
