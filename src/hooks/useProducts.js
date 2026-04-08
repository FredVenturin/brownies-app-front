import { useEffect, useState } from "react";
import { ordersApi } from "../services/api";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [productsPage, setProductsPage] = useState(1);
  const [productsLimit, setProductsLimit] = useState(10);
  const [productsMeta, setProductsMeta] = useState({ page: 1, limit: 10, total: 0, has_next: false });

  const [deletedProductsPage, setDeletedProductsPage] = useState(1);
  const [deletedProductsLimit, setDeletedProductsLimit] = useState(10);
  const [deletedProductsMeta, setDeletedProductsMeta] = useState({ page: 1, limit: 10, total: 0, has_next: false });

  const [showProductsTrash, setShowProductsTrash] = useState(false);

  const [editingProductId, setEditingProductId] = useState(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductSalePrice, setEditProductSalePrice] = useState("");
  const [editProductCost, setEditProductCost] = useState("");

  // ── Loaders ────────────────────────────────────────────────────────────────

  async function loadProducts() {
    try {
      const res = await ordersApi.listProducts({ page: productsPage, limit: productsLimit });
      const payload = res?.payload ?? res;
      const list = payload?.data?.attributes ?? [];
      const metaFromApi = payload?.data?.meta ?? payload?.meta;
      setProducts(list);
      setProductsMeta(
        metaFromApi ?? {
          page: productsPage,
          limit: productsLimit,
          total: list.length,
          has_next: list.length === productsLimit,
        }
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAllProducts() {
    try {
      const res = await ordersApi.listAllProducts();
      const payload = res?.payload ?? res;
      const list = payload?.data?.attributes ?? [];
      setAllProducts(list);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadDeletedProducts() {
    try {
      const res = await ordersApi.listDeletedProducts({ page: deletedProductsPage, limit: deletedProductsLimit });
      const payload = res?.payload ?? res;
      const list = payload?.data?.attributes ?? [];
      const metaFromApi = payload?.data?.meta ?? payload?.meta;
      setDeletedProducts(list);
      setDeletedProductsMeta(
        metaFromApi ?? {
          page: deletedProductsPage,
          limit: deletedProductsLimit,
          total: list.length,
          has_next: list.length === deletedProductsLimit,
        }
      );
    } catch (err) {
      console.error(err);
    }
  }

  // ── Reload helpers ─────────────────────────────────────────────────────────

  async function reloadProducts() {
    await Promise.allSettled([loadProducts(), loadAllProducts()]);
  }

  async function reloadProductsWithTrash() {
    await Promise.allSettled([loadProducts(), loadAllProducts(), loadDeletedProducts()]);
  }

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.allSettled([loadProducts(), loadAllProducts(), loadDeletedProducts()]).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productsPage, productsLimit, deletedProductsPage, deletedProductsLimit]);

  // ── CRUD ───────────────────────────────────────────────────────────────────

  function startEditProduct(product) {
    setEditingProductId(product._id);
    setEditProductName(product.name ?? "");
    setEditProductSalePrice(String(product.sale_price ?? ""));
    setEditProductCost(String(product.cost ?? ""));
  }

  function cancelEditProduct() {
    setEditingProductId(null);
    setEditProductName("");
    setEditProductSalePrice("");
    setEditProductCost("");
  }

  async function saveProductEdit() {
    if (!editingProductId) return;
    setLoading(true);
    try {
      const res = await ordersApi.updateProduct(editingProductId, {
        data: {
          name: editProductName.trim(),
          sale_price: Number(editProductSalePrice),
          cost: Number(editProductCost),
        },
      });
      if (!res?.ok) { alert("Erro ao atualizar produto."); console.error(res); return; }
      await reloadProducts();
      cancelEditProduct();
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar produto (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  async function removeProduct(productId) {
    const ok = confirm("Tem certeza que deseja excluir este produto?");
    if (!ok) return;
    setLoading(true);
    try {
      const res = await ordersApi.deleteProduct(productId);
      if (!res?.ok) { alert("Erro ao excluir produto."); console.error(res); return; }
      await reloadProductsWithTrash();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir produto (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  async function restoreProduct(productId) {
    setLoading(true);
    try {
      const res = await ordersApi.restoreProduct(productId);
      if (!res?.ok) { alert("Erro ao restaurar produto."); console.error(res); return; }
      await reloadProductsWithTrash();
    } catch (err) {
      console.error(err);
      alert("Erro ao restaurar produto (veja o console).");
    } finally {
      setLoading(false);
    }
  }

  return {
    products, allProducts, deletedProducts, loading,
    productsPage, setProductsPage, productsLimit, setProductsLimit, productsMeta,
    deletedProductsPage, setDeletedProductsPage, deletedProductsLimit, setDeletedProductsLimit, deletedProductsMeta,
    showProductsTrash, setShowProductsTrash,
    editingProductId, editProductName, setEditProductName, editProductSalePrice, setEditProductSalePrice, editProductCost, setEditProductCost,
    startEditProduct, cancelEditProduct, saveProductEdit, removeProduct, restoreProduct,
    reloadProducts, reloadProductsWithTrash,
  };
}
