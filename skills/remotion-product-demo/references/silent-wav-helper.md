# Silent WAV Helper

Use when the target component has an audio or video player that shows a skeleton until `loadedmetadata` fires. Synthesizes a PCM WAV of arbitrary duration entirely in-browser — no network, no file shipped.

## The function

Drop this at the bottom of the scene file:

```ts
/**
 * Build an in-memory silent WAV data URL of the requested duration so the
 * audio/video player has metadata to load (duration, currentTime). PCM
 * 8kHz / 8-bit / mono yields ~8 KB per second — small enough to inline even
 * for several minutes of silence.
 */
function createSilentWavDataUrl(durationSeconds: number): string {
  const sampleRate = 8000;
  const numSamples = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const dataLen = numSamples; // 8-bit mono: one byte per sample
  const buffer = new Uint8Array(44 + dataLen);
  const view = new DataView(buffer.buffer);
  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) buffer[offset + i] = str.charCodeAt(i);
  };
  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataLen, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);   // PCM chunk size
  view.setUint16(20, 1, true);    // PCM format
  view.setUint16(22, 1, true);    // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // byte rate = sampleRate * 1 * 1
  view.setUint16(32, 1, true);    // block align
  view.setUint16(34, 8, true);    // bits per sample
  writeAscii(36, "data");
  view.setUint32(40, dataLen, true);
  buffer.fill(0x80, 44); // 8-bit PCM silence = 0x80 (unsigned midpoint)

  // Base64-encode without the Node Buffer polyfill.
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < buffer.length; i += chunk) {
    binary += String.fromCharCode(...buffer.subarray(i, i + chunk));
  }
  return "data:audio/wav;base64," + btoa(binary);
}
```

## Wiring it into the scene

```ts
const audioSrc = useMemo(() => {
  if (typeof window === "undefined") return undefined;
  return createSilentWavDataUrl(mockData.duration ?? 120);
}, []);

const mockDataWithAudio = useMemo(
  () => ({
    ...mockData,
    artifacts: { ...(mockData.artifacts ?? {}), audioFileUrl: audioSrc },
  }),
  [audioSrc]
);

// Pass `mockDataWithAudio` to the component instead of `mockData`.
```

## What the component sees

- `audio.duration` equals the mock's declared duration (e.g. 134s).
- `audio.currentTime` stays at 0 (demo never calls `.play()`).
- The `loadedmetadata` event fires → `isLoading = false` → controls render.

This works for `<audio>` and `<video>` elements. For components that check `canplay` or `canplaythrough`, the same WAV fires those events too.

## Size math

| Duration | Bytes (uncompressed) | Base64 length |
|---|---|---|
| 30s | ~240 KB | ~320 KB |
| 134s (reference demo) | ~1.07 MB | ~1.43 MB |
| 300s | ~2.4 MB | ~3.2 MB |

Well within safe limits for any modern browser data URL. Only a problem above ~30 minutes of silence, which is outside the product-demo use case.
