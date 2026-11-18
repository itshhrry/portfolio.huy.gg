/* Plate XIII, the sheets of carbon's Sphere workspace: Days at the center, the fact sheets on a ring around it, the Machines
   dimension as the band that encloses them, and the snowflaked, bridge, detail, Models, and planned sheets outside. The
   shape is transcribed from F:/Projects/sphere/collector/mirror.mjs (buildPayload) and collector/carbon/create_tables.py
   (SPEC, ROLLUPS), never read from the live workspace, so it changes only when those files do. */
"use strict";
(() => {
  const { svg, h, text } = L;
  const TAU = K.TAU, F = K.fmt;
  const fx = (v) => v.toFixed(1);

  const FAM = {
    host: { name: "Hosts", color: "var(--c2)", src: "host_rollups, day grain", short: "host_rollups" },
    container: { name: "Containers", color: "var(--c1)", src: "container_rollups, day grain", short: "container_rollups" },
    endpoint: { name: "Endpoints", color: "var(--c3)", src: "endpoint_rollups, day grain", short: "endpoint_rollups" },
    event: { name: "Events", color: "var(--hot)", src: "events, past the mirror's bookmark", short: "events" },
    telemetry: { name: "Claude telemetry", color: "var(--muted)", src: "dash.json, telemetry.days", short: "dash.json" },
    planned: { name: "Planned", color: "var(--faint)", src: "wellness_days, pull_runs, daily_totals", short: "planned" },
  };
  // One entry per sheet. links: [field, target sheet]; fields: the value columns beside Key and the links.
  const fact = (name, fam, src, fields, extra = []) => ({ name, role: "fact", fam, src, fields, links: [["Day", "Days"], ["Machine", "Machines"], ...extra] });
  const SHEETS = [
    { name: "Days", role: "dimension", src: "every date a fact row carries", fields: ["Date", "Avg Host CPU", "Avg Container Uptime %", "Event Count", "Total Tokens In", "Total Tokens Out"], links: [] },
    { name: "Machines", role: "dimension", src: "MACHINES in mirror.mjs, 5 rows: ELLIE, Pi, carbon, MikroTik, Pulse", fields: ["Name", "Role", "Avg Uptime %", "Avg CPU %", "Max Temp °C", "Avg Memory %", "Max Disk %", "Event Count", "Containers"], links: [] },
    { name: "Containers", role: "snowflake", src: "container_rollups names and container event subjects", fields: ["Avg Uptime %", "Min Uptime %", "Services"], links: [["Machine", "Machines"]] },
    { name: "Services", role: "snowflake", src: "SERVED_BY in mirror.mjs, 7 rows", fields: ["Avg Uptime %", "Avg P95 ms", "Max P95 ms", "Min Cert Days"], links: [["Machine", "Machines"]] },
    { name: "Service Containers", role: "bridge", src: "SERVICE_CONTAINER in mirror.mjs, 5 rows", fields: [], links: [["Service", "Services"], ["Container", "Containers"]] },
    fact("Host Days", "host", "host_rollups up_n / n", ["Date", "Up %"]),
    fact("Host CPU", "host", "host_rollups.cpu_pct", ["Date", "Value"]),
    fact("Host Load", "host", "host_rollups.load1", ["Date", "Value"]),
    fact("Host Disk", "host", "host_rollups.disk_pct", ["Date", "Value"]),
    fact("Host Temp", "host", "host_rollups.temp_c", ["Date", "Value"]),
    fact("Host Memory", "host", "host_rollups.mem_pct", ["Date", "Value"]),
    fact("Container Days", "container", "container_rollups running_n / n", ["Date", "Up %"], [["Container", "Containers"]]),
    fact("Endpoint Days", "endpoint", "endpoint_rollups up_n / n", ["Date", "Up %"], [["Service", "Services"]]),
    fact("Endpoint Latency", "endpoint", "endpoint_rollups.p50, p95", ["Date", "P50 ms", "P95 ms"], [["Service", "Services"]]),
    fact("Endpoint Certs", "endpoint", "endpoint_rollups.cert_days", ["Date", "Cert days"], [["Service", "Services"]]),
    fact("Events", "event", "events, each row past m:carbon_last_event_id", ["Time", "Kind", "Source", "Message", "Subject", "Subject kind"]),
    { name: "Event Details", role: "detail", fam: "event", src: "events.detail, where set", fields: ["Detail"], links: [["Event", "Events"]] },
    { name: "Telemetry Days", role: "fact", fam: "telemetry", src: "dash.json telemetry.days", fields: ["Date", "Cost USD", "Saved USD", "Tokens in", "Tokens out", "Messages", "Tool calls", "Errors"], links: [["Day", "Days"]] },
    { name: "Model Days", role: "fact", fam: "telemetry", src: "dash.json telemetry.days, one row per cleaned model name per closed day", fields: ["Date", "Tokens in", "Tokens out", "Messages", "Errors"], links: [["Day", "Days"], ["Model", "Models"]] },
    { name: "Models", role: "dimension", fam: "telemetry", src: "dash.json telemetry.models, all-time totals per model", fields: ["Tokens in", "Tokens out", "Cache read", "Cache write", "Messages", "Errors"], links: [] },
  ];
  const PLANNED = [
    { name: "Wellness Days", entry: "queued", src: "wellness_days: mood, energy, productivity, with Sleep, Exercise, Sober, Screen Time, and Feelings as sheets of their own", links: [["Day", "Days"]] },
    { name: "Backup Runs", entry: "queued", src: "pull_runs: carbon-restic, pi-restic, pi-media", links: [["Day", "Days"], ["Machine", "Machines"]] },
    { name: "Prompt Days", entry: "queued", src: "daily_totals where source = 'prompts', with Prompt Minutes beside it", links: [["Day", "Days"], ["Model", "Models"]] },
  ];
  // Every rollup create_tables.py makes: the sheet it sits on, its name, the sheet it reads through, the column, the
  // aggregate, and the short label Plate XIII writes on a Days spoke.
  const ROLLUPS = [
    ["Days", "Avg Host CPU", "Host CPU", "Value", "AVG", "avg CPU"], ["Days", "Avg Container Uptime %", "Container Days", "Up %", "AVG", "avg uptime"],
    ["Days", "Event Count", "Events", "rows", "COUNT", "count"], ["Days", "Total Tokens In", "Telemetry Days", "Tokens in", "SUM", "sum tokens"],
    ["Days", "Total Tokens Out", "Telemetry Days", "Tokens out", "SUM", null],
    ["Machines", "Avg Uptime %", "Host Days", "Up %", "AVG"], ["Machines", "Avg CPU %", "Host CPU", "Value", "AVG"], ["Machines", "Max Temp °C", "Host Temp", "Value", "MAX"],
    ["Machines", "Avg Memory %", "Host Memory", "Value", "AVG"], ["Machines", "Max Disk %", "Host Disk", "Value", "MAX"], ["Machines", "Event Count", "Events", "rows", "COUNT"],
    ["Machines", "Containers", "Containers", "rows", "COUNT"],
    ["Containers", "Avg Uptime %", "Container Days", "Up %", "AVG"], ["Containers", "Min Uptime %", "Container Days", "Up %", "MIN"], ["Containers", "Services", "Service Containers", "rows", "COUNT"],
    ["Services", "Avg Uptime %", "Endpoint Days", "Up %", "AVG"], ["Services", "Avg P95 ms", "Endpoint Latency", "P95 ms", "AVG"], ["Services", "Max P95 ms", "Endpoint Latency", "P95 ms", "MAX"],
    ["Services", "Min Cert Days", "Endpoint Certs", "Cert days", "MIN"],
    ["Days", "Models Used", "Model Days", "rows", "COUNT", "models used"], ["Days", "Top Model Tokens Out", "Model Days", "Tokens out", "MAX"],
    ["Models", "Days Active", "Model Days", "rows", "COUNT"], ["Models", "Avg Daily Tokens Out", "Model Days", "Tokens out", "AVG"], ["Models", "Peak Day Tokens Out", "Model Days", "Tokens out", "MAX"],
  ];
  const rollupsOn = (t) => ROLLUPS.filter((r) => r[0] === t);
  const AGG = { AVG: "the average of", SUM: "the sum of", MIN: "the lowest of", MAX: "the highest of", COUNT: "the count of" };
  const by = Object.fromEntries(SHEETS.map((t) => [t.name, t]));
  const LINKS = SHEETS.flatMap((t) => t.links.map(([field, to]) => ({ from: t.name, field, to })));
  const inbound = (n) => LINKS.filter((l) => l.to === n).length;
  const FACTS = SHEETS.filter((t) => t.role === "fact");
  const ROLE = { dimension: "dimension", snowflake: "dimension, snowflaked off Machines", bridge: "bridge between two dimensions", fact: "fact sheet", detail: "child of a fact sheet", planned: "planned" };
  K.SCHEMA = { SHEETS, LINKS, PLANNED, ROLLUPS, FAM };

  /* ---------- The copy, counted from the lists above ---------- */
  const machineFacts = FACTS.filter((t) => t.links.some((l) => l[1] === "Machines")).length;
  K.set("schema-meta", `${SHEETS.length} sheets, ${LINKS.length} link fields, from collector/mirror.mjs`);
  K.set("schema-desc", `A galaxy schema, also called a fact constellation, is a star schema with more than one fact table built on the same dimension tables. Here ${FACTS.length} fact sheets share two dimensions, Days and Machines. Each dot on the ring is a fact sheet: one reading per row, for one day and one machine, container, or service. Every fact sheet links inward to <b>Days</b>, and ${machineFacts} of the ${FACTS.length} also link outward to <b>Machines</b>, the band around them. Containers and Services hang off Machines, Service Containers joins those two, Event Details hangs off Events, and Models, the dimension Model Days points at, gives each model's all-time totals a day-by-day companion.`);
  K.set("schema-howto", "A line inward is a Day link, and a short tick outward is a Machine link. A brighter spoke with an arrow is one that Days summarizes back across its own link. Dashed marks are sheets the queue plans to add. Point at a sheet to see its fields and where its rows come from in sphere.db.");
  K.set("schema-src", "Transcribed from collector/mirror.mjs and collector/carbon/create_tables.py in F:/Projects/sphere; the live carbon workspace was not read.");
  K.ev("schema-ev", [
    `<b>${SHEETS.length}</b> sheets carry <b>${LINKS.length}</b> link fields. Machines takes ${inbound("Machines")} of them and Days ${inbound("Days")}, so the schema has two hubs of nearly equal weight. Carbon gives each link field made through its API a <code><field> summary</code> column beside it on the same sheet; create_tables.py deletes those, since each one counted a single linked row.`,
    `A reading a source can leave unset gets a sheet of its own (Host CPU, Host Load, Host Disk, Host Temp, Host Memory, Endpoint Latency, Endpoint Certs), so a reading never taken is a missing row and never an empty cell.`,
    `Container and endpoint sheets reach Machines twice, once directly and once through Containers or Services. Both paths are written from the same constants in mirror.mjs, SERVED_BY and each container's host prefix, so the two cannot disagree.`,
    `No fact sheet links to another fact sheet, and the one sheet that points at a fact is Event Details, a child of Events. Facts never chain into a ring or cross-link into a mesh; the only closed paths are those triangles to Machines.`,
    `${ROLLUPS.length} rollups summarize the fact sheets back across the links that point at a dimension: Days carries ${rollupsOn("Days").length} (${rollupsOn("Days").map((r) => r[1]).join(", ")}), Machines ${rollupsOn("Machines").length}, Containers ${rollupsOn("Containers").length}, and Services ${rollupsOn("Services").length}.`,
    `Models holds all-time totals per model with no Day and no Machine of its own. Model Days gives each model one row per closed day, so Days counts the models that ran and reports the busiest model's output, and Models counts its days active and its average and peak daily output.`,
  ]);
  // A drawing of the mirror's own constants, not a finding from the run, so its badge says what was counted.
  K.anchor("schema-anchor", { cls: "inf", word: "Mapped", small: window.SCHEMA_DATA ? `two hubs; rows back to ${F.day(window.SCHEMA_DATA.first)}` : "two hubs" }, { head: "What would change the shape", text: "A queued change adds wellness, prompt, and backup sheets on the same Days rows, so the schema keeps its two hubs and gains three fact sheets. Model Days already gives Models its Day, so no sheet is left unlinked." });

  /* ---------- The side column's sample: one hub, one fact sheet, one stretch of the Machines band ---------- */
  function sample() {
    const el = document.getElementById("schema-sample");
    if (!el) return;
    el.replaceChildren();
    const s = svg("svg", { viewBox: "0 0 280 128", "aria-hidden": "true" }, el);
    svg("circle", { cx: 34, cy: 64, r: 20, fill: "var(--panel2)", stroke: "var(--ink)", "stroke-width": 1.4 }, s);
    text(s, 34, 68, "Days", "ink", { "text-anchor": "middle" });
    svg("line", { x1: 54, y1: 64, x2: 140, y2: 64, stroke: "var(--c2)", "stroke-width": 1.4 }, s);
    svg("circle", { cx: 150, cy: 64, r: 9, fill: "var(--c2)" }, s);
    svg("line", { x1: 159, y1: 64, x2: 214, y2: 64, stroke: "var(--c2)", "stroke-width": 1.4 }, s);
    svg("path", { d: "M222 14Q238 64 222 114", fill: "none", stroke: "var(--acc)", "stroke-width": 7, opacity: 0.55 }, s);
    svg("path", { class: "lead", d: "M96 64L96 30" }, s); text(s, 96, 24, "a Day link", "", { "text-anchor": "middle" });
    svg("path", { class: "lead", d: "M150 73L150 104" }, s); text(s, 150, 118, "a fact sheet", "ink", { "text-anchor": "middle" });
    svg("path", { class: "lead", d: "M186 64L186 30" }, s); text(s, 206, 24, "a Machine link", "", { "text-anchor": "end" });
    text(s, 236, 68, "Machines", "", { "text-anchor": "start" });
  }

  function legend() {
    const lg = document.getElementById("schema-legend");
    if (!lg) return;
    lg.replaceChildren();
    ["host", "container", "endpoint", "event", "telemetry"].forEach((k) => { const sp = h("span", {}, lg); h("i", { style: `background:${FAM[k].color}` }, sp); sp.append(FAM[k].name); });
    const d = h("span", {}, lg); h("i", { class: "ring" }, d); d.append("a dimension");
    const p = h("span", {}, lg); h("i", { class: "dash" }, p); p.append("planned");
  }

  /* ---------- Plate XIII ---------- */
  function schemaPlate(node) {
    node.replaceChildren();
    const W = Math.round(K.clamp(L.width(node, 820), 360, 860)), C = W / 2, R = C * 0.92;
    const s = svg("svg", { viewBox: `0 0 ${W} ${W}`, role: "img", tabindex: 0, class: "sch", "aria-label": `carbon's Sphere workspace as a galaxy schema: Days at the center, ${FACTS.length} fact sheets on a ring linked to it, the Machines dimension as a band around them, and Containers, Services, Service Containers, Event Details, Models, and three planned sheets outside.` }, node);
    const defs = svg("defs", {}, s);
    const mk = svg("marker", { id: "sch-arrow", viewBox: "0 0 8 8", refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
    svg("path", { d: "M0 0L8 4L0 8Z", fill: "var(--acc)" }, mk);

    // Slots around the ring, clockwise from twelve o'clock, with a gap between families.
    const ORDER = ["host", "container", "endpoint", "event", "telemetry", "planned"], GAP = 0.7;
    const ringOf = (k) => (k === "planned" ? PLANNED : FACTS.filter((t) => t.fam === k));
    const units = ORDER.reduce((a, k) => a + ringOf(k).length + GAP, 0), U = TAU / units;
    const ang = {}, span = {};
    let u = GAP / 2;
    ORDER.forEach((k) => { const n = ringOf(k).length; span[k] = [u * U, (u + n) * U]; ringOf(k).forEach((t, i) => { ang[t.name] = (u + i + 0.5) * U; }); u += n + GAP; });
    const rD = R * 0.13, rF = R * 0.47, nr = K.clamp(R * 0.035, 8, 13), rM = R * 0.68, band = Math.max(5, R * 0.028), rO = R * 0.8;
    const P = (r, a) => K.pt(C, C, r, a);
    const mid = (k) => (span[k][0] + span[k][1]) / 2;
    ang.Containers = ang["Container Days"]; ang.Services = mid("endpoint");
    ang["Service Containers"] = (ang.Containers + ang.Services) / 2;
    ang["Event Details"] = ang.Events - 0.85 * U;
    ang.Models = ang["Model Days"] + 0.85 * U;
    const pos = { Days: [C, C] };
    FACTS.forEach((t) => { pos[t.name] = P(rF, ang[t.name]); });
    PLANNED.forEach((t) => { pos[t.name] = P(rF, ang[t.name]); });
    ["Containers", "Services", "Service Containers", "Models"].forEach((n) => { pos[n] = P(rO, ang[n]); });
    pos["Event Details"] = P(R * 0.3, ang["Event Details"]);
    const colorOf = (n) => (by[n] && by[n].fam ? FAM[by[n].fam].color : "var(--acc)");

    const gArc = svg("g", {}, s), gL = svg("g", {}, s), gN = svg("g", {}, s), gT = svg("g", {}, s);
    const links = [], nodes = {};
    let order = 0;
    const link = (a, b, d, cls, color, extra = {}) => {
      // style goes first: L.svg writes a var() stroke as an inline style, which a later style attribute would erase.
    const el = svg("path", { style: `--d:${(order++ * 22) % 900}ms`, d, class: `lk ${cls}`, stroke: color, pathLength: 1, ...extra }, gL);
      links.push({ a, b, el });
      return el;
    };
    const line = (p, q) => `M${fx(p[0])} ${fx(p[1])}L${fx(q[0])} ${fx(q[1])}`;
    const bend = (p, q, aOff) => { const am = Math.atan2(((p[0] + q[0]) / 2) - C, -(((p[1] + q[1]) / 2) - C)), rm = Math.hypot((p[0] + q[0]) / 2 - C, (p[1] + q[1]) / 2 - C), c = P(rm, am + aOff); return `M${fx(p[0])} ${fx(p[1])}Q${fx(c[0])} ${fx(c[1])} ${fx(q[0])} ${fx(q[1])}`; };

    // The source arcs: which table in sphere.db feeds each family, on the outer rim.
    ORDER.forEach((k) => {
      const [a0, a1] = span[k], am = (a0 + a1) / 2, bottom = am > Math.PI / 2 && am < Math.PI * 1.5, planned = k === "planned";
      svg("path", { d: K.arc(C, C, R, a0 + 0.02, a1 - 0.02), fill: "none", stroke: FAM[k].color, "stroke-width": 2.2, "stroke-dasharray": planned ? "3 4" : null, opacity: 0.8 }, gArc);
      const rr = bottom ? R + 19 : R + 9, id = `sch-src-${k}`;
      svg("path", { id, d: bottom ? K.arc(C, C, rr, a1, a0) : K.arc(C, C, rr, a0, a1), fill: "none" }, defs);
      const t = svg("text", { class: "it", "font-size": 11.5 }, gArc);
      const tp = svg("textPath", { href: `#${id}`, startOffset: "50%", "text-anchor": "middle" }, t);
      tp.textContent = (a1 - a0) * rr > 170 ? FAM[k].src : FAM[k].short;
    });

    // The Machines band, with its name set along its lower edge.
    svg("circle", { cx: C, cy: C, r: rM, fill: "none", stroke: "var(--acc)", "stroke-width": band, opacity: 0.5, filter: "url(#paint)", class: "mring" }, gArc);
    // Upper right, where only the Hosts' ticks cross the band, so the name never runs under a node.
    svg("path", { id: "sch-mring", d: K.arc(C, C, rM + band + 7, Math.PI * 0.06, Math.PI * 0.48), fill: "none" }, defs);
    const mt = svg("text", {}, gArc), mtp = svg("textPath", { href: "#sch-mring", startOffset: "50%", "text-anchor": "middle" }, mt);
    svg("tspan", { class: "serif" }, mtp).textContent = "Machines ";
    svg("tspan", { class: "eng" }, mtp).textContent = "ELLIE, Pi, carbon, MikroTik, Pulse";

    // Day links: each fact sheet to the hub; the five rollups ride their spoke back inward, brighter and arrowed.
    const rolled = new Map();
    rollupsOn("Days").forEach((r) => { if (!rolled.has(r[2])) rolled.set(r[2], r[5]); });
    FACTS.forEach((t) => {
      const a = ang[t.name], p0 = P(rD + 2, a), p1 = P(rF - nr - 2, a), up = rolled.has(t.name);
      link(t.name, "Days", up ? line(p1, p0) : line(p0, p1), up ? "day roll" : "day", up ? "var(--acc)" : colorOf(t.name), up ? { "marker-end": "url(#sch-arrow)" } : {});
      if (up) { const [lx, ly] = P(R * 0.27, a); text(gT, fx(lx), fx(ly + 4), rolled.get(t.name), "it ink halo", { "text-anchor": "middle", "font-size": 11 }); }
    });
    // Machine links: a radial tick from each fact sheet out to the band, and from each snowflaked dimension in to it.
    FACTS.forEach((t) => { if (t.links.some((l) => l[1] === "Machines")) link(t.name, "Machines", line(P(rF + nr + 2, ang[t.name]), P(rM - band / 2 - 1, ang[t.name])), "mach", colorOf(t.name)); });
    ["Containers", "Services"].forEach((n) => link(n, "Machines", line(P(rO - nr - 2, ang[n]), P(rM + band / 2 + 1, ang[n])), "mach", "var(--acc)"));
    // Snowflake and bridge links: the fact sheets out to Containers and Services, and Service Containers along the rim.
    link("Container Days", "Containers", bend(pos["Container Days"], pos.Containers, 0.35 * U), "dim", FAM.container.color);
    ["Endpoint Days", "Endpoint Latency", "Endpoint Certs"].forEach((n) => link(n, "Services", bend(pos[n], pos.Services, 0.3 * U), "dim", FAM.endpoint.color));
    link("Service Containers", "Containers", K.arc(C, C, rO, Math.min(ang.Containers, ang["Service Containers"]) + 0.03, Math.max(ang.Containers, ang["Service Containers"]) - 0.03), "dim", "var(--acc)");
    link("Service Containers", "Services", K.arc(C, C, rO, Math.min(ang.Services, ang["Service Containers"]) + 0.03, Math.max(ang.Services, ang["Service Containers"]) - 0.03), "dim", "var(--acc)");
    link("Event Details", "Events", line(pos["Event Details"], pos.Events), "dim", FAM.event.color);
    link("Model Days", "Models", bend(pos["Model Days"], pos.Models, 0.3 * U), "dim", FAM.telemetry.color);
    // Planned links, dashed and never drawn in.
    PLANNED.forEach((t) => t.links.forEach(([, to]) => {
      const a = ang[t.name];
      const d = to === "Days" ? line(P(rD + 2, a), P(rF - nr - 2, a)) : to === "Machines" ? line(P(rF + nr + 2, a), P(rM - band / 2 - 1, a)) : bend(pos[t.name], pos.Models, 0.2 * U);
      link(t.name, to, d, "plan", "var(--faint)", { pathLength: null });
    }));

    // Nodes, then their labels, so a label always sits over the links that pass under it.
    const nodeG = (name, x, y) => { const g = svg("g", { class: "nd", transform: `translate(${fx(x)} ${fx(y)})`, "data-n": name }, gN); nodes[name] = g; return g; };
    const tip = (name, t, planned) => () => [
      { value: planned ? `planned, ${t.entry}` : ROLE[t.role], label: "role" },
      { value: t.src, label: planned ? "would come from" : "rows come from" },
      ...(t.fields && t.fields.length ? [{ value: t.fields.join(", "), label: "fields beside Key" }] : []),
      { value: t.links.length ? t.links.map(([f, to]) => `${f} to ${to}`).join(", ") : "none", label: "links out" },
      ...(planned ? [] : [{ value: String(inbound(name)), label: "links in" }]),
      ...rollupsOn(name).map((r) => ({ value: `${AGG[r[4]]} ${r[3] === "rows" ? "rows" : r[3]} in ${r[2]}`, label: r[1] })),
    ];
    const label2 = (x, y, name, anchor = "middle") => {
      const [w1, ...rest] = name.split(" ");
      if (!rest.length) { text(gT, fx(x), fx(y + 4), name, "serif halo", { "text-anchor": anchor, "font-size": 12 }); return; }
      text(gT, fx(x), fx(y - 2), w1, "eng halo", { "text-anchor": anchor });
      text(gT, fx(x), fx(y + 12), rest.join(" "), "serif halo", { "text-anchor": anchor, "font-size": 12 });
    };
    // A ring sheet's label sits just outside its dot: centered near the top and bottom, and set away from the dot at the
    // sides, so a wide name never covers its own mark.
    const ringLabel = (name) => {
      const a = ang[name], sx = Math.sin(a), side = Math.abs(sx) >= 0.35;
      const [lx, ly] = P(rF + nr + (side ? 7 : 20), a);
      label2(lx, ly, name, side ? (sx > 0 ? "start" : "end") : "middle");
    };
    const hub = nodeG("Days", C, C);
    svg("circle", { r: rD, fill: "var(--panel2)", stroke: "var(--ink)", "stroke-width": 1.6 }, hub);
    text(hub, 0, -2, "Days", "serif", { "text-anchor": "middle", "font-size": 17 });
    text(hub, 0, 15, `+${rollupsOn("Days").length} rollups`, "it", { "text-anchor": "middle", "font-size": 11 });
    L.hover(hub, "Days", tip("Days", by.Days));
    [...FACTS, by["Event Details"]].forEach((t) => {
      const [x, y] = pos[t.name], g = nodeG(t.name, x, y);
      svg("circle", { r: t.role === "detail" ? nr * 0.75 : nr, fill: colorOf(t.name), filter: "url(#paint)" }, g);
      svg("circle", { r: nr + 7, class: "hit" }, g);
      L.hover(g, t.name, tip(t.name, t));
      if (t.role === "detail") { label2(x, y + nr + 14, t.name); return; }
      ringLabel(t.name);
    });
    PLANNED.forEach((t) => {
      const [x, y] = pos[t.name], g = nodeG(t.name, x, y);
      svg("circle", { r: nr, fill: "none", stroke: "var(--faint)", "stroke-width": 1.4, "stroke-dasharray": "3 3" }, g);
      svg("circle", { r: nr + 7, class: "hit" }, g);
      L.hover(g, t.name, tip(t.name, t, true));
      ringLabel(t.name);
    });
    ["Containers", "Services", "Service Containers", "Models"].forEach((n) => {
      const t = by[n], [x, y] = pos[n], g = nodeG(n, x, y);
      svg("circle", { r: nr, fill: "var(--panel2)", stroke: n === "Models" ? FAM.telemetry.color : "var(--acc)", "stroke-width": 2 }, g);
      svg("circle", { r: nr + 7, class: "hit" }, g);
      L.hover(g, n, tip(n, t));
      const out = P(rO + nr + 20, ang[n]), sx = Math.sin(ang[n]);
      label2(out[0], out[1], n, Math.abs(sx) < 0.3 ? "middle" : sx > 0 ? "start" : "end");
    });
    const ringHit = svg("circle", { cx: C, cy: C, r: rM, fill: "none", stroke: "transparent", "stroke-width": band + 10, "data-n": "Machines" }, gN);
    nodes.Machines = ringHit;
    L.hover(ringHit, "Machines", tip("Machines", by.Machines));

    // Pointing at a sheet keeps its links and neighbors lit and fades the rest.
    const focus = (n) => {
      const near = new Set([n]);
      links.forEach((l) => { const on = l.a === n || l.b === n; l.el.classList.toggle("off", !on); l.el.classList.toggle("hi", on); if (on) { near.add(l.a); near.add(l.b); } });
      Object.entries(nodes).forEach(([k, g]) => g.classList.toggle("off", !near.has(k)));
    };
    const clear = () => { links.forEach((l) => l.el.classList.remove("off", "hi")); Object.values(nodes).forEach((g) => g.classList.remove("off")); };
    // A click keeps one sheet's links and neighbors lit until a second click, a click on empty ground, or Escape; while one
    // is kept, pointing at another reads it out without moving the focus.
    let kept = null;
    Object.entries(nodes).forEach(([k, g]) => {
      g.addEventListener("pointerenter", () => { if (!kept) focus(k); });
      g.addEventListener("pointerleave", () => { if (!kept) clear(); });
      g.addEventListener("click", (e) => { e.stopPropagation(); kept = kept === k ? null : k; if (kept) focus(kept); else clear(); });
    });
    s.addEventListener("click", () => { if (kept) { kept = null; clear(); } });
    s.addEventListener("keydown", (e) => { if (e.key === "Escape" && kept) { kept = null; clear(); } });
    if (!s.hasAttribute("tabindex")) s.setAttribute("tabindex", "0");

    K.enter(node, () => s.classList.add("go"));

    K.tables(node, [
      ["Every sheet in the Sphere workspace, its role, and where its rows come from", ["Sheet", "Role", "Rows come from", "Fields beside Key", "Links out", "Links in"],
        SHEETS.map((t) => [t.name, ROLE[t.role], t.src, t.fields.join(", "), t.links.map(([f, to]) => `${f} to ${to}`).join(", "), inbound(t.name)])],
      ["Every link field", ["Sheet", "Field", "Points at"], LINKS.map((l) => [l.from, l.field, l.to])],
      ["Every rollup: what each dimension summarizes back across the links that point at it", ["On", "Field", "Through", "Reads", "Aggregate"], ROLLUPS.map((r) => [r[0], r[1], r[2], r[3], r[4]])],
      ["Sheets the queue plans to add", ["Sheet", "Queue entry", "Would come from", "Would link to"], PLANNED.map((t) => [t.name, t.entry, t.src, t.links.map((l) => l[1]).join(", ")])],
    ]);
  }

  /* ---------- Plate XIV, the loom: Days as the calendar ring itself, each sheet a track of its daily rows ---------- */
  const SD = window.SCHEMA_DATA;
  // Outer to inner. Each track names the dimensions it links to besides Days, which every track sits on by being on the ring.
  const TRACKS = [
    ["Telemetry Days", "telemetry", []], ["Model Days", "telemetry", ["Mo"]], ["Events", "event", ["M"]], ["Event Details", "event", ["E"]],
    ["Host Days", "host", ["M"]], ["Host CPU", "host", ["M"]], ["Host Load", "host", ["M"]], ["Host Disk", "host", ["M"]],
    ["Host Temp", "host", ["M"]], ["Host Memory", "host", ["M"]], ["Container Days", "container", ["M", "C"]],
    ["Endpoint Days", "endpoint", ["M", "S"]], ["Endpoint Latency", "endpoint", ["M", "S"]], ["Endpoint Certs", "endpoint", ["M", "S"]],
    ["Wellness Days", "planned", []], ["Backup Runs", "planned", ["M"]], ["Prompt Days", "planned", ["Mo"]],
  ];
  const CHIP = { M: ["Machines", "circle", "var(--acc)"], C: ["Containers", "square", "var(--c1)"], S: ["Services", "triangle", "var(--c3)"], E: ["Events", "diamond", "var(--hot)"], Mo: ["Models", "ring", "var(--muted)"] };
  const chipMark = (g, k, x, y, r = 3.6) => {
    const [, shape, col] = CHIP[k];
    if (shape === "circle") return svg("circle", { cx: fx(x), cy: fx(y), r, fill: col }, g);
    if (shape === "square") return svg("rect", { x: fx(x - r), y: fx(y - r), width: r * 2, height: r * 2, fill: col }, g);
    if (shape === "triangle") return svg("path", { d: `M${fx(x)} ${fx(y - r * 1.15)}L${fx(x + r)} ${fx(y + r * 0.8)}L${fx(x - r)} ${fx(y + r * 0.8)}Z`, fill: col }, g);
    if (shape === "diamond") return svg("path", { d: `M${fx(x)} ${fx(y - r)}L${fx(x + r)} ${fx(y)}L${fx(x)} ${fx(y + r)}L${fx(x - r)} ${fx(y)}Z`, fill: col }, g);
    return svg("circle", { cx: fx(x), cy: fx(y), r: r * 0.85, fill: "none", stroke: col, "stroke-width": 1.4 }, g);
  };
  const PLAN_ENTRY = Object.fromEntries(PLANNED.map((t) => [t.name, t.entry]));
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const md = (s) => `${MONTHS[+s.slice(5, 7) - 1]} ${+s.slice(8)}`;
  // The date through which carbon already holds a sheet's rows; later rows wait for the next mirror run.
  const through = (name, fam) => (fam === "planned" ? null : fam === "telemetry" ? SD.bookmarks.tday : fam === "event" ? SD.bookmarks.event_day : SD.bookmarks.day);
  const stat = (name) => {
    const s = SD.sheets[name], c = s ? s.counts : [];
    const rows = c.reduce((a, b) => a + b, 0), on = c.filter((v) => v).length, mx = Math.max(0, ...c), at = c.indexOf(mx);
    return { rows, on, mx, maxDay: at >= 0 ? SD.days[at] : null, first: s && s.first };
  };

  if (SD) {
    const N = SD.days.length, hostDays = stat("Host Days"), cpu = stat("Host CPU"), tel = stat("Telemetry Days"), ev = stat("Events");
    const pulseFirst = SD.days.find((d, i) => ((SD.sheets["Host Days"].parts[i] || {}).pulse));
    K.set("loom-meta", `${N} days, ${md(SD.first)} to ${md(SD.last)}, counted from sphere.db and dash.json`);
    K.set("loom-desc", `The ring is <b>Days</b>: ${N} dates running clockwise from ${md(SD.first)}, so every sheet that links to Days is drawn on it as a track. Each mark is one day's rows on one sheet, as the mirror writes them, and its length is the rows that day against that sheet's busiest day. The flower in the center is <b>Machines</b>, one petal per machine, as long as its days with readings.`);
    K.set("loom-howto", "Read a track clockwise to see when a sheet has rows and when it has none. The chips beside each name are what that track links to besides Days. A faded mark is a row the next mirror run sends, and a dashed track is a sheet the queue plans to add. Point anywhere on the ring for that day's rows.");
    K.set("loom-src", `Counted read-only by the nightly ML build's schema_data.py from sphere.db and dash.json with the rules of collector/mirror.mjs, days ending before ${md(SD.snapshot)}; carbon itself was not read.`);
    K.ev("loom-ev", [
      `Host CPU holds <b>${cpu.rows}</b> rows against Host Days' <b>${hostDays.rows}</b>. The Pi and carbon report CPU only in recent rows, and a reading never taken becomes a missing row, so the CPU track thins where Host Days stays full.`,
      `Telemetry Days covers <b>${tel.on}</b> of the ${N} days. Every host, container, endpoint, and event sheet starts between ${md(stat("Host Days").first)} and ${md(stat("Events").first)}, where sphere.db's day rollups and events begin.`,
      `Events peak at <b>${ev.mx}</b> rows on ${md(ev.maxDay)}; Event Details carries the ${stat("Event Details").rows} of ${ev.rows} events that have a detail.`,
      pulseFirst ? `Pulse joins the host tracks on ${md(pulseFirst)}, the first day it reports, so its petal is the shortest.` : null,
      `carbon holds the daily sheets through ${md(SD.bookmarks.day)}, Claude telemetry through ${md(SD.bookmarks.tday)}, and events through id ${SD.bookmarks.event_id}; everything later waits for the next mirror run.`,
    ]);
    const lg = document.getElementById("loom-legend");
    if (lg) {
      lg.replaceChildren();
      Object.entries(CHIP).forEach(([k, [name]]) => { const sp = h("span", {}, lg); const sv = svg("svg", { width: 12, height: 12, viewBox: "-6 -6 12 12", "aria-hidden": "true" }, sp); chipMark(sv, k, 0, 0, 4); sp.append(` links to ${name}`); });
    }
    const smp = document.getElementById("loom-sample");
    if (smp) {
      smp.replaceChildren();
      const s = svg("svg", { viewBox: "0 0 280 130", "aria-hidden": "true" }, smp);
      svg("path", { d: "M20 92A300 300 0 0 1 260 92", fill: "none", stroke: "var(--faint)", "stroke-width": 1 }, s);
      [[60, 30, 1], [100, 12, 1], [140, 22, 1], [200, 26, 0.32]].forEach(([x, len, op]) => { const y = 92 - (x - 140) * (x - 140) / 900; svg("rect", { x: x - 5, y: y - len, width: 10, height: len, fill: "var(--c2)", opacity: op }, s); });
      svg("path", { class: "lead", d: "M60 58L60 22" }, s); text(s, 60, 16, "a day with rows", "", { "text-anchor": "middle" });
      svg("path", { class: "lead", d: "M100 76L130 112" }, s); text(s, 134, 122, "shorter: fewer rows", "", { "text-anchor": "start" });
      svg("path", { class: "lead", d: "M200 62L224 26" }, s); text(s, 226, 20, "faded: not in carbon yet", "", { "text-anchor": "middle" });
    }
  }

  function loomPlate(node) {
    node.replaceChildren();
    if (!SD) { h("p", { class: "note" }, node, "This night carries no schema counts; the next nightly ML build writes them."); return; }
    const peaks = TRACKS.map(([nm]) => [nm, SD.sheets[nm] ? Math.max(...SD.sheets[nm].counts) : 0]).sort((a, b) => b[1] - a[1]), [topSheet, allMax] = peaks[0];
    const W = Math.round(K.clamp(L.width(node, 860), 380, 900)), C = W / 2, R = C * 0.9, N = SD.days.length;
    const GA = Math.PI * 0.3, END = TAU - 0.025, step = (END - GA) / N, angOf = (i) => GA + (i + 0.5) * step;
    const rOut = R * 0.97, rIn = R * 0.4, tw = (rOut - rIn) / TRACKS.length, P = (r, a) => K.pt(C, C, r, a);
    const s = svg("svg", { viewBox: `0 0 ${W} ${W}`, role: "img", tabindex: 0, class: "loom", "aria-label": `A ring of ${N} days, ${md(SD.first)} to ${md(SD.last)}, with one track per carbon sheet marking the days it has rows, and Machines as a flower in the center.` }, node);
    const defs = svg("defs", {}, s), gG = svg("g", {}, s), gM = svg("g", { filter: "url(#paint)" }, s), gT = svg("g", {}, s), gH = svg("g", {}, s);

    // Month guides through every track, a tick outside the ring where each month begins, and the month named beside it.
    SD.days.forEach((d, i) => {
      if (d.slice(8) !== "01") return;
      const a = GA + i * step;
      svg("path", { class: "guide dash", d: `M${P(rIn, a).map(fx).join(" ")}L${P(rOut, a).map(fx).join(" ")}` }, gG);
      svg("path", { d: `M${P(rOut + 2, a).map(fx).join(" ")}L${P(rOut + 12, a).map(fx).join(" ")}`, stroke: "var(--ink)", "stroke-width": 1.2, opacity: 0.7 }, gG);
      const [x, y] = P(rOut + 24, a + 0.05);
      text(gG, fx(x), fx(y + 4), MONTHS[+d.slice(5, 7) - 1], "eng t", { "text-anchor": "middle" });
    });

    TRACKS.forEach(([name, fam, links], k) => {
      const r0 = rOut - (k + 1) * tw, planned = fam === "planned", col = planned ? "var(--faint)" : FAM[fam].color;
      svg("path", { d: K.arc(C, C, r0 + 0.5, GA, END), fill: "none", stroke: col, "stroke-width": 0.8, opacity: planned ? 0.7 : 0.45, "stroke-dasharray": planned ? "2 3" : null, class: "lm", "data-k": k }, gG);
      const st = SD.sheets[name], thr = through(name, fam);
      if (st) {
        const mx = Math.max(1, ...st.counts);
        st.counts.forEach((c, i) => {
          if (!c) return;
          const a = angOf(i), len = Math.max(1.6, (tw - 2) * Math.sqrt(c / mx));
          const later = thr && SD.days[i] > thr;
          svg("path", { d: K.sector(C, C, r0 + 1, r0 + 1 + len, a - step * 0.36, a + step * 0.36), fill: col, opacity: planned ? 0.55 : later ? 0.32 : 0.92, class: "lm", "data-k": k }, gM);
        });
      }
      // Each track's name is engraved along its own ring inside the open wedge, ending where the track begins, as Plate I
      // names its rings; the chips for what it links to besides Days sit at the wedge's other edge.
      const pid = `p14-${k}`, rm = r0 + tw / 2 - 3;
      svg("path", { id: pid, d: K.arc(C, C, rm, END - TAU + 0.04 + links.length * 0.035, GA - 0.03), fill: "none" }, defs);
      const t = svg("text", { class: `eng lm${planned ? " plan" : ""}`, "data-k": k }, gT);
      svg("textPath", { href: `#${pid}`, startOffset: "100%", "text-anchor": "end" }, t).textContent = name;
      links.forEach((lk, j) => { const [cx2, cy2] = P(r0 + tw / 2, END - TAU + 0.03 + j * 0.035); chipMark(gT, lk, cx2, cy2); });
    });

    // The bookmark: where carbon's copy of the daily sheets ends.
    const bi = SD.days.indexOf(SD.bookmarks.day);
    if (bi >= 0) {
      const a = GA + (bi + 1) * step;
      svg("path", { class: "cutline", d: `M${P(rIn - 4, a).map(fx).join(" ")}L${P(rOut + 26, a).map(fx).join(" ")}` }, gG);
    }
    // Dated notes, each numbered to a badge just outside the ring at the day it names; the notes themselves are listed in
    // the side panel, evenly spaced, so the plate's corners stay clear.
    let noteN = 0;
    const note = (day, lines, x, y, anchor) => {
      const i = SD.days.indexOf(day);
      if (i < 0) return;
      noteN += 1;
      const [bx, by] = P(rOut + 14, angOf(i));
      svg("circle", { cx: fx(bx), cy: fx(by), r: 7.5, fill: "var(--panel2)", stroke: "var(--ink)", "stroke-width": 0.9 }, gT);
      text(gT, fx(bx), fx(by + 0.5), String(noteN), "serif", { "text-anchor": "middle", "dominant-baseline": "central", "font-size": 10 });
      notes.push([noteN, lines.join(" ")]);
    };
    const notes = [];
    const pulseFirst = SD.days.find((d, i) => ((SD.sheets["Host Days"].parts[i] || {}).pulse));
    note(SD.first, [`${md(SD.first)}: Claude telemetry`, "and prompt totals begin"], W - 12, 30, "end");
    note(stat("Host Days").first, [`${md(stat("Host Days").first)}: host readings`, "begin, ELLIE first"], 12, 196, "start");
    note(stat("Events").first, [`${md(stat("Events").first)}: events, containers,`, "and endpoints begin"], 12, 140, "start");
    if (pulseFirst) note(pulseFirst, [`${md(pulseFirst)}: Pulse joins`], 12, 92, "start");
    if (bi >= 0) note(SD.bookmarks.day, [`carbon holds the daily sheets`, `through ${md(SD.bookmarks.day)}`], 12, 30, "start");

    const ro = document.getElementById("loom-readout");
    if (ro) {
      ro.replaceChildren();
      h("div", { class: "rh" }, ro, "Dates marked on the ring");
      notes.sort((a, b) => a[0] - b[0]).forEach(([k, tx]) => { const r = h("div", { class: "ri" }, ro); h("span", { class: "nb" }, r, String(k)); L.rich(h("div", {}, r), tx); });
    }
    // Machines in the center: one petal per machine.
    const hd = SD.sheets["Host Days"], mDays = MACHINES_ORDER.map((m) => [m, hd.parts.filter((p) => p && p[m]).length]);
    // A petal's length is its machine's days with host readings on a straight scale, ringed every 10 days and labeled, so
    // a reader can measure one against another.
    const mmax = Math.max(1, ...mDays.map((x) => x[1])), rPet = rIn * 0.84, dTop = Math.ceil(mmax / 10) * 10;
    for (let v = 10; v <= dTop; v += 10) {
      const rr = rPet * (v / dTop);
      svg("circle", { cx: fx(C), cy: fx(C), r: fx(rr), fill: "none", stroke: "var(--line2)", "stroke-dasharray": "2 3", opacity: 0.8 }, gG);
      const [lx, ly] = K.pt(C, C, rr, 0.56);
      text(gT, fx(lx + 3), fx(ly), `${v} days`, "eng halo", {});
    }
    mDays.forEach(([m, n], q) => {
      const a = (q / mDays.length) * TAU, len = Math.max(6, rPet * (n / dTop)), wd = len * 0.22;
      const [tx, ty] = K.pt(C, C, len, a), [l1x, l1y] = K.pt(C, C, len * 0.45, a - wd / (len * 0.45)), [l2x, l2y] = K.pt(C, C, len * 0.45, a + wd / (len * 0.45));
      svg("path", { d: `M${fx(C)} ${fx(C)}Q${fx(l1x)} ${fx(l1y)} ${fx(tx)} ${fx(ty)}Q${fx(l2x)} ${fx(l2y)} ${fx(C)} ${fx(C)}Z`, fill: "var(--acc)", opacity: 0.32 + 0.5 * (n / mmax), filter: "url(#paint)" }, gG);
      const [lx, ly] = K.pt(C, C, len + 13, a);
      text(gT, fx(lx), fx(ly + 4), `${MNAME[m]} ${n}`, "serif halo", { "text-anchor": Math.abs(Math.sin(a)) < 0.3 ? "middle" : Math.sin(a) > 0 ? "start" : "end" });
    });

    // One pointer reading for the whole ring: the radius picks the track and the angle picks the day.
    const spoke = svg("path", { class: "cutline", visibility: "hidden" }, gH);
    const hide = () => { spoke.setAttribute("visibility", "hidden"); L.tip.hide(); };
    s.addEventListener("pointermove", (e) => {
      const p = K.polar(s, e, C, C), k = Math.floor((rOut - p.r) / tw), i = Math.floor((p.a - GA) / step);
      if (k < 0 || k >= TRACKS.length || i < 0 || i >= N) { hide(); return; }
      const [name, fam] = TRACKS[k], st = SD.sheets[name], c = st ? st.counts[i] : 0, parts = st && st.parts[i], thr = through(name, fam), d = SD.days[i];
      spoke.setAttribute("d", `M${P(rIn, angOf(i)).map(fx).join(" ")}L${P(rOut, angOf(i)).map(fx).join(" ")}`);
      spoke.setAttribute("visibility", "visible");
      L.tip.show(e, `${name}, ${F.wday(d)} ${md(d)}`, [
        { value: F.int(c), label: c === 1 ? "row" : "rows" },
        ...(st && c ? [{ value: `${Math.round((100 * c) / Math.max(...st.counts))}% of the busiest day on ${name}, ${F.int(Math.max(...st.counts))} rows`, label: "against itself" }, { value: `${Math.round((100 * c) / allMax)}% of the busiest day on any sheet, ${F.int(allMax)} rows on ${topSheet}`, label: "against every sheet" }] : []),
        ...(parts ? [{ value: Object.entries(parts).map(([kk, v]) => `${MNAME[kk] || kk} ${v}`).join(", "), label: "by" }] : []),
        { value: fam === "planned" ? `planned, ${PLAN_ENTRY[name]}` : thr && d > thr ? "waits for the next mirror run" : c ? "in carbon" : "no row", label: "status" },
      ]);
    });
    s.addEventListener("pointerleave", hide);
    // A click keeps one sheet's track lit, with a spoke at the clicked day, and dims the other tracks until a second
    // click on the same track or Escape.
    const keepSpoke = svg("path", { class: "cutline", visibility: "hidden", style: "opacity:.9" }, gH);
    let kept = null;
    const setKeep = (k, i) => {
      kept = k;
      s.classList.toggle("locked", k != null);
      s.querySelectorAll(".lm").forEach((el) => el.classList.toggle("on", k != null && +el.getAttribute("data-k") === k));
      keepSpoke.setAttribute("visibility", k == null ? "hidden" : "visible");
      if (k != null) keepSpoke.setAttribute("d", `M${P(rIn, angOf(i)).map(fx).join(" ")}L${P(rOut, angOf(i)).map(fx).join(" ")}`);
    };
    s.addEventListener("click", (e) => {
      const p = K.polar(s, e, C, C), k = Math.floor((rOut - p.r) / tw), i = Math.floor((p.a - GA) / step);
      if (k < 0 || k >= TRACKS.length || i < 0 || i >= N || k === kept) setKeep(null); else setKeep(k, i);
    });
    s.addEventListener("keydown", (e) => { if (e.key === "Escape") setKeep(null); });
    K.keySteps(s, N, (i) => P(rOut - tw / 2, angOf(i)));

    K.tables(node, [
      ["Each sheet's rows on the ring, as the mirror writes them", ["Sheet", "First day", "Days with rows", "Rows", "Most in a day", "On", "In carbon through", "Links besides Days"],
        TRACKS.map(([name, fam, links]) => { const t = stat(name); return [name, t.first ? md(t.first) : "", t.on, F.int(t.rows), t.mx, t.maxDay ? md(t.maxDay) : "", fam === "planned" ? `planned, ${PLAN_ENTRY[name]}` : md(through(name, fam)), links.map((l) => CHIP[l][0]).join(", ")]; })],
      ["Machines, by days with host readings", ["Machine", "Days"], mDays.map(([m, n]) => [MNAME[m], n])],
    ]);
  }
  const MACHINES_ORDER = ["ellie", "pi", "carbon", "router", "pulse"];
  const MNAME = { ellie: "ELLIE", pi: "Pi", carbon: "carbon", router: "MikroTik", pulse: "Pulse" };

  sample();
  legend();
  K.reg("schema", schemaPlate);
  K.reg("loom", loomPlate);
})();
