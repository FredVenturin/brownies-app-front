const API = import.meta.env.VITE_API_URL;
if (!API) {
  throw new Error("VITE_API_URL não definida. Configure no .env e/ou na Vercel.");
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  return { ok: res.ok, status: res.status, payload };
}

function toQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const ordersApi = {
  listPaginated: async ({ page = 1, limit = 10 } = {}) => {
    const { payload } = await request(`/delivery/orders${toQuery({ page, limit })}`);
    return payload;
  },

  filter: async ({ status, name, start_date, end_date, page, limit } = {}) => {
    const { payload } = await request(
      `/delivery/orders/filter${toQuery({ status, name, start_date, end_date, page, limit })}`
    );
    return payload;
  },

  count: async ({ status, name } = {}) => {
    const { payload } = await request(`/delivery/orders/count${toQuery({ status, name })}`);
    return payload;
  },

  updateMany: async (body) => request(`/delivery/orders/update-many`, { method: "PATCH", body }),
  increment: async (body) => request(`/delivery/orders/increment`, { method: "PATCH", body }),
  deleteMany: async (body) => request(`/delivery/orders/delete-many`, { method: "DELETE", body }),
};