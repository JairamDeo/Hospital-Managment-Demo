import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ContentLoader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { formInputClass, formLabelClass } from '@/components/ui/formStyles';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { masterService } from '@/services/master/master.service';
import { pharmacyService } from '@/services/pharmacy/pharmacy.service';
import type { ChuranCombinationItem, ChuranCombinationPowder, PharmacySpoonItem } from '@/types/api.types';
import type { PharmacyItemApi } from '@/types/pharmacy.types';
import {
  buildChuranCombination,
  powderGramsFromSpoons,
} from '@/types/structuredPrescription.types';
import {
  PHARMACY_SEARCH_MAX_RESULTS,
  PHARMACY_SEARCH_MIN_CHARS,
  searchPharmacyItems,
} from '@/utils/pharmacySearch.util';
import { getApiErrorMessage } from '@/utils/helpers';

export const ChuranMasterPanel = () => {
  const { showToast } = useToast();
  const { canEdit } = usePermissions();
  const canManage = canEdit('masterData');
  const [items, setItems] = useState<ChuranCombinationItem[]>([]);
  const [pharmacyItems, setPharmacyItems] = useState<PharmacyItemApi[]>([]);
  const [spoonSizes, setSpoonSizes] = useState<PharmacySpoonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [howToIntake, setHowToIntake] = useState('');
  const [powders, setPowders] = useState<ChuranCombinationPowder[]>([]);
  const [powderQuery, setPowderQuery] = useState('');
  const [listQuery, setListQuery] = useState('');

  const defaultSpoonGrams = useMemo(() => {
    const preferred = spoonSizes.find((s) => s.isDefault) ?? spoonSizes[0];
    return preferred?.grams ?? 1.5;
  }, [spoonSizes]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, pRes, sRes] = await Promise.all([
        masterService.listChuranCombinations(),
        pharmacyService.getBillingItems(),
        masterService.listPharmacySpoons(true),
      ]);
      setItems(cRes.data.res?.items ?? []);
      setPharmacyItems(pRes.data.res?.items ?? []);
      setSpoonSizes(sRes.data.res?.items ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const powderResults = useMemo(
    () =>
      searchPharmacyItems(pharmacyItems, powderQuery, PHARMACY_SEARCH_MAX_RESULTS, {
        itemType: 'weight',
      }),
    [pharmacyItems, powderQuery]
  );

  const filtered = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        i.combination.toLowerCase().includes(q)
    );
  }, [items, listQuery]);

  const resetForm = () => {
    setName('');
    setHowToIntake('');
    setPowders([]);
    setPowderQuery('');
  };

  const addPowder = (item: PharmacyItemApi) => {
    if (powders.some((p) => p.itemCode === item.itemCode)) return;
    const spoonGrams = item.spoonSizeGrams ?? defaultSpoonGrams;
    setPowders((prev) => [
      ...prev,
      {
        itemCode: item.itemCode,
        name: item.name,
        quantitySpoons: 1,
        spoonGrams,
        quantityGrams: powderGramsFromSpoons(1, spoonGrams),
      },
    ]);
    setPowderQuery('');
  };

  const updatePowder = (index: number, spoons: number) => {
    setPowders((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const quantitySpoons = Math.max(0.25, spoons);
        return {
          ...p,
          quantitySpoons,
          quantityGrams: powderGramsFromSpoons(quantitySpoons, p.spoonGrams),
        };
      })
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast('Enter churan name', 'error');
      return;
    }
    if (!powders.length) {
      showToast('Add at least one medicine / powder', 'error');
      return;
    }
    setSaving(true);
    try {
      await masterService.createChuranCombination({
        name: name.trim(),
        powders,
        combination: buildChuranCombination(powders),
        howToIntake: howToIntake.trim(),
      });
      showToast('Churan combination saved', 'success');
      setOpen(false);
      resetForm();
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: ChuranCombinationItem) => {
    try {
      await masterService.updateChuranCombination(item._id, { active: !item.active });
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  if (loading) {
    return <ContentLoader size="md" className="min-h-[240px]" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost" />
          <input
            type="search"
            value={listQuery}
            onChange={(e) => setListQuery(e.target.value)}
            placeholder="Search churan combinations…"
            className={`${formInputClass} py-2 pl-10`}
          />
        </div>
        {canManage ? (
          <Button
            className="gap-2 rounded-lg"
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add Churan
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-ink-soft">
        Save named powder combinations here. Doctors can search and load them while writing
        prescriptions.
      </p>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-soft">No churan combinations yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item._id}
              className={`rounded-xl border p-4 shadow-sm ${
                item.active
                  ? 'border-border-sage bg-white'
                  : 'border-border-sage/60 bg-cream/40 opacity-80'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                {item.code}
              </p>
              <p className="mt-1 font-serif text-lg font-semibold text-ink">{item.name}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-soft">
                {item.combination || '—'}
              </p>
              <p className="mt-2 text-[11px] text-ink-ghost">
                {item.powders?.length ?? 0} powder
                {(item.powders?.length ?? 0) === 1 ? '' : 's'}
                {item.howToIntake ? ` · ${item.howToIntake}` : ''}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-ink-soft">{item.active ? 'Active' : 'Inactive'}</span>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => void toggleActive(item)}
                    className="text-xs font-semibold text-sage-deep hover:underline"
                  >
                    {item.active ? 'Deactivate' : 'Activate'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title="Add churan combination"
        subtitle="Name + powders — reusable in prescriptions"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={saving}>
              {saving ? 'Saving…' : 'Save combination'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className={formLabelClass}>Churan name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sitopaladi mix"
              className={formInputClass}
            />
          </label>
          <label className="block">
            <span className={formLabelClass}>How to intake (optional)</span>
            <input
              type="text"
              value={howToIntake}
              onChange={(e) => setHowToIntake(e.target.value)}
              placeholder="e.g. with honey after meals"
              className={formInputClass}
            />
          </label>
          <label className="block">
            <span className={formLabelClass}>Add medicine / powder</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost" />
              <input
                type="search"
                value={powderQuery}
                onChange={(e) => setPowderQuery(e.target.value)}
                placeholder={`Type ${PHARMACY_SEARCH_MIN_CHARS}+ chars`}
                className={`${formInputClass} pl-10`}
              />
            </div>
          </label>
          {powderQuery.trim().length >= PHARMACY_SEARCH_MIN_CHARS && powderResults.length > 0 ? (
            <ul className="max-h-36 divide-y divide-border-sage/60 overflow-y-auto rounded-lg border border-border-sage">
              {powderResults.map((item) => {
                const added = powders.some((p) => p.itemCode === item.itemCode);
                return (
                  <li key={item.itemCode}>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => addPowder(item)}
                      className={`flex w-full px-3 py-2 text-left text-sm ${
                        added ? 'cursor-default opacity-50' : 'hover:bg-sage-mist/40'
                      }`}
                    >
                      {item.name}
                      {added ? ' · added' : ''}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {powders.length > 0 ? (
            <ul className="space-y-2 rounded-lg border border-border-sage bg-cream/30 p-3">
              {powders.map((p, index) => (
                <li key={`${p.itemCode}-${index}`} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{p.name}</span>
                  <input
                    type="number"
                    min={0.25}
                    step={0.25}
                    value={p.quantitySpoons}
                    onChange={(e) => updatePowder(index, Number(e.target.value))}
                    className="w-20 rounded-lg border border-border-sage px-2 py-1 text-xs"
                    aria-label="Spoons"
                  />
                  <span className="text-xs text-ink-ghost">spoons</span>
                  <button
                    type="button"
                    onClick={() => setPowders((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded p-1 text-ink-ghost hover:text-danger"
                    aria-label="Remove powder"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              <li className="pt-1 text-xs text-ink-soft">
                Combination: {buildChuranCombination(powders)}
              </li>
            </ul>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};
