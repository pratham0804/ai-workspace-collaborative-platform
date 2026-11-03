const API_URL = "http://localhost:5000/api";

function getToken() {
  return sessionStorage.getItem("docs_access_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let body: { message?: string; error?: string; data?: unknown } | null = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.status === 401) {
    sessionStorage.removeItem("docs_access_token");
    sessionStorage.removeItem("docs_id_token");
    window.location.href = "/";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    throw new Error(
      body?.message || body?.error || `Request failed with status ${response.status}`
    );
  }

  return body as T;
}

export const api = {
  get<T>(path: string) {
    return request<T>(path);
  },
  post<T>(path: string, data?: unknown) {
    return request<T>(path, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },
  patch<T>(path: string, data?: unknown) {
    return request<T>(path, {
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },
  delete<T>(path: string) {
    return request<T>(path, {
      method: "DELETE",
    });
  },
};
