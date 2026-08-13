import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertCircle, CheckCircle2, Check, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TermsModal } from "@/components/TermsModal";
import { APP_ORIGIN } from "@/lib/site";
import { CURRENT_TERMS_VERSION, markPendingTermsAcceptance } from "@/lib/legal";

const PASSWORD_RULES = [
  { label: "อย่างน้อย 8 ตัวอักษร",          test: (p: string) => p.length >= 8 },
  { label: "ตัวอักษรพิมพ์ใหญ่ (A–Z)",        test: (p: string) => /[A-Z]/.test(p) },
  { label: "ตัวอักษรพิมพ์เล็ก (a–z)",        test: (p: string) => /[a-z]/.test(p) },
  { label: "ตัวเลข (0–9)",                   test: (p: string) => /[0-9]/.test(p) },
  { label: "อักขระพิเศษ (!@#$%^&*…)",        test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function passwordValid(password: string) {
  return PASSWORD_RULES.every((r) => r.test(password));
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, confirm: false });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const emailError   = touched.email    && !isValidEmail(email)       ? "รูปแบบอีเมลไม่ถูกต้อง" : null;
  const confirmError = touched.confirm  && password !== confirmPassword ? "รหัสผ่านไม่ตรงกัน" : null;
  const formValid    = isValidEmail(email) && passwordValid(password) && password === confirmPassword && agreedToTerms;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirm: true });
    if (!formValid) return;

    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          terms_accepted: true,
          privacy_accepted: true,
          terms_version: CURRENT_TERMS_VERSION,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const handleGoogleRegister = async () => {
    setOauthLoading(true);
    setError(null);
    markPendingTermsAcceptance();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${APP_ORIGIN}/dashboard?terms_accepted=1` },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-6">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-primary mb-1">สร้างบัญชีใหม่</h1>
          <p className="text-gray-500 text-sm">สมัครสมาชิกเพื่อเริ่มสั่งทำสินค้า</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
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
          <>
            <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />

            {/* Google OAuth */}
            <Button
              type="button"
              variant="outline"
              className="w-full py-3 text-base flex items-center gap-3 mb-4"
              onClick={handleGoogleRegister}
              disabled={oauthLoading || loading || !agreedToTerms}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {oauthLoading ? "กำลังเชื่อมต่อ..." : "สมัครด้วย Google"}
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400">
                <span className="bg-white px-3">หรือสมัครด้วยอีเมล</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-3" noValidate>
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <div className="relative">
                  <Input
                    id="password"
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

                {/* Live password rules */}
                {(touched.password || password.length > 0) && (
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
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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

              {/* T&C agreement */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(v) => setAgreedToTerms(!!v)}
                  className="mt-0.5 shrink-0"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                  ฉันได้อ่านและยอมรับ{' '}
                  <button
                    type="button"
                    className="text-primary underline underline-offset-2 font-medium hover:text-primary/80"
                    onClick={() => setTermsOpen(true)}
                  >
                    ข้อตกลงและเงื่อนไขการใช้บริการ
                  </button>
                  {' '}/ I agree to the{' '}
                  <button
                    type="button"
                    className="text-primary underline underline-offset-2 font-medium hover:text-primary/80"
                    onClick={() => setTermsOpen(true)}
                  >
                    Terms of Service
                  </button>
                </label>
              </div>

              <Button type="submit" className="w-full py-3 text-base" disabled={loading || oauthLoading || !agreedToTerms}>
                {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
              </Button>
            </form>
          </>
        )}

        <div className="mt-4 text-center text-sm text-gray-500">
          มีบัญชีอยู่แล้ว?{" "}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
