# Pedido para o Genspark Code — Publicar a loja e ligar os pagamentos

> Envia ao Genspark Code a pasta **`karmic_node_loja_final`** inteira (o ZIP) **e** este texto (a partir da linha `---`).

---

Tenho uma loja (Karmic Node). Envio-te a pasta `karmic_node_loja_final` com a loja completa:
- **Site estático em `public/`** (React por CDN, sem build). O checkout está em `public/store/checkout-v3.js`.
- **Funções Vercel em `api/`** (Stripe + Supabase + Formspree). Estão escritas, mas **nunca foram testadas**.
- O `vercel.json` já define `public` como pasta de saída.

Repositório: `karmicnode-coder/KarmicNode_loja` (substitui o conteúdo pelo desta pasta).
Quero a loja publicada no Vercel e os pagamentos a funcionar de ponta a ponta.

## O que tens de fazer
1. **Publicar:** põe a pasta no repositório e liga ao Vercel. Confirma que a loja abre, sem erros na consola, em computador e telemóvel.
2. **Rever o código de `api/`** e corrigir os erros que encontrares, sem mudar o comportamento:
   - Preços calculados no servidor (`api/_catalog.js`).
   - Verificação da assinatura do Stripe.
   - Um único email por encomenda paga.
   - Sem morada, telefone nem NIF no email.
3. **Supabase:** corre `supabase/SUPABASE_ORDERS_WEBHOOK.sql` no projeto `wfqvofnneaewgfwcvqcx`. Confirma que a tabela `orders` e a função `decrement_stock` ficam bem.
4. **Vercel:** configura as variáveis de ambiente listadas em `api/LEIA-ME.md`.
   - Pede-me os valores secretos (chave do Stripe, *service role* do Supabase e domínio).
   - O Formspree é `https://formspree.io/f/xeeyzlvb`.
5. **Stripe:**
   - Cria o webhook para `/api/stripe-webhook` com os 5 eventos do `LEIA-ME.md`.
   - Ativa Cartão, Multibanco, MB WAY e PayPal.
   - Ativa os recibos automáticos para a cliente.
   - Se não tiveres acesso, diz-me exatamente onde clicar.
6. **Checkout:** `public/store/checkout-v3.js` já chama `POST /api/checkout` e envia o design de cada peça. A página `#/sucesso` deve ler `GET /api/checkout-session?session_id=…` e mostrar o número da encomenda.
7. **Retirar do checkout os 4 campos do cartão** (número, validade, CVC, nome). O cartão é escrito na página segura do Stripe. Mantém o cartão 3D só decorativo, com ••••.

## Testes obrigatórios (modo de teste do Stripe)
Mostra-me uma captura de cada um:
1. Compra com `4242 4242 4242 4242` → página do Stripe → volta a `#/sucesso` → encomenda `paid` no Supabase → **1** email no Formspree.
2. O mesmo evento repetido (`stripe events resend`) → **nenhum** email novo.
3. Cartão recusado `4000 0000 0000 0002` → nenhum email e a encomenda não fica `paid`.
4. Multibanco → a encomenda fica `awaiting_payment` e só passa a `paid` (com email) quando o Stripe confirmar.
5. Pedido ao webhook com uma assinatura falsa → resposta `400`.
6. Alterar o preço no navegador (DevTools) antes de pagar → o Stripe cobra o preço **correto**.

**Só dês por concluído com estas 6 capturas.**
