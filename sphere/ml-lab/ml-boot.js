/* Boot: the look and motion switches, every card's Chart, Numbers, and Case study faces, every plate, then the entrances and
   the sky, in the order the data lab's own page uses. */
"use strict";
(() => {
  // The studies' prose was written for this run; their figures and findings follow whatever run the page shows.
  const WRITTEN = "2026-10-22 06:00";
  const shown = L.when(L.date(window.ML.snapshot.replace(" ", "T"))), wrote = L.when(L.date(WRITTEN.replace(" ", "T")));
  Object.values(window.LAB_CASES || {}).forEach((c) => {
    c.written = c.written || `Written for the ${wrote} run. ${shown === wrote ? "Its" : `This page shows the ${shown} run; its`} figures and findings come from the run shown.`;
  });
  const boot = () => {
    L.initLook();
    document.querySelectorAll("[data-look-btn]").forEach((b) => b.addEventListener("click", () => L.setLook(b.dataset.lookBtn)));
    const pause = document.getElementById("pause");
    if (pause) {
      const sync = () => { pause.setAttribute("aria-pressed", String(L.paused)); pause.textContent = L.paused ? "Resume motion" : "Pause motion"; };
      sync();
      if (L.reduced) pause.disabled = true;
      pause.addEventListener("click", () => { L.setPaused(!L.paused); sync(); });
    }
    // Faces first, so every plate draws inside its card's Chart face and every table lands on its Numbers face.
    L.mount.querySelectorAll(".ml-plates .panel").forEach((p) => { if (p.querySelector(".chart")) L.faces(p); });
    K.drawAll();
    const flow = () => L.mount.querySelectorAll(".evrow.flow").forEach(K.flowEv);
    flow();
    let ft = 0;
    window.addEventListener("resize", () => { clearTimeout(ft); ft = setTimeout(flow, 200); }, { signal: L.signal });
    L.mount.querySelectorAll(".ml-plates .panel, .ml-plates .rvx").forEach((p) => { if (!p.dataset.entered && !p.parentElement.closest(".panel, .rvx")) L.watch(p); });
    if (L.sky) L.sky.start();
    // The serif and the display face change text widths, so the plates draw again once the fonts have set.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { (window.LABR || []).forEach(([n, fn]) => { if (!n.closest(".face[hidden]")) { try { fn(n); } catch (e) { console.error(e); } } }); flow(); });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
