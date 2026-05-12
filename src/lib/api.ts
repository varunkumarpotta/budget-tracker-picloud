type ApiOk<T> = { success: true; data: T };
type ApiErr = { success: false; error: string };

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("ledgerly:token");
  if (token) return { authorization: `Bearer ${token}` };
  return {};
}

export async function apiGet<T>(path: string): Promise<ApiOk<T>> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { ...getAuthHeaders() },
  });
  const body = (await res.json()) as ApiOk<T> | ApiErr;
  if (!res.ok || !body.success) {
    throw new Error("error" in body ? body.error : "Request failed");
  }
  return body;
}

export async function apiPost<T>(path: string, payload: unknown): Promise<ApiOk<T>> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const body = (await res.json()) as ApiOk<T> | ApiErr;
  if (!res.ok || !body.success) {
    throw new Error("error" in body ? body.error : "Request failed");
  }
  return body;
}

export async function apiPut<T>(path: string, payload: unknown): Promise<ApiOk<T>> {
  const res = await fetch(path, {
    method: "PUT",
    credentials: "include",
    headers: { "content-type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const body = (await res.json()) as ApiOk<T> | ApiErr;
  if (!res.ok || !body.success) {
    throw new Error("error" in body ? body.error : "Request failed");
  }
  return body;
}

export async function apiDelete<T = unknown>(path: string): Promise<ApiOk<T>> {
  const res = await fetch(path, {
    method: "DELETE",
    credentials: "include",
    headers: { ...getAuthHeaders() },
  });
  const body = (await res.json()) as ApiOk<T> | ApiErr;
  if (!res.ok || !body.success) {
    throw new Error("error" in body ? body.error : "Request failed");
  }
  return body;
}
