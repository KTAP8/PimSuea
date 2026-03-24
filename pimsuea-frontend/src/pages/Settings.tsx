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
    <div className="min-h-screen bg-gray-50 text-gray-900 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">การตั้งค่าบัญชี</h1>
            <p className="text-gray-500 text-sm mt-1 mb-8">จัดการโปรไฟล์ ความปลอดภัย และข้อมูลส่วนตัวของคุณ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            
            {/* Main Content Area */}
            <div className="space-y-6">
                
                {/* ── Profile Section ── */}
                <section className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm transition-shadow hover:shadow-md relative overflow-hidden group">
                    
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">โปรไฟล์ส่วนตัว</h2>
                            <p className="text-xs text-gray-500 font-medium">ข้อมูลที่ใช้สำหรับการติดต่อและประเมินงาน</p>
                        </div>
                    </div>

                    {profileSuccess && (
                    <Alert className="mb-6 bg-green-50 border-green-200 text-green-700 rounded-xl py-3">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription className="font-bold border-none m-0 text-sm">อัปเดตโปรไฟล์เรียบร้อยแล้ว</AlertDescription>
                    </Alert>
                    )}
                    {profileError && (
                    <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-600 rounded-xl py-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-bold border-none m-0 text-sm">{profileError}</AlertDescription>
                    </Alert>
                    )}

                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="firstName" className="text-gray-700 font-bold text-sm ml-1">ชื่อ (First Name)</Label>
                                <Input
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-primary/20 focus-visible:border-primary font-medium transition-all rounded-xl px-4 text-base"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="lastName" className="text-gray-700 font-bold text-sm ml-1">นามสกุล (Last Name)</Label>
                                <Input
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-primary/20 focus-visible:border-primary font-medium transition-all rounded-xl px-4 text-base"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="age" className="text-gray-700 font-bold text-sm ml-1">อายุ (Age)</Label>
                            <Input
                                id="age"
                                type="number"
                                min={1}
                                max={120}
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="เช่น 25"
                                className="h-11 md:max-w-[200px] bg-gray-50 border-gray-200 focus-visible:ring-primary/20 focus-visible:border-primary font-medium transition-all rounded-xl px-4 text-base"
                            />
                        </div>

                        <div className="space-y-3 pt-3 border-t border-gray-50">
                            <Label className="text-gray-700 font-bold text-sm">วัตถุประสงค์การใช้งานหลัก</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {DESIGN_PURPOSES.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setDesignPurpose(opt.value)}
                                        className={`flex items-center gap-3 p-3 border rounded-xl text-left bg-white transition-all duration-300 ${
                                            designPurpose === opt.value
                                            ? "border-primary bg-primary/5 text-primary shadow-sm scale-[1.01]"
                                            : "border-gray-100 text-gray-600 hover:border-primary/30 hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${designPurpose === opt.value ? 'bg-white shadow-sm grayscale-0' : 'bg-gray-50 grayscale'}`}>{opt.icon}</div>
                                        <span className="font-bold tracking-wide text-sm">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-gray-50">
                            <Label className="text-gray-700 font-bold text-sm">คุณรู้จัก PimSuea จากที่ไหน?</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {REFERRAL_SOURCES.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setReferralSource(opt.value)}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-xl transition-all duration-300 ${
                                            referralSource === opt.value
                                            ? "border-primary bg-primary/5 text-primary shadow-sm scale-[1.01]"
                                            : "border-gray-100 bg-white text-gray-500 hover:border-primary/30 hover:text-gray-900 hover:bg-gray-50"
                                        }`}
                                    >
                                        <span className={`text-2xl ${referralSource === opt.value ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'} transition-all`}>{opt.icon}</span>
                                        <span className="font-bold tracking-wide text-xs text-center">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-gray-100">
                            <Button 
                                type="submit" 
                                disabled={profileLoading} 
                                className="w-full sm:w-auto h-12 px-8 bg-primary text-white hover:bg-primary/90 font-bold text-sm tracking-wide rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                {profileLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                                    <span className="flex items-center gap-2">
                                        <Save className="w-4 h-4" /> บันทึกโปรไฟล์
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </section>

            </div>

            {/* Sidebar Columns */}
            <div className="space-y-6">
                
                {/* ── Account Info ── */}
                <section className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm relative overflow-hidden group transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                            <User className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">
                            อีเมลที่ใช้งาน
                        </h2>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-inner">
                        <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-wider block mb-0.5">อีเมล (Email)</Label>
                        <p className="text-gray-900 font-bold text-sm truncate">{user?.email ?? "—"}</p>
                    </div>
                </section>

                {/* ── Change Password ── */}
                {!isOAuthUser && (
                <section className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm relative overflow-hidden group transition-shadow hover:shadow-md">
                    
                    <div className="flex items-center gap-3 mb-5">
                        <div className="bg-amber-50 p-2 rounded-xl text-amber-600">
                            <Lock className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">
                            ความปลอดภัย
                        </h2>
                    </div>

                    {passwordSuccess && (
                        <Alert className="mb-5 bg-green-50 border-green-200 text-green-700 rounded-xl py-2">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription className="font-bold border-none m-0 text-xs">รหัสผ่านถูกปรับปรุงเรียบร้อย</AlertDescription>
                        </Alert>
                    )}
                    {passwordError && (
                        <Alert variant="destructive" className="mb-5 bg-red-50 border-red-200 text-red-600 rounded-xl py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="font-bold border-none m-0 text-xs">{passwordError}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="currentPassword" className="text-gray-700 font-bold text-sm ml-1">รหัสผ่านปัจจุบัน</Label>
                        <div className="relative">
                            <Input
                                id="currentPassword"
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-primary/20 focus-visible:border-primary font-medium rounded-xl px-4 text-base pr-10"
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                onClick={() => setShowCurrent((v) => !v)}
                                tabIndex={-1}
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="newPassword" className="text-gray-700 font-bold text-sm ml-1">รหัสผ่านใหม่</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-primary/20 focus-visible:border-primary font-medium rounded-xl px-4 text-base pr-10"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                onClick={() => setShowNew((v) => !v)}
                                tabIndex={-1}
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword" className="text-gray-700 font-bold text-sm ml-1">ยืนยันรหัสผ่านใหม่</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`h-11 bg-gray-50 border-gray-200 focus-visible:ring-primary/20 focus-visible:border-primary font-medium rounded-xl px-4 text-base pr-10 ${confirmPassword && newPassword !== confirmPassword ? "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}`}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                onClick={() => setShowConfirm((v) => !v)}
                                tabIndex={-1}
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500 font-bold mt-1 ml-1">รหัสผ่านไม่ตรงกัน</p>
                        )}
                    </div>

                    <div className="pt-3">
                        <Button 
                            type="submit" 
                            disabled={passwordLoading} 
                            variant="outline" 
                            className="w-full h-11 border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold text-sm rounded-xl transition-all duration-300"
                        >
                            {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" /> : "บันทึกรหัสผ่านใหม่"}
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
