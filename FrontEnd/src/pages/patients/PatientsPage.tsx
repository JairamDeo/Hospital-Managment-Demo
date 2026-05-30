import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileSpreadsheet, FileText, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PopoverMenu, PopoverMenuItem } from '@/components/ui/PopoverMenu';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientPagination } from '@/components/patients/PatientPagination';
import { PatientFormModal } from '@/components/modals/PatientFormModal';
import { useToast } from '@/hooks/useToast';
import { patientDetailPath } from '@/constants/routes';
import {
  MOCK_PATIENTS,
  PATIENT_STATS,
  type PrakritiType,
  type Patient,
  type PatientFormValues,
} from './data/mockPatients';
import {
  emptyPatientForm,
  formToPatient,
  generatePatientId,
  patientToForm,
  sortPatients,
  SORT_LABELS,
  type SortOption,
} from '@/utils/patientHelpers';
import { exportPatientsCsv, exportPatientsPdf } from '@/utils/patientExport';

const PAGE_SIZE = 6;
const PRAKRITI_FILTERS: Array<'All Patients' | PrakritiType> = [
  'All Patients',
  'Vata',
  'Pitta',
  'Kapha',
];

const SORT_OPTIONS: SortOption[] = [
  'name-asc',
  'name-desc',
  'age-asc',
  'age-desc',
  'visit-newest',
  'visit-oldest',
  'status',
];

type ModalMode = 'add' | 'edit' | null;

export const PatientsPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [search, setSearch] = useState('');
  const [prakritiFilter, setPrakritiFilter] = useState<'All Patients' | PrakritiType>('All Patients');
  const [sortBy, setSortBy] = useState<SortOption>('visit-newest');
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formInitial, setFormInitial] = useState<PatientFormValues>(emptyPatientForm());
  const [exportOpen, setExportOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    let list = [...patients];
    if (prakritiFilter !== 'All Patients') {
      list = list.filter((p) => p.prakriti === prakritiFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.treatment.toLowerCase().includes(q) ||
          p.mobile?.includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
    }
    return sortPatients(list, sortBy);
  }, [patients, search, prakritiFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagePatients = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = filtered.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);

  const openAdd = () => {
    setFormInitial(emptyPatientForm());
    setSelectedPatient(null);
    setModalMode('add');
  };

  const openView = (p: Patient) => {
    navigate(patientDetailPath(p.id));
  };

  const openEdit = (p: Patient) => {
    setSelectedPatient(p);
    setFormInitial(patientToForm(p));
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedPatient(null);
  };

  const handleFormSubmit = (values: PatientFormValues) => {
    if (modalMode === 'add') {
      const id = generatePatientId(patients);
      const newPatient = formToPatient(values, id);
      setPatients((prev) => [newPatient, ...prev]);
      showToast(`Patient ${newPatient.name} added (${id})`, 'success');
    } else if (modalMode === 'edit' && selectedPatient) {
      const updated = formToPatient(values, selectedPatient.id, selectedPatient);
      setPatients((prev) => prev.map((p) => (p.id === selectedPatient.id ? updated : p)));
      showToast('Patient updated successfully', 'success');
    }
    closeModal();
  };

  const handleExport = (type: 'pdf' | 'csv') => {
    setExportOpen(false);
    if (type === 'csv') {
      exportPatientsCsv(filtered);
      showToast('CSV exported successfully', 'success');
    } else {
      exportPatientsPdf(filtered);
      showToast('PDF print dialog opened', 'success');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Patient Registry
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {PATIENT_STATS.total.toLocaleString()} total patients ·{' '}
            {PATIENT_STATS.newThisWeek} new this week
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="relative" ref={exportRef}>
            <button
              type="button"
              onClick={() => {
                setExportOpen((v) => !v);
                setSortOpen(false);
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border-sage bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-sage-mist"
            >
              <Download className="h-4 w-4 text-ink-soft" strokeWidth={1.75} />
              Export
            </button>
            <PopoverMenu
              open={exportOpen}
              onClose={() => setExportOpen(false)}
              anchorRef={exportRef}
            >
              <PopoverMenuItem
                icon={<FileText className="h-4 w-4" />}
                label="Export to PDF"
                onClick={() => handleExport('pdf')}
              />
              <PopoverMenuItem
                icon={<FileSpreadsheet className="h-4 w-4" />}
                label="Export to CSV"
                onClick={() => handleExport('csv')}
              />
            </PopoverMenu>
          </div>
          <Button className="gap-2 rounded-lg px-4 py-2" onClick={openAdd}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add Patient
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border-sage p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost"
              strokeWidth={1.75}
            />
            <input
              type="search"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-full border border-border-sage bg-white py-2 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-ghost focus:border-sage focus:ring-2 focus:ring-sage-pale"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {PRAKRITI_FILTERS.map((label) => {
                const active = prakritiFilter === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setPrakritiFilter(label);
                      setPage(1);
                    }}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-sage-deep bg-sage-mist text-sage-deep'
                        : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60'
                    }`}
                  >
                    {label === 'All Patients' && active ? (
                      <SlidersHorizontal className="h-3 w-3" strokeWidth={2} />
                    ) : null}
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => {
                  setSortOpen((v) => !v);
                  setExportOpen(false);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border-sage bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-sage-mist"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
                {SORT_LABELS[sortBy]}
              </button>
              <PopoverMenu open={sortOpen} onClose={() => setSortOpen(false)} anchorRef={sortRef}>
                {SORT_OPTIONS.map((opt) => (
                  <PopoverMenuItem
                    key={opt}
                    label={SORT_LABELS[opt]}
                    active={sortBy === opt}
                    onClick={() => {
                      setSortBy(opt);
                      setSortOpen(false);
                      setPage(1);
                    }}
                  />
                ))}
              </PopoverMenu>
            </div>
          </div>
        </div>

        <PatientTable patients={pagePatients} onView={openView} onEdit={openEdit} />

        <PatientPagination
          from={from}
          to={to}
          total={filtered.length}
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <PatientFormModal
        key={`${modalMode}-${selectedPatient?.id ?? 'new'}`}
        open={modalMode === 'add' || modalMode === 'edit'}
        mode={modalMode === 'edit' ? 'edit' : 'add'}
        initial={formInitial}
        patientId={selectedPatient?.id}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default PatientsPage;
