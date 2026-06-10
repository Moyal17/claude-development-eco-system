# `remotion.config.ts` Template

Full webpack override that handles every case we hit in the reference demo: `@/` alias, Vite env-var stub, Tailwind (if detected). Drop into the project root.

## Steps

1. Check if the host uses Tailwind (presence of `tailwind.config.ts` / `tailwind.config.js`).
2. If Tailwind is used, install the matching `@remotion/tailwind`:
   ```bash
   # Replace 4.0.410 with whatever `remotion` is pinned to in package.json
   npm install --save-dev @remotion/tailwind@4.0.410
   ```
3. Write `remotion.config.ts` at the project root:

```ts
import path from "path";
import webpack from "webpack";
import { Config } from "@remotion/cli/config";
// ↓ Remove this import if the host app doesn't use Tailwind.
import { enableTailwind } from "@remotion/tailwind";

Config.setEntryPoint("./remotion/index.ts");
Config.setOverwriteOutput(true);

const srcAlias = path.resolve(process.cwd(), "src");

// Stub Vite-style env vars so modules inside src/ that read `import.meta.env.*`
// don't crash when bundled for Remotion. Grep the host app for
// `import.meta.env.VITE_` and add every key that gets read at module load.
const viteEnvStub = {
  VITE_ENVIRONMENT: "development",
  VITE_API_BASE_URL: "http://localhost:8080",
  VITE_DEBUG: "false",
  VITE_LOG_LEVEL: "info",
  // Add host-specific keys here:
  // VITE_PAYPAL_CLIENT_ID: "",
  // VITE_STRIPE_PUBLISHABLE_KEY: "",
  // VITE_RECAPTCHA_SITE_KEY: "",
  NODE_ENV: "development",
  MODE: "development",
  DEV: true,
  PROD: false,
  SSR: false,
};

Config.overrideWebpackConfig((current) => {
  // Wrap with Tailwind support. Delete this line if the host doesn't use Tailwind.
  const base = enableTailwind(current);

  return {
    ...base,
    resolve: {
      ...base.resolve,
      alias: {
        ...(base.resolve?.alias ?? {}),
        "@": srcAlias,
      },
    },
    plugins: [
      ...(base.plugins ?? []),
      new webpack.DefinePlugin({
        "import.meta.env": JSON.stringify(viteEnvStub),
      }),
    ],
  };
});
```

## Why each piece

| Piece | Why |
|---|---|
| `process.cwd()` | ESM `.ts` configs don't have a reliable `__dirname`. |
| `alias["@"]` | Real components' transitive deps use `@/…` imports that Vite resolves but Remotion's webpack doesn't. |
| `DefinePlugin` for `import.meta.env` | Modules like `src/lib/config.ts` read `import.meta.env.VITE_*` at top level. Missing values throw `Cannot read properties of undefined`. |
| `enableTailwind` | Adds PostCSS + Tailwind processing. Without it, component classes render as plain boxes. |
| `@remotion/tailwind` version pinning | Remotion warns loudly and may crash renders if packages drift across major versions. |

## After writing the config

Run a still to verify:
```bash
npx remotion still <compositionId> --frame=120 --scale=0.5 out/smoke.png
```

If it errors with `Can't resolve '@/...'` or `Cannot read properties of undefined (reading 'VITE_...')`, re-read this file — something in the stubs list is missing.
