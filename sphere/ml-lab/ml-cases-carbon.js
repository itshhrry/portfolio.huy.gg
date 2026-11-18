/* Case studies for Plates XIII to XV, the sheets of carbon's Sphere workspace, in the reader and voice of ml-cases.js. Every
   figure is counted from K.SCHEMA (ml-schema.js), K.LANES (ml-lanes.js), and window.SCHEMA_DATA, so the prose moves when
   the mirror's code or the counts do. Each margin note's term appears word for word in its study. */
"use strict";
(() => {
  const S = K.SCHEMA, SD = window.SCHEMA_DATA, LN = K.LANES, F = K.fmt;
  if (!S || !SD || !LN) return;
  const sec = (hh, ...p) => ({ h: hh, p: p.filter(Boolean) });
  const list = (a) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")}${a.length > 2 ? "," : ""} and ${a[a.length - 1]}`);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const md = (s) => `${MONTHS[+s.slice(5, 7) - 1]} ${+s.slice(8)}`;
  const gap = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
  const N = SD.days.length;
  const counts = (n) => (SD.sheets[n] ? SD.sheets[n].counts : []);
  const total = (n) => counts(n).reduce((a, b) => a + b, 0);
  const daysOn = (n) => counts(n).filter((v) => v > 0).length;
  const firstOf = (n) => { const i = counts(n).findIndex((v) => v > 0); return i < 0 ? null : SD.days[i]; };
  const peakOf = (n) => { const c = counts(n), mx = Math.max(0, ...c); return [mx, SD.days[c.indexOf(mx)]]; };
  // Days with a row per part: per machine on the host sheets, so the flower and the CPU gap can be named.
  const partDays = (n) => { const m = {}; (SD.sheets[n] ? SD.sheets[n].parts : []).forEach((p) => Object.entries(p || {}).forEach(([k, v]) => { if (v) m[k] = (m[k] || 0) + 1; })); return m; };
  const firstPart = (n, k) => SD.days.find((d, i) => ((SD.sheets[n].parts[i] || {})[k]));
  const parts = (p, k = 5) => Object.entries(p || {}).sort((a, b) => b[1] - a[1]).slice(0, k).map(([nm, v]) => `${nm.replace(/_/g, " ")} ${v}`);
  const MACHINE = { ellie: "ELLIE", pi: "the Pi", carbon: "carbon", router: "the router", pulse: "Pulse" };

  /* ---------- Plate XIII: the shape ---------- */
  const facts = S.SHEETS.filter((t) => t.role === "fact");
  const inbound = (n) => S.LINKS.filter((l) => l.to === n).length;
  const onBoth = facts.filter((t) => t.links.some((l) => l[1] === "Machines"));
  const dayOnly = facts.filter((t) => !onBoth.includes(t)).map((t) => t.name);
  const rollOn = (n) => S.ROLLUPS.filter((r) => r[0] === n).length;
  const mdB = LN.BUILT.find((g) => g.sheets.includes("Model Days"));

  /* ---------- Plate XIV: the calendar ---------- */
  const hostP = partDays("Host Days"), cpuP = partDays("Host CPU");
  const machineFams = ["host", "container", "endpoint", "event"];
  const machineFirsts = S.SHEETS.filter((t) => machineFams.includes(t.fam)).map((t) => firstOf(t.name)).filter(Boolean).sort();
  const [evMx, evDay] = peakOf("Events");
  const pulseFirst = firstPart("Host Days", "pulse"), piCpu = firstPart("Host CPU", "pi");
  const sheetNames = Object.keys(SD.sheets);
  const heaviest = sheetNames.map((n) => [n, peakOf(n)[0]]).sort((a, b) => b[1] - a[1])[0];
  const flower = Object.entries(hostP).sort((a, b) => b[1] - a[1]);

  /* ---------- Plate XV: the time machine ---------- */
  const made = LN.BUILT.filter((g) => g.day), queued = LN.BUILT.find((g) => !g.day);
  const builtN = made.reduce((a, g) => a + g.sheets.length, 0);
  const buildSpan = gap(made[0].day, made[made.length - 1].day);
  const quiet = Object.values(LN.PROF).filter((p) => !p.bursts.length).map((p) => p.sheet);
  const famOf = (sheet) => LN.FAMS.find((f) => f.sheets.includes(sheet));
  const featLine = (b, i) => `<b>${i + 1}.</b> ${b.sheet}${famOf(b.sheet).planned ? " (queued)" : ""}: <b>${F.int(b.peak)}</b> rows on ${md(SD.days[b.p])} against a usual ${F.num(b.med, b.med % 1 ? 1 : 0)}, ${b.ratio.toFixed(1)} times its usual day${b.parts ? `, made of ${list(parts(b.parts))}` : ""}.`;
  // What a burst means depends on what one row stands for on its sheet, so each family's reading is written for it.
  const WHY = {
    host: (b) => `On a host sheet a row is one machine's reading for one day, so a burst means more machines reported, not that more happened. On ${md(SD.days[b.p])} Host CPU had a row from ${list(Object.keys(b.parts || {}).map((k) => MACHINE[k] || k))}, against ELLIE alone on a usual day.`,
    event: (b) => `On the event sheets a row is one logged event, such as a warning, an action, or a status change, so a burst is a day with more events: ${F.int(b.peak)} events with a longer description on ${md(SD.days[b.p])}, by kind ${list(parts(b.parts))}.`,
    planned: (b) => `On Backup Runs a row is one run of one backup job, and a usual day is each job once. On ${md(SD.days[b.p])} the jobs ran ${list(parts(b.parts).map((s) => s.replace(/ (\d+)$/, (m, v) => (v === "1" ? " once" : ` ${v} times`))))}, which carbon would show once the queued Backup Runs sheet is built.`,
  };
  const why = LN.FEAT.map((b) => (WHY[famOf(b.sheet).key] || (() => null))(b)).filter(Boolean);
  const at3 = LN.BURSTS.filter((b) => b.ratio >= 3).length;
  const arcs = Object.values(LN.PROF).map((p) => { const g = made.find((m) => m.sheets.includes(p.sheet)); return g ? [p.sheet, gap(SD.days[p.first], g.day), g] : null; }).filter(Boolean).sort((a, b) => b[1] - a[1]);

  window.LAB_CASES = Object.assign(window.LAB_CASES || {}, {
    schema: {
      lede: `carbon's copy of Sphere is a galaxy schema: ${facts.length} fact sheets sharing two hubs, Days and Machines, and no fact sheet pointing at another.`,
      sections: [
        sec("Introduction",
          "carbon is the database appliance on the ASUS laptop, and part of its workspace is a copy of Sphere. The mirror, <code>collector/mirror.mjs</code> in the Sphere repo, writes Sphere's daily summaries into carbon as sheets: tables that look like spreadsheet tabs, where a cell can point at a row on another sheet the way a link on a web page points at another page.",
          "Which questions carbon can answer depends on those pointers. A reading that points at a day can be totaled by day, a reading that points at a machine can be totaled by machine, and a reading that points at neither can only be read as it stands. This plate draws every sheet and every pointer, to show what the copy can be asked.",
        ),
        sec("Method and data collection",
          "Nothing here was read from carbon itself. The shape was copied by hand from two files in the Sphere repo: <code>collector/mirror.mjs</code>, which builds every row the mirror sends, and <code>collector/carbon/create_tables.py</code>, which makes the sheets and their summary columns. The plate shows the shape the code builds, and it changes only when those files do.",
          `Four words carry the plate. <b>A dimension</b> is a list of things a reading can be about: Days holds one row per date, and Machines one row for each of ELLIE, the Pi, carbon, the MikroTik router, and Pulse. <b>A fact sheet</b> holds readings, one per row, each for one day and usually one machine, container, or service; a Host CPU row is one machine's average processor use on one day.`,
          `<b>A link field</b> is a cell that points at a row on another sheet. Every fact sheet has a Day link, and most also have a Machine link. <b>A rollup</b> is a column on a dimension that summarizes the facts pointing at it, such as Days' Avg Host CPU, the average of every Host CPU row that points at that date.`,
          `From the two files the plate lists ${S.SHEETS.length} sheets, ${S.LINKS.length} link fields, and ${S.ROLLUPS.length} rollups, and counts for each sheet which sheets point at it.`,
        ),
        sec("Presentation",
          `Days sits at the center and the ${facts.length} fact sheets ring it, one dot each. A line from a dot inward is its Day link; a short tick outward is its Machine link, and Machines is the band those ticks reach. Outside the band hang the sheets that are not facts: Containers and Services, two lists of things that each belong to a machine (snowflaked: split off Machines into sheets of their own), Service Containers, which pairs them, Event Details, which belongs to Events, and Models, the list of models that Model Days points at. Dashed marks are sheets the queue plans to add.`,
          `The arrowed spokes are the links a rollup reads back to Days, each labeled with what it computes. Point at a sheet for its fields and the sphere.db table its rows come from; point at Days or at the Machines band for every rollup it carries, written out as what it reads and how. Click a sheet to keep it lit while you read.`,
        ),
        sec("Findings",
          `${S.SHEETS.length} sheets carry <b>${S.LINKS.length}</b> link fields. Machines receives <b>${inbound("Machines")}</b> and Days <b>${inbound("Days")}</b>, so the schema has two hubs of nearly the same weight. ${onBoth.length} of the ${facts.length} fact sheets point at both; ${list(dayOnly)} point${dayOnly.length === 1 ? "s" : ""} at Days alone, since Claude's usage belongs to no one machine.`,
          "No fact sheet points at another fact sheet. The one sheet that points at a fact is Event Details, which holds the longer text of an event and belongs to it. The only closed loops are triangles: Container Days points at a container and at a machine, and the container points at the same machine. Both paths are written from the same constants in mirror.mjs, so they cannot disagree.",
          `${S.ROLLUPS.length} rollups summarize the facts back onto their dimensions: ${rollOn("Days")} on Days, ${rollOn("Machines")} on Machines, ${rollOn("Containers")} on Containers, ${rollOn("Services")} on Services, and ${rollOn("Models")} on Models.`,
        ),
        sec("What it means",
          "A question of the form \"how did this day go\" or \"how did this machine do\" is one step in carbon: open the Days row or the Machines row, and its rollups hold the answer. A question that crosses two kinds of reading, such as whether a heavy day of Claude use was a hot day for the Pi, goes through Days, since both sheets point at the same date. A galaxy schema fits this data because every source Sphere watches reports by day and all but Claude's telemetry report by machine, so two shared dimensions answer every by-day and by-machine question.",
          `Models holds each model's all-time totals and has no Day or Machine link of its own. Model Days, built in ${mdB.ref} on ${md(mdB.day)}, puts a model on a date with one row per model per closed day, so carbon can say which model was used on which date, count the models a day used, and give a model its days active and its average and peak daily output.`,
        ),
        sec("Limitations",
          "The shape is the code's, not the workspace's. A sheet or column added by hand inside carbon would not appear here, and neither would a mirror run that failed.",
          "Model Days keeps the synthetic model's rows, which carry messages and no tokens, so a day's Models Used counts the synthetic entry as one of its models.",
          "A link drawn is a link the mirror writes. How many rows travel along it is Plate XIV's question.",
        ),
      ],
      notes: [
        { term: "galaxy schema", kind: "term", text: "Also called a fact constellation: more than one fact table sharing the same dimension tables. A star schema has one fact table in the middle." },
        { term: "snowflaked", kind: "term", text: "A snowflake schema splits a dimension into smaller tables that point back at it, as Containers and Services point at Machines." },
        { term: "A rollup", kind: "term", text: "carbon's name for a summary column that reads through a link: an average, sum, minimum, maximum, or count over the linked rows." },
      ],
    },

    loom: {
      lede: `carbon's sheets start on different days: Claude's telemetry reaches back to ${md(firstOf("Telemetry Days"))}, and every machine sheet starts between ${md(machineFirsts[0])} and ${md(machineFirsts[machineFirsts.length - 1])}.`,
      sections: [
        sec("Introduction",
          "Plate XIII shows how the sheets point at each other. This plate shows what each one holds, day by day. Every sheet that points at Days is drawn on a calendar, so the drawing answers two questions at once: how far back each sheet's history reaches, and on which days it has rows at all.",
          "That matters because a sheet with no row on a day says nothing about that day. A gap in Host CPU means no machine sent a processor reading that day, not that the processor sat idle.",
        ),
        sec("Method and data collection",
          `<code>schema_data.py</code>, a step of the nightly ML build, counted, for each sheet and each of the ${N} days from ${md(SD.first)} to ${md(SD.last)}, the rows the mirror writes, by applying mirror.mjs's own rules to sphere.db, opened read-only, and to dash.json. carbon itself was not read, so a count here is what the mirror sends, which matches what carbon holds up to the mirror's last run.`,
          "Each day's count was also split into its parts: by machine on the host sheets, by kind on the event sheets, and by job on Backup Runs, so the plate can say what a heavy day was made of.",
          `The flower in the center counts, for each machine, the days Host Days has a row for it: ${list(flower.map(([k, v]) => `${MACHINE[k] || k} ${v}`))}.`,
        ),
        sec("Presentation",
          `The ring is Days: ${N} dates running clockwise from ${md(SD.first)} at the top, with a tick where each month begins. Each track around it is one sheet, Claude telemetry outermost, then events, hosts, containers, and endpoints, with the planned sheets innermost and dashed. A mark on a track is one day's rows on that sheet, and the chips where a track begins name what it points at besides Days.`,
          `Every mark is drawn against its own sheet's busiest day, so a sheet with one row a day and a sheet with a hundred both fill their track. Pointing at a day gives its rows twice: as a share of that sheet's busiest day, and as a share of the busiest day on any sheet, ${heaviest[1]} rows on ${heaviest[0]}, ${md(peakOf(heaviest[0])[1])}.`,
          "A faded mark is a row the mirror has not sent yet. The flower's petals are as long as each machine's days with readings, measured against rings every 10 days. Click a track to keep it lit with a spoke to its name.",
        ),
        sec("Findings",
          `Telemetry Days covers <b>${daysOn("Telemetry Days")}</b> of the ${N} days, the longest history in carbon, because Claude's usage was being counted months before Sphere's collector began keeping machine readings. The host, container, endpoint, and event sheets start between ${md(machineFirsts[0])} and ${md(machineFirsts[machineFirsts.length - 1])}, when sphere.db began keeping daily rollups and events.`,
          `Host Days holds <b>${F.int(total("Host Days"))}</b> rows and Host CPU <b>${F.int(total("Host CPU"))}</b>. ELLIE sent a processor reading on all ${cpuP.ellie} of its days, while the Pi and carbon sent one on ${cpuP.pi === cpuP.carbon && hostP.pi === hostP.carbon ? `${cpuP.pi} of their ${hostP.pi} days each` : `${cpuP.pi} and ${cpuP.carbon} of their ${hostP.pi} and ${hostP.carbon} days`}, so the CPU track thins where Host Days stays full.`,
          `Events peaks at <b>${evMx}</b> rows on ${md(evDay)}, and Event Details carries the ${F.int(total("Event Details"))} of ${F.int(total("Events"))} events that have a longer description. No other sheet comes close: at their busiest, Host CPU holds ${peakOf("Host CPU")[0]} rows and Container Days ${peakOf("Container Days")[0]}.`,
          pulseFirst ? `ELLIE's petal is the longest at ${hostP.ellie} days, and Pulse's the shortest at ${hostP.pulse}, since the laptop's link first reported on ${md(pulseFirst)}.` : null,
        ),
        sec("What it means",
          `A question about Claude use in carbon can go back to ${md(firstOf("Telemetry Days"))}; a question about the machines only to ${md(machineFirsts[0])}${piCpu ? `, and about processor use on the Pi or carbon only to ${md(piCpu)}` : ""}. A chart in carbon that plots a machine's reading should start each line where that machine's rows start, and never read the empty months as zero.`,
          "The tracks answer on which days a sheet has rows; the hover card answers how many rows that is next to the other sheets.",
        ),
        sec("Limitations",
          `The counts come from the mirror's rules applied to sphere.db, not from rows read out of carbon, so a mirror run that failed partway would leave carbon short of what this plate shows. carbon holds the daily sheets through ${md(SD.bookmarks.day)}, Claude telemetry through ${md(SD.bookmarks.tday)}, and events through id ${SD.bookmarks.event_id}.`,
          "The planned sheets are counted from the tables they would read, by the rules their queue entries propose, so their tracks show what they would hold once built.",
          `The count stops at days ending before ${md(SD.snapshot)}.`,
        ),
      ],
      notes: [
        { term: "its own sheet's busiest day", kind: "term", text: "Scaling each track to its own largest value is called normalizing. It makes shapes comparable and hides size, which the hover card's second share restores." },
        { term: "opened read-only", kind: "context", text: "sphere.db is opened with mode=ro and query_only, so the count can never change the live database." },
      ],
    },

    lanes: {
      lede: `carbon's sheets were written across ${buildSpan} days of commits and hold ${Math.round(gap(SD.first, SD.last) / 30.4)} months of days, and in those months a sheet ran at twice its usual day or more ${LN.BURSTS.length} times.`,
      sections: [
        sec("Introduction",
          "Plates XIII and XIV show the sheets as they are. This plate shows them in time, twice over: when each sheet was built, and when its rows ran unusually high. It borrows two forms from Accurat's pieces for La Lettura: \"Art movie time machine\", which drew each film as an arc from the year it was made to the year it was set in, and \"Crazy market bubbles\", which drew each market bubble as a circle rising from the day it peaked.",
          `On this plate each arc is one carbon sheet, running from the commit that built it, in September or October, back to the first day its rows describe, as early as ${md(SD.first)}. Each bubble is a <b>burst</b>: a run of days when a sheet carried twice its usual rows or more.`,
        ),
        sec("Method and data collection",
          `A sheet's build day is the commit that first wrote it into create_tables.py or mirror.mjs, found with git log -S, which searches the repo's history for the commit that added a given piece of text. ${made.length} commits built ${builtN} sheets: ${list(made.map((g) => `${g.ref} on ${md(g.day)} (${g.sheets.length} sheet${g.sheets.length > 1 ? "s" : ""})`))}.${queued ? ` The planned sheets have no commit yet and stand on their queue entry, ${queued.ref}.` : ""}`,
          "A sheet's usual day is the middle value of its days with rows, the median, so unusual days cannot move it. A burst begins on the first day at twice the usual day or more and ends on the last such day in an unbroken run. Its height is its peak day divided by the usual day, and its size is the rows across the run. The row counts are Plate XIV's.",
        ),
        sec("Presentation",
          "Below the middle rail, each sheet stands on the commit that built it, and an arc leaves its foot and lands on the upper rail at the first day its rows describe. The farther an arc leans left, the older its first row is than the sheet. Under each foot hang three marks: a bar for its rows, a dot for each dimension it points at besides Days, and a letter for the table it reads (h for host_rollups, c for container_rollups, e for endpoint_rollups, v for events, d for dash.json).",
          "Above the rail, each bubble is one burst, placed across by its peak day, up by how many times its usual day it reached, and colored by its sheet's family. The tallest burst in each family carries a numbered ring, explained in the notes beneath the plates. The upper rail is itself a chart, one stream per family showing its rows each day.",
          `The zigzags on the rail are breaks in the time scale. The days before ${md(machineFirsts[0])} share a quarter of the width and the rest of September an eighth, so October, where nearly every burst falls, gets the room. Distances across a break are not to scale. Click a foot, an arc, or a bubble to keep that sheet and dim the rest.`,
        ),
        sec("Findings",
          `${LN.BURSTS.length} bursts across ${Object.keys(LN.PROF).length} sheets. The tallest in each family:`,
          ...LN.FEAT.map(featLine),
          `${quiet.length} sheets never burst: ${list(quiet)}.`,
          arcs.length ? `The longest arc is ${arcs[0][0]}, built ${md(arcs[0][2].day)} and reaching back ${arcs[0][1]} days to ${md(SD.days[LN.PROF[arcs[0][0]].first])}. The shortest is ${arcs[arcs.length - 1][0]}, at ${arcs[arcs.length - 1][1]} days.` : null,
        ),
        sec("What it means",
          "A burst means different things on different sheets, and its parts tell which.",
          ...why,
          `Every sheet was written within ${buildSpan} days and filled with rows Sphere had already kept, so a chart in carbon can start up to ${arcs.length ? arcs[0][1] : 0} days before the commit that built its sheet. The ${quiet.length} sheets that never burst write one row per machine, service, or day, so their count stays at its usual level until a new machine, service, or job starts writing to them.`,
        ),
        sec("Limitations",
          `Twice the usual day is a chosen line. At three times, ${at3} of the ${LN.BURSTS.length} bursts remain.`,
          "git log -S dates a sheet by the first commit that added its name, so a sheet renamed after it was built would date from the rename.",
          "The breaks in the scale make an arc that crosses one shorter than the days it spans, so compare arcs by the dates at their ends, not by their lengths.",
        ),
      ],
      notes: [
        { term: "git log -S", kind: "term", text: "Git's pickaxe search: it lists the commits that changed how many times a piece of text appears, so the earliest is where the text was added." },
        { term: "the median", kind: "term", text: "The middle value once the days are sorted. Half the days sit above it and half below, and one huge day moves it no more than any other day." },
        { term: "La Lettura", kind: "context", text: "The cultural supplement of Corriere della Sera, for which Accurat drew a series of data pieces. Both forms are carded in the Research Hub's data visualization library." },
      ],
    },
  });
})();
