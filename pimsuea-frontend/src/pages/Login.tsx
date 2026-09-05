import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { TermsModal } from "@/components/TermsModal";
import { APP_ORIGIN } from "@/lib/site";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";

export default function Login() {
  const { t, lang } = useLanguage();
  const a = t.auth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${APP_ORIGIN}/reset-password`,
    });
    setForgotLoading(false);
    if (error) {
      setForgotError(error.message);
    } else {
      setForgotSent(true);
    }
  };

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
      navigate("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${APP_ORIGIN}/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(false);
    }
  };

  if (forgotMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl relative">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher compact />
          </div>
          <button
            onClick={() => { setForgotMode(false); setForgotSent(false); setForgotError(null); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> {a.backToLogin}
          </button>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2">{a.forgotTitle}</h1>
            <p className="text-gray-500 text-sm">{a.forgotSubtitle}</p>
          </div>

          {forgotSent ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">{a.emailSent}</AlertTitle>
              <AlertDescription className="text-green-700">
                {a.emailSentDesc} <strong>{forgotEmail}</strong>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {forgotError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{forgotError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">{t.common.email}</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full py-6 text-lg" disabled={forgotLoading}>
                  {forgotLoading ? a.sending : a.sendResetLink}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} lang={lang} />
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher compact />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">{a.loginTitle}</h1>
          <p className="text-gray-500">{a.loginSubtitle}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{a.loginFailed}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full py-6 text-base flex items-center gap-3 mb-6"
          onClick={handleGoogleLogin}
          disabled={oauthLoading || loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {oauthLoading ? a.connecting : a.loginWithGoogle}
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400">
            <span className="bg-white px-3">{a.loginWithEmail}</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t.common.email}</Label>
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
              <Label htmlFor="password">{t.common.password}</Label>
              <button
                type="button"
                onClick={() => { setForgotMode(true); setForgotEmail(email); }}
                className="text-xs text-primary hover:underline"
              >
                {a.forgotPassword}
              </button>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full py-6 text-lg" disabled={loading || oauthLoading}>
            {loading ? a.loggingIn : a.login}
          </Button>

          <p className="text-center text-xs text-gray-400 mt-3">
            {a.loginTermsPrefix}{" "}
            <button type="button" onClick={() => setTermsOpen(true)} className="underline underline-offset-2 hover:text-gray-600">
              {a.termsLinkTh}
            </button>
            {" "}{a.loginTermsAnd}{" "}
            <button type="button" onClick={() => setTermsOpen(true)} className="underline underline-offset-2 hover:text-gray-600">
              {a.termsLinkEn}
            </button>
          </p>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {a.noAccount}{" "}
          <Link to="/register" className="text-primary hover:underline font-semibold">
            {a.register}
          </Link>
        </div>
      </div>
    </div>
  );
}
