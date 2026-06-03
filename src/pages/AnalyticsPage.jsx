import { useMemo } from "react";

const TH = ({ children, right }) => (
  <th
    style={{
      textAlign: right ? "right" : "left",
      padding: "8px 10px",
      borderBottom: "2px solid #e5c9a0",
      fontWeight: 700,
      fontSize: 13,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </th>
);

const TD = ({ children, right, bold }) => (
  <td
    style={{
      padding: "7px 10px",
      textAlign: right ? "right" : "left",
      fontWeight: bold ? 700 : 400,
      fontSize: 13,
    }}
  >
    {children}
  </td>
);

function RankTable({ data, columns, keyField, emptyMessage }) {
  if (data.length === 0) {
    return <div className="mini">{emptyMessage}</div>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <TH>#</TH>
            {columns.map((col) => (
              <TH key={col.key} right={col.right}>
                {col.label}
              </TH>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row[keyField]}
              style={{ background: i % 2 === 0 ? "transparent" : "rgba(229,201,160,0.12)" }}
            >
              <TD>{i + 1}</TD>
              {columns.map((col) => (
                <TD key={col.key} right={col.right} bold={col.bold}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </TD>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AnalyticsPage({
  productsRanking,
  clientsRanking,
  analyticsLoading,
  analyticsStartDate,
  setAnalyticsStartDate,
  analyticsEndDate,
  setAnalyticsEndDate,
  analyticsProductFilter,
  setAnalyticsProductFilter,
  loadAnalytics,
  allProducts,
}) {
  const sortedProducts = useMemo(
    () => [...allProducts].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [allProducts]
  );

  const productColumns = [
    { key: "product", label: "Produto", bold: true },
    { key: "total_qty", label: "Qtd vendida", right: true },
    {
      key: "total_revenue",
      label: "Receita",
      right: true,
      render: (v) => `R$ ${Number(v).toFixed(2)}`,
    },
    {
      key: "total_profit",
      label: "Lucro",
      right: true,
      render: (v) => `R$ ${Number(v).toFixed(2)}`,
    },
  ];

  const clientColumns = [
    { key: "client", label: "Cliente", bold: true },
    { key: "total_qty", label: "Qtd total", right: true },
    { key: "top_product", label: "Produto favorito" },
    { key: "top_product_qty", label: "Qtd fav.", right: true },
  ];

  const hasData = productsRanking.length > 0 || clientsRanking.length > 0;

  return (
    <>
      {/* Filtros */}
      <div className="card" style={{ padding: 12, marginTop: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Filtros de analytics</div>
        <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label className="label" style={{ margin: 0 }}>
            De
            <input
              className="input"
              type="date"
              value={analyticsStartDate}
              onChange={(e) => setAnalyticsStartDate(e.target.value)}
            />
          </label>
          <label className="label" style={{ margin: 0 }}>
            Até
            <input
              className="input"
              type="date"
              value={analyticsEndDate}
              onChange={(e) => setAnalyticsEndDate(e.target.value)}
            />
          </label>
          <label className="label" style={{ margin: 0, flex: 1, minWidth: 220 }}>
            Filtrar clientes por produto (exact)
            <input
              className="input"
              list="analytics-products-list"
              placeholder="Ex: Brownie Chocolate"
              value={analyticsProductFilter}
              onChange={(e) => setAnalyticsProductFilter(e.target.value)}
            />
            <datalist id="analytics-products-list">
              {sortedProducts.map((p) => (
                <option key={p._id} value={p.name} />
              ))}
            </datalist>
          </label>
          <button
            type="button"
            className="btn btnPrimary"
            onClick={loadAnalytics}
            disabled={analyticsLoading}
            style={{ alignSelf: "flex-end" }}
          >
            {analyticsLoading ? "Carregando..." : "Buscar"}
          </button>
          {hasData && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setAnalyticsStartDate("");
                setAnalyticsEndDate("");
                setAnalyticsProductFilter("");
              }}
              style={{ alignSelf: "flex-end" }}
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div className="mini" style={{ marginTop: 8 }}>
          O filtro de produto (campo "Filtrar clientes por produto") aplica match exato e afeta apenas o ranking de clientes. Período afeta ambas as tabelas.
        </div>
      </div>

      {/* Produtos mais vendidos */}
      <div className="card" style={{ padding: 12, marginTop: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>
          Produtos mais vendidos
          {productsRanking.length > 0 && (
            <span className="mini" style={{ marginLeft: 8, fontWeight: 400 }}>
              {productsRanking.length} produto{productsRanking.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <RankTable
          data={productsRanking}
          columns={productColumns}
          keyField="product"
          emptyMessage='Clique em "Buscar" para carregar o ranking de produtos.'
        />
      </div>

      {/* Ranking de clientes */}
      <div className="card" style={{ padding: 12, marginTop: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>
          Ranking de clientes
          {clientsRanking.length > 0 && (
            <span className="mini" style={{ marginLeft: 8, fontWeight: 400 }}>
              {clientsRanking.length} cliente{clientsRanking.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <RankTable
          data={clientsRanking}
          columns={clientColumns}
          keyField="client"
          emptyMessage='Clique em "Buscar" para carregar o ranking de clientes.'
        />
      </div>
    </>
  );
}
