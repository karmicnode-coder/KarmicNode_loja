# Handoff: Karmic Node — Loja Online (v2)

## Overview

**Karmic Node Loja** is a bilingual e-commerce web application for a Portuguese lifestyle brand selling curated apparel and IT/tech products, with a strong **customization** vertical for both. The design ships:

- A dark, editorial e-commerce store (fashion + tech in one shop, two verticals)
- An immersive **live-preview customization configurator** (Customizer V2) that lets customers design their own apparel piece or IT accessory step-by-step
- Full **PT ↔ EN** internationalisation across every surface

The design lives on top of the existing `karmicnode-coder/KarmicNode_loja` GitHub repository (React 19 + Vite + Tailwind v4 + Stripe), which the customer already owns and deploys via Vercel to `karmicnode.com`.

## About the Design Files

The files in this bundle are **design references** — a working HTML/JSX prototype showing intended visual, interaction, and copy design. They are **not production code to ship**. The customer's real production codebase is the linked GitHub repo (`karmicnode-coder/KarmicNode_loja`), a React 19 + Vite + Tailwind v4 project.

The developer's task is to **recreate this design inside the existing GitHub repo** — extending the current `src/App.tsx` and `src/i18n.ts` with the new components, catalog, and translations documented here — using the repo's established patterns (React function components, inline styles, Tailwind utility classes, Vite/Vercel deploy). The design tokens, layout, copy, and behaviour in this bundle are the source of truth for the redesign; the implementation must match them pixel-perfect.

## Fidelity

**High-fidelity (hifi).** The prototype is a full working React app with final colors, typography, spacing, animations, live preview logic, i18n plumbing, and interaction states. Ports should be pixel-accurate: use the exact hex values, font stacks, letter-spacing, and easing curves in this document. Anywhere the prototype uses inline SVG placeholders for product imagery, replace with real photos in production (see Assets).

---

## Screens / Views

### 1. Header (all pages)

- **Purpose**: Global navigation + language switch + cart access.
- **Layout**: Sticky top bar, `padding: 11-17px var(--pad-x)` (17px unscrolled, 11px scrolled). Two horizontal flex rows:
  - Announcement bar (bordo background)
  - Main bar: logo (left) · nav (centre, `.kn-header-nav`) · right actions
- **Components**:
  - **Announcement bar**: `background: var(--bordo) #8B1E2D`, padding 9px 20px, font-size 12px letter-spacing .16em uppercase. Two i18n strings: `announcement_shipping` + `announcement_payment`.
  - **Logo**: 56×56 png (`assets/logo-karmic-node.png`) + wordmark `KARMIC·NODE` in Cormorant Garamond 20px, letter-spacing .14em, gold middle-dot.
  - **Nav**:
    - `Home` — plain link (`t('nav_home')`)
    - `Apparel ▾` — dropdown, `t('vert_vestuario')`, gold accent, sub-items = `VESTUARIO_SUBS`
    - `IT & Tech ▾` — dropdown, `t('vert_it')`, bordo accent, sub-items = `IT_SUBS`
    - `✦ Customize` — highlighted CTA button, `border: 1px solid var(--gold-3)`, gold text; active state = filled gold background with dark text
    - `Blog`, `Contact` — plain links
  - **Right actions**: PT/EN toggle (segmented, current lang has gold background + dark text), user icon (goes to `contact`), Cart button (bordo pill with count badge).
- **Scroll behaviour**: When `window.scrollY > 40` → header shrinks (11px vertical padding), background solidifies (`rgba(11,11,12,.96)`), border appears.
- **Dropdown behaviour**: Hover-open with 120ms delay before closing. Panel: `min-width: 240px`, backdrop-blur 16px, gold-tinted list items, arrow-down chevron rotates 180° when open.

### 2. Homepage

- **Purpose**: Store landing — brand hero, categories, bestsellers, promo, new arrivals, accessories carousel, brand ticker, trust badges, testimonials, newsletter.
- **Sections** (top to bottom):
  1. **Hero** (min-height 86vh)
     - Left: pulsing gold pill "Loja Online Oficial · Karmic Node", 4-line display title `Moda / com alma. / Estilo / atemporal.` (`clamp(48px, 6.5vw, 100px)`, Cormorant, gold + bordo em's), body copy, two CTAs (`Explorar Produtos` primary, `Ver Promoções` ghost), 3 stats row (`500+ Produtos`, `48h Entrega`, `100% Garantia`).
     - Right: featured product image with gold corner-brackets + floating overlay card ("Em Destaque" — Product name, stars, price pill).
     - Background: two-layer radial gradient (bordo + gold) + soft grid pattern (`backgroundImage: linear-gradient…80px 80px`).
  2. **Categories** — 6 icon cards, 1-line eyebrow + title + lead + `Ver todas as categorias` CTA. Layout `.kn-cat-grid` = 6 cols → 3 → 3 on breakpoints.
  3. **Bestsellers carousel** — 4 visible cards, auto-advance 4s, prev/next arrows, dot pagination. Product cards below.
  4. **Promo banner** — Radial bordo gradient background, 2-col grid: left copy + CTAs, right live countdown (hours/mins/secs).
  5. **New arrivals** — 4-col product grid.
  6. **Accessories carousel** — 4-col carousel, products reversed.
  7. **Brand ticker** — horizontal auto-scroll infinite loop of brand names + gold dot separators.
  8. **Trust badges** — 4-col grid (Envio Rápido, Devolução 30 Dias, Pagamento Seguro, Suporte Especializado), each with SVG icon + title + desc.
  9. **Testimonials** — 3-col grid with big gold quote mark + italic quote + reviewer + role + stars.
  10. **Newsletter** — centered, radial bordo gradient, email input + gold submit.

### 3. Shop / Vertical pages (`vestuario` / `it`)

- **Purpose**: Browse a vertical's products with sub-category filter, search, price range, sort.
- **Layout**:
  - Hero: 52px 36px padding, radial gradient (bordo for IT, gold for Vestuario), breadcrumb `KARMIC NODE · Vertical`, big italic title (`Moda com alma.` / `Tecnologia essencial.`), lead paragraph, search bar (max-width 480px).
  - Below: `.kn-shop-layout` = `240px 1fr` grid.
    - **Sidebar**: sub-categories list with counts, "Só personalizáveis" dashed pill, price range slider (50-2200€), sort options.
    - **Main**: mobile filter chips (available subs), "N products found" counter, product grid `.kn-products-3` (3 cols → 2 → 1).
- **Product card** (`ProductCard`):
  - Aspect-ratio 4/3 image, hover scale 1.06 + overlay w/ "Ver produto" button
  - Top-left badge pill (Bestseller/Popular/Novo/Premium/Últimas unidades, bordo or gold)
  - Top-right wishlist heart (32×32, rgba(11,11,12,.7))
  - Info: category eyebrow (gold, 10px .22em), display-font name (17px), stars + reviews count, price + optional strikethrough original + discount %
  - Full-width secondary "Adicionar ao carrinho" button (bg-3, hovers to bordo-2)
  - Bottom-hover gold-to-bordo accent line

### 4. Product page

- Breadcrumb bar: `Back` link · category · name
- 2-col layout `.kn-product-detail`:
  - **Left gallery**: main 4:3 image, thumbnails row below (72×54, gold border when active)
  - **Right info**:
    - Category eyebrow · Big display title
    - Stars + `X (Y reviews)` + stock indicator (`Em stock (N)`, `Últimas N unidades`, `Esgotado`)
    - Price row (display font, big) + strikethrough + gold discount pill + `Poupa X€` line
    - Divider
    - Qty spinner + big "Adicionar ao carrinho" button (bordo, turns green on "Adicionado!") + wishlist icon (50×50)
    - 2×2 grid trust mini badges (🚚 ↩ 🔒 📏)
- Tabs (`.kn-tabs`): Descrição / Especificações / Avaliações. Underline via gold `::after`.
- Related products: 4-col grid of same category items.

### 5. Customizer V2 (`custom` page) — the centerpiece

- **Purpose**: Guided 4-step wizard to design a custom apparel piece or IT accessory, with live SVG preview and dual CTA (request quote OR pay now).
- **Global chrome**:
  - Radial gradient background (accent-tinted, 1000×500 top-left + 800×400 bottom-right)
  - Fixed SVG `<feTurbulence>` grain overlay (opacity 0.14, mix-blend overlay)
  - Sparkles component: on `fireSparkle()`, spawns 12 gold star SVGs from centre with random dx/dy/rotation; 1s ease-out animation via CSS keyframes (`kn-spark`).
  - Progress bar (top): 4 equal columns, each with a 4px bar (accent when `i <= step`) + step label (10px .22em uppercase). Active step label bolded + coloured.

- **Step 0 — Category**:
  - Two big buttons side-by-side (`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`)
  - Each: 48px 32px padding, `rgba(11,11,12,.65)` bg, accent-tinted border, min-height 320px. Hover: `translateY(-6px)` + accent glow shadow.
  - Contains: SVG glyph 140×80, "VERTICAL" eyebrow, 36px display title, 14px description, gold "Escolher →" cue.

- **Step 1 — Product base**:
  - Back link + vertical label
  - Grid `repeat(auto-fill, minmax(180px,1fr))`, 14px gap
  - Each card: 200px min-height, SVG icon 90×80, product name, "desde Xâ‚¬" label

- **Step 2 — Configure (split-screen)**:
  - `.kn-cust-grid`: `1fr 420px` (collapses to 1fr at ≤780px)
  - **Left — LivePreview**:
    - Sticky top 100, min-height 520
    - Radial gradient bg with accent, SVG grain, 4 gold corner brackets
    - Product SVG rendered with baseColor as fill, overlay image (upload) at position coords, overlay text
    - Product floats (`kn-float` 4s ease-in-out infinite ±6px)
    - Label pill floating at bottom (accent 55% opacity border, backdrop-blur 8px)
  - **Right — KitCard stack**:
    - "Kit Builder" title + subtitle
    - `KitCard` components: each = number circle + title + subtitle (current value) + chevron. Active card slides left 4px, background rgba(176,141,87,.05). Expanded body animates in.
    - Cards (order): Base color, Model?, Size?, Fabric?, Case material?, Finish?, Technique?, Design (upload), Position?, Text, Qty, Notes.
      - `?` = conditional on product flags (`hasSize`, `hasFabric`, `hasModel`, etc.)
    - Card bodies:
      - **Color**: 10 circular 36px swatches, active = 3px accent border + scale 1.15
      - **Model**: `<select>` of iPhone/Samsung/Xiaomi/Pixel models
      - **Size**: pill buttons XS/S/M/L/XL/XXL, active = filled accent
      - **Fabric / Material**: full-width tiles w/ label + note, active = tinted accent bg
      - **Finish**: 50/50 split pill toggle
      - **Technique**: 2-col tile grid, price add-on shown
      - **Design**: dashed file-upload zone (accepts image/*), remove link after upload
      - **Position**: 2-col grid
      - **Text**: max-length 30 input
      - **Qty**: range slider 1-500 + preset chips 1/10/25/50/100/250
      - **Notes**: textarea
    - Below cards: **EstimativaSticky** panel (accent border, backdrop-blur, price flash animation on change)
    - Full-width accent "Continuar →" button
- **Step 3 — Submit**:
  - Success view (post-submit): centered check icon + `Orçamento pedido!` / `Adicionado ao carrinho!` + reset/continue CTAs
  - Form view:
    - "Editar configuração ←" back link
    - Big "Quase lá." title + sub
    - **Summary card**: accent border, 2-col grid of `label / value` rows (Artigo, Cor, Modelo?, Tamanho?, Material?, Técnica?, Design, Texto, Qty). Divider then Total estimado (36px display, accent).
    - **Contact block**: 3 stacked inputs (Nome/Empresa, Email, Telefone opcional)
    - **Dual CTA row**: 2-col grid.
      - Left: transparent + accent-border "🧾 Pedir orçamento" · "Resposta em 24h"
      - Right: filled accent "💳 Pagar já com estimativa" · "Adiciona ao carrinho"

- **Data behind the customizer**:
  - `CUST_PRODUCTS` — 14 items across 2 groups (vestuario / it) with flags & icon SVG paths & basePrice.
  - `CUST_COLORS` — 10 curated colors with `hex/key/label`.
  - `CUST_SIZES` — 6 sizes.
  - `CUST_FABRICS`, `IT_MATERIALS`, `IT_FINISHES` — each with `mult` multiplier + `note`.
  - `CUST_TECHNIQUES` — 4 items with `add` price addon.
  - `CUST_POSITIONS` — 4 positions with x/y offset for overlay placement.
  - `IT_MODELS` — 12 phone models.
- **Estimate function**: `unit = basePrice * fabricMult * materialMult * finishMult + techAdd + uploadAdd(+3€)`, then discount tier by qty (`5% at 10+, 10% at 20+, 18% at 50+, 25% at 100+`).

### 6. Blog / Blog article / Contact / About

- **Blog list**: hero + search + category chips (`Todos, Estilo, Tendências, Cuidados, Sustentabilidade, Acessórios`) + featured post 2-col card + 3-col grid of blog cards.
- **Blog article**: hero image w/ overlay gradient, breadcrumb, drop-cap italic excerpt, body paragraphs (16px, line-height 1.85), category pill, author card at bottom.
- **Contact**: 2-col hero + info list (Email/Location/Hours/Support) + Formspree contact form with area select.
- **About**: 3-col mission/vision/values cards + big final CTA panel.

### 7. Cart Drawer (right slide-in)

- 440px wide, dark backdrop-blur overlay, transform slide-in .4s cubic-bezier(.2,.7,.2,1).
- Header: eyebrow + "N artigos" count + close button.
- Free-shipping progress: hides once threshold (150€) hit, shows `Faltam X€ para envio grátis` + progress bar (gold).
- Item list: 72×72 thumb, name + category, qty spinner, price, delete icon (hover bordo).
- Footer: Subtotal / Envio / Total rows, big filled bordo "Finalizar Compra", trust icons row, payment method chips (VISA/MC/MB/MBWay/PayPal).

### 8. Footer (all pages)

- `#08080a` bg, 4-col grid (`1.4fr 1fr 1fr 1fr`):
  - Col 1: logo, tagline, social icons
  - Col 2 "Loja": Tops / Calças / Vestidos / Casacos / Acessórios / Promoções
  - Col 3 "Empresa": Quem Somos / Roupa Personalizada / Blog / Sustentabilidade / Parcerias / Contacto
  - Col 4 "Apoio": FAQ / Política de Envio / Devoluções / Garantia / Privacidade / Termos
- Bottom bar: copyright · payment method chips.

---

## Interactions & Behavior

### Navigation
- `activePage` state: `'home' | 'shop' | 'product' | 'contact' | 'about' | 'blog' | 'custom' | 'vestuario' | 'it'`.
- `navigate(page, filter?)` sets `activePage`, resets `activeProduct`, sets `shopFilter` if page is shop-y, smooth-scrolls to top.
- Product open → `activePage='product'` + `activeProduct=p`. Back → returns to vertical of the product (`vestuario` or `it`).

### Live preview updates (Customizer)
- On every KitCard change (color/text/upload/position), the `<LivePreview>` re-renders with new fill / overlay / position — no debounce, immediate.
- Sparkles fire on any control that meaningfully mutates state (`fireSparkle()` bumps a tick that Sparkles subscribes to).

### Price flash
- `EstimativaSticky` uses `key={pulse}` on the total span → React re-mounts it, triggering `kn-priceFlash` keyframe (scale 1 → 1.1 → 1, brightness pulse).

### Cart submission from customizer
- "Pagar já" mode calls `onAddToCart({ id: Date.now(), name: '<product> personalizado', category: 'Personalização', price: unit, image: '', qty, _customization: payload })` → cart drawer auto-toasts.

### Formspree
- Contact and customizer "Pedir orçamento" POST to `https://formspree.io/f/xeeyzlvb` as `FormData`.

### Persistence
- Cart persists via React state (in-memory in prototype); production should localStorage-back it.
- URL query param `?pagamento=sucesso|cancelado` shows a top-of-page toast + clears cart on success.

### Responsive breakpoints
- 1100px: 6-col cat grid → 3, 4-col products → 3, footer 4 → 2, shop sidebar 240px → 200px.
- 860px: hero 2-col → 1 (right hidden), products 3, trust 4 → 2, product-detail 2 → 1, contact/promo/section-head → 1.
- 780px (customizer): split-screen collapses to single-column.
- 560px: cats 3 cols, products 2, promos stack.

### Animations
- `kn-fadeUp` 0.65s var(--ease) both — used on `.reveal` classes.
- `kn-float` 4s ease-in-out infinite — LivePreview product.
- `kn-priceFlash` 0.35s ease-out — estimate total.
- `kn-spark` 1s cubic-bezier(.2,.7,.2,1) forwards — sparkle particles.
- `ticker` 30s linear infinite — brand ticker.
- `pulse` 2s ease-in-out infinite — hero badge dot.

---

## State Management

Single top-level `App` component holds:

- `lang: 'pt' | 'en'`
- `activePage: Page`
- `activeProduct: Product | null`
- `shopFilter: string`
- `cartOpen: boolean`
- `cartItems: CartItem[]`
- `wishlist: Set<number>`
- `toast: string | null`
- `backTop: boolean`
- `liveProducts: Product[]` — hydrates from `/api/products` on mount, falls back to `ALL_PRODUCTS`.

Language propagates via React Context (`LangContext`) with `{ lang, t, arr }`.

Product translations flow through the `useProductI18n()` hook which returns `{ pName, pDesc, pCat, pSub, pBadge, pSpecs }` — each falls back to PT if the `nameEn/descEn/…` field is missing.

Blog translations: components read `post.titleEn / excerptEn / categoryEn` conditionally on `lang === 'en'`.

Customizer local state (`step`, `group`, `product`, `color`, `size`, `fabric`, `technique`, `material`, `finish`, `model`, `position`, `textOverlay`, `uploadUrl`, `qty`, `notes`, `name`, `email`, `phone`, `activeCard`, `sparkleTick`, `sent`, `loading`, `err`).

---

## Design Tokens

### Colors (CSS custom properties, defined in `karmic-loja.css`)

| Token | Value | Purpose |
|---|---|---|
| `--bordo` | `#8B1E2D` | Primary accent (IT vertical + primary CTA) |
| `--bordo-2` | `#6E1522` | Primary hover |
| `--bordo-3` | `#a83247` | Primary secondary/italic |
| `--gold` | `#B08D57` | Secondary accent (Vestuário vertical + highlights) |
| `--gold-2` | `#cbae7d` | Gold hover / bright |
| `--gold-3` | `#8a6d40` | Gold darker (borders) |
| `--bg` | `#0B0B0C` | Page background |
| `--bg-1` | `#111111` | Card background |
| `--bg-2` | `#1C1C1C` | Elevated card / input |
| `--bg-3` | `#262626` | Tertiary surface |
| `--border` | `#2b2926` | Standard border |
| `--border-2` | `#3a3733` | Subtle border-2 |
| `--fg` | `#F5F2ED` | Primary text (ivory) |
| `--fg-dim` | `#d9d4cb` | Secondary text |
| `--fg-mute` | `#A7A7A7` | Muted text |

### Typography

- **Display font** (`--f-display`): `'Cormorant Garamond', 'Times New Roman', serif` — used for all headings, titles, product names, prices.
- **Body font** (`--f-sans`): `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` — used for body copy, buttons, eyebrows, UI.
- **Loading**: `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap');`

Type scale (approximate, most sizes are `clamp()` responsive):

| Purpose | Size | Weight | Family |
|---|---|---|---|
| Hero title | `clamp(48px, 6.5vw, 100px)` | 500 | Display |
| Page title | `clamp(40px, 5vw, 72px)` | 500 | Display |
| Section title | `clamp(30px, 3.5vw, 52px)` | 500 | Display |
| Product name (card) | 17px | 500 | Display |
| Product name (page) | `clamp(28px, 3vw, 44px)` | 500 | Display |
| Price big | `clamp(32px, 3.5vw, 48px)` | 600 | Display |
| Eyebrow | 10-11px | 500-600 | Sans, letter-spacing .22-.28em uppercase |
| Body | 14-16px | 300-400 | Sans, line-height 1.6-1.7 |
| Button | 11-12px | 500-700 | Sans, letter-spacing .18-.24em uppercase |
| Micro | 10-11px | — | Sans |

### Spacing

- Padding X: `--pad-x: clamp(18px, 4vw, 56px)`
- Max content width: `--maxw: 1280px`
- Section vertical padding: `clamp(48px, 6vw, 110px) 0`
- Card padding: 18-24px (product cards), 40-52px (feature cards)

### Radii & Shadows

- Buttons/cards: **0** (sharp corners — brand signature)
- Wishlist heart bg: circle
- Cart drawer / modal: 0
- Product image aspect: 4/3
- Shadows: sparse — mostly `0 16px 48px rgba(0,0,0,.45)` on card hover, `0 20px 60px rgba(0,0,0,.6)` on dropdown, `0 12px 40px rgba(0,0,0,.5)` on toast, `0 24px 60px <accent>30` on step-0 button hover.

### Easing

`--ease: cubic-bezier(.2,.7,.2,1)` — primary easing across the design.

---

## Assets

### Bundled
- `assets/karmic-loja.css` — full design token CSS + layout classes + animations
- `assets/i18n-loja.js` — PT/EN i18n dictionary (~400 keys)
- `assets/App-loja.tsx` — full React 18 app (3600+ lines): types, catalog, components, customizer, routing
- `assets/logo-karmic-node.png` — 512×512 PNG logo
- `data/catalog.json` — 29-product catalog snapshot
- `data/product-translations.json` — PT↔EN maps for names, descriptions, specs, categories, subcategories, badges

### Missing / to source in production
- **Product photos**: the prototype uses inline SVG placeholders per product (gold/bordo-accented pattern with product icon). Production needs real photos for all 29 products, 1-2 per product minimum, aspect-ratio 4:3, min-width 800px.
- **Hero image**: currently `https://images.unsplash.com/photo-1490481651871-…` on the right side of the homepage hero. Replace with owned photography of a curated apparel display.
- **Blog images**: currently Unsplash URLs — replace with owned/licensed imagery aligned to each article theme.
- **Category thumbnails**: SVG placeholders in the prototype; production could keep the SVG treatment or use photos.
- **Favicon**: `public/favicon.png` present, verify sizing.

### Third-party integrations
- **Formspree** — form endpoint `https://formspree.io/f/xeeyzlvb` (contact + customizer quotes)
- **Stripe** — checkout via `/api/checkout` (already present in the repo; the "Pagar já com estimativa" flow from customizer adds items with a `_customization` payload that must be serialized into Stripe line-item metadata)
- **API stubs**: `/api/products` (list), `/api/checkout` (Stripe session)

---

## Files

- `Loja Karmic Node.html` — entry HTML that mounts the app via CDN React 18 + Babel Standalone transpile of the TSX (**this is the prototype loader; production uses the repo's own Vite entry**)
- `assets/App-loja.tsx` — full app source (types, catalog, all components, customizer, routing, mount) — 3600+ lines
- `assets/i18n-loja.js` — bilingual dictionary
- `assets/karmic-loja.css` — design tokens + layout + animations
- `assets/logo-karmic-node.png` — logo
- `data/catalog.json` — 29-product catalog snapshot
- `data/product-translations.json` — PT↔EN translation maps

### How to port into `karmicnode-coder/KarmicNode_loja`

1. Copy the token block from `assets/karmic-loja.css` into `src/index.css` (already partially there — align variable names).
2. Extend `src/i18n.ts` with the additional PT+EN keys from `assets/i18n-loja.js` (they're the same shape — plain `translations = { pt: {}, en: {} }` and helpers `createT` + `getArr`).
3. In `src/App.tsx`:
   - Replace the current `ALL_PRODUCTS` array with the 29-product catalog from `data/catalog.json` (add the `nameEn`, `descriptionEn`, `categoryEn`, `subcategoryEn`, `specsEn` fields, and `vertical`, `subcategory`, `customizable`, `sku` flags to the `Product` interface).
   - Add page types `vestuario` and `it` to the `Page` union.
   - Add the `useProductI18n()` hook and the `<NavDropdown>` component.
   - Add the `VESTUARIO_SUBS` / `IT_SUBS` constants and wire them into the header + shop sidebar.
   - Replace the existing `CustomPage` with the full **`CustomizerV2`** (Sparkles + LivePreview + KitCard + EstimativaSticky + the 4-step main component).
   - Extend `<Header>` to render the two `<NavDropdown>`s + highlighted `Customize` CTA.
   - Extend `<ShopPage>` to accept a `vertical` prop and filter/render accordingly (title + sidebar + chips).
   - Extend `<ProductCard>` / `<ProductPage>` / `<BlogPage>` / `<CartDrawer>` to consume the `pi.pName/pDesc/pCat/pSub/pBadge/pSpecs` helpers so all text respects language.
4. Wire the customizer's cart flow — when the user picks "Pagar já", the item goes through the existing cart → `/api/checkout` path, but the Stripe session creation code must forward the `_customization` metadata into `line_items[].price_data.product_data.metadata` so the order fulfilment team receives the customization spec.
5. Deploy via the existing Vercel project on `karmicnode.com`.

Everything visible on `Loja Karmic Node.html` is production-intent — copy blocks, colors, motion, and content are final unless the customer changes them.
