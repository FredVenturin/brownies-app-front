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
  // Contagem de pedidos por status (1 request, substitui 6 chamadas a count)
  stats: () => request("/delivery/orders/stats"),

  // Pedidos
  listPaginated: ({ page = 1, limit = 10 } = {}) =>
    request(`/delivery/orders${toQuery({ page, limit })}`),

  listAll: () => request("/delivery/orders/all"),

  findById: (id) =>
    request(`/delivery/order/${id}`),

  create: (body) =>
    request("/delivery/order", { method: "POST", body }),

  update: (id, body) =>
    request(`/delivery/order/${id}`, { method: "PATCH", body }),

  deleteOne: (id) =>
    request(`/delivery/order/${id}`, { method: "DELETE" }),

  updateStatus: (id, status) =>
    request(`/delivery/order/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),

  filter: ({ status, name, product, start_date, end_date, page, limit } = {}) =>
    request(
      `/delivery/orders/filter${toQuery({
        status,
        name,
        product,
        start_date,
        end_date,
        page,
        limit,
      })}`
    ),

  count: ({ status, name } = {}) =>
    request(`/delivery/orders/count${toQuery({ status, name })}`),

  updateMany: (body) =>
    request("/delivery/orders/update-many", { method: "PATCH", body }),

  increment: (body) =>
    request("/delivery/orders/increment", { method: "PATCH", body }),

  deleteMany: (body) =>
    request("/delivery/orders/delete-many", { method: "DELETE", body }),

  // Lixeira de pedidos
  listDeletedOrders: ({ page = 1, limit = 10 } = {}) =>
    request(`/delivery/orders/trash${toQuery({ page, limit })}`),

  restoreOrder: (orderId) =>
    request(`/delivery/orders/${orderId}/restore`, { method: "PATCH" }),

  // Lucro
  profitSummary: () =>
    request("/delivery/profit/summary"),

  profitByPeriod: (params) => {
    const q = new URLSearchParams();
    if (params?.year) q.set("year", String(params.year));
    if (params?.month) q.set("month", String(params.month));
    if (params?.day) q.set("day", String(params.day));
    const qs = q.toString();
    return request(`/delivery/profit${qs ? `?${qs}` : ""}`);
  },

  // Clientes
  listClients: ({ page = 1, limit = 10 } = {}) =>
    request(`/delivery/clients${toQuery({ page, limit })}`),

  listAllClients: () =>
    request("/delivery/clients/all"),

  createClient: (body) =>
    request("/delivery/clients", {
      method: "POST",
      body,
    }),

  updateClient: (clientId, body) =>
    request(`/delivery/clients/${clientId}`, {
      method: "PATCH",
      body,
    }),

  deleteClient: (clientId) =>
    request(`/delivery/clients/${clientId}`, {
      method: "DELETE",
    }),

  // Lixeira de clientes
  listDeletedClients: ({ page = 1, limit = 10 } = {}) =>
    request(`/delivery/clients/trash${toQuery({ page, limit })}`),

  restoreClient: (clientId) =>
    request(`/delivery/clients/${clientId}/restore`, {
      method: "PATCH",
    }),

  // Produtos
  listProducts: ({ page = 1, limit = 10 } = {}) =>
    request(`/delivery/products${toQuery({ page, limit })}`),

  listAllProducts: () =>
    request("/delivery/products/all"),

  createProduct: (body) =>
    request("/delivery/products", {
      method: "POST",
      body,
    }),

  updateProduct: (productId, body) =>
    request(`/delivery/products/${productId}`, {
      method: "PATCH",
      body,
    }),

  deleteProduct: (productId) =>
    request(`/delivery/products/${productId}`, {
      method: "DELETE",
    }),

  // Lixeira de produtos
  listDeletedProducts: ({ page = 1, limit = 10 } = {}) =>
    request(`/delivery/products/trash${toQuery({ page, limit })}`),

  restoreProduct: (productId) =>
    request(`/delivery/products/${productId}/restore`, {
      method: "PATCH",
    }),
};