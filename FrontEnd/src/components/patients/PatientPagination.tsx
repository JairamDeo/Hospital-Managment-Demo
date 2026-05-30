import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  from: number;
  to: number;
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PatientPagination = ({
  from,
  to,
  total,
  currentPage,
  totalPages,
  onPageChange,
}: Props) => {
  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, 2, 3, 'ellipsis', totalPages);
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border-sage px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-soft">
        Showing {from}–{to} of {total.toLocaleString()} patients
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border-sage bg-white text-ink-soft hover:bg-sage-mist disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1 text-sm text-ink-ghost">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-medium ${
                p === currentPage
                  ? 'bg-sage-deep text-white'
                  : 'border border-transparent text-ink-soft hover:bg-sage-mist'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border-sage bg-white text-ink-soft hover:bg-sage-mist disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
