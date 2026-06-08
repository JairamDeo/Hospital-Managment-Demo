import type { AdminUser } from '@/types/api.types';

const FORM_DRAFT_PREFIX = 'hms_form_drafts';
const MAX_DRAFTS_PER_CATEGORY = 30;

export interface FormDraftEntry<T> {
  id: string;
  label: string;
  contextKey: string;
  data: T;
  savedAt: string;
}

const collectionKey = (userKey: string, category: string) =>
  `${FORM_DRAFT_PREFIX}:${userKey}:${category}`;

export const getDraftUserKey = (user: AdminUser | null | undefined): string => {
  if (!user) return 'anonymous';
  return user.staffCode ?? user._id ?? user.userCode ?? 'anonymous';
};

const loadCollection = <T>(userKey: string, category: string): FormDraftEntry<T>[] => {
  try {
    const raw = localStorage.getItem(collectionKey(userKey, category));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FormDraftEntry<T>[];
    return Array.isArray(parsed) ? parsed.filter((e) => e?.id && e?.data && e?.savedAt) : [];
  } catch {
    return [];
  }
};

const saveCollection = <T>(userKey: string, category: string, entries: FormDraftEntry<T>[]) => {
  localStorage.setItem(collectionKey(userKey, category), JSON.stringify(entries));
};

export const listFormDrafts = <T>(
  userKey: string,
  category: string,
  contextKey?: string
): FormDraftEntry<T>[] => {
  const rows = loadCollection<T>(userKey, category);
  const filtered = contextKey ? rows.filter((row) => row.contextKey === contextKey) : rows;
  return filtered.sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
};

export const getFormDraft = <T>(
  userKey: string,
  category: string,
  entryId: string
): FormDraftEntry<T> | null =>
  loadCollection<T>(userKey, category).find((row) => row.id === entryId) ?? null;

export const addFormDraft = <T>(
  userKey: string,
  category: string,
  data: T,
  label: string,
  contextKey = ''
): FormDraftEntry<T> => {
  const entry: FormDraftEntry<T> = {
    id: crypto.randomUUID(),
    label: label.trim() || 'Draft',
    contextKey,
    data,
    savedAt: new Date().toISOString(),
  };
  const next = [entry, ...loadCollection<T>(userKey, category)].slice(0, MAX_DRAFTS_PER_CATEGORY);
  saveCollection(userKey, category, next);
  return entry;
};

export const updateFormDraft = <T>(
  userKey: string,
  category: string,
  entryId: string,
  data: T,
  label?: string
): FormDraftEntry<T> | null => {
  const rows = loadCollection<T>(userKey, category);
  const index = rows.findIndex((row) => row.id === entryId);
  if (index < 0) return null;

  const updated: FormDraftEntry<T> = {
    ...rows[index],
    data,
    label: label?.trim() || rows[index].label,
    savedAt: new Date().toISOString(),
  };
  rows[index] = updated;
  saveCollection(userKey, category, rows);
  return updated;
};

export const removeFormDraft = (userKey: string, category: string, entryId: string): void => {
  saveCollection(
    userKey,
    category,
    loadCollection(userKey, category).filter((row) => row.id !== entryId)
  );
};

export const removeFormDraftsByContext = (
  userKey: string,
  category: string,
  contextKey: string
): void => {
  if (!contextKey) return;
  saveCollection(
    userKey,
    category,
    loadCollection(userKey, category).filter((row) => row.contextKey !== contextKey)
  );
};

export const formatDraftSavedAt = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const FORM_DRAFT_CATEGORIES = {
  medicineBill: 'medicine-bill',
  medicineBillModal: 'medicine-bill-modal',
  appointmentAttend: 'appointment-attend',
  appointmentFollowUp: 'appointment-follow-up',
  panchakarmaAttend: 'panchakarma-attend',
  panchakarmaTreatment: 'panchakarma-treatment',
  prescription: 'prescription',
} as const;

export const draftContextKeys = {
  appointment: (appointmentCode: string) => appointmentCode,
  program: (programCode: string) => programCode,
  prescription: (patientCode: string, appointmentCode?: string) =>
    `${patientCode}:${appointmentCode || 'general'}`,
  patient: (patientCode: string) => patientCode,
} as const;

/** @deprecated use FORM_DRAFT_CATEGORIES */
export const FORM_DRAFT_IDS = FORM_DRAFT_CATEGORIES;
