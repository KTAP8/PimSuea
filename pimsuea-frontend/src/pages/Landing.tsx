import { useState, useEffect, useRef } from 'react';
import { PageSEO } from '@/components/PageSEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { joinWaitlist } from '@/services/api';
import { CheckCircle2, ChevronDown, ChevronUp, Palette, Zap, MousePointer2, Type, Image as ImageIcon, Layers } from 'lucide-react';
import { ReactLenis } from 'lenis/react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { LAUNCH_DATE } from '@/App';
// ---------------------------------------------------------------------------
// Content (Thai / English)
// ---------------------------------------------------------------------------

const content = {
  th: {
    nav: { cta: 'ลงชื่อ Waitlist' },
    hero: {
      badge: 'เปิดตัวเร็วๆ นี้',
      title: 'บริการ Print On Demand',
      subtitle: 'เพื่อคุณ โดยคุณ เราจัดการให้',
      desc: 'ออกแบบเสื้อยืดในเบราว์เซอร์ ไม่ต้องติดตั้งโปรแกรม สั่งพิมพ์ได้ตั้งแต่ 1 ตัว รับของถึงบ้าน',
      cta: 'แจ้งเตือนฉัน เมื่อ PimSuea เปิดตัว →',
    },
    countdown: {
      label: 'อีกไม่นานเท่านั้น',
      title: 'นับถอยหลัง สู่วันเปิดตัว',
      days: 'วัน',
      hours: 'ชั่วโมง',
      minutes: 'นาที',
      seconds: 'วินาที',
    },
    features: {
      canvas: {
        label: 'ออกแบบได้เต็มที่ในที่เดียว',
        title: 'Design Canvas',
        desc: 'สร้างสรรค์ลายเสื้อระดับมืออาชีพได้ในที่เดียว และไม่ต้องรอแอดมินตอบแชท! แค่ลาก วางบนหน้าเว็บ จัดการทุกอย่างด้วยตัวเอง ออกแบบ เห็นภาพจริง และสั่งผลิตจบในที่เดียว ประหยัดเวลาแบบสุดๆ',
      },
      noMin: {
        title: 'ไม่มีขั้นต่ำ',
        desc: 'สั่ง 1 ตัว สั่ง 100 ตัว\nก็ได้ราคาที่แฟร์\nไม่ต้องกังวลเรื่องขั้นต่ำ',
        priceLabel: 'เริ่มต้นเพียง',
        price: '132 THB',
      },
      pricing: {
        title: 'รู้ราคาทันที',
        desc: 'ไม่ต้องรอแอดมินตอบ LINE รู้ราคาเสื้อผ่านเว็บของเราในระหว่างออกแบบทันที',
        footer: 'อัพเดตตลอดเวลา',
      },
      delivery: {
        title: 'ผลิตไว ส่งไว ไม่ต้องกังวล',
        desc: 'ผลิตและขนส่งได้ทั่วไทย 77 จังหวัด ภายใน 5–14 วัน พร้อมกับ track ทุกขั้นตอนจนถึงบ้าน',
      },
    },
    waitlist: {
      badge: 'Early Access',
      title: 'เข้าร่วม waitlist',
      titleSub: 'เป็นผู้ใช้กลุ่มแรก พร้อม',
      highlight: 'ราคาพิเศษ',
      desc: 'ลงทะเบียนตอนนี้เพื่อล็อคราคาลดพิเศษเฉพาะช่วงเปิดตัวเท่านั้น คุณจะได้สิทธิ์สั่งซื้อในราคาที่ดีที่สุดก่อนใคร',
      namePlaceholder: 'ชื่อจริง',
      emailPlaceholder: 'อีเมลของคุณ',
      reasonLabel: 'คุณต้องการสั่งเสื้อเพื่ออะไร',
      reasons: [
        { value: 'self',   label: 'สำหรับตัวเอง' },
        { value: 'group',  label: 'เสื้อกลุ่ม / เพื่อน' },
        { value: 'couple', label: 'เสื้อคู่ / แฟน' },
        { value: 'uni',    label: 'เสื้อรุ่น / ชั้นเรียน' },
        { value: 'other',  label: 'อื่นๆ' },
      ],
      cta: 'รับการแจ้งเตือน เมื่อพร้อมใช้งาน',
      success: 'ลงทะเบียนสำเร็จ! เราจะแจ้งให้ทราบทันทีเมื่อพร้อม 🎉',
      error: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
    },
    faq: {
      title: 'คำถามที่พบบ่อย',
      items: [
        { q: 'PimSuea คืออะไร?',                           a: 'แพลตฟอร์มออกแบบและพิมพ์เสื้อยืด Custom แบบครบวงจร คุณออกแบบเองบนเบราว์เซอร์และสั่งพิมพ์ได้ทันที' },
        { q: 'มีจำนวนขั้นต่ำในการสั่งซื้อไหม?',            a: 'ไม่มี! สั่งได้ตั้งแต่ 1 ตัว ยิ่งสั่งมากราคายิ่งถูกลง' },
        { q: 'ใช้เทคนิคการพิมพ์อะไร?',                    a: 'DTG (Direct-to-Garment) ให้สีสันคมชัดและทนทาน' },
        { q: 'ระยะเวลาในการผลิตและจัดส่งนานแค่ไหน?',      a: 'รวม 5-14 วัน ขึ้นอยู่กับพื้นที่' },
        { q: 'ออกแบบบนมือถือได้ไหม?',                    a: 'ได้ แต่แนะนำให้ใช้บน Desktop เพื่อประสบการณ์ที่ดีที่สุด' },
      ],
    },
    footer: {
      tagline: 'ออกแบบ พิมพ์ เป็นตัวคุณเอง',
      copy: `© ${new Date().getFullYear()} PimSuea. สงวนลิขสิทธิ์`,
    },
  },
  en: {
    nav: { cta: 'Join Waitlist' },
    hero: {
      badge: 'Coming Soon',
      title: 'Print On Demand',
      subtitle: 'For You, By You — We Handle the Rest',
      desc: 'Design custom t-shirts in your browser, no software needed. Order from just 1 piece and get it delivered to your door.',
      cta: 'Notify me when PimSuea launches →',
    },
    countdown: {
      label: 'Not long now',
      title: 'Countdown to Launch',
      days: 'Days',
      hours: 'Hours',
      minutes: 'Mins',
      seconds: 'Secs',
    },
    features: {
      canvas: {
        label: 'Full design freedom in one place',
        title: 'Design Canvas',
        desc: 'Create professional shirt designs without waiting for an admin. Just drag, drop, and manage everything yourself — design, preview, and order all in one place.',
      },
      noMin: {
        title: 'No Minimum',
        desc: 'Order 1 or order 100\nyou get a fair price\neither way',
        priceLabel: 'Starting at',
        price: '132 THB',
      },
      pricing: {
        title: 'Instant Pricing',
        desc: "No waiting for LINE replies. Get shirt pricing on our website while you're designing.",
        footer: 'Always up to date',
      },
      delivery: {
        title: 'Fast Production. Fast Delivery.',
        desc: 'We ship nationwide across all 77 provinces within 5–14 days, with full tracking until it reaches your door.',
      },
    },
    waitlist: {
      badge: 'Early Access',
      title: 'Join the waitlist',
      titleSub: 'Be the first to get',
      highlight: 'exclusive pricing',
      desc: 'Lock in our lowest prices by joining the waitlist before we officially launch. You will be guaranteed the best deal available.',
      namePlaceholder: 'Your name',
      emailPlaceholder: 'Your email',
      reasonLabel: 'What are you ordering shirts for?',
      reasons: [
        { value: 'self',   label: 'For myself' },
        { value: 'group',  label: 'Group / friends' },
        { value: 'couple', label: 'Couple shirts' },
        { value: 'uni',    label: 'Uni / class shirts' },
        { value: 'other',  label: 'Other' },
      ],
      cta: 'Get notified when ready',
      success: "You're on the list! We'll notify you the moment we launch 🎉",
      error: 'Something went wrong. Please try again.',
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        { q: 'What is PimSuea?',                       a: 'An all-in-one custom t-shirt design and print platform. Design in your browser and order in minutes.' },
        { q: 'Is there a minimum order quantity?',     a: 'No minimum! Order from just 1 piece. The more you order, the better the price.' },
        { q: 'What printing techniques do you use?',  a: 'DTG (Direct-to-Garment) — sharp colors, durable prints.' },
        { q: 'How long does production take?',        a: '5-14 days depending on your location.' },
        { q: 'Can I design on mobile?',               a: 'Yes! We recommend desktop for the best design experience.' },
      ],
    },
    footer: {
      tagline: 'Design. Print. Be Yourself.',
      copy: `© ${new Date().getFullYear()} PimSuea. All rights reserved.`,
    },
  },
};

// ---------------------------------------------------------------------------
// Countdown hook
// ---------------------------------------------------------------------------
function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000)  / 60000),
      seconds: Math.floor((diff % 60000)    / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

// ---------------------------------------------------------------------------
// Scroll reveal hook & wrapper
// ---------------------------------------------------------------------------
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function RevealWrapper({ children, delay = '', className = '' }: { children: React.ReactNode, delay?: string, className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  
  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${delay} ${className}`}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAQ accordion item
// ---------------------------------------------------------------------------
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-4 text-left gap-4 hover:text-primary transition-colors"
      >
        <span className="font-bold text-foreground">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0 text-primary" />
          : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
        }
      </button>
      {open && <p className="pb-4 text-muted-foreground text-sm leading-relaxed font-light">{a}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Countdown digit block
// ---------------------------------------------------------------------------
function CountBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-heavy text-3xl sm:text-5xl md:text-7xl text-white tabular-nums leading-none drop-shadow-md">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/60">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero Graphic component
// ---------------------------------------------------------------------------
function HeroGraphic() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 800], [0, -100]);
  const badge1Y = useTransform(scrollY, [0, 800], [0, -150]);
  const badge2Y = useTransform(scrollY, [0, 800], [0, -50]);

  return (
    <motion.div style={{ y: heroY }} className="relative w-full max-w-lg aspect-square mx-auto mt-12 lg:mt-0">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full -z-10" />
      
      {/* App Window mockup */}
      <div className="absolute inset-0 bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col animate-appear delay-500 opacity-0 relative z-10 transform transition-transform hover:scale-[1.02] duration-500">
        
        {/* Window Header */}
        <div className="h-12 border-b border-border flex items-center px-4 bg-secondary/50">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
        </div>

        {/* Window Body */}
        <div className="flex-1 flex bg-background relative overflow-hidden">
          {/* Tools Sidebar */}
          <div className="w-14 border-r border-border bg-secondary/20 flex flex-col items-center py-4 gap-4 z-10">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-sm border border-primary/20">
              <MousePointer2 className="w-5 h-5" />
            </div>
            <div className="w-9 h-9 rounded-lg text-muted-foreground hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer">
              <Type className="w-5 h-5" />
            </div>
            <div className="w-9 h-9 rounded-lg text-muted-foreground hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="w-9 h-9 rounded-lg text-muted-foreground hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative flex items-center justify-center">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
            
            {/* T-Shirt Outline */}
            <div className="relative text-border">
              <svg width="240" height="280" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
              </svg>

              {/* Design Element floating on shirt */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-primary border-dashed bg-primary/5 flex items-center justify-center shadow-lg transform rotate-[-8deg] hover:rotate-0 transition-all duration-500 cursor-pointer">
                <span className="font-heavy text-2xl text-primary tracking-wider uppercase">PimSuea</span>
                
                {/* Transform handles */}
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-background border border-primary" />
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-background border border-primary" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-background border border-primary" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-background border border-primary" />
                
                {/* Rotate handle */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-primary" />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-3 h-3 bg-background border border-primary rounded-full cursor-grab" />
              </div>
            </div>

            {/* Floating Mouse Cursor animating */}
            <div className="absolute top-[40%] left-[60%] animate-pulse z-20" style={{ animationDuration: '3s' }}>
              <MousePointer2 className="w-8 h-8 fill-foreground text-foreground drop-shadow-lg transform -rotate-12" />
            </div>
          </div>
          
          {/* Properties Panel */}
          <div className="w-40 border-l border-border bg-secondary/10 hidden sm:flex flex-col py-4 px-4 gap-5">
            <div>
              <div className="h-2 w-16 bg-muted-foreground/30 rounded-full mb-3" />
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square bg-foreground rounded-md border border-border cursor-pointer hover:scale-105 transition-transform" />
                <div className="aspect-square bg-white rounded-md border border-border cursor-pointer hover:scale-105 transition-transform" />
                <div className="aspect-square bg-primary rounded-md border border-border cursor-pointer hover:scale-105 transition-transform" />
                <div className="aspect-square bg-muted rounded-md border border-border cursor-pointer hover:scale-105 transition-transform" />
              </div>
            </div>
            
            <div>
              <div className="h-2 w-20 bg-muted-foreground/30 rounded-full mb-3" />
              <div className="space-y-2">
                <div className="h-8 w-full bg-secondary rounded-md" />
                <div className="h-8 w-full bg-secondary rounded-md" />
              </div>
            </div>
            
            <div className="mt-auto">
               <div className="h-10 w-full bg-action/20 text-action rounded-md flex items-center justify-center font-bold text-sm uppercase tracking-wider cursor-pointer hover:bg-action/30 transition-colors">
                 Order Now
               </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Decorative floating badges */}
      <motion.div style={{ y: badge1Y }} className="absolute -right-6 top-1/4 bg-card border border-border shadow-xl rounded-lg px-4 py-2 flex items-center gap-2 animate-appear delay-700 opacity-0 z-20 hidden md:flex">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-bold">115 THB</span>
      </motion.div>
      
      <motion.div style={{ y: badge2Y }} className="absolute -left-6 bottom-1/4 bg-card border border-border shadow-xl rounded-lg px-4 py-2 flex items-center gap-2 animate-appear delay-1000 opacity-0 z-20 hidden md:flex">
        <Zap className="w-4 h-4 text-action" />
        <span className="text-sm font-bold">Instant Preview</span>
      </motion.div>

    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------
export default function Landing() {
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const t = content[lang];
  const countdown = useCountdown(LAUNCH_DATE);
  
  const { scrollY } = useScroll();
  const countdownMarqueeY = useTransform(scrollY, [0, 3000], [0, 400]);
  const bentoFloat1Y = useTransform(scrollY, [0, 3000], [0, -150]);
  const bentoFloat2Y = useTransform(scrollY, [0, 3000], [0, -80]);

  const [name,   setName]   = useState('');
  const [email,  setEmail]  = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const waitlistRef = useRef<HTMLElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !reason) return;
    setStatus('loading');
    try {
      await joinWaitlist({ name: name.trim(), email: email.trim(), reason });
      setStatus('success');
      setName(''); setEmail(''); setReason('');
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.response?.status === 200) {
        setStatus('success');
      } else {
        setErrorMsg(err?.response?.data?.error || t.waitlist.error);
        setStatus('error');
      }
    }
  };

  const f = t.features;

  return (
    <ReactLenis root>
      <PageSEO
        title="PimSuea | เร็วๆ นี้ | Coming Soon"
        description="PimSuea กำลังจะเปิดตัว — แพลตฟอร์มสั่งพิมพ์เสื้อยืดออนไลน์คุณภาพสูง | Coming soon — Thailand's premium custom t-shirt printing platform."
        canonical="https://pimsuea.com"
      />
      <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <img src="/logo.svg" alt="PimSuea" className="h-7 w-auto" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
              className="text-xs font-bold px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {lang === 'th' ? 'EN' : 'TH'}
            </button>
            <Button
              size="sm"
              className="bg-action text-action-foreground hover:bg-action/90 rounded-md"
              onClick={() => waitlistRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t.nav.cta}
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative flex flex-col justify-center px-6 pt-32 pb-20 overflow-hidden min-h-[90vh]">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="text-center lg:text-left z-10 flex flex-col items-center lg:items-start transition-all duration-1000 ease-out translate-y-0 opacity-100">
            <span className="animate-appear inline-block mb-5 text-xs font-bold tracking-widest uppercase text-primary bg-primary/10 px-4 py-1.5 rounded-full">
              {t.hero.badge}
            </span>
            <h1 className="animate-appear opacity-0 delay-100 font-heavy text-5xl md:text-7xl leading-tight tracking-tight mb-4 text-foreground">
              {t.hero.title}
            </h1>
            <p className="animate-appear opacity-0 delay-300 font-heavy text-2xl md:text-4xl text-primary mb-6 leading-snug">
              {t.hero.subtitle}
            </p>
            <p className="animate-appear opacity-0 delay-300 max-w-lg text-muted-foreground text-base leading-relaxed mb-10 font-light mx-auto lg:mx-0">
              {t.hero.desc}
            </p>
            <button
              onClick={() => waitlistRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="animate-appear opacity-0 delay-700 bg-action text-action-foreground hover:bg-action/90 transition-all px-8 py-4 rounded-md font-bold text-base shadow-lg shadow-action/20 hover:shadow-xl hover:shadow-action/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              {t.hero.cta}
            </button>
          </div>
          <div className="w-full relative z-0 flex justify-center">
            <HeroGraphic />
          </div>
        </div>
      </section>

      {/* ── Countdown ──────────────────────────────────────────────── */}
      <section className="bg-primary py-24 px-6 relative overflow-hidden group/section">
        {/* Animated Background Text Marquee */}
        <motion.div style={{ y: countdownMarqueeY }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] flex flex-col gap-4 opacity-5 pointer-events-none select-none -rotate-2">
          <div className="flex gap-4 animate-[marquee_20s_linear_infinite]">
            <span className="font-heavy text-7xl md:text-9xl whitespace-nowrap">PIMSUEA PIMSUEA PIMSUEA PIMSUEA PIMSUEA PIMSUEA PIMSUEA</span>
          </div>
          <div className="flex gap-4 animate-[marquee_25s_linear_infinite_reverse]">
            <span className="font-heavy text-7xl md:text-9xl whitespace-nowrap">PRINT ON DEMAND PRINT ON DEMAND PRINT ON DEMAND PRINT ON</span>
          </div>
        </motion.div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <RevealWrapper>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">
              {t.countdown.label}
            </p>
            <h2 className="font-heavy text-3xl md:text-5xl text-white mb-14 drop-shadow-md">
              {t.countdown.title}
            </h2>
            <div className="flex items-start justify-center gap-2 sm:gap-6 md:gap-14 bg-background/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-6 md:p-10 shadow-2xl">
              <CountBlock value={countdown.days}    label={t.countdown.days} />
              <span className="font-heavy text-2xl sm:text-4xl md:text-6xl text-white/30 leading-none select-none mt-0.5 sm:mt-1 md:mt-2">:</span>
              <CountBlock value={countdown.hours}   label={t.countdown.hours} />
              <span className="font-heavy text-2xl sm:text-4xl md:text-6xl text-white/30 leading-none select-none mt-0.5 sm:mt-1 md:mt-2">:</span>
              <CountBlock value={countdown.minutes} label={t.countdown.minutes} />
              <span className="font-heavy text-2xl sm:text-4xl md:text-6xl text-white/30 leading-none select-none mt-0.5 sm:mt-1 md:mt-2">:</span>
              <CountBlock value={countdown.seconds} label={t.countdown.seconds} />
            </div>
          </RevealWrapper>
        </div>
      </section>

      {/* ── Features bento grid ────────────────────────────────────── */}
      <section className="bg-secondary py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">

          {/* Card 1 — Design Canvas (col-span-2, white) */}
          <RevealWrapper delay="delay-100" className="md:col-span-2">
            <div className="h-full bg-card border border-border rounded-2xl p-8 flex flex-col gap-4 relative overflow-hidden min-h-[200px] md:min-h-[300px] group">
              <p className="text-sm font-bold text-primary relative z-10">{f.canvas.label}</p>
              <h3 className="font-heavy text-4xl md:text-5xl text-foreground leading-tight relative z-10">{f.canvas.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-light max-w-sm relative z-10">{f.canvas.desc}</p>
              
              {/* Visual: Floating UI panels */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none hidden sm:block opacity-60 md:opacity-100 transition-transform duration-700 group-hover:scale-105">
                <motion.div style={{ y: bentoFloat1Y }} className="absolute right-10 top-1/2 -translate-y-1/2 w-48 h-48 bg-secondary border border-border rounded-xl rotate-12 shadow-sm" />
                <motion.div style={{ y: bentoFloat2Y }} className="absolute right-16 top-1/2 -translate-y-1/2 w-48 h-32 bg-background border border-border rounded-xl -rotate-6 shadow-xl overflow-hidden flex flex-col">
                  <div className="h-6 border-b border-border bg-secondary/30 flex items-center px-2 gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-border" />
                    <div className="w-2 h-2 rounded-full bg-border" />
                  </div>
                  <div className="flex-1 p-3 grid grid-cols-3 gap-2">
                    <div className="bg-primary/10 rounded border border-primary/20 aspect-square" />
                    <div className="bg-secondary rounded border border-border aspect-square" />
                    <div className="bg-secondary rounded border border-border aspect-square" />
                  </div>
                </motion.div>
                <motion.div style={{ y: bentoFloat1Y }} className="absolute bottom-16 right-24 w-12 h-12 bg-action rounded-full shadow-lg flex items-center justify-center text-white scale-110 -rotate-12 animate-bounce">
                  <Palette className="w-5 h-5" />
                </motion.div>
              </div>
            </div>
          </RevealWrapper>

          {/* Card 2 — No Minimum (col-span-1, brand green) */}
          <RevealWrapper delay="delay-200" className="md:col-span-1">
            <div className="h-full bg-primary rounded-2xl p-8 flex flex-col gap-3 min-h-[200px] md:min-h-[300px] relative overflow-hidden group">
              {/* Visual Background: Glowing Orbs */}
              <motion.div style={{ y: countdownMarqueeY }} className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150" />
              <motion.div style={{ y: bentoFloat1Y }} className="absolute -left-10 -bottom-10 w-48 h-48 bg-black/20 rounded-full blur-3xl transition-transform duration-700 group-hover:block" />

              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm relative z-10 shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              </div>
              <h3 className="font-heavy text-4xl text-white leading-tight mt-1 relative z-10">{f.noMin.title}</h3>
              <p className="text-white/70 text-sm leading-relaxed font-light whitespace-pre-line relative z-10">{f.noMin.desc}</p>
              <div className="mt-auto pt-4 relative z-10">
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">{f.noMin.priceLabel}</p>
                <p className="font-heavy text-3xl text-white">{f.noMin.price}</p>
              </div>
            </div>
          </RevealWrapper>

          {/* Card 3 — Instant Pricing (col-span-1, gray) */}
          <RevealWrapper delay="delay-300" className="md:col-span-1">
            <div className="h-full bg-secondary border border-border rounded-2xl p-8 flex flex-col gap-3 min-h-[160px] md:min-h-[280px] relative overflow-hidden group">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(8,99,109,0.3)]">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-heavy text-4xl text-foreground leading-tight mt-1 relative z-10">{f.pricing.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-light relative z-10">{f.pricing.desc}</p>
              
              {/* Visual: Receipt lines mockup */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-40 border border-border/50 bg-card rounded-lg shadow-sm p-4 flex flex-col gap-2 rotate-12 opacity-30 group-hover:opacity-100 group-hover:rotate-6 group-hover:-translate-x-4 transition-all duration-500 pointer-events-none">
                <div className="h-2 w-full bg-secondary rounded-full" />
                <div className="h-2 w-2/3 bg-secondary rounded-full" />
                <div className="h-px w-full bg-border my-1" />
                <div className="flex justify-between items-center">
                  <div className="h-2 w-8 bg-secondary rounded-full" />
                  <div className="h-3 w-12 bg-primary/40 rounded-full" />
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between relative z-10">
                <span className="text-xs font-bold text-muted-foreground">{f.pricing.footer}</span>
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
            </div>
          </RevealWrapper>

          {/* Card 4 — Fast Delivery (col-span-2, white) */}
          <RevealWrapper delay="delay-400" className="md:col-span-2">
            <div className="h-full bg-card border border-border rounded-2xl p-8 flex flex-col gap-4 min-h-[160px] md:min-h-[280px] relative overflow-hidden group">
              <h3 className="font-heavy text-4xl md:text-5xl text-foreground leading-tight relative z-10">{f.delivery.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-light max-w-md relative z-10">{f.delivery.desc}</p>
              
              {/* Visual: Grid Pattern Background */}
              <div className="absolute right-0 top-0 bottom-0 w-2/3 opacity-[0.03] pointer-events-none hidden sm:block transition-transform duration-1000 group-hover:scale-110" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              
              {/* Visual: Progress tracker */}
              <div className="mt-auto relative z-10 w-full max-w-sm pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-primary tracking-wide uppercase">In Production</span>
                  <span className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Delivery</span>
                </div>
                <div className="relative">
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                    <div className="h-full w-2/3 bg-action rounded-full animate-pulse" />
                  </div>
                  {/* Truck Marker */}
                  <div className="absolute left-[66%] -top-2.5 -ml-3 w-7 h-7 bg-card border-[3px] border-action rounded-full shadow-md flex items-center justify-center transition-transform group-hover:scale-110">
                    <div className="w-2.5 h-2.5 bg-action rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </RevealWrapper>

        </div>
      </section>

      {/* ── Waitlist ───────────────────────────────────────────────── */}
      <section ref={waitlistRef} className="py-24 px-6 bg-background">
        <div className="max-w-lg mx-auto text-center">
          <RevealWrapper>
            <span className="inline-block mb-5 text-xs font-bold tracking-widest uppercase text-action bg-action/10 px-4 py-1.5 rounded-full">
              {t.waitlist.badge}
            </span>
            <h2 className="font-heavy text-4xl md:text-5xl text-foreground mb-2 leading-tight">
              {t.waitlist.title}
            </h2>
            <p className="font-bold text-xl text-foreground mb-3">
              {t.waitlist.titleSub}{' '}
              <span
                style={{ textDecoration: 'underline', textDecorationColor: '#F05A25', textDecorationThickness: '3px', textUnderlineOffset: '4px' }}
              >
                {t.waitlist.highlight}
              </span>
            </p>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8 leading-relaxed font-light">
              {t.waitlist.desc}
            </p>

            {status === 'success' ? (
              <div className="flex items-center gap-2 justify-center text-primary font-bold bg-primary/10 px-5 py-4 rounded-lg">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                {t.waitlist.success}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={e => { setName(e.target.value); setStatus('idle'); }}
                  placeholder={t.waitlist.namePlaceholder}
                  className="rounded-md"
                />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
                  placeholder={t.waitlist.emailPlaceholder}
                  className="rounded-md"
                />
                <div className="relative">
                  <select
                    required
                    value={reason}
                    onChange={e => { setReason(e.target.value); setStatus('idle'); }}
                    className="w-full h-10 px-3 pr-9 rounded-md border border-input bg-background text-sm text-foreground appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 cursor-pointer"
                  >
                    <option value="" disabled>{t.waitlist.reasonLabel}</option>
                    {t.waitlist.reasons.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <Button
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-action text-action-foreground hover:bg-action/90 rounded-md font-bold mt-1 shadow-lg shadow-action/20"
                >
                  {status === 'loading' ? '...' : t.waitlist.cta}
                </Button>
              </form>
            )}
            {status === 'error' && (
              <p className="mt-3 text-sm text-destructive">{errorMsg}</p>
            )}
          </RevealWrapper>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section className="bg-secondary py-24 px-6 overflow-hidden">
        <div className="max-w-2xl mx-auto">
          <RevealWrapper delay="delay-100">
            <h2 className="font-bold text-3xl md:text-4xl text-center mb-12 text-foreground">
              {t.faq.title}
            </h2>
            <div className="bg-card rounded-lg border border-border px-6">
              {t.faq.items.map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </RevealWrapper>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-6 bg-background">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex flex-col items-center md:items-start gap-2">
            <img src="/logo.svg" alt="PimSuea" className="h-6 w-auto" />
            <span className="text-muted-foreground font-light">{t.footer.tagline}</span>
          </div>
          <span className="text-muted-foreground font-light">{t.footer.copy}</span>
        </div>
      </footer>

      </div>
    </ReactLenis>
  );
}
