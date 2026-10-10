import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ContentLoader } from '@/components/ui/Loader';
import { formInputClass, formLabelClass } from '@/components/ui/formStyles';
import { PopoverMenu, PopoverMenuItem } from '@/components/ui/PopoverMenu';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientPagination } from '@/components/patients/PatientPagination';
import { PatientFormModal } from '@/components/modals/PatientFormModal';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { patientDetailPath, ROUTES } from '@/constants/routes';
import type { Patient, PatientFormValues, PatientStats } from '@/types/patient.types';
import {
  emptyPatientForm,
  hmsToPatient,
  sortPatients,
  SORT_LABELS,
  type SortOption,
} from '@/utils/patientHelpers';
import { exportPatientsCsv, exportPatientsPdf } from '@/utils/patientExport';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';

const PAGE_SIZE = 6;

const SORT_OPTIONS: SortOption[] = [
  'name-asc',
  'name-desc',
  'age-asc',
  'age-desc',
  'visit-newest',
  'visit-oldest',
  'status',
];

type ModalMode = 'add' | null;

type PatientFilters = {
  registeredFrom: string;
  registeredTo: string;
  visitFrom: string;
  visitTo: string;
  ageMin: string;
  ageMax: string;
};

const emptyFilters = (): PatientFilters => ({
  registeredFrom: '',
  registeredTo: '',
  visitFrom: '',
  visitTo: '',
  ageMin: '',
  ageMax: '',
});

const defaultStats = (): PatientStats => ({ total: 0, newThisWeek: 0 });

const inDateRange = (iso: string | undefined, from: string, to: string) => {
  if (!from && !to) return true;
  if (!iso) return false;
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
};

export const PatientsPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<PatientStats>(defaultStats());
  const [listLoading, setListLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<PatientFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('visit-newest');
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formInitial, setFormInitial] = useState<PatientFormValues>(emptyPatientForm());
  const [exportOpen, setExportOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { canView, canEdit } = usePermissions();

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((v) => String(v).trim() !== '').length;
  }, [filters]);

  const setFilter = <K extends keyof PatientFilters>(key: K, value: PatientFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(emptyFilters());
    setPage(1);
  };

  const loadData = useCallback(async () => {
    setListLoading(true);
    try {
      const patRes = await patientAdminService.list();
      setPatients((patRes.data.res?.patients ?? []).map(hmsToPatient));

      const statsRes = await patientAdminService.getStats().catch(() => null);
      if (statsRes?.data.res?.stats) setStats(statsRes.data.res.stats);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setListLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    let list = [...patients];
    const q = search.trim().toLowerCase().replace(/^#/, '');
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.mobile?.includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
    }

    const ageMin = filters.ageMin.trim() === '' ? null : Number(filters.ageMin);
    const ageMax = filters.ageMax.trim() === '' ? null : Number(filters.ageMax);

    list = list.filter((p) => {
      if (!inDateRange(p.createdAtIso, filters.registeredFrom, filters.registeredTo)) return false;
      if (!inDateRange(p.lastVisitIso, filters.visitFrom, filters.visitTo)) return false;
      if (ageMin !== null && !Number.isNaN(ageMin) && p.age < ageMin) return false;
      if (ageMax !== null && !Number.isNaN(ageMax) && p.age > ageMax) return false;
      return true;
    });

    return sortPatients(list, sortBy);
  }, [patients, search, sortBy, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagePatients = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = filtered.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);

  const openAdd = () => {
    setFormInitial(emptyPatientForm());
    setModalMode('add');
  };

  const openView = (p: Patient) => {
    navigate(patientDetailPath(p.id));
  };

  const openEdit = (p: Patient) => {
    navigate(`${patientDetailPath(p.id)}#patient-info`);
  };

  const closeModal = () => setModalMode(null);

  const handleFormSubmit = async (values: PatientFormValues) => {
    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        const { data } = await patientAdminService.create(values);
        const created = data.res?.patient;
        if (created) {
          setPatients((prev) => [hmsToPatient(created), ...prev]);
          setStats((s) => ({ ...s, total: s.total + 1, newThisWeek: s.newThisWeek + 1 }));
          showToast(`Patient ${created.name} added (${created.patientCode})`, 'success');
        }
      }
      closeModal();
      await loadData();
    } catch (err) {
      showToast(
        getApiErrorMessage(err, 'Could not save patient. Check required fields and try again.'),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
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

  if (!canView('patients')) {
    return <Navigate to={ROUTES.ADMIN_ACCESS_DENIED} replace />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Patient Registry
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {stats.total.toLocaleString()} total patients · {stats.newThisWeek} new this week
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
          {canEdit('patients') ? (
            <Button className="gap-2 rounded-lg px-4 py-2" onClick={openAdd}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add Patient
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border-sage p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost"
                strokeWidth={1.75}
              />
              <input
                type="search"
                placeholder="Search by name or patient ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-full border border-border-sage bg-white py-2 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-ghost focus:border-sage focus:ring-2 focus:ring-sage-pale"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFiltersOpen((v) => !v);
                  setSortOpen(false);
                  setExportOpen(false);
                }}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-sage-mist ${
                  filtersOpen || activeFilterCount > 0
                    ? 'border-sage bg-sage-mist text-sage-deep'
                    : 'border-border-sage bg-white text-ink-soft'
                }`}
              >
                <Filter className="h-3.5 w-3.5" strokeWidth={1.75} />
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
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
              {activeFilterCount > 0 || search.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    clearFilters();
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold text-ink-ghost hover:text-ink-soft"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {filtersOpen ? (
            <div className="grid gap-3 rounded-xl border border-border-sage/80 bg-cream/40 p-3 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <p className={`${formLabelClass} !mb-2`}>Registered date</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.registeredFrom}
                    onChange={(e) => setFilter('registeredFrom', e.target.value)}
                    className={`${formInputClass} py-2 text-xs`}
                    aria-label="Registered from"
                  />
                  <input
                    type="date"
                    value={filters.registeredTo}
                    onChange={(e) => setFilter('registeredTo', e.target.value)}
                    className={`${formInputClass} py-2 text-xs`}
                    aria-label="Registered to"
                  />
                </div>
              </div>
              <div>
                <p className={`${formLabelClass} !mb-2`}>Last visit date</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.visitFrom}
                    onChange={(e) => setFilter('visitFrom', e.target.value)}
                    className={`${formInputClass} py-2 text-xs`}
                    aria-label="Last visit from"
                  />
                  <input
                    type="date"
                    value={filters.visitTo}
                    onChange={(e) => setFilter('visitTo', e.target.value)}
                    className={`${formInputClass} py-2 text-xs`}
                    aria-label="Last visit to"
                  />
                </div>
              </div>
              <div>
                <p className={`${formLabelClass} !mb-2`}>Age range</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    max={150}
                    placeholder="Min"
                    value={filters.ageMin}
                    onChange={(e) => setFilter('ageMin', e.target.value)}
                    className={`${formInputClass} py-2 text-xs`}
                    aria-label="Minimum age"
                  />
                  <input
                    type="number"
                    min={0}
                    max={150}
                    placeholder="Max"
                    value={filters.ageMax}
                    onChange={(e) => setFilter('ageMax', e.target.value)}
                    className={`${formInputClass} py-2 text-xs`}
                    aria-label="Maximum age"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {listLoading && patients.length === 0 ? (
          <ContentLoader size="md" className="border-t border-border-sage" />
        ) : (
          <PatientTable patients={pagePatients} onView={openView} onEdit={openEdit} />
        )}
        {listLoading && patients.length > 0 ? (
          <div className="flex justify-center border-t border-border-sage py-3">
            <ContentLoader size="sm" className="!py-0" />
          </div>
        ) : null}
        {!listLoading && filtered.length === 0 ? (
          <p className="border-t border-border-sage px-4 py-8 text-center text-sm text-ink-soft">
            {patients.length === 0 ? (
              <>
                No patients registered yet. Use{' '}
                <span className="font-medium text-ink">Add patient</span> to register your first
                patient.
              </>
            ) : (
              <>No patients match your search or filters.</>
            )}
          </p>
        ) : null}

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
        key="add-patient"
        open={modalMode === 'add'}
        mode="add"
        initial={formInitial}
        onClose={closeModal}
        onSubmit={(values) => {
          if (!submitting) void handleFormSubmit(values);
        }}
      />
    </div>
  );
};

export default PatientsPage;
