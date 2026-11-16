-- ═══════════════════════════════════════════════════════════════
-- KARMIC NODE — Encomendas pagas pelo Stripe + aviso Formspree
-- Corre isto TODO no SQL Editor do Supabase (é seguro correr mais do que uma vez).
-- ═══════════════════════════════════════════════════════════════

-- 1. Colunas usadas por api/checkout.js e api/stripe-webhook.js
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_no TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS nif TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS designs JSONB DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS newsletter BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_event_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount_cents INT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

-- O estado pode ter valores novos (pending, awaiting_payment, paid, payment_failed, expired, refunded…)
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';
-- Se a coluna status tiver um CHECK antigo que bloqueie estes valores, remove-o:
DO $$
DECLARE c TEXT;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid = 'orders'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || quote_ident(c); END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_no_key ON orders (order_no);
CREATE INDEX IF NOT EXISTS orders_session_idx ON orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS orders_pi_idx ON orders (stripe_payment_intent);

-- 2. Baixar stock de forma atómica (nunca fica negativo)
CREATE OR REPLACE FUNCTION decrement_stock(p_sku TEXT, p_qty INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE products SET stock = GREATEST(0, COALESCE(stock, 0) - GREATEST(p_qty, 0)), updated_at = NOW()
  WHERE sku = p_sku AND COALESCE(is_on_demand, FALSE) = FALSE;
END $$;
REVOKE ALL ON FUNCTION decrement_stock(TEXT, INT) FROM PUBLIC, anon, authenticated;

-- 3. Segurança: as encomendas só são escritas pelo servidor (service role).
--    Os clientes autenticados só podem LER as próprias encomendas.
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_insert_public" ON orders;
DROP POLICY IF EXISTS "orders_own_read" ON orders;
CREATE POLICY "orders_own_read" ON orders FOR SELECT TO authenticated
  USING (customer_email = (auth.jwt() ->> 'email'));
