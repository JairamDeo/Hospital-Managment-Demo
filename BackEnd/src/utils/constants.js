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
    INVALID_CREDENTIALS: 'Invalid email or password',
    INVALID_USERNAME: 'Invalid mobile number',
    INVALID_PASSWORD: 'Invalid password',
    USER_NOT_FOUND: 'User not found',
    ACCESS_DENIED: 'Access denied',
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


export const PATIENT_MESSAGES = {
    REGISTER_SUCCESS: 'Patient registered successfully',
    MOBILE_ALREADY_REGISTERED: 'Hey, this mobile/email is already registered.',
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