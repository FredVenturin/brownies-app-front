import { formatDateBR } from "../utils/formatters";

export function ClientsPage({
  clients, deletedClients, loading,
  clientsPage, setClientsPage, clientsLimit, setClientsLimit, clientsMeta,
  deletedClientsPage, setDeletedClientsPage, deletedClientsLimit, setDeletedClientsLimit, deletedClientsMeta,
  showClientsTrash, setShowClientsTrash,
  editingClientId, editClientName, setEditClientName, editClientPhone, setEditClientPhone,
  startEditClient, cancelEditClient, saveClientEdit, removeClient, restoreClient,
}) {
  return (
    <>
      <div className="card" style={{ padding: 12, marginTop: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800 }}>Clientes</div>

          <div className="row" style={{ gap: 8, alignItems: "center", marginLeft: "auto" }}>
            <button
              type="button"
              className={`btn ${showClientsTrash ? "btnPrimary" : ""}`}
              disabled={loading}
              onClick={() => setShowClientsTrash((v) => !v)}
            >
              {showClientsTrash ? "Ocultar lixeira" : `Lixeira (${deletedClientsMeta.total})`}
            </button>

            <button type="button" className="btn" disabled={clientsPage <= 1 || loading} onClick={() => setClientsPage((p) => p - 1)}>◀ Anterior</button>
            <div className="mini">Página: <strong>{clientsPage}</strong> • Total: <strong>{clientsMeta.total}</strong></div>
            <button type="button" className="btn" disabled={!clientsMeta.has_next || loading} onClick={() => setClientsPage((p) => p + 1)}>Próxima ▶</button>

            <select
              className="select"
              value={clientsLimit}
              onChange={(e) => { setClientsPage(1); setClientsLimit(Number(e.target.value)); }}
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

        {editingClientId ? (
          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            <div className="mini" style={{ marginBottom: 8 }}>Editando cliente: <strong>{editingClientId}</strong></div>
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <input
                className="input"
                placeholder="Nome"
                value={editClientName}
                onChange={(e) => setEditClientName(e.target.value)}
                style={{ flex: 1, minWidth: 220 }}
              />
              <input
                className="input"
                placeholder="Telefone (opcional)"
                value={editClientPhone}
                onChange={(e) => setEditClientPhone(e.target.value)}
                style={{ width: 220 }}
              />
              <button type="button" className="btn btnPrimary" disabled={loading || !editClientName.trim()} onClick={saveClientEdit}>Salvar</button>
              <button type="button" className="btn" disabled={loading} onClick={cancelEditClient}>Cancelar</button>
            </div>
          </div>
        ) : null}

        {clients.length === 0 ? (
          <div className="mini">Nenhum cliente cadastrado.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {clients.map((c) => (
              <div
                key={c._id}
                className="card"
                style={{ padding: 10, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div className="mini">{c.phone ? c.phone : "Sem telefone"}</div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className="btn" disabled={loading} onClick={() => startEditClient(c)}>Editar</button>
                  <button type="button" className="btn btnDanger" disabled={loading} onClick={() => removeClient(c._id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showClientsTrash ? (
        <div className="card" style={{ padding: 12, marginTop: 14 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>Lixeira de clientes</div>
            <div className="row" style={{ gap: 8, alignItems: "center", marginLeft: "auto" }}>
              <button type="button" className="btn" disabled={deletedClientsPage <= 1 || loading} onClick={() => setDeletedClientsPage((p) => p - 1)}>◀ Anterior</button>
              <div className="mini">Página: <strong>{deletedClientsPage}</strong> • Total: <strong>{deletedClientsMeta.total}</strong></div>
              <button type="button" className="btn" disabled={!deletedClientsMeta.has_next || loading} onClick={() => setDeletedClientsPage((p) => p + 1)}>Próxima ▶</button>
              <select
                className="select"
                value={deletedClientsLimit}
                onChange={(e) => { setDeletedClientsPage(1); setDeletedClientsLimit(Number(e.target.value)); }}
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

          {deletedClients.length === 0 ? (
            <div className="mini">Nenhum cliente na lixeira.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {deletedClients.map((c) => (
                <div
                  key={c._id}
                  className="card"
                  style={{ padding: 10, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <div className="mini">{c.phone ? c.phone : "Sem telefone"}</div>
                    <div className="mini">Excluído em: {formatDateBR(c.deleted_at)}</div>
                  </div>
                  <button type="button" className="btn btnPrimary" disabled={loading} onClick={() => restoreClient(c._id)}>Restaurar</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
