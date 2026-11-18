/* Project group tabs, styled by the resume's .tabs rules. Every panel renders in the markup, so a reader without
   JavaScript, or a crawler, sees all three stacked; this script hides the unselected ones. A link to a card
   (projects.html#carbon) opens the tab that holds it. */
(function () {
  const tabs = Array.from(document.querySelectorAll('.tabs [role="tab"]'));
  const panels = tabs.map(function (b) { return document.getElementById(b.getAttribute('aria-controls')); });
  if (!tabs.length) return;

  function select(i, focus) {
    tabs.forEach(function (b, k) {
      const on = k === i;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
    });
    if (focus) tabs[i].focus();
  }

  // The tab whose panel holds the anchor in the address, or the first tab when there is none.
  function fromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const el = id && document.getElementById(id);
    const i = el ? panels.findIndex(function (p) { return p.contains(el); }) : -1;
    select(i < 0 ? 0 : i);
    if (i >= 0) el.scrollIntoView();
  }

  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { select(i); });
    b.addEventListener('keydown', function (e) {
      const n = tabs.length;
      const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n
        : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
      if (to < 0) return;
      e.preventDefault();
      select(to, true);
    });
  });
  addEventListener('hashchange', fromHash);
  fromHash();
})();
