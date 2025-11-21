const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const buildUrl = path => {
  if (!path) {
    throw new Error('apiFetch requires a path argument.');
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const shouldSerializeBody = body =>
  body !== undefined &&
  body !== null &&
  typeof body === 'object' &&
  !(body instanceof FormData) &&
  !(body instanceof Blob);

export async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    token,
    responseType = 'json',
    signal,
  } = options;

  const finalHeaders = new Headers(headers);

  if (token && !finalHeaders.has('Authorization')) {
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  let requestBody = body;
  if (shouldSerializeBody(body)) {
    requestBody = JSON.stringify(body);
  }

  if (
    requestBody !== undefined &&
    !(requestBody instanceof FormData) &&
    !finalHeaders.has('Content-Type')
  ) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: finalHeaders,
    body: requestBody,
    signal,
  });

  let data = null;
  if (responseType === 'blob') {
    data = await response.blob();
  } else if (responseType === 'text') {
    data = await response.text();
  } else {
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (_error) {
        data = text;
      }
    } else {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && data.message) ||
      `${response.status} ${response.statusText}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return { data, response };
}

export { API_BASE_URL };
