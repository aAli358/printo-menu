import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  QrCode, ChefHat, BarChart3, Smartphone, Sparkles, Check,
  ArrowLeft, Menu, X,
} from 'lucide-react';
import { register, fetchMe } from '../api/auth';
import { getPlatformBranding } from '../api/platform';
import { buildSubdomainUrl } from '../utils/tenant';
import { redirectToTenantWithSession } from '../utils/authRedirect';
import { SessionSplash } from '../components/SessionSplash';
import { useAuthStore } from '../store/useAuthStore';
import { EnterpriseContactModal } from '../components/EnterpriseContactModal';
import { parseApiError } from '../utils/apiErrors';
import { PlatformFooter } from '../components/PlatformFooter';
import type { PlatformBranding } from '../types';
const FEATURES = [
  {
    icon: Smartphone,
    title: 'منيو تفاعلي فاخر',
    desc: '10 ثيمات جاهزة، تصميم mobile-first، ودعم عربي/إنجليزي.',
  },
  {
    icon: ChefHat,
    title: 'شاشة مطبخ فورية',
    desc: 'Polling كل 5 ثوانٍ، تنبيهات صوتية، وتتبع حالة الطلب.',
  },
  {
    icon: QrCode,
    title: 'مولد QR للطاولات',
    desc: 'توليد وتنزيل PNG/SVG مع لوجو مطعمك في المنتصف.',
  },
  {
    icon: BarChart3,
    title: 'لوحة إحصائيات',
    desc: 'إيرادات، أوقات الذروة، وأكثر الأصناف مبيعاً.',
  },
];

const PLANS = [
  {
    id: 'basic',
    name: 'أساسي',
    price: '0',
    period: '14 يوم تجريبي',
    highlight: false,
    features: ['منيو رقمي', 'QR للطاولات', 'حتى 50 صنف', 'دعم بريد'],
  },
  {
    id: 'pro',
    name: 'احترافي',
    price: '49,000',
    period: 'شهرياً',
    highlight: true,
    features: ['كل ميزات الأساسي', 'شاشة مطبخ', 'تقارير متقدمة', '10 ثيمات', 'دعم أولوية'],
  },
  {
    id: 'enterprise',
    name: 'مؤسسات',
    price: 'تواصل',
    period: 'سنوياً',
    highlight: false,
    features: ['مطاعم متعددة', 'API مخصص', 'SLA', 'مدير حساب', 'تخصيص كامل'],
  },
];

const DEMO_SLUG = 'shams';

interface OnboardingFormProps {
  compact?: boolean;
  onSuccess?: () => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ compact, onSuccess }) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await register({
        username,
        password,
        email,
        restaurant_name: restaurantName,
      });
      useAuthStore.getState().setSession({
        access: data.tokens.access,
        refresh: data.tokens.refresh,
        user: { id: data.user.id, username: data.user.username, email: data.user.email, is_superuser: false },
        restaurants: [],
      });
      const me = await fetchMe();
      const restaurants = me.restaurants.length ? me.restaurants : [{
        id: data.restaurant.id,
        name: data.restaurant.name,
        name_en: '',
        slug: data.restaurant.slug,
        logo: null,
        subscription_status: data.restaurant.subscription_status ?? 'trial',
      }];
      const payload = {
        access: data.tokens.access,
        refresh: data.tokens.refresh,
        user: { ...me.user, is_superuser: me.user.is_superuser },
        restaurants,
      };
      onSuccess?.();
      setRedirecting(true);
      redirectToTenantWithSession(data.restaurant.slug, '/dashboard', payload);
    } catch (err: unknown) {
      setError(parseApiError(err, 'تعذر إنشاء الحساب — تحقق من البيانات'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {redirecting && <SessionSplash message="جاري إنشاء مطعمك..." />}
      <form onSubmit={handleSubmit} className={`space-y-3 ${compact ? '' : 'max-w-md'}`}>
      <input
        required
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
        placeholder="اسم المطعم / الكافيه"
        className="w-full px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-indigo-200/60 focus:ring-2 focus:ring-white/40 outline-none backdrop-blur"
      />
      <input
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="اسم المستخدم"
        className="w-full px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-indigo-200/60 focus:ring-2 focus:ring-white/40 outline-none backdrop-blur"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="البريد الإلكتروني (اختياري)"
        className="w-full px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-indigo-200/60 focus:ring-2 focus:ring-white/40 outline-none backdrop-blur"
      />
      <input
        required
        type="password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="كلمة المرور (8+ أحرف)"
        className="w-full px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-indigo-200/60 focus:ring-2 focus:ring-white/40 outline-none backdrop-blur"
      />
      {error && <p className="text-sm text-red-300 font-medium text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-white text-indigo-700 rounded-xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        {loading ? 'جاري إنشاء مطعمك...' : 'ابدأ تجربتك المجانية — 14 يوم'}
      </button>
      <p className="text-center text-xs text-indigo-200/70">بدون بطاقة ائتمان · جاهز خلال دقيقة</p>
    </form>
    </>
  );
};

export const LandingPage: React.FC = () => {
  const [mobileNav, setMobileNav] = useState(false);
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [platformBranding, setPlatformBranding] = useState<PlatformBranding | null>(null);
  const demoUrl = buildSubdomainUrl(DEMO_SLUG, '/', '?table=1');

  useEffect(() => {
    getPlatformBranding().then(setPlatformBranding).catch(() => setPlatformBranding(null));
  }, []);
  const scrollTo = (id: string) => {
    setMobileNav(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#070714] text-white overflow-x-hidden" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#070714]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-black text-lg">
            <span className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-lg">🍽️</span>
            E-Menu Pro
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-indigo-100/80">
            <button type="button" onClick={() => scrollTo('features')} className="hover:text-white transition-colors">المميزات</button>
            <button type="button" onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">الأسعار</button>
            <a href={demoUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">منيو تجريبي</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-bold text-indigo-100 hover:text-white">تسجيل الدخول</Link>
            <button type="button" onClick={() => scrollTo('signup')} className="px-5 py-2.5 bg-indigo-600 rounded-xl text-sm font-black hover:bg-indigo-500 transition-colors">
              تجربة مجانية
            </button>
          </div>
          <button type="button" className="md:hidden p-2" onClick={() => setMobileNav(!mobileNav)} aria-label="Menu">
            {mobileNav ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-white/10 px-4 py-4 space-y-3 bg-[#0c0c1a]">
            <button type="button" onClick={() => scrollTo('features')} className="block w-full text-right py-2 font-bold">المميزات</button>
            <button type="button" onClick={() => scrollTo('pricing')} className="block w-full text-right py-2 font-bold">الأسعار</button>
            <a href={demoUrl} className="block py-2 font-bold">منيو تجريبي</a>
            <Link to="/login" className="block py-2 font-bold">تسجيل الدخول</Link>
            <button type="button" onClick={() => scrollTo('signup')} className="w-full py-3 bg-indigo-600 rounded-xl font-black">تجربة مجانية</button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 aurora-bg opacity-60" />
        <div className="orb orb-1 opacity-40" />
        <div className="orb orb-2 opacity-30" />
        <div className="max-w-6xl mx-auto relative grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-black mb-6">
              <Sparkles size={14} /> منصة SaaS للمطاعم والكافيهات
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.15] mb-6">
              منيو رقمي
              <span className="block text-transparent bg-clip-text bg-gradient-to-l from-indigo-300 via-violet-300 to-amber-200">
                يبيع أكثر ويدير أذكى
              </span>
            </h1>
            <p className="text-lg text-indigo-100/70 leading-relaxed mb-8 max-w-lg">
              أنشئ منيو احترافي، QR للطاولات، شاشة مطبخ، ولوحة تحكم — كل ذلك من منصة واحدة.
              ابدأ مجاناً لمدة 14 يوماً.
            </p>
            <div className="flex flex-wrap gap-4">
              <button type="button" onClick={() => scrollTo('signup')} className="px-8 py-4 bg-indigo-600 rounded-2xl font-black hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30">
                أنشئ مطعمك الآن
              </button>
              <a
                href={demoUrl}
                className="px-8 py-4 border border-white/20 rounded-2xl font-black hover:bg-white/5 transition-colors inline-flex items-center gap-2"
              >
                استعرض منيو تجريبي <ArrowLeft size={18} />
              </a>
            </div>
          </motion.div>

          <motion.div
            id="signup"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-indigo-600/40 to-violet-600/20 rounded-[2rem] blur-2xl" />
            <div className="relative bg-gradient-to-br from-indigo-950/90 to-violet-950/80 border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur">
              <h2 className="text-xl font-black mb-1">أنشئ مطعمك في دقيقة</h2>
              <p className="text-sm text-indigo-200/60 mb-6">14 يوم تجريبي · Subdomain خاص بك</p>
              <OnboardingForm />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 bg-[#0a0a18]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">كل ما يحتاجه مطعمك</h2>
            <p className="text-indigo-200/60 max-w-xl mx-auto">من تجربة الزبون إلى المطبخ — منصة متكاملة بكود واحد وقاعدة بيانات واحدة.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center mb-4 group-hover:bg-indigo-600/40 transition-colors">
                  <f.icon size={24} className="text-indigo-300" />
                </div>
                <h3 className="font-black text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-indigo-200/60 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">خطط الأسعار</h2>
            <p className="text-indigo-200/60">ابدأ مجاناً — ترقِّ عندما ينمو مطعمك</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 border flex flex-col ${
                  plan.highlight
                    ? 'bg-indigo-600/20 border-indigo-400/50 shadow-xl shadow-indigo-600/20 scale-[1.02]'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {plan.highlight && (
                  <span className="self-start px-3 py-1 bg-indigo-500 rounded-full text-xs font-black mb-4">الأكثر شعبية</span>
                )}
                <h3 className="text-2xl font-black">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-black">{plan.price}</span>
                  {plan.price !== 'تواصل' && <span className="text-indigo-200/60 text-sm mr-1">د.ع</span>}
                  <p className="text-sm text-indigo-200/50 mt-1">{plan.period}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <Check size={16} className="text-emerald-400 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => plan.id === 'enterprise' ? setEnterpriseOpen(true) : scrollTo('signup')}
                  className={`w-full py-3 rounded-xl font-black transition-colors ${
                    plan.highlight ? 'bg-white text-indigo-700 hover:bg-indigo-50' : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  {plan.id === 'enterprise' ? 'تواصل معنا' : 'ابدأ الآن'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">جاهز لإطلاق منيو مطعمك؟</h2>
          <p className="text-indigo-200/60 mb-8">انضم لمئات المطاعm التي تستخدم E-Menu Pro</p>
          <button type="button" onClick={() => scrollTo('signup')} className="px-10 py-4 bg-indigo-600 rounded-2xl font-black text-lg hover:bg-indigo-500 transition-colors">
            تجربة مجانية 14 يوم
          </button>
        </div>
      </section>

      {platformBranding ? (
        <PlatformFooter
          branding={platformBranding}
          variant="landing"
          landingLinks={
            <>
              <Link to="/login" className="hover:text-indigo-300 transition-colors">تسجيل الدخول</Link>
              <a href={demoUrl} target="_blank" rel="noreferrer" className="hover:text-indigo-300 transition-colors">منيو تجريبي</a>
            </>
          }
        />
      ) : (
        <footer className="py-10 px-4 border-t border-white/5 text-center text-sm text-indigo-200/40">
          <p>© {new Date().getFullYear()} E-Menu Pro — منصة المنيو الذكية</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link to="/login" className="hover:text-indigo-300">تسجيل الدخول</Link>
            <a href={demoUrl} target="_blank" rel="noreferrer" className="hover:text-indigo-300">منيو تجريبي</a>
          </div>
        </footer>
      )}
      <EnterpriseContactModal open={enterpriseOpen} onClose={() => setEnterpriseOpen(false)} />
    </div>
  );
};
