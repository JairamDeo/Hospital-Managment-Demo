import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, BedDouble, Users, DoorOpen, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formLabelClass, formSelectClass, formTextareaClass } from '@/components/ui/formStyles';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { useAdminPatientsList } from '@/hooks/useAdminPatientsList';
import { ipdAdminService } from '@/services/ipd/ipdAdmin.service';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import { ipdAdmissionDetailPath } from '@/constants/routes';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  formatDoctorLabel,
  formatIpdDateTime,
  roomOccupancyPercent,
} from '@/utils/ipdHelpers';
import type {
  AdmitPatientFormValues,
  IpdAdmission,
  IpdAdmissionStatus,
  IpdRoom,
} from '@/types/ipd.types';

const emptyAdmitForm = (): AdmitPatientFormValues => ({
  patientId: '',
  roomCode: '',
  doctorId: '',
  admittedAt: new Date().toISOString().slice(0, 16),
  expectedDischargeAt: '',
  diagnosis: '',
  chiefComplaint: '',
});

type StatusFilter = 'Admitted' | 'Discharged' | 'all';

const RoomOccupancyCard = ({ room }: { room: IpdRoom }) => {
  const pct = roomOccupancyPercent(room.occupied, room.capacity);
  return (
    <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{room.name}</p>
          <p className="text-[11px] text-ink-soft">#{room.roomNumber}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            room.status === 'Full'
              ? 'bg-danger-bg text-danger'
              : room.status === 'Partial'
                ? 'bg-warning-bg text-warning'
                : 'bg-success-bg text-success'
          }`}
        >
          {room.status}
        </span>
      </div>
      <p className="mt-3 font-serif text-xl font-bold text-ink">
        {room.occupied}
        <span className="text-base font-normal text-ink-soft"> / {room.capacity} beds</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sage-mist">
        <div
          className={`h-full rounded-full transition-all ${
            room.status === 'Full' ? 'bg-danger' : room.status === 'Partial' ? 'bg-warning' : 'bg-success'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        {room.available} bed{room.available !== 1 ? 's' : ''} available
      </p>
    </div>
  );
};

export const IpdPage = () => {
  const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
  const [rooms, setRooms] = useState<IpdRoom[]>([]);
  const [doctors, setDoctors] = useState<Array<{ staffCode: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [admitForm, setAdmitForm] = useState(emptyAdmitForm());
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Admitted');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { canEdit } = usePermissions();
  const { patients } = useAdminPatientsList();
  const canManage = canEdit('ipd');

  const availableRooms = useMemo(
    () => rooms.filter((r) => r.status !== 'Full' && r.available > 0),
    [rooms]
  );

  const totals = useMemo(() => {
    const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
    const totalOccupied = rooms.reduce((s, r) => s + r.occupied, 0);
    const availableBeds = rooms.reduce((s, r) => s + r.available, 0);
    const admittedCount = admissions.filter((a) => a.status === 'Admitted').length;
    return { totalCapacity, totalOccupied, availableBeds, admittedCount, roomCount: rooms.length };
  }, [rooms, admissions]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam =
        statusFilter === 'all' ? undefined : (statusFilter as IpdAdmissionStatus);
      const [admRes, roomsRes, docRes] = await Promise.all([
        ipdAdminService.listAdmissions(statusParam),
        ipdAdminService.listRooms(),
        appointmentAdminService.listDoctors(),
      ]);
      setAdmissions(admRes.data.res?.admissions ?? []);
      setRooms(roomsRes.data.res?.rooms ?? []);
      setDoctors(docRes.data.res?.doctors ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredAdmissions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return admissions.filter((a) => {
      if (roomFilter && a.roomCode !== roomFilter) return false;
      if (doctorFilter && a.staffCode !== doctorFilter) return false;
      if (!q) return true;
      return (
        a.patientName.toLowerCase().includes(q) ||
        a.patientCode.toLowerCase().includes(q) ||
        a.admissionCode.toLowerCase().includes(q) ||
        a.roomName.toLowerCase().includes(q)
      );
    });
  }, [admissions, search, roomFilter, doctorFilter]);

  const openAdmit = () => {
    const form = emptyAdmitForm();
    if (availableRooms[0]) form.roomCode = availableRooms[0].roomCode;
    setAdmitForm(form);
    setAdmitOpen(true);
  };

  const handleAdmit = async () => {
    if (!admitForm.patientId || !admitForm.roomCode || !admitForm.doctorId || !admitForm.admittedAt) {
      showToast('Patient, room, doctor and admission date/time are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await ipdAdminService.admit(admitForm);
      showToast(data.message || 'Patient admitted', 'success');
      setAdmitOpen(false);
      await load();
      if (data.res?.admission?.admissionCode) {
        navigate(ipdAdmissionDetailPath(data.res.admission.admissionCode));
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">IPD</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Ward admissions, per-room bed capacity, daily records and discharge
          </p>
        </div>
        {canManage ? (
          <Button className="gap-2" onClick={openAdmit}>
            <Plus className="h-4 w-4" />
            Admit Patient
          </Button>
        ) : null}
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-ink-ghost">
            <Users className="h-4 w-4" />
            <p className="text-[10px] font-bold uppercase tracking-wider">Admitted now</p>
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-ink">{totals.admittedCount}</p>
          <p className="mt-1 text-xs text-ink-soft">Active in-patients</p>
        </div>
        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-ink-ghost">
            <BedDouble className="h-4 w-4" />
            <p className="text-[10px] font-bold uppercase tracking-wider">All wards combined</p>
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-ink">
            {totals.totalOccupied} / {totals.totalCapacity}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {totals.availableBeds} beds free across {totals.roomCount} room
            {totals.roomCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm sm:col-span-2">
          <div className="mb-2 flex items-center gap-2 text-ink-ghost">
            <DoorOpen className="h-4 w-4" />
            <p className="text-[10px] font-bold uppercase tracking-wider">Bed status by room</p>
          </div>
          {rooms.length === 0 ? (
            <p className="text-xs text-ink-soft">Add IPD rooms in Master Data.</p>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {rooms.map((r) => (
                <span key={r.roomCode} className="text-ink">
                  <span className="font-medium">{r.name}:</span>{' '}
                  <span className="text-ink-soft">
                    {r.occupied}/{r.capacity}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {rooms.length > 0 ? (
        <div className="mb-5">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            Room occupancy
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((r) => (
              <RoomOccupancyCard key={r.roomCode} room={r} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border-sage bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[200px] flex-1">
          <label className={formLabelClass}>Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost" />
            <input
              type="search"
              placeholder="Patient, ID or admission code…"
              className={`${formSelectClass} pl-9`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="min-w-[140px]">
          <label className={formLabelClass}>Status</label>
          <select
            className={formSelectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="Admitted">Admitted</option>
            <option value="Discharged">Discharged</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className={formLabelClass}>Room</label>
          <select
            className={formSelectClass}
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="">All rooms</option>
            {rooms.map((r) => (
              <option key={r.roomCode} value={r.roomCode}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className={formLabelClass}>Doctor</label>
          <select
            className={formSelectClass}
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
          >
            <option value="">All doctors</option>
            {doctors.map((d) => (
              <option key={d.staffCode} value={d.staffCode}>
                {formatDoctorLabel(d.name)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-0 overflow-hidden rounded-xl border border-border-sage bg-white">
        <div className="flex items-center justify-between border-b border-border-sage px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Admissions</h2>
          <span className="text-xs text-ink-soft">{filteredAdmissions.length} records</span>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-ink-soft">Loading…</p>
        ) : filteredAdmissions.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">No admissions match your filters.</p>
        ) : (
          <div className="divide-y divide-border-sage/80">
            {filteredAdmissions.map((a) => (
              <Link
                key={a.admissionCode}
                to={ipdAdmissionDetailPath(a.admissionCode)}
                className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-sage-mist/40"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${a.avatarClass}`}
                >
                  {a.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{a.patientName}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        a.status === 'Admitted'
                          ? 'bg-success-bg text-success'
                          : 'bg-sage-mist text-ink-soft'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p className="truncate text-xs text-ink-soft">
                    {a.roomName} · {formatDoctorLabel(a.doctorName)} ·{' '}
                    {formatIpdDateTime(a.admittedAt)}
                  </p>
                  {a.chiefComplaint ? (
                    <p className="mt-0.5 truncate text-xs text-ink-ghost">
                      Reason: {a.chiefComplaint}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden rounded-full bg-sage-mist px-2 py-0.5 text-[10px] font-semibold text-sage-deep sm:inline">
                    {a.admissionCode}
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-ghost" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={admitOpen}
        onClose={() => setAdmitOpen(false)}
        title="Admit Patient"
        subtitle="Select room with available beds — capacity is checked automatically"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdmitOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdmit} isLoading={submitting}>
              Admit
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={formLabelClass}>Patient *</label>
            <select
              className={formSelectClass}
              value={admitForm.patientId}
              onChange={(e) => setAdmitForm((f) => ({ ...f, patientId: e.target.value }))}
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={formLabelClass}>IPD Room *</label>
            <select
              className={formSelectClass}
              value={admitForm.roomCode}
              onChange={(e) => setAdmitForm((f) => ({ ...f, roomCode: e.target.value }))}
            >
              {availableRooms.length === 0 ? (
                <option value="">No beds available</option>
              ) : (
                availableRooms.map((r) => (
                  <option key={r.roomCode} value={r.roomCode}>
                    {r.name} — {r.available}/{r.capacity} beds free
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className={formLabelClass}>Attending Doctor *</label>
            <select
              className={formSelectClass}
              value={admitForm.doctorId}
              onChange={(e) => setAdmitForm((f) => ({ ...f, doctorId: e.target.value }))}
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.staffCode} value={d.staffCode}>
                  {formatDoctorLabel(d.name)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={formLabelClass}>Admission date & time *</label>
            <input
              type="datetime-local"
              className={formSelectClass}
              value={admitForm.admittedAt}
              onChange={(e) => setAdmitForm((f) => ({ ...f, admittedAt: e.target.value }))}
            />
          </div>
          <div>
            <label className={formLabelClass}>Expected discharge</label>
            <input
              type="datetime-local"
              className={formSelectClass}
              value={admitForm.expectedDischargeAt}
              onChange={(e) => setAdmitForm((f) => ({ ...f, expectedDischargeAt: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Provisional diagnosis"
              value={admitForm.diagnosis}
              onChange={(e) => setAdmitForm((f) => ({ ...f, diagnosis: e.target.value }))}
              placeholder="e.g. Amavata (RA), Prameha"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={formLabelClass}>Reason for admit</label>
            <textarea
              className={formTextareaClass}
              rows={2}
              value={admitForm.chiefComplaint}
              onChange={(e) => setAdmitForm((f) => ({ ...f, chiefComplaint: e.target.value }))}
              placeholder="Main symptoms when patient came — e.g. severe knee pain & swelling for 5 days"
            />
            <p className="mt-1 text-xs text-ink-ghost">
              Why the patient needs in-patient care (symptoms, duration, severity).
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IpdPage;
