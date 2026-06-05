import moment from 'moment';
import { getInitialsFromName, pickAvatarClass } from './staffDisplay.util.js';

export const getInvoiceDisplayStatus = (invoice) => {
  if (invoice.status === 'Paid') return 'Paid';
  const daysOld = moment().diff(invoice.createdAt, 'days');
  if (daysOld > 7) return 'Overdue';
  return 'Pending';
};

export const formatHmsInvoice = (doc) => {
  const inv = doc.toObject ? doc.toObject() : { ...doc };
  const displayStatus = getInvoiceDisplayStatus(inv);

  const lineItems = (inv.lineItems ?? []).map((li, index) => ({
    id: String(li._id ?? `li-${index}`),
    description: li.description,
    qty: li.quantity,
    rate: li.unitPrice,
    amount: li.amount,
  }));

  const treatment =
    inv.feeType === 'Medicine'
      ? 'Medicine / Pharmacy'
      : inv.description || `${inv.visitType || 'Consultation'} fee`;

  return {
    _id: String(inv._id),
    invoiceCode: inv.invoiceCode,
    id: inv.invoiceCode,
    patientCode: inv.patientCode,
    patientId: inv.patientCode,
    patientName: inv.patientName,
    initials: getInitialsFromName(inv.patientName),
    avatarClass: pickAvatarClass(inv.patientName),
    feeType: inv.feeType,
    visitType: inv.visitType || null,
    appointmentCode: inv.appointmentCode || null,
    doctorName: inv.doctorName || '',
    doctor: inv.doctorName || '—',
    description: inv.description,
    treatment,
    date: moment(inv.createdAt).format('MMM D, YYYY'),
    dateIso: moment(inv.createdAt).format('YYYY-MM-DD'),
    dueDate: moment(inv.createdAt).add(7, 'days').format('MMM D, YYYY'),
    amount: inv.amount,
    status: displayStatus,
    paymentStatus: inv.status,
    paymentMethod: inv.paymentMethod || undefined,
    paidAt: inv.paidAt,
    paidAmount: inv.status === 'Paid' ? inv.amount : 0,
    balance: inv.status === 'Paid' ? 0 : inv.amount,
    subtotal: inv.amount,
    tax: 0,
    discount: 0,
    lineItems,
    paymentHistory:
      inv.status === 'Paid' && inv.paidAt
        ? [
            {
              id: `${inv.invoiceCode}-pay`,
              date: moment(inv.paidAt).format('MMM D, YYYY'),
              method: inv.paymentMethod || 'Cash',
              amount: inv.amount,
              reference: inv.invoiceCode,
              status: 'Completed',
            },
          ]
        : [],
    activityLog: [
      {
        id: `${inv.invoiceCode}-created`,
        title: 'Invoice created',
        date: moment(inv.createdAt).format('MMM D, YYYY · h:mm A'),
        description: `${inv.feeType} fee — ${treatment}`,
        actor: inv.createdBy?.name || 'System',
      },
      ...(inv.status === 'Paid' && inv.collectedBy
        ? [
            {
              id: `${inv.invoiceCode}-paid`,
              title: 'Payment collected',
              date: moment(inv.paidAt).format('MMM D, YYYY · h:mm A'),
              description: `Paid via ${inv.paymentMethod || 'Cash'}`,
              actor: inv.collectedBy.name,
            },
          ]
        : []),
    ],
    collectedBy: inv.collectedBy,
    createdBy: inv.createdBy,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  };
};

export const mapInvoiceToPatientCare = (inv) => ({
  invoiceCode: inv.invoiceCode,
  date: inv.date,
  treatment: inv.treatment,
  feeType: inv.feeType,
  amount: inv.amount,
  status: inv.status,
  sortOrder: inv.createdAt ? new Date(inv.createdAt).getTime() : Date.now(),
});
