import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Eye, EyeOff, User, Lock, Save, Loader2 } from "lucide-react";

const DESIGN_PURPOSES = [
  { value: "university_club", label: "มหาวิทยาลัย / ชมรม", icon: "🎓" },
  { value: "own_brand",       label: "แบรนด์ของฉัน", icon: "🏷️" },
  { value: "company_team",    label: "บริษัท / ทีม", icon: "🏢" },
  { value: "personal",        label: "ใช้ส่วนตัว", icon: "✨" },
];

const REFERRAL_SOURCES = [
  { value: "instagram",     label: "Instagram", icon: "📱" },
  { value: "tiktok",        label: "TikTok", icon: "🎵" },
  { value: "search",        label: "ค้นหาออนไลน์", icon: "🔍" },
  { value: "word_of_mouth", label: "เพื่อนแนะนำ", icon: "🗣️" },
  { value: "other",         label: "อื่น ๆ", icon: "✨" },
];

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [designPurpose, setDesignPurpose] = useState("");
  const [referralSource, setReferralSource] = useState("");

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password section
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setAge(profile.age != null ? String(profile.age) : "");
      setDesignPurpose(profile.design_purpose ?? "");
      setReferralSource(profile.referral_source ?? "");
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      age: age ? parseInt(age, 10) : null,
      design_purpose: designPurpose || null,
      referral_source: referralSource || null,
    });

    if (error) {
      setProfileError(error.message);
    } else {
      await refreshProfile();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
    setProfileLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setPasswordLoading(true);

    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });

    if (signInError) {
      setPasswordError("รหัสผ่านปัจจุบันไม่ถูกต้อง");
      setPasswordLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
    setPasswordLoading(false);
  };

  const isOAuthUser = !user?.email?.includes("@") === false &&
    (user?.app_metadata?.provider === "google" || user?.app_metadata?.providers?.includes("google"));

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 selection:bg-action/30">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight">Account <span className="font-bold">Settings</span><span className="text-action">.</span></h1>
            <p className="text-muted-foreground font-light mt-2">Manage your preferences, security, and personal profile.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
            
            {/* Main Content Area */}
            <div className="space-y-8">
                
                {/* ── Profile Section ── */}
                <section className="bg-secondary/20 border border-border rounded-none p-6 md:p-8 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-300" />
                    
                    <div className="flex items-center gap-3 mb-8">
                        <User className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-light text-foreground">Personal Profile</h2>
                    </div>

                    {profileSuccess && (
                    <Alert className="mb-6 bg-primary/10 border-primary text-primary font-light backdrop-blur-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>Profile updated successfully.</AlertDescription>
                    </Alert>
                    )}
                    {profileError && (
                    <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive text-destructive font-light backdrop-blur-sm">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                    )}

                    <form onSubmit={handleSaveProfile} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">First Name / ชื่อ</Label>
                                <Input
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    className="h-12 bg-secondary/50 border-border focus-visible:ring-primary focus-visible:border-primary font-light transition-all rounded-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Last Name / นามสกุล</Label>
                                <Input
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    className="h-12 bg-secondary/50 border-border focus-visible:ring-primary focus-visible:border-primary font-light transition-all rounded-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="age" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Age / อายุ</Label>
                            <Input
                                id="age"
                                type="number"
                                min={1}
                                max={120}
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="Age"
                                className="h-12 md:max-w-[200px] bg-secondary/50 border-border focus-visible:ring-primary focus-visible:border-primary font-light transition-all rounded-none"
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Objective / วัตถุประสงค์การออกแบบ</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {DESIGN_PURPOSES.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setDesignPurpose(opt.value)}
                                        className={`flex items-center gap-3 p-4 border text-left bg-transparent transition-all duration-300 ${
                                            designPurpose === opt.value
                                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                                            : "border-border text-foreground hover:border-primary/50 hover:bg-secondary/30"
                                        }`}
                                    >
                                        <span className={`text-xl ${designPurpose === opt.value ? 'grayscale-0' : 'grayscale'} transition-all`}>{opt.icon}</span>
                                        <span className="font-bold tracking-wide text-sm">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Discovery / รู้จัก PimSuea จากที่ไหน</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {REFERRAL_SOURCES.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setReferralSource(opt.value)}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 border transition-all duration-300 ${
                                            referralSource === opt.value
                                            ? "border-primary bg-primary/10 text-primary shadow-sm scale-[1.02]"
                                            : "border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-secondary/30"
                                        }`}
                                    >
                                        <span className={`text-2xl ${referralSource === opt.value ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'} transition-all`}>{opt.icon}</span>
                                        <span className="font-bold tracking-wide text-xs text-center">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border">
                            <Button 
                                type="submit" 
                                disabled={profileLoading} 
                                className="w-full sm:w-auto h-12 px-8 bg-action text-white hover:bg-action/90 font-bold tracking-widest uppercase rounded-none transition-all duration-300"
                            >
                                {profileLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                                    <span className="flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Save Profile
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </section>

            </div>

            {/* Sidebar Columns */}
            <div className="space-y-8">
                
                {/* ── Account Info ── */}
                <section className="bg-secondary/20 border border-border p-6 rounded-none relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-border group-hover:bg-primary/50 transition-colors duration-300" />
                    <h2 className="text-lg font-bold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                        Account Info
                    </h2>
                    <div className="space-y-1 bg-background p-4 border border-border">
                        <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Email Address</Label>
                        <p className="text-foreground font-light text-sm truncate">{user?.email ?? "—"}</p>
                    </div>
                </section>

                {/* ── Change Password ── */}
                {!isOAuthUser && (
                <section className="bg-secondary/20 border border-border p-6 rounded-none relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-border group-hover:bg-action/50 transition-colors duration-300" />
                    
                    <h2 className="text-lg font-bold text-foreground mb-6 uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4 text-action" /> Security
                    </h2>

                    {passwordSuccess && (
                        <Alert className="mb-6 bg-primary/10 border-primary text-primary font-light backdrop-blur-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>Password updated successfully.</AlertDescription>
                        </Alert>
                    )}
                    {passwordError && (
                        <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive text-destructive font-light backdrop-blur-sm">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{passwordError}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Current Password</Label>
                        <div className="relative">
                            <Input
                                id="currentPassword"
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="h-12 bg-secondary/50 border-border focus-visible:ring-primary focus-visible:border-primary font-light rounded-none pr-10"
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setShowCurrent((v) => !v)}
                                tabIndex={-1}
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">New Password</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-12 bg-secondary/50 border-border focus-visible:ring-primary focus-visible:border-primary font-light rounded-none pr-10"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setShowNew((v) => !v)}
                                tabIndex={-1}
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Confirm Password</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`h-12 bg-secondary/50 border-border focus-visible:ring-primary focus-visible:border-primary font-light rounded-none pr-10 ${confirmPassword && newPassword !== confirmPassword ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive" : ""}`}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setShowConfirm((v) => !v)}
                                tabIndex={-1}
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-destructive font-light mt-1">Passwords do not match</p>
                        )}
                    </div>

                    <div className="pt-2">
                        <Button 
                            type="submit" 
                            disabled={passwordLoading} 
                            variant="outline" 
                            className="w-full h-12 border-border text-foreground hover:bg-secondary/80 font-bold uppercase tracking-widest rounded-none transition-all duration-300"
                        >
                            {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /> : "Update Password"}
                        </Button>
                    </div>
                    </form>
                </section>
                )}
            </div>
            
        </div>
      </div>
    </div>
  );
}
