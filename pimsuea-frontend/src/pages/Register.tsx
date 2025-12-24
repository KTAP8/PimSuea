import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
      // Optional: automatically login or redirect?
      // Usually need email confirmation for Supabase, so tell user to check email.
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">สร้างบัญชีใหม่</h1>
          <p className="text-gray-500">สมัครสมาชิกเพื่อเริ่มสั่งทำสินค้า</p>
        </div>

        {error && (
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {success ? (
             <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">สมัครสมาชิกสำเร็จ!</h2>
                <p className="text-gray-600">กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันการลงทะเบียน</p>
                <Link to="/login">
                    <Button className="w-full mt-4">กลับไปหน้าเข้าสู่ระบบ</Button>
                </Link>
             </div>
        ) : (
            <form onSubmit={handleRegister} className="space-y-6">
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
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                />
                <p className="text-xs text-gray-500">รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร</p>
            </div>

            <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
                {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </Button>
            </form>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          มีบัญชีอยู่แล้ว?{" "}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
