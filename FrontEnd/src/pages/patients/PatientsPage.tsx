import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Download, FileSpreadsheet, FileText, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
import { masterService } from '@/services/master/master.service';
import { getApiErrorMessage } from '@/utils/helpers';
import type { MasterItem } from '@/types/api.types';

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

const defaultStats = (): PatientStats => ({ total: 0, newThisWeek: 0 });

export const PatientsPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<PatientStats>(defaultStats());
  const [prakritiMasters, setPrakritiMasters] = useState<MasterItem[]>([]);
  const [treatmentMasters, setTreatmentMasters] = useState<MasterItem[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [prakritiFilter, setPrakritiFilter] = useState<string>('All Patients');
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

  const activePrakriti = useMemo(
    () => prakritiMasters.filter((p) => p.active),
    [prakritiMasters]
  );
  const activeTreatments = useMemo(
    () => treatmentMasters.filter((t) => t.active),
    [treatmentMasters]
  );

  const loadData = useCallback(async () => {
    setListLoading(true);
    try {
      const patRes = await patientAdminService.list();
      setPatients((patRes.data.res?.patients ?? []).map(hmsToPatient));

      const [statsRes, pRes, tRes] = await Promise.all([
        patientAdminService.getStats().catch(() => null),
        masterService.listPrakriti().catch(() => null),
        masterService.listTreatments().catch(() => null),
      ]);
      if (statsRes?.data.res?.stats) setStats(statsRes.data.res.stats);
      setPrakritiMasters(pRes?.data.res?.items ?? []);
      setTreatmentMasters(tRes?.data.res?.items ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setListLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const prakritiFilters = useMemo(() => {
    const fromPatients = [...new Set(patients.map((p) => p.prakriti).filter(Boolean))];
    const fromMaster = activePrakriti.map((p) => p.name);
    const unique = [...new Set([...fromPatients, ...fromMaster])];
    return ['All Patients', ...unique];
  }, [patients, activePrakriti]);

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
              {prakritiFilters.map((label) => {
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
        {listLoading ? (
          <p className="border-t border-border-sage px-4 py-2 text-center text-xs text-ink-ghost">
            Loading patients…
          </p>
        ) : null}
        {!listLoading && filtered.length === 0 ? (
          <p className="border-t border-border-sage px-4 py-8 text-center text-sm text-ink-soft">
            No patients registered yet. Use <span className="font-medium text-ink">Add patient</span> to register your first patient.
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
        prakritiOptions={activePrakriti}
        treatmentOptions={activeTreatments}
        onClose={closeModal}
        onSubmit={(values) => {
          if (!submitting) void handleFormSubmit(values);
        }}
      />
    </div>
  );
};

export default PatientsPage;
