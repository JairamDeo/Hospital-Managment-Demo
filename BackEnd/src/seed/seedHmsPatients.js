import moment from 'moment';
import HmsPatient from '../models/hmsPatient.model.js';
import PatientCareProfile from '../models/patientCareProfile.model.js';
import PrakritiMaster from '../models/prakritiMaster.model.js';
import TreatmentMaster from '../models/treatmentMaster.model.js';
import { logger } from '../utils/logger.js';
import { mergeClinicalProfile } from '../utils/patientClinical.util.js';

const findMaster = async (Model, name) =>
  Model.findOne({ name: new RegExp(`^${name}$`, 'i'), active: true });

const jairamClinical = () =>
  mergeClinicalProfile(null, {
    presentComplaint: { complaint: 'Occasional acidity and mild sleep disturbance. Seeking Vata-balancing care.' },
    generalExamination: {
      prakriti: 'Vata',
      nadi: 'Vata-predominant, irregular',
      jivha: 'Pale with light coating',
      stool: 'Regular, tendency to dryness',
      urine: 'Clear, adequate',
      hunger: 'Irregular',
      digestion: 'Variable',
      sleep: 'Light, interrupted',
      intolerance: 'Cold foods',
    },
    diseaseHistory: {
      skin: 'No',
      migrane: 'Rare',
      chicken: 'Childhood',
      jaundice: 'No',
      bronchitis: 'No',
      anorectal: 'No',
      amlaPitta: 'Mild acidity',
      menstrual: 'N/A',
      bowel: 'Occasional constipation',
      addiction: 'No',
    },
    diabetesHistory: {
      diabetesType: 'None',
      typeDurations: '',
      insulin: 'No',
      insulinDurations: '',
      currentMedicine: '',
      currentMedicineDurations: '',
    },
    eatingHabits: {
      preference: 'Warm, cooked meals',
      schedule: 'Irregular breakfast; lunch 1–2 PM; dinner 9 PM',
      quantity: 'Moderate',
      likes: 'Rice, ghee, warm soups',
      dislikes: 'Cold salads, iced drinks',
    },
    physicalActivity: {
      active: true,
      workPattern: 'Desk work',
      walk: '20 min, 3× weekly',
      yoga: 'Light stretching',
      exercise: 'Occasional',
      meditative: '10 min breathing',
    },
    physicalMeasurement: {
      height: '172',
      weight: '68',
      bicep: '32',
      waist: '82',
      hip: '94',
      bmi: '23.0',
      whr: '0.87',
    },
  });

const jairamCare = () => ({
  vitals: { temp: '98.2 °F', bp: '120/80', pulse: '74 bpm', spo2: '98%', bmi: '23' },
  activeTreatment: null,
  treatmentHistory: [
    {
      title: 'General Consult',
      doctor: 'Dr. Ananya Sharma',
      status: 'Active',
      dateRange: 'Jun 2, 2026',
      description:
        'Ongoing care for Jairam Deo. Last documented visit on Jun 2, 2026. Treatment plan aligned with Vata Prakriti constitution.',
      medicines: ['Triphala', 'Ashwagandha'],
      sortOrder: 0,
    },
    {
      title: 'General Consultation & Prakriti Analysis',
      doctor: 'Dr. Ananya Sharma',
      status: 'Completed',
      dateRange: 'Initial visit',
      description:
        'Vata-dominant Prakriti assessment completed. Baseline health profile established.',
      medicines: ['Triphala'],
      sortOrder: 1,
    },
  ],
  appointments: [
    {
      date: 'Jun 5, 2026',
      time: '10:30 AM',
      type: 'Follow-up Consult',
      doctor: 'Dr. Ananya Sharma',
      status: 'Upcoming',
      sortOrder: 0,
    },
    {
      date: 'Jun 2, 2026',
      time: '11:00 AM',
      type: 'General Consult',
      doctor: 'Dr. Ananya Sharma',
      status: 'Completed',
      sortOrder: 1,
    },
  ],
  labReports: [
    {
      testName: 'Complete Blood Count',
      date: 'May 28, 2026',
      result: 'All parameters normal',
      status: 'Normal',
      lab: 'Ayurveda Diagnostics',
      sortOrder: 0,
    },
    {
      testName: 'Blood Sugar (Fasting)',
      date: 'May 28, 2026',
      result: '92 mg/dL',
      status: 'Normal',
      lab: 'Ayurveda Diagnostics',
      sortOrder: 1,
    },
  ],
  invoices: [
    {
      invoiceCode: 'INV-0626',
      date: 'Jun 2, 2026',
      treatment: 'General Consult',
      amount: 3200,
      status: 'Paid',
      sortOrder: 0,
    },
    {
      invoiceCode: 'INV-0526',
      date: 'May 15, 2026',
      treatment: 'Prakriti Analysis',
      amount: 1500,
      status: 'Paid',
      sortOrder: 1,
    },
  ],
  documents: [
    {
      name: 'Prakriti Analysis Report.pdf',
      type: 'Clinical Report',
      uploadedAt: 'Jan 2023',
      size: '245 KB',
      sortOrder: 0,
    },
    {
      name: 'Registration Form.pdf',
      type: 'Registration',
      uploadedAt: 'Jan 2023',
      size: '156 KB',
      sortOrder: 1,
    },
  ],
});

const SEED_PATIENTS = [
  {
    patientCode: 'AH-001/06-26',
    name: 'Jairam Deo',
    mobileNumber: '8830973046',
    email: 'jairam.deo@email.com',
    age: 24,
    gender: 'Male',
    bloodGroup: 'B+',
    city: 'India',
    prakriti: 'Vata',
    treatment: 'General Consult',
    recordStatus: 'Active',
    lastVisit: '2026-06-02',
    createdAt: new Date('2023-01-15'),
    clinical: jairamClinical(),
    care: jairamCare(),
  },
  {
    patientCode: 'AH-10024',
    name: 'Rahul Singh',
    mobileNumber: '9876543210',
    email: 'rahul.s@email.com',
    age: 34,
    gender: 'Male',
    bloodGroup: 'O+',
    city: 'Mumbai, MH',
    prakriti: 'Vata',
    treatment: 'General Consult',
    recordStatus: 'Active',
    lastVisit: '2023-10-26',
  },
  {
    patientCode: 'AH-10018',
    name: 'Priya Sharma',
    mobileNumber: '9123456780',
    email: 'priya.s@email.com',
    age: 28,
    gender: 'Female',
    bloodGroup: 'B+',
    city: 'Pune, MH',
    prakriti: 'Pitta',
    treatment: 'Panchakarma',
    recordStatus: 'Active',
    lastVisit: '2023-10-25',
    careExtra: {
      activeTreatment: {
        program: 'Panchakarma Program',
        stage: 'Vamana — Day 3 of 7',
        dayCurrent: 3,
        dayTotal: 7,
        percentComplete: 43,
      },
    },
  },
  {
    patientCode: 'AH-10031',
    name: 'Vijay Kumar',
    mobileNumber: '9988776655',
    email: 'vijay.k@email.com',
    age: 45,
    gender: 'Male',
    bloodGroup: 'A+',
    city: 'Delhi, NCR',
    prakriti: 'Kapha',
    treatment: 'Follow-up',
    recordStatus: 'Pending',
    lastVisit: '2023-10-24',
  },
  {
    patientCode: 'AH-10009',
    name: 'Ananya Desai',
    mobileNumber: '9012345678',
    email: 'ananya.d@email.com',
    age: 31,
    gender: 'Female',
    bloodGroup: 'AB+',
    city: 'Ahmedabad, GJ',
    prakriti: 'Vata',
    treatment: 'Diet Consult',
    recordStatus: 'Active',
    lastVisit: '2023-10-23',
  },
  {
    patientCode: 'AH-10055',
    name: 'Meera Joshi',
    mobileNumber: '8899001122',
    email: 'meera.j@email.com',
    age: 52,
    gender: 'Female',
    bloodGroup: 'O-',
    city: 'Nagpur, MH',
    prakriti: 'Pitta',
    treatment: 'Panchakarma',
    recordStatus: 'Inactive',
    lastVisit: '2023-10-20',
  },
  {
    patientCode: 'AH-10072',
    name: 'Arjun Patel',
    mobileNumber: '8765432109',
    email: 'arjun.p@email.com',
    age: 38,
    gender: 'Male',
    bloodGroup: 'B-',
    city: 'Surat, GJ',
    prakriti: 'Kapha',
    treatment: 'General Consult',
    recordStatus: 'Active',
    lastVisit: '2023-10-18',
  },
];

const defaultCareFor = (row) => {
  const lastVisit = moment(row.lastVisit).format('MMM D, YYYY');
  const base = jairamCare();
  return {
    vitals: { temp: '98.2 °F', bp: '120/80', pulse: '72 bpm', spo2: '97%', bmi: '22' },
    activeTreatment: row.careExtra?.activeTreatment ?? null,
    treatmentHistory: [
      {
        title: row.treatment,
        doctor: 'Dr. Ananya Sharma',
        status: row.recordStatus === 'Active' ? 'Active' : 'Completed',
        dateRange: lastVisit,
        description: `Ongoing care for ${row.name}. Treatment aligned with ${row.prakriti} Prakriti.`,
        medicines: ['Triphala', 'Ashwagandha'],
        sortOrder: 0,
      },
      {
        title: 'General Consultation & Prakriti Analysis',
        doctor: 'Dr. Ananya Sharma',
        status: 'Completed',
        dateRange: 'Initial visit',
        description: `${row.prakriti}-dominant Prakriti assessment completed.`,
        medicines: ['Triphala'],
        sortOrder: 1,
      },
    ],
    appointments: base.appointments.map((a, i) => ({
      ...a,
      date: i === 0 ? lastVisit : moment(row.lastVisit).subtract(12, 'days').format('MMM D, YYYY'),
      type: i === 0 ? row.treatment : 'Follow-up Consult',
      status: i === 0 && row.recordStatus === 'Active' ? 'Upcoming' : 'Completed',
    })),
    labReports: base.labReports,
    invoices: [
      {
        invoiceCode: `INV-${row.patientCode.replace(/[^0-9]/g, '').slice(-4)}`,
        date: lastVisit,
        treatment: row.treatment,
        amount: row.treatment.includes('Panchakarma') ? 14200 : 3200,
        status: row.recordStatus === 'Pending' ? 'Pending' : 'Paid',
        sortOrder: 0,
      },
    ],
    documents: base.documents,
  };
};

export const seedHmsPatients = async () => {
  const prakritiMap = {};
  const treatmentMap = {};
  for (const name of ['Vata', 'Pitta', 'Kapha']) {
    const p = await findMaster(PrakritiMaster, name);
    if (p) prakritiMap[name] = p._id;
  }
  for (const name of ['General Consult', 'Panchakarma', 'Follow-up', 'Diet Consult', 'Lab Review']) {
    const t = await findMaster(TreatmentMaster, name);
    if (t) treatmentMap[name] = t._id;
  }

  let created = 0;
  let updated = 0;

  for (const row of SEED_PATIENTS) {
    const prakritiId = prakritiMap[row.prakriti] ?? null;
    const treatmentId = treatmentMap[row.treatment] ?? null;
    const lastVisit = new Date(row.lastVisit);

    let patient = await HmsPatient.findOne({ patientCode: row.patientCode });
    if (!patient) {
      patient = await HmsPatient.findOne({ mobileNumber: row.mobileNumber });
    }

    const payload = {
      patientCode: row.patientCode,
      name: row.name,
      email: row.email,
      mobileNumber: row.mobileNumber,
      age: row.age,
      gender: row.gender,
      bloodGroup: row.bloodGroup,
      city: row.city,
      prakriti: prakritiId,
      treatment: treatmentId,
      lastVisit,
      recordStatus: row.recordStatus,
      createdByAdmin: true,
      status: true,
      clinicalProfile:
        typeof row.clinical === 'function'
          ? row.clinical()
          : (row.clinical ?? mergeClinicalProfile(null, {})),
    };

    if (row.createdAt && !patient) {
      payload.createdAt = row.createdAt;
    }

    if (patient) {
      Object.assign(patient, payload);
      await patient.save();
      updated += 1;
    } else {
      patient = await HmsPatient.create(payload);
      created += 1;
    }

    const carePayload =
      typeof row.care === 'function' ? row.care() : (row.care ?? defaultCareFor(row));
    await PatientCareProfile.findOneAndUpdate(
      { patientCode: row.patientCode },
      {
        ...carePayload,
        patientCode: row.patientCode,
        patient: patient._id,
      },
      { upsert: true, new: true }
    );
  }

  logger.info(`HMS patients seed: ${created} created, ${updated} updated (${SEED_PATIENTS.length} total)`);
};
