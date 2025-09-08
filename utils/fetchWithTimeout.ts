// utils/fetchWithTimeout.ts
// A small helper to perform fetch with a hard timeout using AbortController.
// - Works in React Native (no AbortSignal.timeout)
// - Optionally ties into an external AbortSignal; aborts if either external or timer fires

export type FetchWithTimeoutOptions = RequestInit & {
  timeoutMs?: number;
  externalSignal?: AbortSignal;
};

export async function fetchWithTimeout(input: RequestInfo | URL, options: FetchWithTimeoutOptions = {}): Promise<Response> {
  const { timeoutMs = 3000, externalSignal, ...rest } = options;
  const controller = new AbortController();
  const { signal } = controller;

  // If caller provided a signal, bridge it
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort);
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const urlStr = typeof input === 'string' ? input : input.toString();
  const label = `[fetch] ${urlStr}`;
  console.time?.(label);

  try {
    const res = await fetch(input, { ...rest, signal });
    return res;
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
    console.timeEnd?.(label);
  }
}

export default fetchWithTimeout;

