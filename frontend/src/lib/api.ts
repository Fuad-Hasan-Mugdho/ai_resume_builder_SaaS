import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 20000,
});

type ApiErrorPayload = { message?: string | string[]; error?: string };

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) return 'Unexpected error. Please try again.';
  if (!error.response) return 'Cannot reach the server. Check your connection and try again.';

  const payload = error.response.data;
  const detail = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message;
  if (detail) return detail;

  switch (error.response.status) {
    case 400: return 'The submitted information is invalid.';
    case 401: return 'Email or password is incorrect.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested item was not found.';
    case 409: return 'This record already exists.';
    case 429: return 'Too many requests. Please wait and try again.';
    default: return 'Server error. Please try again shortly.';
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resumeai:api-error', {
        detail: {
          message: getApiErrorMessage(error),
          status: error.response?.status,
        },
      }));
    }
    return Promise.reject(error);
  },
);
