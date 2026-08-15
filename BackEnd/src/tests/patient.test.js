import { jest } from '@jest/globals';

// Mock services FIRST
jest.unstable_mockModule('../services/patient.service.js', () => ({
  findPatientByMobile: jest.fn(),
  createPatient: jest.fn(),
}));

jest.unstable_mockModule('../services/captcha.service.js', () => ({
  verifyCaptcha: jest.fn(() => Promise.resolve(true)),
}));

// Dynamic imports AFTER mocking
const request = (await import('supertest')).default;
const app = (await import('../server.js')).default;
const patientService = await import('../services/patient.service.js');
import Patient from '../models/patient.model.js'; // Import the Patient Model



describe('POST /api/patient-register', () => {
  beforeEach(() => {
    // 🛡️ Mock save() on Patient instances
    jest.spyOn(Patient.prototype, 'save').mockResolvedValue({
      _id: '12345',
      name: 'John Doe',
      dob: '1990-01-01',
      gender: 'male',
      mobileNumber: '1234567890',
  
    });

    // 🛡️ Mock findOne() on Patient model
    jest.spyOn(Patient, 'findOne').mockResolvedValue(null); // No patient exists initially
  });
  
  it('should register a patient successfully', async () => {
    patientService.findPatientByMobile.mockResolvedValue(null); // No existing patient
    patientService.createPatient.mockResolvedValue({
      id: '123',
      name: 'John Doe',
      mobileNumber: '1234567890',
      dob: '1990-01-01',          // <-- ADD dob
      gender: 'male',             // <-- ADD gender
      
    });

    const res = await request(app)
      .post('/api/patient-register')
      .send({
        name: 'John Doe',
        mobileNumber: '1234567890',
        email: 'john@example.com',
        dob: '1990-01-01',          // <-- ADD dob
        gender: 'male',             // <-- ADD gender
      
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Patient registered successfully');
  });

  it('should fail if mobile number already registered', async () => {
    // Simulate patient already exists
    Patient.findOne.mockResolvedValueOnce({ mobileNumber: '1234567890' });

    const res = await request(app)
      .post('/api/patient-register')
      .send({
        name: 'Jane Doe',
        mobileNumber: '1234567890',
        email: 'jane@example.com',
        dob: '1990-01-01',          // <-- ADD dob
        gender: 'male', 
      
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Mobile Number Already Registered');
  });

});
