# 💳 Karmic Node — Setup Stripe + Pagamentos

Guia passo-a-passo para pôres os pagamentos a funcionar do zero. Segue pela ordem.

---

## 📋 Checklist geral

- [ ] Fase 1 — Verificar conta Stripe
- [ ] Fase 2 — Ativar métodos de pagamento
- [ ] Fase 3 — Colar chaves na Vercel
- [ ] Fase 4 — Configurar webhook
- [ ] Fase 5 — Criar 29 produtos no Stripe
- [ ] Fase 6 — Criar códigos de desconto + cartões oferta
- [ ] Fase 7 — Verificar domínio no Resend (para emails)
- [ ] Fase 8 — Testar em modo Test
- [ ] Fase 9 — Passar para Live

---

## 🏁 Fase 1 — Verificar conta Stripe

1. Login em https://dashboard.stripe.com
2. Se aparecer o banner amarelo **"Ativar pagamentos"** → clica e completa:
   - NIF / IBAN da empresa Karmic Node
   - Comprovativo de morada (Cartaxo, Portugal)
   - Documento de identidade do representante legal
   - Descrição do negócio: "E-commerce de vestuário e acessórios de tecnologia"
3. A verificação demora **1-3 dias úteis**. Enquanto não estiver aprovada, só podes usar **modo Test**.

> ⚠️ Em modo Test tudo funciona igual — só que os "pagamentos" não são reais. Podes desenvolver e testar tudo sem stress.

---

## 💳 Fase 2 — Ativar métodos de pagamento

Vai a **Settings > Payment methods** e ativa:

| Método | Status default | Ação |
|---|---|---|
| **Cartão** (Visa/MC/Amex) | ✅ Ativo | — |
| **MB WAY** | ❌ Inativo | Clica **Turn on** — precisa conta verificada PT |
| **Multibanco** | ❌ Inativo | Clica **Turn on** — precisa conta verificada PT |
| **PayPal** | ⚠️ Precisa ligar | Segue o wizard, liga tua conta PayPal Business |
| **Apple Pay** | ✅ Automático | Requer **domain verification** ↓ |
| **Google Pay** | ✅ Automático | Sem passos extras |

### Apple Pay — Verificação de domínio
1. **Settings > Payment methods > Apple Pay > Add new domain**
2. Introduz `karmicnode.com`
3. Descarrega o ficheiro `apple-developer-merchantid-domain-association`
4. Coloca-o em `public/.well-known/apple-developer-merchantid-domain-association`
5. Deploy e clica **Verify**

---

## 🔑 Fase 3 — Colar chaves na Vercel

1. **Stripe > Developers > API keys** → copia:
   - `Publishable key` (pk_test_... ou pk_live_...)
   - `Secret key` (sk_test_... ou sk_live_...)

2. Na **Vercel** do projeto:
   - **Settings > Environment Variables**
   - Adiciona:

| Nome | Valor | Environments |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` | Preview + Development |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Preview + Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://karmicnode.com` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://karmicnode-preview.vercel.app` | Preview |

3. Faz **Redeploy** depois de adicionar as variáveis.

---

## 🎣 Fase 4 — Configurar webhook

1. **Stripe > Developers > Webhooks > Add endpoint**
2. **Endpoint URL:** `https://karmicnode.com/api/stripe-webhook`
3. **Events to send:**
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Depois de criar, clica no endpoint e copia o **Signing secret** (`whsec_...`)
5. Vercel > Environment Variables → adiciona `STRIPE_WEBHOOK_SECRET=whsec_...`
6. Redeploy

### Testar webhook localmente (dev)
```bash
# Instala Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/stripe-webhook
# copia o whsec_... que aparece e mete em .env.local
```

---

## 📦 Fase 5 — Criar 29 produtos no Stripe

Podes fazer manualmente no dashboard **ou** por script.

### Manual (via dashboard)
Para cada produto:
1. **Products > Add product**
2. Preenche `Name`, `Description`
3. Sobe imagens (URLs ou upload)
4. **Pricing:** `One-time`, `EUR`, preço em euros (ex: 29.99)
5. **Metadata** (obrigatório para o site mapear):
   ```
   sku          = KN-001
   category     = Tops
   subcategory  = Tops e Camisaria
   vertical     = vestuario
   stock        = 32
   badge        = Bestseller
   badge_color  = bordo
   customizable = true
   name_en      = Essential Cotton T-Shirt
   description_en = Premium 100% cotton, classic cut...
   category_en  = Tops
   subcategory_en = Tops & Shirts
   specs        = [{"label":"Material","value":"100% Algodão"}, ...]  (JSON stringified)
   specs_en     = [{"label":"Material","value":"100% Cotton"}, ...]
   ```
6. **Save**

### Automatizado (via API)
Podes correr o script `scripts/sync-stripe-products.mjs` (não incluído neste bundle — pede-me e eu escrevo).

---

## 🎟️ Fase 6 — Códigos de desconto + cartões oferta

### Códigos de desconto
1. **Products > Coupons > Add coupon**
2. Escolhe **Percentage** (ex: 10%) ou **Fixed amount** (ex: 15€)
3. **Duration:** `Once` (por encomenda)
4. Opcionais: minimum order amount, expira a `X`, redeem X times, etc.
5. Guarda o coupon.
6. **Products > Promotion codes > Add promotion code**
7. Escolhe o coupon acima e define um código legível: `BEMVINDO10`, `NATAL2026`, etc.

### Cartões oferta (Gift cards)
No Stripe não há gift cards "nativos" ainda (só custom). Duas abordagens:

**Opção A — Cupões fixos como gift cards (simples):**
- Cria um coupon `Fixed amount off` = 25€
- Cria promo code `GIFT-A7X9K` (ou lote grande)
- Vende o "cartão oferta" como produto normal a 25€
- Após pagamento, envias o código por email

**Opção B — Customer balance (mais robusto):**
- Requer implementação custom com API (não incluído por defeito)
- Diz-me se quiseres isto e eu escrevo o endpoint

Este pacote **suporta a opção A out-of-the-box**. Códigos começados por `GIFT` são detetados no endpoint `/api/promo/validate` e podem ter tratamento especial no UI (ex: badge "cartão oferta").

---

## 📧 Fase 7 — Verificar domínio no Resend (opcional mas recomendado)

1. **Resend > Domains > Add domain** → `karmicnode.com`
2. Copia os registos DNS (SPF, DKIM, MX)
3. Cola-os no teu DNS (Cloudflare, Vercel Domains, ou onde estiver)
4. Aguarda propagação (~30 min a 24h) → clica **Verify**
5. **API keys > Create API key** → copia `re_...`
6. Vercel → `RESEND_API_KEY=re_...`
7. Redeploy

Sem Resend, os emails de confirmação não são enviados, mas todos os pagamentos continuam a funcionar (Stripe envia recibo default deles).

---

## 🧪 Fase 8 — Testar em modo Test

Com as chaves `sk_test_...` configuradas:

1. Vai ao site → adiciona produto ao carrinho → checkout
2. **Cartão de teste:**
   - Número: `4242 4242 4242 4242`
   - Data: qualquer futura (ex: `12/34`)
   - CVC: qualquer (ex: `123`)
   - ZIP: `2070-000`
3. Confirma que:
   - ✅ Redireciona para página de sucesso com detalhes
   - ✅ Recebes email confirmação (se Resend ativo)
   - ✅ No Stripe Dashboard aparece a encomenda com metadata correto
   - ✅ Webhook mostra `200 OK` no log do Stripe

### Outros cartões de teste úteis
| Número | Cenário |
|---|---|
| `4242 4242 4242 4242` | ✅ Sucesso |
| `4000 0025 0000 3155` | 3D Secure obrigatório |
| `4000 0000 0000 9995` | ❌ Recusado insuficiência de saldo |
| `4000 0000 0000 0069` | ❌ Cartão expirado |

Para **MB WAY** e **Multibanco** em modo test, aparecem opções fake que "aprovam" automaticamente após alguns segundos.

---

## 🚀 Fase 9 — Passar para Live

Quando tudo funcionar em test:

1. Confirma que **conta Stripe está verificada** (banner amarelo desapareceu)
2. Troca no Vercel:
   - `STRIPE_SECRET_KEY` → chave `sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → chave `pk_live_...`
   - `STRIPE_WEBHOOK_SECRET` → cria novo webhook em **live mode** e copia o novo `whsec_...`
3. **Redeploy**
4. Faz uma compra real de 1€ para confirmar tudo (podes reembolsar-te logo depois via dashboard).

---

## 🛡️ Boas práticas de segurança

- ❌ **NUNCA** commitas `sk_live_...` ou `sk_test_...` no Git
- ❌ **NUNCA** partilhas a `Secret key` por email/chat
- ✅ Usa **environment variables** da Vercel
- ✅ Ativa **2FA** na tua conta Stripe
- ✅ No webhook, valida sempre a assinatura (o código já faz isto)
- ✅ Mantém `STRIPE_WEBHOOK_SECRET` separado por ambiente (test tem um, live tem outro)

---

## 🆘 Debug rápido

| Sintoma | Causa provável | Solução |
|---|---|---|
| "No API key provided" | Variável não definida na Vercel | Confirma env vars + redeploy |
| Checkout redireciona mas não paga | Domínio não verificado (Apple Pay) | Segue Fase 2 |
| Webhook 400 "Invalid signature" | `STRIPE_WEBHOOK_SECRET` errado | Copia novo do dashboard, atualiza Vercel |
| Email não chega | Domínio não verificado no Resend | Segue Fase 7 |
| IVA não aparece | Stripe Tax não ativado | Settings > Tax > Enable |
| MB WAY não aparece | Método não ativado | Fase 2 |

---

## 📞 Ajuda extra

- **Stripe Support (24/7):** dashboard > `?` > Chat with Stripe
- **Docs:** https://stripe.com/docs/checkout/sessions
- **Test cards:** https://stripe.com/docs/testing

Boa sorte, Imperador! 🚀
