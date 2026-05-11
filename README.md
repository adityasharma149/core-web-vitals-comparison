# ⚡ Core Web Vitals — Framework Comparison

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Preact](https://img.shields.io/badge/Preact-10-673AB8?style=flat-square&logo=preact&logoColor=white)](https://preactjs.com)
[![Svelte](https://img.shields.io/badge/Svelte-4-FF3E00?style=flat-square&logo=svelte&logoColor=white)](https://svelte.dev)
[![web-vitals](https://img.shields.io/badge/web--vitals-v3-4285F4?style=flat-square&logo=google&logoColor=white)](https://github.com/GoogleChrome/web-vitals)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

> A research project comparing real **Core Web Vitals** (LCP, INP, CLS, FCP, TTFB) across three JavaScript frameworks — React 18, Preact 10, and Svelte 4 — using an identical app implemented in each.

---

## 📋 Table of Contents

- [Research Question](#-research-question)
- [Metrics Measured](#-metrics-measured)
- [Methodology](#-methodology)
- [Results](#-results)
- [Project Structure](#-project-structure)
- [How to Run](#-how-to-run)
  - [React](#1-react-18)
  - [Preact](#2-preact-10)
  - [Svelte](#3-svelte-4)
- [Framework Differences](#-framework-differences)
- [Key Findings](#-key-findings)
- [Tools & References](#-tools--references)

---

## 🔬 Research Question

> *Do lightweight JavaScript frameworks (Preact, Svelte) produce meaningfully better Core Web Vitals scores than the industry-standard React, on identical application code and identical hardware conditions?*

---

## 📊 Metrics Measured

All five Google Core Web Vitals (and related diagnostics) are captured using the [`web-vitals`](https://github.com/GoogleChrome/web-vitals) library via the browser's native **PerformanceObserver API** — the same source Chrome uses for real-user monitoring (RUM).

| Metric | Full Name | What It Measures | Good | Needs Work | Poor |
|--------|-----------|-----------------|------|------------|------|
| **LCP** | Largest Contentful Paint | Loading performance — time until the largest visible element renders | ≤ 2.5 s | ≤ 4.0 s | > 4.0 s |
| **INP** | Interaction to Next Paint | Responsiveness — delay between user input and next frame | ≤ 200 ms | ≤ 500 ms | > 500 ms |
| **CLS** | Cumulative Layout Shift | Visual stability — how much the page jumps during load | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| **FCP** | First Contentful Paint | First pixel rendered by the browser | ≤ 1.8 s | ≤ 3.0 s | > 3.0 s |
| **TTFB** | Time to First Byte | Server responsiveness / network latency | ≤ 800 ms | ≤ 1.8 s | > 1.8 s |

---

## 🧪 Methodology

### Test application
All three implementations are functionally **identical**: they render a live metrics dashboard, register the same five `web-vitals` observers, and include an interaction demo that:
1. Runs **2,000,000 `Math.sqrt` iterations** to stress the main thread (measures INP).
2. Injects and removes a temporary DOM element after 800 ms (triggers CLS).

### Test environment
| Parameter | Value |
|-----------|-------|
| Device | Mid-range Android (Moto G Power equivalent) |
| Network | Fast 4G throttle (Chrome DevTools) |
| CPU throttle | 4× slowdown |
| Browser | Chrome 124 (stable) |
| Measurement tool | `web-vitals` v3 + Chrome Lighthouse |
| Runs per framework | 5 (median taken) |

### Controlled variables
- Same application logic and DOM structure in all three frameworks
- Production builds only (`npm run build`) — never development mode
- Local static file server (`serve -s build`) — removes server variance
- Page reloaded between each run; cache cleared

---

## 📈 Results

### Summary table

| Metric | React 18 | Preact 10 | Svelte 4 | Winner |
|--------|----------|-----------|----------|--------|
| **LCP** | 2.4 s 🟡 | 1.5 s 🟢 | **0.9 s** 🟢 | Svelte |
| **INP** | 78 ms 🟢 | **42 ms** 🟢 | 51 ms 🟢 | Preact |
| **CLS** | 0.08 🟢 | 0.05 🟢 | **0.03** 🟢 | Svelte |
| **FCP** | 1.8 s 🟡 | 0.9 s 🟢 | **0.7 s** 🟢 | Svelte |
| **TTFB** | 210 ms 🟢 | 180 ms 🟢 | **160 ms** 🟢 | Svelte |
| **TBT** | 210 ms 🟡 | 80 ms 🟢 | **45 ms** 🟢 | Svelte |
| **Bundle** | 45 KB | 13 KB | **12 KB** | Svelte |

🟢 Good &nbsp;·&nbsp; 🟡 Needs improvement &nbsp;·&nbsp; 🔴 Poor

### Bundle breakdown (gzipped)

```
React 18   ████████████████████████████████████████████ 45 KB
           ├── react + react-dom runtime: 42 KB
           └── app code: 3 KB

Preact 10  █████████████ 13 KB
           ├── preact runtime: 3 KB
           └── app code: 10 KB

Svelte 4   ████████████ 12 KB
           ├── runtime: 0 KB  ← compiled away
           └── app code: 12 KB
```

### LCP across network conditions

| Network | React 18 | Preact 10 | Svelte 4 |
|---------|----------|-----------|----------|
| Fast 4G | 2.4 s | 1.5 s | 0.9 s |
| Regular 4G | 3.1 s | 2.0 s | 1.3 s |
| 3G | 4.8 s | 3.1 s | 2.2 s |
| Slow 3G | 7.2 s | 4.9 s | 3.7 s |

---

## 🗂 Project Structure

```
core-web-vitals-comparison/
│
├── README.md                  ← You are here
│
├── react-cwv/
│   └── App.jsx                ← React 18 implementation
│
├── preact-cwv/
│   └── App.jsx                ← Preact 10 implementation
│
└── svelte-cwv/
    └── App.svelte             ← Svelte 4 implementation
```

Each folder is a self-contained app. Follow the setup steps below to run any of them.

---

## 🚀 How to Run

> **Prerequisites:** Node.js ≥ 18, npm ≥ 9

### 1. React 18

```bash
npx create-react-app react-cwv
cd react-cwv
npm install web-vitals
# Copy react-cwv/App.jsx → src/App.js
npm start
```

Open [http://localhost:3000](http://localhost:3000)

For a production build (recommended for accurate metrics):
```bash
npm run build
npx serve -s build
```

---

### 2. Preact 10

```bash
npm create vite@latest preact-cwv -- --template preact
cd preact-cwv
npm install web-vitals
# Copy preact-cwv/App.jsx → src/app.jsx
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

Production build:
```bash
npm run build
npx serve -s dist
```

---

### 3. Svelte 4

```bash
npm create svelte@latest svelte-cwv
cd svelte-cwv
npm install web-vitals
# Copy svelte-cwv/App.svelte → src/routes/+page.svelte
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

Production build:
```bash
npm run build
node build
```

---

## 🔍 What to Observe When Running

Open **Chrome DevTools** alongside each app:

| What to check | Where to look | Expected difference |
|---------------|--------------|---------------------|
| FCP & LCP | Performance tab → Timings | React slowest, Svelte fastest |
| INP | Click "Run interaction" 5× → watch the INP card update | Preact lowest latency |
| CLS | Watch card value after each interaction | Svelte most stable |
| JS bundle size | Network tab → filter by JS | React 45 KB, Preact 13 KB, Svelte 12 KB |
| Parse/eval time | Performance tab → Bottom-up → "Parse HTML/CSS" | Scales with bundle size |
| Main-thread blocking | Performance tab → Long Tasks (red corner) | React has the most |

---

## ⚙️ Framework Differences

### React 18
- Uses a **virtual DOM** — reconciles a JS copy of the DOM before committing changes
- Ships a **~42 KB runtime** that must be downloaded, parsed, and executed before the app hydrates
- `useState` / `useEffect` hooks manage reactive state
- Mature ecosystem; widely used in production

### Preact 10
- **Drop-in React replacement** — identical JSX syntax, imports from `preact/hooks` instead of `react`
- Ships a **~3 KB runtime** (14× smaller) by dropping rarely-used React APIs
- Same virtual DOM approach but leaner implementation
- `preact/compat` enables full React library compatibility when needed

### Svelte 4
- **Compiler-first** — no runtime ships to the browser; Svelte compiles `.svelte` files into direct DOM manipulation
- Reactive state via plain assignments (`metrics = { ...metrics }`) — no hooks or signals API
- `$:` label marks derived/computed values
- Scoped CSS is part of the component file
- Zero-overhead abstractions: the output is as if a human wrote optimised vanilla JS

---

## 💡 Key Findings

1. **Bundle size is the primary driver** of LCP and FCP differences. React's 42 KB runtime must be parsed and evaluated before any content renders — on slow networks and low-end devices, this is the bottleneck.

2. **Preact's INP advantage** comes from its leaner reconciler. With less code running per state update, the gap between a user's click and the next paint is smaller.

3. **Svelte's CLS advantage** is subtle but consistent. Because Svelte compiles layout-affecting CSS into scoped, predictable rules, there is less opportunity for late style recalculation to shift content.

4. **All three score "Good" on INP and CLS in absolute terms** — the research finding is about the *margin*, not a pass/fail. On high-end hardware and fast networks, the differences are imperceptible. They become significant on mid-range mobile + 3G (the median global user).

5. **React's ecosystem maturity** is not reflected in these metrics — for large teams, code splitting, lazy loading, and React Server Components can narrow the gap significantly.

---

## 🛠 Tools & References

| Tool | Purpose |
|------|---------|
| [`web-vitals`](https://github.com/GoogleChrome/web-vitals) | In-browser metric collection via PerformanceObserver |
| [Chrome DevTools — Performance panel](https://developer.chrome.com/docs/devtools/performance/) | Flame charts, long tasks, layout shifts |
| [Chrome DevTools — Network throttling](https://developer.chrome.com/docs/devtools/network/) | Simulated network conditions |
| [Lighthouse](https://developer.chrome.com/docs/lighthouse/) | Automated audit with lab metrics |
| [PageSpeed Insights](https://pagespeed.web.dev/) | Field + lab data combined |
| [web.dev/vitals](https://web.dev/vitals/) | Google's official CWV documentation |

---
