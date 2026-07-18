// constants.js
//GENERAL INFORMATION
export const CLIENT = {
  NAME: 'Hospital Management System',
  SHORT_NAME: 'HMS',
  PATIENT_CODE_PREFIX: 'HMS',
  USER_CODE_PREFIX: 'SU',
  EMAIL: '8Pw0X@example.com',
  PHONE: '+1234567890',
  ADDRESS: '123 Hospital St, Health City, HC 12345',
  WEBSITE: 'https://www.hospitalmanagementsystem.com',
  SUPPORT_EMAIL: 'Z2yMj@example.com',
  SUPPORT_PHONE: '+0987654321',
  LOGO: 'https://www.hospitalmanagementsystem.com/logo.png',
  FAVICON: 'https://www.hospitalmanagementsystem.com/favicon.ico',
  SOCIAL_MEDIA: {
    FACEBOOK: 'https://www.facebook.com/hospitalmanagementsystem',
    TWITTER: 'https://www.twitter.com/hospitalmanagementsystem',
    INSTAGRAM: 'https://www.instagram.com/hospitalmanagementsystem',
    LINKEDIN: 'https://www.linkedin.com/company/hospitalmanagementsystem',
  },
};


export const EMAIL_SUBJECTS = {
    WELCOME: 'Welcome to Hospital Management System!',
    OTP: 'Your OTP for verification',
};
 
export const EMAIL_TEMPLATES = {
    WELCOME: 'welcome.html',
    OTP: 'otp-email.html',
};

export const Links = {
    WEBSITE:'',
};

export const RATE_LIMIT_MESSAGES = {
    REGISTER: 'Too many registrations attempts, please try again after a minute.',
    LOGIN: 'Too many login attempts, please wait and try again.',
    OTP: 'Too many OTP attempts, try again after some time.',
    CONTACT: 'Too many requests, please try again later.',
  };

export const ErrorMessages = {
    SERVER_ERROR: 'Something went wrong on the server. Please try again later.',
    GOOGLE_RECAPTCHA_ERROR: 'Google Recaptcha Token Missing',
    GOOGLE_RECAPTCHA_INVALID: 'Google Recaptcha Token Invalid',
    PATIENT_NOT_FOUND: 'Patient not found',
    STAFF_NOT_FOUND: 'Staff member not found',
    DOCTOR_NOT_FOUND: 'Doctor not found',
    THERAPIST_NOT_FOUND: 'Therapist not found',
    INVALID_CREDENTIALS: 'Invalid email or password',
    INVALID_USERNAME: 'Invalid mobile number',
    INVALID_PASSWORD: 'Invalid password',
    USER_NOT_FOUND: 'User not found',
    ACCESS_DENIED: 'Access denied',
  };

export const PATIENT_PORTAL_MESSAGES = {
  REGISTER_SUCCESS: 'Registration successful. OTP sent to your mobile',
  LOGIN_SUCCESS: 'Login successful',
  PROFILE_FETCHED: 'Profile fetched successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  OTP_SENT: 'OTP sent to your mobile number',
  OTP_RESENT: 'New OTP sent successfully',
  OTP_EXPIRED: 'OTP has expired. Please request a new one',
  OTP_INVALID: 'Invalid OTP',
  MOBILE_NOT_REGISTERED: 'Mobile number not registered. Please create an account',
  MOBILE_ALREADY_REGISTERED:
    'This mobile number is already registered. Please use a different number.',
  EMAIL_ALREADY_REGISTERED:
    'This email is already registered. Please use a different email.',
  RESEND_COOLDOWN: 'Please wait before requesting another OTP',
  ACCOUNT_INACTIVE: 'Account is inactive. Contact clinic support',
  SMS_SEND_FAILED: 'Failed to send OTP SMS. Please try again later',
};

export const MASTER_MESSAGES = {
  PRAKRITI_LIST: 'Prakriti list fetched',
  TREATMENT_LIST: 'Treatment list fetched',
  PHARMACY_CATEGORY_LIST: 'Pharmacy categories fetched',
  PHARMACY_UNIT_LIST: 'Pharmacy units fetched',
  PRAKRITI_CREATED: 'Prakriti created successfully',
  TREATMENT_CREATED: 'Treatment created successfully',
  PHARMACY_CATEGORY_CREATED: 'Pharmacy category created successfully',
  PHARMACY_UNIT_CREATED: 'Pharmacy unit created successfully',
  PRAKRITI_UPDATED: 'Prakriti updated successfully',
  TREATMENT_UPDATED: 'Treatment updated successfully',
  PHARMACY_CATEGORY_UPDATED: 'Pharmacy category updated successfully',
  PHARMACY_UNIT_UPDATED: 'Pharmacy unit updated successfully',
  PRAKRITI_EXISTS: 'Prakriti with this name already exists',
  TREATMENT_EXISTS: 'Treatment with this name already exists',
  PHARMACY_CATEGORY_EXISTS: 'Pharmacy category with this name already exists',
  PHARMACY_UNIT_EXISTS: 'Pharmacy unit with this name already exists',
  PHARMACY_SPOON_LIST: 'Pharmacy spoon sizes fetched',
  PHARMACY_SPOON_CREATED: 'Spoon size created successfully',
  PHARMACY_SPOON_UPDATED: 'Spoon size updated successfully',
  PHARMACY_SPOON_EXISTS: 'Spoon size with this name already exists',
  PHARMACY_SPOON_DEFAULT_SET: 'Default spoon size updated',
  ROOM_LIST: 'Rooms fetched',
  ROOM_CREATED: 'Room created successfully',
  ROOM_UPDATED: 'Room updated successfully',
  ROOM_EXISTS: 'Room number already exists',
  ROOM_NOT_FOUND: 'Room not found',
  LAB_CATEGORY_LIST: 'Lab test categories fetched',
  LAB_CATEGORY_CREATED: 'Lab test category created successfully',
  LAB_CATEGORY_UPDATED: 'Lab test category updated successfully',
  LAB_CATEGORY_EXISTS: 'Lab test category with this name already exists',
  LAB_TEST_LIST: 'Lab tests fetched',
  LAB_TEST_CREATED: 'Lab test created successfully',
  LAB_TEST_UPDATED: 'Lab test updated successfully',
  LAB_TEST_EXISTS: 'Lab test with this name already exists in this category',
  NOT_FOUND: 'Record not found',
};

export const LAB_MESSAGES = {
  ORDERS_FETCHED: 'Lab orders fetched successfully',
  ORDER_FETCHED: 'Lab order fetched successfully',
  ORDER_CREATED: 'Lab order created successfully',
  REPORTS_FETCHED: 'Lab reports fetched successfully',
  REPORT_UPLOADED: 'Lab report uploaded successfully',
  STATS_FETCHED: 'Lab stats fetched successfully',
  NOT_FOUND: 'Lab order or report not found',
  TESTS_REQUIRED: 'Select at least one lab test',
  FILE_REQUIRED: 'Report file is required',
  ORDER_REQUIRED: 'Upload only for a doctor-recommended test',
  ALREADY_UPLOADED: 'This report is already uploaded. You can only view it.',
  ORDER_MISMATCH: 'This test is not on your recommended lab list',
};

export const IPD_MESSAGES = {
  LIST_FETCHED: 'IPD admissions fetched successfully',
  STATS_FETCHED: 'IPD stats fetched successfully',
  ROOMS_FETCHED: 'IPD rooms fetched successfully',
  FETCHED: 'IPD admission fetched successfully',
  CREATED: 'Patient admitted successfully',
  CASE_NOTE_ADDED: 'Case note added successfully',
  DISCHARGED: 'Patient discharged successfully',
  NOT_FOUND: 'IPD admission not found',
  STAFF_NOT_DOCTOR: 'Selected staff member is not a doctor',
  PATIENT_ALREADY_ADMITTED: 'Patient is already admitted in IPD',
  ALREADY_DISCHARGED: 'Patient has already been discharged',
  ROOM_AT_CAPACITY: 'This room is at full capacity. Choose another room or discharge a patient.',
  ROOM_NOT_FOUND: 'Room not found or inactive',
  ROOM_TYPE_MISMATCH: 'Selected room is not an IPD room',
};

export const PHARMACY_MESSAGES = {
  OVERVIEW_FETCHED: 'Pharmacy inventory fetched successfully',
  ITEM_CREATED: 'Pharmacy item created successfully',
  CATEGORY_NOT_FOUND: 'Pharmacy category not found',
  CATEGORY_INACTIVE: 'Selected pharmacy category is inactive',
  UNIT_NOT_FOUND: 'Pharmacy unit not found',
  UNIT_INACTIVE: 'Selected pharmacy unit is inactive',
  EXPORT_READY: 'Pharmacy export generated successfully',
  IMPORT_COMPLETED: 'Pharmacy import completed',
  IMPORT_INVALID_FILE: 'Only CSV files are allowed for import',
  IMPORT_EMPTY: 'CSV file has no data rows',
  IMPORT_INVALID_HEADERS: 'CSV headers are invalid. Download the template and try again',
  BILLING_ITEMS_FETCHED: 'Pharmacy items for billing fetched successfully',
};

export const ADMIN_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  PROFILE_FETCHED: 'Admin profile fetched successfully',
  OTP_SENT: 'OTP sent to registered mobile number',
  OTP_RESENT: 'New OTP sent successfully',
  OTP_VERIFIED: 'OTP verified successfully',
  OTP_EXPIRED: 'OTP has expired. Please request a new one',
  OTP_INVALID: 'Invalid OTP',
  MOBILE_NOT_REGISTERED: 'Mobile number not registered',
  RESEND_COOLDOWN: 'Please wait before requesting another OTP',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  RESET_TOKEN_INVALID: 'Reset session expired. Please start again',
  ACCOUNT_INACTIVE: 'Account is inactive. Contact support',
  SMS_SEND_FAILED: 'Failed to send OTP SMS. Please try again later',
};


export const PANCHAKARMA_MESSAGES = {
  LIST_FETCHED: 'Panchakarma programs fetched successfully',
  STATS_FETCHED: 'Panchakarma stats fetched successfully',
  THERAPISTS_FETCHED: 'Therapists fetched successfully',
  ROOMS_FETCHED: 'Treatment rooms fetched successfully',
  CREATED: 'Panchakarma program scheduled successfully',
  ROOM_UNAVAILABLE:
    'This treatment room is at full capacity. Please choose another room or wait for a slot.',
  STAFF_NOT_THERAPIST: 'Selected staff member is not a therapist',
  NOT_FOUND: 'Panchakarma program not found',
  PLAN_CREATED: 'Panchakarma treatment plan created successfully',
  ATTENDED: 'Panchakarma program plan saved successfully',
};

export const APPOINTMENT_MESSAGES = {
  LIST_FETCHED: 'Appointments fetched successfully',
  STATS_FETCHED: 'Appointment stats fetched successfully',
  AVAILABILITY_FETCHED: 'Doctor availability fetched successfully',
  DOCTORS_FETCHED: 'Doctors fetched successfully',
  FETCHED: 'Appointment fetched successfully',
  CREATED: 'Appointment scheduled successfully',
  NOT_FOUND: 'Appointment not found',
  ALREADY_CANCELLED: 'Cannot attend a cancelled appointment',
  ATTENDED: 'Visit marked as attended',
  FOLLOW_UP_SAVED: 'Follow-up saved successfully',
  DOCTOR_SLOT_UNAVAILABLE:
    'This doctor already has an appointment at the selected date and time. Please choose another slot.',
  STAFF_NOT_DOCTOR: 'Selected staff member is not a doctor',
  ALREADY_PAID: 'Appointment fee is already paid',
  PAYMENT_NOT_REQUIRED: 'No payment is required for this appointment',
  PAYMENT_UNAVAILABLE: 'Online payment is not available for this appointment',
  PAYMENT_ORDER_CREATED: 'Payment order created successfully',
  PAYMENT_VERIFIED: 'Appointment payment verified successfully',
  CANCELLED_NO_PAY: 'Cannot pay for a cancelled appointment',
};

export const BILLING_MESSAGES = {
  LIST_FETCHED: 'Invoices fetched successfully',
  STATS_FETCHED: 'Billing stats fetched successfully',
  FETCHED: 'Invoice fetched successfully',
  CREATED: 'Invoice created successfully',
  PAYMENT_COLLECTED: 'Payment collected successfully',
  NOT_FOUND: 'Invoice not found',
  ALREADY_PAID: 'Invoice is already paid',
  ITEMS_REQUIRED: 'At least one medicine item is required',
  ITEM_NOT_FOUND: 'Pharmacy item not found',
  INVALID_QUANTITY: 'Invalid quantity',
  INSUFFICIENT_STOCK: 'Insufficient stock',
  PRICE_REQUIRED: 'Sale price required for item',
  ITEM_EXPIRED: 'Medicine has expired',
  INVALID_PAYMENT_AMOUNT: 'Invalid payment amount',
  PAYMENT_EXCEEDS_BALANCE: 'Payment exceeds remaining balance',
  FEE_REQUIRED: 'Consultation fee is required',
  RAZORPAY_NOT_CONFIGURED: 'Online payment is not configured',
  RAZORPAY_MIN_AMOUNT: 'Minimum online payment amount is ₹1',
  RAZORPAY_INVALID_SIGNATURE: 'Payment verification failed',
  RAZORPAY_INVALID_WEBHOOK: 'Invalid webhook signature',
  RAZORPAY_ORDER_NOT_FOUND: 'Payment order not found',
  RAZORPAY_ORDER_CREATED: 'Payment order created successfully',
  RAZORPAY_QR_CREATED: 'Payment QR generated successfully',
  RAZORPAY_PAYMENT_LINK_CREATED: 'Payment link sent to patient mobile',
  RAZORPAY_PAYMENT_LINK_RETRY: 'New payment link sent to patient mobile',
  RAZORPAY_PAYMENT_VERIFIED: 'Online payment verified successfully',
  PATIENT_MOBILE_REQUIRED: 'Patient mobile number is required to send payment link',
  PAYMENT_LINK_SMS_NOT_CONFIGURED: 'Payment link SMS template is not configured in MSG91',
  PAYMENT_LINK_NOTIFICATION_NOT_CONFIGURED:
    'Payment link SMS/WhatsApp/Email is not configured (MSG91, Foxglove, or Mail)',
};

export const STAFF_MESSAGES = {
  LIST_FETCHED: 'Staff directory fetched successfully',
  STATS_FETCHED: 'Staff stats fetched successfully',
  FETCHED: 'Staff member fetched successfully',
  CREATED: 'Staff member added successfully',
  UPDATED: 'Staff member updated successfully',
  COMPENSATION_LIST_FETCHED: 'Staff compensation fetched successfully',
  COMPENSATION_UPDATED: 'Staff compensation saved successfully',
};

export const PATIENT_MESSAGES = {
  LIST_FETCHED: 'Patients fetched successfully',
  OVERVIEW_FETCHED: 'Patient overview fetched successfully',
  TREATMENT_HISTORY_FETCHED: 'Treatment history fetched successfully',
  FETCHED: 'Patient fetched successfully',
  CREATED: 'Patient created successfully',
  UPDATED: 'Patient updated successfully',
  CLINICAL_FETCHED: 'Patient clinical profile fetched successfully',
  CLINICAL_UPDATED: 'Patient clinical profile saved successfully',
  PRESCRIPTIONS_FETCHED: 'Prescriptions fetched successfully',
  PRESCRIPTION_UPLOADED: 'Prescription PDF uploaded successfully',
  PRESCRIPTION_DELETED: 'Prescription removed successfully',
  PRESCRIPTION_FILE_REQUIRED: 'Please upload a PDF file',
  PRESCRIPTION_NOT_FOUND: 'Prescription not found',
  INSURANCE_LIST_FETCHED: 'Patient health insurance fetched successfully',
  INSURANCE_STATS_FETCHED: 'Insurance stats fetched successfully',
  INSURANCE_UPDATED: 'Patient health insurance saved successfully',
  VITALS_ADDED: 'Vitals recorded successfully',
  NO_WHATSAPP_NUMBER: 'Patient does not have a WhatsApp number on file',
  WHATSAPP_SENT: 'WhatsApp message sent successfully',
  WHATSAPP_ALREADY_SENT: 'WhatsApp already sent for this prescription',
  NO_EMAIL_ADDRESS: 'Patient does not have an email address on file',
  EMAIL_SENT: 'Email sent successfully',
  NOTIFICATION_SENT: 'Notification sent successfully',
  MOBILE_ALREADY_REGISTERED:
    'This mobile number is already registered. Please use a different number.',
  EMAIL_ALREADY_REGISTERED:
    'This email is already registered. Please use a different email.',
  REGISTER_SUCCESS: 'Patient registered successfully',
  OTP_VERIFIED: 'OTP verified successfully',
  OTP_VERIFICATION_FAILED: 'OTP verification failed',
  DOCTOR_LIST: 'Doctor list fetched successfully',
  DASHBOARD_DATA: 'Dashboard data fetched successfully',
  CONTACT_SUCCESS: 'Contact request submitted successfully',
  OTP_RESENT: 'OTP resent successfully',
  INVALID_PASSWORD: 'Invalid password',
  LOGIN_SUCCESS: 'Patient logged in successfully',
  GENERAL_INFO_ADDED: 'General information added successfully',
};

  export const USER_MESSAGES = {
    REGISTER_SUCCESS: 'User registered successfully',
    MOBILE_ALREADY_REGISTERED: 'Hey, this mobile/email is already registered.',
    OTP_VERIFIED: 'OTP verified successfully',
    OTP_VERIFICATION_FAILED: 'OTP verification failed',
    LOGIN_SUCCESS: 'User logged in successfully',
    OTP_RESENT: 'OTP resent successfully',
    NO_MODULES_FOUND: 'No modules found for the user',
    MODULES_FOUND: 'Modules found successfully',
    ACCESS_MODULES_SUBMITTED: 'Access modules submitted successfully',
  };