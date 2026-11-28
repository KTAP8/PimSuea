export type SaveErrorReason = 'network' | 'session' | 'tooLarge' | 'server';

/** Classify an axios / fetch error from save, upload or compose into something a user can act on. */
export function saveErrorReason(err: unknown): SaveErrorReason {
  const e = err as { response?: { status?: number }; code?: string; message?: string };
  const status = e?.response?.status;
  if (!e?.response && (e?.code === 'ERR_NETWORK' || /network|fetch/i.test(e?.message ?? ''))) return 'network';
  if (status === 401 || status === 403) return 'session';
  if (status === 413) return 'tooLarge';
  return 'server';
}
