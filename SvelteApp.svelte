<!-- Svelte 4 — Core Web Vitals Tracker -->
<!-- Install: npm create svelte@latest my-app, then npm install web-vitals -->
<!-- Run:     npm run dev (SvelteKit / Vite) -->

<script>
  import { onMount } from "svelte";
  import { onLCP, onINP, onCLS, onFCP, onTTFB } from "web-vitals";

  // ── Thresholds (same values across all three implementations) ──────────────
  const THRESHOLDS = {
    LCP:  { good: 2500, poor: 4000 },
    INP:  { good: 200,  poor: 500  },
    CLS:  { good: 0.1,  poor: 0.25 },
    FCP:  { good: 1800, poor: 3000 },
    TTFB: { good: 800,  poor: 1800 },
  };

  // ── Reactive state (Svelte stores — no useState boilerplate) ───────────────
  let metrics = {
    LCP:  { value: null, rating: "unknown" },
    INP:  { value: null, rating: "unknown" },
    CLS:  { value: null, rating: "unknown" },
    FCP:  { value: null, rating: "unknown" },
    TTFB: { value: null, rating: "unknown" },
  };

  let interactions   = 0;
  let clsTargetEl;
  let log            = [];

  // ── Utility functions ──────────────────────────────────────────────────────
  function formatValue(name, value) {
    return name === "CLS" ? value.toFixed(4) : Math.round(value) + " ms";
  }

  function getRating(name, value) {
    const t = THRESHOLDS[name];
    if (!t) return "unknown";
    if (value <= t.good) return "good";
    if (value <= t.poor) return "needs-improvement";
    return "poor";
  }

  // ── Colour derived from rating ─────────────────────────────────────────────
  const COLOR = {
    good:               { bg: "#ecfdf5", accent: "#059669", border: "#a7f3d0" },
    "needs-improvement":{ bg: "#fffbeb", accent: "#d97706", border: "#fde68a" },
    poor:               { bg: "#fff1f2", accent: "#e11d48", border: "#fecdd3" },
    unknown:            { bg: "#f9fafb", accent: "#6b7280", border: "#e5e7eb" },
  };

  function color(rating) { return COLOR[rating] || COLOR.unknown; }

  // ── Gauge width (0–100 %) ──────────────────────────────────────────────────
  function gaugePct(name, value) {
    const t = THRESHOLDS[name];
    if (!t || value === null) return 0;
    return Math.min((value / (t.poor * 1.5)) * 100, 100);
  }

  function gaugeGoodPct(name) {
    const t = THRESHOLDS[name];
    return t ? (t.good / (t.poor * 1.5)) * 100 : 0;
  }

  function gaugePoorPct(name) {
    const t = THRESHOLDS[name];
    return t ? (t.poor / (t.poor * 1.5)) * 100 : 0;
  }

  // ── Record a metric update ─────────────────────────────────────────────────
  function record(metric) {
    const { name, value, rating } = metric;
    metrics = { ...metrics, [name]: { value, rating } };   // triggers reactivity
    log = [
      { name, value, rating, ts: new Date().toLocaleTimeString() },
      ...log.slice(0, 14),
    ];
  }

  // ── Register observers on mount ───────────────────────────────────────────
  onMount(() => {
    onLCP(record,  { reportAllChanges: true });
    onINP(record,  { reportAllChanges: true });
    onCLS(record,  { reportAllChanges: true });
    onFCP(record);
    onTTFB(record);
  });

  // ── Interaction demo ───────────────────────────────────────────────────────
  function handleInteraction() {
    // Stress the main thread → INP
    let sum = 0;
    for (let i = 0; i < 2_000_000; i++) sum += Math.sqrt(i);
    interactions++;

    // Inject a temporary element → CLS
    if (clsTargetEl) {
      const el = document.createElement("div");
      el.style.cssText =
        "height:56px;background:#fce7f3;margin:8px 0;border-radius:8px;" +
        "display:flex;align-items:center;padding:0 14px;font-size:13px;";
      el.textContent = `Injected element (sqrt sum = ${sum.toFixed(0)})`;
      clsTargetEl.appendChild(el);
      setTimeout(() => el.remove(), 800);
    }
  }

  // ── Derived: overall status ────────────────────────────────────────────────
  $: allGood = Object.values(metrics).every(
    (m) => m.rating === "good" || m.rating === "unknown"
  );
</script>

<!-- ═══════════════════════════════════════════════════════════════════════════
     Template
══════════════════════════════════════════════════════════════════════════════ -->

<main>
  <!-- Header ---------------------------------------------------------------- -->
  <header>
    <div class="badge">
      <span class="dot"></span> SVELTE 4
    </div>
    <h1>Core Web Vitals Tracker</h1>
    <p>
      Svelte compiles to <strong>zero-runtime</strong> vanilla JS. There is no
      virtual DOM — the compiler outputs direct DOM operations, which is why
      Svelte consistently achieves the lowest bundle size and fastest FCP.
    </p>
  </header>

  <!-- Metric cards ---------------------------------------------------------- -->
  <div class="grid">
    {#each Object.entries(metrics) as [name, { value, rating }]}
      {@const c = color(rating)}
      {@const t = THRESHOLDS[name]}
      <article
        class="card"
        style="background:{c.bg};border-color:{c.border}"
      >
        <div class="card-top">
          <span class="metric-name">{name}</span>
          <span class="badge-rating" style="color:{c.accent}">{rating}</span>
        </div>

        <div class="metric-value" style="color:{c.accent}">
          {#if value !== null}
            {formatValue(name, value)}
          {:else}
            <span class="waiting">waiting…</span>
          {/if}
        </div>

        <!-- Inline gauge -->
        <div class="gauge-track"
          style="background:linear-gradient(to right,
            #bbf7d0 0%,#bbf7d0 {gaugeGoodPct(name)}%,
            #fde68a {gaugeGoodPct(name)}%,#fde68a {gaugePoorPct(name)}%,
            #fecdd3 {gaugePoorPct(name)}%,#fecdd3 100%)"
        >
          {#if value !== null}
            <div class="gauge-thumb" style="left:{gaugePct(name, value)}%"></div>
          {/if}
        </div>

        {#if t}
          <div class="thresholds">
            ✓ ≤ {name === "CLS" ? t.good : t.good + " ms"} &nbsp;·&nbsp;
            ✗ &gt; {name === "CLS" ? t.poor : t.poor + " ms"}
          </div>
        {/if}
      </article>
    {/each}
  </div>

  <!-- Overall badge --------------------------------------------------------- -->
  <div class="overall" class:ok={allGood} class:warn={!allGood}>
    {allGood ? "✓ All metrics are Good" : "⚠ Some metrics need attention"}
  </div>

  <!-- Interaction demo ------------------------------------------------------ -->
  <section class="demo">
    <h3>Interaction + CLS demo</h3>
    <p>
      Clicking runs 2 M sqrt operations (loads the main thread for INP) and
      injects a temporary element that causes layout shift (CLS).
      Svelte's compiled event handlers add minimal overhead.
    </p>
    <button on:click={handleInteraction}>
      Run interaction #{interactions + 1}
    </button>
    <div bind:this={clsTargetEl}></div>
  </section>

  <!-- Log ------------------------------------------------------------------- -->
  {#if log.length > 0}
    <section class="log">
      <h3>Live event log</h3>
      <div class="log-body">
        {#each log as entry}
          <div class="log-row">
            <span class="log-ts">[{entry.ts}]</span>
            <span class="log-name">{entry.name}</span>
            <span class="log-val">{formatValue(entry.name, entry.value)}</span>
            <span class="log-rating"
              class:good={entry.rating === "good"}
              class:poor={entry.rating === "poor"}
            >({entry.rating})</span>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <footer>
    Framework: Svelte 4 · No runtime · Compiled to vanilla JS · web-vitals v3
  </footer>
</main>

<!-- ═══════════════════════════════════════════════════════════════════════════
     Styles (scoped by Svelte automatically)
══════════════════════════════════════════════════════════════════════════════ -->

<style>
  main {
    font-family: "Segoe UI", system-ui, sans-serif;
    max-width: 860px;
    margin: 0 auto;
    padding: 32px 24px;
    color: #0f172a;
  }

  header { margin-bottom: 28px; }
  header h1 { font-size: 26px; font-weight: 800; margin: 8px 0 6px; }
  header p  { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0; }

  .badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;
    border-radius: 8px; padding: 4px 12px;
    font-size: 12px; font-weight: 700; letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .dot {
    width: 8px; height: 8px; border-radius: 50%; background: #f97316;
  }

  /* Grid */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
    margin-bottom: 16px;
  }

  /* Card */
  .card {
    border-radius: 14px;
    border: 1.5px solid;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .metric-name { font-weight: 700; font-size: 14px; }

  .badge-rating {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1px;
    background: rgba(0,0,0,0.07); border-radius: 20px;
    padding: 2px 9px;
  }

  .metric-value { font-size: 30px; font-weight: 800; line-height: 1; }
  .waiting      { font-size: 16px; opacity: 0.4; }

  /* Gauge */
  .gauge-track {
    position: relative; height: 7px; border-radius: 7px;
  }
  .gauge-thumb {
    position: absolute; top: -4px;
    transform: translateX(-50%);
    width: 13px; height: 13px; border-radius: 50%;
    background: #1e293b; border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .thresholds { font-size: 11px; color: #6b7280; }

  /* Overall */
  .overall {
    text-align: right; font-size: 13px; font-weight: 600;
    margin-bottom: 20px; padding: 6px 12px;
    border-radius: 8px; display: inline-block; float: right;
  }
  .ok   { background: #ecfdf5; color: #065f46; }
  .warn { background: #fffbeb; color: #92400e; }

  /* Demo section */
  .demo {
    clear: both;
    background: #fff7ed; border: 1px solid #fed7aa;
    border-radius: 12px; padding: 18px 20px;
    margin-top: 8px;
  }
  .demo h3 { margin: 0 0 8px; font-size: 14px; font-weight: 700; }
  .demo p  { font-size: 13px; color: #64748b; margin: 0 0 14px; line-height: 1.6; }

  button {
    background: #ea580c; color: #fff; border: none;
    border-radius: 8px; padding: 10px 22px;
    font-size: 14px; font-weight: 600; cursor: pointer;
  }
  button:hover { background: #c2410c; }

  /* Log */
  .log { margin-top: 24px; }
  .log h3 { font-size: 14px; font-weight: 700; margin-bottom: 10px; }
  .log-body {
    background: #0f172a; border-radius: 10px;
    padding: 14px 16px; max-height: 180px; overflow-y: auto;
    font-family: monospace; font-size: 12px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .log-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .log-ts   { color: #475569; }
  .log-name { color: #7dd3fc; font-weight: 700; }
  .log-val  { color: #f1f5f9; }
  .log-rating       { color: #fde68a; }
  .log-rating.good  { color: #86efac; }
  .log-rating.poor  { color: #fca5a5; }

  footer {
    margin-top: 28px; font-size: 12px; color: #94a3b8;
    text-align: center;
  }
</style>
