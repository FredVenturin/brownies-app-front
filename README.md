README.md — Frontend
Brownies Orders Frontend

Interface web para gerenciamento de pedidos, clientes e produtos de um negócio de venda de doces.
O sistema permite registrar vendas, acompanhar pedidos, cadastrar clientes e produtos, além de visualizar métricas de lucro.
A aplicação consome a Brownies Delivery API (backend).

Tecnologias utilizadas

*   React
*   Vite
*   JavaScript
*   Fetch API

Funcionalidades

**Pedidos**
*   Criar pedidos
*   Editar pedidos
*   Atualizar status do pedido
*   Listagem paginada
*   Filtros de busca
*   Ações em massa
*   Exclusão de pedidos

**Clientes**
*   Criar cliente
*   Listar clientes
*   Editar cliente
*   Deletar cliente

**Produtos**
*   Criar produto
*   Listar produtos
*   Editar produto
*   Deletar produto

**Lucro**
*   Resumo diário
*   Resumo mensal
*   Resumo anual
*   Consulta por período específico

**Sistema**
*   Login simples por senha via variável de ambiente
*   Integração completa com API

Estrutura do projeto



src
├── services
│ └── api.js
├── App.jsx
└── main.jsx

Plain Text



A comunicação com o backend é centralizada em `src/services/api.js`.

Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:



VITE_API_URL=http://localhost:3000
VITE_ACCESS_PASSWORD=senha

Plain Text



Descrição:
*   `VITE_API_URL`: URL base do backend
*   `VITE_ACCESS_PASSWORD`: senha simples para liberar acesso à interface

Executando o projeto localmente

1.  Instalar dependências
    ```bash
    npm install
    ```
2.  Rodar em modo desenvolvimento
    ```bash
    npm run dev
    ```

A aplicação normalmente sobe em:

`http://localhost:5173`

Build de produção

Gerar build:

```bash
npm run build



Testar build localmente:

Bash


npm run preview



Integração com API

Principais endpoints consumidos:

Pedidos

•
GET /delivery/orders

•
GET /delivery/orders/filter

•
GET /delivery/orders/count

•
POST /delivery/order

•
PATCH /delivery/order/{id}

•
PATCH /delivery/order/{id}/status

•
DELETE /delivery/order/{id}

Clientes

•
GET /delivery/clients

•
POST /delivery/clients

•
PATCH /delivery/clients/{id}

•
DELETE /delivery/clients/{id}

Produtos

•
GET /delivery/products

•
POST /delivery/products

•
PATCH /delivery/products/{id}

•
DELETE /delivery/products/{id}

Lucro

•
GET /delivery/profit/summary

•
GET /delivery/profit

Deploy

A aplicação pode ser hospedada em:

•
Vercel

•
Netlify

•
Cloudflare Pages

Passos gerais:

1.
Conectar o repositório no provedor

2.
Configurar variáveis de ambiente

3.
Realizar o deploy

Importante: o backend deve permitir CORS do domínio do frontend (variável CORS_ORIGINS ).

Observações

Este frontend depende da API backend para funcionar corretamente.
Certifique-se de que VITE_API_URL esteja apontando para a URL correta do backend (local ou produção).

Licença

Projeto desenvolvido para fins educacionais e uso prático em aplicações full stack.

