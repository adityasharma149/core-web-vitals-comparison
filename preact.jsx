// Preact 10 — Core Web Vitals Tracker
// Install: npm install preact web-vitals
// Run:     npm run dev (Vite with @preact/preset-vite)
//
// vite.config.js needed:
//   import preact from "@preact/preset-vite";
//   export default { plugins: [preact()] };

import { h } from "preact";
import { useState, useEffect, useCallback } from "preact/hooks";
import { onLCP, onINP, onCLS, onFCP, onTTFB } from "web-vitals";

// ─── Thresholds (identical across all three implementations) ─────────────────
const THRESHOLDS = {
  LCP:  { good: 2500, poor: 4000 },
  INP:  { good: 200,  poor: 500  },
  CLS:  { good: 0.1,  poor: 0.25 },
  FCP:  { good: 1800, poor: 3000 },
  TTFB: { good: 800,  poor: 1800 },
};

function getRating(name, value) {
  const t = THRESHOLDS[name];
  if (!t) return "unknown";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

function formatValue(name, value) {
  return name === "CLS" ? value.toFixed(4) : Math.round(value) + " ms";
}

// ─── Colour map ───────────────────────────────────────────────────────────────
const COLOR = {
  good:               { bg: "#ecfdf5", accent: "#059669", border: "#a7f3d0" },
  "needs-improvement":{ bg: "#fffbeb", accent: "#d97706", border: "#fde68a" },
  poor:               { bg: "#fff1f2", accent: "#e11d48", border: "#fecdd3" },
  unknown:            { bg: "#f9fafb", accent: "#6b7280", border: "#e5e7eb" },
};

// ─── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({ name, value, rating }) {
  const c = COLOR[rating] || COLOR.unknown;
  const t = THRESHOLDS[name];
  return (
    <div style={{
      borderRadius: 14,
      border: `1.5px solid ${c.border}`,
      background: c.bg,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{name}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: 1, background: "rgba(0,0,0,0.07)",
          borderRadius: 20, padding: "2px 9px", color: c.accent,
        }}>
          {rating}
        </span>
      </div>

      <div style={{ fontSize: 30, fontWeight: 800, color: c.accent, lineHeight: 1 }}>
        {value !== null
          ? formatValue(name, value)
          : <span style={{ fontSize: 16, opacity: 0.45 }}>waiting…</span>}
      </div>

      {t && (
        <div style={{ fontSize: 11, color: "#6b7280" }}>
          ✓ ≤ {name === "CLS" ? t.good : t.good + " ms"} &nbsp;·&nbsp;
          ✗ &gt; {name === "CLS" ? t.poor : t.poor + " ms"}
        </div>
      )}
    </div>
  );
}

// ─── GaugeBar: visual representation of where value sits ─────────────────────
function GaugeBar({ name, value }) {
  const t = THRESHOLDS[name];
  if (!t || value === null) return null;
  const max  = t.poor * 1.5;
  const pct  = Math.min((value / max) * 100, 100);
  const good = (t.good / max) * 100;
  const poor = (t.poor / max) * 100;
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
      <div style={{
        position: "relative", height: 8, borderRadius: 8,
        background: "linear-gradient(to right, #bbf7d0 0%, #bbf7d0 " + good + "%, #fde68a " + good + "%, #fde68a " + poor + "%, #fecdd3 " + poor + "%, #fecdd3 100%)",
        marginTop: 4,
      }}>
        <div style={{
          position: "absolute", top: -3, left: `calc(${pct}% - 6px)`,
          width: 14, height: 14, borderRadius: "50%",
          background: "#1e293b", border: "2px solid #fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [metrics, setMetrics] = useState({
    LCP:  { value: null, rating: "unknown" },
    INP:  { value: null, rating: "unknown" },
    CLS:  { value: null, rating: "unknown" },
    FCP:  { value: null, rating: "unknown" },
    TTFB: { value: null, rating: "unknown" },
  });
  const [interactions, setInteractions] = useState(0);
  const [renderCount, setRenderCount] = useState(0);

  // Preact is lighter: we track re-renders to compare overhead with React
  useEffect(() => { setRenderCount((n) => n + 1); });

  const record = useCallback((metric) => {
    const { name, value, rating } = metric;
    setMetrics((prev) => ({ ...prev, [name]: { value, rating } }));
  }, []);

  useEffect(() => {
    onLCP(record,  { reportAllChanges: true });
    onINP(record,  { reportAllChanges: true });
    onCLS(record,  { reportAllChanges: true });
    onFCP(record);
    onTTFB(record);
  }, [record]);

  // Heavy interaction — same work as React version for fair INP comparison
  const handleInteraction = () => {
    let sum = 0;
    for (let i = 0; i < 2_000_000; i++) sum += Math.sqrt(i);
    setInteractions((n) => n + 1);
    // Append a layout-shifting element then remove it to trigger CLS
    const el = document.createElement("div");
    el.style.cssText = "height:60px;background:#ffe4e6;margin:8px 0;border-radius:8px;";
    el.textContent = `Temporary element (sum=${sum.toFixed(0)})`;
    document.getElementById("cls-target")?.appendChild(el);
    setTimeout(() => el.remove(), 800);
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      maxWidth: 860, margin: "0 auto", padding: "32px 24px", color: "#0f172a",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{
            background: "#fdf4ff", color: "#7e22ce", border: "1px solid #e9d5ff",
            borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700, letterSpacing: 1,
          }}>
            ⚡ PREACT 10
          </span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>~3 KB runtime · web-vitals v3</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Core Web Vitals Tracker</h1>
        <p style={{ color: "#64748b", marginTop: 6, fontSize: 14, lineHeight: 1.6 }}>
          Identical measurement logic to the React version — but Preact's{" "}
          <strong>~3 KB runtime</strong> (vs React's ~42 KB) means less JS to
          parse, a faster FCP, and lower TBT.
        </p>
      </div>

      {/* Metric cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 14, marginBottom: 20,
      }}>
        {Object.entries(metrics).map(([name, { value, rating }]) => (
          <MetricCard key={name} name={name} value={value} rating={rating} />
        ))}
      </div>

      {/* Gauge bars */}
      <div style={{
        background: "#f8fafc", border: "1px solid #e2e8f0",
        borderRadius: 12, padding: "18px 20px", marginBottom: 20,
      }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>
          Value position within thresholds
        </h3>
        {Object.entries(metrics).map(([name, { value }]) => (
          <GaugeBar key={name} name={name} value={value} />
        ))}
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: "#64748b" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 8, borderRadius: 4, background: "#bbf7d0", display: "inline-block" }} /> Good
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 8, borderRadius: 4, background: "#fde68a", display: "inline-block" }} /> Needs improvement
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 8, borderRadius: 4, background: "#fecdd3", display: "inline-block" }} /> Poor
          </span>
        </div>
      </div>

      {/* Interaction + CLS demo */}
      <div style={{
        background: "#fdf4ff", border: "1px solid #e9d5ff",
        borderRadius: 12, padding: "18px 20px",
      }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700 }}>
          Interaction + CLS demo
        </h3>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px", lineHeight: 1.6 }}>
          Each click runs 2 million sqrt iterations (stresses INP) and injects a
          temporary DOM element that shifts layout (stresses CLS).
        </p>
        <button
          onClick={handleInteraction}
          style={{
            background: "#7e22ce", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          Run interaction #{interactions + 1}
        </button>
        <div id="cls-target" style={{ marginTop: 12 }} />
      </div>

      {/* Preact-specific stats */}
      <div style={{
        marginTop: 20, fontSize: 12, color: "#94a3b8",
        display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      }}>
        <span>Framework: Preact 10 · Runtime: ~3 KB gzipped</span>
        <span>State updates since load: {renderCount}</span>
      </div>
    </div>
  );
}
