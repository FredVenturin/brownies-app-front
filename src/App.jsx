import { useEffect, useMemo, useState } from "react";
import { ordersApi } from "./services/api";

const RAW_API = import.meta.env.VITE_API_URL;
if (!RAW_API) {
  throw new Error("VITE_API_URL não definida. Configure na Vercel (Environment Variables).");
}
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

// garante yyyy-mm-dd para input type="date"
function toISODateInput(value, fallbackISO) {
  try {
    if (!value) return fallbackISO;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return fallbackISO;
    return d.toISOString().slice(0, 10);
  } catch {
    return fallbackISO;
  }
}

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [authOk, setAuthOk] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientPhone, setNewClientPhone] = useState("");

  const [products, setProducts] = useState([]);
  const [showNewProduct, setShowNewProduct] = useState(false);

  const [newProductName, setNewProductName] = useState("");
  const [newProductSalePrice, setNewProductSalePrice] = useState("");
  const [newProductCost, setNewProductCost] = useState("");

  const [editingOrderId, setEditingOrderId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const ACCESS_PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD || "";

  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    preparing: 0,
    sold: 0,
    cancelled: 0,
  });

  const [profitSummary, setProfitSummary] = useState({
    daily: { revenue: 0, cost: 0, profit: 0 },
    monthly: { revenue: 0, cost: 0, profit: 0 },
    annual: { revenue: 0, cost: 0, profit: 0 },
  });

  const now = new Date();
  const [profitYear, setProfitYear] = useState(String(now.getFullYear()));
  const [profitMonth, setProfitMonth] = useState("");
  const [profitDay, setProfitDay] = useState("");

  const [profitPeriod, setProfitPeriod] = useState({
    period: { label: "", start: "", end: "" },
    result: { revenue: 0, cost: 0, profit: 0 },
  });

  const [profitView, setProfitView] = useState("monthly");

  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    has_next: false,
  });

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [orderDate, setOrderDate] = useState(todayISO);

  const [name, setName] = useState("");
  const [clients, setClients] = useState([]);
  const [newClientName, setNewClientName] = useState("");
  const [items, setItems] = useState([{ item: "", quantidade: 1, price: 0, cost: 0 }]);
  const [status, setStatus] = useState("confirmed");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterName, setFilterName] = useState("");

  function applyFilter() {
    setIsFiltered(true);
    setPage(1);
  }

  function clearFilter() {
    setIsFiltered(false);
    setFilterStatus("");
    setFilterName("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function addItemRow() {
    setItems((prev) => [...prev, { item: "", quantidade: 1, price: 0, cost: 0 }]);
  }

  function removeItemRow(index) {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function updateItemRow(index, field, value) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;

        if (field === "quantidade") return { ...it, quantidade: Number(value) };
        if (field === "price") return { ...it, price: Number(value) };
        if (field === "cost") return { ...it, cost: Number(value) };

        if (field === "item") {
          const product = products.find((p) => p.name === value);
          if (product) {
            return {
              ...it,
              item: value,
              price: Number(product.sale_price),
              cost: Number(product.cost),
            };
          }
          return { ...it, item: value };
        }

        return { ...it, [field]: value };
      })
    );
  }

  function buildActiveFilter() {
    if (!isFiltered) return {};
    return {
      status: filterStatus || undefined,
      name: filterName || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };
  }

  function getCount(payload) {
    return payload?.data?.count ?? payload?.data?.attributes?.count ?? 0;
  }

  async function loadProducts() {
    try {
      const res = await ordersApi.listProducts();
      const payload = res?.payload ?? res;
      const list = payload?.data?.attributes ?? [];
      setProducts(list);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadClients() {
    try {
      const res = await ordersApi.listClients();
      const payload = res?.payload ?? res;
      const list = payload?.data?.attributes ?? [];
      setClients(list);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadOrdersPaginated() {
    const res = isFiltered
      ? await ordersApi.filter({
          status: filterStatus || undefined,
          name: filterName || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          page,
          limit,
        })
      : await ordersApi.listPaginated({ page, limit });

    const payload = res?.payload ?? res;

    const list = payload?.data?.attributes ?? [];
    setOrders(list);

    setMeta(
      payload?.meta ?? {
        page,
        limit,
        total: list.length,
        has_next: list.length === limit,
      }
    );
  }

  async function loadStats() {
    const statuses = ["confirmed", "preparing", "sold", "cancelled"];
    const results = await Promise.all([ordersApi.count(), ...statuses.map((s) => ordersApi.count({ status: s }))]);

    const totalPayload = results[0]?.payload ?? results[0];
    const confirmedPayload = results[1]?.payload ?? results[1];
    const preparingPayload = results[2]?.payload ?? results[2];
    const soldPayload = results[3]?.payload ?? results[3];
    const cancelledPayload = results[4]?.payload ?? results[4];

    setStats({
      total: getCount(totalPayload),
      confirmed: getCount(confirmedPayload),
      preparing: getCount(preparingPayload),
      sold: getCount(soldPayload),
      cancelled: getCount(cancelledPayload),
    });
  }

  async function loadProfitSummary() {
    try {
      const res = await ordersApi.profitSummary();
      const payload = res?.payload ?? res;

      const attrs =
        payload?.data?.attributes ?? {
          daily: { revenue: 0, cost: 0, profit: 0 },
          monthly: { revenue: 0, cost: 0, profit: 0 },
          annual: { revenue: 0, cost: 0, profit: 0 },
        };

      setProfitSummary(attrs);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProfitPeriod() {
    try {
      const res = await ordersApi.profitByPeriod({
        year: profitYear,
        month: profitMonth || undefined,
        day: profitDay || undefined,
      });

      const payload = res?.payload ?? res;

      const attrs = payload?.data?.attributes ?? {
        period: { label: "", start: "", end: "" },
        result: { revenue: 0, cost: 0, profit: 0 },
      };

      setProfitPeriod(attrs);
    } catch (err) {
      console.error(err);
    }
  }

  async function reloadAll() {
    await Promise.allSettled([loadOrdersPaginated(), loadStats(), loadProfitSummary(), loadProfitPeriod(), loadClients(), loadProducts()]);
  }

  useEffect(() => {
    reloadAll().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, isFiltered, filterStatus, filterName, startDate, endDate]);

  useEffect(() => {
    if (!profitYear) return;
    loadProfitPeriod().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profitYear, profitMonth, profitDay]);

  async function deleteOrder(orderId) {
    const ok = confirm("Tem certeza que deseja excluir esse pedido?");
    if (!ok) return;

    setLoading(true);
    try {
      const { ok: okRes, status: httpStatus, payload } = await request(`/delivery/order/${orderId}`, { method: "DELETE" });

      if (!okRes) {
        alert(`Erro ${httpStatus}: ` + JSON.stringify(payload, null, 2));
        return;
      }

      await reloadAll();
    } catch (err) {
      console.error(err);
      alert("Erro de rede (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    setLoading(true);
    try {
      const { ok: okRes, status: httpStatus, payload } = await request(`/delivery/order/${orderId}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });

      if (!okRes) {
        alert(`Erro ${httpStatus}: ` + JSON.stringify(payload, null, 2));
        return;
      }

      await reloadAll();
    } catch (err) {
      console.error(err);
      alert("Erro de rede (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  function startEditOrder(order) {
    setIsEditing(true);
    setEditingOrderId(order._id);

    setName(order?.name ?? "");
    setOrderDate(toISODateInput(order?.order_date, todayISO));
    setStatus(order?.status ?? "confirmed");

    const mappedItems =
      (order?.itens ?? []).length > 0
        ? (order.itens ?? []).map((it) => ({
            item: it.item ?? "",
            quantidade: Number(it.quantidade ?? 1),
            price: Number(it.price ?? 0),
            cost: Number(it.cost ?? 0),
          }))
        : [{ item: "", quantidade: 1, price: 0, cost: 0 }];

    setItems(mappedItems);
  }

  function cancelEditOrder() {
    setIsEditing(false);
    setEditingOrderId(null);

    setName("");
    setItems([{ item: "", quantidade: 1, price: 0, cost: 0 }]);
    setStatus("confirmed");
    setOrderDate(todayISO);

    setShowNewClient(false);
    setShowNewProduct(false);

    setNewClientName("");
    setNewClientPhone("");
    setNewProductName("");
    setNewProductSalePrice("");
    setNewProductCost("");
  }

  async function handleUpdateOrder(e) {
    e.preventDefault();
    if (!editingOrderId) return;

    setLoading(true);

    const total = items.reduce((acc, it) => acc + Number(it.quantidade || 0) * Number(it.price || 0), 0);

    const body = {
      data: {
        name,
        order_date: orderDate || undefined,
        status,
        itens: items.map((it) => ({
          item: String(it.item || "").trim(),
          quantidade: Number(it.quantidade),
          price: Number(it.price),
          cost: Number(it.cost),
        })),
        prices: { total },
      },
    };

    try {
      const { ok: okRes, status: httpStatus, payload } = await request(`/delivery/order/${editingOrderId}`, {
        method: "PATCH",
        body,
      });

      if (!okRes) {
        alert(`Erro ${httpStatus}: ` + JSON.stringify(payload, null, 2));
        return;
      }

      cancelEditOrder();
      await reloadAll();
    } catch (err) {
      console.error(err);
      alert("Erro de rede (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrder(e) {
    e.preventDefault();
    setLoading(true);

    const total = items.reduce((acc, it) => acc + Number(it.quantidade || 0) * Number(it.price || 0), 0);

    const body = {
      data: {
        name,
        order_date: orderDate || undefined,
        itens: items.map((it) => ({
          item: String(it.item || "").trim(),
          quantidade: Number(it.quantidade),
          price: Number(it.price),
          cost: Number(it.cost),
        })),
        status,
        prices: { total },
      },
    };

    try {
      const { ok: okRes, status: httpStatus, payload } = await request(`/delivery/order`, {
        method: "POST",
        body,
      });

      if (!okRes) {
        alert(`Erro ${httpStatus}: ` + JSON.stringify(payload, null, 2));
        return;
      }

      setName("");
      setItems([{ item: "", quantidade: 1, price: 0, cost: 0 }]);
      setStatus("confirmed");
      setOrderDate(todayISO);

      await reloadAll();
    } catch (err) {
      console.error(err);
      alert("Erro de rede (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  async function bulkUpdateStatus(toStatus) {
    const filter = buildActiveFilter();

    const ok = confirm(
      `Atualizar status para "${toStatus.toUpperCase()}" em massa?\n` +
        (isFiltered ? "Vai afetar apenas o FILTRO atual." : "ATENÇÃO: Vai afetar TODOS os pedidos!")
    );
    if (!ok) return;

    const { ok: okRes, status: httpStatus, payload } = await ordersApi.updateMany({
      filter,
      update: { status: toStatus },
    });

    if (!okRes) {
      alert(`Erro ${httpStatus}: ` + JSON.stringify(payload, null, 2));
      return;
    }

    await reloadAll();
  }

  async function bulkIncrement(fieldPath, value) {
    const filter = buildActiveFilter();

    const { ok: okRes, status: httpStatus, payload } = await ordersApi.increment({
      filter,
      increment: { [fieldPath]: Number(value) },
    });

    if (!okRes) {
      alert(`Erro ${httpStatus}: ` + JSON.stringify(payload, null, 2));
      return;
    }

    await reloadAll();
  }

  async function bulkDelete() {
    const filter = buildActiveFilter();

    const ok = confirm(
      "Apagar pedidos em massa?\n" +
        (isFiltered ? "Vai apagar apenas os pedidos do FILTRO atual." : "ATENÇÃO: Vai apagar TODOS os pedidos!")
    );
    if (!ok) return;

    const { ok: okRes, status: httpStatus, payload } = await ordersApi.deleteMany({ filter });

    if (!okRes) {
      alert(`Erro ${httpStatus}: ` + JSON.stringify(payload, null, 2));
      return;
    }

    await reloadAll();
  }

  const revenue = Number(profitSummary?.all_time?.revenue ?? 0);
  const totalCost = Number(profitSummary?.all_time?.cost ?? 0);
  const profit = Number(profitSummary?.all_time?.profit ?? 0);

  const orderTotalPreview = items.reduce((acc, it) => acc + Number(it.quantidade || 0) * Number(it.price || 0), 0);

  function formatDateBR(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR");
  }

  if (!authOk) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 }}>
        <div className="card" style={{ width: "min(420px, 100%)", padding: 16 }}>
          <h2 style={{ margin: 0 }}>Acesso</h2>
          <p className="mini" style={{ marginTop: 8 }}>Digite a senha para acessar o sistema.</p>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ flex: 1 }}
            />

            <button type="button" className="btn" onClick={() => setShowPassword((v) => !v)} style={{ width: 110 }}>
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {authError ? <div className="mini" style={{ marginTop: 8 }}>{authError}</div> : null}

          <button
            type="button"
            className="btn"
            style={{ width: "100%", marginTop: 10 }}
            onClick={() => {
              if (!ACCESS_PASSWORD) {
                setAuthError("Senha não configurada. Defina VITE_ACCESS_PASSWORD na Vercel.");
                return;
              }
              if (password === ACCESS_PASSWORD) {
                setAuthOk(true);
                setAuthError("");
              } else {
                setAuthError("Senha incorreta.");
              }
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="title">🍫 Pedidos</h1>
          <p className="subtitle">Controle rápido de vendas e status</p>
        </div>
      </div>

      <div className="grid stats">
        <div className="card statCard">
          <div className="statValue">{stats.total}</div>
          <div className="statLabel">Total</div>
        </div>

        <div className="card statCard">
          <div className="statValue">R$ {revenue.toFixed(2)}</div>
          <div className="statLabel">Receita (Sold)</div>
        </div>

        <div className="card statCard">
          <div className="statValue">R$ {totalCost.toFixed(2)}</div>
          <div className="statLabel">Custo (Sold)</div>
        </div>

        <div className="card statCard">
          <div className="statValue">R$ {profit.toFixed(2)}</div>
          <div className="statLabel">Lucro (Sold)</div>
        </div>


        <div className="card statCard" style={{ gridColumn: "1 / -1" }}>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
    
          <div style={{ fontWeight: 800 }}>Lucro por período</div>

          <select
            className="select"
            value={profitYear}
            onChange={(e) => setProfitYear(e.target.value)}
            style={{ width: 120 }}
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            className="select"
            value={profitMonth}
            onChange={(e) => setProfitMonth(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="">Todos meses</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            className="select"
            value={profitDay}
            onChange={(e) => setProfitDay(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="">Todos dias</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

      <div style={{ marginTop: 12 }}>
        <div className="statValue">
          R$ {Number(profitPeriod.result?.profit ?? 0).toFixed(2)}
        </div>

        <div className="mini" style={{ marginTop: 6 }}>
          Receita: <strong>R$ {Number(profitPeriod.result?.revenue ?? 0).toFixed(2)}</strong>{" "}
          • Custo: <strong>R$ {Number(profitPeriod.result?.cost ?? 0).toFixed(2)}</strong>
        </div>
      </div>
    </div>

        <div className="card statCard">
          <div className="statValue">{stats.confirmed}</div>
          <div className="statLabel">Confirmed</div>
        </div>

        <div className="card statCard">
          <div className="statValue">{stats.preparing}</div>
          <div className="statLabel">Preparing</div>
        </div>

        <div className="card statCard">
          <div className="statValue">{stats.sold}</div>
          <div className="statLabel">Sold</div>
        </div>

        <div className="card statCard">
          <div className="statValue">{stats.cancelled}</div>
          <div className="statLabel">Cancelled</div>
        </div>
      </div>

      <form onSubmit={isEditing ? handleUpdateOrder : handleCreateOrder} className="card form">
        <div className="row">
          <div>
            <div style={{ fontWeight: 800, letterSpacing: "-0.4px" }}>
              {isEditing ? "Editar pedido" : "Criar pedido"}
            </div>
            <div className="mini">Preencha só o essencial. O total é calculado.</div>
          </div>

          <div className="mini">
            Total: <strong>R$ {orderTotalPreview.toFixed(2)}</strong>
          </div>
          {isEditing ? ( <button type="button" className="btn" onClick={cancelEditOrder} disabled={loading} style={{ marginLeft: "auto" }} > Cancelar edição </button> ) : null}
        </div>

        <div className="sep"></div>

        <div className="formGrid">
          <div style={{ display: "grid", gap: 8 }}>
            <label className="label">
              Cliente
              <input
                className="input"
                list="clients-list"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite ou selecione um cliente"
                required
              />

              <datalist id="clients-list">
                {clients.map((c) => (
                  <option key={c._id} value={c.name} />
                ))}
              </datalist>
            </label>

            <div className="row" style={{ gap: 10, justifyContent: "flex-start" }}>
              <button
                type="button"
                className="btn"
                onClick={() => setShowNewClient((v) => !v)}
                disabled={loading}
              >
                {showNewClient ? "Fechar cadastro" : "+ Cadastrar cliente"}
              </button>
            </div>

            {showNewClient ? (
              <div className="card" style={{ padding: 12 }}>
                <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                  <input
                    className="input"
                    placeholder="Nome do novo cliente"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    style={{ flex: 1, minWidth: 220 }}
                  />

                  <input
                    className="input"
                    placeholder="Telefone (opcional)"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    style={{ width: 220 }}
                  />

                  <button
                    type="button"
                    className="btn btnPrimary"
                    disabled={loading || !newClientName.trim()}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const res = await ordersApi.createClient({
                          data: { name: newClientName.trim(), phone: newClientPhone.trim() || undefined },
                        });

                        const ok = res?.ok ?? true;
                        if (!ok) {
                          alert("Erro ao criar cliente. Veja o console.");
                          console.error(res);
                          return;
                        }

                        await loadClients();
                        setName(newClientName.trim());
                        setNewClientName("");
                        setNewClientPhone("");
                        setShowNewClient(false);
                      } catch (err) {
                        console.error(err);
                        alert("Erro ao criar cliente (veja o console).");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Salvar cliente
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <label className="label">
            Status
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="confirmed">confirmed</option>
              <option value="preparing">preparing</option>
              <option value="sold">sold</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>

          <label className="label">
            Data do pedido
            <input
              className="input"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
            />
          </label>

          <div style={{ gridColumn: "1 / -1" }}>
            <div
              className="row"
              style={{ justifyContent: "space-between", marginBottom: 8 }}
            >
              <div style={{ fontWeight: 800 }}>Itens</div>

              <div className="row" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowNewProduct((v) => !v)}
                  disabled={loading}
                >
                  {showNewProduct ? "Fechar cadastro" : "+ Cadastrar produto"}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={addItemRow}
                  disabled={loading}
                >
                  + Adicionar item
                </button>
              </div>
            </div>
            {showNewProduct ? (
              <div className="card" style={{ padding: 12, marginBottom: 12 }}>
                <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                  <input
                    className="input"
                    placeholder="Nome do produto"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    style={{ flex: 1, minWidth: 220 }}
                  />

                  <input
                    className="input"
                    type="number"
                    placeholder="Preço de venda"
                    value={newProductSalePrice}
                    onChange={(e) => setNewProductSalePrice(e.target.value)}
                    style={{ width: 160 }}
                  />

                  <input
                    className="input"
                    type="number"
                    placeholder="Custo"
                    value={newProductCost}
                    onChange={(e) => setNewProductCost(e.target.value)}
                    style={{ width: 140 }}
                  />

                  <button
                    type="button"
                    className="btn btnPrimary"
                    disabled={loading || !newProductName.trim()}
                    onClick={async () => {
                      try {
                        setLoading(true);

                        const res = await ordersApi.createProduct({
                          data: {
                            name: newProductName.trim(),
                            sale_price: Number(newProductSalePrice),
                            cost: Number(newProductCost),
                          },
                        });

                        const ok = res?.ok ?? true;
                        if (!ok) {
                          alert("Erro ao criar produto.");
                          console.error(res);
                          return;
                        }

                        await loadProducts();

                        setNewProductName("");
                        setNewProductSalePrice("");
                        setNewProductCost("");

                        setShowNewProduct(false);
                      } catch (err) {
                        console.error(err);
                        alert("Erro ao criar produto.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Salvar produto
                  </button>
                </div>
              </div>
            ) : null}

            {(items ?? []).map((it, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                  gap: 10,
                  marginBottom: 10,
                  alignItems: "end",
                }}
              >
                <label className="label">
                  Produto
                  <input
                    className="input"
                    list="products-list"
                    value={it.item}
                    onChange={(e) => updateItemRow(idx, "item", e.target.value)}
                    placeholder="Digite ou selecione um produto"
                    required
                  />

                  <datalist id="products-list">
                    {products.map((p) => (
                      <option key={p._id} value={p.name} />
                    ))}
                  </datalist>
                </label>

                <label className="label">
                  Qtd
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={it.quantidade}
                    onChange={(e) =>
                      updateItemRow(idx, "quantidade", e.target.value)
                    }
                    required
                  />
                </label>

                <label className="label">
                  Preço
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={it.price}
                    onChange={(e) => updateItemRow(idx, "price", e.target.value)}
                    required
                  />
                </label>

                <label className="label">
                  Custo
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={it.cost}
                    onChange={(e) => updateItemRow(idx, "cost", e.target.value)}
                    required
                  />
                </label>

                <button
                  type="button"
                  className="btn btnDanger"
                  onClick={() => removeItemRow(idx)}
                  disabled={loading || items.length <= 1}
                  style={{ height: 42 }}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          <div className="actions">
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? (isEditing ? "Salvando..." : "Criando...") : (isEditing ? "Salvar alterações" : "Criar pedido")}
            </button>
          </div>
        </div>
      </form>

      <div className="card" style={{ padding: 12, marginTop: 14 }}>
        <div className="row" style={{ gap: 10 }}>
          <input
            className="input"
            placeholder="Filtrar por nome..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            style={{ flex: 1 }}
          />

          <select
            className="select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 160 }}
          >
            <option value="">Todos status</option>
            <option value="confirmed">confirmed</option>
            <option value="preparing">preparing</option>
            <option value="sold">sold</option>
            <option value="cancelled">cancelled</option>
          </select>

          <input
            className="input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            className="input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <button
            type="button"
            className="btn btnPrimary"
            onClick={applyFilter}
            disabled={loading}
          >
            Filtrar
          </button>

          <button
            type="button"
            className="btn"
            onClick={clearFilter}
            disabled={loading}
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 12, marginTop: 14 }}>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn"
            disabled={loading}
            onClick={() => bulkUpdateStatus("sold")}
          >
            Marcar filtrados como SOLD
          </button>

          <button
            type="button"
            className="btn"
            disabled={loading}
            onClick={() => bulkUpdateStatus("cancelled")}
          >
            Marcar filtrados como CANCELLED
          </button>

          <button
            type="button"
            className="btn"
            disabled={loading}
            onClick={() => bulkIncrement("prices.total", 1)}
            title="Incrementa prices.total em +1 para os pedidos do filtro atual"
          >
            +1 em preço total (filtrados)
          </button>

          <button
            type="button"
            className="btn"
            disabled={loading}
            onClick={() => bulkIncrement("prices.total", -1)}
            title="Decrementa prices.total em -1 para os pedidos do filtro atual"
          >
            -1 em preço total (filtrados)
          </button>

          <button
            type="button"
            className="btn btnDanger"
            disabled={loading}
            onClick={bulkDelete}
          >
            Apagar filtrados
          </button>
        </div>

        <div className="mini" style={{ marginTop: 8 }}>
          Ações em massa usam o filtro atual. Se você não estiver filtrando, afeta
          TODOS.
        </div>
      </div>

      <div className="card" style={{ padding: 12, marginTop: 14 }}>
        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className="btn"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            ◀ Anterior
          </button>

          <div className="mini">
            Página: <strong>{page}</strong> • Total: <strong>{meta.total}</strong>
          </div>

          <button
            type="button"
            className="btn"
            disabled={!meta.has_next || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima ▶
          </button>

          <select
            className="select"
            value={limit}
            onChange={(e) => {
              setPage(1);
              setLimit(Number(e.target.value));
            }}
            style={{ width: 140, marginLeft: "auto" }}
          >
            <option value={5}>5 / pág</option>
            <option value={10}>10 / pág</option>
            <option value={20}>20 / pág</option>
            <option value={50}>50 / pág</option>
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="mini">Nenhum pedido encontrado.</p>
      ) : (
        <div className="grid orders">
          {orders.map((order) => {
            const orderTotal = Number(order?.prices?.total ?? 0);
            const orderCost = (order.itens ?? []).reduce(
              (acc, it) =>
                acc + Number(it.quantidade ?? 0) * Number(it.cost ?? 0),
              0
            );
            const orderProfit = order.status === "sold" ? (orderTotal - orderCost) : 0;

            return (
              <div
                key={order._id}
                className={`card orderCard status-${order.status || "unknown"}`}
              >
                <div className="row">
                  <div style={{ fontWeight: 800 }}>{order.name}</div>
                  <span className={`pill pill-${order.status || "unknown"}`}>
                    {String(order.status || "").toUpperCase()}
                  </span>
                </div>

                <div className="kv">
                  <div>
                    <strong>ID:</strong> {order._id}
                  </div>
                  <div>
                    <strong>Data:</strong> {formatDateBR(order.order_date)}
                  </div>
                </div>

                <div className="sep"></div>

                <div style={{ marginTop: 8 }}>
                  <strong>Itens:</strong>

                  {(order.itens ?? []).map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 14,
                        marginTop: 4,
                      }}
                    >
                      <span>
                        {it.quantidade}x {it.item}
                      </span>
                      <span>
                        R$ {(Number(it.quantidade) * Number(it.price)).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <div style={{ marginTop: 8, fontWeight: "bold" }}>
                    Total: R$ {orderTotal.toFixed(2)}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div>
                      <strong>Custo:</strong> R$ {orderCost.toFixed(2)}
                    </div>
                    {order.status === "sold" ? (
                      <div>
                        <strong>Lucro:</strong> R$ {orderProfit.toFixed(2)}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="sep"></div>

                <div className="row" style={{ gap: 8 }}>
                  <select
                    className="select"
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    <option value="confirmed">confirmed</option>
                    <option value="preparing">preparing</option>
                    <option value="sold">sold</option>
                    <option value="cancelled">cancelled</option>
                  </select>

                  <button
                    type="button"
                    className="btn"
                    onClick={() => startEditOrder(order)}
                    disabled={loading}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="btn btnDanger"
                    onClick={() => deleteOrder(order._id)}
                    disabled={loading}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;