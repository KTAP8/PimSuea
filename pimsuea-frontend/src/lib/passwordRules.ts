/** Same order as translations auth.passwordRules. Supabase enforces the same policy server-side. */
export const PASSWORD_TESTS: ((p: string) => boolean)[] = [
  (p) => p.length >= 8,
  (p) => /[A-Z]/.test(p),
  (p) => /[a-z]/.test(p),
  (p) => /[0-9]/.test(p),
  (p) => /[^A-Za-z0-9]/.test(p),
];

export const passwordValid = (p: string): boolean => PASSWORD_TESTS.every((t) => t(p));
export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
