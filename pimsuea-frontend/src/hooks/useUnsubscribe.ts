import { useEffect, useState } from 'react';
import { unsubscribeEmails } from '@/services/api';

/** Reads ?u=&t= from the email link and opts the user out of reminder emails. */
export function useUnsubscribe(search: string) {
  const [state, setState] = useState<'working' | 'done' | 'failed'>('working');
  useEffect(() => {
    const p = new URLSearchParams(search);
    const u = p.get('u');
    const t = p.get('t');
    if (!u || !t) {
      queueMicrotask(() => setState('failed'));
      return;
    }
    unsubscribeEmails(u, t).then(() => setState('done')).catch(() => setState('failed'));
  }, [search]);
  return state;
}
