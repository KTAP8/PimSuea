import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

type Props = { email: string; cooldown: number; onResend: () => void };

export function CheckInbox({ email, cooldown, onResend }: Props) {
  const { t } = useLanguage();
  const a = t.account;
  const isGmail = /@(gmail|googlemail)\.com$/i.test(email);
  return (
    <div className="text-center space-y-4 py-2">
      <MailCheck className="w-12 h-12 text-primary mx-auto" aria-hidden="true" />
      <h2 className="text-xl font-bold text-gray-900">{a.checkInboxTitle}</h2>
      <p className="text-sm text-gray-600">{a.checkInboxBody.replace('{email}', email)}</p>
      <div className="flex flex-col gap-2">
        {isGmail && (
          <Button asChild className="w-full h-11">
            <a href="https://mail.google.com/mail/u/0/#search/from%3Apimsuea" target="_blank" rel="noreferrer">{a.openGmail}</a>
          </Button>
        )}
        <Button variant="outline" className="w-full h-11" disabled={cooldown > 0} onClick={onResend}>
          {cooldown > 0 ? a.resendIn.replace('{s}', String(cooldown)) : a.resend}
        </Button>
      </div>
    </div>
  );
}
