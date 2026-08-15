import type { ReactNode } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import type {
  AppointmentClinicalNote,
  AppointmentDetail,
  AppointmentDocument,
  AppointmentVitals,
} from '@/types/appointmentDetail.types';

const TableShell = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto rounded-xl border border-border-sage">
    <table className="w-full min-w-[640px] border-collapse">{children}</table>
  </div>
);

const Th = ({ children }: { children: ReactNode }) => (
  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
    {children}
  </th>
);

export const AppointmentOverviewTab = ({ appointment }: { appointment: AppointmentDetail }) => (
  <div className="space-y-5">
    <section>
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
        Chief Complaint
      </h4>
      <p className="rounded-xl border border-border-sage bg-cream/30 px-4 py-3 text-sm leading-relaxed text-ink">
        {appointment.chiefComplaint}
      </p>
    </section>

    <section>
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
        Symptoms
      </h4>
      {appointment.symptoms.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {appointment.symptoms.map((symptom) => (
            <span
              key={symptom}
              className="rounded-full border border-sage-pale bg-sage-mist/50 px-3 py-1 text-xs font-medium text-sage-deep"
            >
              {symptom}
            </span>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-border-sage bg-cream/30 px-4 py-3 text-sm text-ink-soft">
          No symptoms recorded
        </p>
      )}
    </section>

    {appointment.diagnosis ? (
      <section>
        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          Diagnosis
        </h4>
        <p className="rounded-xl border border-border-sage bg-cream/30 px-4 py-3 text-sm text-ink">
          {appointment.diagnosis}
        </p>
      </section>
    ) : null}

    {appointment.treatmentPlan ? (
      <section>
        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          Treatment Plan
        </h4>
        <p className="rounded-xl border border-border-sage bg-cream/30 px-4 py-3 text-sm leading-relaxed text-ink-soft">
          {appointment.treatmentPlan}
        </p>
      </section>
    ) : null}

    <section>
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
        Clinical Assessment
      </h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {appointment.clinicalNotes.map((note) => (
          <ClinicalNoteCell key={note.label} note={note} />
        ))}
      </div>
    </section>

    {appointment.prepInstructions && appointment.prepInstructions.length > 0 ? (
      <section>
        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          Preparation Instructions
        </h4>
        <ul className="space-y-2 rounded-xl border border-border-sage bg-cream/30 px-4 py-3">
          {appointment.prepInstructions.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-ink-soft">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-deep" />
              {item}
            </li>
          ))}
        </ul>
      </section>
    ) : null}
  </div>
);

const ClinicalNoteCell = ({ note }: { note: AppointmentClinicalNote }) => (
  <div className="rounded-lg border border-border-sage/80 bg-white px-3 py-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{note.label}</p>
    <p className="mt-0.5 text-sm font-medium text-ink">{note.value}</p>
  </div>
);

export const AppointmentVitalsTab = ({ vitals }: { vitals?: AppointmentVitals }) => {
  if (!vitals) {
    return (
      <p className="py-10 text-center text-sm text-ink-soft">
        Vitals will be recorded at check-in
      </p>
    );
  }

  const items = [
    { label: 'Blood Pressure', value: vitals.bp },
    { label: 'Pulse', value: vitals.pulse },
    { label: 'Temperature', value: vitals.temp },
    { label: 'SpO₂', value: vitals.spo2 },
    ...(vitals.weight ? [{ label: 'Weight', value: vitals.weight }] : []),
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border-sage bg-gradient-to-br from-sage-mist/40 to-white px-4 py-4"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            {item.label}
          </p>
          <p className="mt-1 font-serif text-xl font-semibold text-sage-deep">{item.value}</p>
        </div>
      ))}
    </div>
  );
};

export const AppointmentNotesTab = ({ appointment }: { appointment: AppointmentDetail }) => (
  <div className="space-y-5">
    {appointment.doctorNotes ? (
      <section>
        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          Doctor Notes
        </h4>
        <p className="rounded-xl border border-border-sage bg-cream/30 px-4 py-3 text-sm leading-relaxed text-ink-soft">
          {appointment.doctorNotes}
        </p>
      </section>
    ) : (
      <p className="py-6 text-center text-sm text-ink-soft">No doctor notes recorded yet</p>
    )}

    {appointment.notes ? (
      <section>
        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          Appointment Notes
        </h4>
        <p className="rounded-xl border border-border-sage bg-cream/30 px-4 py-3 text-sm text-ink-soft">
          {appointment.notes}
        </p>
      </section>
    ) : null}

    {appointment.followUp ? (
      <section>
        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          Follow-up
        </h4>
        <p className="rounded-xl border border-sage-pale bg-sage-mist/30 px-4 py-3 text-sm font-medium text-sage-deep">
          {appointment.followUp}
        </p>
      </section>
    ) : null}
  </div>
);

export const AppointmentDocumentsTab = ({ documents }: { documents: AppointmentDocument[] }) => (
  <TableShell>
    <thead>
      <tr className="border-b border-border-sage bg-cream/60">
        <Th>Document</Th>
        <Th>Type</Th>
        <Th>Uploaded</Th>
        <Th>Size</Th>
        <Th>Actions</Th>
      </tr>
    </thead>
    <tbody>
      {documents.length === 0 ? (
        <tr>
          <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-soft">
            No documents attached
          </td>
        </tr>
      ) : (
        documents.map((doc) => (
          <tr
            key={doc.id}
            className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30"
          >
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-sage-deep" strokeWidth={2} />
                <span className="text-sm font-medium text-ink">{doc.name}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-ink-soft">{doc.type}</td>
            <td className="px-4 py-3 text-sm text-ink-ghost">{doc.uploadedAt}</td>
            <td className="px-4 py-3 text-sm text-ink-ghost">{doc.size}</td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                <button
                  type="button"
                  className="cursor-pointer rounded-lg p-1.5 text-ink-ghost hover:bg-sage-mist hover:text-ink"
                  aria-label={`View ${doc.name}`}
                >
                  <Eye className="h-4 w-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-lg p-1.5 text-ink-ghost hover:bg-sage-mist hover:text-ink"
                  aria-label={`Download ${doc.name}`}
                >
                  <Download className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </TableShell>
);
