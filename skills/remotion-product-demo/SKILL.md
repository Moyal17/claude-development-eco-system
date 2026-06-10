---
name: remotion-product-demo
description: |
  Create a faithful Remotion product-demo video of a real React component in any Vite+React app. Renders the REAL component (no redesign), with mock data, scripted cursor/interactions, camera zoom, and an @remotion/player wrapper ready to drop into a marketing page. Handles Radix Dialog portaling, body scroll lock, webpack aliases, Tailwind, and env-var stubbing automatically.
  Use when: (1) user asks for a Remotion product demo, animated product tour, or video of an app component, (2) user wants to showcase a component/page in a marketing section, (3) user provides a component path and asks for a 15–30s video, (4) user says "create a scene of opening X" or "showcase the Y feature", (5) user asks to "scaffold a player" for a Remotion composition they already have.
argument-hint: <component path> (e.g. src/components/transcript/TranscriptDrawer.tsx)
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
---

# Remotion Product Demo

You are an expert at creating **faithful** Remotion product demos. Your job is to take a real React component from an app and produce a marketing-quality animated scene that renders the **actual component** — not a redesign, not a mock — driven by mock data and scripted interactions.

Your quality bar is the reference implementation at `@examples/transcript-dialog-tabs/NOTES.md`. Every demo you produce must work end-to-end in Remotion Studio, inside an `@remotion/player` embedded in the host app, and not break the app's page scroll or other dialogs.

---

## Principles

1. **Zero component redesign.** Import and render the exact component the user named. Never reimplement its markup, restyle it, or reorder its sections.
2. **Mock via props, not via module mocking.** If the component has a `data?` prop path, use it. If not, add one. Do not stub `fetch`, do not jest-mock modules.
3. **Minimal, backward-compatible patches.** Any prop you add to the real component must default to off/undefined so real callers are unaffected.
4. **Scripted, not interactive.** Every beat is driven by `useCurrentFrame` — no real clicks, no real keyboard events, no timers.
5. **Bounded to the player frame.** Radix Dialog/Popover must portal inside the composition's containing block, not `document.body`.
6. **No scroll lock on the host page.** Always-open autoplay demos must use `modal={false}`.
7. **Follow the existing app's conventions.** File layout, import style, theme tokens, naming — match what's already there before inventing new.

---

## Phase 1 — Discover the Target App (read-only)

Before asking anything, read:

1. The component file the user named. Note:
   - Imports — does it use `@/` or relative paths?
   - Radix primitives — `Dialog`, `Popover`, `Tooltip`, etc.?
   - External hooks — `useQuery`, `useNavigate`, zustand stores?
   - Key state variables the scene will need to drive (active tab, current step, open/close).
2. Stack detection:
   - `vite.config.ts` → Vite (we assume Vite; Next.js is out of scope for this skill)
   - `tailwind.config.*` → Tailwind
   - `remotion.config.ts` / `remotion/` folder → existing Remotion setup
   - `src/components/ui/dialog.tsx` → shadcn/ui
   - `package.json` → look up exact `remotion` version; `@remotion/tailwind` must match
3. Look for existing players at `src/components/remotion/*Player.tsx` and mirror the naming/style.
4. Look at `src/components/home/` for a `HowItWorksSection` (or similar) if the user wants marketing placement.
5. **Check for existing mocks that drifted.** If the repo already has `remotion/components/Mock<Feature>*.tsx` files, diff them against the current real component. If structure/classes/copy have diverged, *ask* the user: "The existing mock doesn't match the current `<X>` component anymore — want a fresh mock?" If yes, create a new file (e.g. `MockLibraryPageV2.tsx`) and leave the old one intact unless the user explicitly asks to replace it. See gotcha 15.

Do not write anything yet.

---

## Phase 2 — Interview the User

Batch these questions via `AskUserQuestion` (don't ask one at a time):

1. **Scene goal.** What should the viewer see in order? (e.g. "dialog opens → Timeline tab → Speakers tab".)
2. **Scene length.** **Default 20s.** Accept 12/15/18/20/24/27/30s.
3. **Theme.** Fixed `light` / fixed `dark` / follow the app (reads `document.documentElement.classList.contains("dark")`).
4. **Mock data domain.** Lecture transcript, team meeting, analytics dashboard, chat thread, e-commerce order, etc. Ask for specific entity names if the user has preferences.
5. **Brand kit.** Product name, logo path (SVG/PNG in `public/` or `src/assets/`), primary color (hex), tagline (one line), and font family. Used for the brand intro (first ~1.5s) and the end card (last ~3s). If the host has a design-tokens file, read it instead of asking.
6. **Placement.** Studio only / + player wrapper / + marketing section.
7. **End-card CTA.** One-line call-to-action and optional URL (e.g. "Try it free — yourapp.com"). Shown over the final end card.

Don't proceed to Phase 3 until all answers are in.

---

## Phase 3 — Patch the Real Component (backward-compatible)

Add only the escape hatches the scene actually needs. Every prop must default to undefined/false so real consumers are unaffected.

### 3a. Controlled state hooks

For every interactive view the scene drives, add a pair:

```ts
controlled<Name>?: <Type>;
on<Name>Change?: (v: <Type>) => void;
```

Inside the component, fall through to internal state when the controlled prop is absent:

```ts
const [internalTab, setInternalTab] = useState<ViewTab>("timeline");
const activeTab = controlledActiveTab ?? internalTab;
const setActiveTab = (v: ViewTab) => {
  if (controlledActiveTab === undefined) setInternalTab(v);
  onActiveTabChange?.(v);
};
```

### 3b. Radix portal container (only if the component renders a Radix Dialog/Popover)

Extend the shadcn wrapper (`src/components/ui/dialog.tsx`) to accept `portalContainer`:

```tsx
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    portalContainer?: HTMLElement | null;
  }
>(({ className, children, portalContainer, ...props }, ref) => (
  <DialogPortal container={portalContainer ?? undefined}>
    {/* ... */}
  </DialogPortal>
));
```

Then add a pass-through prop on the target component (e.g. `dialogPortalContainer?: HTMLElement | null`).

### 3c. Scoped class hook

Add `dialogContentClassName?: string` (or analogous) so the scene can tag the DialogContent with a unique class for CSS-only size overrides.

### 3d. Non-modal flag

If the component uses Radix Dialog, add `nonModal?: boolean` that passes `modal={!nonModal}` to the `Dialog` root. Required for autoplay-loop demos to avoid `document.body` scroll lock.

---

## Phase 4 — Generate Remotion Infrastructure

Generate these files (adapt from the `references/` templates). Skip any that already exist and are correct.

1. **`remotion/index.ts`** — `registerRoot(RemotionRoot)`.
2. **`remotion/Root.tsx`** — add the new `<Composition>` inside a `<Folder>`. If it exists, only add the new entry.
3. **`remotion.config.ts`** — webpack override: alias `@ → src`, `DefinePlugin` stub for `import.meta.env`, `enableTailwind(current)` if Tailwind is detected. See `@references/remotion-config-template.md`.
4. **`remotion/<feature>/DemoProviders.tsx`** — QueryClient (retry:false, staleTime:Infinity) + conditional `MemoryRouter` via `useInRouterContext()` + `TooltipProvider`. See `@references/providers-template.md`.
5. **`remotion/<feature>/<Feature>Scene.tsx`** — scene file. See `@references/scene-template.md` for the skeleton and `@references/scene-beats.md` for the full 5-beat marketing structure (brand intro → component mount → scripted beats → zoom + annotation callout → end card with CTA).
6. **`remotion/<feature>/mock<Feature>Data.ts`** — realistic on-brand mock. See `@references/mock-data-template.md`.
7. **Fonts.** Load the exact font family the real app uses via `@remotion/google-fonts` or `staticFile`. See `@references/fonts-and-brand.md`. Do not fall back to `system-ui` — it breaks pixel-perfect parity.

Install missing dependencies. When installing `@remotion/tailwind`, pin to the same major/minor as the installed `remotion`:

```bash
npm install --save-dev @remotion/tailwind@<matching-version>
```

---

## Phase 5 — Player Wrapper (if user opted in)

Create `src/components/remotion/<Feature>DemoPlayer.tsx` using `@references/player-template.md`. Props: `className`, `style`, `controls`, `loop`, `autoPlay`, `theme`. Forwards `theme` via `inputProps`. Root style always includes `direction: "ltr"`.

---

## Phase 6 — Marketing Section (if user opted in)

Create `src/components/home/HowItWorksSection/<Feature>Explanation.tsx` using `@references/marketing-section-template.md`. Register it in the section's index file (import + render + re-export).

---

## Phase 7 — Verify

1. **Studio smoke test** — render four stills, one per major beat:
   ```bash
   npx remotion still <id> --frame=15  --scale=0.5 out/<id>-intro.png     # brand intro
   npx remotion still <id> --frame=90  --scale=0.5 out/<id>-mounted.png   # component mounted
   npx remotion still <id> --frame=<mid-state-change> --scale=0.5 out/<id>-state.png
   npx remotion still <id> --frame=<end - 30> --scale=0.5 out/<id>-end.png # end card
   ```
   Confirm: real content (no skeletons), controlled state flipped, brand intro/end card present and on-brand, no text clipping at 1920×1080 scaled to 0.5.
2. **Marketing check** (if wired): `npm run dev` → open the homepage → scroll to the new section. Confirm:
   - Player autoplays and loops at 60fps-smooth (no visible jank).
   - Page scroll works (no `overflow: hidden` stuck on body).
   - No dialog escapes the player frame.
   - Theme toggle updates the scene.
3. **Regression check** — open the real component somewhere it was already used. Confirm behavior unchanged (tabs still click, dialog still closes, etc.).
4. **Re-center every cursor click** — for every scripted click frame, render a still and visibly confirm the cursor circle overlaps its intended target element. Any CSS tweak to the demo scope (dialog height, ScrollArea height, font) shifts coordinates. Do this recalibration **every ~3 iterations** of back-and-forth edits — do not wait for the user to catch a drift. See gotcha 16 for the reverse-projection formula.
5. **No dialog white-space** — on every beat where a dialog is on screen, render a still at a frame where the dialog is fully settled (past spring entrance AND past camera-zoom-in). The scrollable body must reach the dialog's rounded bottom edge. A visible blank strip > ~20 px between last-content and dialog-bottom is a bug — the viewer reads it as "the app is broken." See gotcha 17 for common culprits (ScrollArea hardcoded height, empty audio-bar slot).
4. **MP4 encoding (optional)** — if the user wants an exported video, render with H.264/yuv420p and verify size is under ~20MB for a 20–30s 1080p30 clip:
   ```bash
   npx remotion render <id> --codec=h264 --pixel-format=yuv420p out/<id>.mp4
   ls -lh out/<id>.mp4
   ```

---

## Phase 8 — Done

Summarize:
- Composition ID and duration.
- Files created (scene, providers, mock data, player, marketing section).
- Files modified (target component, shadcn Dialog, Root.tsx, remotion.config.ts, HowItWorks index).
- Studio URL (`http://localhost:3002/<compositionId>` if Studio is running).
- Suggested polish the user can request next: voiceover, transitions, additional beats, end-card variants.

---

## Gotchas — Read Before Writing Any Code

The consolidated list of problems you WILL hit if you skip the templates: **`@references/integration-gotchas.md`**.

Treat that file as a pre-flight checklist. If a symptom matches a line on that list, apply the fix from the list — do not re-derive it.

---

## Reference Files

- `@references/scene-template.md` — scene skeleton with cursor, ripple, zoom, portal container, scoped CSS.
- `@references/scene-beats.md` — 5-beat marketing structure (brand intro → mount → scripted beats → zoom + callout → end card) with exact frame math for 15s / 20s / 30s.
- `@references/fonts-and-brand.md` — loading the host's exact font family via `@remotion/google-fonts` or local `staticFile`, plus brand-intro and end-card scaffolding.
- `@references/providers-template.md` — DemoProviders with MaybeRouter.
- `@references/mock-data-template.md` — realistic mock data guidance.
- `@references/remotion-config-template.md` — webpack override template.
- `@references/player-template.md` — @remotion/player wrapper.
- `@references/marketing-section-template.md` — HowItWorks section template.
- `@references/silent-wav-helper.md` — silent WAV generator for audio-bearing UIs.
- `@references/integration-gotchas.md` — flat checklist of every bug we hit building the reference demo.

## Example

- `@examples/transcript-dialog-tabs/NOTES.md` — exact files created/modified for the reference implementation against `transvibe-frontend`.
