import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Eye, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { staffProfileService } from '@/services/staff/staffProfile.service';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/helpers';
import type { StaffDocumentRecord } from '@/types/staffProfile.types';

interface Props {
  staffCode: string;
  canUpload: boolean;
}

export const StaffDocumentsPanel = ({ staffCode, canUpload }: Props) => {
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<StaffDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await staffProfileService.listDocuments(staffCode);
      setDocuments(data.res?.documents ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [staffCode, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openBlob = async (docId: string, name: string, viewOnly: boolean) => {
    try {
      const res = await staffProfileService.downloadDocument(staffCode, docId);
      const blob = new Blob([res.data], {
        type: String(res.headers['content-type'] ?? 'application/octet-stream'),
      });
      const url = URL.createObjectURL(blob);
      if (viewOnly) {
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      showToast('Choose a file to upload', 'error');
      return;
    }
    setUploading(true);
    try {
      await staffProfileService.uploadDocument(staffCode, file, title);
      showToast('Document uploaded', 'success');
      setTitle('');
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-ink-soft">Loading documents…</p>;
  }

  return (
    <div className="space-y-4">
      {canUpload ? (
        <div className="rounded-xl border border-border-sage bg-cream/30 p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Upload document</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Input
                placeholder="Document title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                className="block w-full text-sm text-ink-soft file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-sage-mist file:px-3 file:py-2 file:text-sm file:font-semibold file:text-sage-deep"
              />
            </div>
            <Button className="gap-2 shrink-0" onClick={handleUpload} disabled={uploading}>
              <Upload className="h-4 w-4" strokeWidth={2} />
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      ) : null}

      {documents.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-border-sage bg-cream/30 px-4 py-3 transition-colors hover:bg-sage-mist/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sage-deep ring-1 ring-border-sage">
                <FileText className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{doc.name}</p>
                <p className="text-xs text-ink-ghost">
                  {doc.type} · {doc.uploadedAt} · {doc.size}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-white hover:text-ink-soft"
                  aria-label={`View ${doc.name}`}
                  onClick={() => void openBlob(doc.id, doc.name, true)}
                >
                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-white hover:text-ink-soft"
                  aria-label={`Download ${doc.name}`}
                  onClick={() => void openBlob(doc.id, doc.name, false)}
                >
                  <Download className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
