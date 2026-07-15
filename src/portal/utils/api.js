import { apiFetch as sharedApiFetch } from '../../../lib/api';

export class ApiError extends Error {
  constructor(message, details = null) {
    super(message);
    this.details = details;
  }
}

export async function apiFetch(path, options = {}) {
  const apiPath = path.startsWith('/api') ? path : `/api${path}`;
  try {
    return await sharedApiFetch(apiPath, options);
  } catch (error) {
    throw new ApiError(error.message || 'Request failed', error.data?.details || error.data?.detail || null);
  }
}

export function formatDateTime(value) {
  if (!value) return 'Open';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true,
  }).format(new Date(value));
}

export function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
