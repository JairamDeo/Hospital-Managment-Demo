import { useEffect, useMemo, useState } from 'react';
import { Check, FlaskConical } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { masterService } from '@/services/master/master.service';
import type { MasterItem } from '@/types/api.types';
import type { RecommendedLabTest } from '@/types/structuredPrescription.types';
import { getApiErrorMessage } from '@/utils/helpers';

interface LabTestRow extends MasterItem {
  categoryCode?: string;
  categoryName?: string;
  category?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  selected: RecommendedLabTest[];
  onSave: (tests: RecommendedLabTest[]) => void;
}

export const RecommendLabTestsModal = ({ open, onClose, selected, onSave }: Props) => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<MasterItem[]>([]);
  const [tests, setTests] = useState<LabTestRow[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [picked, setPicked] = useState<Record<string, RecommendedLabTest>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const map: Record<string, RecommendedLabTest> = {};
    selected.forEach((t) => {
      map[t.testCode] = t;
    });
    setPicked(map);

    let cancelled = false;
    setLoading(true);
    Promise.all([masterService.listLabCategories(true), masterService.listLabTests(true)])
      .then(([catRes, testRes]) => {
        if (cancelled) return;
        const cats = catRes.data.res?.items ?? [];
        const items = testRes.data.res?.items ?? [];
        setCategories(cats);
        setTests(items);
        setActiveCategoryId((prev) => prev || cats[0]?._id || '');
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, selected, showToast]);

  const activeCategory = categories.find((c) => c._id === activeCategoryId);
  const filteredTests = useMemo(
    () =>
      tests.filter((t) => {
        if (!activeCategoryId) return true;
        return (
          t.category === activeCategoryId ||
          String(t.category) === activeCategoryId ||
          t.categoryCode === activeCategory?.code
        );
      }),
    [tests, activeCategoryId, activeCategory?.code]
  );

  const toggleTest = (test: LabTestRow) => {
    setPicked((prev) => {
      const next = { ...prev };
      if (next[test.code]) {
        delete next[test.code];
      } else {
        next[test.code] = {
          testCode: test.code,
          testName: test.name,
          categoryCode: test.categoryCode || activeCategory?.code || '',
          categoryName: test.categoryName || activeCategory?.name || '',
        };
      }
      return next;
    });
  };

  const pickedList = Object.values(picked);

  return (
    <Modal open={open} onClose={onClose} title="Recommend lab / PF tests" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-ink-soft">
          Select tests by category. They will be saved with the prescription and notified to Lab.
        </p>

        {loading ? (
          <p className="text-sm text-ink-soft">Loading tests…</p>
        ) : categories.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No lab test categories yet. Add Diabetes, Thyroid, etc. under Master Data → Lab Tests.
          </p>
        ) : (
          <div className="grid min-h-[280px] gap-3 sm:grid-cols-[11rem_1fr]">
            <div className="space-y-1 rounded-xl border border-border-sage bg-cream/40 p-2">
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setActiveCategoryId(cat._id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
                    activeCategoryId === cat._id
                      ? 'bg-sage-mist font-semibold text-sage-deep'
                      : 'text-ink-soft hover:bg-white'
                  }`}
                >
                  <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-border-sage p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                {activeCategory?.name || 'Tests'}
              </p>
              {filteredTests.length === 0 ? (
                <p className="text-sm text-ink-ghost">No tests in this category.</p>
              ) : (
                <ul className="space-y-1.5">
                  {filteredTests.map((test) => {
                    const checked = Boolean(picked[test.code]);
                    return (
                      <li key={test._id}>
                        <button
                          type="button"
                          onClick={() => toggleTest(test)}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                            checked
                              ? 'border-sage-deep bg-sage-mist/50 text-ink'
                              : 'border-border-sage/70 bg-white text-ink-soft hover:border-sage'
                          }`}
                        >
                          <span>{test.name}</span>
                          {checked ? <Check className="h-4 w-4 text-sage-deep" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {pickedList.length > 0 ? (
          <p className="text-xs text-ink-soft">
            Selected: {pickedList.map((t) => t.testName).join(', ')}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave(pickedList);
              onClose();
            }}
          >
            Apply {pickedList.length ? `(${pickedList.length})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
