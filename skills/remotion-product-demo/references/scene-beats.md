# Scene Beats — 5-Beat Marketing Structure

Every product-demo scene follows the same 5-beat rhythm, scaled to its total length. The default is **20 seconds @ 30fps = 600 frames**.

## The 5 beats

| # | Beat | Purpose |
|---|---|---|
| 1 | **Brand intro** | Logo fades in on a clean background in the brand's primary color, then wipes away. Sets product identity before the product is visible. |
| 2 | **Component mount** | The component arrives with a subtle camera push-in (`scale: 1.02 → 1.0`) + 8px upward drift, ease-out, soft drop shadow. Lifts the UI off the background and signals "here's the product". |
| 3 | **Scripted interaction beats** | The actual story — cursor moves, hovers, clicks, filter changes, tab switches, typing, row selections, chart transitions. Each beat uses `spring()` for motion; hold **~1.2s between beats** so viewers can read the result. |
| 4 | **Zoom + annotation callout** | Push into the single most impressive part of the UI (result, chart, output). Render a callout label pointing to it, using the brand font + primary-color accent. |
| 5 | **End card** | Pull back to full view → fade out the UI → fade in logo + one-line tagline + CTA on a clean brand-colored background. |

## Frame math

Pick the row matching the scene length. Beats scale proportionally.

| Scene | 1. Intro | 2. Mount | 3. Interactions | 4. Zoom callout | 5. End card | Total |
|---|---|---|---|---|---|---|
| **15s** (450f) | 0–30 | 30–75 | 75–300 | 300–390 | 390–450 | 450 |
| **20s (default)** (600f) | 0–36 | 36–90 | 90–420 | 420–510 | 510–600 | 600 |
| **30s** (900f) | 0–45 | 45–120 | 120–660 | 660–810 | 810–900 | 900 |

## Pacing rule — "hold 1.2s between beats"

When the cursor arrives at a target, the state must flip **at that frame**, then sit still for ~36 frames (≈1.2s at 30fps) before the next beat starts. Viewers can't read a dashboard if you rip through it in 200ms.

```ts
// Each beat: cursor arrives → state flips → hold → next cursor move
const TAB_CLICK_FRAME = 180;
const TAB_STATE_FRAME = TAB_CLICK_FRAME + 3;   // state flips 3 frames after click
const NEXT_CURSOR_MOVE_FRAME = TAB_STATE_FRAME + 36; // hold ~1.2s
```

## Beat 1 — Brand intro

```tsx
// Frames 0 to BRAND_INTRO_END (e.g. 36)
const BRAND_INTRO_END = Math.round(fps * 1.2);

const logoOpacity = interpolate(
  frame,
  [0, 9, BRAND_INTRO_END - 9, BRAND_INTRO_END],
  [0, 1, 1, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);

{frame < BRAND_INTRO_END && (
  <AbsoluteFill style={{ backgroundColor: brand.primary, opacity: logoOpacity,
                         display: "flex", alignItems: "center", justifyContent: "center" }}>
    <img src={staticFile(brand.logoPath)} alt={brand.name} style={{ maxWidth: 320 }} />
  </AbsoluteFill>
)}
```

Use a white or light-neutral backdrop if the brand primary is too dark for a logo on top; invert if the logo is dark-only.

## Beat 2 — Component mount (push-in + drift + drop shadow)

Apply to the component's outer wrapper:

```ts
const MOUNT_START = BRAND_INTRO_END;
const MOUNT_END = MOUNT_START + Math.round(fps * 1.5); // 1.5s ease-out settle

const mountProgress = interpolate(frame, [MOUNT_START, MOUNT_END], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
});
const mountScale = interpolate(mountProgress, [0, 1], [1.02, 1.0]); // push-in
const mountDrift = interpolate(mountProgress, [0, 1], [8, 0]);      // 8px upward
const mountShadow = interpolate(mountProgress, [0, 1], [0, 1]);
```

Apply in style:

```tsx
transform: `translateY(${mountDrift}px) scale(${mountScale})`,
boxShadow: `0 ${24 * mountShadow}px ${48 * mountShadow}px rgba(0,0,0,${0.18 * mountShadow})`,
```

## Beat 3 — Scripted interactions

Each interaction follows the pattern:

1. Cursor moves to target (30 frames of motion, `Easing.inOut(Easing.cubic)`).
2. Click ripple at arrival frame (15-frame expand).
3. Controlled state flips (3 frames after click for reaction feel).
4. **Hold** for ~36 frames.
5. Next interaction starts.

For a 20s scene there's ~11s of interaction time (frames 90–420) → ~4–6 interaction beats.

## Beat 4 — Zoom + annotation callout

```tsx
// Camera zoom into a specific region of the UI
const ZOOM_START = 420;
const ZOOM_END = 450;
const zoom = interpolate(frame, [ZOOM_START, ZOOM_END], [1, 1.6], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
});

// Annotation callout fades in after zoom settles
const calloutOpacity = interpolate(frame, [ZOOM_END + 6, ZOOM_END + 18], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});

{frame > ZOOM_END && (
  <div style={{
    position: "absolute",
    left: <xPx>, top: <yPx>,
    opacity: calloutOpacity,
    fontFamily: brand.fontFamily,
    color: brand.primary,
    fontSize: 28, fontWeight: 700,
    padding: "8px 14px",
    background: "white",
    borderRadius: 8,
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  }}>
    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4,
                   background: brand.primary, marginRight: 8 }} />
    {calloutText /* e.g. "All speakers, auto-detected" */}
  </div>
)}
```

Place the callout near the region being zoomed, with a short line or dot pointing at it. One callout per scene. Keep the text under 6 words.

## Beat 5 — End card

```tsx
const END_CARD_START = 510;
const endCardOpacity = interpolate(frame, [END_CARD_START, END_CARD_START + 18], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});

{frame >= END_CARD_START && (
  <AbsoluteFill style={{
    backgroundColor: brand.primary,
    opacity: endCardOpacity,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 24,
    fontFamily: brand.fontFamily,
    color: "white",
  }}>
    <img src={staticFile(brand.logoPath)} alt={brand.name} style={{ height: 96 }} />
    <div style={{ fontSize: 48, fontWeight: 700, textAlign: "center" }}>{brand.tagline}</div>
    <div style={{ fontSize: 28, opacity: 0.85 }}>{cta /* e.g. "Try it free — yourapp.com" */}</div>
  </AbsoluteFill>
)}
```

## Typing interaction (when a scene includes form input)

Drive the input's `value` prop character-by-character with `useCurrentFrame`:

```ts
const TYPE_START = 240;
const TYPE_TEXT = "product metrics";
const TYPE_CHAR_DURATION = 3; // 3 frames per character ≈ 100ms

const typedLength = Math.max(0, Math.min(
  TYPE_TEXT.length,
  Math.floor((frame - TYPE_START) / TYPE_CHAR_DURATION)
));
const typedValue = TYPE_TEXT.slice(0, typedLength);
```

Pass `typedValue` into the controlled `value` prop. Add a blinking caret if the input doesn't render one natively:

```tsx
{typedValue}
{frame >= TYPE_START && Math.floor(frame / 15) % 2 === 0 && "|"}
```

## When to skip beats

- **Internal demo (no marketing intent):** skip beats 1, 4, 5. Start at mount, end at interaction end. Useful for engineering debug videos.
- **Very short scene (<12s):** skip beat 4 (callout) and shorten beat 5 to 1.5s.
- **Component has no "most impressive region":** skip beat 4, let the hold at the end of beat 3 act as the visual climax.
