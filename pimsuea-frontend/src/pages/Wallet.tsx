import { Wallet as WalletIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Wallet() {
  const { t } = useLanguage();
  const o = t.orders;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
        <WalletIcon className="w-10 h-10 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold mb-2">{o.walletTitle}</h1>
      <p className="text-gray-500 mb-1">{o.walletComingSoon}</p>
      <p className="text-sm text-gray-400">{o.walletDesc}</p>
    </div>
  );
}
