import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";

function passwordValid(p: string) {
  return [
    (x: string) => x.length >= 8,
    (x: string) => /[A-Z]/.test(x),
    (x: string) => /[a-z]/.test(x),
    (x: string) => /[0-9]/.test(x),
    (x: string) => /[^A-Za-z0-9]/.test(x),
  ].every((test) => test(p));
}

export default function ResetPassword() {
  const { t } = useLanguage();
  const a = t.auth;
  const passwordRules = a.passwordRules.map((label, i) => ({
    label,
    test: [
      (p: string) => p.length >= 8,
      (p: string) => /[A-Z]/.test(p),
      (p: string) => /[a-z]/.test(p),
      (p: string) => /[0-9]/.test(p),
      (p: string) => /[^A-Za-z0-9]/.test(p),
    ][i],
  }));

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

  const confirmError = touched.confirm && password !== confirm ? a.passwordMismatch : null;
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
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher compact />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">{a.resetTitle}</h1>
          <p className="text-gray-500 text-sm">{a.resetSubtitle}</p>
        </div>

        {success ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">{a.resetSuccess}</AlertTitle>
            <AlertDescription className="text-green-700">
              {a.resetSuccessDesc}
            </AlertDescription>
          </Alert>
        ) : !ready ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{a.resetInvalidLink}</AlertTitle>
            <AlertDescription>
              {a.resetInvalidLinkDesc}
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
              <div className="space-y-2">
                <Label htmlFor="new-password">{a.newPassword}</Label>
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

                <ul className="space-y-1 pt-1">
                    {passwordRules.map((rule) => {
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

              <div className="space-y-2">
                <Label htmlFor="confirm-password">{a.confirmNewPassword}</Label>
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
                {loading ? a.saving : a.saveNewPassword}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
