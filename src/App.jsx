import { useEffect, useState } from "react";
import { ordersApi } from "./services/api";

const API = "http://127.0.0.1:3000";

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    preparing: 0,
    sold: 0,
    cancelled: 0,
  });

  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    has_next: false,
  });

  const today = new Date().toISOString().slice(0, 10);
  const [orderDate, setOrderDate] = useState(today);

  const [name, setName] = useState("");
  const [items, setItems] = useState([
    { item: "brownie", quantidade: 1, price: 10, cost: 5 },
  ]);
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

  async function loadOrdersPaginated() {
    const payload = isFiltered
      ? await ordersApi.filter({
          status: filterStatus || undefined,
          name: filterName || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          page,
          limit,
        })
      : await ordersApi.listPaginated({ page, limit });

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

  useEffect(() => {
    loadOrdersPaginated().catch(console.error);
    loadStats().catch(console.error);
  }, [page, limit, isFiltered, filterStatus, filterName, startDate, endDate]);

  async function deleteOrder(orderId) {
    const ok = confirm("Tem certeza que deseja excluir esse pedido?");
    if (!ok) return;

    setLoading(true);

    try {
      const res = await fetch(`${API}/delivery/order/${orderId}`, {
        method: "DELETE",
      });

      const payload = await res.json();

      if (!res.ok) {
        console.log("STATUS CODE:", res.status);
        console.log("PAYLOAD:", payload);
        alert(JSON.stringify(payload, null, 2));
        return;
      }

      await loadOrdersPaginated();
      await loadStats();
    } catch (err) {
      console.error(err);
      alert("Erro de rede (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    const statuses = ["confirmed", "preparing", "sold", "cancelled"];

    const results = await Promise.all([
      fetch(`${API}/delivery/orders/count`).then((r) => r.json()),
      ...statuses.map((s) =>
        fetch(`${API}/delivery/orders/count?status=${s}`).then((r) => r.json())
      ),
    ]);

    const getCount = (payload) =>
      payload?.data?.count ?? payload?.data?.attributes?.count ?? 0;

    const [
      totalPayload,
      confirmedPayload,
      preparingPayload,
      soldPayload,
      cancelledPayload,
    ] = results;

    setStats({
      total: getCount(totalPayload),
      confirmed: getCount(confirmedPayload),
      preparing: getCount(preparingPayload),
      sold: getCount(soldPayload),
      cancelled: getCount(cancelledPayload),
    });
  }

  async function updateOrderStatus(orderId, newStatus) {
    setLoading(true);

    const body = { status: newStatus };

    try {
      const res = await fetch(`${API}/delivery/order/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await res.json();

      if (!res.ok) {
        console.log("STATUS CODE:", res.status);
        console.log("PAYLOAD:", payload);
        alert(JSON.stringify(payload, null, 2));
        return;
      }

      await loadOrdersPaginated();
      await loadStats();
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

    const total = items.reduce(
      (acc, it) => acc + Number(it.quantidade || 0) * Number(it.price || 0),
      0
    );

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
      const res = await fetch(`${API}/delivery/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await res.json();

      if (!res.ok) {
        console.error("Erro ao criar:", payload);
        alert("Erro ao criar pedido (veja o console).");
        return;
      }

      setName("");
      setItems([{ item: "brownie", quantidade: 1, price: 10, cost: 5 }]);
      setStatus("confirmed");
      setOrderDate(today);

      await loadOrdersPaginated();
      await loadStats();
    } catch (err) {
      console.error(err);
      alert("Erro de rede (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  // ======= TÓPICO 7 (AÇÕES EM MASSA BASEADAS NO FILTRO) =======

  async function bulkUpdateStatus(toStatus) {
    const filter = buildActiveFilter();

    const ok = confirm(
      `Atualizar status para "${toStatus.toUpperCase()}" em massa?\n` +
        (isFiltered
          ? "Vai afetar apenas o FILTRO atual."
          : "ATENÇÃO: Vai afetar TODOS os pedidos!")
    );
    if (!ok) return;

    const { ok: okRes, status: httpStatus, payload } = await ordersApi.updateMany(
      {
        filter,
        update: { status: toStatus },
      }
    );

    if (!okRes) {
      alert(`Erro ${httpStatus}: ` + JSON.stringify(payload, null, 2));
      return;
    }

    await loadOrdersPaginated();
    await loadStats();
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

    await loadOrdersPaginated();
    await loadStats();
  }

  async function bulkDelete() {
    const filter = buildActiveFilter();

    const ok = confirm(
      "Apagar pedidos em massa?\n" +
        (isFiltered
          ? "Vai apagar apenas os pedidos do FILTRO atual."
          : "ATENÇÃO: Vai apagar TODOS os pedidos!")
    );
    if (!ok) return;

    const { ok: okRes, status: httpStatus, payload } = await ordersApi.deleteMany({
      filter,
    });

    if (!okRes) {
      alert(`Erro ${httpStatus}: ` + JSON.stringify(payload, null, 2));
      return;
    }

    await loadOrdersPaginated();
    await loadStats();
  }

  // ============================================================

  const soldOrders = orders.filter((o) => o.status === "sold");

  const revenue = soldOrders.reduce(
    (acc, o) => acc + Number(o?.prices?.total ?? 0),
    0
  );

  const totalCost = soldOrders.reduce((acc, o) => {
    const orderCost = (o.itens ?? []).reduce((a, it) => {
      return a + Number(it.quantidade ?? 0) * Number(it.cost ?? 0);
    }, 0);
    return acc + orderCost;
  }, 0);

  const profit = revenue - totalCost;

  const orderTotalPreview = items.reduce(
    (acc, it) => acc + Number(it.quantidade || 0) * Number(it.price || 0),
    0
  );

  function formatDateBR(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR");
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

      <form onSubmit={handleCreateOrder} className="card form">
        <div className="row">
          <div>
            <div style={{ fontWeight: 800, letterSpacing: "-0.4px" }}>
              Criar pedido
            </div>
            <div className="mini">Preencha só o essencial. O total é calculado.</div>
          </div>

          <div className="mini">
            Total: <strong>R$ {orderTotalPreview.toFixed(2)}</strong>
          </div>
        </div>

        <div className="sep"></div>

        <div className="formGrid">
          <label className="label">
            Nome do cliente
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Joao"
              required
            />
          </label>

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

              <button
                type="button"
                className="btn"
                onClick={addItemRow}
                disabled={loading}
              >
                + Adicionar item
              </button>
            </div>

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
                  Item
                  <input
                    className="input"
                    value={it.item}
                    onChange={(e) => updateItemRow(idx, "item", e.target.value)}
                    placeholder="Ex: brownie nutella"
                    required
                  />
                </label>

                <label className="label">
                  Qtd
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={it.quantidade}
                    onChange={(e) => updateItemRow(idx, "quantidade", e.target.value)}
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
              {loading ? "Criando..." : "Criar pedido"}
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

          <button type="button" className="btn btnPrimary" onClick={applyFilter} disabled={loading}>
            Filtrar
          </button>

          <button type="button" className="btn" onClick={clearFilter} disabled={loading}>
            Limpar
          </button>
        </div>
      </div>

      {/* AÇÕES EM MASSA (TÓPICO 7) */}
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
            className="btn btnDanger"
            disabled={loading}
            onClick={bulkDelete}
          >
            Apagar filtrados
          </button>
        </div>

        <div className="mini" style={{ marginTop: 8 }}>
          Ações em massa usam o filtro atual. Se você não estiver filtrando, afeta TODOS.
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
              (acc, it) => acc + Number(it.quantidade ?? 0) * Number(it.cost ?? 0),
              0
            );
            const orderProfit = orderTotal - orderCost;

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
                    <div>
                      <strong>Lucro:</strong> R$ {orderProfit.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="sep"></div>

                <div className="row">
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