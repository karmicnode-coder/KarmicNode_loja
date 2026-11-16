# Karmic Node — Loja (versão final)

Loja **Maison** (modo claro/escuro, menu lateral, pesquisa, estúdio Personalizar, checkout Estúdio) + servidor de pagamentos **Stripe** + encomendas no **Supabase** + aviso por **Formspree**.

## Estrutura
```
karmic_node_loja_final/
├── public/                 ← o site (estático)
│   ├── index.html          ← página da loja
│   ├── store/              ← código e estilos (React por CDN, sem build)
│   └── assets/             ← logótipo, máscaras do estúdio, fotos de campanha
├── api/                    ← funções do servidor (Vercel)
│   ├── _catalog.js         ← preços oficiais (o servidor recalcula tudo)
│   ├── checkout.js         ← POST /api/checkout
│   ├── stripe-webhook.js   ← POST /api/stripe-webhook
│   ├── checkout-session.js ← GET  /api/checkout-session
│   └── LEIA-ME.md          ← variáveis de ambiente e passos no Stripe
├── supabase/
│   └── SUPABASE_ORDERS_WEBHOOK.sql
├── PEDIDO_GENSPARK_CODE.md ← texto para colar no Genspark Code
├── package.json
└── vercel.json
```

## Publicar
1. Sobe esta pasta inteira para o GitHub (ou entrega-a ao Genspark Code com o `PEDIDO_GENSPARK_CODE.md`).
2. No Vercel: **Import Project** → o *framework* é **Other** e o *Output Directory* é `public` (já está no `vercel.json`).
3. Corre `supabase/SUPABASE_ORDERS_WEBHOOK.sql` no Supabase.
4. Preenche as variáveis de ambiente e configura o Stripe (ver `api/LEIA-ME.md`).
5. Faz uma compra de teste com `4242 4242 4242 4242`.

## Antes de vender (importante)
- **Campos do cartão no checkout:** são só visuais. Com este servidor, a cliente escreve o cartão na página segura do Stripe. Retira-os, ou troca-os por Stripe Elements.
- **Preços:** se mudares um preço em `public/store/products.js`, muda também em `api/_catalog.js`.
- **Fotos:** a maioria dos produtos usa silhuetas ou fotos recoloridas. Fotos reais são a maior melhoria possível.
- **Código protótipo:** o site usa React por CDN e 7 ficheiros de estilos sobrepostos. Funciona, mas a médio prazo deve ser migrado para Vite (pede-o ao Genspark Code).
