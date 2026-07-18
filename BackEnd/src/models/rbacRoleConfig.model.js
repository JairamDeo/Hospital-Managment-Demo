import { Schema, model } from 'mongoose';

const permissionSchema = new Schema(
  {
    view: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
  },
  { _id: false }
);

const modulesSchema = new Schema(
  {
    dashboard: { type: permissionSchema, default: () => ({}) },
    patients: { type: permissionSchema, default: () => ({}) },
    appointments: { type: permissionSchema, default: () => ({}) },
    prescriptions: { type: permissionSchema, default: () => ({}) },
    panchakarma: { type: permissionSchema, default: () => ({}) },
    ipd: { type: permissionSchema, default: () => ({}) },
    lab: { type: permissionSchema, default: () => ({}) },
    masterData: { type: permissionSchema, default: () => ({}) },
    pharmacy: { type: permissionSchema, default: () => ({}) },
    staff: { type: permissionSchema, default: () => ({}) },
    patientInsurance: { type: permissionSchema, default: () => ({}) },
    analytics: { type: permissionSchema, default: () => ({}) },
    billing: { type: permissionSchema, default: () => ({}) },
    settings: { type: permissionSchema, default: () => ({}) },
  },
  { _id: false }
);

const rbacRoleConfigSchema = new Schema(
  {
    role: {
      type: String,
      enum: ['Doctor', 'Therapist', 'Support', 'Lab'],
      unique: true,
      required: true,
    },
    modules: { type: modulesSchema, required: true },
  },
  { timestamps: true }
);

export default model('RbacRoleConfig', rbacRoleConfigSchema);
