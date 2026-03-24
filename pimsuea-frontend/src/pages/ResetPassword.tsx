import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Check } from "lucide-react";

const PASSWORD_RULES = [
  { label: "อย่างน้อย 8 ตัวอักษร",        test: (p: string) => p.length >= 8 },
  { label: "ตัวอักษรพิมพ์ใหญ่ (A–Z)",      test: (p: string) => /[A-Z]/.test(p) },
  { label: "ตัวอักษรพิมพ์เล็ก (a–z)",      test: (p: string) => /[a-z]/.test(p) },
  { label: "ตัวเลข (0–9)",                 test: (p: string) => /[0-9]/.test(p) },
  { label: "อักขระพิเศษ (!@#$%^&*…)",      test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function passwordValid(p: string) {
  return PASSWORD_RULES.every((r) => r.test(p));
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  const confirmError = touched.confirm && password !== confirm ? "รหัสผ่านไม่ตรงกัน" : null;
  const formValid = passwordValid(password) && password === confirm;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    if (!formValid) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-gray-500 text-sm">กรอกรหัสผ่านใหม่ของคุณด้านล่าง</p>
        </div>

        {success ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">เปลี่ยนรหัสผ่านสำเร็จ</AlertTitle>
            <AlertDescription className="text-green-700">
              กำลังพาคุณไปหน้าเข้าสู่ระบบ...
            </AlertDescription>
          </Alert>
        ) : !ready ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว</AlertTitle>
            <AlertDescription>
              กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่อีกครั้ง
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* New password */}
              <div className="space-y-2">
                <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Live password rules — always visible */}
                <ul className="space-y-1 pt-1">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <li key={rule.label} className={`flex items-center gap-2 text-xs ${ok ? "text-green-600" : "text-gray-400"}`}>
                          <Check className={`w-3 h-3 flex-shrink-0 ${ok ? "opacity-100" : "opacity-30"}`} />
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                    className={`pr-10 ${confirmError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmError && <p className="text-xs text-red-500">{confirmError}</p>}
              </div>

              <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
                {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
