import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { joinWaitlist } from '@/services/api';
import { CheckCircle2, ChevronDown, ChevronUp, Palette, Zap } from 'lucide-react';

// ---------------------------------------------------------------------------
// Content (Thai / English)
// ---------------------------------------------------------------------------
const LAUNCH_DATE = new Date('2026-03-27T12:00:00+07:00');

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
        price: '115 THB',
      },
      pricing: {
        title: 'รู้ราคาทันที',
        desc: 'ไม่ต้องรอแอดมินตอบ LINE รู้ราคาเสื้อผ่านเว็บของเราในระหว่างออกแบบทันที',
        footer: 'อัพเดตตลอดเวลา',
      },
      delivery: {
        title: 'ผลิตไว ส่งไว ไม่ต้องกังวล',
        desc: 'ผลิตและขนส่งได้ทั่วไทย 77 จังหวัด ภายใน 7–14 วัน พร้อมกับ track ทุกขั้นตอนจนถึงบ้าน',
      },
    },
    waitlist: {
      badge: 'Early Access',
      title: 'เข้าร่วม waitlist',
      titleSub: 'เป็นผู้ใช้กลุ่มแรก พร้อม',
      highlight: 'ราคาพิเศษ',
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
        { q: 'ใช้เทคนิคการพิมพ์อะไร?',                    a: 'DTG (Direct-to-Garment) และ DTF (Direct-to-Film) ให้สีสันคมชัดและทนทาน' },
        { q: 'ระยะเวลาในการผลิตและจัดส่งนานแค่ไหน?',      a: 'ผลิต 3–5 วันทำการ จัดส่งอีก 1–3 วัน ขึ้นอยู่กับพื้นที่' },
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
        price: '115 THB',
      },
      pricing: {
        title: 'Instant Pricing',
        desc: "No waiting for LINE replies. Get shirt pricing on our website while you're designing.",
        footer: 'Always up to date',
      },
      delivery: {
        title: 'Fast Production. Fast Delivery.',
        desc: 'We ship nationwide across all 77 provinces within 7–14 days, with full tracking until it reaches your door.',
      },
    },
    waitlist: {
      badge: 'Early Access',
      title: 'Join the waitlist',
      titleSub: 'Be the first to get',
      highlight: 'exclusive pricing',
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
        { q: 'What printing techniques do you use?',  a: 'DTG (Direct-to-Garment) and DTF (Direct-to-Film) — sharp colors, durable prints.' },
        { q: 'How long does production take?',        a: '3–5 business days production, then 1–3 days delivery depending on your location.' },
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
      <span className="font-heavy text-5xl md:text-7xl text-action tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs font-bold uppercase tracking-widest text-white/60">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------
export default function Landing() {
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const t = content[lang];
  const countdown = useCountdown(LAUNCH_DATE);

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
            <button onClick={() => waitlistRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              <Button size="sm" className="bg-action text-action-foreground hover:bg-action/90 rounded-md">
                {t.nav.cta}
              </Button>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 pt-36 pb-20 overflow-hidden">
        <span className="animate-appear inline-block mb-5 text-xs font-bold tracking-widest uppercase text-primary bg-primary/10 px-4 py-1.5 rounded-full">
          {t.hero.badge}
        </span>
        <h1 className="animate-appear opacity-0 delay-100 font-heavy text-5xl md:text-7xl leading-tight tracking-tight mb-4 text-foreground">
          {t.hero.title}
        </h1>
        <p className="animate-appear opacity-0 delay-300 font-heavy text-2xl md:text-4xl text-primary mb-6 leading-snug">
          {t.hero.subtitle}
        </p>
        <p className="animate-appear opacity-0 delay-300 max-w-lg text-muted-foreground text-base leading-relaxed mb-10 font-light">
          {t.hero.desc}
        </p>
        <button
          onClick={() => waitlistRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="animate-appear opacity-0 delay-700 bg-action text-action-foreground hover:bg-action/90 transition-colors px-6 py-3 rounded-md font-bold text-sm"
        >
          {t.hero.cta}
        </button>
      </section>

      {/* ── Countdown ──────────────────────────────────────────────── */}
      <section className="bg-foreground py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">
            {t.countdown.label}
          </p>
          <h2 className="font-bold text-2xl md:text-3xl text-white mb-12">
            {t.countdown.title}
          </h2>
          <div className="flex items-start justify-center gap-8 md:gap-16">
            <CountBlock value={countdown.days}    label={t.countdown.days} />
            <span className="font-heavy text-5xl md:text-7xl text-action/40 leading-none select-none">:</span>
            <CountBlock value={countdown.hours}   label={t.countdown.hours} />
            <span className="font-heavy text-5xl md:text-7xl text-action/40 leading-none select-none">:</span>
            <CountBlock value={countdown.minutes} label={t.countdown.minutes} />
            <span className="font-heavy text-5xl md:text-7xl text-action/40 leading-none select-none">:</span>
            <CountBlock value={countdown.seconds} label={t.countdown.seconds} />
          </div>
        </div>
      </section>

      {/* ── Features bento grid ────────────────────────────────────── */}
      <section className="bg-secondary py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4">

          {/* Card 1 — Design Canvas (col-span-2, white) */}
          <div className="col-span-2 bg-card border border-border rounded-2xl p-8 flex flex-col gap-4 relative overflow-hidden min-h-[280px]">
            {/* Decorative icon — top right */}
            <Palette className="absolute top-6 right-6 w-16 h-16 text-muted-foreground/15 rotate-6" />
            <p className="text-sm font-bold text-primary">{f.canvas.label}</p>
            <h3 className="font-heavy text-4xl md:text-5xl text-foreground leading-tight">{f.canvas.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-light max-w-sm">{f.canvas.desc}</p>
          </div>

          {/* Card 2 — No Minimum (col-span-1, brand green) */}
          <div className="col-span-1 bg-primary rounded-2xl p-8 flex flex-col gap-3 min-h-[280px]">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <h3 className="font-heavy text-4xl text-white leading-tight mt-1">{f.noMin.title}</h3>
            <p className="text-white/70 text-sm leading-relaxed font-light whitespace-pre-line">{f.noMin.desc}</p>
            <div className="mt-auto pt-4">
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">{f.noMin.priceLabel}</p>
              <p className="font-heavy text-3xl text-white">{f.noMin.price}</p>
            </div>
          </div>

          {/* Card 3 — Instant Pricing (col-span-1, gray) */}
          <div className="col-span-1 bg-secondary border border-border rounded-2xl p-8 flex flex-col gap-3 min-h-[260px]">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="font-heavy text-4xl text-foreground leading-tight mt-1">{f.pricing.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-light">{f.pricing.desc}</p>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">{f.pricing.footer}</span>
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
          </div>

          {/* Card 4 — Fast Delivery (col-span-2, white) */}
          <div className="col-span-2 bg-card border border-border rounded-2xl p-8 flex flex-col gap-4 min-h-[260px]">
            <h3 className="font-heavy text-4xl md:text-5xl text-foreground leading-tight">{f.delivery.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-light max-w-md">{f.delivery.desc}</p>
          </div>

        </div>
      </section>

      {/* ── Waitlist ───────────────────────────────────────────────── */}
      <section ref={waitlistRef} className="py-24 px-6 bg-background">
        <div className="max-w-lg mx-auto text-center">
          <span className="inline-block mb-5 text-xs font-bold tracking-widest uppercase text-action bg-action/10 px-4 py-1.5 rounded-full">
            {t.waitlist.badge}
          </span>
          <h2 className="font-heavy text-4xl md:text-5xl text-foreground mb-2 leading-tight">
            {t.waitlist.title}
          </h2>
          <p className="font-bold text-lg text-muted-foreground mb-8">
            {t.waitlist.titleSub}{' '}
            <span
              className="text-foreground"
              style={{ textDecoration: 'underline', textDecorationColor: '#F05A25', textDecorationThickness: '3px', textUnderlineOffset: '4px' }}
            >
              {t.waitlist.highlight}
            </span>
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
                className="bg-action text-action-foreground hover:bg-action/90 rounded-md font-bold mt-1"
              >
                {status === 'loading' ? '...' : t.waitlist.cta}
              </Button>
            </form>
          )}
          {status === 'error' && (
            <p className="mt-3 text-sm text-destructive">{errorMsg}</p>
          )}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section className="bg-secondary py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-bold text-3xl md:text-4xl text-center mb-12 text-foreground">
            {t.faq.title}
          </h2>
          <div className="bg-card rounded-lg border border-border px-6">
            {t.faq.items.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
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
  );
}
