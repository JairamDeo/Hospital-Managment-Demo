import HmsPatient from '../models/hmsPatient.model.js';
import '../models/prakritiMaster.model.js';
import '../models/treatmentMaster.model.js';

export const withHmsPatientPopulate = (query) =>
  query.populate('prakriti').populate('treatment');

export const findHmsPatientById = (id) => withHmsPatientPopulate(HmsPatient.findById(id));

export const findHmsPatientOne = (filter) => withHmsPatientPopulate(HmsPatient.findOne(filter));

export const findHmsPatientMany = (filter = {}) =>
  withHmsPatientPopulate(HmsPatient.find(filter));
