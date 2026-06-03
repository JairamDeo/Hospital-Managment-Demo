import { useCallback, useEffect, useState } from 'react';
import { Leaf, Pill, Plus, Scale, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { masterService } from '@/services/master/master.service';
import { getApiErrorMessage } from '@/utils/helpers';
import type { MasterItem } from '@/types/api.types';

type Tab = 'prakriti' | 'treatment' | 'pharmacyCategory' | 'pharmacyUnit';

const MasterCard = ({ item }: { item: MasterItem }) => (
  <div
    className={`rounded-xl border p-4 shadow-sm transition-colors ${
      item.active
        ? 'border-border-sage bg-white'
        : 'border-border-sage/60 bg-cream/40 opacity-70'
    }`}
  >
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{item.code}</p>
    <p className="mt-1 font-serif text-lg font-semibold text-ink">{item.name}</p>
    <p className="mt-2 text-xs text-ink-soft">{item.active ? 'Active' : 'Inactive'}</p>
  </div>
);

const TAB_LABELS: Record<Tab, string> = {
  prakriti: 'Prakriti',
  treatment: 'Treatment',
  pharmacyCategory: 'Pharmacy Category',
  pharmacyUnit: 'Pharmacy Unit',
};

export const MasterDataPage = () => {
  const [tab, setTab] = useState<Tab>('prakriti');
  const [prakriti, setPrakriti] = useState<MasterItem[]>([]);
  const [treatments, setTreatments] = useState<MasterItem[]>([]);
  const [pharmacyCategories, setPharmacyCategories] = useState<MasterItem[]>([]);
  const [pharmacyUnits, setPharmacyUnits] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes, cRes, uRes] = await Promise.all([
        masterService.listPrakriti(),
        masterService.listTreatments(),
        masterService.listPharmacyCategories(),
        masterService.listPharmacyUnits(),
      ]);
      setPrakriti(pRes.data.res?.items ?? []);
      setTreatments(tRes.data.res?.items ?? []);
      setPharmacyCategories(cRes.data.res?.items ?? []);
      setPharmacyUnits(uRes.data.res?.items ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('Name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (tab === 'prakriti') {
        const { data } = await masterService.createPrakriti(trimmed);
        if (data.res?.item) setPrakriti((prev) => [...prev, data.res!.item]);
        showToast(data.message || 'Prakriti created', 'success');
      } else if (tab === 'treatment') {
        const { data } = await masterService.createTreatment(trimmed);
        if (data.res?.item) setTreatments((prev) => [...prev, data.res!.item]);
        showToast(data.message || 'Treatment created', 'success');
      } else if (tab === 'pharmacyCategory') {
        const { data } = await masterService.createPharmacyCategory(trimmed);
        if (data.res?.item) setPharmacyCategories((prev) => [...prev, data.res!.item]);
        showToast(data.message || 'Pharmacy category created', 'success');
      } else {
        const { data } = await masterService.createPharmacyUnit(trimmed);
        if (data.res?.item) setPharmacyUnits((prev) => [...prev, data.res!.item]);
        showToast(data.message || 'Pharmacy unit created', 'success');
      }
      setName('');
      setModalOpen(false);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const items =
    tab === 'prakriti'
      ? prakriti
      : tab === 'treatment'
        ? treatments
        : tab === 'pharmacyCategory'
          ? pharmacyCategories
          : pharmacyUnits;

  const emptyLabel =
    tab === 'prakriti'
      ? 'prakriti'
      : tab === 'treatment'
        ? 'treatments'
        : tab === 'pharmacyCategory'
          ? 'pharmacy categories'
          : 'pharmacy units';

  const placeholder =
    tab === 'pharmacyUnit'
      ? 'e.g. ml, g, tablet'
      : tab === 'pharmacyCategory'
        ? 'e.g. Medicated Oil'
        : tab === 'prakriti'
          ? 'e.g. Vata'
          : 'e.g. General Consult';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Master Data
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Manage Prakriti, Treatment, pharmacy categories, and pack units (ml, g, kg…)
          </p>
        </div>
        <Button className="gap-2 rounded-lg px-4 py-2" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add {TAB_LABELS[tab]}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('prakriti')}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'prakriti'
              ? 'border-sage-deep bg-sage-mist text-sage-deep'
              : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60'
          }`}
        >
          <Leaf className="h-4 w-4" strokeWidth={1.75} />
          Prakriti
        </button>
        <button
          type="button"
          onClick={() => setTab('treatment')}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'treatment'
              ? 'border-sage-deep bg-sage-mist text-sage-deep'
              : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60'
          }`}
        >
          <Stethoscope className="h-4 w-4" strokeWidth={1.75} />
          Treatment
        </button>
        <button
          type="button"
          onClick={() => setTab('pharmacyCategory')}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'pharmacyCategory'
              ? 'border-sage-deep bg-sage-mist text-sage-deep'
              : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60'
          }`}
        >
          <Pill className="h-4 w-4" strokeWidth={1.75} />
          Pharmacy Category
        </button>
        <button
          type="button"
          onClick={() => setTab('pharmacyUnit')}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'pharmacyUnit'
              ? 'border-sage-deep bg-sage-mist text-sage-deep'
              : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60'
          }`}
        >
          <Scale className="h-4 w-4" strokeWidth={1.75} />
          Pharmacy Unit
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-ink-soft">
              No {emptyLabel} yet. Add one above.
            </p>
          ) : (
            items.map((item) => <MasterCard key={item._id} item={item} />)
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setName('');
        }}
        title={`Add ${TAB_LABELS[tab]}`}
        subtitle="Code will be generated automatically"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={saving}>
              Create
            </Button>
          </>
        }
      >
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} />
      </Modal>
    </div>
  );
};

export default MasterDataPage;
