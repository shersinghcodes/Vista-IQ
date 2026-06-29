const API = "http://127.0.0.1:8000";

export function getAccessToken() { return localStorage.getItem('access_token'); }
export function getRefreshToken() { return localStorage.getItem('refresh_token'); }
export function setTokens(a, r) { localStorage.setItem('access_token', a); localStorage.setItem('refresh_token', r); }
export function clearTokens() { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); }

export async function authFetch(url, opts = {}) {
  let res = await fetch(`${API}${url}`, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${getAccessToken()}`, 'Content-Type': 'application/json' },
  });
  if (res.status === 401) {
    const ref = await fetch(`${API}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: getRefreshToken() }),
    });
    if (!ref.ok) {
      console.error(`Token refresh failed (Status: ${ref.status}). Redirecting to login.`);
      clearTokens();
      window.location.href = '/';
      return res;
    }
    const { access_token } = await ref.json();
    localStorage.setItem('access_token', access_token);
    return authFetch(url, opts);
  }
  return res;
}

export async function apiPost(path, body) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch { throw new Error('Cannot connect to server.'); }

  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = { detail: text ? `Server returned non-JSON: ${text.slice(0, 50)}...` : 'Empty response from server' };
  }

  if (!res.ok) throw new Error(data.detail || `Error (${res.status})`);
  return data;
}

export async function logout() {
  const r = getRefreshToken();
  if (r) await fetch(`${API}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: r }) }).catch(() => { });
  clearTokens();
}

export async function authFetchFormData(url, formData) {
  let res = await fetch(`${API}${url}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: formData,
  });
  if (res.status === 401) {
    const ref = await fetch(`${API}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: getRefreshToken() }),
    });
    if (!ref.ok) { clearTokens(); window.location.href = '/'; return res; }
    const { access_token } = await ref.json();
    localStorage.setItem('access_token', access_token);
    return authFetchFormData(url, formData);
  }
  return res;
}

export async function searchJobs(
  role,
  location = "",
  lat = null,
  lng = null,
  page = 1
) {
  const params = new URLSearchParams({
    role,
    location,
    page
  });

  if (lat !== null) {
    params.append("lat", lat);
  }

  if (lng !== null) {
    params.append("lng", lng);
  }

  const res = await fetch(
    `${API}/jobs/search?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch jobs");
  }

  return await res.json();
}

export { API };
