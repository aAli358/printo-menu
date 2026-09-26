import React, { useEffect, useState } from 'react';
import { fetchStaff, addStaff, removeStaff, type StaffMember, type StaffRole } from '../../api/staff';
import { parseApiError } from '../../utils/apiErrors';

const ROLES: { id: StaffRole; label: string }[] = [
  { id: 'waiter', label: 'جرسون' },
  { id: 'kitchen', label: 'مطبخ' },
  { id: 'cashier', label: 'كاشير' },
];

const ROLE_DESC: Record<StaffRole, string> = {
  waiter: 'جرسون — طلبات وطاولات',
  kitchen: 'مطبخ (KDS) — بدون أسعار',
  cashier: 'كاشير — فواتير وتقارير',
};

const inputClass =
  'w-full mt-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500/40';

interface Props {
  showMsg: (text: string, type?: 'success' | 'error') => void;
}

export const StaffPanel: React.FC<Props> = ({ showMsg }) => {
  const [list, setList] = useState<StaffMember[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState<StaffRole>('waiter');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchStaff()
      .then(setList)
      .catch((e) => showMsg(parseApiError(e, 'تعذر تحميل الطاقم'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addStaff({
        username: username.trim(),
        password,
        first_name: firstName.trim() || undefined,
        role,
      });
      showMsg('تم إنشاء الحساب وربط الموظف');
      setUsername('');
      setPassword('');
      setFirstName('');
      load();
    } catch (err) {
      showMsg(parseApiError(err, 'تعذر إنشاء الموظف'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const card = 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-black text-white">الطاقم والصلاحيات</h2>
        <p className="text-xs text-slate-400 mt-1">أنشئ حسابات الموظفين وحدد صلاحياتهم (RBAC)</p>
      </div>

      <form onSubmit={handleAdd} className={`${card} space-y-4`}>
        <h3 className="font-black text-slate-900">إضافة موظف</h3>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">اسم المستخدم الجديد</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="off"
            placeholder="waiter_ali"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">كلمة المرور</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">الاسم (اختياري)</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="علي"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">الدور</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className={inputClass}
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-2xl font-black bg-indigo-600 text-white disabled:opacity-60"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </form>

      <div className={card}>
        <h3 className="font-black text-slate-900 mb-4">الفريق الحالي</h3>
        {loading ? (
          <p className="text-slate-500 text-sm">جاري التحميل...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500 text-sm">لا يوجد موظفون بعد</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-bold text-slate-900">{m.username}</p>
                  <p className="text-xs text-slate-500">{ROLE_DESC[m.role] || m.role}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('إزالة هذا العضو؟')) return;
                    try {
                      await removeStaff(m.id);
                      showMsg('تمت الإزالة');
                      load();
                    } catch (err) {
                      showMsg(parseApiError(err, 'تعذر الحذف'), 'error');
                    }
                  }}
                  className="text-xs font-black text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
