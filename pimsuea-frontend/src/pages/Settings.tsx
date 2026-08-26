import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Lock,
  Save,
  Loader2,
  GraduationCap,
  Tag,
  Building2,
  Sparkles,
  Mail,
  ShieldCheck,
  Calendar,
  KeyRound,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AI_ASSISTANT_TOOLS,
  isAiAssistantSource,
  REFERRAL_SOURCES,
} from "@/lib/referralSources";

// Modern purpose options with Lucide icons
const DESIGN_PURPOSES = [
  {
    value: "university_club",
    label: "มหาวิทยาลัย / ชมรม",
    sub: "กิจกรรมนักศึกษา เสื้อรุ่น เสื้อคณะ",
    icon: GraduationCap,
  },
  {
    value: "own_brand",
    label: "แบรนด์ของฉัน",
    sub: "แบรนด์แฟชั่น เสื้อผ้าเมิร์ช หรือดรอปสินค้า",
    icon: Tag,
  },
  {
    value: "company_team",
    label: "บริษัท / ทีมงาน",
    sub: "ยูนิฟอร์มพนักงาน อีเวนต์ หรือทีมงาน",
    icon: Building2,
  },
  {
    value: "personal",
    label: "สั่งทำส่วนตัว / ของขวัญ",
    sub: "ออกแบบใส่เอง หรือสั่งเป็นของขวัญพิเศษ",
    icon: Sparkles,
  },
];

type SettingsTab = "profile" | "preferences" | "security";

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [designPurpose, setDesignPurpose] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [referralDetail, setReferralDetail] = useState("");

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form States
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
      setReferralDetail(profile.referral_detail ?? "");
    }
  }, [profile]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      referral_detail: isAiAssistantSource(referralSource)
        ? referralDetail || null
        : null,
    });

    if (error) {
      setProfileError(error.message);
    } else {
      await refreshProfile();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3500);
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
      setTimeout(() => setPasswordSuccess(false), 3500);
    }
    setPasswordLoading(false);
  };

  const isOAuthUser =
    !user?.email?.includes("@") === false &&
    (user?.app_metadata?.provider === "google" ||
      user?.app_metadata?.providers?.includes("google"));

  const userInitials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : firstName
      ? firstName.slice(0, 2).toUpperCase()
      : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : "PS";

  const fullName =
    firstName || lastName ? `${firstName} ${lastName}`.trim() : "ผู้ใช้งาน PimSuea";

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-50 text-foreground py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
        {/* ── Page Header & Profile Hero Card ── */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-action/5 rounded-full blur-2xl pointer-events-none -z-10" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* User Avatar Circle */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-primary via-primary/85 to-teal-400 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shadow-primary/20 shrink-0 border-2 border-white">
                {userInitials}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    {fullName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    ยืนยันแล้ว
                  </span>
                </div>

                <p className="text-sm text-muted-foreground font-medium mt-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground/70" />
                  {user?.email ?? "—"}
                </p>
              </div>
            </div>

            {/* Save Quick Action in Header (Desktop) */}
            <div className="hidden sm:block">
              <Button
                type="button"
                onClick={() => handleSaveProfile()}
                disabled={profileLoading}
                className="rounded-full font-bold uppercase tracking-wider text-xs px-6 py-5 bg-action hover:bg-action/90 text-action-foreground shadow-md shadow-action/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                {profileLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                บันทึกการเปลี่ยนแปลง
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-8 pt-6 border-t border-border/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: "profile" as SettingsTab, label: "โปรไฟล์ส่วนตัว", icon: User },
              {
                id: "preferences" as SettingsTab,
                label: "ความสนใจและการใช้งาน",
                icon: Tag,
              },
              {
                id: "security" as SettingsTab,
                label: "ความปลอดภัย & บัญชี",
                icon: Lock,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer select-none flex items-center gap-2",
                    isActive
                      ? "text-white shadow-md shadow-primary/20"
                      : "text-foreground/70 hover:text-foreground bg-secondary/40 hover:bg-secondary/80 border border-border/60"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="settings-active-tab"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon className={cn("w-4 h-4 relative z-10", isActive ? "text-white" : "text-muted-foreground")} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Toast / Alerts */}
        <AnimatePresence>
          {profileSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-xs"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-sm font-bold">บันทึกข้อมูลโปรไฟล์ของคุณเรียบร้อยแล้ว</div>
            </motion.div>
          )}

          {profileError && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 shadow-xs"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="text-sm font-bold">{profileError}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Tab Contents ── */}
        <div className="space-y-6">

          {/* TAB 1: PERSONAL PROFILE */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">
                    ข้อมูลผู้ติดต่อ
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    ข้อมูลที่ใช้สำหรับการจัดส่ง ใบเสร็จ และการประสานงาน
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5" />
                      ชื่อ (First Name)
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="เช่น สมชาย"
                      className="h-12 bg-secondary/30 border-border focus-visible:ring-primary/20 focus-visible:border-primary font-medium rounded-2xl px-4 text-base transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5" />
                      นามสกุล (Last Name)
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="เช่น ใจดี"
                      className="h-12 bg-secondary/30 border-border focus-visible:ring-primary/20 focus-visible:border-primary font-medium rounded-2xl px-4 text-base transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="age"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      อายุ (Age)
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min={1}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="เช่น 24"
                      className="h-12 bg-secondary/30 border-border focus-visible:ring-primary/20 focus-visible:border-primary font-medium rounded-2xl px-4 text-base transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      อีเมลล็อกอิน (Email)
                    </Label>
                    <div className="h-12 bg-secondary/60 border border-border/80 rounded-2xl px-4 flex items-center justify-between text-muted-foreground text-sm font-medium">
                      <span className="truncate">{user?.email ?? "—"}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground/70 shrink-0">
                        อ่านอย่างเดียว
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save action footer */}
                <div className="pt-4 border-t border-border/60 flex justify-end">
                  <Button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full sm:w-auto h-12 px-8 bg-action hover:bg-action/90 text-action-foreground font-bold text-xs uppercase tracking-wider rounded-full shadow-md shadow-action/20 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    {profileLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    บันทึกข้อมูล
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* TAB 2: PREFERENCES & PURPOSE */}
          {activeTab === "preferences" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8"
            >
              {/* Purpose Selection */}
              <div>
                <div className="flex items-center gap-3 pb-4 mb-5 border-b border-border/60">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">
                      วัตถุประสงค์การใช้งานหลัก
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      ช่วยให้เราแนะนำทรงเสื้อ เนื้อผ้า และเทคนิคการพิมพ์ที่เหมาะกับคุณที่สุด
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {DESIGN_PURPOSES.map((opt) => {
                    const isSelected = designPurpose === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDesignPurpose(opt.value)}
                        className={cn(
                          "relative flex items-start gap-4 p-4 rounded-2xl text-left border transition-all duration-300 cursor-pointer group",
                          isSelected
                            ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/20 scale-[1.01]"
                            : "border-border bg-card text-foreground/80 hover:border-primary/40 hover:bg-secondary/40"
                        )}
                      >
                        <div
                          className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "bg-primary text-white shadow-xs"
                              : "bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 pr-6">
                          <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {opt.label}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {opt.sub}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Referral Source */}
              <div className="pt-6 border-t border-border/60">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-foreground">
                    คุณรู้จัก PimSuea จากช่องทางใด?
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    บอกเราเพื่อช่วยพัฒนาช่องทางสื่อสารให้ดียิ่งขึ้น
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {REFERRAL_SOURCES.map((opt) => {
                    const isSelected = referralSource === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setReferralSource(opt.value);
                          if (!isAiAssistantSource(opt.value)) {
                            setReferralDetail("");
                          }
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300 cursor-pointer group text-center",
                          isSelected
                            ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/20 scale-[1.02]"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-secondary/40"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-primary text-white shadow-xs"
                              : "bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xs">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {isAiAssistantSource(referralSource) && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      ใช้ AI ตัวไหน?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {AI_ASSISTANT_TOOLS.map((tool) => {
                        const isToolSelected = referralDetail === tool.value;
                        return (
                          <button
                            key={tool.value}
                            type="button"
                            onClick={() => setReferralDetail(tool.value)}
                            className={cn(
                              "px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer",
                              isToolSelected
                                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            )}
                          >
                            {tool.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Save action footer */}
              <div className="pt-4 border-t border-border/60 flex justify-end">
                <Button
                  type="button"
                  onClick={() => handleSaveProfile()}
                  disabled={profileLoading}
                  className="w-full sm:w-auto h-12 px-8 bg-action hover:bg-action/90 text-action-foreground font-bold text-xs uppercase tracking-wider rounded-full shadow-md shadow-action/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {profileLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  บันทึกความสนใจ
                </Button>
              </div>
            </motion.div>
          )}

          {/* TAB 3: SECURITY & PASSWORD */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Account Auth Summary */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-3 pb-4 mb-5 border-b border-border/60">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">
                      การรักษาความปลอดภัยของบัญชี
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      สถานะและวิธีการเข้าสู่ระบบของบัญชีคุณ
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-secondary/30 border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center text-primary shadow-2xs">
                      {isOAuthUser ? (
                        <Sparkles className="w-5 h-5 text-action" />
                      ) : (
                        <KeyRound className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">
                        {isOAuthUser
                          ? "ลงชื่อเข้าใช้ด้วย Google Account"
                          : "ลงชื่อเข้าใช้ด้วย อีเมลและรหัสผ่าน"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {isOAuthUser
                          ? "บัญชีของคุณเชื่อมต่อและป้องกันด้วยระบบความปลอดภัยของ Google"
                          : "คุณสามารถเปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชีได้ตลอดเวลา"}
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    ปลอดภัย
                  </span>
                </div>
              </div>

              {/* Password Change Form (Only if not OAuth) */}
              {!isOAuthUser ? (
                <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-foreground">
                        เปลี่ยนรหัสผ่าน
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {passwordSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm font-bold shadow-xs"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        รหัสผ่านถูกปรับปรุงเรียบร้อยแล้ว
                      </motion.div>
                    )}

                    {passwordError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-sm font-bold shadow-xs"
                      >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {passwordError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleChangePassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="currentPassword"
                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        รหัสผ่านปัจจุบัน
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrent ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="h-12 bg-secondary/30 border-border focus-visible:ring-primary/20 focus-visible:border-primary font-medium rounded-2xl px-4 text-base pr-12"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          onClick={() => setShowCurrent((v) => !v)}
                          tabIndex={-1}
                        >
                          {showCurrent ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label
                          htmlFor="newPassword"
                          className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                        >
                          รหัสผ่านใหม่
                        </Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNew ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-12 bg-secondary/30 border-border focus-visible:ring-primary/20 focus-visible:border-primary font-medium rounded-2xl px-4 text-base pr-12"
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            onClick={() => setShowNew((v) => !v)}
                            tabIndex={-1}
                          >
                            {showNew ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                        >
                          ยืนยันรหัสผ่านใหม่
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={cn(
                              "h-12 bg-secondary/30 border-border focus-visible:ring-primary/20 focus-visible:border-primary font-medium rounded-2xl px-4 text-base pr-12",
                              confirmPassword &&
                                newPassword !== confirmPassword &&
                                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                            )}
                            required
                          />
                          <button
                            type="button"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            onClick={() => setShowConfirm((v) => !v)}
                            tabIndex={-1}
                          >
                            {showConfirm ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                          <p className="text-xs text-destructive font-bold mt-1">
                            รหัสผ่านใหม่ไม่ตรงกัน
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/60 flex justify-end">
                      <Button
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-full shadow-md shadow-primary/20 transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        {passwordLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Lock className="w-4 h-4 mr-2" />
                        )}
                        บันทึกรหัสผ่านใหม่
                      </Button>
                    </div>
                  </form>
                </div>
              ) : null}
            </motion.div>
          )}

        </div>

        {/* Mobile Sticky / Floating Save Bar */}
        <div className="block sm:hidden pt-4">
          <Button
            type="button"
            onClick={() => handleSaveProfile()}
            disabled={profileLoading}
            className="w-full h-12 rounded-full font-bold uppercase tracking-wider text-xs bg-action hover:bg-action/90 text-action-foreground shadow-lg shadow-action/20 cursor-pointer"
          >
            {profileLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            บันทึกข้อมูล
          </Button>
        </div>

      </div>
    </div>
  );
}
