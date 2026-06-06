import RbacRoleConfig from '../models/rbacRoleConfig.model.js';
import { DEFAULT_RBAC_BY_ROLE, RBAC_MODULE_KEYS, adminPermissions } from './rbacDefaults.js';

const toPlainModules = (modules, roleDefaults = {}) => {
  const out = {};
  for (const key of RBAC_MODULE_KEYS) {
    const mod = modules?.[key] ?? roleDefaults[key];
    out[key] = {
      view: Boolean(mod?.view),
      edit: Boolean(mod?.edit),
    };
  }
  return out;
};

export const seedRbacIfEmpty = async () => {
  for (const [role, modules] of Object.entries(DEFAULT_RBAC_BY_ROLE)) {
    await RbacRoleConfig.findOneAndUpdate(
      { role },
      { role, modules },
      { upsert: true, new: true }
    );
  }
};

/** Merge saved modules with role defaults so new modules appear even before DB migration. */
export const mergeRbacDefaults = async () => {
  for (const [role, defaults] of Object.entries(DEFAULT_RBAC_BY_ROLE)) {
    const row = await RbacRoleConfig.findOne({ role });
    if (!row) {
      await RbacRoleConfig.create({ role, modules: defaults });
      continue;
    }
    const modules = row.modules?.toObject?.() ?? { ...row.modules };
    let changed = false;
    for (const key of RBAC_MODULE_KEYS) {
      if (modules[key] == null && defaults[key]) {
        modules[key] = defaults[key];
        changed = true;
      }
    }
    if (changed) {
      row.set('modules', modules);
      row.markModified('modules');
      await row.save();
    }
  }
};

export const getPermissionsForStaffRole = async (staffRole) => {
  const defaults = DEFAULT_RBAC_BY_ROLE[staffRole] ?? {};
  const row = await RbacRoleConfig.findOne({ role: staffRole }).lean();
  if (!row?.modules) return toPlainModules(defaults, defaults);
  return toPlainModules(row.modules, defaults);
};

export const listRbacConfigs = async () => {
  const allowed = Object.keys(DEFAULT_RBAC_BY_ROLE);
  const rows = await RbacRoleConfig.find({ role: { $in: allowed } }).sort({ role: 1 }).lean();
  return rows.map((r) => ({
    role: r.role,
    modules: toPlainModules(r.modules, DEFAULT_RBAC_BY_ROLE[r.role]),
  }));
};

export const updateRbacConfig = async (role, modules) => {
  const payload = {};
  for (const key of RBAC_MODULE_KEYS) {
    if (modules?.[key]) {
      payload[key] = {
        view: Boolean(modules[key].view),
        edit: Boolean(modules[key].edit),
      };
    }
  }
  const row = await RbacRoleConfig.findOneAndUpdate(
    { role },
    { role, modules: payload },
    { upsert: true, new: true }
  );
  return { role: row.role, modules: toPlainModules(row.modules, DEFAULT_RBAC_BY_ROLE[role]) };
};

export const getPortalPermissions = async (accountType, staffRole) => {
  if (accountType === 'admin') return adminPermissions();
  return getPermissionsForStaffRole(staffRole);
};

export const hasPermission = (permissions, moduleKey, action = 'view') => {
  if (!permissions || !moduleKey) return false;
  const mod = permissions[moduleKey];
  if (!mod) return false;
  return action === 'edit' ? Boolean(mod.edit) : Boolean(mod.view);
};
