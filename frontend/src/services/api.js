const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const request = async (method, path, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Session expired — fire a custom event so AuthContext can react
    window.dispatchEvent(new Event('auth:session-expired'));
    throw { status: 401, detail: 'Your session has expired. Please sign in again.' };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw { status: res.status, detail: data.detail || 'An unexpected error occurred.' };
  }
  return data;
};

export const apiGet  = (path, token) => request('GET', path, null, token);
export const apiPost = (path, body, token) => request('POST', path, body, token);
export const apiPut  = (path, body, token) => request('PUT', path, body, token);
export const apiDel  = (path, token) => request('DELETE', path, null, token);

export const checkHealth = async () => {
  const res = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`);
  return res.json();
};
