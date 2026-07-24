/** Google Gemini — consultation AI (medical summary assist). */
export const isGeminiConfigured = () =>
  Boolean(process.env.GEMINI_API_KEY?.trim()) &&
  String(process.env.GEMINI_ENABLED ?? 'true').toLowerCase() !== 'false';

export const getGeminiConfig = () => ({
  apiKey: process.env.GEMINI_API_KEY?.trim() || '',
  /** Default: gemini-3.5-flash — current free-tier model for new users (2.5 blocked) */
  model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash',
  enabled: isGeminiConfigured(),
  baseUrl:
    process.env.GEMINI_API_BASE?.trim() ||
    'https://generativelanguage.googleapis.com/v1beta',
});
