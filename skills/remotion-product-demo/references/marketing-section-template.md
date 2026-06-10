# Marketing Section Template

For Vite apps with a homepage that already has a "How It Works" section (or similar), use this two-column card pattern.

```tsx
// src/components/home/HowItWorksSection/<Feature>Explanation.tsx
import { <Icon> } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { <Feature>DemoPlayer } from "@/components/remotion/<Feature>DemoPlayer";

interface <Feature>ExplanationProps {
  theme: "light" | "dark";
}

export function <Feature>Explanation({ theme }: <Feature>ExplanationProps) {
  return (
    <FadeIn delay={<0.1 * sectionIndex>}>
      <div className="relative mt-16 md:mt-24">
        <div className="relative z-10">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left column: text */}
            <div className="space-y-6 order-2 md:order-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <<Icon> className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                <Heading>
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                <Description — 1–2 sentences explaining the value the video shows.>
              </p>
            </div>

            {/* Right column: player */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-lg overflow-hidden order-1 md:order-2">
              <<Feature>DemoPlayer
                controls={false}
                loop
                autoPlay
                theme={theme}
                className="w-full"
                style={{ width: "100%", maxWidth: "100%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
```

## Register in the section's index file

```tsx
// src/components/home/HowItWorksSection/index.tsx
import { <Feature>Explanation } from "./<Feature>Explanation";

// ...inside the component:
<OtherExplanation theme={theme} />
<<Feature>Explanation theme={theme} />

// ...bottom of file (barrel pattern):
export { <Feature>Explanation } from "./<Feature>Explanation";
```

## Why this layout

- **`md:grid-cols-2`** — one column on mobile, two on tablet+ desktop.
- **`order-1 md:order-2` on the video** — on mobile, video appears above text (it's the attention-grabber); on desktop, video goes to the right of the text (traditional marketing layout).
- **`rounded-2xl border bg-card p-6 md:p-8 shadow-lg overflow-hidden`** — raises the player off the page with a card treatment, matching the site's card tokens.
- **`FadeIn` with incrementing `delay`** — staggers section reveals as the user scrolls.
- **`theme` prop passed through** — lets the player respect the homepage's active theme.

## Copy guidelines

- **Heading:** 3–6 words, verb-led, focused on the user outcome (not the feature). "Search across every transcript" beats "We have a search feature".
- **Description:** one sentence of value, one sentence of proof. No "lorem", no "revolutionary", no hype adjectives.
- **Icon:** pick from lucide-react, different from adjacent sections.

## Skipping translations

If the host has `react-i18next` with existing keys, use translation keys (`t("home.howItWorks.<feature>.heading")`). Otherwise, inline English strings are fine for a first pass — the user will either ask for translations later or translate during review.
