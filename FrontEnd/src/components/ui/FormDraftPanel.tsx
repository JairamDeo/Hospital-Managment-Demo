import { FileClock } from 'lucide-react';
import { formatDraftSavedAt } from '@/store/formDraftStorage';

export interface FormDraftListItem {
  id: string;
  label: string;
  savedAt: string;
}

interface Props {
  drafts: FormDraftListItem[];
  activeDraftId?: string | null;
  onRestore: (id: string) => void;
  onDiscard: (id: string) => void;
}

export const FormDraftPanel = ({ drafts, activeDraftId, onRestore, onDiscard }: Props) => {
  if (!drafts.length) return null;

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <FileClock className="h-4 w-4 shrink-0 text-amber-700" strokeWidth={2} />
        <p className="text-sm font-medium text-ink">
          Saved drafts ({drafts.length})
        </p>
      </div>
      <ul className="space-y-2">
        {drafts.map((draft) => {
          const isActive = activeDraftId === draft.id;
          return (
            <li
              key={draft.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                isActive
                  ? 'border-sage-deep/40 bg-white'
                  : 'border-amber-200/60 bg-white/70'
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {draft.label}
                  {isActive ? (
                    <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-sage-deep">
                      · editing
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-ink-soft">{formatDraftSavedAt(draft.savedAt)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onRestore(draft.id)}
                  className="cursor-pointer rounded-lg border border-border-sage bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-sage-mist/40"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => onDiscard(draft.id)}
                  className="cursor-pointer px-2 py-1 text-xs font-medium text-ink-ghost hover:text-danger"
                >
                  Discard
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
