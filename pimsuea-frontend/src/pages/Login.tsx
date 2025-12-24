import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      // Successful login
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">ยินดีต้อนรับกลับมา</h1>
          <p className="text-gray-500">เข้าสู่ระบบเพื่อจัดการคำสั่งซื้อของคุณ</p>
        </div>

        {error && (
           <Alert variant="destructive" className="mb-6">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>เข้าสู่ระบบไม่สำเร็จ</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
           </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <a href="#" className="text-xs text-primary hover:underline">ลืมรหัสผ่าน?</a>
            </div>
            <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
            />
          </div>

          <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          ยังไม่มีบัญชี?{" "}
          <Link to="/register" className="text-primary hover:underline font-semibold">
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  );
}
