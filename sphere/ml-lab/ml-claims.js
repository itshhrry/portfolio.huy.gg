/* Every finding's label, badge, headline, and claim sentence, judged from this run's figures by claims-core.js against the
   registry in claims_data.js. The page states a finding only through K.claim or K.badge, so a rerun whose figures cross a
   threshold changes the words with the charts. */
"use strict";
(() => {
  const SNAP = { ML: window.ML, ML_BRIDGE: window.ML_BRIDGE, ML_METRICS: window.ML_METRICS };
  const BY = Object.fromEntries((window.ML_CLAIMS || []).map((e) => [e.id, e]));
  const memo = {};
  const WORD = { held: "Held", weak: "Held weakly", no: "Did not hold", wait: "Waiting on data" };
  const CLS = { held: "", weak: "weak", no: "no", wait: "inf" };
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  K.claim = (id) => {
    if (!(id in memo)) {
      if (!BY[id]) throw new Error(`claims_data.js has no finding ${id}`);
      memo[id] = window.Claims.judge(BY[id], SNAP);
    }
    return memo[id];
  };
  // A finding holds only when its badge reads Held; a weak or unsettled one is not stated as true anywhere on the page.
  K.holds = (id) => K.claim(id).tone === "held";
  // The badge reads the tone in the page's four words; the small line names the finding's own label unless it repeats them.
  K.badge = (id, small) => {
    const c = K.claim(id), word = WORD[c.tone];
    return { cls: CLS[c.tone], word, small: small !== undefined ? small : c.label === word ? "" : lower(c.label) };
  };
  K.tone = (id) => K.claim(id).tone;
  // A badge for a card that summarizes several findings rather than stating one.
  K.toneBadge = (tone, small) => ({ cls: CLS[tone], word: WORD[tone], small: small || "" });
  K.lower = lower;
  // A headline joined from two findings, the second lowercased after a semicolon.
  K.heads = (...ids) => ids.map((id, i) => { const t = K.claim(id).head.replace(/\.$/, ""); return i ? lower(t) : t; }).join("; ") + ".";
})();
