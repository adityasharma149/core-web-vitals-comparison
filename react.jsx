// React 18 — Core Web Vitals Tracker
// Install: npm install web-vitals
// Run:     npm start (Create React App) or Vite

import { useState, useEffect, useCallback } from "react";
import { onLCP, onINP, onCLS, onFCP, onTTFB } from "web-vitals";

const THRESHOLDS = {
  LCP:  { good: 2500, poor: 4000, unit: "ms" },
  INP:  { good: 200,  poor: 500,  unit: "ms" },
  CLS:  { good: 0.1,  poor: 0.25, unit: "" },
  FCP:  { good: 1800, poor: 3000, unit: "ms" },
  TTFB: { good: 800,  poor: 1800, unit: "ms" },
};

function getRating(name, value) {
  const t = THRESHOLDS[name];
  if (!t) return "unknown";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

function formatValue(name, value) {
  if (name === "CLS") return value.toFixed(4);
  return Math.round(value) + " ms";
}

const COLORS = {
  good: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  "needs-improvement": { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  poor: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  unknown: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
};

function MetricCard({ name, value, rating, description }) {
  const c = COLORS[rating] || COLORS.unknown;
  return (
    <div
      style={{
        border: `1.5px solid ${c.border}`,
        borderRadius: 12,
        padding: "20px 24px",
        background: c.bg,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 180,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{name}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: c.text,
            background: "rgba(255,255,255,0.6)",
            borderRadius: 20,
            padding: "2px 10px",
          }}
        >
          {rating}
        </span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: c.text, lineHeight: 1.1 }}>
        {value !== null ? formatValue(name, value) : <span style={{ fontSize: 20, opacity: 0.5 }}>measuring…</span>}
      </div>
      <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{description}</div>
      {THRESHOLDS[name] && (
        <div style={{ fontSize: 11, color: "#777", marginTop: 4 }}>
          Good ≤ {name === "CLS" ? THRESHOLDS[name].good : THRESHOLDS[name].good + " ms"} &nbsp;|&nbsp;
          Poor &gt; {name === "CLS" ? THRESHOLDS[name].poor : THRESHOLDS[name].poor + " ms"}
        </div>
      )}
    </div>
  );
}

function InteractionDemo({ onInteract }) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);

  const handleHeavyClick = () => {
    // simulate some work to produce measurable INP
    let sum = 0;
    for (let i = 0; i < 2_000_000; i++) sum += Math.sqrt(i);
    setCount((c) => c + 1);
    setItems((prev) => [
      ...prev,
      { id: Date.now(), label: `Item ${prev.length + 1}`, sum: sum.toFixed(0) },
    ]);
    onInteract();
  };

  return (
    <div
      style={{
        background: "#f8f9fa",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24,
        marginTop: 24,
      }}
    >
      <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700 }}>
        Interaction Demo (triggers INP measurement)
      </h3>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "#555" }}>
        Click the button to perform a CPU-heavy task. The browser measures the
        delay between your click and the next frame paint — that's INP.
      </p>
      <button
        onClick={handleHeavyClick}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 22px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Simulate interaction #{count + 1}
      </button>
      {items.length > 0 && (
        <ul
          style={{
            margin: "16px 0 0",
            padding: "0 0 0 18px",
            fontSize: 13,
            color: "#374151",
            maxHeight: 120,
            overflowY: "auto",
          }}
        >
          {items.map((it) => (
            <li key={it.id}>
              {it.label} — computed {it.sum}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function App() {
  const [metrics, setMetrics] = useState({
    LCP:  { value: null, rating: "unknown" },
    INP:  { value: null, rating: "unknown" },
    CLS:  { value: null, rating: "unknown" },
    FCP:  { value: null, rating: "unknown" },
    TTFB: { value: null, rating: "unknown" },
  });
  const [log, setLog] = useState([]);

  const record = useCallback((metric) => {
    const { name, value, rating } = metric;
    setMetrics((prev) => ({ ...prev, [name]: { value, rating } }));
    setLog((prev) => [
      { name, value, rating, ts: new Date().toLocaleTimeString() },
      ...prev.slice(0, 19),
    ]);
  }, []);

  useEffect(() => {
    onLCP(record,  { reportAllChanges: true });
    onINP(record,  { reportAllChanges: true });
    onCLS(record,  { reportAllChanges: true });
    onFCP(record);
    onTTFB(record);
  }, [record]);

  const DESCRIPTIONS = {
    LCP:  "Largest Contentful Paint — loading performance",
    INP:  "Interaction to Next Paint — responsiveness",
    CLS:  "Cumulative Layout Shift — visual stability",
    FCP:  "First Contentful Paint — first pixel",
    TTFB: "Time to First Byte — server responsiveness",
  };

  const allGood = Object.values(metrics).every(
    (m) => m.rating === "good" || m.rating === "unknown"
  );

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        maxWidth: 860,
        margin: "0 auto",
        padding: "32px 24px",
        color: "#111",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span
            style={{
              background: "#eff6ff",
              color: "#1d4ed8",
              borderRadius: 8,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              border: "1px solid #bfdbfe",
            }}
          >
            ⚛ REACT 18
          </span>
          <span style={{ fontSize: 12, color: "#888" }}>web-vitals v3 · Real measurements</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
          Core Web Vitals Tracker
        </h1>
        <p style={{ color: "#555", marginTop: 6, fontSize: 14 }}>
          Live metrics measured in <em>this browser session</em> using the{" "}
          <code>web-vitals</code> library. Interact with the page to trigger INP
          and layout-shift measurements.
        </p>
      </div>

      {/* Metrics grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 8,
        }}
      >
        {Object.entries(metrics).map(([name, { value, rating }]) => (
          <MetricCard
            key={name}
            name={name}
            value={value}
            rating={rating}
            description={DESCRIPTIONS[name]}
          />
        ))}
      </div>

      {/* Overall badge */}
      <div style={{ textAlign: "right", marginBottom: 24, fontSize: 13, color: "#555" }}>
        Overall:{" "}
        <strong style={{ color: allGood ? "#065f46" : "#92400e" }}>
          {allGood ? "✓ All Good" : "⚠ Some metrics need attention"}
        </strong>
      </div>

      {/* Interaction demo */}
      <InteractionDemo onInteract={() => {}} />

      {/* Log */}
      {log.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
            Metric update log
          </h3>
          <div
            style={{
              background: "#0f172a",
              borderRadius: 10,
              padding: 16,
              maxHeight: 200,
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: 12,
              color: "#94a3b8",
            }}
          >
            {log.map((entry, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <span style={{ color: "#64748b" }}>[{entry.ts}]</span>{" "}
                <span style={{ color: "#7dd3fc", fontWeight: 700 }}>{entry.name}</span>
                {" → "}
                <span style={{ color: "#f1f5f9" }}>{formatValue(entry.name, entry.value)}</span>
                {" "}
                <span
                  style={{
                    color:
                      entry.rating === "good"
                        ? "#86efac"
                        : entry.rating === "poor"
                        ? "#fca5a5"
                        : "#fde68a",
                  }}
                >
                  ({entry.rating})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ marginTop: 28, fontSize: 12, color: "#aaa", textAlign: "center" }}>
        Framework: React 18 · Renderer: ReactDOM · Measurement: web-vitals v3 (PerformanceObserver API)
      </p>
    </div>
  );
}
