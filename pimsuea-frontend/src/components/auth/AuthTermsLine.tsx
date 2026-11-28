import { useState } from 'react';
import { TermsModal } from '@/components/TermsModal';
import { useLanguage } from '@/i18n/LanguageContext';

/** Implied consent: continuing (Google or email) = accepting the terms. No blocking checkbox. */
export function AuthTermsLine() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <p className="text-xs text-gray-500 text-center leading-relaxed">
      {t.account.termsPrefix}{' '}
      <button type="button" className="text-primary underline underline-offset-2" onClick={() => setOpen(true)}>
        {t.account.terms}
      </button>
      .
      <TermsModal open={open} onClose={() => setOpen(false)} lang={lang} />
    </p>
  );
}
