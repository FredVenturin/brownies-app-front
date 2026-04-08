import { formatDateBR } from "../utils/formatters";

export function ProductsPage({
  products, deletedProducts, loading,
  productsPage, setProductsPage, productsLimit, setProductsLimit, productsMeta,
  deletedProductsPage, setDeletedProductsPage, deletedProductsLimit, setDeletedProductsLimit, deletedProductsMeta,
  showProductsTrash, setShowProductsTrash,
  editingProductId, editProductName, setEditProductName, editProductSalePrice, setEditProductSalePrice, editProductCost, setEditProductCost,
  startEditProduct, cancelEditProduct, saveProductEdit, removeProduct, restoreProduct,
}) {
  return (
    <>
      <div className="card" style={{ padding: 12, marginTop: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800 }}>Produtos</div>

          <div className="row" style={{ gap: 8, alignItems: "center", marginLeft: "auto" }}>
            <button
              type="button"
              className={`btn ${showProductsTrash ? "btnPrimary" : ""}`}
              disabled={loading}
              onClick={() => setShowProductsTrash((v) => !v)}
            >
              {showProductsTrash ? "Ocultar lixeira" : `Lixeira (${deletedProductsMeta.total})`}
            </button>

            <button type="button" className="btn" disabled={productsPage <= 1 || loading} onClick={() => setProductsPage((p) => p - 1)}>◀ Anterior</button>
            <div className="mini">Página: <strong>{productsPage}</strong> • Total: <strong>{productsMeta.total}</strong></div>
            <button type="button" className="btn" disabled={!productsMeta.has_next || loading} onClick={() => setProductsPage((p) => p + 1)}>Próxima ▶</button>

            <select
              className="select"
              value={productsLimit}
              onChange={(e) => { setProductsPage(1); setProductsLimit(Number(e.target.value)); }}
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

        {editingProductId ? (
          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            <div className="mini" style={{ marginBottom: 8 }}>Editando produto: <strong>{editingProductId}</strong></div>
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <input
                className="input"
                placeholder="Nome"
                value={editProductName}
                onChange={(e) => setEditProductName(e.target.value)}
                style={{ flex: 1, minWidth: 220 }}
              />
              <input
                className="input"
                type="number"
                placeholder="Preço venda"
                value={editProductSalePrice}
                onChange={(e) => setEditProductSalePrice(e.target.value)}
                style={{ width: 160 }}
              />
              <input
                className="input"
                type="number"
                placeholder="Custo"
                value={editProductCost}
                onChange={(e) => setEditProductCost(e.target.value)}
                style={{ width: 140 }}
              />
              <button type="button" className="btn btnPrimary" disabled={loading || !editProductName.trim()} onClick={saveProductEdit}>Salvar</button>
              <button type="button" className="btn" disabled={loading} onClick={cancelEditProduct}>Cancelar</button>
            </div>
          </div>
        ) : null}

        {products.length === 0 ? (
          <div className="mini">Nenhum produto cadastrado.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {products.map((p) => (
              <div
                key={p._id}
                className="card"
                style={{ padding: 10, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div className="mini">
                    Venda: <strong>R$ {Number(p.sale_price ?? 0).toFixed(2)}</strong> • Custo:{" "}
                    <strong>R$ {Number(p.cost ?? 0).toFixed(2)}</strong>
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className="btn" disabled={loading} onClick={() => startEditProduct(p)}>Editar</button>
                  <button type="button" className="btn btnDanger" disabled={loading} onClick={() => removeProduct(p._id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showProductsTrash ? (
        <div className="card" style={{ padding: 12, marginTop: 14 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>Lixeira de produtos</div>
            <div className="row" style={{ gap: 8, alignItems: "center", marginLeft: "auto" }}>
              <button type="button" className="btn" disabled={deletedProductsPage <= 1 || loading} onClick={() => setDeletedProductsPage((p) => p - 1)}>◀ Anterior</button>
              <div className="mini">Página: <strong>{deletedProductsPage}</strong> • Total: <strong>{deletedProductsMeta.total}</strong></div>
              <button type="button" className="btn" disabled={!deletedProductsMeta.has_next || loading} onClick={() => setDeletedProductsPage((p) => p + 1)}>Próxima ▶</button>
              <select
                className="select"
                value={deletedProductsLimit}
                onChange={(e) => { setDeletedProductsPage(1); setDeletedProductsLimit(Number(e.target.value)); }}
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

          {deletedProducts.length === 0 ? (
            <div className="mini">Nenhum produto na lixeira.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {deletedProducts.map((p) => (
                <div
                  key={p._id}
                  className="card"
                  style={{ padding: 10, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div className="mini">
                      Venda: <strong>R$ {Number(p.sale_price ?? 0).toFixed(2)}</strong> • Custo:{" "}
                      <strong>R$ {Number(p.cost ?? 0).toFixed(2)}</strong>
                    </div>
                    <div className="mini">Excluído em: {formatDateBR(p.deleted_at)}</div>
                  </div>
                  <button type="button" className="btn btnPrimary" disabled={loading} onClick={() => restoreProduct(p._id)}>Restaurar</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
