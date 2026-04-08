import { useEffect, useState } from "react";
import { ordersApi } from "../services/api";

export function useClients() {
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [deletedClients, setDeletedClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const [clientsPage, setClientsPage] = useState(1);
  const [clientsLimit, setClientsLimit] = useState(10);
  const [clientsMeta, setClientsMeta] = useState({ page: 1, limit: 10, total: 0, has_next: false });

  const [deletedClientsPage, setDeletedClientsPage] = useState(1);
  const [deletedClientsLimit, setDeletedClientsLimit] = useState(10);
  const [deletedClientsMeta, setDeletedClientsMeta] = useState({ page: 1, limit: 10, total: 0, has_next: false });

  const [showClientsTrash, setShowClientsTrash] = useState(false);

  const [editingClientId, setEditingClientId] = useState(null);
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");

  // ── Loaders ────────────────────────────────────────────────────────────────

  async function loadClients() {
    try {
      const res = await ordersApi.listClients({ page: clientsPage, limit: clientsLimit });
      const payload = res?.payload ?? res;
      const list = payload?.data?.attributes ?? [];
      const metaFromApi = payload?.data?.meta ?? payload?.meta;
      setClients(list);
      setClientsMeta(
        metaFromApi ?? {
          page: clientsPage,
          limit: clientsLimit,
          total: list.length,
          has_next: list.length === clientsLimit,
        }
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAllClients() {
    try {
      const res = await ordersApi.listAllClients();
      const payload = res?.payload ?? res;
      const list = payload?.data?.attributes ?? [];
      setAllClients(list);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadDeletedClients() {
    try {
      const res = await ordersApi.listDeletedClients({ page: deletedClientsPage, limit: deletedClientsLimit });
      const payload = res?.payload ?? res;
      const list = payload?.data?.attributes ?? [];
      const metaFromApi = payload?.data?.meta ?? payload?.meta;
      setDeletedClients(list);
      setDeletedClientsMeta(
        metaFromApi ?? {
          page: deletedClientsPage,
          limit: deletedClientsLimit,
          total: list.length,
          has_next: list.length === deletedClientsLimit,
        }
      );
    } catch (err) {
      console.error(err);
    }
  }

  // ── Reload helpers ─────────────────────────────────────────────────────────

  async function reloadClients() {
    await Promise.allSettled([loadClients(), loadAllClients()]);
  }

  async function reloadClientsWithTrash() {
    await Promise.allSettled([loadClients(), loadAllClients(), loadDeletedClients()]);
  }

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.allSettled([loadClients(), loadAllClients(), loadDeletedClients()]).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientsPage, clientsLimit, deletedClientsPage, deletedClientsLimit]);

  // ── CRUD ───────────────────────────────────────────────────────────────────

  function startEditClient(client) {
    setEditingClientId(client._id);
    setEditClientName(client.name ?? "");
    setEditClientPhone(client.phone ?? "");
  }

  function cancelEditClient() {
    setEditingClientId(null);
    setEditClientName("");
    setEditClientPhone("");
  }

  async function saveClientEdit() {
    if (!editingClientId) return;
    setLoading(true);
    try {
      const res = await ordersApi.updateClient(editingClientId, {
        data: { name: editClientName.trim(), phone: editClientPhone.trim() || null },
      });
      if (!res?.ok) { alert("Erro ao atualizar cliente."); console.error(res); return; }
      await reloadClients();
      cancelEditClient();
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar cliente (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  async function removeClient(clientId) {
    const ok = confirm("Tem certeza que deseja excluir este cliente?");
    if (!ok) return;
    setLoading(true);
    try {
      const res = await ordersApi.deleteClient(clientId);
      if (!res?.ok) { alert("Erro ao excluir cliente."); console.error(res); return; }
      await reloadClientsWithTrash();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir cliente (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  async function restoreClient(clientId) {
    setLoading(true);
    try {
      const res = await ordersApi.restoreClient(clientId);
      if (!res?.ok) { alert("Erro ao restaurar cliente."); console.error(res); return; }
      await reloadClientsWithTrash();
    } catch (err) {
      console.error(err);
      alert("Erro ao restaurar cliente (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  return {
    clients, allClients, deletedClients, loading,
    clientsPage, setClientsPage, clientsLimit, setClientsLimit, clientsMeta,
    deletedClientsPage, setDeletedClientsPage, deletedClientsLimit, setDeletedClientsLimit, deletedClientsMeta,
    showClientsTrash, setShowClientsTrash,
    editingClientId, editClientName, setEditClientName, editClientPhone, setEditClientPhone,
    startEditClient, cancelEditClient, saveClientEdit, removeClient, restoreClient,
    reloadClients, reloadClientsWithTrash,
  };
}
