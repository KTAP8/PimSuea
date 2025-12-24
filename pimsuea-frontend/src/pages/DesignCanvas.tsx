import { useParams } from "react-router-dom";
import { PenTool } from "lucide-react";

export default function DesignCanvas() {
  const { id } = useParams();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md mx-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <PenTool className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">พื้นที่ออกแบบ (ID: {id})</h1>
            <p className="text-lg">ระบบออกแบบกำลังจะเปิดใช้งานเร็วๆ นี้</p>
            <p className="text-sm mt-4 text-gray-400">Coming Soon</p>
        </div>
    </div>
  );
}
