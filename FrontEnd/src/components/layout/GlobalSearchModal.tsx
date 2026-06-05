import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminPatientsList } from '@/hooks/useAdminPatientsList';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import { billingAdminService } from '@/services/billing/billingAdmin.service';
import { hmsToAppointment } from '@/utils/appointmentHelpers';
import type { Appointment } from '@/types/appointment.types';
import type { Invoice } from '@/types/billing.types';
import {
  QUICK_LINKS,
  TYPE_CONFIG,
  searchGlobal,
  type SearchResult,
} from './globalSearch';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const GlobalSearchModal = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const { patients } = useAdminPatientsList();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (!open) return;
    appointmentAdminService
      .list()
      .then(({ data }) => setAppointments((data.res?.appointments ?? []).map(hmsToAppointment)))
      .catch(() => setAppointments([]));
    billingAdminService
      .list()
      .then(({ data }) => setInvoices(data.res?.invoices ?? []))
      .catch(() => setInvoices([]));
  }, [open]);

  const results = useMemo(
    () => searchGlobal(query, patients, appointments, invoices),
    [query, patients, appointments, invoices]
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const handleSelect = (item: SearchResult) => {
    onClose();
    navigate(item.href);
  };

  if (!open) return null;

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, item) => {
    acc[item.type] = acc[item.type] ? [...acc[item.type], item] : [item];
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close search overlay"
      />
      <div
        className="relative flex max-h-[min(70vh,560px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border-sage bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
      >
        <div className="flex items-center gap-3 border-b border-border-sage px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-ink-ghost" strokeWidth={2} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, staff, invoices, pages..."
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-ghost"
          />
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-ink-ghost hover:bg-sage-mist hover:text-ink"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {!query.trim() ? (
            <div>
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                Quick links
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
                  <button
                    key={href}
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(href);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-sage bg-cream/40 px-3 py-2.5 text-left text-sm font-medium text-ink-soft transition-colors hover:bg-sage-mist hover:text-ink"
                  >
                    <Icon className="h-4 w-4 text-sage-deep" strokeWidth={2} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-soft">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="space-y-4">
              {(Object.keys(grouped) as Array<keyof typeof grouped>).map((type) => {
                const config = TYPE_CONFIG[type as SearchResult['type']];
                const Icon = config.icon;
                return (
                  <div key={type}>
                    <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                      {config.label}
                    </p>
                    <div className="space-y-1">
                      {grouped[type]?.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(item)}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-sage-mist/60"
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.tone}`}
                          >
                            <Icon className="h-4 w-4" strokeWidth={2} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                            <p className="truncate text-xs text-ink-soft">{item.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border-sage bg-cream/40 px-4 py-2 text-center text-[11px] text-ink-ghost">
          Press <kbd className="rounded border border-border-sage bg-white px-1.5 py-0.5 font-sans">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
};
