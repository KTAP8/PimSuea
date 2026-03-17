import { Wallet as WalletIcon } from "lucide-react";

export default function Wallet() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
        <WalletIcon className="w-10 h-10 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold mb-2">กระเป๋าเงิน</h1>
      <p className="text-gray-500 mb-1">ฟีเจอร์นี้กำลังจะมาเร็ว ๆ นี้</p>
      <p className="text-sm text-gray-400">เรากำลังพัฒนาระบบการชำระเงินให้ดียิ่งขึ้น</p>
    </div>
  );
}
