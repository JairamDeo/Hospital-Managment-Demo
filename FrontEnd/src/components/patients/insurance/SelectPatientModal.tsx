import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface PatientPickerItem {
  patientCode: string;
  name: string;
  subtitle?: string;
  hint?: string;
}

interface Props {
  open: boolean;
  title: string;
  subtitle?: string;
  items: PatientPickerItem[];
  onClose: () => void;
  onSelect: (patientCode: string) => void;
}

export const SelectPatientModal = ({
  open,
  title,
  subtitle,
  items,
  onClose,
  onSelect,
}: Props) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.patientCode.toLowerCase().includes(q) ||
        (item.subtitle?.toLowerCase().includes(q) ?? false)
    );
  }, [items, search]);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const handleSelect = (patientCode: string) => {
    setSearch('');
    onSelect(patientCode);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      size="md"
      footer={
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
      }
    >
      <div className="relative mb-3">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost"
          strokeWidth={1.75}
        />
        <input
          type="search"
          autoFocus
          placeholder="Search by name, patient code or mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border-sage bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-ghost focus:border-sage focus:ring-2 focus:ring-sage-pale"
        />
      </div>

      <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-border-sage bg-cream/20 p-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-ink-soft">No patients match your search</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.patientCode}
              type="button"
              onClick={() => handleSelect(item.patientCode)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-sage-mist/80"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{item.name}</p>
                <p className="truncate text-xs text-ink-ghost">
                  {item.patientCode}
                  {item.subtitle ? ` · ${item.subtitle}` : ''}
                </p>
              </div>
              {item.hint ? (
                <span className="shrink-0 rounded-full bg-sage-mist px-2 py-0.5 text-[10px] font-bold uppercase text-sage-deep">
                  {item.hint}
                </span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </Modal>
  );
};
