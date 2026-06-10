---
name: lighthouse
description: |
  Run Lighthouse CI performance audits on a Vite/React SPA and fix failing routes.
  Use when: (1) Checking if public routes meet a performance threshold (e.g. ≥85),
  (2) Diagnosing slow FCP/LCP on landing or marketing pages,
  (3) Adding Lighthouse CI to a project for the first time,
  (4) After image or font changes that affect render-critical path.
allowed-tools: Read, Bash, Edit, Write, Grep, Glob
---

# Lighthouse CI Skill

Run, interpret, and fix Lighthouse performance audits for Vite/React SPAs.

---

## Setup (first time only)

### 1. Install `@lhci/cli`

```bash
npm install --save-dev @lhci/cli
```

### 2. Add scripts to `package.json`

```json
"lighthouse": "bash scripts/lighthouse-ci.sh",
"lighthouse:ci": "lhci autorun"
```

### 3. Create `.lighthouserc.json` at the project root

Test **public routes only** — authenticated routes redirect to `/login` and won't give useful scores.

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run preview",
      "startServerReadyPattern": "Local",
      "startServerReadyTimeout": 30000,
      "url": [
        "http://localhost:4173/",
        "http://localhost:4173/login",
        "http://localhost:4173/pricing",
        "http://localhost:4173/features"
      ],
      "numberOfRuns": 1,
      "settings": {
        "chromeFlags": "--no-sandbox --disable-dev-shm-usage"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance":    ["error", { "minScore": 0.85 }],
        "categories:accessibility":  ["warn",  { "minScore": 0.85 }],
        "categories:best-practices": ["warn",  { "minScore": 0.85 }],
        "categories:seo":            ["warn",  { "minScore": 0.85 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**Do NOT use `preset: "lighthouse:no-pwa"`** — it enables 30+ extra audit assertions
(unused-css-rules, errors-in-console, network-dependency-tree-insight, etc.) that
are not related to the performance score and will cause spurious failures.

### 4. Create `scripts/lighthouse-ci.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
echo "▶ Building production bundle…"
npm run build
echo "▶ Running Lighthouse CI…"
npx lhci autorun
echo "✓ Lighthouse CI complete"
```

---

## Running

```bash
# Build + run in one command
npm run lighthouse

# Or separately
npm run build && npx lhci autorun
```

---

## Reading scores from the JSON reports

After a run, `.lighthouseci/*.json` holds the raw results. Extract scores:

```bash
for f in .lighthouseci/lhr-*.json; do
  url=$(node -e "const d=require('$f'); console.log(d.finalUrl)")
  perf=$(node -e "const d=require('$f'); console.log(d.categories.performance.score)")
  acc=$(node -e "const d=require('$f'); console.log(d.categories.accessibility.score)")
  bp=$(node -e "const d=require('$f'); console.log(d.categories['best-practices'].score)")
  seo=$(node -e "const d=require('$f'); console.log(d.categories.seo.score)")
  echo "$url  perf=$perf  a11y=$acc  best-practices=$bp  seo=$seo"
done
```

Scores are 0–1 (multiply by 100 for the familiar Lighthouse percentage).

---

## Diagnosing a failing performance score

When a route's `categories:performance` is below threshold, check these in order:

### 1. Render-blocking resources (most impactful)

CSS `@import url("https://fonts.googleapis.com/...")` in a stylesheet is **synchronous
and render-blocking** — it is the single most common cause of low FCP/LCP on SPAs.

**Fix:** Remove every `@import url(...)` for external fonts from CSS files.
Load fonts in `index.html` using the non-blocking pattern:

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=YourFont&display=swap"
  media="print"
  onload="this.media='all'"
/>
<noscript>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=YourFont&display=swap"
  />
</noscript>
```

The `media="print"` trick: the browser loads this stylesheet off the critical path
(print stylesheets don't block render); `onload` flips it to `all` once loaded.
The `<noscript>` fallback loads it synchronously for browsers with JS disabled.

### 2. LCP element (hero image) too slow

The Largest Contentful Paint element is usually the hero image on a marketing page.
Lighthouse simulates Slow 4G, so large images will score very poorly.

**Diagnose:** LCP score < 0.5 means the LCP element is taking > ~4s on slow 4G.

**Fix sequence:**

**a) Convert images to WebP** — requires `sharp-cli` (`npx sharp-cli`):

```bash
# Check if sharp-cli is available
npx sharp-cli --version

# Convert a single image (quality 75–80 is the sweet spot)
npx sharp-cli -i hero.jpg -o hero.webp -f webp -q 75

# Resize + convert (use actual display dimensions, not original image dims)
npx sharp-cli -i hero.jpg -o hero.webp -f webp -q 75 resize 960 720

# Batch convert all JPEGs in a directory
for f in src/assets/*.jpg; do
  npx sharp-cli -i "$f" -o "${f%.jpg}.webp" -f webp -q 75
done
```

Update import statements from `.jpg` → `.webp` in your components.

**b) Add a `<link rel="preload">` for the hero** — tells the browser to fetch the
image before it even parses the component tree. With Vite, the asset filename is
content-hashed at build time, so the preload tag must be injected via a Vite plugin:

Add this to `vite.config.ts`:

```ts
import { type Plugin } from "vite";

function heroPreloadPlugin(): Plugin {
  let heroAssetPath = "";
  return {
    name: "hero-preload",
    generateBundle(_opts, bundle) {
      for (const file of Object.keys(bundle)) {
        if (file.includes("landing-hero") && file.endsWith(".webp")) {
          heroAssetPath = `/${file}`;
          break;
        }
      }
    },
    transformIndexHtml: {
      order: "post",
      handler(html) {
        if (!heroAssetPath) return html;
        const tag = `  <link rel="preload" as="image" href="${heroAssetPath}" type="image/webp" fetchpriority="high" />\n`;
        return html.replace("</head>", `${tag}</head>`);
      },
    },
  };
}
```

Then register it: `plugins: [react(), heroPreloadPlugin()]`

**c) Mark the LCP `<img>` element:**

```tsx
<img
  src={heroImage}
  fetchPriority="high"
  decoding="async"
  ...
/>
```

**d) Mark below-the-fold images as lazy:**

```tsx
<img src={featureImage} loading="lazy" ... />
```

### 3. JavaScript bundle size

If TBT (Total Blocking Time) is high, the JS bundle is blocking the main thread.
Check what's in the main chunk:

```bash
npm run build 2>&1 | grep "gzip"
```

Common fixes:
- Code-split heavy libraries (`recharts`, `date-fns`, `zod`) via `manualChunks` in `vite.config.ts`
- Lazy-load admin/authenticated routes — they don't need to load on the marketing page

Example `manualChunks`:
```ts
manualChunks: {
  "react-vendor": ["react", "react-dom", "react-router-dom"],
  "charts":       ["recharts"],
  "forms":        ["react-hook-form", "@hookform/resolvers", "zod"],
  "ui-vendor":    ["@radix-ui/react-dialog", /* ... */],
}
```

---

## Decision guide — when to stop optimizing

Per the S7-10 spec rule: **if a route genuinely can't reach 85 after the above fixes,
document the blocker and ship at 80 with a tech-debt ticket.**

The fundamental limitation of an SPA landing page is that the browser must download
JS → execute → render before anything appears. Server-side rendering (Next.js, Astro)
is the structural fix for scores consistently above 95. That is an architectural
decision, not a Lighthouse CI task.

---

## RTL screenshots (companion task)

If the project supports Hebrew/RTL, capture screenshots of every route in Hebrew
locale using Playwright. Create `e2e-tests/rtl-screenshots.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "../playwright/rtl-screenshots");

const PUBLIC_ROUTES = [
  { name: "landing", path: "/" },
  { name: "login",   path: "/login" },
];

test.describe("Hebrew RTL screenshots", () => {
  test.beforeEach(async ({ page }) => {
    // Seed Hebrew locale before navigation
    await page.addInitScript(() => {
      localStorage.setItem("i18nextLng", "he");
    });
  });

  for (const route of PUBLIC_ROUTES) {
    test(`RTL · ${route.name}`, async ({ page }) => {
      await page.goto(`http://localhost:4173${route.path}`);
      await page.waitForLoadState("networkidle");

      const dir = await page.evaluate(() =>
        document.documentElement.getAttribute("dir")
      );
      expect(dir).toBe("rtl");

      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${route.name}-he.png`),
        fullPage: true,
      });
    });
  }
});
```

Add script to `package.json`:
```json
"test:rtl": "playwright test e2e-tests/rtl-screenshots.spec.ts --project=chromium"
```

Run against the preview server:
```bash
npm run preview &
sleep 4 && npm run test:rtl
kill %1
```

**Note:** `__dirname` is not available in ES module scope — always use
`path.dirname(fileURLToPath(import.meta.url))` instead.

---

## Checklist

- [ ] `@lhci/cli` installed as devDependency
- [ ] `.lighthouserc.json` present — **no `preset`**, only custom `assertions`
- [ ] `npm run build` succeeds before running `lhci autorun`
- [ ] All `@import url(...)` for external fonts removed from CSS
- [ ] Hero image converted to WebP, resized to actual display dimensions
- [ ] Hero `<link rel="preload">` injected via Vite plugin (not hardcoded in `index.html`)
- [ ] Hero `<img>` has `fetchPriority="high"` and `decoding="async"`
- [ ] Feature/secondary images have `loading="lazy"`
- [ ] All 4 public routes score ≥ 0.85 on `categories:performance`
- [ ] Scores extracted from `.lighthouseci/lhr-*.json` and reviewed
