# Lovable Prompt — Otter.ai Design Clone

Copy and paste this entire prompt into Lovable to generate a site with Otter.ai's design language.

---

## PROMPT

```
Build a modern SaaS landing page in React with Tailwind CSS that matches the design language of otter.ai. The site should feel premium, clean, and professional with smooth animations.

## Design System

### Colors
- Primary blue: #144fff (buttons, links, accents)
- Dark blue: #1D25E2 (hover states, underlines, active states)
- Navy: #293a52 (footer background, dark sections)
- Hot gradient for primary CTAs: linear-gradient(135deg, #f97316 0%, #ec4899 50%, #9b51e0 100%)
- Blue gradient for secondary CTAs: linear-gradient(135deg, #144fff 0%, #1D25E2 100%)
- Backgrounds: white (#ffffff) for main, #F7F8FA for alternating sections
- Text: #000000 primary, rgb(34,40,47) secondary, rgba(34,40,47,0.5) muted
- Borders: #E7EAEE
- Success green: #19c185

### Typography
- Font: Inter (import from Google Fonts, weights 400, 500, 600, 700)
- Hero heading: 4.5rem bold, line-height 1.1, letter-spacing -0.02em
- H1: 3rem bold
- H2: 2.25rem semibold
- H3: 1.5rem semibold
- Body: 1rem regular, line-height 1.5
- Font smoothing: antialiased

### Spacing & Layout
- Container max-width: 1200px, centered with auto margins, 24px horizontal padding
- Section padding: 96px vertical (large), 64px (medium), 48px (small)
- Card border-radius: 12px-16px
- Button border-radius: 8px

### Shadows
- Cards: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)
- Card hover: 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)
- Floating navbar: 0px 1px 1px rgba(0,0,0,0.06), 8px 15px 17px rgba(0,0,0,0.05), 10px 58.5px 41px 16px rgba(24,57,89,0.07)

### Breakpoints
- sm: 480px, md: 768px, lg: 992px, xl: 1200px, 2xl: 1505px

## Pages to Build

### 1. Landing Page (/)
Sections in order:
1. **Sticky Navbar** — Logo left, nav links center (Use Cases dropdown, Resources dropdown, Pricing, Download), right side: "Schedule demo" link, "Log in" link, "Start for free" gradient button. On scroll past hero, add floating shadow effect.
2. **Hero** — Large bold heading centered, subtitle paragraph below (max-width 640px), two CTA buttons centered ("Start for free" with hot gradient, "Schedule demo" as link), below CTAs a video/image placeholder with rounded corners and shadow.
3. **Logo Bar** — Infinite horizontal marquee of grayscale client logos (Salesforce, Harvard, NBC, Amazon, IBM, Mastercard, etc). Pause on hover. Use CSS animation.
4. **Feature Sections** (6-8 sections) — Alternating left/right layout: text on one side (heading, paragraph, bullet points), screenshot/image on other side. Each section separated by generous spacing.
5. **Use Cases Cards** — Section heading "There's an AI Notetaker for that", horizontal scrollable cards: Sales, Education, Media, SDR Agent, Recruiting Agent. Each card has icon, title, description, "Learn more" link with arrow.
6. **Testimonials Carousel** — "Trusted by teams, loved by people" heading. Swiper carousel with testimonial cards showing quote, avatar, name, title, company. Auto-advancing with timed pagination dots.
7. **Stats Section** — Large number "4+ Hours saved per week" in brand blue, description below.
8. **Integrations Grid** — "Connect to your favorite apps" heading. 3-column grid of integration cards (icon, name, description). Cards have border and hover lift effect.
9. **Pricing Section** — "Flexible plans" heading. 3 pricing cards: Basic (Free), Business ($19.99/mo), Enterprise (Contact sales). Business card highlighted as "Best Value" with blue border. Feature lists with checkmarks.
10. **Final CTA** — "The world's smartest AI Notetaker" heading centered, two buttons, decorative gradient blobs in background (use CSS pseudo-elements with blur).
11. **Footer** — Dark navy background, white text. 5-column grid: Logo + description, Use Cases links, Resources links, Download links, Social links. Bottom bar with copyright and legal links.

### 2. Sales Agent Page (/sales-agent)
1. Same navbar
2. **Hero** — "Sell like it's your job" heading, subtitle about sales notetaker, dual CTAs
3. **Three Feature Phases** — Pre-call prep, Live meeting coaching, Post-call summary. Each has heading, bullet list of features, image carousel placeholder.
4. **Role Benefits** — "No matter your role" heading. 3 cards: Account Execs, Sales Ops, Sales Leads. Each with icon, title, description.
5. **Pricing** (same as landing)
6. **CTA + Footer** (same as landing)

### 3. Education Agent Page (/education-agent)
1. Same navbar
2. **Hero** — "The student's pet" heading (playful tone), subtitle about education notetaker
3. **Three Feature Phases** — Before class, During class, Post-class. Similar layout to sales page.
4. **Advanced Features** — Writing papers, Fact-checking. Feature cards.
5. **Pricing + CTA + Footer**

## Animation Requirements (Critical — this is what makes it feel like Otter)

### Button Hover
- Primary buttons: on hover, translate3d(6px, -6px, 0) with 400ms cubic-bezier(0.215, 0.61, 0.355, 1) easing
- Link buttons: underline grows from left (scaleX 0 to 1) on hover, same easing
- Arrow icons in links: translateX(4px) on hover

### Scroll Animations
- All sections fade-in-up on scroll into viewport (opacity 0→1, translateY 32px→0, duration 600ms, stagger children by 100ms)
- Use Intersection Observer

### Navbar
- Starts without shadow
- After scrolling past hero, add floating shadow with smooth 400ms transition
- Slight padding reduction when floating

### Marquee (Logo Bar)
- Infinite horizontal scroll, 80s duration for full cycle
- Duplicate the logo list for seamless loop
- Pause on hover

### Carousel Pagination
- Custom pagination dots: horizontal bars (32px wide, 4px tall)
- Active dot has a fill animation from 0% to 100% width over 5 seconds (matches autoplay timing)
- Inactive dots at 40% opacity

### FAQ Accordion (pricing page)
- Icon rotates 45 degrees on open
- Content expands with 250ms height transition, same cubic-bezier easing
- Icon color transitions from gray to black

### Card Hover
- Cards rise 4px on hover with shadow elevation change
- 400ms transition, same easing

## Code Quality
- Use React Router for page routing
- Extract shared components: Navbar, Footer, Section, Button, Card, LogoBar, Carousel
- Use Tailwind for all styling
- Mobile-responsive (stack grids on mobile, hide desktop nav and show hamburger)
- Use placeholder images from unsplash or simple colored rectangles
- Clean component structure with separate files per component
```

---

## Notes for Lovable

- If Lovable asks about icons, tell it to use **Lucide React** icons
- If it asks about carousel, tell it to use **Swiper.js** (`swiper` npm package)
- If animations feel flat, emphasize the **cubic-bezier(0.215, 0.61, 0.355, 1)** easing — this is the signature feel
- The **hot gradient** (orange→pink→purple) on primary CTAs is what gives Otter its visual pop
- The **diagonal lift hover** (translate 6px right, -6px up) on buttons is Otter's signature micro-interaction
