import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import { hospitalName } from './mail.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, 'templates');

const compiledCache = new Map();

const loadTemplate = (fileName) => {
  if (compiledCache.has(fileName)) return compiledCache.get(fileName);
  const filePath = path.join(templatesDir, fileName);
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = handlebars.compile(source);
  compiledCache.set(fileName, compiled);
  return compiled;
};

/** Render a Handlebars HTML email template with shared branding fields. */
export const renderMailTemplate = (fileName, data = {}) => {
  const template = loadTemplate(fileName);
  return template({
    hospitalName: hospitalName(),
    year: new Date().getFullYear(),
    supportEmail: process.env.MAIL_SUPPORT_EMAIL || process.env.SUPPORT_EMAIL || '',
    frontendUrl: process.env.FRONTEND_URL || '',
    ...data,
  });
};

export const mailSubject = (envKey, fallback) => process.env[envKey] || fallback;
