// Karmic Node — componentes partilhados
(function () {
  'use strict';
  var R = React, h = R.createElement, useState = R.useState, useEffect = R.useEffect, useRef = R.useRef, useMemo = R.useMemo;
  var K = window.KN, Icon = K.Icon, eur = K.eur, go = K.go;

  var LINES = [
    { id: 'novidades', label: 'Novidades', href: '/loja?f=novo' },
    { id: 'roupa', label: 'Roupa', href: '/loja/roupa', mega: true },
    { id: 'acessorios', label: 'Calçado e acessórios', href: '/loja/acessorios', mega: true },
    { id: 'casa', label: 'Casa', href: '/loja/casa', mega: true },
    { id: 'personalizar', label: 'Personalizar', href: '/personalizar' },
    { id: 'promo', label: 'Black Friday', href: '/black-friday', accent: true },
  ];

  function useLock(on) { useEffect(function () { if (!on) return; var o = document.body.style.overflow; document.body.style.overflow = 'hidden'; return function () { document.body.style.overflow = o; }; }, [on]); }
  function useEsc(on, fn) { useEffect(function () { if (!on) return; var k = function (e) { if (e.key === 'Escape') fn(); }; window.addEventListener('keydown', k); return function () { window.removeEventListener('keydown', k); }; }, [on]); }

  function Sheet(p) {
    useLock(p.open); useEsc(p.open, p.onClose);
    if (!p.open) return null;
    return h('div', { className: 'sheet ' + (p.side || 'right'), role: 'dialog', 'aria-modal': true, 'aria-label': p.label },
      h('div', { className: 'sheet-bg', onClick: p.onClose }),
      h('div', { className: 'sheet-panel' }, p.children));
  }

  function subsOf(line) {
    var c = {}; window.KN_PRODUCTS.forEach(function (x) { if (x.line === line) c[x.cat] = (c[x.cat] || 0) + 1; });
    return window.KN_SUB_ORDER.filter(function (k) { return c[k]; }).map(function (k) { return [k, c[k]]; });
  }
  function lineInfo(id) { return window.KN_LINES.find(function (l) { return l.id === id; }); }

  function MegaMenu(p) {
    var info = lineInfo(p.id), subs = subsOf(p.id), all = window.KN_PRODUCTS.filter(function (x) { return x.line === p.id; });
    var best = all.slice().sort(function (a, b) { return b.reviews - a.reviews; }).slice(0, 2);
    return h('div', { className: 'mega', onMouseLeave: p.onClose },
      h('div', { className: 'wrap mega-in' },
        h('div', null, h('h5', null, 'Categorias'), h('ul', null,
          h('li', null, h('a', { href: '#/loja/' + p.id, className: 'mega-all' }, 'Ver tudo em ' + info.label, h('span', null, all.length))),
          subs.map(function (s) { return h('li', { key: s[0] }, h('a', { href: '#/loja/' + p.id + '?cat=' + encodeURIComponent(s[0]) }, s[0], h('span', null, s[1]))); }))),
        h('div', null, h('h5', null, 'Descobrir'), h('ul', null,
          h('li', null, h('a', { href: '#/loja/' + p.id + '?sort=pop' }, 'Mais vendidos')),
          h('li', null, h('a', { href: '#/loja/' + p.id + '?sort=new' }, 'Novidades')),
          all.some(function (x) { return x.was; }) ? h('li', null, h('a', { href: '#/loja/' + p.id + '?f=promo', style: { color: 'var(--accent)' } }, 'Em promoção')) : null,
          all.some(function (x) { return x.custom; }) ? h('li', null, h('a', { href: '#/personalizar' }, 'Personalizar')) : null)),
        h('div', { className: 'mega-prods' }, best.map(function (x) { return h('a', { key: x.id, href: '#/p/' + x.id, className: 'mega-prod' }, h(K.ProductImage, { product: x }), h('span', null, x.name), h('b', null, eur(x.price))); })),
        h('a', { className: 'mega-feat' + (info.prods ? ' prodfeat' : ''), href: '#/loja/' + p.id }, info.prods && K.Collage ? h(K.Collage, { ids: info.prods }) : h('img', { src: info.img, alt: '' }), h('span', null, h('em', null, info.label), h('small', null, info.blurb)))));
  }

  function Header(p) {
    var st = K.useStore(), r = p.route;
    var mS = useState(false), menu = mS[0], setMenu = mS[1];
    var sS = useState(false), search = sS[0], setSearch = sS[1];
    var mgS = useState(null), mega = mgS[0], setMega = mgS[1];
    var drS = useState(null), drill = drS[0], setDrill = drS[1];
    var scS = useState(false), scrolled = scS[0], setScrolled = scS[1];
    var timer = useRef(0);
    var active = r.name === 'personalizar' ? 'personalizar' : r.name === 'black-friday' ? 'promo' : r.name === 'loja' ? (r.id || (r.params.f === 'promo' ? 'promo' : r.params.f === 'novo' ? 'novidades' : '')) : r.name === 'p' && st.byId[r.id] ? st.byId[r.id].line : '';
    useEffect(function () { setMenu(false); setSearch(false); setMega(null); setDrill(null); }, [r.name, r.id, r.params.q, r.params.cat, r.params.f]);
    useEffect(function () { var f = function () { setScrolled(window.scrollY > 8); }; f(); window.addEventListener('scroll', f, { passive: true }); return function () { window.removeEventListener('scroll', f); }; }, []);
    useEffect(function () { var k = function (e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true); } if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); setSearch(true); } }; window.addEventListener('keydown', k); return function () { window.removeEventListener('keydown', k); }; }, []);
    function openMega(id) { clearTimeout(timer.current); timer.current = setTimeout(function () { setMega(id); }, mega ? 0 : 120); }
    function closeMega() { clearTimeout(timer.current); timer.current = setTimeout(function () { setMega(null); }, 160); }
    var left = K.cutoffLeft();
    var msgs = [left ? 'Encomenda nas próximas ' + left + ' e enviamos hoje' : 'Envio em 24 h em dias úteis', 'Portes grátis acima de ' + eur(K.CFG.freeShip), 'Devoluções grátis em ' + K.CFG.returnDays + ' dias', '10% na 1.ª compra com WELCOME10'];
    return h(R.Fragment, null,
      h('div', { className: 'ann' }, h('div', { className: 'ann-track' }, msgs.concat(msgs).map(function (m, i) { return h('span', { key: i }, m); }))),
      h('header', { className: 'hdr' + (scrolled ? ' scrolled' : ''), onMouseLeave: closeMega },
        h('div', { className: 'wrap hdr-in' },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 4 } },
            h('button', { className: 'iconbtn burger', onClick: function () { setMenu(true); }, 'aria-label': 'Abrir menu' }, h(Icon, { n: 'menu' })),
            h('nav', { className: 'nav', 'aria-label': 'Principal' }, LINES.map(function (l) {
              return h('a', { key: l.id, href: '#' + l.href, className: (active === l.id ? 'on' : '') + (mega === l.id ? ' hov' : '') + (l.accent ? ' accent' : ''), 'aria-current': active === l.id ? 'page' : undefined, 'aria-expanded': l.mega ? mega === l.id : undefined,
                onMouseEnter: function () { l.mega ? openMega(l.id) : closeMega(); }, onFocus: function () { if (l.mega) setMega(l.id); } }, l.label);
            }))),
          h('a', { className: 'brand', href: '#/', 'aria-label': 'Karmic Node — início' }, h('img', { src: 'assets/logo-mark.png', alt: '' }), h('span', null, 'Karmic Node')),
          h('div', { className: 'hdr-r' },
            h('button', { className: 'hdr-search', onClick: function () { setSearch(true); }, 'aria-label': 'Pesquisar' }, h(Icon, { n: 'search', s: 18 }), h('span', null, 'Pesquisar'), h('kbd', null, '/')),
            h('button', { className: 'iconbtn only-m', onClick: function () { setSearch(true); }, 'aria-label': 'Pesquisar' }, h(Icon, { n: 'search' })),
            h('a', { className: 'iconbtn', href: '#/conta', 'aria-label': 'A minha conta' }, h(Icon, { n: 'user' })),
            h('a', { className: 'iconbtn', href: '#/favoritos', 'aria-label': 'Favoritos' }, h(Icon, { n: 'heart' }), st.wish.length ? h('span', { className: 'dot' }, st.wish.length) : null),
            h('button', { className: 'iconbtn', onClick: function () { st.setCartOpen(true); }, 'aria-label': 'Carrinho, ' + st.count + ' artigos' }, h(Icon, { n: 'bag' }), st.count ? h('span', { className: 'dot' }, st.count) : null))),
        mega ? h('div', { onMouseEnter: function () { clearTimeout(timer.current); } }, h(MegaMenu, { id: mega, onClose: closeMega })) : null),
      mega ? h('div', { className: 'mega-scrim', onMouseEnter: closeMega }) : null,
      h(Sheet, { open: menu, onClose: function () { setMenu(false); setDrill(null); }, side: 'left', label: 'Menu' },
        h('div', { className: 'sheet-h' },
          drill ? h('button', { className: 'link', style: { display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600 }, onClick: function () { setDrill(null); } }, h(Icon, { n: 'chevL', s: 18 }), 'Menu')
            : h('a', { className: 'brand', href: '#/', style: { justifySelf: 'start' } }, h('img', { src: 'assets/logo-mark.png', alt: '' }), h('span', null, 'Karmic Node')),
          h('button', { className: 'iconbtn', onClick: function () { setMenu(false); setDrill(null); }, 'aria-label': 'Fechar' }, h(Icon, { n: 'x' }))),
        drill ? h('div', { className: 'sheet-b' },
            h('a', { href: '#/loja/' + drill, className: 'm-drill-hero' + (lineInfo(drill).prods ? ' prodtile' : '') }, lineInfo(drill).prods && K.Collage ? h(K.Collage, { ids: lineInfo(drill).prods }) : h('img', { src: lineInfo(drill).img, alt: '' }), h('span', null, lineInfo(drill).label)),
            h('a', { href: '#/loja/' + drill, className: 'm-row', style: { fontWeight: 700 } }, 'Ver tudo', h(Icon, { n: 'chev', s: 18 })),
            subsOf(drill).map(function (s) { return h('a', { key: s[0], href: '#/loja/' + drill + '?cat=' + encodeURIComponent(s[0]), className: 'm-row' }, h('span', null, s[0], h('em', null, s[1])), h(Icon, { n: 'chev', s: 18 })); }))
        : h('div', { className: 'sheet-b' },
            h('div', { className: 'm-tiles' }, window.KN_LINES.map(function (l) { return h('button', { key: l.id, className: 'm-tile' + (l.prods ? ' prodtile' : ''), onClick: function () { setDrill(l.id); } }, l.prods && K.Collage ? h(K.Collage, { ids: l.prods.slice(0, 1) }) : h('img', { src: l.img, alt: '' }), h('span', null, l.label)); })),
            h('a', { href: '#/loja?f=novo', className: 'm-row' }, 'Novidades', h(Icon, { n: 'chev', s: 18 })),
            h('a', { href: '#/personalizar', className: 'm-row' }, 'Personalizar', h(Icon, { n: 'chev', s: 18 })),
            h('a', { href: '#/black-friday', className: 'm-row', style: { color: 'var(--accent)' } }, 'Black Friday', h(Icon, { n: 'chev', s: 18 })),
            h('a', { href: '#/loja', className: 'm-row' }, 'Toda a loja', h(Icon, { n: 'chev', s: 18 })),
            h('div', { className: 'm-foot' },
              h('a', { href: '#/conta' }, h(Icon, { n: 'user', s: 18 }), 'Conta e encomendas'),
              h('a', { href: '#/favoritos' }, h(Icon, { n: 'heart', s: 18 }), 'Favoritos (' + st.wish.length + ')'),
              h('a', { href: '#/ajuda' }, h(Icon, { n: 'ret', s: 18 }), 'Ajuda, envios e devoluções')))),
      h(SearchSheet, { open: search, onClose: function () { setSearch(false); } }));
  }

  function SearchSheet(p) {
    var st = K.useStore();
    var qS = useState(''), q = qS[0], setQ = qS[1];
    var ref = useRef(null);
    useEffect(function () { if (p.open) setTimeout(function () { ref.current && ref.current.focus(); }, 60); else setQ(''); }, [p.open]);
    var res = useMemo(function () {
      var n = K.norm(q).trim(); if (n.length < 2) return [];
      var words = n.split(/\s+/);
      return window.KN_PRODUCTS.filter(function (x) { var t = K.norm(x.name + ' ' + x.cat + ' ' + x.line + ' ' + x.desc); return words.every(function (w) { return t.indexOf(w) >= 0; }); }).slice(0, 8);
    }, [q]);
    function submit(e) { e.preventDefault(); if (q.trim()) go('/loja?q=' + encodeURIComponent(q.trim())); p.onClose(); }
    var popular = ['T-shirt', 'Hoodie', 'Ténis', 'Calças', 'Boné', 'Manta'];
    return h(Sheet, { open: p.open, onClose: p.onClose, side: 'top', label: 'Pesquisa' },
      h('div', { className: 'wrap', style: { padding: '16px var(--pad) 22px' } },
        h('form', { onSubmit: submit, role: 'search', style: { display: 'flex', gap: 8, alignItems: 'center' } },
          h('div', { className: 'searchbar' }, h(Icon, { n: 'search', s: 18 }),
            h('input', { ref: ref, value: q, onChange: function (e) { setQ(e.target.value); }, placeholder: 'Pesquisar produtos, cores, materiais…', 'aria-label': 'Pesquisar', enterKeyHint: 'search' }),
            h('button', { className: 'go', type: 'submit' }, 'Pesquisar')),
          h('button', { type: 'button', className: 'iconbtn', onClick: p.onClose, 'aria-label': 'Fechar pesquisa' }, h(Icon, { n: 'x' }))),
        q.trim().length < 2
          ? h('div', { style: { marginTop: 18 } }, h('div', { className: 'eyebrow', style: { marginBottom: 10 } }, 'Pesquisas populares'),
              h('div', { className: 'chiprow' }, popular.map(function (w) { return h('button', { key: w, className: 'chip', onClick: function () { setQ(w); } }, w); })),
              st.recent.length ? h(R.Fragment, null, h('div', { className: 'eyebrow', style: { margin: '20px 0 0' } }, 'Vistos recentemente'),
                h('div', { className: 'sugg' }, st.recent.slice(0, 6).map(function (id) { var x = st.byId[id]; return x ? h('a', { key: id, href: '#/p/' + id, onClick: p.onClose, style: { display: 'grid', gap: 6, fontSize: 13 } }, h(K.ProductImage, { product: x }), x.name) : null; }))) : null)
          : res.length
            ? h('div', { className: 'sugg' }, res.map(function (x) { return h('a', { key: x.id, href: '#/p/' + x.id, onClick: p.onClose, style: { display: 'grid', gap: 6, fontSize: 13 } }, h(K.ProductImage, { product: x }), h('span', null, x.name), h('span', { className: 'price' }, eur(x.price))); }))
            : h('p', { className: 'muted', style: { marginTop: 18 } }, 'Sem resultados para “' + q + '”. Experimenta outra palavra ou ', h('a', { className: 'link', href: '#/loja', onClick: p.onClose }, 'vê todos os produtos'), '.')));
  }

  function Card(p) {
    var x = p.product, st = K.useStore();
    var cS = useState(x.colors[0] || null), col = cS[0], setCol = cS[1];
    var aS = useState(null), added = aS[0], setAdded = aS[1];
    var on = st.wish.indexOf(x.id) >= 0;
    var pct = x.was ? Math.round((1 - x.price / x.was) * 100) : 0;
    var tag = x.was ? h('span', { className: 'tag sale' }, '−' + pct + '%') : x.isNew ? h('span', { className: 'tag' }, 'Novo') : x.stock <= 10 ? h('span', { className: 'tag' }, 'Últimas unidades') : x.badge ? h('span', { className: 'tag' }, x.badge) : h('span');
    var oneSize = x.sizes.length === 1;
    var alt = x.colors.length > 1 ? x.colors.find(function (c) { return !col || c.name !== col.name; }) : null;
    var href = '#/p/' + x.id + (col ? '?c=' + encodeURIComponent(col.name) : '');
    function quick(z) { st.add(x, { color: col && col.name, size: z }); setAdded(z); setTimeout(function () { setAdded(null); }, 1400); }
    return h('article', { className: 'card' },
      h('div', { style: { position: 'relative' } },
        h('a', { href: href, 'aria-label': x.name, style: { display: 'block', position: 'relative' } },
          h(K.ProductImage, { product: x, color: col }),
          alt && !x.photo ? h('div', { className: 'pm-swap' }, h(K.ProductImage, { product: x, color: alt })) : null),
        h('div', { className: 'card-top' }, tag,
          h('button', { className: 'heart' + (on ? ' on' : ''), onClick: function () { st.toggleWish(x.id); }, 'aria-label': on ? 'Remover dos favoritos' : 'Guardar nos favoritos', 'aria-pressed': on }, h(Icon, { n: 'heart', s: 18, fill: on }))),
        h('div', { className: 'qa' },
          h('div', { className: 'qa-t' }, h('span', null, oneSize ? 'Adicionar ao carrinho' : 'Adicionar rápido'), oneSize ? null : h('span', { className: 'muted', style: { fontWeight: 400 } }, 'escolhe o tamanho')),
          h('div', { className: 'qa-s' }, x.sizes.map(function (z) { return h('button', { key: z, className: added === z ? 'added' : '', onClick: function () { quick(z); }, 'aria-label': 'Adicionar tamanho ' + z }, added === z ? '✓' : (z === 'Único' ? '+ Adicionar' : z)); }))),
        p.onQuick ? h('button', { className: 'qbtn', onClick: function () { p.onQuick(x); } }, 'Vista rápida') : null,
        h('a', { className: 'plus', href: href, 'aria-label': 'Ver ' + x.name }, h(Icon, { n: 'plus', s: 18 }))),
      h('div', null,
        h('a', { href: href, className: 'card-name' }, x.name),
        h('div', { className: 'card-sub' }, x.colors.length > 1 ? x.colors.length + ' cores' : (col ? col.name : x.cat), x.custom ? ' · Personalizável' : ''),
        h('div', { className: 'card-meta', style: { marginTop: 6 } },
          h('span', { className: 'price' }, x.was ? h(R.Fragment, null, h('span', { className: 'sale' }, eur(x.price)), h('s', null, eur(x.was))) : eur(x.price)),
          x.colors.length > 1 ? h('span', { className: 'sw' }, x.colors.slice(0, 5).map(function (c) {
            return h('i', { key: c.name, title: c.name, role: 'button', 'aria-label': 'Ver em ' + c.name, style: { background: c.hex, outline: col && col.name === c.name ? '1.5px solid var(--ink)' : 'none', outlineOffset: 2, cursor: 'pointer' }, onMouseEnter: function () { setCol(c); }, onClick: function () { setCol(c); } });
          }), x.colors.length > 5 ? h('em', null, '+' + (x.colors.length - 5)) : null) : null)));
  }

  function CartDrawer() {
    var st = K.useStore(), c = K.CFG;
    var left = Math.max(0, c.freeShip - (st.subtotal - st.discount));
    var pct = Math.min(100, (st.subtotal - st.discount) / c.freeShip * 100);
    var suggestions = useMemo(function () {
      var inCart = st.cart.map(function (l) { return l.id; });
      return window.KN_PRODUCTS.filter(function (x) { return inCart.indexOf(x.id) < 0 && x.price <= Math.max(45, left + 10) && x.sizes.length === 1; }).slice(0, 3);
    }, [st.cart.length, left]);
    function checkout() { st.setCartOpen(false); go('/checkout'); }
    return h(Sheet, { open: st.cartOpen, onClose: function () { st.setCartOpen(false); }, side: 'right', label: 'Carrinho' },
      h('div', { className: 'sheet-h' }, h('div', { className: 'h3' }, 'Carrinho', st.count ? h('span', { className: 'muted', style: { fontWeight: 400 } }, ' · ' + st.count + (st.count === 1 ? ' artigo' : ' artigos')) : null),
        h('button', { className: 'iconbtn', onClick: function () { st.setCartOpen(false); }, 'aria-label': 'Fechar carrinho' }, h(Icon, { n: 'x' }))),
      st.cart.length ? h('div', { className: 'ship-bar' },
        left > 0 ? h('span', null, 'Faltam ', h('b', null, eur(left)), ' para portes grátis') : h('span', { style: { color: 'var(--ok)', fontWeight: 600 } }, '✓ Tens portes grátis'),
        h('div', { className: 'bar' }, h('i', { style: { width: pct + '%' } }))) : null,
      h('div', { className: 'sheet-b' },
        st.cart.length === 0 ? h('div', { className: 'empty' },
          h(Icon, { n: 'bag', s: 40, w: 1.2 }), h('p', { className: 'h3', style: { margin: '14px 0 6px' } }, 'O teu carrinho está vazio'),
          h('p', { className: 'muted', style: { margin: '0 0 20px' } }, 'Explora as novidades e encontra a tua próxima peça.'),
          h('button', { className: 'btn', onClick: function () { st.setCartOpen(false); go('/loja'); } }, 'Começar a comprar')) :
        h(R.Fragment, null,
          st.cart.map(function (l, i) {
            var col = l.p.colors.find(function (c) { return c.name === l.color; });
            return h('div', { className: 'ci', key: i },
              h('a', { href: '#/p/' + l.id, onClick: function () { st.setCartOpen(false); } }, l.thumb ? h('div', { className: 'pm' }, h('img', { src: l.thumb, alt: 'O teu design', style: { objectFit: 'contain' } })) : h(K.ProductImage, { product: l.p, color: col })),
              h('div', null,
                h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 10 } },
                  h('a', { className: 'ci-n', href: '#/p/' + l.id, onClick: function () { st.setCartOpen(false); } }, l.p.name),
                  h('span', { className: 'price', style: { fontSize: 14 } }, eur(l.total))),
                h('div', { className: 'ci-v' }, [l.color, l.size && l.size !== 'Único' ? 'Tam. ' + l.size : null].filter(Boolean).join(' · '), l.note ? h('div', null, 'Personalização: “' + l.note + '”') : null),
                h('div', { className: 'ci-r' },
                  h('div', { className: 'qty' },
                    h('button', { onClick: function () { st.setQty(i, l.qty - 1); }, 'aria-label': 'Diminuir quantidade' }, h(Icon, { n: l.qty === 1 ? 'trash' : 'minus', s: 15 })),
                    h('span', { 'aria-live': 'polite' }, l.qty),
                    h('button', { onClick: function () { st.setQty(i, l.qty + 1); }, disabled: l.qty >= 10, 'aria-label': 'Aumentar quantidade' }, h(Icon, { n: 'plus', s: 15 }))),
                  h('button', { className: 'link', style: { fontSize: 13, color: 'var(--ink3)' }, onClick: function () { st.remove(i); } }, 'Remover'))));
          }),
          left > 0 && suggestions.length ? h('div', { style: { marginTop: 22 } },
            h('div', { className: 'eyebrow', style: { marginBottom: 10 } }, 'Completa a encomenda'),
            suggestions.map(function (x) { return h('div', { key: x.id, style: { display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 12, alignItems: 'center', padding: '8px 0' } },
              h(K.ProductImage, { product: x, style: { aspectRatio: '1', borderRadius: 8 } }),
              h('div', { style: { fontSize: 13 } }, h('div', { style: { fontWeight: 500 } }, x.name), h('div', { className: 'price' }, eur(x.price))),
              h('button', { className: 'btn sm ghost', onClick: function () { st.add(x, { color: x.colors[0] && x.colors[0].name, size: x.sizes[0] }); }, 'aria-label': 'Adicionar ' + x.name }, h(Icon, { n: 'plus', s: 16 }))); })) : null)),
      st.cart.length ? h('div', { className: 'sheet-f' },
        h('div', { className: 'sum-row' }, h('span', null, 'Subtotal'), h('span', { className: 'price' }, eur(st.subtotal))),
        st.discount ? h('div', { className: 'sum-row', style: { color: 'var(--ok)' } }, h('span', null, 'Desconto (' + st.promo + ')'), h('span', null, '−' + eur(st.discount))) : null,
        h('div', { className: 'sum-row' }, h('span', null, 'Envio'), h('span', null, left > 0 ? 'Calculado no checkout' : 'Grátis')),
        h('button', { className: 'btn block', style: { marginTop: 12 }, onClick: checkout }, h(Icon, { n: 'lock', s: 16 }), 'Finalizar compra · ' + eur(st.subtotal - st.discount)),
        h('div', { className: 'pay-icons' }, ['MB WAY', 'MULTIBANCO', 'VISA', 'MASTERCARD', 'APPLE PAY', 'PAYPAL'].map(function (x) { return h('span', { key: x }, x); }))) : null);
  }

  function Toast() {
    var st = K.useStore(); if (!st.toast) return null;
    return h('div', { className: 'toast', role: 'status' }, st.toast.msg, st.toast.action ? h('button', { onClick: st.toast.action.fn }, st.toast.action.label) : null);
  }

  function Footer() {
    return h('footer', { className: 'ftr' },
      h('div', { className: 'wrap' },
        h('div', { className: 'ftr-g' },
          h('div', null,
            h('div', { style: { marginBottom: 14 } }, K.Brand ? h(K.Brand) : h('a', { className: 'brand', href: '#/' }, h('img', { src: 'assets/logo-mark.png', alt: '' }), h('span', null, 'Karmic Node'))),
            h('p', { style: { margin: '0 0 6px', maxWidth: 320 } }, 'Roupa, calçado, acessórios e casa. Desenhado e acabado em Portugal.'),
            h('p', { className: 'muted', style: { margin: 0 } }, 'Cartaxo · Portugal')),
          h('div', null, h('h4', null, 'Loja'), h('ul', null, [['Novidades', '/loja?f=novo'], ['Roupa', '/loja/roupa'], ['Calçado e acessórios', '/loja/acessorios'], ['Black Friday', '/black-friday'], ['Casa', '/loja/casa'], ['Personalizar', '/personalizar']].map(function (l) { return h('li', { key: l[0] }, h('a', { href: '#' + l[1] }, l[0])); }))),
          h('div', null, h('h4', null, 'Ajuda'), h('ul', null, [['Envios e entregas', '/ajuda'], ['Devoluções grátis', '/ajuda'], ['Guia de tamanhos', '/ajuda'], ['Contactos', '/ajuda']].map(function (l) { return h('li', { key: l[0] }, h('a', { href: '#' + l[1] }, l[0])); }))),
          h('div', null, h('h4', null, 'Empresa'), h('ul', null, ['Sobre nós', 'Sustentabilidade', 'Termos e condições', 'Privacidade', 'Livro de Reclamações'].map(function (l) { return h('li', { key: l }, h('a', { href: '#/ajuda' }, l)); })))),
        h('div', { className: 'ftr-b' }, h('span', null, '© ' + new Date().getFullYear() + ' Karmic Node. Todos os direitos reservados.'),
          h('div', { className: 'pay-icons', style: { margin: 0 } }, ['MB WAY', 'MULTIBANCO', 'VISA', 'MASTERCARD', 'APPLE PAY', 'PAYPAL'].map(function (x) { return h('span', { key: x }, x); })))));
  }

  Object.assign(window.KN, { Header: Header, Sheet: Sheet, Card: Card, CartDrawer: CartDrawer, Toast: Toast, Footer: Footer, LINES: LINES });
})();
