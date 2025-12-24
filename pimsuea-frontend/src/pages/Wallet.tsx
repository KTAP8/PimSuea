import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, CreditCard } from "lucide-react";

export default function Wallet() {
  const transactions = [
    { id: 1, title: "เติมเงินเข้ากระเป๋า", date: "24/12/2025", amount: "+฿1,000.00", type: "in", status: "สำเร็จ" },
    { id: 2, title: "ชำระค่าสินค้า (Ord-001)", date: "24/12/2025", amount: "-฿500.00", type: "out", status: "สำเร็จ" },
    { id: 3, title: "ชำระค่าสินค้า (Ord-002)", date: "20/12/2025", amount: "-฿590.00", type: "out", status: "สำเร็จ" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <WalletIcon className="mr-3" /> กระเป๋าเงิน
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Balance Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <WalletIcon className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-gray-400 mb-1">ยอดเงินคงเหลือ</p>
            <h2 className="text-4xl font-bold mb-6">฿4,910.00</h2>
            <div className="flex gap-3">
              <Button className="bg-white text-black hover:bg-gray-200">
                <ArrowDownLeft className="w-4 h-4 mr-2" /> เติมเงิน
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <CreditCard className="w-4 h-4 mr-2" /> ถอนเงิน
              </Button>
            </div>
          </div>
        </div>

         {/* Quick Stats or Promo */}
         <div className="bg-primary/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
            <span className="text-4xl mb-2">💎</span>
            <h3 className="font-bold text-primary text-lg">สมาชิกระดับ Gold</h3>
            <p className="text-sm text-gray-600">รับเงินคืน 5% ทุกยอดซื้อ</p>
         </div>
      </div>

      {/* Transactions */}
      <div>
        <h3 className="text-xl font-bold mb-4">รายการล่าสุด</h3>
        <div className="bg-white rounded-xl border divide-y">
            {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {tx.type === 'in' ? <ArrowDownLeft className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                        </div>
                        <div>
                            <p className="font-medium">{tx.title}</p>
                            <p className="text-sm text-gray-500">{tx.date}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-bold ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{tx.amount}</p>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{tx.status}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
