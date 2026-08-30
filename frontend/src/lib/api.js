const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('wh-token');
  
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });
  } catch (err) {
    throw { status: 0, errors: ['Network failure or API is unreachable'] };
  }

  const contentType = res.headers.get('content-type') || '';
  // Check if response is 204 No Content (like for DELETE requests), otherwise require JSON
  if (res.status !== 204 && !contentType.includes('application/json')) {
    throw { status: res.status, errors: ['Expected JSON response from API'] };
  }

  let data = {};
  if (res.status !== 204) {
    try {
      data = await res.json();
    } catch (err) {
      throw { status: res.status, errors: ['Failed to parse JSON response'] };
    }
  }

  if (!res.ok) {
    throw { status: res.status, errors: data.errors || (data.error ? [data.error] : ['Request failed']) };
  }
  
  return data;
}

export const api = {
  get:   (path)         => request(path),
  post:  (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:   (path, body)   => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch: (path, body)   => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  del:   (path)         => request(path, { method: 'DELETE' }),
};
