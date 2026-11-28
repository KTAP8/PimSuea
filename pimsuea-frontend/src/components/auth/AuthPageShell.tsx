import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';

type Props = { title: string; subtitle?: string; children: React.ReactNode };

export function AuthPageShell({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-xl relative">
        <div className="absolute top-4 right-4"><LanguageSwitcher compact /></div>
        <div className="mb-5 pr-16">
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
