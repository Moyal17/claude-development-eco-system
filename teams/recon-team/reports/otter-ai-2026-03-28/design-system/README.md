# Otter.ai Design System — Extraction Report

**Target:** https://otter.ai/
**Pages Analyzed:** Landing, /sales-agent, /education-agent, /pricing, /press
**Date:** 2026-03-28
**Purpose:** Replicate Otter's design language in a React application

---

## Folder Structure

```
design-system/
├── global.css                     # Entry point — imports everything
├── tailwind.config.js             # Tailwind config with Otter's exact tokens
├── package-recommendations.json   # npm packages to install
├── tokens/
│   ├── colors.css                 # Color palette as CSS custom properties
│   ├── typography.css             # Font system, heading presets, text utilities
│   └── spacing.css                # Spacing scale, shadows, radii, z-index, breakpoints
├── animations/
│   ├── animations.css             # Keyframes, transitions, hover patterns, scroll animations
│   ├── gsap-setup.jsx            # GSAP React hooks (marquee, typewriter, scroll reveal, navbar float)
│   └── swiper-config.js          # Swiper.js presets for carousels
├── components/
│   ├── buttons.css                # Button variants (primary, secondary, ghost, link, with-badge)
│   ├── cards.css                  # Card variants (feature, pricing, testimonial, press, integration, role)
│   └── navigation.css             # Navbar (sticky + floating), dropdowns, mobile menu, footer
└── layouts/
    └── sections.css               # Section patterns (hero, feature grid, card grid, pricing, CTA, stats, press)
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install react react-dom react-router-dom gsap @gsap/react swiper lucide-react @fontsource/inter clsx tailwind-merge @radix-ui/react-accordion @radix-ui/react-dropdown-menu
```

### 2. Copy this folder into your project
```bash
cp -r design-system/ your-project/src/design-system/
```

### 3. Import global.css in your entry point
```jsx
// main.jsx
import './design-system/global.css';
```

### 4. Use the Tailwind config
```bash
cp design-system/tailwind.config.js your-project/tailwind.config.js
```

---

## Key Design Decisions

### What Makes Otter Look Like Otter

1. **The Hot Gradient** — Orange→Pink→Purple gradient on primary CTAs. This is the most recognizable visual element.

2. **Diagonal Lift Hover** — Buttons move `translate3d(0.4rem, -0.4rem, 0)` on hover. Not up, not right — diagonally up-right. With `cubic-bezier(0.215, 0.61, 0.355, 1)` easing.

3. **The Easing** — Everything uses `cubic-bezier(0.215, 0.61, 0.355, 1)`. This is a custom ease-out that feels snappy but smooth. It's on every button, card, dropdown, and scroll animation.

4. **Clean White Space** — Generous section padding (96px+), wide containers (1200px max), and plenty of breathing room between elements.

5. **Floating Navbar** — Starts clean, gains a multi-layer shadow on scroll. The shadow is distinctive: three layers with different spreads creating a depth effect.

6. **Marquee Logo Bar** — Infinite horizontal scroll of grayscale logos. Pauses on hover. 80-second full cycle creates a slow, premium feel.

7. **Timed Carousel Pagination** — Horizontal bar pagination dots with a fill animation that matches the autoplay timer (5s). This gives users a visual cue of when the next slide is coming.

8. **Link Underline Animation** — Links don't have static underlines. The underline grows from left on hover using `scaleX(0)` → `scaleX(1)` with the same cubic-bezier easing.

### Tech Stack (Actual vs. Recommended)

| Aspect | Otter Uses | You Should Use |
|--------|-----------|----------------|
| CMS/Builder | Webflow | React + Vite |
| CSS | Custom Webflow CSS | Tailwind CSS |
| Animations | GSAP + custom JS | GSAP (same) |
| Carousels | Swiper.js | Swiper.js (same) |
| Fonts | Webflow font CDN | @fontsource/inter |
| Icons | Custom SVGs | Lucide React |
| Dropdowns | Custom JS | Radix UI |
| Accordions | Custom JS | Radix UI |

---

## Color Reference

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-blue` | #144fff | Primary buttons, active states, links |
| `brand-blue-dark` | #1D25E2 | Hover states, underlines |
| `brand-navy` | #293a52 | Footer, dark sections |
| `accent-cyan` | #52d0f0 | Highlights, experimental |
| `accent-green` | #19c185 | Success, checkmarks |
| `accent-orange` | #f97316 | Gradient start |
| `accent-pink` | #ec4899 | Gradient middle |
| `accent-purple` | #9b51e0 | Gradient end |
| `neutral-200` | #E7EAEE | Borders, dividers |
| `neutral-400` | #8896AA | Muted text, inactive |
| `neutral-50` | #F7F8FA | Alt section backgrounds |
