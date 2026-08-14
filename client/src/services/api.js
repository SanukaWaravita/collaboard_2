const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "collabboard_token";
const USER_KEY = "collabboard_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiRequest(
  path,
  { body, headers = {}, ...options } = {},
) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || "The request could not be completed",
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}
