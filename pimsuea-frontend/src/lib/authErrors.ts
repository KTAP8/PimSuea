import type { AuthError } from '@supabase/supabase-js';

export type AuthErrorKey =
  | 'invalidCredentials' | 'alreadyRegistered' | 'weakPassword' | 'rateLimited'
  | 'emailNotConfirmed' | 'network' | 'generic';

/** Map Supabase auth errors to a translation key (raw messages are English-only and technical). */
export function authErrorKey(error: AuthError | Error | null | undefined): AuthErrorKey {
  if (!error) return 'generic';
  const code = (error as AuthError).code ?? '';
  const msg = error.message.toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login')) return 'invalidCredentials';
  if (code === 'user_already_exists' || code === 'email_exists' || msg.includes('already registered')) return 'alreadyRegistered';
  if (code === 'weak_password' || msg.includes('password should')) return 'weakPassword';
  if (code.startsWith('over_') || msg.includes('rate limit') || msg.includes('too many')) return 'rateLimited';
  if (code === 'email_not_confirmed' || msg.includes('not confirmed')) return 'emailNotConfirmed';
  if (msg.includes('fetch') || msg.includes('network')) return 'network';
  return 'generic';
}
