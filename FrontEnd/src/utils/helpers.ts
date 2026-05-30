export const getInitials = (first?: string, last?: string, fallback = 'AD') => {
  const f = first?.charAt(0) ?? '';
  const l = last?.charAt(0) ?? '';
  const initials = `${f}${l}`.toUpperCase();
  return initials || fallback;
};

export const formatDisplayName = (
  first?: string,
  last?: string,
  name?: string
) => {
  if (first || last) return [first, last].filter(Boolean).join(' ');
  return name || 'Admin';
};

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong') => {
  if (error && typeof error === 'object') {
    const ax = error as {
      response?: { data?: { message?: string } };
      code?: string;
      message?: string;
    };
    if (ax.response?.data?.message) return ax.response.data.message;
    if (ax.code === 'ERR_NETWORK' || ax.message === 'Network Error') {
      return 'Cannot reach server. Start backend: cd BackEnd && npm run dev (check PORT in .env)';
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
};
