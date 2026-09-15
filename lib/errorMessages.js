const GENERIC = 'Something went wrong. Please try again shortly.';

function safeValidation(value) {
  if (typeof value !== 'string' || value.length > 250) return null;
  const text = value.trim();
  if (/[<>{}\n]|sequelize|postgres|SQL|stack|TypeError|ReferenceError|ECONN|ENOTFOUND|api[_ -]?key|token|exception|\/api\/|localhost|https?:\/\//i.test(text)) return null;
  return /required|please (enter|select|upload|choose)|invalid (email|password|date|file)|passwords? (must|do not|does not)|already (exists|registered)|must be|cannot exceed|too (large|long|short)|not allowed|no answers recorded/i.test(text) ? text : null;
}

export function friendlyErrorMessage(status, data, path = '') {
  const raw = data?.message || data?.detail || data?.error;
  if (status === 401) return /\/auth\/login(?:\?|$)/.test(path)
    ? 'The email or password is incorrect. Please try again.'
    : 'Your session has expired. Please sign in again.';
  if (status === 423) return 'Your account access is currently restricted. Please contact your administrator.';
  if (status === 403) return 'You don’t have access to this action. Please contact your administrator if you need help.';
  if (status === 404) return 'We couldn’t find what you requested. Refresh the page and try again.';
  if (status === 409) return /answer|question|interview/.test(path)
    ? 'Your interview may have moved to the next step. Refresh the session before trying again.'
    : safeValidation(raw) || 'This information has changed or already exists. Refresh the page and try again.';
  if (status === 413) return 'This file is too large. Please choose a smaller file.';
  if (status === 429) return 'There have been too many requests. Please wait a moment and try again.';
  if ([408, 504].includes(status)) return 'This is taking longer than expected. Check the latest status before trying again.';
  if (status >= 500) return /answer|interview|livekit|communication/.test(path)
    ? 'We couldn’t process your request right now. Please try again shortly.' : GENERIC;
  if ([400, 422].includes(status)) return safeValidation(raw) || 'Please check the information you entered and try again.';
  return GENERIC;
}

export function networkError(error) {
  const message = error?.name === 'AbortError'
    ? 'The request was cancelled. Please try again when you’re ready.'
    : 'Unable to connect. Check your internet connection and try again.';
  return new Error(message, { cause: error });
}
