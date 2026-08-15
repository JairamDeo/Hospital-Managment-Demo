import { useCallback, useEffect, useState } from 'react';
import { FlaskConical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { masterService } from '@/services/master/master.service';
import type { MasterItem } from '@/types/api.types';
import { getApiErrorMessage } from '@/utils/helpers';

type LabTestItem = MasterItem & {
  category?: string;
  categoryCode?: string;
  categoryName?: string;
};

export const LabMasterPanel = () => {
  const { showToast } = useToast();
  const { canEdit } = usePermissions();
  const canManage = canEdit('masterData');
  const [categories, setCategories] = useState<MasterItem[]>([]);
  const [tests, setTests] = useState<LabTestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catOpen, setCatOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        masterService.listLabCategories(),
        masterService.listLabTests(),
      ]);
      setCategories(cRes.data.res?.items ?? []);
      setTests(tRes.data.res?.items ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const createCategory = async () => {
    if (!name.trim()) {
      showToast('Enter category name', 'error');
      return;
    }
    setSaving(true);
    try {
      await masterService.createLabCategory(name.trim());
      showToast('Lab category created', 'success');
      setCatOpen(false);
      setName('');
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const createTest = async () => {
    if (!name.trim() || !categoryId) {
      showToast('Select category and enter test name', 'error');
      return;
    }
    setSaving(true);
    try {
      await masterService.createLabTest({ name: name.trim(), categoryId });
      showToast('Lab test created', 'success');
      setTestOpen(false);
      setName('');
      setCategoryId('');
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        Add test types (Diabetes, Thyroid, CBC, …) and the individual tests under each. Doctors pick
        these when recommending PF / lab reports.
      </p>

      <div className="flex flex-wrap gap-2">
        {canManage ? (
          <>
            <Button type="button" className="gap-1" onClick={() => { setName(''); setCatOpen(true); }}>
              <Plus className="h-4 w-4" />
              Add category
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-1"
              onClick={() => {
                setName('');
                setCategoryId(categories[0]?._id || '');
                setTestOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add test
            </Button>
          </>
        ) : (
          <p className="text-xs text-ink-soft">Only admin can add/edit lab master data.</p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border-sage bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FlaskConical className="h-4 w-4 text-sage-deep" />
              Categories
            </h3>
            {categories.length === 0 ? (
              <p className="mt-3 text-sm text-ink-ghost">No categories yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {categories.map((c) => (
                  <li key={c._id} className="rounded-lg border border-border-sage/70 px-3 py-2">
                    <p className="text-sm font-semibold text-ink">{c.name}</p>
                    <p className="text-[10px] text-ink-ghost">
                      {c.code} · {c.active ? 'Active' : 'Inactive'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-border-sage bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-ink">Tests</h3>
            {tests.length === 0 ? (
              <p className="mt-3 text-sm text-ink-ghost">No tests yet.</p>
            ) : (
              <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                {tests.map((t) => (
                  <li key={t._id} className="rounded-lg border border-border-sage/70 px-3 py-2">
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-[10px] text-ink-ghost">
                      {t.categoryName || '—'} · {t.code}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <Modal
        open={catOpen}
        onClose={() => setCatOpen(false)}
        title="Add lab category"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCatOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createCategory()} isLoading={saving}>
              Create
            </Button>
          </>
        }
      >
        <Input
          label="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Diabetes, Thyroid"
        />
      </Modal>

      <Modal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        title="Add lab test"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createTest()} isLoading={saving}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className={formLabelClass}>Category *</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={formSelectClass}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Test name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. HbA1c, TSH"
          />
        </div>
      </Modal>
    </div>
  );
};
