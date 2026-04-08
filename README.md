# Brownies Orders Frontend

Interface web para gerenciamento de pedidos, clientes e produtos de um negócio de venda de doces. Consome a [Brownies Delivery API](https://github.com/FredVenturin/brownie-app-back).

## Tecnologias

- React 19
- Vite 7
- JavaScript
- Fetch API

## Funcionalidades

- Autenticação simples por senha via variável de ambiente
- CRUD completo de pedidos, clientes e produtos
- Listagem paginada com filtros de busca
- Agrupamento de pedidos por status ou cliente
- Atualização de status e ações em massa
- Lixeira com restauração para pedidos, clientes e produtos
- Painel de estatísticas por status
- Resumo de lucro diário, mensal, anual e total
- Consulta de lucro por período específico

## Estrutura

```
src/
├── services/
│   └── api.js          # chamadas HTTP centralizadas
├── hooks/
│   ├── useOrders.js    # estado e ações de pedidos
│   ├── useClients.js   # estado e ações de clientes
│   └── useProducts.js  # estado e ações de produtos
├── pages/
│   ├── OrdersPage.jsx
│   ├── ClientsPage.jsx
│   └── ProductsPage.jsx
├── utils/
│   └── formatters.js
├── App.jsx             # autenticação e navegação
└── main.jsx
```

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=https://sua-api.railway.app
VITE_ACCESS_PASSWORD=senha
```

Para desenvolvimento local, crie `.env.local` (sobrescreve o `.env`):

```env
VITE_API_URL=http://localhost:3000
VITE_ACCESS_PASSWORD=1234
```

## Executando localmente

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev
```

Interface disponível em `http://localhost:5173`.

## Build

```bash
npm run build
```

Para testar o build localmente:

```bash
npm run preview
```

## Deploy

A aplicação pode ser hospedada em Vercel, Netlify ou Cloudflare Pages.

1. Conectar o repositório no provedor
2. Configurar as variáveis de ambiente (`VITE_API_URL` e `VITE_ACCESS_PASSWORD`)
3. Build command: `npm run build` — Output directory: `dist`

> O domínio do frontend deve estar autorizado em `CORS_ORIGINS` no backend.
