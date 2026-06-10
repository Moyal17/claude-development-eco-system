---
name: react-refactor
description: |
  Decompose oversized React components into well-structured, maintainable folders of smaller components.
  Use when: (1) A React component file exceeds ~300 lines, (2) A component has multiple inline sub-components,
  (3) A component contains multiple wizard steps, tabs, or modal views in a single file,
  (4) A component mixes concerns (form state, API calls, UI rendering, validation) that should be separated,
  (5) User asks to "break up", "split", "refactor", or "decompose" a React component,
  (6) User asks to extract steps, sections, or sub-components into separate files.
argument-hint: <path to component file>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
---

# React Component Refactor

You are an expert React architect specializing in component decomposition. Your job is to take an oversized component and break it into a clean folder of focused, well-typed sub-components — without changing any behavior or breaking any imports.

---

## Principles

1. **Zero behavior change.** The refactored code must render identically. No UX changes, no logic changes, no side-effect changes.
2. **Zero broken imports.** External consumers must not change their import paths. The orchestrator stays in its original file; sub-components are extracted to a folder it imports from.
3. **State belongs where it's used.** If state is only used inside one sub-component, it should live there — not be passed down from a parent.
4. **Props should be minimal.** Each sub-component receives only the data and callbacks it needs. Avoid prop-drilling orchestrator internals.
5. **Follow existing project conventions.** Match the codebase's naming, export style, barrel pattern, and formatting before inventing new ones.
6. **Extract, don't rewrite.** Move code verbatim first, then adjust imports. Don't "improve" logic, rename variables, or refactor APIs during decomposition.
7. **Deduplicate across sibling files.** After extraction, grep for components/functions that are duplicated in sibling pages or folders. Extract them to the shared folder so both consumers import from one place.
8. **Colors and magic values go through the theme.** Never leave the same hex/HSL color string in two files. Use CSS custom properties (`--fc-*`) for theme tokens and a shared constants module for JS references.

---

## Workflow

### Phase 1 — Analyze the Component

Read the target file completely. Identify:

1. **Size metrics** — total lines, number of inline components, number of hooks, number of state variables
2. **Logical sections** — what are the distinct UI "views" or "steps"? (wizard steps, tab panels, modal views, conditional renders)
3. **Sub-components** — any functions defined inside the file that return JSX (these are already natural extraction points)
4. **Shared pieces** — constants, types, schemas, utility functions, validation logic
5. **State ownership map** — for each piece of state, which section(s) read it and which section(s) write it
6. **External API** — how is this component imported and used? (default export, named export, what props does the consumer pass?)
7. **Cross-file duplicates** — grep sibling pages/components for functions or constants with the same name or same logic. These should be extracted to the shared folder so both consumers use one copy. Common culprits: `StatPill`, `formatDue`, `stateColors`, animation variants.

Present the analysis to the user as a structured summary before proposing any changes.

### Phase 2 — Design the Folder Structure

Based on the analysis, design the target folder structure:

```
<component-name>/                       # shared folder (no orchestrator here)
  index.ts                              # barrel — re-exports sub-components, types, constants, utils
  <componentName>.types.ts              # shared types and prop interfaces
  <componentName>.constants.ts          # constants, config arrays, color tokens, enums
  <componentName>.schemas.ts            # Zod/Yup schemas + inferred types (if any)
  <componentName>.utils.ts              # pure helper functions shared by 2+ components
  <SubComponent1>.tsx                   # extracted sub-component
  <SubComponent2>.tsx                   # extracted sub-component
  ...

# The orchestrator stays in its original file (e.g., pages/flashcards/DeckDetail.tsx)
# and imports from <component-name>/ via the barrel
```

**Naming rules:**
- Folder name: kebab-case matching the component (e.g., `create-deck-wizard/`)
- Component files: PascalCase (e.g., `SourceStep.tsx`)
- Non-component files: camelCase with dot separator (e.g., `createDeckWizard.types.ts`)
- Match whatever convention the project already uses — check sibling folders first

**What to extract:**
- Each wizard step, tab panel, or major conditional render → its own component
- Each inline sub-component (function returning JSX defined inside the file) → its own file
- Constants, types, schemas → their own files
- Utility/validation functions used by multiple sub-components → utils file

**What stays in the orchestrator:**
- Cross-component state (state used by multiple steps/sections)
- Navigation/routing logic between steps
- Form instances (`useForm`) when shared across steps
- Side effects that span the component lifecycle (e.g., generation simulation timers)
- The shell/wrapper (Dialog, Modal, Layout) that contains all sub-components

**State ownership decision tree:**

```
Is this state read or written by more than one sub-component?
  YES → keep in orchestrator, pass via props
  NO  → move into the sub-component that uses it
        (it will auto-reset on unmount/remount)
```

**Extraction approach:** Keep the orchestrator in its original file. Extract sub-components, constants, types, and utils to a shared folder that the orchestrator imports from.

```
src/components/flashcards/deck-detail/
  index.ts                     ← barrel (sub-components only, no orchestrator)
  deckDetail.types.ts          ← prop interfaces
  deckDetail.constants.ts      ← color maps, animation variants
  deckDetail.utils.ts          ← formatDue, etc.
  DeckHeader.tsx               ← extracted sub-component
  CardToolbar.tsx              ← extracted sub-component
  CardGridView.tsx             ← extracted sub-component
  StatPill.tsx                 ← shared across sibling pages
src/pages/flashcards/DeckDetail.tsx  ← orchestrator stays here, imports from deck-detail/
```

The barrel does NOT export the orchestrator — it only exports the sub-components. The original file is rewritten in place to import from the new folder.

Present the proposed structure to the user. Get confirmation before implementing.

### Phase 3 — Implement the Extraction

Execute in this order to avoid circular dependencies:

1. **Create the folder**
2. **Extract constants** — no dependencies on other new files
3. **Extract schemas** — depends only on external libs (zod, yup)
4. **Extract types** — may import from schemas, constants
5. **Extract utils** — pure functions shared by 2+ components (formatters, animation helpers, variant builders)
6. **Extract small sub-components** — no inter-dependencies between them
7. **Extract major sections/steps** — may import sub-components, types, and utils
8. **Rewrite the orchestrator in place** — replace inlined code with imports from the new folder. Remove inline sub-components, constants, and utils that were extracted.
9. **Write the barrel `index.ts`** — re-exports types, constants, utils, and sub-components (not the orchestrator)
10. **Deduplicate sibling files** — grep for functions/components with the same name in sibling pages. Replace inline duplicates with imports from the new shared folder.
11. **Format** — run the project's formatter (`prettier`, `eslint --fix`, etc.)
12. **Verify** — run lint and build to catch missing imports or type errors

### Phase 4 — Verify

Run these checks in order:

1. **Lint** — `npx eslint <new-folder>/` + the orchestrator file — zero new errors (pre-existing warnings OK)
2. **Build** — `npm run build` — clean TypeScript compilation
3. **Dev server** — if available, start and manually verify the component renders and functions correctly
4. **Import check** — grep the codebase for imports of the original file path — all should still work
5. **Duplicate check** — grep for function/component names that existed in the original file across the whole `src/` — confirm only one definition remains (in the shared folder)

---

## Extraction Patterns

### Pattern: Wizard Steps

A multi-step wizard (common in onboarding, checkout, creation flows):

```
WizardOrchestrator.tsx      → owns: currentStep, direction, form instances
  Step1_Source.tsx           → pure presentational, callbacks only
  Step2_Configure.tsx        → receives form instance via props
  Step3_Review.tsx           → receives collected data, displays summary
  Step4_Processing.tsx       → receives progress state
  StepIndicator.tsx          → shared progress indicator
```

**Key insight:** Each step only renders when active, so step-local state naturally resets on unmount. Use this to avoid passing step-internal state up to the orchestrator.

### Pattern: Tabbed Views

A component with tab-based navigation:

```
TabbedContainer.tsx         → owns: activeTab, shared data
  TabA_Content.tsx          → renders tab A content
  TabB_Content.tsx          → renders tab B content
  TabC_Content.tsx          → renders tab C content
```

### Pattern: Form with Sections

A large form with collapsible/expandable sections:

```
FormOrchestrator.tsx        → owns: useForm instance, submit handler
  BasicInfoSection.tsx      → receives form register/watch for its fields
  AdvancedSection.tsx       → receives form register/watch for its fields
  PreviewSection.tsx        → receives form watch for display
```

### Pattern: List with Detail Panel

A component showing a list and a detail view:

```
ListDetailLayout.tsx        → owns: selectedItem, list data
  ItemList.tsx              → receives items, onSelect callback
  ItemDetail.tsx            → receives selected item
  EmptyState.tsx            → shown when nothing selected
```

### Pattern: Dialog/Modal with Complex Content

A dialog with multiple content states:

```
FeatureDialog.tsx           → owns: open state, current view
  DialogContent_Create.tsx  → create mode content
  DialogContent_Edit.tsx    → edit mode content
  DialogContent_Confirm.tsx → confirmation content
```

---

## Prop Interface Design

When creating prop interfaces for extracted components:

```typescript
// In <componentName>.types.ts

// Good: minimal, focused props
export interface SourceStepProps {
  onSelectOption: (option: "ai" | "manual") => void;
}

// Good: pass form instance when step needs multiple fields
export interface ConfigureStepProps {
  form: UseFormReturn<ConfigForm>;
  onSubmit: (data: ConfigForm) => void;
  onBack: () => void;
}

// Good: step owns its local state, parent only gets results
export interface AddCardsStepProps {
  onAddCard: (card: Card) => void;        // parent receives completed card
  onRemoveCard: (id: string) => void;
  cards: Card[];                           // parent owns the list
  onDone: () => void;
}

// BAD: leaking orchestrator internals
export interface BadStepProps {
  setStep: (n: number) => void;           // step shouldn't know about step numbers
  setDirection: (d: number) => void;      // animation detail leaked
  isProcessing: boolean;                  // unrelated orchestrator state
}
```

**Rules:**
- Steps receive callbacks named for their semantic action (`onBack`, `onSubmit`, `onSelectOption`), not for orchestrator state mutations (`setStep`, `setDirection`)
- If a component needs animation variants, pass them as a prop — don't have each component define its own
- Shared types (form types, entity types) go in the types file, not redefined per component

---

## Barrel Export Pattern

The barrel exports sub-components, types, constants, and utils — NOT the orchestrator. The orchestrator stays in its original file and imports from the barrel.

```typescript
// index.ts — sub-components only, no orchestrator
export type * from "./componentName.types";
export { CONSTANTS } from "./componentName.constants";
export { utilFunction } from "./componentName.utils";
export { SubComponent1 } from "./SubComponent1";
export { SubComponent2 } from "./SubComponent2";
```

The orchestrator (page file) imports from this barrel:
```typescript
import { DeckHeader, CardToolbar, CardGridView } from "@/components/flashcards/deck-detail";
```

No re-export file needed — the original file is rewritten in place to import from the new folder.

---

## Phase 5 — Post-Extraction Deduplication

After extracting and verifying, run a deduplication pass across all files in the new folder. Patterns that weren't visible as duplicates in a monolith become obvious once split into separate files.

### 1. Color & magic value audit

Grep every file for hardcoded hex colors (`#XXXXXX`), HSL values (`hsl(...)`), and raw numbers used as thresholds or sizes. If the same value appears in 2+ files, it belongs in a constants file or CSS custom property.

**Decision tree:**
- Used across multiple components in this folder only → add to `<componentName>.constants.ts`
- Used across multiple feature areas (e.g., state colors shared between deck list, detail view, and study session) → promote to a shared module at the parent level (e.g., `flashcard-colors.ts`)
- Represents a design token that could change with theme or dark mode → add as a CSS custom property in the theme file and reference via `hsl(var(--token-name))`

**Never leave the same hex/HSL string in two files.**

### 2. Duplicated logic audit

Look for functions or patterns that appear in multiple files with the same structure but slightly different parameters. Common duplicates after extraction:

| Duplicate pattern | Shared extraction |
|---|---|
| `requestAnimationFrame` loops (animated counters, progress rings) | `animateValue(target, duration, easing, onUpdate)` utility with pluggable easing |
| Time/date formatters (`formatTime`, `formatDuration`) | `<componentName>.utils.ts` |
| Framer Motion animation variant objects | Constants if static, util function if they depend on runtime values |
| Regex patterns used in multiple components (e.g., cloze `{{c1::}}` matching) | Shared component or util |

**Rule of thumb:** If two functions share the same skeleton (setup → loop → cleanup) but differ in one parameter (easing curve, target calculation), extract the skeleton as a shared util and pass the varying part as an argument.

### 3. Constants consolidation

Review the constants file after extraction:

| Situation | Action |
|---|---|
| Value only used by one component | Leave inline — don't over-centralize |
| Value shared by 2+ components | Keep in constants file |
| Value duplicates a CSS custom property | Replace with `hsl(var(--token))`, add the CSS var if missing |
| Related values (e.g., state→color map) | Export as a typed object (`Record<string, string>`) not individual exports |

### 4. Utils file criteria

Only create a utils file when you have **2+ pure functions** shared across files. Don't create one preemptively for a single helper.

**What goes in utils:**
- Pure functions — no React hooks, no side effects, no component imports
- Functions that take simple inputs and return simple outputs
- Functions that could be unit tested in isolation

**What does NOT go in utils:**
- Anything that needs React state or effects → that's a hook, extract as `use*.ts`
- JSX-returning functions → that's a component
- Constants or config objects → those go in constants

---

## Checklist Before Declaring Done

- [ ] Original import paths still work (orchestrator stays in place, imports from shared folder)
- [ ] No circular dependencies between new files
- [ ] Types file has prop interfaces for every extracted component
- [ ] Constants are imported from the constants file, not redefined
- [ ] State that's only used in one sub-component lives in that sub-component
- [ ] No prop-drilling of orchestrator internals (step numbers, direction, processing flags)
- [ ] No duplicated hex/HSL colors across files — all sourced from constants or CSS vars
- [ ] No duplicated utility functions — shared logic extracted to utils
- [ ] Lint passes with zero new errors
- [ ] Build passes clean
- [ ] Component renders and functions identically to before
- [ ] Prettier/formatter has been run on all new files

---

## Anti-Patterns to Avoid

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Passing 15+ props to a step | Signals wrong state ownership | Move step-local state into the step component |
| Re-exporting from `index.ts` with `export *` | Pollutes namespace, hides what's public | Use explicit named exports |
| Creating a `hooks/` subfolder for one hook | Over-engineering for small extractions | Keep hooks in the component that uses them |
| Extracting a 10-line helper into its own file | File bloat for minimal benefit | Only extract if shared by 2+ files |
| Changing variable names during extraction | Introduces unnecessary diff noise | Move code verbatim first, rename in a separate step |
| Adding new abstractions (context, custom hooks) | Scope creep during refactor | Extract first, abstract later if needed |
| Forgetting to format after extraction | Lint failures on every file | Run formatter before build check |
| Same hex color in two files | Silent drift, impossible to theme | Centralize in constants or CSS vars |
| Creating a utils file for one function | Premature abstraction | Keep inline until a second consumer appears |
| Putting React hooks in a utils file | Utils must be pure functions | Extract hooks as `use*.ts` files instead |
