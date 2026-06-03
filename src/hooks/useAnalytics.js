import { useState } from "react";
import { ordersApi } from "../services/api";

export function useAnalytics() {
  const [productsRanking, setProductsRanking] = useState([]);
  const [clientsRanking, setClientsRanking] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsStartDate, setAnalyticsStartDate] = useState("");
  const [analyticsEndDate, setAnalyticsEndDate] = useState("");
  const [analyticsProductFilter, setAnalyticsProductFilter] = useState("");

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const [prodRes, clientRes] = await Promise.allSettled([
        ordersApi.analyticsProducts({
          start_date: analyticsStartDate || undefined,
          end_date: analyticsEndDate || undefined,
        }),
        ordersApi.analyticsClients({
          start_date: analyticsStartDate || undefined,
          end_date: analyticsEndDate || undefined,
          product: analyticsProductFilter || undefined,
        }),
      ]);

      if (prodRes.status === "fulfilled") {
        const payload = prodRes.value?.payload ?? prodRes.value;
        setProductsRanking(payload?.data?.attributes ?? []);
      }
      if (clientRes.status === "fulfilled") {
        const payload = clientRes.value?.payload ?? clientRes.value;
        setClientsRanking(payload?.data?.attributes ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  return {
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
  };
}
