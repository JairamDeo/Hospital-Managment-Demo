import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { DoorOpen, FlaskConical, Leaf, Pencil, Plus, Soup, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { LabMasterPanel } from '@/components/master-data/LabMasterPanel';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { masterService } from '@/services/master/master.service';
import { getApiErrorMessage } from '@/utils/helpers';
import { ROUTES } from '@/constants/routes';
import type { MasterItem, PharmacySpoonItem, RoomMasterItem } from '@/types/api.types';

type Tab = 'prakriti' | 'treatment' | 'pharmacySpoon' | 'room' | 'lab';

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

const RoomCard = ({
  item,
  busy,
  onEdit,
  onToggle,
}: {
  item: RoomMasterItem;
  busy: boolean;
  onEdit: (item: RoomMasterItem) => void;
  onToggle: (id: string, active: boolean) => void;
}) => (
  <div
    className={`rounded-xl border p-4 shadow-sm ${
      item.active ? 'border-border-sage bg-white' : 'border-border-sage/60 bg-cream/40 opacity-80'
    }`}
  >
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{item.code}</p>
    <p className="mt-1 font-serif text-lg font-semibold text-ink">{item.name}</p>
    <p className="mt-1 text-sm text-ink-soft">
      #{item.roomNumber} · {item.roomType} · Cap. {item.capacity}
    </p>
    <p className="mt-1 text-xs text-ink-ghost">{item.active ? 'Active' : 'Inactive'}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        className="h-8 gap-1 px-3 text-xs"
        disabled={busy}
        onClick={() => onEdit(item)}
      >
        <Pencil className="h-3 w-3" />
        Edit
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="h-8 px-3 text-xs"
        disabled={busy}
        onClick={() => onToggle(item._id, !item.active)}
      >
        Mark {item.active ? 'inactive' : 'active'}
      </Button>
    </div>
  </div>
);

const SpoonCard = ({
  item,
  onSetDefault,
  settingDefault,
}: {
  item: PharmacySpoonItem;
  onSetDefault: (id: string) => void;
  settingDefault: boolean;
}) => (
  <div
    className={`rounded-xl border p-4 shadow-sm ${
      item.isDefault ? 'border-sage-deep bg-sage-mist/40' : 'border-border-sage bg-white'
    }`}
  >
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{item.code}</p>
    <p className="mt-1 font-serif text-lg font-semibold text-ink">{item.name}</p>
    <p className="mt-1 text-sm text-ink-soft">{item.grams} g per spoon</p>
    {item.isDefault ? (
      <p className="mt-2 text-xs font-semibold text-sage-deep">Default for all churan</p>
    ) : (
      <Button
        type="button"
        variant="secondary"
        className="mt-3 h-8 px-3 text-xs"
        disabled={settingDefault}
        onClick={() => onSetDefault(item._id)}
      >
        Set as default
      </Button>
    )}
  </div>
);

const TAB_LABELS: Record<Tab, string> = {
  prakriti: 'Prakriti',
  treatment: 'Treatment',
  pharmacySpoon: 'Spoon Size',
  room: 'Room',
  lab: 'Lab Tests',
};

const emptyRoomForm = () => ({
  roomNumber: '',
  name: '',
  roomType: 'Panchakarma' as 'IPD' | 'Panchakarma',
  capacity: '1',
  active: true,
});

export const MasterDataPage = () => {
  const [tab, setTab] = useState<Tab>('prakriti');
  const { canView, canEdit } = usePermissions();
  const [prakriti, setPrakriti] = useState<MasterItem[]>([]);
  const [treatments, setTreatments] = useState<MasterItem[]>([]);
  const [pharmacySpoons, setPharmacySpoons] = useState<PharmacySpoonItem[]>([]);
  const [rooms, setRooms] = useState<RoomMasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRoomOpen, setEditRoomOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState('');
  const [name, setName] = useState('');
  const [grams, setGrams] = useState('');
  const [roomForm, setRoomForm] = useState(emptyRoomForm());
  const [saving, setSaving] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState('');
  const [busyRoomId, setBusyRoomId] = useState('');
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes, sRes, rRes] = await Promise.all([
        masterService.listPrakriti(),
        masterService.listTreatments(),
        masterService.listPharmacySpoons(),
        masterService.listRooms(),
      ]);
      setPrakriti(pRes.data.res?.items ?? []);
      setTreatments(tRes.data.res?.items ?? []);
      setPharmacySpoons(sRes.data.res?.items ?? []);
      setRooms(rRes.data.res?.items ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const resetCreateModal = () => {
    setName('');
    setGrams('');
    setRoomForm(emptyRoomForm());
  };

  const openEditRoom = (item: RoomMasterItem) => {
    setEditingRoomId(item._id);
    setRoomForm({
      roomNumber: item.roomNumber,
      name: item.name,
      roomType: item.roomType,
      capacity: String(item.capacity),
      active: item.active !== false,
    });
    setEditRoomOpen(true);
  };

  const validateRoomForm = () => {
    if (!roomForm.roomNumber.trim() || !roomForm.name.trim()) {
      showToast('Room number and name are required', 'error');
      return false;
    }
    const cap = Number(roomForm.capacity);
    if (!Number.isFinite(cap) || cap < 1) {
      showToast('Capacity must be at least 1', 'error');
      return false;
    }
    return true;
  };

  const handleSetDefaultSpoon = async (id: string) => {
    setSettingDefaultId(id);
    try {
      const { data } = await masterService.setDefaultPharmacySpoon(id);
      if (data.res?.item) {
        setPharmacySpoons((prev) =>
          prev.map((s) => ({ ...s, isDefault: s._id === data.res!.item._id }))
        );
      }
      showToast('Default spoon size updated', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSettingDefaultId('');
    }
  };

  const handleToggleRoom = async (id: string, active: boolean) => {
    setBusyRoomId(id);
    try {
      const { data } = await masterService.updateRoom(id, { active });
      if (data.res?.item) {
        setRooms((prev) => prev.map((r) => (r._id === id ? data.res!.item : r)));
      }
      showToast(`Room marked ${active ? 'active' : 'inactive'}`, 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setBusyRoomId('');
    }
  };

  const handleSaveRoomEdit = async () => {
    if (!editingRoomId || !validateRoomForm()) return;
    setSaving(true);
    try {
      const { data } = await masterService.updateRoom(editingRoomId, {
        roomNumber: roomForm.roomNumber.trim(),
        name: roomForm.name.trim(),
        roomType: roomForm.roomType,
        capacity: Number(roomForm.capacity),
        active: roomForm.active,
      });
      if (data.res?.item) {
        setRooms((prev) => prev.map((r) => (r._id === editingRoomId ? data.res!.item : r)));
      }
      showToast(data.message || 'Room updated', 'success');
      setEditRoomOpen(false);
      setEditingRoomId('');
      setRoomForm(emptyRoomForm());
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (tab === 'room') {
      if (!validateRoomForm()) return;
    } else if (!trimmed) {
      showToast('Name is required', 'error');
      return;
    }
    if (tab === 'pharmacySpoon') {
      const value = Number(grams);
      if (!grams.trim() || Number.isNaN(value) || value <= 0) {
        showToast('Enter spoon size in grams', 'error');
        return;
      }
    }
    setSaving(true);
    try {
      if (tab === 'room') {
        const { data } = await masterService.createRoom({
          roomNumber: roomForm.roomNumber.trim(),
          name: roomForm.name.trim(),
          roomType: roomForm.roomType,
          capacity: Number(roomForm.capacity),
        });
        if (data.res?.item) setRooms((prev) => [...prev, data.res!.item]);
        showToast(data.message || 'Room created', 'success');
      } else if (tab === 'prakriti') {
        const { data } = await masterService.createPrakriti(trimmed);
        if (data.res?.item) setPrakriti((prev) => [...prev, data.res!.item]);
        showToast(data.message || 'Prakriti created', 'success');
      } else if (tab === 'treatment') {
        const { data } = await masterService.createTreatment(trimmed);
        if (data.res?.item) setTreatments((prev) => [...prev, data.res!.item]);
        showToast(data.message || 'Treatment created', 'success');
      } else {
        const { data } = await masterService.createPharmacySpoon({
          name: trimmed,
          grams: Number(grams),
        });
        if (data.res?.item) setPharmacySpoons((prev) => [...prev, data.res!.item]);
        showToast(data.message || 'Spoon size created', 'success');
      }
      resetCreateModal();
      setCreateOpen(false);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const items = tab === 'prakriti' ? prakriti : tab === 'treatment' ? treatments : [];

  const emptyLabel =
    tab === 'prakriti' ? 'prakriti' : tab === 'treatment' ? 'treatments' : tab === 'room' ? 'rooms' : 'spoon sizes';

  const placeholder =
    tab === 'pharmacySpoon'
      ? 'e.g. 1.5 gram spoon'
      : tab === 'room'
        ? 'e.g. Panchakarma Suite A'
        : tab === 'prakriti'
          ? 'e.g. Vata'
          : 'e.g. General Consult';

  const tabs: { id: Tab; label: string; icon: typeof Leaf }[] = [
    { id: 'prakriti', label: 'Prakriti', icon: Leaf },
    { id: 'treatment', label: 'Treatment', icon: Stethoscope },
    { id: 'room', label: 'Room', icon: DoorOpen },
    { id: 'pharmacySpoon', label: 'Spoon Size', icon: Soup },
    { id: 'lab', label: 'Lab Tests', icon: FlaskConical },
  ];

  const roomFields = (
    <>
      <Input
        label="Room number"
        value={roomForm.roomNumber}
        onChange={(e) => setRoomForm((f) => ({ ...f, roomNumber: e.target.value }))}
        placeholder="e.g. PK-01, IPD-01"
      />
      <Input
        label="Room name"
        value={roomForm.name}
        onChange={(e) => setRoomForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="e.g. Panchakarma Room A"
      />
      <div>
        <label className={formLabelClass}>Room type</label>
        <select
          className={formSelectClass}
          value={roomForm.roomType}
          onChange={(e) =>
            setRoomForm((f) => ({ ...f, roomType: e.target.value as 'IPD' | 'Panchakarma' }))
          }
        >
          <option value="Panchakarma">Panchakarma</option>
          <option value="IPD">IPD</option>
        </select>
      </div>
      <Input
        label="Capacity (max patients)"
        type="number"
        min={1}
        value={roomForm.capacity}
        onChange={(e) => setRoomForm((f) => ({ ...f, capacity: e.target.value }))}
        placeholder="e.g. 5"
      />
    </>
  );

  if (!canView('masterData')) {
    return <Navigate to={ROUTES.ADMIN_ACCESS_DENIED} replace />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Master Data
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Prakriti, treatments, rooms, spoon sizes, and lab test catalog
          </p>
        </div>
        {tab !== 'lab' && canEdit('masterData') ? (
          <Button className="gap-2 rounded-lg px-4 py-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add {TAB_LABELS[tab]}
          </Button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id
                ? 'border-sage-deep bg-sage-mist text-sage-deep'
                : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60'
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'room' ? (
        <p className="mb-3 text-xs text-ink-soft">
          IPD rooms for admissions; Panchakarma rooms in therapy scheduling. Capacity = max
          patients per room.
        </p>
      ) : null}
      {tab === 'pharmacySpoon' ? (
        <p className="mb-3 text-xs text-ink-soft">
          Default spoon is used for all powder/churan billing. Mark one as default.
        </p>
      ) : null}

      {tab === 'lab' ? (
        <LabMasterPanel />
      ) : loading ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : tab === 'pharmacySpoon' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pharmacySpoons.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-ink-soft">
              No spoon sizes yet. Add 1 g and 1.5 g options above.
            </p>
          ) : (
            pharmacySpoons.map((item) => (
              <SpoonCard
                key={item._id}
                item={item}
                settingDefault={settingDefaultId === item._id}
                onSetDefault={handleSetDefaultSpoon}
              />
            ))
          )}
        </div>
      ) : tab === 'room' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-ink-soft">
              No rooms yet. Add IPD or Panchakarma rooms above.
            </p>
          ) : (
            rooms.map((item) => (
              <RoomCard
                key={item._id}
                item={item}
                busy={busyRoomId === item._id || saving}
                onEdit={openEditRoom}
                onToggle={handleToggleRoom}
              />
            ))
          )}
        </div>
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
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetCreateModal();
        }}
        title={`Add ${TAB_LABELS[tab]}`}
        subtitle="Code will be generated automatically"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={saving}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {tab === 'room' ? (
            roomFields
          ) : (
            <>
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={placeholder}
              />
              {tab === 'pharmacySpoon' ? (
                <Input
                  label="Grams per spoon"
                  type="number"
                  min={0.01}
                  step="any"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  placeholder="e.g. 1.5"
                />
              ) : null}
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={editRoomOpen}
        onClose={() => {
          setEditRoomOpen(false);
          setEditingRoomId('');
          setRoomForm(emptyRoomForm());
        }}
        title="Edit room"
        subtitle="Update room details, type, capacity or status"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditRoomOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoomEdit} isLoading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {roomFields}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="room-active"
              type="checkbox"
              checked={roomForm.active}
              onChange={(e) => setRoomForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-border-sage text-sage-deep"
            />
            <label htmlFor="room-active" className="text-sm font-medium text-ink">
              Room is active (available for IPD / Panchakarma)
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MasterDataPage;
