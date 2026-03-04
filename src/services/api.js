const RAW_API = import.meta.env.VITE_API_URL;

if (!RAW_API) {
  throw new Error("VITE_API_URL não definida. Configure no .env e/ou na Vercel.");
}

// remove barra final se existir: "https://.../" -> "https://..."
const API = RAW_API.replace(/\/+$/, "");

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
  // GETs agora retornam o objeto completo (ok/status/payload) igual os outros
  listPaginated: ({ page = 1, limit = 10 } = {}) =>
    request(`/delivery/orders${toQuery({ page, limit })}`),
  

  filter: ({ status, name, start_date, end_date, page, limit } = {}) =>
    request(
      `/delivery/orders/filter${toQuery({
        status,
        name,
        start_date,
        end_date,
        page,
        limit,
      })}`
    ),

  count: ({ status, name } = {}) =>
    request(`/delivery/orders/count${toQuery({ status, name })}`),

  // Ações em massa (como já estava)
  updateMany: (body) => request(`/delivery/orders/update-many`, { method: "PATCH", body }),
  increment: (body) => request(`/delivery/orders/increment`, { method: "PATCH", body }),
  profitSummary: () => request("/delivery/profit/summary"),
  deleteMany: (body) => request(`/delivery/orders/delete-many`, { method: "DELETE", body }),

  // Opcional mas MUITO recomendado: para parar de usar fetch direto no App.jsx
  create: (body) => request(`/delivery/order`, { method: "POST", body }),
  deleteOne: (id) => request(`/delivery/order/${id}`, { method: "DELETE" }),
  updateStatus: (id, status) =>
    request(`/delivery/order/${id}/status`, { method: "PATCH", body: { status } }),
};