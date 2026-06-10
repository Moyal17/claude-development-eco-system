# `DemoProviders.tsx` Template

Wraps the demo scene with the same providers the real app uses, minus anything that would break inside `@remotion/player` (e.g. a second router).

```tsx
import React from "react";
import { MemoryRouter, useInRouterContext } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Relative path — Remotion bundles /remotion separately from /src, but the
// shadcn TooltipProvider is re-exported from the app's UI folder.
import { TooltipProvider } from "../../src/components/ui/tooltip";

// Retry disabled + infinite stale time: any real hook that tries to fetch
// (e.g. useUserFeatures) fails once silently and the component's isLoading
// state falls through. No module mocking required.
const demoQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    mutations: { retry: false },
  },
});

/**
 * In Remotion Studio there is no outer Router — provide a MemoryRouter.
 * When the scene is rendered via @remotion/player inside the host app, the
 * app's BrowserRouter is already in scope; nesting a second Router throws
 * in React Router v6 ("You cannot render a <Router> inside another <Router>").
 * Skip in that case.
 */
const MaybeRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const alreadyInRouter = useInRouterContext();
  if (alreadyInRouter) return <>{children}</>;
  return <MemoryRouter>{children}</MemoryRouter>;
};

export const DemoProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <QueryClientProvider client={demoQueryClient}>
    <MaybeRouter>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </MaybeRouter>
  </QueryClientProvider>
);
```

## When to add more providers

If the target component uses any of:

| App provider | Add if component uses |
|---|---|
| `PayPalScriptProvider` | `usePayPal`, PayPal buttons |
| `ThemeProvider` (next-themes or similar) | `useTheme` |
| `AuthProvider` | `useAuth`, protected routes |
| Zustand store w/ hydration | Components that read global state |

Match the host app's provider order. In most cases you can skip these — set up a minimal mock store/zustand slice in the mock data file if the component reads from one.

## Why not just use the host app's root providers file?

Because some providers (auth, PayPal, feature flags) call out to external services on mount. The demo is supposed to be sealed — no network, no side effects.
