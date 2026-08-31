-- ═══════════════════════════════════════════════════════════════════════
-- KARMIC NODE — SCHEMA SUPABASE CONSOLIDADO (v1 — canónico, tudo-em-um)
-- ═══════════════════════════════════════════════════════════════════════
-- Este ficheiro substitui e reconcilia TODOS os schemas SQL soltos
-- encontrados em _project_v4/ (SUPABASE_ADMIN_COMPLETE, SUPABASE_ADVANCED_
-- SCHEMA, SUPABASE_COMMERCE_SCHEMA, SUPABASE_FINAL_SETUP, SUPABASE_
-- HEALTH_CHECKS, SUPABASE_KARMA_AI_SCHEMA, SUPABASE_PARTNERSHIPS_*,
-- supabase-custom-designs, supabase-fix-wishlist, multivendor_pack/
-- supabase/schema.sql).
--
-- DECISÕES DE RECONCILIAÇÃO (conflitos resolvidos):
--   • Catálogo: a loja usa um catálogo ESTÁTICO em src/App.tsx (produtos
--     com `id` numérico + `sku` texto, ex. "KN-001"). Por isso todas as
--     tabelas relacionadas (orders, order_items, reviews, wishlist,
--     product_bundles) referenciam produtos por `product_sku TEXT`,
--     NUNCA por UUID FK — evita o mismatch identificado entre
--     multivendor_pack (products.id UUID) e o catálogo real da app.
--     A tabela `products` abaixo existe para uma futura migração para
--     catálogo dinâmico (admin CRUD), mas não é dependência obrigatória.
--   • orders/reviews/gift_cards/promo_codes: existiam definições
--     DUPLICADAS em SUPABASE_ADMIN_COMPLETE.sql e SUPABASE_COMMERCE_
--     SCHEMA.sql. Adotamos a versão ADMIN_COMPLETE (SKU-based, mais
--     alinhada com o checkout.js/stripe-webhook.js reais) e absorvemos
--     os campos extra úteis do COMMERCE_SCHEMA (karma_discount_cents,
--     printful_order_id, free_shipping em promo_codes, gerador de
--     código único de gift card).
--   • newsletter_subs vs newsletter_subscribers: nomes DIFERENTES para
--     a mesma entidade. Canonizado como `newsletter_subs` (nome usado
--     pela view admin_dashboard).
--   • health_checks: definida identicamente em SUPABASE_FINAL_SETUP.sql
--     e SUPABASE_HEALTH_CHECKS.sql. Mantida uma só vez, com a view
--     `health_recent` (só existia na versão HEALTH_CHECKS).
--   • admin_dashboard (view): referenciava uma tabela inexistente
--     `karma_points_log`. CORRIGIDO para agregar de `karma_profiles`
--     (lifetime_points), que é a tabela real definida em
--     SUPABASE_KARMA_AI_SCHEMA.sql.
--   • blog_posts / analytics_events (policies "admins_..."): as versões
--     antigas referenciavam uma tabela inexistente `user_profiles`.
--     CORRIGIDO para `profiles.is_admin` (tabela real).
--   • Admin gate: preservado o padrão consistente em todo o projeto de
--     referência — `profiles.is_admin = true` OU
--     `auth.jwt() ->> 'email' = 'karmicnode@gmail.com'` (bootstrap fixo).
--   • wishlist: em vez do fix incremental (ALTER TABLE) do ficheiro
--     supabase-fix-wishlist.sql, a tabela já nasce com `product_sku TEXT`
--     (nunca precisa do product_id UUID nem da coluna de "correção").
--
-- COMO USAR:
--   1. Criar projeto em https://supabase.com/dashboard (se ainda não
--      tiveres um).
--   2. SQL Editor → New query → colar este ficheiro completo → Run.
--   3. Copiar Project URL + anon key para as env vars do Vercel/site:
--        VITE_SUPABASE_URL
--        VITE_SUPABASE_ANON_KEY
--   4. Authentication → Providers → Email → ativar "Magic Link".
--      (Opcional) Authentication → Providers → Google → configurar OAuth.
--   5. Authentication → URL Configuration → adicionar
--      https://karmicnode.com/** aos Redirect URLs.
-- ═══════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════
-- 0. EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ═══════════════════════════════════════════════════════════════════════
-- 1. PROFILES — extensão de auth.users (1:1)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  phone text,
  locale text default 'pt' check (locale in ('pt', 'en')),
  is_admin boolean default false,
  newsletter_optin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Criar profile automaticamente no signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    (new.email = 'karmicnode@gmail.com')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Bootstrap: se karmicnode@gmail.com já existir, torná-lo admin
insert into profiles (id, email, is_admin)
select id, email, true from auth.users where email = 'karmicnode@gmail.com'
on conflict (id) do update set is_admin = true;

alter table profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles for select to authenticated
  using (auth.uid() = id or auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_admin_update_any" on profiles;
create policy "profiles_admin_update_any" on profiles for update to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');


-- ═══════════════════════════════════════════════════════════════════════
-- 2. ADDRESSES — moradas guardadas na conta
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null default 'Casa',
  full_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  postal_code text not null,
  region text,
  country text not null default 'PT',
  is_default boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_addresses_user on addresses(user_id);

alter table addresses enable row level security;

drop policy if exists "addresses_manage_own" on addresses;
create policy "addresses_manage_own" on addresses for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 3. PRODUCTS — catálogo editável (reservado para futura migração
--    do catálogo estático → dinâmico; Admin Panel escreve aqui,
--    a loja pode continuar a ler do catálogo estático em App.tsx
--    até essa migração acontecer)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  name_en text,
  slug text unique,
  description text,
  description_en text,
  category text not null,
  subcategory text,
  vertical text check (vertical in ('vestuario', 'atelier', 'casa')),
  price_cents int not null,
  compare_at_price_cents int,
  currency text default 'EUR',
  stock int default 0,
  images jsonb default '[]',
  main_image text,
  variants jsonb default '{}',
  tags text[] default '{}',
  badge text,
  badge_color text check (badge_color in ('bordo', 'gold') or badge_color is null),
  is_featured boolean default false,
  is_active boolean default true,
  weight_grams int,
  stripe_product_id text,
  stripe_price_id text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_products_category on products(category);
create index if not exists idx_products_vertical on products(vertical);
create index if not exists idx_products_active on products(is_active);
create index if not exists idx_products_sku on products(sku);

alter table products enable row level security;

drop policy if exists "products_read_active_or_admin" on products;
create policy "products_read_active_or_admin" on products for select to anon, authenticated
  using (is_active = true or auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

drop policy if exists "products_admin_manage" on products;
create policy "products_admin_manage" on products for all to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com')
  with check (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

grant select on products to anon, authenticated;
grant insert, update, delete on products to authenticated;

-- Decrementa o stock de um produto pelo SKU, sem nunca ir a negativo.
-- Chamado pelo api/stripe-webhook.js (via service_role, security definer)
-- após um checkout.session.completed. Se o SKU ainda não existir na tabela
-- `products` (catálogo ainda estático em App.tsx), simplesmente não faz nada
-- — não bloqueia a persistência da encomenda.
create or replace function decrement_product_stock(p_sku text, p_qty int)
returns void language plpgsql security definer as $$
begin
  update products
  set stock = greatest(0, stock - p_qty), updated_at = now()
  where sku = p_sku;
end;
$$;

grant execute on function decrement_product_stock(text, int) to service_role;


-- ═══════════════════════════════════════════════════════════════════════
-- 4. ORDERS — encomendas (escritas pelo stripe-webhook.js após pagamento)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  stripe_session_id text unique,
  stripe_payment_intent text,
  user_id uuid references auth.users(id) on delete set null,

  customer_email text not null,
  customer_name text,
  customer_phone text,

  shipping_address jsonb,
  billing_address jsonb,
  items jsonb not null default '[]',

  subtotal_cents int not null default 0,
  discount_cents int default 0,
  karma_discount_cents int default 0,
  shipping_cents int default 0,
  vat_cents int default 0,
  total_cents int not null default 0,
  currency text default 'EUR',

  status text default 'pending' check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_method text,

  promo_code text,
  gift_card_code text,
  karma_points_redeemed int default 0,
  karma_points_earned int default 0,

  printful_order_id text,
  printful_status text,
  tracking_number text,
  tracking_url text,
  carrier text,

  notes text,
  fulfillment_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  refunded_at timestamptz,
  refund_amount_cents int,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_user on orders(user_id, created_at desc);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_orders_stripe on orders(stripe_session_id);

-- order_number automático: KN-YYYY-00001
create sequence if not exists orders_seq start 1;
create or replace function generate_order_number()
returns trigger language plpgsql as $$
begin
  new.order_number := 'KN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('orders_seq')::text, 5, '0');
  return new;
end;
$$;
drop trigger if exists set_order_number on orders;
create trigger set_order_number before insert on orders
  for each row when (new.order_number is null) execute function generate_order_number();

alter table orders enable row level security;

drop policy if exists "orders_select_own_or_admin" on orders;
create policy "orders_select_own_or_admin" on orders for select to authenticated
  using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

drop policy if exists "orders_insert_any" on orders;
create policy "orders_insert_any" on orders for insert to anon, authenticated with check (true);

drop policy if exists "orders_admin_update" on orders;
create policy "orders_admin_update" on orders for update to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

grant select, insert on orders to anon, authenticated;
grant update on orders to authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- 5. ORDER_ITEMS — linhas de cada encomenda
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_sku text,
  product_name text not null,
  product_image text,
  variant text,
  quantity int default 1,
  unit_price_cents int not null,
  total_cents int not null,
  custom_design jsonb,
  source text default 'manual' check (source in ('bigbuy', 'printful', 'custom', 'manual')),
  tracking_number text,
  tracking_url text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_sku on order_items(product_sku);

alter table order_items enable row level security;

drop policy if exists "order_items_select_own_or_admin" on order_items;
create policy "order_items_select_own_or_admin" on order_items for select to authenticated
  using (
    exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
    or auth.jwt() ->> 'email' = 'karmicnode@gmail.com'
  );

drop policy if exists "order_items_insert_any" on order_items;
create policy "order_items_insert_any" on order_items for insert to anon, authenticated with check (true);

grant select, insert on order_items to anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- 6. REVIEWS — avaliações de produtos (moderadas)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_sku text not null,
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  user_name text,
  user_email text,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  photos jsonb default '[]',
  verified_purchase boolean default false,
  helpful_count int default 0,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'flagged')),
  admin_response text,
  created_at timestamptz default now(),
  moderated_at timestamptz,
  moderated_by uuid
);

create index if not exists idx_reviews_product on reviews(product_sku, created_at desc);
create index if not exists idx_reviews_status on reviews(status);
create index if not exists idx_reviews_user on reviews(user_id);

alter table reviews enable row level security;

drop policy if exists "reviews_read_approved_or_admin" on reviews;
create policy "reviews_read_approved_or_admin" on reviews for select to anon, authenticated
  using (status = 'approved' or auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

drop policy if exists "reviews_insert_any" on reviews;
create policy "reviews_insert_any" on reviews for insert to anon, authenticated with check (true);

drop policy if exists "reviews_update_own" on reviews;
create policy "reviews_update_own" on reviews for update to authenticated
  using (auth.uid() = user_id);

drop policy if exists "reviews_admin_manage" on reviews;
create policy "reviews_admin_manage" on reviews for all to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com')
  with check (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

grant select, insert on reviews to anon, authenticated;
grant update, delete on reviews to authenticated;

-- Atribuir karma automaticamente quando uma review é criada por um user autenticado
create or replace function award_karma_for_review()
returns trigger language plpgsql security definer as $$
begin
  if new.user_id is not null then
    perform award_karma(new.user_id, 'review', 25, jsonb_build_object('product_sku', new.product_sku));
  end if;
  return new;
end;
$$;
-- (trigger criado mais abaixo, depois de award_karma() existir — ver secção 13)


-- ═══════════════════════════════════════════════════════════════════════
-- 7. PROMO_CODES — códigos de desconto administráveis
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed', 'free_shipping')),
  discount_value int not null default 0,
  min_order_cents int default 0,
  max_uses int,
  used_count int default 0,
  max_uses_per_user int default 1,
  free_shipping boolean default false,
  valid_from timestamptz default now(),
  valid_until timestamptz,
  is_active boolean default true,
  applies_to text default 'all' check (applies_to in ('all', 'category', 'product')),
  applies_to_ids text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table promo_codes enable row level security;

drop policy if exists "promo_codes_read_active_or_admin" on promo_codes;
create policy "promo_codes_read_active_or_admin" on promo_codes for select to anon, authenticated
  using (is_active = true or auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

drop policy if exists "promo_codes_admin_manage" on promo_codes;
create policy "promo_codes_admin_manage" on promo_codes for all to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com')
  with check (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

grant select on promo_codes to anon, authenticated;
grant insert, update, delete on promo_codes to authenticated;

insert into promo_codes (code, name, description, discount_type, discount_value, min_order_cents, is_active, free_shipping) values
  ('BEMVINDO10', 'Bem-vindo', 'Desconto de boas-vindas', 'percentage', 10, 3000, true, false),
  ('KARMIC20', 'Karmic 20', 'Desconto especial Karmic', 'percentage', 20, 5000, true, false),
  ('FRETEGRATIS', 'Frete Grátis', 'Portes grátis em qualquer encomenda', 'free_shipping', 0, 0, true, true),
  ('NATAL25', 'Natal', 'Desconto de Natal', 'percentage', 25, 10000, true, false),
  ('VOLTA10', 'Recuperação Carrinho', '10% para voltar', 'percentage', 10, 2000, true, false)
on conflict (code) do nothing;


-- ═══════════════════════════════════════════════════════════════════════
-- 8. GIFT_CARDS — cartões-presente
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  initial_value_cents int not null,
  remaining_value_cents int not null,
  currency text default 'EUR',
  design text default 'classic',
  recipient_name text,
  recipient_email text,
  sender_name text,
  sender_email text,
  personal_message text,
  scheduled_send_at timestamptz,
  sent_at timestamptz,
  delivery_date date,
  purchased_by uuid references auth.users(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  status text default 'active' check (status in ('pending', 'active', 'used', 'expired', 'cancelled')),
  expires_at timestamptz default (now() + interval '2 years'),
  created_at timestamptz default now(),
  redeemed_at timestamptz,
  activated_at timestamptz
);

-- Coluna nova em bases já existentes (bootstrap idempotente)
alter table gift_cards add column if not exists activated_at timestamptz;

create index if not exists idx_gift_cards_code on gift_cards(code);

alter table gift_cards enable row level security;

drop policy if exists "gift_cards_select_own_or_admin" on gift_cards;
create policy "gift_cards_select_own_or_admin" on gift_cards for select to authenticated
  using (
    purchased_by = auth.uid()
    or recipient_email = (auth.jwt() ->> 'email')
    or sender_email = (auth.jwt() ->> 'email')
    or auth.jwt() ->> 'email' = 'karmicnode@gmail.com'
  );

drop policy if exists "gift_cards_insert_any" on gift_cards;
create policy "gift_cards_insert_any" on gift_cards for insert to anon, authenticated with check (true);

drop policy if exists "gift_cards_admin_manage" on gift_cards;
create policy "gift_cards_admin_manage" on gift_cards for all to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com')
  with check (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

grant select, insert on gift_cards to anon, authenticated;
grant update, delete on gift_cards to authenticated;

-- Gerador de código único GC-XXXX-XXXX
create or replace function generate_gift_card_code()
returns text language plpgsql as $$
declare
  new_code text;
  exists_check int;
begin
  loop
    new_code := 'GC-' ||
      upper(substr(md5(random()::text), 1, 4)) || '-' ||
      upper(substr(md5(random()::text), 1, 4));
    select count(*) into exists_check from gift_cards where code = new_code;
    exit when exists_check = 0;
  end loop;
  return new_code;
end;
$$;


-- ═══════════════════════════════════════════════════════════════════════
-- 9. NEWSLETTER_SUBS — subscritores newsletter
--    (nome canónico; substitui "newsletter_subscribers" do ficheiro
--    COMMERCE_SCHEMA — ver nota de reconciliação no topo do ficheiro)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists newsletter_subs (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  language text default 'pt',
  source text default 'website',
  is_active boolean default true,
  confirmed boolean default false,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  tags text[] default '{}',
  created_at timestamptz default now()
);

alter table newsletter_subs enable row level security;

drop policy if exists "newsletter_subs_insert_any" on newsletter_subs;
create policy "newsletter_subs_insert_any" on newsletter_subs for insert to anon, authenticated with check (true);

drop policy if exists "newsletter_subs_admin_select" on newsletter_subs;
create policy "newsletter_subs_admin_select" on newsletter_subs for select to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

drop policy if exists "newsletter_subs_admin_update" on newsletter_subs;
create policy "newsletter_subs_admin_update" on newsletter_subs for update to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

grant insert on newsletter_subs to anon, authenticated;
grant select, update, delete on newsletter_subs to authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- 10. BLOG_POSTS — artigos do Karmic Journal
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  title_en text,
  excerpt text,
  excerpt_en text,
  content text not null,
  content_en text,
  cover_image text,
  category text default 'estilo',
  tags jsonb default '[]'::jsonb,
  author_id uuid references auth.users(id) on delete set null,
  author_name text,
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean default false,
  views_count int default 0,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_blog_posts_slug on blog_posts(slug);
create index if not exists idx_blog_posts_status on blog_posts(status, published_at desc);
create index if not exists idx_blog_posts_category on blog_posts(category, published_at desc);

alter table blog_posts enable row level security;

drop policy if exists "blog_posts_read_published_or_admin" on blog_posts;
create policy "blog_posts_read_published_or_admin" on blog_posts for select to anon, authenticated
  using (status = 'published' or auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

drop policy if exists "blog_posts_admin_manage" on blog_posts;
create policy "blog_posts_admin_manage" on blog_posts for all to authenticated
  using (
    auth.jwt() ->> 'email' = 'karmicnode@gmail.com'
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    auth.jwt() ->> 'email' = 'karmicnode@gmail.com'
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

grant select on blog_posts to anon, authenticated;
grant insert, update, delete on blog_posts to authenticated;

insert into blog_posts (slug, title, title_en, excerpt, excerpt_en, content, content_en, category, status, featured, published_at) values
  (
    'moda-com-alma-o-manifesto',
    'Moda com Alma — O nosso manifesto',
    'Fashion with Soul — Our manifesto',
    'Porque acreditamos que a moda pode ser mais do que estética. Pode ser propósito.',
    'Because we believe fashion can be more than aesthetics. It can be purpose.',
    E'# Moda com Alma\n\nQuando fundámos a Karmic Node, tínhamos uma convicção simples: **a moda pode ser bela e responsável ao mesmo tempo**.\n\n## O nosso compromisso\n\n- Materiais orgânicos e sustentáveis\n- Produção sob encomenda — zero desperdício\n- Design atemporal que dura anos\n- 1% dos lucros para causas ambientais\n\n## Porquê Cartaxo?\n\nSomos uma marca portuguesa com raízes no Ribatejo. Cada peça carrega essa herança.',
    E'# Fashion with Soul\n\nWhen we founded Karmic Node, we had a simple conviction: **fashion can be beautiful and responsible at the same time**.\n\n## Our commitment\n\n- Organic sustainable materials\n- Made-to-order production — zero waste\n- Timeless design that lasts\n- 1% of profits to environmental causes\n\n## Why Cartaxo?\n\nWe are a Portuguese brand with roots in Ribatejo. Each piece carries that heritage.',
    'sustentabilidade', 'published', true, now()
  ),
  (
    'guia-tamanhos-hoodies',
    'Guia de tamanhos: encontra o hoodie perfeito',
    'Size guide: find your perfect hoodie',
    'Como escolher o tamanho ideal para máximo conforto — medida a medida.',
    'How to pick the ideal size for maximum comfort — measurement by measurement.',
    E'# Guia de tamanhos\n\nO tamanho perfeito faz toda a diferença.\n\n## Como medir\n\n1. **Peito**: medir na zona mais larga do peito\n2. **Comprimento**: do ombro até à barra\n3. **Manga**: do ombro até ao pulso\n\n## Tabela\n\n| Tamanho | Peito | Comprimento |\n|---------|-------|-------------|\n| S | 96 cm | 68 cm |\n| M | 100 cm | 71 cm |\n| L | 104 cm | 73 cm |\n| XL | 108 cm | 76 cm |',
    E'# Size Guide\n\nThe perfect size makes all the difference.\n\n## How to measure\n\n1. **Chest**: measure at the widest part\n2. **Length**: shoulder to hem\n3. **Sleeve**: shoulder to wrist\n\n## Chart\n\n| Size | Chest | Length |\n|------|-------|--------|\n| S | 96 cm | 68 cm |\n| M | 100 cm | 71 cm |\n| L | 104 cm | 73 cm |\n| XL | 108 cm | 76 cm |',
    'estilo', 'published', false, now()
  ),
  (
    'karmic-points-guia-completo',
    'Karmic Points — Guia completo',
    'Karmic Points — Complete guide',
    'Tudo sobre o sistema de fidelização Karmic. Ganha pontos, sobe de nível, resgata recompensas.',
    'Everything about the Karmic loyalty system. Earn points, level up, redeem rewards.',
    E'# Karmic Points\n\nO teu compromisso com a marca é recompensado.\n\n## Os 5 Níveis\n\n- 🌱 **Iniciante** — 0 pts\n- ⭐ **Discípulo** — 200 pts\n- 💎 **Mestre** — 750 pts\n- 👑 **Guru** — 2000 pts\n- ✦ **Karmic** — 5000 pts\n\n## Como ganhar\n\n- Registo: **+50 pts**\n- Compra: **+100 pts + 1 pt por €**\n- Review: **+25 pts**\n- Referral: **+200 pts**',
    E'# Karmic Points\n\nYour commitment is rewarded.\n\n## The 5 Levels\n\n- 🌱 **Novice** — 0 pts\n- ⭐ **Disciple** — 200 pts\n- 💎 **Master** — 750 pts\n- 👑 **Guru** — 2000 pts\n- ✦ **Karmic** — 5000 pts\n\n## How to earn\n\n- Signup: **+50 pts**\n- Purchase: **+100 pts + 1 pt per €**\n- Review: **+25 pts**\n- Referral: **+200 pts**',
    'novidades', 'published', false, now()
  )
on conflict (slug) do nothing;


-- ═══════════════════════════════════════════════════════════════════════
-- 11. WISHLIST — favoritos (SKU-based, compatível com catálogo estático)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists wishlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_sku text not null,
  product_id_local int,
  created_at timestamptz default now(),
  unique (user_id, product_sku)
);

create index if not exists idx_wishlist_user on wishlist(user_id);
create index if not exists idx_wishlist_local on wishlist(user_id, product_id_local);

alter table wishlist enable row level security;

drop policy if exists "wishlist_manage_own" on wishlist;
create policy "wishlist_manage_own" on wishlist for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, delete on wishlist to authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- 12. CUSTOM_DESIGNS — rascunhos guardados do Customizer
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists custom_designs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  product_type text not null,
  product_printful_id text,
  variant_color text,
  variant_size text,
  variant_technique text default 'dtg' check (variant_technique in ('dtg', 'dtf', 'embroidery', 'uv')),
  variant_printful_id text,
  design_data jsonb not null,
  thumbnail_url text,
  estimated_price_cents int,
  status text default 'draft' check (status in ('draft', 'saved', 'ordered', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_custom_designs_user on custom_designs(user_id);
create index if not exists idx_custom_designs_status on custom_designs(status);

alter table custom_designs enable row level security;

drop policy if exists "custom_designs_manage_own" on custom_designs;
create policy "custom_designs_manage_own" on custom_designs for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on custom_designs to authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- 13. KARMA POINTS + AI — perfis, histórico, recompensas, chatbot, IA
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists karma_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_points int default 0 not null,
  lifetime_points int default 0 not null,
  current_level text default 'iniciante' not null,
  badges jsonb default '[]'::jsonb not null,
  streak_days int default 0 not null,
  last_active_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table karma_profiles enable row level security;

drop policy if exists "karma_profiles_own" on karma_profiles;
create policy "karma_profiles_own" on karma_profiles for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "karma_profiles_admin_read" on karma_profiles;
create policy "karma_profiles_admin_read" on karma_profiles for select to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

create table if not exists karma_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  points int not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_karma_history_user on karma_history(user_id, created_at desc);

alter table karma_history enable row level security;

drop policy if exists "karma_history_select_own" on karma_history;
create policy "karma_history_select_own" on karma_history for select to authenticated
  using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

drop policy if exists "karma_history_insert_own" on karma_history;
create policy "karma_history_insert_own" on karma_history for insert to authenticated
  with check (auth.uid() = user_id);

create table if not exists karma_rewards (
  id text primary key,
  name text not null,
  name_en text,
  description text,
  description_en text,
  cost_points int not null,
  reward_type text not null,
  reward_value jsonb default '{}'::jsonb,
  icon text,
  required_level text,
  active boolean default true,
  stock int,
  created_at timestamptz default now()
);

alter table karma_rewards enable row level security;

drop policy if exists "karma_rewards_read_active" on karma_rewards;
create policy "karma_rewards_read_active" on karma_rewards for select using (active = true);

insert into karma_rewards (id, name, name_en, description, description_en, cost_points, reward_type, reward_value, icon, required_level, active) values
  ('discount-5', 'Desconto 5%', '5% Discount', '5% de desconto na próxima compra', '5% off your next purchase', 100, 'discount_percent', '{"percent": 5}', '💸', null, true),
  ('discount-10', 'Desconto 10%', '10% Discount', '10% de desconto na próxima compra', '10% off your next purchase', 250, 'discount_percent', '{"percent": 10}', '🎁', 'discipulo', true),
  ('discount-15', 'Desconto 15%', '15% Discount', '15% de desconto na próxima compra', '15% off your next purchase', 500, 'discount_percent', '{"percent": 15}', '💎', 'mestre', true),
  ('free-shipping', 'Portes Grátis', 'Free Shipping', 'Portes grátis na próxima encomenda', 'Free shipping on next order', 150, 'free_shipping', '{}', '📦', null, true),
  ('exclusive-sticker', 'Sticker Exclusivo', 'Exclusive Sticker', 'Sticker Karmic Node exclusivo com a tua encomenda', 'Exclusive Karmic sticker with your order', 50, 'product', '{"sku": "STICKER-KN-01"}', '⭐', null, true),
  ('early-access', 'Early Access', 'Early Access', 'Acesso antecipado a novos produtos (7 dias antes)', 'Early access to new products (7 days before)', 300, 'perk', '{"days": 7}', '🚀', 'discipulo', true),
  ('vip-support', 'Suporte VIP', 'VIP Support', 'Suporte prioritário durante 30 dias', 'Priority support for 30 days', 400, 'perk', '{"days": 30}', '👑', 'mestre', true),
  ('karmic-tshirt', 'T-shirt Karmic Edição Limitada', 'Karmic T-shirt Limited Edition', 'T-shirt exclusiva Karmic Node (edição limitada mensal)', 'Exclusive Karmic Node t-shirt (monthly limited edition)', 1500, 'product', '{"sku": "KARMIC-LIMITED-TSHIRT"}', '✦', 'guru', true)
on conflict (id) do nothing;

create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_ai_conversations_session on ai_conversations(session_id, created_at);

alter table ai_conversations enable row level security;

drop policy if exists "ai_conversations_own" on ai_conversations;
create policy "ai_conversations_own" on ai_conversations for all to anon, authenticated
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

create table if not exists ai_design_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  prompt text not null,
  product_type text,
  suggestion_data jsonb not null,
  applied boolean default false,
  created_at timestamptz default now()
);

alter table ai_design_suggestions enable row level security;

drop policy if exists "ai_design_suggestions_own" on ai_design_suggestions;
create policy "ai_design_suggestions_own" on ai_design_suggestions for all to anon, authenticated
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- Função helper: atribuir/retirar pontos (chamada por triggers e pela app)
create or replace function award_karma(
  p_user_id uuid,
  p_action text,
  p_points int,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql security definer as $$
declare
  v_new_lifetime int;
  v_new_level text;
begin
  insert into karma_profiles (user_id) values (p_user_id) on conflict (user_id) do nothing;

  update karma_profiles
  set total_points = total_points + p_points,
      lifetime_points = case when p_points > 0 then lifetime_points + p_points else lifetime_points end,
      last_active_at = now(),
      updated_at = now()
  where user_id = p_user_id
  returning lifetime_points into v_new_lifetime;

  v_new_level := case
    when v_new_lifetime >= 5000 then 'karmic'
    when v_new_lifetime >= 2000 then 'guru'
    when v_new_lifetime >= 750 then 'mestre'
    when v_new_lifetime >= 200 then 'discipulo'
    else 'iniciante'
  end;

  update karma_profiles set current_level = v_new_level where user_id = p_user_id;

  insert into karma_history (user_id, action, points, metadata)
  values (p_user_id, p_action, p_points, p_metadata);
end;
$$;

grant execute on function award_karma to authenticated;

-- Agora que award_karma() existe, ligar o trigger de karma por review (secção 6)
drop trigger if exists on_review_created_karma on reviews;
create trigger on_review_created_karma after insert on reviews
  for each row execute function award_karma_for_review();

-- Trigger: 50 pts de boas-vindas no signup
create or replace function handle_new_user_karma()
returns trigger language plpgsql security definer as $$
begin
  insert into karma_profiles (user_id, total_points, lifetime_points, current_level)
  values (new.id, 50, 50, 'iniciante')
  on conflict (user_id) do nothing;

  insert into karma_history (user_id, action, points, metadata)
  values (new.id, 'signup_bonus', 50, jsonb_build_object('welcome', true));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_karma on auth.users;
create trigger on_auth_user_created_karma
  after insert on auth.users
  for each row execute function handle_new_user_karma();

create or replace view user_karma_summary as
select
  kp.user_id,
  kp.total_points,
  kp.lifetime_points,
  kp.current_level,
  kp.badges,
  kp.streak_days,
  kp.last_active_at,
  case kp.current_level
    when 'iniciante' then 200
    when 'discipulo' then 750
    when 'mestre' then 2000
    when 'guru' then 5000
    else 5000
  end - kp.lifetime_points as points_to_next_level,
  case kp.current_level
    when 'iniciante' then 'discipulo'
    when 'discipulo' then 'mestre'
    when 'mestre' then 'guru'
    when 'guru' then 'karmic'
    else 'karmic'
  end as next_level
from karma_profiles kp;

grant select on user_karma_summary to authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- 14. HEALTH_CHECKS — histórico de verificações do Health Monitor bot
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists health_checks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  total_tests int not null,
  passed int not null,
  failed int not null,
  failed_details jsonb default '[]',
  checked_by uuid,
  checked_by_email text,
  url text,
  user_agent text
);

create index if not exists idx_health_created on health_checks(created_at desc);
create index if not exists idx_health_failed on health_checks(failed) where failed > 0;

alter table health_checks enable row level security;

drop policy if exists "health_checks_insert" on health_checks;
create policy "health_checks_insert" on health_checks for insert to authenticated with check (true);

drop policy if exists "health_checks_admin_select" on health_checks;
create policy "health_checks_admin_select" on health_checks for select to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

grant insert, select on health_checks to authenticated;

create or replace view health_recent as
select
  created_at, total_tests, passed, failed,
  round((passed::numeric / total_tests * 100), 1) as pct,
  checked_by_email,
  jsonb_array_length(failed_details) as failed_count
from health_checks
order by created_at desc
limit 30;

grant select on health_recent to authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- 15. STYLE_PREFERENCES — Personal Stylist AI
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists style_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null,
  outfits_generated int default 0,
  outfits_purchased int default 0,
  updated_at timestamptz default now()
);

alter table style_preferences enable row level security;

drop policy if exists "style_preferences_own" on style_preferences;
create policy "style_preferences_own" on style_preferences for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "style_preferences_admin_select" on style_preferences;
create policy "style_preferences_admin_select" on style_preferences for select to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

grant all on style_preferences to authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- 16. LIVE_ACTIVITY — Live Storefront (feed de atividade em tempo real)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists live_activity (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  event_type text not null check (event_type in ('view', 'add_to_cart', 'purchase', 'wishlist')),
  user_id uuid,
  session_id text,
  product_sku text,
  product_name text,
  location_city text,
  location_country text default 'PT',
  metadata jsonb default '{}'
);

create index if not exists idx_live_activity_created on live_activity(created_at desc);
create index if not exists idx_live_activity_type on live_activity(event_type);

alter table live_activity enable row level security;

drop policy if exists "live_activity_insert" on live_activity;
create policy "live_activity_insert" on live_activity for insert to anon, authenticated with check (true);

drop policy if exists "live_activity_read_recent" on live_activity;
create policy "live_activity_read_recent" on live_activity for select to anon, authenticated
  using (created_at > now() - interval '1 hour');

grant insert, select on live_activity to anon, authenticated;

create or replace view live_activity_recent as
select event_type, product_name, location_city, created_at,
  extract(epoch from (now() - created_at))::int as seconds_ago
from live_activity
where created_at > now() - interval '30 minutes'
order by created_at desc
limit 50;

grant select on live_activity_recent to anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- 17. VAULT_VISITS — tracking de acesso ao Karmic Vault
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists vault_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  visited_at timestamptz default now(),
  had_karma int default 0,
  unlocked boolean default false
);

alter table vault_visits enable row level security;

drop policy if exists "vault_visits_insert" on vault_visits;
create policy "vault_visits_insert" on vault_visits for insert to authenticated with check (true);

drop policy if exists "vault_visits_admin_select" on vault_visits;
create policy "vault_visits_admin_select" on vault_visits for select to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

grant insert, select on vault_visits to authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- 18. PUSH_SUBSCRIPTIONS — PWA push notifications
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text unique not null,
  p256dh_key text not null,
  auth_key text not null,
  user_agent text,
  active boolean default true,
  created_at timestamptz default now(),
  last_used_at timestamptz default now()
);

create index if not exists idx_push_subs_user on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_own" on push_subscriptions;
create policy "push_subscriptions_own" on push_subscriptions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 19. SUSTAINABILITY_STATS — cache de estatísticas de sustentabilidade
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists sustainability_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_items_purchased int default 0,
  total_co2_kg numeric(10, 2) default 0,
  total_water_liters numeric(12, 2) default 0,
  saved_co2_kg numeric(10, 2) default 0,
  trees_equivalent numeric(8, 2) default 0,
  last_calculated_at timestamptz default now()
);

alter table sustainability_stats enable row level security;

drop policy if exists "sustainability_stats_own" on sustainability_stats;
create policy "sustainability_stats_own" on sustainability_stats for all to authenticated
  using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 20. ANALYTICS_EVENTS — eventos internos (opcional)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  event_type text not null,
  event_data jsonb default '{}'::jsonb,
  url text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_analytics_events_type on analytics_events(event_type, created_at desc);
create index if not exists idx_analytics_events_user on analytics_events(user_id, created_at desc);

alter table analytics_events enable row level security;

drop policy if exists "analytics_events_insert_own" on analytics_events;
create policy "analytics_events_insert_own" on analytics_events for insert to anon, authenticated
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "analytics_events_admin_select" on analytics_events;
create policy "analytics_events_admin_select" on analytics_events for select to authenticated
  using (
    auth.jwt() ->> 'email' = 'karmicnode@gmail.com'
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

grant insert on analytics_events to anon, authenticated;
grant select on analytics_events to authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- 21. PRODUCT_BUNDLES — cross-sell / "compre também"
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists product_bundles (
  id uuid primary key default gen_random_uuid(),
  main_product_sku text not null,
  bundled_product_sku text not null,
  relation_type text default 'complement' check (relation_type in ('complement', 'similar', 'outfit', 'often_bought')),
  weight int default 100,
  active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_bundles_main on product_bundles(main_product_sku, weight desc);

alter table product_bundles enable row level security;

drop policy if exists "product_bundles_read_active" on product_bundles;
create policy "product_bundles_read_active" on product_bundles for select using (active = true);

drop policy if exists "product_bundles_admin_manage" on product_bundles;
create policy "product_bundles_admin_manage" on product_bundles for all to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com')
  with check (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');


-- ═══════════════════════════════════════════════════════════════════════
-- 22. PARTNERSHIP_APPLICATIONS — candidaturas (Artistas/Empresas/
--     Afiliados/Grossista)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists partnership_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  program text not null,
  program_name text,
  data jsonb not null,
  language text default 'pt',
  status text default 'new' check (status in ('new', 'reviewing', 'approved', 'rejected', 'contacted')),
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  affiliate_code text unique
);

create index if not exists idx_partnership_status on partnership_applications(status);
create index if not exists idx_partnership_program on partnership_applications(program);
create index if not exists idx_partnership_created on partnership_applications(created_at desc);

alter table partnership_applications enable row level security;

drop policy if exists "partnership_applications_insert_any" on partnership_applications;
create policy "partnership_applications_insert_any" on partnership_applications for insert to anon, authenticated with check (true);

drop policy if exists "partnership_applications_admin_select" on partnership_applications;
create policy "partnership_applications_admin_select" on partnership_applications for select to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

drop policy if exists "partnership_applications_admin_update" on partnership_applications;
create policy "partnership_applications_admin_update" on partnership_applications for update to authenticated
  using (auth.jwt() ->> 'email' = 'karmicnode@gmail.com')
  with check (auth.jwt() ->> 'email' = 'karmicnode@gmail.com');

grant insert on partnership_applications to anon, authenticated;
grant select, update on partnership_applications to authenticated;

create or replace view partnership_stats as
select
  program,
  count(*) as total,
  count(*) filter (where status = 'new') as new_count,
  count(*) filter (where status = 'approved') as approved_count,
  count(*) filter (where created_at > now() - interval '7 days') as last_7_days,
  count(*) filter (where created_at > now() - interval '30 days') as last_30_days
from partnership_applications
group by program;


-- ═══════════════════════════════════════════════════════════════════════
-- 23. ADMIN_DASHBOARD — view agregada para o Admin Panel
--     (karma_points_log CORRIGIDO → karma_profiles.lifetime_points)
-- ═══════════════════════════════════════════════════════════════════════
create or replace view admin_dashboard as
select
  (select coalesce(sum(total_cents), 0) from orders where payment_status = 'paid') as total_revenue_cents,
  (select count(*) from orders where payment_status = 'paid') as paid_orders,
  (select count(*) from orders) as total_orders,
  (select count(*) from orders where status = 'pending') as pending_orders,
  (select count(*) from auth.users) as total_users,
  (select coalesce(avg(rating)::numeric(3,2), 0) from reviews where status = 'approved') as avg_rating,
  (select count(*) from reviews) as total_reviews,
  (select count(*) from reviews where status = 'pending') as pending_reviews,
  (select count(*) from partnership_applications where status = 'new') as new_partnerships,
  (select count(*) from newsletter_subs where is_active = true) as newsletter_subs,
  (select count(*) from gift_cards where status = 'active') as active_gift_cards,
  (select count(*) from promo_codes where is_active = true) as active_promos,
  (select count(*) from products where is_active = true) as active_products,
  (select coalesce(sum(lifetime_points), 0) from karma_profiles) as total_karma_distributed;

grant select on admin_dashboard to authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- ✅ FIM — SCHEMA CONSOLIDADO COMPLETO
-- ═══════════════════════════════════════════════════════════════════════
select '✅ Karmic Node — schema consolidado aplicado com sucesso!' as resultado;
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
