import HmsLabOrder from '../../models/hmsLabOrder.model.js';
import HmsLabReport from '../../models/hmsLabReport.model.js';
import HmsPatient from '../../models/hmsPatient.model.js';
import PatientCareProfile from '../../models/patientCareProfile.model.js';
import LabTestMaster from '../../models/labTestMaster.model.js';
import LabTestCategoryMaster from '../../models/labTestCategoryMaster.model.js';
import { ErrorMessages, LAB_MESSAGES } from '../../utils/constants.js';
import { formatAppointmentDateDisplay } from '../../utils/appointment.util.js';
import { notifyAllLabStaff, notifyDoctor, createNotification } from '../../services/notification.service.js';
import { uploadFile } from '../../utils/uploadFile.js';

const nextOrderCode = async () => {
  const count = await HmsLabOrder.countDocuments();
  return `LAB-ORD-${String(count + 1).padStart(5, '0')}`;
};

const nextReportCode = async () => {
  const count = await HmsLabReport.countDocuments();
  return `LAB-RPT-${String(count + 1).padStart(5, '0')}`;
};

const performerFromReq = (req) => {
  if (req?.accountType === 'patient') {
    return {
      type: 'patient',
      patientCode: req.patient?.patientCode || '',
      name: req.patient?.name || 'Patient',
    };
  }
  if (req?.accountType === 'admin') {
    return {
      type: 'admin',
      name: req.admin?.firstName
        ? `${req.admin.firstName} ${req.admin.lastName || ''}`.trim()
        : req.admin?.email || 'Admin',
      adminId: req.admin?._id,
    };
  }
  return {
    type: 'staff',
    name: req?.staff?.name || 'Staff',
    staffCode: req?.staff?.staffCode || '',
  };
};

export const formatLabOrder = (doc) => {
  const row = doc.toObject ? doc.toObject() : { ...doc };
  return {
    _id: String(row._id),
    orderCode: row.orderCode,
    id: row.orderCode,
    patientCode: row.patientCode,
    patientName: row.patientName,
    prescriptionCode: row.prescriptionCode || '',
    appointmentCode: row.appointmentCode || '',
    doctorStaffCode: row.doctorStaffCode || '',
    doctorName: row.doctorName || '',
    tests: (row.tests ?? []).map((t) => ({
      id: String(t._id || ''),
      testCode: t.testCode,
      testName: t.testName,
      categoryCode: t.categoryCode || '',
      categoryName: t.categoryName || '',
      status: t.status || 'Pending',
      reportCode: t.reportCode || '',
    })),
    status: row.status,
    notes: row.notes || '',
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export const formatLabReport = (doc) => {
  const row = doc.toObject ? doc.toObject() : { ...doc };
  return {
    _id: String(row._id),
    reportCode: row.reportCode,
    id: row.reportCode,
    patientCode: row.patientCode,
    patientName: row.patientName,
    orderCode: row.orderCode || '',
    prescriptionCode: row.prescriptionCode || '',
    testCode: row.testCode || '',
    testName: row.testName,
    categoryCode: row.categoryCode || '',
    categoryName: row.categoryName || '',
    result: row.result || '',
    status: row.status || 'Pending',
    lab: row.labName || 'In-house Lab',
    labName: row.labName || 'In-house Lab',
    date: formatAppointmentDateDisplay(row.reportDate || row.createdAt),
    reportDate: row.reportDate || row.createdAt,
    fileUrl: row.fileUrl || '',
    fileName: row.fileName || '',
    source: row.source || 'lab',
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt,
  };
};

const syncCareLabReport = async (report) => {
  const care =
    (await PatientCareProfile.findOne({ patientCode: report.patientCode })) ??
    (await PatientCareProfile.create({
      patientCode: report.patientCode,
      patient: report.patient,
    }));

  const entry = {
    testName: report.testName,
    date: formatAppointmentDateDisplay(report.reportDate || new Date()),
    result: report.result || (report.fileName ? 'Report uploaded' : 'Pending'),
    status: report.status || 'Pending',
    lab: report.labName || 'In-house Lab',
    sortOrder: Date.now(),
  };

  const idx = care.labReports.findIndex(
    (r) =>
      r.testName === report.testName &&
      r.date === entry.date &&
      (r.result === entry.result || r.status === 'Pending')
  );

  if (idx >= 0) {
    Object.assign(care.labReports[idx], entry);
  } else {
    care.labReports.unshift(entry);
  }
  await care.save();
};

const refreshOrderStatus = async (order) => {
  const tests = order.tests || [];
  if (!tests.length) {
    order.status = 'Pending';
  } else if (tests.every((t) => t.status === 'Completed')) {
    order.status = 'Completed';
  } else if (tests.some((t) => t.status === 'Completed' || t.status === 'In Progress')) {
    order.status = 'Partial';
  } else {
    order.status = 'Pending';
  }
  await order.save();
};

export const createLabOrderFromPrescription = async ({
  patient,
  prescription,
  recommendedTests,
  req,
}) => {
  if (!recommendedTests?.length) return null;

  const tests = recommendedTests.map((t) => ({
    testCode: t.testCode,
    testName: t.testName,
    categoryCode: t.categoryCode || '',
    categoryName: t.categoryName || '',
    status: 'Pending',
  }));

  const order = await HmsLabOrder.create({
    orderCode: await nextOrderCode(),
    patientCode: patient.patientCode,
    patient: patient._id,
    patientName: patient.name,
    prescriptionCode: prescription.prescriptionCode,
    appointmentCode: prescription.appointmentCode || '',
    doctorStaffCode: prescription.doctorStaffCode || '',
    doctorName: prescription.doctorName || '',
    tests,
    status: 'Pending',
    createdBy: performerFromReq(req),
  });

  await notifyAllLabStaff({
    title: 'New lab test request',
    message: `${patient.name} — ${tests.length} test(s) recommended by ${prescription.doctorName || 'Doctor'}`,
    href: '/admin/lab',
    meta: {
      orderCode: order.orderCode,
      patientCode: patient.patientCode,
      patientName: patient.name,
    },
  });

  return order;
};

export const listLabOrders = async ({
  status,
  patientCode,
  search,
  testCode,
  categoryCode,
} = {}) => {
  const filter = {};
  if (status && status !== 'all') {
    // Pending UI also needs Partial orders that still have open tests
    if (status === 'Pending') {
      filter.status = { $in: ['Pending', 'Partial'] };
    } else {
      filter.status = status;
    }
  }
  if (patientCode) filter.patientCode = patientCode;
  if (search?.trim()) {
    const q = search.trim();
    filter.$or = [
      { patientName: new RegExp(q, 'i') },
      { patientCode: new RegExp(q, 'i') },
      { doctorName: new RegExp(q, 'i') },
      { orderCode: new RegExp(q, 'i') },
      { prescriptionCode: new RegExp(q, 'i') },
      { 'tests.testName': new RegExp(q, 'i') },
    ];
  }

  let rows = await HmsLabOrder.find(filter).sort({ createdAt: -1 });

  if (testCode) {
    rows = rows.filter((row) => (row.tests || []).some((t) => t.testCode === testCode));
  }
  if (categoryCode) {
    rows = rows.filter((row) =>
      (row.tests || []).some((t) => t.categoryCode === categoryCode)
    );
  }

  return rows.map(formatLabOrder);
};

export const getLabOrderByCode = async (orderCode) => {
  const row = await HmsLabOrder.findOne({ orderCode });
  if (!row) throw new Error(LAB_MESSAGES.NOT_FOUND);
  return formatLabOrder(row);
};

export const listLabReports = async ({ patientCode, categoryCode, testCode, search } = {}) => {
  const filter = {};
  if (patientCode) filter.patientCode = patientCode;
  if (categoryCode) filter.categoryCode = categoryCode;
  if (testCode) filter.testCode = testCode;
  if (search?.trim()) {
    const q = search.trim();
    filter.$or = [
      { patientName: new RegExp(q, 'i') },
      { patientCode: new RegExp(q, 'i') },
      { testName: new RegExp(q, 'i') },
      { reportCode: new RegExp(q, 'i') },
    ];
  }
  const rows = await HmsLabReport.find(filter).sort({ reportDate: -1, createdAt: -1 });
  return rows.map(formatLabReport);
};

export const getLabDashboardStats = async () => {
  const [orders, reports, masterTests, masterCategories] = await Promise.all([
    HmsLabOrder.find({}).lean(),
    HmsLabReport.find({}).lean(),
    LabTestMaster.find({ active: true }).sort({ categoryName: 1, name: 1 }).lean(),
    LabTestCategoryMaster.find({ active: true }).sort({ name: 1 }).lean(),
  ]);

  const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'Partial').length;
  const completedOrders = orders.filter((o) => o.status === 'Completed').length;
  const totalReports = reports.length;

  const requestedByTest = {};
  const completedByTest = {};
  for (const order of orders) {
    for (const test of order.tests || []) {
      const key = test.testCode || test.testName;
      requestedByTest[key] = (requestedByTest[key] || 0) + 1;
      if (test.status === 'Completed') {
        completedByTest[key] = (completedByTest[key] || 0) + 1;
      }
    }
  }

  const reportsByTest = {};
  for (const report of reports) {
    const key = report.testCode || report.testName;
    reportsByTest[key] = (reportsByTest[key] || 0) + 1;
  }

  const testStats = masterTests.map((t) => ({
    code: t.code,
    name: t.name,
    categoryCode: t.categoryCode || '',
    categoryName: t.categoryName || '',
    requested: requestedByTest[t.code] || 0,
    completed: completedByTest[t.code] || 0,
    reports: reportsByTest[t.code] || 0,
  }));

  const categoryStats = masterCategories.map((c) => {
    const tests = testStats.filter((t) => t.categoryCode === c.code);
    return {
      code: c.code,
      name: c.name,
      testCount: tests.length,
      requested: tests.reduce((sum, t) => sum + t.requested, 0),
      completed: tests.reduce((sum, t) => sum + t.completed, 0),
      reports: tests.reduce((sum, t) => sum + t.reports, 0),
    };
  });

  return {
    totalOrders: orders.length,
    pendingOrders,
    completedOrders,
    totalReports,
    masterTestCount: masterTests.length,
    masterCategoryCount: masterCategories.length,
    categoryStats,
    testStats,
  };
};

export const uploadLabReport = async (payload, file, req) => {
  const patient = await HmsPatient.findOne({
    patientCode: payload.patientCode,
    status: true,
  });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);

  let testName = payload.testName?.trim() || '';
  let testCode = payload.testCode?.trim() || '';
  let categoryCode = payload.categoryCode?.trim() || '';
  let categoryName = payload.categoryName?.trim() || '';
  let orderCode = payload.orderCode?.trim() || '';
  let prescriptionCode = payload.prescriptionCode?.trim() || '';

  const isPatientUpload = req.accountType === 'patient';

  // Patients may upload only against a doctor-recommended pending test
  if (isPatientUpload) {
    if (!orderCode || !testCode) {
      throw new Error(LAB_MESSAGES.ORDER_REQUIRED);
    }
    const order = await HmsLabOrder.findOne({
      orderCode,
      patientCode: patient.patientCode,
    });
    if (!order) throw new Error(LAB_MESSAGES.ORDER_MISMATCH);

    const orderedTest = (order.tests || []).find((t) => t.testCode === testCode);
    if (!orderedTest) throw new Error(LAB_MESSAGES.ORDER_MISMATCH);
    if (orderedTest.status === 'Completed') {
      throw new Error(LAB_MESSAGES.ALREADY_UPLOADED);
    }

    testName = payload.testName?.trim() || orderedTest.testName;
    categoryCode = categoryCode || orderedTest.categoryCode || '';
    categoryName = categoryName || orderedTest.categoryName || '';
    prescriptionCode = prescriptionCode || order.prescriptionCode || '';
  }

  if (testCode && (!testName || !categoryName)) {
    const master = await LabTestMaster.findOne({ code: testCode, active: true }).lean();
    if (master) {
      testName = testName || master.name;
      categoryCode = categoryCode || master.categoryCode;
      categoryName = categoryName || master.categoryName;
    }
  }

  if (!testName) throw new Error(LAB_MESSAGES.TESTS_REQUIRED);
  if (!file) throw new Error(LAB_MESSAGES.FILE_REQUIRED);

  const fileUrl = await uploadFile(file);
  const actor = performerFromReq(req);
  const source = isPatientUpload
    ? 'patient'
    : req.staff?.role === 'Doctor'
      ? 'doctor'
      : 'lab';

  const report = await HmsLabReport.create({
    reportCode: await nextReportCode(),
    patientCode: patient.patientCode,
    patient: patient._id,
    patientName: patient.name,
    orderCode,
    prescriptionCode,
    testCode,
    testName,
    categoryCode,
    categoryName,
    result: payload.result?.trim() || 'Report uploaded',
    status: payload.status === 'Abnormal' ? 'Abnormal' : payload.status === 'Pending' ? 'Pending' : 'Normal',
    labName: payload.labName?.trim() || (source === 'patient' ? 'External / Patient upload' : 'In-house Lab'),
    reportDate: payload.reportDate ? new Date(payload.reportDate) : new Date(),
    fileUrl,
    fileName: file.originalname || fileUrl.split('/').pop() || 'report',
    uploadedBy: actor,
    source,
  });

  if (orderCode) {
    const order = await HmsLabOrder.findOne({ orderCode });
    if (order) {
      const test = order.tests.find(
        (t) =>
          (testCode && t.testCode === testCode) ||
          (!testCode && t.testName === testName && t.status !== 'Completed')
      );
      if (test) {
        test.status = 'Completed';
        test.reportCode = report.reportCode;
      }
      await refreshOrderStatus(order);
      prescriptionCode = prescriptionCode || order.prescriptionCode;
      if (!report.prescriptionCode && prescriptionCode) {
        report.prescriptionCode = prescriptionCode;
        await report.save();
      }

      if (order.doctorStaffCode) {
        await notifyDoctor(order.doctorStaffCode, {
          title: 'Lab report ready',
          message: `${patient.name} — ${testName} report uploaded`,
          href: `/admin/patients/${encodeURIComponent(patient.patientCode)}`,
          meta: {
            reportCode: report.reportCode,
            patientCode: patient.patientCode,
            testName,
          },
        });
      }

      if (source === 'patient') {
        await notifyAllLabStaff({
          title: 'Patient uploaded recommended lab report',
          message: `${patient.name} uploaded ${testName} (outside lab)`,
          href: '/admin/lab',
          meta: { reportCode: report.reportCode, patientCode: patient.patientCode, orderCode },
        });
      }
    }
  }

  await syncCareLabReport(report);

  await createNotification({
    audience: 'patient',
    patientCode: patient.patientCode,
    title: 'Lab report available',
    message: `${testName} report is ready`,
    href: '/reports',
    type: 'lab_report',
    meta: { reportCode: report.reportCode },
  });

  return formatLabReport(report);
};
