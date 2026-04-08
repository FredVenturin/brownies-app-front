import { useEffect, useMemo, useState } from "react";
import { ordersApi } from "../services/api";
import { toISODateInput } from "../utils/formatters";

export const GROUP_MODES = {
  STATUS: "status",
  STATUS_NAME: "status_name",
  STATUS_DATE: "status_date",
  NAME: "name",
  DATE: "date",
};

const STATUS_ORDER = ["confirmed", "preparing", "packed", "cancelled", "sold"];

function formatDateBRLocal(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

export function useOrders({ allProducts = [] } = {}) {
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [deletedOrders, setDeletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({ total: 0, confirmed: 0, preparing: 0, packed: 0, sold: 0, cancelled: 0 });
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

  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, has_next: false });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [orderDate, setOrderDate] = useState(todayISO);
  const [name, setName] = useState("");
  const [items, setItems] = useState([{ item: "", quantidade: 1, price: 0, cost: 0 }]);
  const [status, setStatus] = useState("confirmed");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterProduct, setFilterProduct] = useState("");

  const [groupBy, setGroupBy] = useState("none");

  const [editingOrderId, setEditingOrderId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [deletedOrdersPage, setDeletedOrdersPage] = useState(1);
  const [deletedOrdersLimit, setDeletedOrdersLimit] = useState(10);
  const [deletedOrdersMeta, setDeletedOrdersMeta] = useState({ page: 1, limit: 10, total: 0, has_next: false });
  const [showOrdersTrash, setShowOrdersTrash] = useState(false);

  // Inline quick-create inside order form
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductSalePrice, setNewProductSalePrice] = useState("");
  const [newProductCost, setNewProductCost] = useState("");

  // ── Loaders ────────────────────────────────────────────────────────────────

  async function loadOrdersPaginated() {
    try {
      const res = isFiltered
        ? await ordersApi.filter({
            status: filterStatus || undefined,
            name: filterName || undefined,
            product: filterProduct || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            page,
            limit,
          })
        : await ordersApi.listPaginated({ page, limit });

      const payload = res?.payload ?? res;
      const list = payload?.data?.attributes ?? [];
      const metaFromApi = payload?.data?.meta ?? payload?.meta;

      setOrders(list);
      setMeta(metaFromApi ?? { page, limit, total: list.length, has_next: list.length === limit });
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAllOrders() {
    try {
      const res = isFiltered
        ? await ordersApi.filter({
            status: filterStatus || undefined,
            name: filterName || undefined,
            product: filterProduct || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
          })
        : await ordersApi.listAll();

      const payload = res?.payload ?? res;
      const list = payload?.data?.attributes ?? [];
      setAllOrders(list);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadDeletedOrders() {
    try {
      const res = await ordersApi.listDeletedOrders({ page: deletedOrdersPage, limit: deletedOrdersLimit });
      const payload = res?.payload ?? res;
      const list = payload?.data?.attributes ?? [];
      const metaFromApi = payload?.data?.meta ?? payload?.meta;
      setDeletedOrders(list);
      setDeletedOrdersMeta(
        metaFromApi ?? {
          page: deletedOrdersPage,
          limit: deletedOrdersLimit,
          total: list.length,
          has_next: list.length === deletedOrdersLimit,
        }
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function loadStats() {
    try {
      const res = await ordersApi.stats();
      const payload = res?.payload ?? res;
      const attrs = payload?.data?.attributes ?? {};
      setStats({
        total: attrs.total ?? 0,
        confirmed: attrs.confirmed ?? 0,
        preparing: attrs.preparing ?? 0,
        packed: attrs.packed ?? 0,
        sold: attrs.sold ?? 0,
        cancelled: attrs.cancelled ?? 0,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProfitSummary() {
    try {
      const res = await ordersApi.profitSummary();
      const payload = res?.payload ?? res;
      const attrs = payload?.data?.attributes ?? {
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

  // ── Reload helpers ─────────────────────────────────────────────────────────

  async function reloadOrders() {
    const tasks = [loadOrdersPaginated(), loadStats(), loadProfitSummary(), loadProfitPeriod()];
    if (groupBy !== "none") tasks.push(loadAllOrders());
    await Promise.allSettled(tasks);
  }

  async function reloadOrdersWithTrash() {
    const tasks = [loadOrdersPaginated(), loadDeletedOrders(), loadStats(), loadProfitSummary(), loadProfitPeriod()];
    if (groupBy !== "none") tasks.push(loadAllOrders());
    await Promise.allSettled(tasks);
  }

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const tasks = [loadOrdersPaginated(), loadDeletedOrders(), loadStats(), loadProfitSummary(), loadProfitPeriod()];
    if (groupBy !== "none") tasks.push(loadAllOrders());
    Promise.allSettled(tasks).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, isFiltered, filterStatus, filterName, filterProduct, startDate, endDate, deletedOrdersPage, deletedOrdersLimit]);

  useEffect(() => {
    if (!profitYear) return;
    loadProfitPeriod().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profitYear, profitMonth, profitDay]);

  // ── Grouping ───────────────────────────────────────────────────────────────

  const groupedOrders = useMemo(() => {
    if (groupBy === "none") {
      return [{ label: "Pedidos", items: Array.isArray(orders) ? orders : [] }];
    }

    const list =
      Array.isArray(allOrders) && allOrders.length > 0
        ? allOrders
        : Array.isArray(orders)
        ? orders
        : [];

    const sortByName = (arr) =>
      [...arr].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "pt-BR"));

    const sortByDateDesc = (arr) =>
      [...arr].sort((a, b) => new Date(b?.order_date || 0) - new Date(a?.order_date || 0));

    const groupFlat = (arr, getKey, sorter) => {
      const groups = {};
      (sorter ? sorter(arr) : [...arr]).forEach((order) => {
        const key = getKey(order);
        if (!groups[key]) groups[key] = [];
        groups[key].push(order);
      });
      return Object.entries(groups).map(([label, items]) => ({ label, items }));
    };

    const groupByStatus = (arr) => {
      const groups = {};
      STATUS_ORDER.forEach((s) => { groups[s] = []; });
      arr.forEach((order) => {
        const s = String(order?.status || "");
        if (!groups[s]) groups[s] = [];
        groups[s].push(order);
      });
      return Object.entries(groups)
        .filter(([, items]) => items.length > 0)
        .map(([label, items]) => ({ label, items }));
    };

    const groupNestedByStatusThen = (arr, getChildKey, childSorter) => {
      const statusGroups = {};
      STATUS_ORDER.forEach((s) => { statusGroups[s] = []; });
      arr.forEach((order) => {
        const s = String(order?.status || "");
        if (!statusGroups[s]) statusGroups[s] = [];
        statusGroups[s].push(order);
      });
      return Object.entries(statusGroups)
        .filter(([, items]) => items.length > 0)
        .map(([statusLabel, statusItems]) => {
          const childGroups = {};
          (childSorter ? childSorter(statusItems) : [...statusItems]).forEach((order) => {
            const childKey = getChildKey(order);
            if (!childGroups[childKey]) childGroups[childKey] = [];
            childGroups[childKey].push(order);
          });
          return {
            label: statusLabel,
            groups: Object.entries(childGroups).map(([label, items]) => ({ label, items })),
          };
        });
    };

    if (groupBy === GROUP_MODES.NAME) {
      return groupFlat(
        list,
        (order) => {
          const raw = String(order?.name || "").trim();
          return raw ? raw.toLowerCase() : "sem nome";
        },
        sortByName
      ).map((group) => ({
        ...group,
        label:
          group.label === "sem nome"
            ? "Sem nome"
            : group.label
                .split(" ")
                .filter(Boolean)
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" "),
      }));
    }

    if (groupBy === GROUP_MODES.DATE) {
      return groupFlat(
        list,
        (order) => (order?.order_date ? formatDateBRLocal(order.order_date) : "Sem data"),
        sortByDateDesc
      );
    }

    if (groupBy === GROUP_MODES.STATUS_NAME) {
      return groupNestedByStatusThen(list, (order) => String(order?.name || "Sem nome"), sortByName);
    }

    if (groupBy === GROUP_MODES.STATUS_DATE) {
      return groupNestedByStatusThen(
        list,
        (order) => (order?.order_date ? formatDateBRLocal(order.order_date) : "Sem data"),
        sortByDateDesc
      );
    }

    return groupByStatus(list);
  }, [orders, allOrders, groupBy]);

  const pagedGroupedOrders = useMemo(() => {
    if (groupBy === "none") return groupedOrders;

    let remainingToSkip = (page - 1) * limit;
    let remainingToTake = limit;
    const result = [];

    for (const group of groupedOrders) {
      if (remainingToTake <= 0) break;

      if ("groups" in group) {
        const newSubgroups = [];
        for (const subgroup of group.groups) {
          if (remainingToTake <= 0) break;
          const subgroupItems = subgroup.items ?? [];
          const start = Math.min(remainingToSkip, subgroupItems.length);
          const available = subgroupItems.length - start;
          const take = Math.min(remainingToTake, available);
          if (take > 0) {
            newSubgroups.push({ ...subgroup, items: subgroupItems.slice(start, start + take) });
            remainingToTake -= take;
          }
          remainingToSkip = Math.max(0, remainingToSkip - subgroupItems.length);
        }
        if (newSubgroups.length > 0) result.push({ ...group, groups: newSubgroups });
      } else {
        const groupItems = group.items ?? [];
        const start = Math.min(remainingToSkip, groupItems.length);
        const available = groupItems.length - start;
        const take = Math.min(remainingToTake, available);
        if (take > 0) {
          result.push({ ...group, items: groupItems.slice(start, start + take) });
          remainingToTake -= take;
        }
        remainingToSkip = Math.max(0, remainingToSkip - groupItems.length);
      }
    }

    return result;
  }, [groupedOrders, groupBy, page, limit]);

  const groupedTotalItems = useMemo(() => {
    if (groupBy === "none") return meta.total;
    return groupedOrders.reduce((acc, group) => {
      if ("groups" in group) {
        return acc + group.groups.reduce((subAcc, sub) => subAcc + (sub.items?.length ?? 0), 0);
      }
      return acc + (group.items?.length ?? 0);
    }, 0);
  }, [groupedOrders, groupBy, meta.total]);

  const groupedHasNext = page * limit < groupedTotalItems;

  // ── Filter helpers ─────────────────────────────────────────────────────────

  function applyFilter() { setIsFiltered(true); setPage(1); }

  function clearFilter() {
    setIsFiltered(false);
    setFilterStatus("");
    setFilterName("");
    setFilterProduct("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function buildActiveFilter() {
    if (!isFiltered) return {};
    return {
      status: filterStatus || undefined,
      name: filterName || undefined,
      product: filterProduct || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };
  }

  // ── Form helpers ───────────────────────────────────────────────────────────

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
          const product = allProducts.find((p) => p.name === value);
          if (product) {
            return { ...it, item: value, price: Number(product.sale_price), cost: Number(product.cost) };
          }
          return { ...it, item: value };
        }
        return { ...it, [field]: value };
      })
    );
  }

  // ── Order CRUD ─────────────────────────────────────────────────────────────

  function startEditOrder(order) {
    setIsEditing(true);
    setEditingOrderId(order._id);
    setName(order?.name ?? "");
    setOrderDate(toISODateInput(order?.order_date, todayISO));
    setStatus(order?.status ?? "confirmed");
    const mappedItems =
      (order?.itens ?? []).length > 0
        ? order.itens.map((it) => ({
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
      const res = await ordersApi.update(editingOrderId, body);
      if (!res?.ok) { alert(`Erro ${res?.status}: ` + JSON.stringify(res?.payload, null, 2)); return; }
      cancelEditOrder();
      await reloadOrders();
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
      const res = await ordersApi.create(body);
      if (!res?.ok) { alert(`Erro ${res?.status}: ` + JSON.stringify(res?.payload, null, 2)); return; }
      setName("");
      setItems([{ item: "", quantidade: 1, price: 0, cost: 0 }]);
      setStatus("confirmed");
      setOrderDate(todayISO);
      await reloadOrders();
    } catch (err) {
      console.error(err);
      alert("Erro de rede (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  async function deleteOrder(orderId) {
    const ok = confirm("Tem certeza que deseja excluir esse pedido?");
    if (!ok) return;
    setLoading(true);
    try {
      const res = await ordersApi.deleteOne(orderId);
      if (!res?.ok) { alert(`Erro ${res?.status}: ` + JSON.stringify(res?.payload, null, 2)); return; }
      await reloadOrdersWithTrash();
    } catch (err) {
      console.error(err);
      alert("Erro de rede (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  async function restoreOrder(orderId) {
    setLoading(true);
    try {
      const res = await ordersApi.restoreOrder(orderId);
      if (!res?.ok) { alert(`Erro ${res?.status}: ` + JSON.stringify(res?.payload, null, 2)); return; }
      await reloadOrdersWithTrash();
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
      const res = await ordersApi.updateStatus(orderId, newStatus);
      if (!res?.ok) { alert(`Erro ${res?.status}: ` + JSON.stringify(res?.payload, null, 2)); return; }
      await reloadOrders();
    } catch (err) {
      console.error(err);
      alert("Erro de rede (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  // ── Bulk actions ───────────────────────────────────────────────────────────

  async function bulkUpdateStatus(toStatus) {
    const filter = buildActiveFilter();
    const ok = confirm(
      `Atualizar status para "${toStatus.toUpperCase()}" em massa?\n` +
        (isFiltered ? "Vai afetar apenas o FILTRO atual." : "ATENÇÃO: Vai afetar TODOS os pedidos!")
    );
    if (!ok) return;
    const res = await ordersApi.updateMany({ filter, update: { status: toStatus } });
    if (!res?.ok) { alert(`Erro ${res?.status}: ` + JSON.stringify(res?.payload, null, 2)); return; }
    await reloadOrders();
  }

  async function bulkIncrement(fieldPath, value) {
    const filter = buildActiveFilter();
    const res = await ordersApi.increment({ filter, increment: { [fieldPath]: Number(value) } });
    if (!res?.ok) { alert(`Erro ${res?.status}: ` + JSON.stringify(res?.payload, null, 2)); return; }
    await reloadOrders();
  }

  async function bulkDelete() {
    const filter = buildActiveFilter();
    const ok = confirm(
      "Apagar pedidos em massa?\n" +
        (isFiltered ? "Vai apagar apenas os pedidos do FILTRO atual." : "ATENÇÃO: Vai apagar TODOS os pedidos!")
    );
    if (!ok) return;
    const res = await ordersApi.deleteMany({ filter });
    if (!res?.ok) { alert(`Erro ${res?.status}: ` + JSON.stringify(res?.payload, null, 2)); return; }
    await reloadOrdersWithTrash();
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const revenue = Number(profitSummary?.annual?.revenue ?? 0);
  const totalCost = Number(profitSummary?.annual?.cost ?? 0);
  const profit = Number(profitSummary?.annual?.profit ?? 0);
  const orderTotalPreview = items.reduce(
    (acc, it) => acc + Number(it.quantidade || 0) * Number(it.price || 0),
    0
  );

  return {
    // State
    orders, allOrders, deletedOrders, loading,
    stats,
    profitSummary, profitYear, setProfitYear, profitMonth, setProfitMonth, profitDay, setProfitDay, profitPeriod,
    meta, page, setPage, limit, setLimit,
    orderDate, setOrderDate, todayISO,
    name, setName, items, status, setStatus,
    startDate, setStartDate, endDate, setEndDate, isFiltered,
    filterStatus, setFilterStatus, filterName, setFilterName, filterProduct, setFilterProduct,
    groupBy, setGroupBy,
    editingOrderId, isEditing,
    deletedOrdersPage, setDeletedOrdersPage, deletedOrdersLimit, setDeletedOrdersLimit, deletedOrdersMeta,
    showOrdersTrash, setShowOrdersTrash,
    showNewClient, setShowNewClient, newClientName, setNewClientName, newClientPhone, setNewClientPhone,
    showNewProduct, setShowNewProduct, newProductName, setNewProductName, newProductSalePrice, setNewProductSalePrice, newProductCost, setNewProductCost,
    // Computed
    groupedOrders, pagedGroupedOrders, groupedTotalItems, groupedHasNext,
    orderTotalPreview, revenue, totalCost, profit,
    GROUP_MODES, STATUS_ORDER,
    // Functions
    applyFilter, clearFilter,
    addItemRow, removeItemRow, updateItemRow,
    deleteOrder, restoreOrder, updateOrderStatus,
    startEditOrder, cancelEditOrder, handleUpdateOrder, handleCreateOrder,
    bulkUpdateStatus, bulkIncrement, bulkDelete,
    reloadOrders, reloadOrdersWithTrash,
  };
}
