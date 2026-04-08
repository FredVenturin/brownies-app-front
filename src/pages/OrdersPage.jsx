import { memo, useMemo } from "react";
import { ordersApi } from "../services/api";
import { formatDateBR } from "../utils/formatters";

const OrderCard = memo(function OrderCard({ order, loading, onUpdateStatus, onStartEdit, onDelete }) {
  const orderTotal = (order.itens ?? []).reduce(
    (acc, it) => acc + Number(it.quantidade ?? 0) * Number(it.price ?? 0),
    0
  );
  const orderCost = (order.itens ?? []).reduce(
    (acc, it) => acc + Number(it.quantidade ?? 0) * Number(it.cost ?? 0),
    0
  );
  const orderProfit = order.status === "sold" ? orderTotal - orderCost : 0;

  return (
    <div className={`card orderCard status-${order.status || "unknown"}`}>
      <div className="row">
        <div style={{ fontWeight: 800 }}>{order.name}</div>
        <span className={`pill pill-${order.status || "unknown"}`}>
          {String(order.status || "").toUpperCase()}
        </span>
      </div>

      <div className="kv">
        <div><strong>ID:</strong> {order._id}</div>
        <div><strong>Data:</strong> {formatDateBR(order.order_date)}</div>
      </div>

      <div className="sep" />

      <div style={{ marginTop: 8 }}>
        <strong>Itens:</strong>
        {(order.itens ?? []).map((it, idx) => (
          <div
            key={idx}
            style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 4 }}
          >
            <span>{it.quantidade}x {it.item}</span>
            <span>R$ {(Number(it.quantidade) * Number(it.price)).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ marginTop: 8, fontWeight: "bold" }}>
          Total: R$ {orderTotal.toFixed(2)}
        </div>
        <div style={{ marginTop: 8 }}>
          <div><strong>Custo:</strong> R$ {orderCost.toFixed(2)}</div>
          {order.status === "sold" ? (
            <div><strong>Lucro:</strong> R$ {orderProfit.toFixed(2)}</div>
          ) : null}
        </div>
      </div>

      <div className="sep" />

      <div className="row" style={{ gap: 8 }}>
        <select
          className="select"
          value={order.status}
          onChange={(e) => onUpdateStatus(order._id, e.target.value)}
          disabled={loading}
          style={{ flex: 1 }}
        >
          <option value="confirmed">confirmed</option>
          <option value="preparing">preparing</option>
          <option value="packed">packed</option>
          <option value="sold">sold</option>
          <option value="cancelled">cancelled</option>
        </select>

        <button type="button" className="btn" onClick={() => onStartEdit(order)} disabled={loading}>
          Editar
        </button>

        <button type="button" className="btn btnDanger" onClick={() => onDelete(order._id)} disabled={loading}>
          Excluir
        </button>
      </div>
    </div>
  );
});

export function OrdersPage({
  allClients,
  allProducts,
  onClientCreated,
  onProductCreated,
  // from useOrders:
  orders, deletedOrders, loading,
  stats,
  profitSummary, profitYear, setProfitYear, profitMonth, setProfitMonth, profitDay, setProfitDay, profitPeriod,
  meta, page, setPage, limit, setLimit,
  orderDate, setOrderDate,
  name, setName, items, status, setStatus,
  startDate, setStartDate, endDate, setEndDate, isFiltered,
  filterStatus, setFilterStatus, filterName, setFilterName, filterProduct, setFilterProduct,
  groupBy, setGroupBy,
  isEditing,
  deletedOrdersPage, setDeletedOrdersPage, deletedOrdersLimit, setDeletedOrdersLimit, deletedOrdersMeta,
  showOrdersTrash, setShowOrdersTrash,
  showNewClient, setShowNewClient, newClientName, setNewClientName, newClientPhone, setNewClientPhone,
  showNewProduct, setShowNewProduct, newProductName, setNewProductName, newProductSalePrice, setNewProductSalePrice, newProductCost, setNewProductCost,
  pagedGroupedOrders, groupedTotalItems, groupedHasNext,
  orderTotalPreview, revenue, totalCost, profit,
  GROUP_MODES,
  applyFilter, clearFilter,
  addItemRow, removeItemRow, updateItemRow,
  deleteOrder, restoreOrder, updateOrderStatus,
  startEditOrder, cancelEditOrder, handleUpdateOrder, handleCreateOrder,
  bulkUpdateStatus, bulkIncrement, bulkDelete,
}) {
  const sortedClients = useMemo(
    () => [...allClients].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [allClients]
  );

  const sortedProducts = useMemo(
    () => [...allProducts].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [allProducts]
  );

  return (
    <>
      {/* Stats */}
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
            <select className="select" value={profitYear} onChange={(e) => setProfitYear(e.target.value)} style={{ width: 120 }}>
              {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="select" value={profitMonth} onChange={(e) => setProfitMonth(e.target.value)} style={{ width: 140 }}>
              <option value="">Todos meses</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="select" value={profitDay} onChange={(e) => setProfitDay(e.target.value)} style={{ width: 140 }}>
              <option value="">Todos dias</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="statValue">R$ {Number(profitPeriod.result?.profit ?? 0).toFixed(2)}</div>
            <div className="mini" style={{ marginTop: 6 }}>
              Receita: <strong>R$ {Number(profitPeriod.result?.revenue ?? 0).toFixed(2)}</strong>{" "}
              • Custo: <strong>R$ {Number(profitPeriod.result?.cost ?? 0).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div className="card statCard"><div className="statValue">{stats.confirmed}</div><div className="statLabel">Confirmed</div></div>
        <div className="card statCard"><div className="statValue">{stats.preparing}</div><div className="statLabel">Preparing</div></div>
        <div className="card statCard"><div className="statValue">{stats.packed}</div><div className="statLabel">Packed</div></div>
        <div className="card statCard"><div className="statValue">{stats.sold}</div><div className="statLabel">Sold</div></div>
        <div className="card statCard"><div className="statValue">{stats.cancelled}</div><div className="statLabel">Cancelled</div></div>
      </div>

      {/* Form */}
      <form onSubmit={isEditing ? handleUpdateOrder : handleCreateOrder} className="card form">
        <div className="row">
          <div>
            <div style={{ fontWeight: 800, letterSpacing: "-0.4px" }}>{isEditing ? "Editar pedido" : "Criar pedido"}</div>
            <div className="mini">Preencha só o essencial. O total é calculado.</div>
          </div>
          <div className="mini">Total: <strong>R$ {orderTotalPreview.toFixed(2)}</strong></div>
          {isEditing ? (
            <button type="button" className="btn" onClick={cancelEditOrder} disabled={loading} style={{ marginLeft: "auto" }}>
              Cancelar edição
            </button>
          ) : null}
        </div>

        <div className="sep" />

        <div className="formGrid">
          {/* Cliente */}
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
                {sortedClients.map((c) => <option key={c._id} value={c.name} />)}
              </datalist>
            </label>

            <div className="row" style={{ gap: 10, justifyContent: "flex-start" }}>
              <button type="button" className="btn" onClick={() => setShowNewClient((v) => !v)} disabled={loading}>
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
                        const res = await ordersApi.createClient({
                          data: { name: newClientName.trim(), phone: newClientPhone.trim() || undefined },
                        });
                        if (!res?.ok) { alert("Erro ao criar cliente. Veja o console."); console.error(res); return; }
                        await onClientCreated();
                        setName(newClientName.trim());
                        setNewClientName("");
                        setNewClientPhone("");
                        setShowNewClient(false);
                      } catch (err) {
                        console.error(err);
                        alert("Erro ao criar cliente (veja o console).");
                      }
                    }}
                  >
                    Salvar cliente
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Status */}
          <label className="label">
            Status
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="confirmed">confirmed</option>
              <option value="preparing">preparing</option>
              <option value="packed">packed</option>
              <option value="sold">sold</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>

          {/* Data */}
          <label className="label">
            Data do pedido
            <input className="input" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </label>

          {/* Itens */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontWeight: 800 }}>Itens</div>
              <div className="row" style={{ gap: 8 }}>
                <button type="button" className="btn" onClick={() => setShowNewProduct((v) => !v)} disabled={loading}>
                  {showNewProduct ? "Fechar cadastro" : "+ Cadastrar produto"}
                </button>
                <button type="button" className="btn" onClick={addItemRow} disabled={loading}>
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
                        const res = await ordersApi.createProduct({
                          data: {
                            name: newProductName.trim(),
                            sale_price: Number(newProductSalePrice),
                            cost: Number(newProductCost),
                          },
                        });
                        if (!res?.ok) { alert("Erro ao criar produto."); console.error(res); return; }
                        await onProductCreated();
                        setNewProductName("");
                        setNewProductSalePrice("");
                        setNewProductCost("");
                        setShowNewProduct(false);
                      } catch (err) {
                        console.error(err);
                        alert("Erro ao criar produto.");
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
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
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
                    {sortedProducts.map((p) => <option key={p._id} value={p.name} />)}
                  </datalist>
                </label>
                <label className="label">
                  Qtd
                  <input className="input" type="number" min="1" value={it.quantidade} onChange={(e) => updateItemRow(idx, "quantidade", e.target.value)} required />
                </label>
                <label className="label">
                  Preço
                  <input className="input" type="number" min="0" step="0.01" value={it.price} onChange={(e) => updateItemRow(idx, "price", e.target.value)} required />
                </label>
                <label className="label">
                  Custo
                  <input className="input" type="number" min="0" step="0.01" value={it.cost} onChange={(e) => updateItemRow(idx, "cost", e.target.value)} required />
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
              {loading ? (isEditing ? "Salvando..." : "Criando...") : isEditing ? "Salvar alterações" : "Criar pedido"}
            </button>
          </div>
        </div>
      </form>

      {/* Filtros */}
      <div className="card" style={{ padding: 12, marginTop: 14 }}>
        <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "stretch" }}>
          <input
            className="input"
            list="clients-list"
            placeholder="Filtrar por cliente..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            className="input"
            list="products-list"
            placeholder="Filtrar por produto..."
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            style={{ flex: 1 }}
          />
          <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 160 }}>
            <option value="">Todos status</option>
            <option value="confirmed">confirmed</option>
            <option value="preparing">preparing</option>
            <option value="packed">packed</option>
            <option value="sold">sold</option>
            <option value="cancelled">cancelled</option>
          </select>
          <select className="select" value={groupBy} onChange={(e) => setGroupBy(e.target.value)} style={{ width: 220 }}>
            <option value="none">Sem agrupamento</option>
            <option value={GROUP_MODES.STATUS}>Agrupar: status</option>
            <option value={GROUP_MODES.STATUS_NAME}>Agrupar: status + nome</option>
            <option value={GROUP_MODES.STATUS_DATE}>Agrupar: status + data</option>
            <option value={GROUP_MODES.NAME}>Agrupar: nome</option>
            <option value={GROUP_MODES.DATE}>Agrupar: data</option>
          </select>
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button type="button" className="btn btnPrimary" onClick={applyFilter} disabled={loading}>Filtrar</button>
          <button type="button" className="btn" onClick={clearFilter} disabled={loading} style={{ whiteSpace: "nowrap" }}>Limpar</button>
        </div>
      </div>

      {/* Ações em massa */}
      <div className="card" style={{ padding: 12, marginTop: 14 }}>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn" disabled={loading} onClick={() => bulkUpdateStatus("sold")}>Marcar filtrados como SOLD</button>
          <button type="button" className="btn" disabled={loading} onClick={() => bulkUpdateStatus("cancelled")}>Marcar filtrados como CANCELLED</button>
          <button type="button" className="btn" disabled={loading} onClick={() => bulkIncrement("prices.total", 1)} title="Incrementa prices.total em +1">+1 em preço total (filtrados)</button>
          <button type="button" className="btn" disabled={loading} onClick={() => bulkIncrement("prices.total", -1)} title="Decrementa prices.total em -1">-1 em preço total (filtrados)</button>
          <button type="button" className="btn btnDanger" disabled={loading} onClick={bulkDelete}>Apagar filtrados</button>
          <button
            type="button"
            className={`btn ${showOrdersTrash ? "btnPrimary" : ""}`}
            disabled={loading}
            onClick={() => setShowOrdersTrash((v) => !v)}
            style={{ marginLeft: "auto" }}
          >
            {showOrdersTrash ? "Ocultar lixeira" : `Lixeira (${deletedOrdersMeta.total})`}
          </button>
        </div>
        <div className="mini" style={{ marginTop: 8 }}>
          Ações em massa usam o filtro atual. Se você não estiver filtrando, afeta TODOS.
        </div>
      </div>

      {/* Paginação */}
      <div className="card" style={{ padding: 12, marginTop: 14 }}>
        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <button type="button" className="btn" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>◀ Anterior</button>
          <div className="mini">
            Página: <strong>{page}</strong> • Total:{" "}
            <strong>{groupBy === "none" ? meta.total : groupedTotalItems}</strong>
            {groupBy !== "none" ? " • Paginação após agrupamento" : ""}
          </div>
          <button
            type="button"
            className="btn"
            disabled={groupBy === "none" ? !meta.has_next || loading : !groupedHasNext || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima ▶
          </button>
          <select
            className="select"
            value={limit}
            onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
            style={{ width: 140, marginLeft: "auto" }}
          >
            <option value={5}>5 / pág</option>
            <option value={10}>10 / pág</option>
            <option value={20}>20 / pág</option>
            <option value={50}>50 / pág</option>
          </select>
        </div>
      </div>

      {/* Lista de pedidos */}
      {orders.length === 0 ? (
        <p className="mini">Nenhum pedido encontrado.</p>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          {pagedGroupedOrders.map((group, groupIndex) => (
            <div key={`${group.label}-${groupIndex}`} className="card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>
                {String(group.label || "").toUpperCase()}
              </div>

              {"groups" in group ? (
                <div style={{ display: "grid", gap: 14 }}>
                  {group.groups.map((subgroup, subIndex) => (
                    <div key={`${group.label}-${subgroup.label}-${subIndex}`}>
                      <div className="mini" style={{ marginBottom: 8, fontWeight: 700 }}>{subgroup.label}</div>
                      <div className="grid orders">
                        {subgroup.items.map((order) => (
                          <OrderCard
                            key={order._id}
                            order={order}
                            loading={loading}
                            onUpdateStatus={updateOrderStatus}
                            onStartEdit={startEditOrder}
                            onDelete={deleteOrder}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid orders">
                  {group.items.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      loading={loading}
                      onUpdateStatus={updateOrderStatus}
                      onStartEdit={startEditOrder}
                      onDelete={deleteOrder}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lixeira de pedidos */}
      {showOrdersTrash ? (
        <div className="card" style={{ padding: 12, marginTop: 14 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>Lixeira de pedidos</div>
            <div className="row" style={{ gap: 8, alignItems: "center", marginLeft: "auto" }}>
              <button type="button" className="btn" disabled={deletedOrdersPage <= 1 || loading} onClick={() => setDeletedOrdersPage((p) => p - 1)}>◀ Anterior</button>
              <div className="mini">Página: <strong>{deletedOrdersPage}</strong> • Total: <strong>{deletedOrdersMeta.total}</strong></div>
              <button type="button" className="btn" disabled={!deletedOrdersMeta.has_next || loading} onClick={() => setDeletedOrdersPage((p) => p + 1)}>Próxima ▶</button>
              <select
                className="select"
                value={deletedOrdersLimit}
                onChange={(e) => { setDeletedOrdersPage(1); setDeletedOrdersLimit(Number(e.target.value)); }}
                style={{ width: 140 }}
              >
                <option value={5}>5 / pág</option>
                <option value={10}>10 / pág</option>
                <option value={20}>20 / pág</option>
                <option value={50}>50 / pág</option>
              </select>
            </div>
          </div>

          <div className="sep" />

          {deletedOrders.length === 0 ? (
            <div className="mini">Nenhum pedido na lixeira.</div>
          ) : (
            <div className="grid orders">
              {deletedOrders.map((order) => {
                const orderTotal = (order.itens ?? []).reduce(
                  (acc, it) => acc + Number(it.quantidade ?? 0) * Number(it.price ?? 0),
                  0
                );
                return (
                  <div key={order._id} className="card orderCard" style={{ opacity: 0.9 }}>
                    <div className="row">
                      <div style={{ fontWeight: 800 }}>{order.name}</div>
                      <span className="pill">LIXEIRA</span>
                    </div>
                    <div className="kv">
                      <div><strong>ID:</strong> {order._id}</div>
                      <div><strong>Data:</strong> {formatDateBR(order.order_date)}</div>
                    </div>
                    <div className="mini" style={{ marginTop: 8 }}>Excluído em: {formatDateBR(order.deleted_at)}</div>
                    <div style={{ marginTop: 8, fontWeight: "bold" }}>Total: R$ {orderTotal.toFixed(2)}</div>
                    <div className="sep" />
                    <button type="button" className="btn btnPrimary" disabled={loading} onClick={() => restoreOrder(order._id)}>
                      Restaurar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
