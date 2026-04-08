import { useState } from "react";
import { useOrders } from "./hooks/useOrders";
import { useClients } from "./hooks/useClients";
import { useProducts } from "./hooks/useProducts";
import { OrdersPage } from "./pages/OrdersPage";
import { ClientsPage } from "./pages/ClientsPage";
import { ProductsPage } from "./pages/ProductsPage";

const ACCESS_PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD || "";

function App() {
  const [authOk, setAuthOk] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeView, setActiveView] = useState("orders");

  const clientsHook = useClients();
  const productsHook = useProducts();
  const ordersHook = useOrders({ allProducts: productsHook.allProducts });

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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!ACCESS_PASSWORD) { setAuthError("Senha não configurada. Defina VITE_ACCESS_PASSWORD."); return; }
                  if (password === ACCESS_PASSWORD) { setAuthOk(true); setAuthError(""); }
                  else setAuthError("Senha incorreta.");
                }
              }}
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
              if (!ACCESS_PASSWORD) { setAuthError("Senha não configurada. Defina VITE_ACCESS_PASSWORD."); return; }
              if (password === ACCESS_PASSWORD) { setAuthOk(true); setAuthError(""); }
              else setAuthError("Senha incorreta.");
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
      {/* Navegação */}
      <div className="card" style={{ padding: 12, marginTop: 14 }}>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className={`btn ${activeView === "orders" ? "btnPrimary" : ""}`}
            onClick={() => setActiveView("orders")}
          >
            Pedidos
          </button>
          <button
            type="button"
            className={`btn ${activeView === "clients" ? "btnPrimary" : ""}`}
            onClick={() => setActiveView("clients")}
          >
            Clientes
          </button>
          <button
            type="button"
            className={`btn ${activeView === "products" ? "btnPrimary" : ""}`}
            onClick={() => setActiveView("products")}
          >
            Produtos
          </button>
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="header">
        <div>
          <h1 className="title">
            🍫{" "}
            {activeView === "orders" ? "Pedidos" : activeView === "clients" ? "Clientes" : "Produtos"}
          </h1>
          <p className="subtitle">Controle rápido de vendas e status</p>
        </div>
      </div>

      {/* Views */}
      {activeView === "orders" ? (
        <OrdersPage
          {...ordersHook}
          allClients={clientsHook.allClients}
          allProducts={productsHook.allProducts}
          onClientCreated={clientsHook.reloadClients}
          onProductCreated={productsHook.reloadProducts}
        />
      ) : null}

      {activeView === "clients" ? (
        <ClientsPage {...clientsHook} />
      ) : null}

      {activeView === "products" ? (
        <ProductsPage {...productsHook} />
      ) : null}
    </div>
  );
}

export default App;
