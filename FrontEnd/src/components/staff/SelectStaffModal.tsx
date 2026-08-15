import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface StaffPickerItem {
  staffCode: string;
  name: string;
  role: string;
  subtitle?: string;
  hint?: string;
}

interface Props {
  open: boolean;
  title: string;
  subtitle?: string;
  items: StaffPickerItem[];
  onClose: () => void;
  onSelect: (staffCode: string) => void;
}

export const SelectStaffModal = ({
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
        item.staffCode.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        (item.subtitle?.toLowerCase().includes(q) ?? false)
    );
  }, [items, search]);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const handleSelect = (staffCode: string) => {
    setSearch('');
    onSelect(staffCode);
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
          placeholder="Search by name, staff code or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border-sage bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-ghost focus:border-sage focus:ring-2 focus:ring-sage-pale"
        />
      </div>

      <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-border-sage bg-cream/20 p-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-ink-soft">No staff match your search</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.staffCode}
              type="button"
              onClick={() => handleSelect(item.staffCode)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-sage-mist/80"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{item.name}</p>
                <p className="truncate text-xs text-ink-ghost">
                  {item.staffCode}
                  {item.subtitle ? ` · ${item.subtitle}` : ''}
                  {' · '}
                  {item.role}
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
