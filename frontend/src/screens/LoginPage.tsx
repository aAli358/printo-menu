import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { login, register, fetchMe } from '../api/auth';
import { useAuthStore } from '../store/useAuthStore';
import { redirectAfterAuth } from '../utils/authRedirect';
import { parseApiError } from '../utils/apiErrors';
import { isRootDomain } from '../utils/tenant';

type Mode = 'login' | 'register';

export const LoginPage: React.FC = () => {
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        const data = await register({
          username,
          password,
          email,
          restaurant_name: restaurantName,
          phone,
        });
        useAuthStore.setState({ accessToken: data.tokens.access, refreshToken: data.tokens.refresh });
        const me = await fetchMe();
        const payload = {
          access: data.tokens.access,
          refresh: data.tokens.refresh,
          user: me.user,
          restaurants: me.restaurants.length ? me.restaurants : [{
            id: data.restaurant.id,
            name: data.restaurant.name,
            name_en: '',
            slug: data.restaurant.slug,
            logo: null,
            subscription_status: data.restaurant.subscription_status ?? 'trial',
          }],
        };
        setSession(payload);
        await redirectAfterAuth(payload.restaurants, payload);
      } else {
        const tokens = await login({ username, password });
        useAuthStore.setState({ accessToken: tokens.access, refreshToken: tokens.refresh });
        const me = await fetchMe();
        const payload = {
          access: tokens.access,
          refresh: tokens.refresh,
          user: me.user,
          restaurants: me.restaurants,
        };
        setSession(payload);
        await redirectAfterAuth(me.restaurants, payload);
      }
    } catch (err: unknown) {
      setError(parseApiError(err, 'فشل تسجيل الدخول'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-2xl mb-4">🍽️</div>
          <h1 className="text-2xl font-black text-gray-900">E-Menu Pro</h1>
          <p className="text-sm text-gray-500 mt-1">لوحة تحكم أصحاب المطاعm</p>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-2xl">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === m ? 'bg-white shadow text-indigo-700' : 'text-gray-500'}`}
            >
              {m === 'login' ? 'دخول' : 'تسجيل مطعm'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <input
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="اسم المطعm"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="رقم الهاتف (اختياري)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </>
          )}
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="اسم المستخدم"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {mode === 'register' && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد (اختياري)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          )}
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            minLength={8}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all disabled:opacity-60"
          >
            {loading ? 'جاري...' : mode === 'login' ? 'دخول' : 'إنشاء حساب ومطعm'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          {isRootDomain() ? (
            <Link to="/" className="text-indigo-600 font-bold hover:underline">← الصفحة الرئيسية</Link>
          ) : (
            <Link to="/" className="text-indigo-600 font-bold hover:underline">← معاينة المنيو</Link>
          )}
        </p>
      </div>
    </div>
  );
};
