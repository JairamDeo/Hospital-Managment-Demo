import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  addFormDraft,
  type FormDraftEntry,
  getDraftUserKey,
  listFormDrafts,
  getFormDraft,
  removeFormDraft,
  removeFormDraftsByContext,
  updateFormDraft,
} from '@/store/formDraftStorage';

interface UseFormDraftOptions<T> {
  /** Filter listed drafts to this context. Omit to list all drafts in the category. */
  contextKey?: string;
  buildLabel: (data: T) => string;
}

interface SaveDraftMeta {
  contextKey?: string;
  asNew?: boolean;
}

export const useFormDraft = <T>(category: string, options: UseFormDraftOptions<T>) => {
  const { user } = useAuth();
  const userKey = getDraftUserKey(user);
  const { contextKey = '', buildLabel } = options;

  const [drafts, setDrafts] = useState<FormDraftEntry<T>[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  const refreshDrafts = useCallback(() => {
    setDrafts(listFormDrafts<T>(userKey, category, contextKey || undefined));
  }, [userKey, category, contextKey]);

  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);

  const saveDraft = useCallback(
    (data: T, meta?: SaveDraftMeta) => {
      const label = buildLabel(data);
      const key = meta?.contextKey ?? contextKey ?? '';
      if (activeDraftId && !meta?.asNew) {
        updateFormDraft(userKey, category, activeDraftId, data, label);
      } else {
        addFormDraft(userKey, category, data, label, key);
        if (meta?.asNew) setActiveDraftId(null);
      }
      refreshDrafts();
    },
    [activeDraftId, buildLabel, category, contextKey, refreshDrafts, userKey]
  );

  const saveNewDraft = useCallback(
    (data: T, meta?: SaveDraftMeta) => {
      addFormDraft(userKey, category, data, buildLabel(data), meta?.contextKey ?? contextKey ?? '');
      setActiveDraftId(null);
      refreshDrafts();
    },
    [buildLabel, category, contextKey, refreshDrafts, userKey]
  );

  const restoreDraft = useCallback(
    (entryId: string): T | null => {
      const entry = getFormDraft<T>(userKey, category, entryId);
      if (!entry) return null;
      setActiveDraftId(entryId);
      return entry.data;
    },
    [category, userKey]
  );

  const discardDraft = useCallback(
    (entryId: string) => {
      removeFormDraft(userKey, category, entryId);
      if (activeDraftId === entryId) setActiveDraftId(null);
      refreshDrafts();
    },
    [activeDraftId, category, refreshDrafts, userKey]
  );

  const clearDraftAfterSubmit = useCallback(
    (submitContextKey?: string) => {
      if (activeDraftId) {
        removeFormDraft(userKey, category, activeDraftId);
        setActiveDraftId(null);
      }
      const key = submitContextKey ?? contextKey;
      if (key) {
        removeFormDraftsByContext(userKey, category, key);
      }
      refreshDrafts();
    },
    [activeDraftId, category, contextKey, refreshDrafts, userKey]
  );

  const startNewDraft = useCallback(() => {
    setActiveDraftId(null);
  }, []);

  return {
    drafts,
    hasDrafts: drafts.length > 0,
    activeDraftId,
    saveDraft,
    saveNewDraft,
    restoreDraft,
    discardDraft,
    clearDraftAfterSubmit,
    startNewDraft,
    refreshDrafts,
  };
};
