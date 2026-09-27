import React, { useState } from 'react';
import type { MenuItem, AddonGroup, Addon } from '../../types';
import {
  createVariant,
  deleteVariant,
  createAddonGroup,
  updateAddonGroup,
  deleteAddonGroup,
  createAddon,
  deleteAddon,
} from '../../api/dashboard';
import { parseApiError } from '../../utils/apiErrors';

interface Props {
  item: MenuItem;
  onReload: () => void;
  showMsg: (text: string, type?: 'success' | 'error') => void;
}

export const MenuItemOptionsPanel: React.FC<Props> = ({ item, onReload, showMsg }) => {
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      onReload();
    } catch (e) {
      showMsg(parseApiError(e, 'خطأ'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const addVariant = () => {
    const name = prompt('اسم الحجم / النوع:');
    const price = prompt('السعر:');
    if (!name?.trim() || !price?.trim()) return;
    void run(async () => {
      await createVariant({ menu_item: item.id, name: name.trim(), price });
      showMsg('تمت إضافة الحجم');
    });
  };

  const addGroup = () => {
    const name = prompt('اسم مجموعة الخيارات (مثل: الإضافات):');
    if (!name?.trim()) return;
    void run(async () => {
      await createAddonGroup({ menu_item: item.id, name: name.trim(), min_selection: 0, max_selection: 3, addons: [] });
      showMsg('تمت إضافة المجموعة');
    });
  };

  const patchGroup = (group: AddonGroup, patch: Partial<Pick<AddonGroup, 'min_selection' | 'max_selection' | 'name'>>) => {
    void run(async () => {
      await updateAddonGroup(group.id, patch);
    });
  };

  const addOption = (group: AddonGroup) => {
    const name = prompt('اسم الخيار:');
    const price = prompt('السعر الإضافي (0 للمجاني):', '0');
    if (!name?.trim()) return;
    void run(async () => {
      await createAddon({ group: group.id, name: name.trim(), price: price?.trim() || '0' });
      showMsg('تمت إضافة الخيار');
    });
  };

  return (
    <div className="space-y-4 border-t border-white/10 pt-4 text-sm text-slate-300">
      <div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">الأحجام / أنواع (Variants)</p>
        <p className="text-[11px] text-slate-500 mb-2">اختيار واحد إلزامي للزبون عند وجود أحجام.</p>
        <div className="space-y-2">
          {item.variants?.map((v) => (
            <div key={v.id} className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2">
              <span>{v.name} — {v.price}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(async () => { await deleteVariant(v.id); })}
                className="text-red-400 text-xs font-bold"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
        <button type="button" disabled={busy} onClick={addVariant} className="text-xs text-indigo-300 font-bold mt-2">
          + حجم / نوع
        </button>
      </div>

      <div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">مجموعات الخيارات والإضافات</p>
        <div className="space-y-3">
          {item.addon_groups?.map((g) => (
            <GroupEditor
              key={g.id}
              group={g}
              busy={busy}
              onPatch={(patch) => patchGroup(g, patch)}
              onDelete={() => void run(async () => { await deleteAddonGroup(g.id); })}
              onAddOption={() => addOption(g)}
              onDeleteOption={(a: Addon) => void run(async () => { await deleteAddon(a.id); })}
            />
          ))}
        </div>
        <button type="button" disabled={busy} onClick={addGroup} className="text-xs text-indigo-300 font-bold mt-2">
          + مجموعة خيارات
        </button>
      </div>
    </div>
  );
};

function GroupEditor({
  group,
  busy,
  onPatch,
  onDelete,
  onAddOption,
  onDeleteOption,
}: {
  group: AddonGroup;
  busy: boolean;
  onPatch: (patch: Partial<Pick<AddonGroup, 'min_selection' | 'max_selection' | 'name'>>) => void;
  onDelete: () => void;
  onAddOption: () => void;
  onDeleteOption: (a: Addon) => void;
}) {
  const required = (group.min_selection ?? 0) > 0;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <input
          defaultValue={group.name}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== group.name) onPatch({ name: v });
          }}
          className="flex-1 min-w-[120px] bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm font-bold"
        />
        <button type="button" disabled={busy} onClick={onDelete} className="text-red-400 text-xs font-bold">
          حذف المجموعة
        </button>
      </div>
      <div className="flex flex-wrap gap-3 text-[11px]">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => {
              const min = e.target.checked ? Math.max(1, group.min_selection || 1) : 0;
              onPatch({ min_selection: min });
            }}
          />
          إلزامي
        </label>
        <label className="flex items-center gap-1">
          أدنى
          <input
            type="number"
            min={0}
            max={99}
            defaultValue={group.min_selection}
            onBlur={(e) => onPatch({ min_selection: Math.max(0, parseInt(e.target.value, 10) || 0) })}
            className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-white"
          />
        </label>
        <label className="flex items-center gap-1">
          أقصى
          <input
            type="number"
            min={1}
            max={99}
            defaultValue={group.max_selection}
            onBlur={(e) => onPatch({ max_selection: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-white"
          />
        </label>
      </div>
      <ul className="space-y-1">
        {group.addons?.map((a) => (
          <li key={a.id} className="flex justify-between items-center bg-white/5 rounded-lg px-2 py-1.5 text-xs">
            <span>{a.name} (+{a.price})</span>
            <button type="button" disabled={busy} onClick={() => onDeleteOption(a)} className="text-red-400 font-bold">
              حذف
            </button>
          </li>
        ))}
      </ul>
      <button type="button" disabled={busy} onClick={onAddOption} className="text-[11px] text-indigo-300 font-bold">
        + خيار داخل المجموعة
      </button>
    </div>
  );
}
