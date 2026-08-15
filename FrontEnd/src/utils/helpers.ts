export const getInitials = (first?: string, last?: string, nameOrFallback = 'AD') => {
  const f = first?.charAt(0) ?? '';
  const l = last?.charAt(0) ?? '';
  let initials = `${f}${l}`.toUpperCase();
  if (!initials && nameOrFallback && nameOrFallback !== 'AD') {
    const parts = nameOrFallback.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      initials = `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    } else {
      initials = nameOrFallback.slice(0, 2).toUpperCase();
    }
  }
  return initials || 'AD';
};

export const formatDisplayName = (
  first?: string,
  last?: string,
  name?: string
) => {
  if (first || last) return [first, last].filter(Boolean).join(' ');
  return name || 'Admin';
};

const TECHNICAL_PATTERNS = [
  /is not a function/i,
  /Cannot read propert/i,
  /Unexpected token/i,
  /Internal Server Error/i,
];

const isTechnicalMessage = (message: string) =>
  TECHNICAL_PATTERNS.some((pattern) => pattern.test(message));

const normalizeMessage = (message: unknown, fallback: string): string => {
  if (Array.isArray(message)) {
    const joined = message
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean)
      .join(' ');
    return joined || fallback;
  }
  if (typeof message === 'string') {
    const trimmed = message.trim();
    if (!trimmed || isTechnicalMessage(trimmed)) return fallback;
    return trimmed;
  }
  return fallback;
};

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong') => {
  if (error && typeof error === 'object') {
    const ax = error as {
      response?: { data?: { message?: string | string[] }; status?: number };
      code?: string;
      message?: string;
    };

    if (ax.response?.data?.message) {
      return normalizeMessage(ax.response.data.message, fallback);
    }

    if (ax.response?.status === 400) {
      return 'Please check the form fields and try again.';
    }
    if (ax.response?.status === 409) {
      return normalizeMessage(ax.response.data?.message, fallback);
    }
    if (ax.response?.status === 404) {
      return 'Record not found. It may have been removed.';
    }

    if (ax.code === 'ERR_NETWORK' || ax.message === 'Network Error') {
      return 'Unable to connect. Please check your internet connection and try again.';
    }
  }

  if (error instanceof Error) {
    return normalizeMessage(error.message, fallback);
  }

  return fallback;
};
