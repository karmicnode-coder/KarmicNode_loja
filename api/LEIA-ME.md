# Karmic Node — Pagamentos (Stripe) + aviso de encomenda (Formspree)

## Ficheiros
| Ficheiro | O que faz |
|---|---|
| `api/_catalog.js` | Preços **do servidor** (fonte de verdade). O preço do navegador é ignorado. |
| `api/checkout.js` | `POST /api/checkout`: valida o carrinho, recalcula preços, desconto e portes, grava a encomenda como `pending` e devolve o `url` do Stripe. |
| `api/stripe-webhook.js` | `POST /api/stripe-webhook`: confirma o pagamento, marca a encomenda como `paid`, baixa o stock e envia **1** aviso pelo Formspree. |
| `api/checkout-session.js` | `GET /api/checkout-session?session_id=…`: estado para a página de sucesso. |
| `SUPABASE_ORDERS_WEBHOOK.sql` | Colunas, índice único, função `decrement_stock` e regras de segurança. |

## Instalar
```bash
npm i stripe @supabase/supabase-js
```

## Variáveis de ambiente (Vercel → Settings → Environment Variables)
| Nome | Exemplo |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_…` (ou `sk_test_…` para testar) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (aparece ao criar o webhook) |
| `STRIPE_PAYMENT_METHODS` | `card,multibanco,mb_way,paypal` (só os que estiverem ativos no Stripe) |
| `SUPABASE_URL` | `https://wfqvofnneaewgfwcvqcx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | chave *service_role* (nunca no navegador) |
| `FORMSPREE_ORDER_ENDPOINT` | `https://formspree.io/f/xeeyzlvb` |
| `SITE_URL` | `https://karmicnode.pt` |
| `ADMIN_URL` | `https://karmicnode.pt/#/admin` |

## Stripe (painel)
1. **Developers → Webhooks → Add endpoint:** `https://<domínio>/api/stripe-webhook`
   - Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`
   - Copiar o *Signing secret* para `STRIPE_WEBHOOK_SECRET`.
2. **Settings → Payment methods:** ativar Cartão, Multibanco, MB WAY e PayPal.
3. **Settings → Emails:** ativar *Successful payments* (recibo automático para a cliente).

## Testar (modo de teste)
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
stripe trigger checkout.session.completed
```
- Pagamento bom (`4242 4242 4242 4242`) → encomenda `paid` + **1** email.
- Mesmo evento repetido → **nenhum** email novo.
- Cartão recusado (`4000 0000 0000 0002`) → nenhum email.
- Assinatura errada → resposta `400`.

> Nota: o `stripe trigger` cria sessões sem `order_no`. Para o teste completo, faz uma compra de teste a sério pela loja, com as chaves de teste.
