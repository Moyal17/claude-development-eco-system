# `@remotion/player` Wrapper Template

```tsx
// src/components/remotion/<Feature>DemoPlayer.tsx
import React from "react";
import { Player } from "@remotion/player";
import { <Feature>Scene } from "../../../remotion/<feature>/<Feature>Scene";

interface <Feature>DemoPlayerProps {
  className?: string;
  style?: React.CSSProperties;
  controls?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  theme?: "light" | "dark";
}

export const <Feature>DemoPlayer: React.FC<<Feature>DemoPlayerProps> = ({
  className,
  style,
  controls = true,
  loop = false,
  autoPlay = false,
  theme = "light",
}) => {
  return (
    <Player
      component={<Feature>Scene}
      durationInFrames={<TOTAL_FRAMES>}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={30}
      controls={controls}
      loop={loop}
      autoPlay={autoPlay}
      inputProps={{ theme }}
      className={className}
      style={{
        width: "100%",
        maxWidth: "100%",
        ...style,
        // Force LTR inside the player even if the host app is RTL.
        direction: "ltr",
      }}
    />
  );
};
```

## Usage

```tsx
<<Feature>DemoPlayer
  controls={false}
  loop
  autoPlay
  theme={theme}
  className="w-full"
  style={{ width: "100%", maxWidth: "100%" }}
/>
```

## Keep `durationInFrames` in sync

This must match `remotion/Root.tsx`'s `<Composition durationInFrames={...}>`. The safe pattern: export a shared constant from the scene file and import it here + in `Root.tsx`.

```ts
// in the scene file:
export const TOTAL_FRAMES = 450;
```

## `inputProps` forwarding

`inputProps` is how external values reach the scene component. The scene declares a matching props interface (`theme?: Theme`) and Remotion merges `inputProps` into those at render time.
