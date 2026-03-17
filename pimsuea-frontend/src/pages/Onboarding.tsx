import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

const DESIGN_PURPOSES = [
  { value: "university_club", icon: "🎓", label: "มหาวิทยาลัย / ชมรม", desc: "สำหรับกลุ่มและองค์กรทางการศึกษา" },
  { value: "own_brand",       icon: "🏷️", label: "แบรนด์ของฉัน", desc: "เริ่มต้นหรือขยายแบรนด์เสื้อผ้า" },
  { value: "company_team",    icon: "🏢", label: "บริษัท / ทีม", desc: "เครื่องแบบองค์กรและทีมงาน" },
  { value: "personal",        icon: "✨", label: "ใช้ส่วนตัว", desc: "ออกแบบชิ้นงานพิเศษสำหรับตัวเอง" },
];

const REFERRAL_SOURCES = [
  { value: "instagram",     label: "Instagram", icon: "📱" },
  { value: "tiktok",        label: "TikTok", icon: "🎵" },
  { value: "search",        label: "ค้นหาออนไลน์", icon: "🔍" },
  { value: "word_of_mouth", label: "เพื่อนแนะนำ", icon: "🗣️" },
  { value: "other",         label: "อื่น ๆ", icon: "✨" },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 50 : -50,
    opacity: 0
  })
};

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");

  // Step 2
  const [designPurpose, setDesignPurpose] = useState<string | null>(null);

  // Step 3
  const [referralSource, setReferralSource] = useState<string | null>(null);

  const canContinueStep1 = firstName.trim() && lastName.trim() && age.trim();
  const canContinueStep2 = designPurpose !== null;
  const canContinueStep3 = referralSource !== null;

  const nextStep = () => {
      setDirection(1);
      setStep(prev => prev + 1);
  };

  const prevStep = () => {
      setDirection(-1);
      setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`,
      age: parseInt(age),
      design_purpose: designPurpose,
      referral_source: referralSource,
      onboarding_completed: true,
    }, { onConflict: 'id' });
    
    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }
    
    await refreshProfile();
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden selection:bg-action/30">
      
      {/* ── Left Side: Visual Brand Display ── */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 relative flex-col justify-between p-12 bg-primary">
          {/* Background Gradient & Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/100 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-6">
              <img src="/logo.svg" alt="PimSuea" className="w-[137px] h-auto brightness-0 invert" />
              <div className="flex items-center gap-3">
                  <div className="h-[1px] w-12 bg-white" />
                  <p className="text-white font-light text-sm tracking-widest uppercase">
                      สร้างสรรค์เสื้อผ้าตามสั่ง
                  </p>
              </div>
          </div>

          <div className="relative z-10 max-w-md">
              <AnimatePresence mode="wait">
                  {step === 1 && (
                      <motion.div key="text1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                          <h2 className="text-3xl font-light mb-4 text-white">มาสร้างตัวตนของคุณกันเถอะ</h2>
                          <p className="text-white/80 text-lg font-light leading-relaxed">บอกเราเกี่ยวกับตัวคุณเพื่อปรับประสบการณ์การออกแบบให้เหมาะกับคุณโดยเฉพาะ</p>
                      </motion.div>
                  )}
                  {step === 2 && (
                      <motion.div key="text2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                          <h2 className="text-3xl font-light mb-4 text-white">วิสัยทัศน์ของคุณคืออะไร?</h2>
                          <p className="text-white/80 text-lg font-light leading-relaxed">ไม่ว่าจะสร้างแบรนด์หรือออกแบบชิ้นงานพิเศษสำหรับตัวเอง เครื่องมือของเราพร้อมรองรับทุกความต้องการ</p>
                      </motion.div>
                  )}
                  {step === 3 && (
                      <motion.div key="text3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                          <h2 className="text-3xl font-light mb-4 text-white">มาร่วมเป็นส่วนหนึ่งของเรา</h2>
                          <p className="text-white/80 text-lg font-light leading-relaxed">คุณรู้จัก PimSuea ได้อย่างไร? ความคิดเห็นของคุณช่วยให้เราพัฒนาแพลตฟอร์มได้ดียิ่งขึ้น</p>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>
      </div>

      {/* ── Right Side: Interactive Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-background min-h-screen md:min-h-0">
          
          <div className="w-full max-w-md relative z-10">
              
              {/* Progress Indicator */}
              <div className="flex items-center gap-3 mb-12">
                  {[1, 2, 3].map((s) => (
                      <div key={s} className="flex-1 h-1 bg-secondary rounded-full overflow-hidden relative">
                          <motion.div 
                              className="absolute top-0 left-0 h-full bg-primary"
                              initial={{ width: "0%" }}
                              animate={{ width: s <= step ? "100%" : "0%" }}
                              transition={{ duration: 0.5, ease: "circOut" }}
                          />
                      </div>
                  ))}
              </div>

              {saveError && (
                  <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive text-destructive font-light">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{saveError}</AlertDescription>
                  </Alert>
              )}

              <div className="relative min-h-[400px]">
                  <AnimatePresence custom={direction} mode="wait">
                      
                      {/* ── Step 1: Personal Info ── */}
                      {step === 1 && (
                          <motion.div
                              key="step1"
                              custom={direction}
                              variants={slideVariants}
                              initial="enter"
                              animate="center"
                              exit="exit"
                              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                              className="absolute inset-0 w-full"
                          >
                              <div className="space-y-6">
                                  <div className="space-y-2">
                                      <h3 className="text-xl font-bold text-foreground">ข้อมูลส่วนตัว</h3>
                                      <p className="text-sm font-light text-muted-foreground">กรุณากรอกข้อมูลพื้นฐานของคุณ</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                          <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">ชื่อ</Label>
                                          <Input
                                              className="bg-secondary border-border focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-0 text-foreground font-light placeholder-muted-foreground h-12 transition-all duration-300"
                                              placeholder="ชื่อ"
                                              value={firstName}
                                              onChange={(e) => setFirstName(e.target.value)}
                                          />
                                      </div>
                                      <div className="space-y-2">
                                          <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">นามสกุล</Label>
                                          <Input
                                              className="bg-secondary border-border focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-0 text-foreground font-light placeholder-muted-foreground h-12 transition-all duration-300"
                                              placeholder="นามสกุล"
                                              value={lastName}
                                              onChange={(e) => setLastName(e.target.value)}
                                          />
                                      </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                      <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">อายุ</Label>
                                      <Input
                                          type="number"
                                          className="bg-secondary border-border focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-0 text-foreground font-light placeholder-muted-foreground h-12 transition-all duration-300 w-full"
                                          placeholder="กรอกอายุของคุณ"
                                          min={1}
                                          max={120}
                                          value={age}
                                          onChange={(e) => setAge(e.target.value)}
                                      />
                                  </div>

                                  <div className="pt-6">
                                      <Button
                                          className="w-full h-14 bg-action text-white hover:bg-action/90 disabled:bg-secondary disabled:text-muted-foreground rounded-none transition-all duration-300 font-bold tracking-wide uppercase group relative overflow-hidden"
                                          disabled={!canContinueStep1}
                                          onClick={nextStep}
                                      >
                                          <span className="relative z-10 flex items-center justify-center gap-2">
                                              ถัดไป <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                          </span>
                                      </Button>
                                  </div>
                              </div>
                          </motion.div>
                      )}

                      {/* ── Step 2: Design Purpose ── */}
                      {step === 2 && (
                          <motion.div
                              key="step2"
                              custom={direction}
                              variants={slideVariants}
                              initial="enter"
                              animate="center"
                              exit="exit"
                              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                              className="absolute inset-0 w-full"
                          >
                              <div className="space-y-6">
                                  <div className="space-y-2">
                                      <h3 className="text-xl font-bold text-foreground">วัตถุประสงค์หลัก</h3>
                                      <p className="text-sm font-light text-muted-foreground">เลือกหมวดหมู่ที่ตรงกับเป้าหมายของคุณมากที่สุด</p>
                                  </div>

                                  <div className="grid gap-3">
                                      {DESIGN_PURPOSES.map((opt) => (
                                          <button
                                              key={opt.value}
                                              onClick={() => setDesignPurpose(opt.value)}
                                              className={`relative group flex items-center gap-4 p-4 border text-left bg-background transition-all duration-300 overflow-hidden ${
                                                  designPurpose === opt.value
                                                      ? 'border-primary bg-primary/5 shadow-sm'
                                                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                              }`}
                                          >
                                              {/* Selection Indicator bar */}
                                              <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${designPurpose === opt.value ? 'bg-primary skew-x-12 -ml-1' : 'bg-transparent'}`} />
                                              
                                              <div className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300 drop-shadow-sm">{opt.icon}</div>
                                              <div>
                                                  <div className={`font-bold tracking-wide ${designPurpose === opt.value ? 'text-primary' : 'text-foreground'} transition-colors`}>{opt.label}</div>
                                                  <div className="text-xs font-light text-muted-foreground mt-0.5">{opt.desc}</div>
                                              </div>
                                          </button>
                                      ))}
                                  </div>

                                  <div className="flex gap-3 pt-6">
                                      <Button 
                                          variant="outline" 
                                          className="flex-1 h-14 bg-transparent border-border font-bold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-none uppercase tracking-wide group"
                                          onClick={prevStep}
                                      >
                                          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> ย้อนกลับ
                                      </Button>
                                      <Button
                                          className="flex-1 h-14 bg-action text-white hover:bg-action/90 font-bold disabled:bg-secondary disabled:text-muted-foreground rounded-none transition-all duration-300 tracking-wide uppercase group relative overflow-hidden"
                                          disabled={!canContinueStep2}
                                          onClick={nextStep}
                                      >
                                          <span className="relative z-10 flex items-center justify-center gap-2">
                                              ถัดไป <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                          </span>
                                      </Button>
                                  </div>
                              </div>
                          </motion.div>
                      )}

                      {/* ── Step 3: Referral Source ── */}
                      {step === 3 && (
                          <motion.div
                              key="step3"
                              custom={direction}
                              variants={slideVariants}
                              initial="enter"
                              animate="center"
                              exit="exit"
                              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                              className="absolute inset-0 w-full"
                          >
                              <div className="space-y-6">
                                  <div className="space-y-2">
                                      <h3 className="text-xl font-bold text-foreground">ช่องทางการค้นพบ</h3>
                                      <p className="text-sm font-light text-muted-foreground">คุณรู้จัก PimSuea ได้อย่างไร?</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                      {REFERRAL_SOURCES.map((opt) => (
                                          <button
                                              key={opt.value}
                                              onClick={() => setReferralSource(opt.value)}
                                              className={`flex flex-col items-center justify-center gap-3 p-5 border bg-background transition-all duration-300 group ${
                                                  referralSource === opt.value
                                                      ? 'border-primary bg-primary/5 text-primary shadow-sm scale-[1.02]'
                                                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-secondary/50'
                                              }`}
                                          >
                                              <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-300 drop-shadow-sm">{opt.icon}</span>
                                              <span className="text-sm font-bold tracking-wide text-center leading-tight">{opt.label}</span>
                                          </button>
                                      ))}
                                  </div>

                                  <div className="flex gap-3 pt-6">
                                      <Button 
                                          variant="outline" 
                                          className="flex-1 h-14 bg-transparent border-border font-bold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-none uppercase tracking-wide group"
                                          onClick={prevStep}
                                      >
                                          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> ย้อนกลับ
                                      </Button>
                                      <Button
                                          className="flex-1 h-14 bg-action text-white hover:bg-action/90 font-bold disabled:bg-secondary disabled:text-muted-foreground rounded-none transition-all duration-300 tracking-widest uppercase shadow-sm hover:shadow-md"
                                          disabled={!canContinueStep3 || saving}
                                          onClick={handleFinish}
                                      >
                                          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'เข้าสู่แพลตฟอร์ม'}
                                      </Button>
                                  </div>
                              </div>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
          </div>
          
      </div>

    </div>
  );
}

