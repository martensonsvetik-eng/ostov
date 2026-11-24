/**
 * Demo form submit: simulates a network round-trip without any request.
 * Resolves 'error' when the search string contains `demo=error`, otherwise 'ok'.
 */
export interface DemoSubmitOptions {
  search?: string;
  delayMs?: number;
}

const MIN_DELAY_MS = 800;
const MAX_DELAY_MS = 1200;

export function demoSubmit(opts: DemoSubmitOptions = {}): Promise<'ok' | 'error'> {
  const search = opts.search ?? globalThis.location?.search ?? '';
  const delay =
    opts.delayMs ?? MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  const result: 'ok' | 'error' = search.includes('demo=error') ? 'error' : 'ok';
  return new Promise((resolve) => {
    setTimeout(() => resolve(result), delay);
  });
}
