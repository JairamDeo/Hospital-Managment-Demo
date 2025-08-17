import Patient from '../models/patient.model.js';
import Doctor from '../models/doctor.model.js';
import { calculateAge } from '../utils/calculateAge.js';
import { sendEmailTemplate } from '../utils/templateHandler.js';
import { EMAIL_TEMPLATES,EMAIL_SUBJECTS,CLIENT } from '../utils/constants.js';
import DoctorAvailability from '../models/doctorAvailability.model.js';
import DoctorLeave from '../models/doctorLeave.model.js';
import moment from 'moment';
import bcrypt from "bcrypt";

// Service to create a new patient
export const createPatient = async (patientData) => {
  const patient = new Patient(patientData);
  // Generate patient code in the pattern HMS + YYMMDD + 3-digit sequence
  const today = moment().format('YYMMDD');
  const codePrefix = `${CLIENT.PATIENT_CODE_PREFIX}${today}`;

  // Find the last patient with today's code prefix
  const lastPatient = await Patient.findOne({ patientCode: { $regex: `^${codePrefix}` } })
    .sort({ patientCode: -1 });

  let sequence = 1;
  if (lastPatient && lastPatient.patientCode) {
    // Extract sequence number from last code
    const lastSeq = parseInt(lastPatient.patientCode.slice(-3), 10);
    sequence = lastSeq + 1;
  }

  patient.patientCode = `${codePrefix}${sequence.toString().padStart(3, '0')}`;
  return await patient.save();
};

//service to verify the OTP
export const verifyCode = async (patientId, otp) => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error('Patient not found');

  if (patient.otp === otp) {
    patient.status = true;
    patient.otp = null; // Clear OTP after verification
    patient.otpExpiresAt = null; // Clear OTP expiration time
    await patient.save();
    return true;
  }
  return false;
};

// service to resend otp on mobile number and email
export const resendOTP = async (patientId) => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error('Patient not found');

  patient.otp = Math.floor(Math.random() * 9000) + 1000; // Generate a new OTP
  patient.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  await patient.save();
  // Send OTP via SMS or Email
  // For example, using a hypothetical sendSMS function
  // await sendSMS(patient.mobileNumber, `Your OTP is ${patient.otp}`);
  // Or using a hypothetical sendEmail function
  if (patient.email) {
    const MailData = { name: patient.name, email: patient.email, otp: patient.otp };
    await sendEmailTemplate({ data: MailData, templateName: EMAIL_TEMPLATES.OTP, subject: EMAIL_SUBJECTS.OTP });
    logger.info(`OTP sent to: ${patient.email}`);
  }

  return patient.otp;
};

// service to add general information feilds of a patient
export const insertGeneralInfo = async (patientId, generalInfo) => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error('Patient not found');

  patient.name = generalInfo.name;
  patient.dob = generalInfo.dob;
  patient.gender = generalInfo.gender;
  patient.email = generalInfo.email;
  patient.city = generalInfo.city;
  patient.age = calculateAge(generalInfo.dob);  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(generalInfo.password, salt);
  patient.password = hashedPassword; //password will be hased before saving in the database

  await patient.save();

// Send welcome email if email is provided
  if (generalInfo.email) {
    // const MailData = { name: generalInfo.name, email: generalInfo.email };
    // await sendEmailTemplate({ data: MailData, templateName: EMAIL_TEMPLATES.WELCOME, subject: EMAIL_SUBJECTS.WELCOME });
    // logger.info(`Welcome email sent to: ${generalInfo.email}`);
  }

  const patientObj = patient.toObject();
  delete patientObj.password;
  return patientObj;
};

//service to login patient
export const loginPatient = async (mobileNumber, password) => {
  // Find the patient by mobile number
  const patient = await Patient.findOne({ mobileNumber });
  if (!patient) throw new Error('Patient not found');

  // Compare the provided password with the stored hashed password
  const isPasswordValid = await patient.comparePassword(password);
  if (!isPasswordValid) throw new Error('Invalid password');

  return patient;
};

// Service to find a patient by mobile number
export const findPatientByMobile = async (mobileNumber) => {
  return await Patient.findOne({ mobileNumber });
};

// service to get doctor list
export const doctorList = async () => {

  const today = moment().startOf('day');
  const next15Days = moment().add(15, 'days').endOf('day');

  const availabilityData = await DoctorAvailability.find().populate('doctorId');
  const leaveData = await DoctorLeave.find({
    date: { $gte: today.toDate(), $lte: next15Days.toDate() },
    status: 'approved'
  });

  const doctorMap = {};

  // Organize leaves per doctor per date
  const leaveMap = {};
  leaveData.forEach(leave => {
    const key = `${leave.doctorId}_${moment(leave.date).format('YYYY-MM-DD')}`;
    leaveMap[key] = leave.unavailableSlots; // array of unavailable slots
  });

  // Iterate through each doctor
  for (const entry of availabilityData) {
    const doctor = entry.doctorId;
    const weeklyAvailability = entry.weeklyAvailability;

    if (!doctorMap[doctor._id]) {
      doctorMap[doctor._id] = {
        doctor: {
          id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
        },
        availability: []
      };
    }

    // Loop through each day in the next month
    for (let day = moment(today); day.isSameOrBefore(next15Days); day.add(1, 'day')) {
      const dayOfWeek = day.format('dddd'); // e.g., 'Monday'

      const dayAvailability = weeklyAvailability.find(w => w.day === dayOfWeek);
      if (!dayAvailability) continue;

      const key = `${doctor._id}_${day.format('YYYY-MM-DD')}`;
      const leaveSlots = leaveMap[key] || [];

      const availableSlots = dayAvailability.slots.filter(slot => !leaveSlots.includes(slot));
      if (availableSlots.length > 0) {
        doctorMap[doctor._id].availability.push({
          date: day.format('YYYY-MM-DD'),
          slots: availableSlots
        });
      }
    }
  }

  // Return as an array
  return Object.values(doctorMap);
  
};

export const dashboardData = async (patientId) => {
  const patient = await Patient.findById(patientId).populate('doctorList');
  if (!patient) throw new Error('Patient not found');

  const dashboardData = {
    patient: {
      id: patient._id,
      name: patient.name,
      email: patient.email,
      mobileNumber: patient.mobileNumber,
      age: patient.age,
      gender: patient.gender,
      city: patient.city,
    },
    doctorList: patient.doctorList.map(doctor => ({
      id: doctor._id,
      name: doctor.name,
      specialization: doctor.specialization,
      experience: doctor.experience,
      rating: doctor.rating,
      availableSlots: doctor.availableSlots, // Assuming this field exists
    })),
  };

  return dashboardData;
};
