import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/i18n/LanguageContext';
import { track } from '@/lib/analytics';
import { AccountForm } from './AccountForm';

export type SignupTrigger = 'save' | 'order' | 'cart' | 'generic';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: SignupTrigger;
  /** Where to land after auth — usually the current studio URL. */
  next: string;
};

/** The guest → account moment, shown over the canvas so the design stays in view. */
export function SignupSheet({ open, onOpenChange, trigger, next }: Props) {
  const { t } = useLanguage();
  const a = t.account;

  useEffect(() => {
    if (open) track('signup_prompt_shown', { trigger });
  }, [open, trigger]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{a.sheetTitle[trigger]}</DialogTitle>
          <DialogDescription>{a.sheetSubtitle[trigger]}</DialogDescription>
        </DialogHeader>
        <AccountForm next={next} trigger={trigger} />
        {trigger === 'save' && (
          <button type="button" className="w-full text-center text-sm text-gray-500 hover:text-gray-700" onClick={() => onOpenChange(false)}>
            {a.notNow}
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
