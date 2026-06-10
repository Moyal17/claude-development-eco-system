# Fonts & Brand Kit

Pixel-perfect parity is the whole point of this skill. That means matching the host app's **font family** and knowing enough about the **brand** to build an intro and end card that feel native.

## 1. Discover the host font

Check, in order:

1. `tailwind.config.{ts,js}` — `theme.extend.fontFamily.sans` is usually the primary font.
2. `src/index.css` / global CSS — `@import url(...fonts.googleapis.com...)` or `@font-face { src: url(...) }`.
3. `src/App.tsx` / root layout — inline `<link>` to Google Fonts.
4. `package.json` — presence of `@fontsource/...` packages.

Record the family name exactly (e.g. `Inter`, `DM Sans`, `Manrope`, `Plus Jakarta Sans`).

## 2. Load the same font in the scene

### Option A — Google Fonts (most common)

```bash
npm install --save-dev @remotion/google-fonts
```

In the scene file:

```ts
import { loadFont } from "@remotion/google-fonts/Inter";
const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
});
```

Use `fontFamily` as the root `fontFamily` style on your `AbsoluteFill`:

```tsx
<AbsoluteFill style={{ fontFamily, /* ... */ }}>
```

Remotion bundles the font bytes into the video. No external fetches at render time.

### Option B — Local font file

If the host ships a font in `public/fonts/` or `src/assets/`:

```ts
import { staticFile } from "remotion";

// At the top of the scene file, not inside the component:
const font = new FontFace(
  "<Family>",
  `url(${staticFile("fonts/<family>-variable.woff2")})`
);
font.load().then(() => document.fonts.add(font));
```

### NEVER fall back to `system-ui`

The default in our scene template used `-apple-system, BlinkMacSystemFont, 'Inter', sans-serif`. That only works if the host OS has Inter (or close enough). On a fresh render machine, `system-ui` makes the whole UI look wrong. Always load the real font.

## 3. Collect the brand kit (Phase 2 interview)

Ask the user for:

| Field | Example | Where it's used |
|---|---|---|
| `brand.name` | `"TransVibe"` | alt text on logo, end-card subtitle |
| `brand.logoPath` | `"logo.svg"` (relative to `public/`) | beat 1 intro + beat 5 end card |
| `brand.primary` | `"#3b82f6"` | intro background, end-card background, callout accent |
| `brand.tagline` | `"Transcription without the tab tax"` | end card headline |
| `brand.fontFamily` | `"Inter"` | scene body + end card + callout |
| `cta` | `"Try it free — transvibe.app"` | end-card line 3 |

If the host has a `src/lib/brand.ts` or `src/config/brand.ts` with these values, read it instead of asking. If not, ask once and save the answers in a scene-local `brand.ts` file so subsequent demos don't re-ask:

```ts
// remotion/<feature>/brand.ts
export const brand = {
  name: "TransVibe",
  logoPath: "logo.svg",
  primary: "#3b82f6",
  tagline: "Transcription without the tab tax",
  fontFamily: "Inter",
} as const;
export const cta = "Try it free — transvibe.app";
```

## 4. Scene wiring

```tsx
import { loadFont } from "@remotion/google-fonts/Inter";
import { staticFile } from "remotion";
import { brand, cta } from "./brand";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700"] });

// Inside the component:
<AbsoluteFill style={{ fontFamily, /* ... */ }}>
  {/* Beat 1 — brand intro */}
  {frame < BRAND_INTRO_END && (
    <AbsoluteFill style={{
      backgroundColor: brand.primary,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: logoOpacity,
    }}>
      <img src={staticFile(brand.logoPath)} alt={brand.name} style={{ maxWidth: 320 }} />
    </AbsoluteFill>
  )}

  {/* ...main scene... */}

  {/* Beat 5 — end card */}
  {frame >= END_CARD_START && (
    <AbsoluteFill style={{
      backgroundColor: brand.primary,
      color: "white",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 24,
      opacity: endCardOpacity,
    }}>
      <img src={staticFile(brand.logoPath)} alt={brand.name} style={{ height: 96 }} />
      <div style={{ fontSize: 48, fontWeight: 700 }}>{brand.tagline}</div>
      <div style={{ fontSize: 28, opacity: 0.85 }}>{cta}</div>
    </AbsoluteFill>
  )}
</AbsoluteFill>
```

## 5. Logo color variants

- If `brand.primary` is dark and the logo is also dark → use a white background for the intro (not the brand color) and move the brand color to an accent.
- If the logo is SVG, you can recolor it inline via `filter: brightness(0) invert(1)` for a white-on-color version.
- For the end card, prefer a light logo on the brand color — it reads more like a marketing wrap-up.

## 6. When to skip the brand kit

- **Internal/engineering demo** — skip beats 1 and 5 entirely. The scene starts at mount and ends at the last interaction.
- **Host app has no established brand** (very early stage) — use a minimal wordmark in the host font as the logo placeholder.
