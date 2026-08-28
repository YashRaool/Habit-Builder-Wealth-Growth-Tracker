const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('wh-token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, errors: data.errors || [data.error || 'Request failed'] };
  return data;
}

export const api = {
  get:   (path)         => request(path),
  post:  (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:   (path, body)   => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch: (path, body)   => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  del:   (path)         => request(path, { method: 'DELETE' }),
};
