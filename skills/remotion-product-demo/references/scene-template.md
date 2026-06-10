# Scene Template

Complete skeleton for a product-demo scene. Replace `<...>` placeholders with values from your Phase 2 interview.

```tsx
// remotion/<feature>/<Feature>Scene.tsx
import "../../src/index.css"; // Tailwind bundle (remove if host doesn't use Tailwind)
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
// Relative paths so Remotion's webpack resolves without tsconfig-paths.
// The "@" alias also works once remotion.config.ts is set up — either is fine.
import { <TargetComponent> } from "../../src/components/<path>/<TargetComponent>";
import { DemoProviders } from "./DemoProviders";
import { mock<Feature>Data } from "./mock<Feature>Data";

export const TOTAL_FRAMES = <fps * seconds>; // keep in sync with Root.tsx + Player

type Theme = "light" | "dark";

interface <Feature>SceneProps {
  /** Fixed light/dark, or omit to follow the app's theme (reads .dark on <html>). */
  theme?: Theme;
}

const getAppTheme = (): Theme => {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

export const <Feature>Scene: React.FC<<Feature>SceneProps> = ({ theme: themeProp }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const theme = themeProp ?? getAppTheme();

  // ── Portal container for Radix Dialog/Popover ───────────────────────────
  // The `transform: translateZ(0)` below makes this div a containing block
  // for `position: fixed` descendants, keeping the dialog bounded to the
  // 1920×1080 frame instead of covering the host app viewport.
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => setPortalEl(portalRef.current), []);

  // ── Scene beats (adjust frame numbers to your scene length) ─────────────
  const LIBRARY_CLICK_FRAME = Math.round(fps * 0.8);   // cursor clicks card
  const DIALOG_OPEN_FRAME = Math.round(fps * 1.0);     // spring-in begins
  const STATE_CLICK_FRAME = Math.round(fps * 7.0);     // cursor clicks next tab/step
  const STATE_CHANGE_FRAME = Math.round(fps * 7.5);    // controlled state flips
  const END_FRAME = TOTAL_FRAMES;

  // Controlled state driven by frame (e.g. active tab)
  const <stateVar> = frame >= STATE_CHANGE_FRAME ? "<second>" : "<first>";
  const dialogOpen = frame >= DIALOG_OPEN_FRAME;

  // ── Camera zoom into the dialog ─────────────────────────────────────────
  const ZOOM_IN_START = DIALOG_OPEN_FRAME + 30;
  const ZOOM_IN_END = DIALOG_OPEN_FRAME + 60;
  const ZOOM_OUT_START = END_FRAME - 30;
  const ZOOM_OUT_END = END_FRAME;
  const MAX_ZOOM = 1.38;
  const cameraZoom = interpolate(
    frame,
    [ZOOM_IN_START, ZOOM_IN_END, ZOOM_OUT_START, ZOOM_OUT_END],
    [1, MAX_ZOOM, MAX_ZOOM, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );

  // ── Cursor path ─────────────────────────────────────────────────────────
  const approachX = interpolate(frame, [0, LIBRARY_CLICK_FRAME], [width * 0.8, width * 0.18], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const approachY = interpolate(frame, [0, LIBRARY_CLICK_FRAME], [height * 0.35, height * 0.32], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const idleX = width * 0.52;
  const idleY = height * 0.55;
  // Compensate for camera zoom (transform-origin center) when placing clicks on zoomed content.
  const targetBaseX = width * 0.37;
  const targetBaseY = height * 0.30;
  const targetX = width / 2 + (targetBaseX - width / 2) * MAX_ZOOM;
  const targetY = height / 2 + (targetBaseY - height / 2) * MAX_ZOOM;

  const cursorX = frame < LIBRARY_CLICK_FRAME ? approachX
    : frame < STATE_CLICK_FRAME - 30
      ? interpolate(frame, [LIBRARY_CLICK_FRAME, LIBRARY_CLICK_FRAME + 36], [approachX, idleX], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
        })
      : interpolate(frame, [STATE_CLICK_FRAME - 30, STATE_CLICK_FRAME], [idleX, targetX], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
        });
  const cursorY = frame < LIBRARY_CLICK_FRAME ? approachY
    : frame < STATE_CLICK_FRAME - 30
      ? interpolate(frame, [LIBRARY_CLICK_FRAME, LIBRARY_CLICK_FRAME + 36], [approachY, idleY], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
        })
      : interpolate(frame, [STATE_CLICK_FRAME - 30, STATE_CLICK_FRAME], [idleY, targetY], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
        });

  // Click ripples
  const entryClickRipple = frame >= LIBRARY_CLICK_FRAME && frame <= LIBRARY_CLICK_FRAME + 15;
  const stateClickRipple = frame >= STATE_CLICK_FRAME && frame <= STATE_CLICK_FRAME + 15;

  // Dialog spring entrance
  const dialogSpring = spring({
    frame: frame - DIALOG_OPEN_FRAME,
    fps,
    config: { damping: 200, mass: 0.5, stiffness: 140 },
    durationInFrames: 20,
  });
  const dialogOpacity = interpolate(dialogSpring, [0, 1], [0, 1]);
  const dialogScale = interpolate(dialogSpring, [0, 1], [0.96, 1]);

  // ── Optional: silent WAV for components with an audio/video player ──────
  const audioSrc = useMemo(
    () => (typeof window === "undefined"
      ? undefined
      : createSilentWavDataUrl(mock<Feature>Data.duration ?? 120)),
    []
  );
  const mockDataWithAudio = useMemo(
    () => ({
      ...mock<Feature>Data,
      artifacts: { ...(mock<Feature>Data.artifacts ?? {}), audioFileUrl: audioSrc },
    }),
    [audioSrc]
  );

  const noop = () => {};

  return (
    <AbsoluteFill
      style={{ overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}
      className={theme === "dark" ? "dark" : undefined}
    >
      {/* Portal target — transform creates a containing block for position:fixed. */}
      <div
        ref={portalRef}
        data-<feature>-demo-portal=""
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateZ(0) scale(${cameraZoom})`,
          transformOrigin: "center center",
          pointerEvents: "none",
          zIndex: 9998,
        }}
      />

      <style>{`
        [data-<feature>-demo-portal] .<feature>-demo-dialog[role="dialog"] {
          height: auto !important;
          max-height: 780px !important;
          width: 960px !important;
          max-width: 960px !important;
        }
        [data-<feature>-demo-portal] > * { pointer-events: auto; }
        /* Lighten Radix's default overlay, scoped to this composition. */
        [data-<feature>-demo-portal] .fixed.inset-0.bg-black\\/80 {
          background-color: rgba(0, 0, 0, 0.25) !important;
        }
      `}</style>

      <DemoProviders>
        {/* Background — optional entry page the cursor clicks */}
        {/* e.g. <MockLibraryPage theme={theme} /> */}

        {dialogOpen && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: dialogOpacity,
              transform: `scale(${dialogScale})`,
              transformOrigin: "center center",
            }}
          >
            <<TargetComponent>
              data={mockDataWithAudio}
              open={true}
              onOpenChange={noop}
              controlled<State>={<stateVar>}
              on<State>Change={noop}
              dialogContentClassName="<feature>-demo-dialog"
              dialogPortalContainer={portalEl}
              nonModal
            />
          </div>
        )}

        {entryClickRipple && (
          <Ripple x={width * 0.18} y={height * 0.32} color="#3b82f6" frame={frame - LIBRARY_CLICK_FRAME} />
        )}
        {stateClickRipple && (
          <Ripple x={targetX} y={targetY} color="#3b82f6" frame={frame - STATE_CLICK_FRAME} />
        )}

        <Cursor x={cursorX} y={cursorY} />
      </DemoProviders>
    </AbsoluteFill>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────
const Cursor: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div
    style={{
      position: "absolute", left: x, top: y, width: 22, height: 22,
      pointerEvents: "none", zIndex: 10000, transform: "translate(-50%, -50%)",
    }}
  >
    <div style={{
      width: 22, height: 22, borderRadius: "50%",
      border: "2px solid currentColor", backgroundColor: "white", opacity: 0.85,
    }}/>
    <div style={{
      position: "absolute", left: "50%", top: "50%", width: 8, height: 8,
      backgroundColor: "currentColor", borderRadius: "50%", transform: "translate(-50%, -50%)",
    }}/>
  </div>
);

const Ripple: React.FC<{ x: number; y: number; color: string; frame: number }> = ({
  x, y, color, frame,
}) => {
  const progress = Math.min(Math.max(frame / 18, 0), 1);
  const size = progress * 110;
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2,
      borderRadius: "50%", border: `2px solid ${color}`, opacity: 1 - progress,
      pointerEvents: "none", zIndex: 9999,
    }}/>
  );
};

// ── Silent WAV helper (only include if the component has an audio player) ──
function createSilentWavDataUrl(durationSeconds: number): string {
  const sampleRate = 8000;
  const numSamples = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const dataLen = numSamples;
  const buffer = new Uint8Array(44 + dataLen);
  const view = new DataView(buffer.buffer);
  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) buffer[offset + i] = str.charCodeAt(i);
  };
  writeAscii(0, "RIFF"); view.setUint32(4, 36 + dataLen, true);
  writeAscii(8, "WAVE"); writeAscii(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  writeAscii(36, "data"); view.setUint32(40, dataLen, true);
  buffer.fill(0x80, 44);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < buffer.length; i += chunk) {
    binary += String.fromCharCode(...buffer.subarray(i, i + chunk));
  }
  return "data:audio/wav;base64," + btoa(binary);
}
```

## Adaptation notes

- **If the component has more than one driveable state** (tabs + steps + open/close), add additional `controlled*` props and corresponding frame thresholds.
- **If there's no entry page** (component rendered alone), skip the cursor approach beat and open the dialog at frame 0.
- **If the host doesn't use Tailwind**, remove the `import "../../src/index.css"` line and replace any Tailwind classes in the sub-components with inline styles.
- **If the host doesn't use Radix**, skip the portal-container div and the scoped `<style>` block entirely.
- **Camera zoom is optional** — setting `MAX_ZOOM = 1.0` disables it. A 1.2–1.4× zoom is the usual sweet spot.
