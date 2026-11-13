// Karmic Node — Início, Listagem, Produto
(function () {
  'use strict';
  var R = React, h = R.createElement, useState = R.useState, useEffect = R.useEffect, useMemo = R.useMemo, useRef = R.useRef;
  var KN = window.KN, K = window.KN, Icon = K.Icon, eur = K.eur, go = K.go;
  var ALL = function () { return window.KN_PRODUCTS; };
  var LINE_LABEL = window.KN_LINE_LABEL;

  function Collage(p) {
    var st = K.useStore();
    return h('div', { className: 'collage n' + p.ids.length }, p.ids.map(function (id) { var x = st.byId[id]; return x ? h(K.ProductImage, { key: id, product: x }) : null; }));
  }
  KN.Collage = Collage;

  function Row(p) { return h('div', { className: 'grid' }, p.items.map(function (x) { return h(K.Card, { key: x.id, product: x }); })); }

  // carrossel horizontal com setas (estilo COS / Arket)
  function Rail(p) {
    var ref = useRef(null);
    function by(d) { var el = ref.current; if (el) el.scrollBy({ left: d * el.clientWidth * .8, behavior: 'smooth' }); }
    return h('div', { className: 'rail-wrap' },
      h('div', { className: 'rail', ref: ref }, p.items.map(function (x) { return h('div', { key: x.id, className: 'rail-item' }, h(K.Card, { product: x })); })),
      h('button', { className: 'rail-btn l', onClick: function () { by(-1); }, 'aria-label': 'Anteriores' }, h(Icon, { n: 'chevL', s: 18 })),
      h('button', { className: 'rail-btn r', onClick: function () { by(1); }, 'aria-label': 'Seguintes' }, h(Icon, { n: 'chev', s: 18 })));
  }

  // ───── Início ─────
  function Home() {
    var st = K.useStore();
    var tabS = useState('best'), tab = tabS[0], setTab = tabS[1];
    var lists = {
      best: ALL().slice().sort(function (a, b) { return b.reviews - a.reviews; }).slice(0, 8),
      novo: ALL().filter(function (x) { return x.isNew; }).concat(ALL().filter(function (x) { return !x.isNew; })).slice(0, 8),
      promo: ALL().filter(function (x) { return x.was; }).concat(ALL().filter(function (x) { return x.custom; })).slice(0, 8),
    };
    var recent = st.recent.map(function (id) { return st.byId[id]; }).filter(Boolean).slice(0, 8);
    var counts = {}; ALL().forEach(function (x) { counts[x.line] = (counts[x.line] || 0) + 1; });
    var shop = [['kn-001', 'T-shirts'], ['kn-005', 'Hoodies'], ['kn-009', 'Calças'], ['kn-006', 'Casacos'], ['kn-014', 'Ténis'], ['kn-016', 'Bonés'], ['kn-018', 'Mochilas'], ['kn-casa-002', 'Casa']];
    var shopHref = { 'kn-001': '/loja/roupa?cat=T-shirts%20e%20polos', 'kn-005': '/loja/roupa?cat=Hoodies%20e%20sweats', 'kn-009': '/loja/roupa?cat=Cal%C3%A7as', 'kn-006': '/loja/roupa?cat=Casacos', 'kn-014': '/loja/acessorios?cat=T%C3%A9nis', 'kn-016': '/loja/acessorios?cat=Bon%C3%A9s', 'kn-018': '/loja/acessorios?cat=Mochilas%20e%20sacos', 'kn-casa-002': '/loja/casa' };
    return h('main', null,
      h('section', { className: 'hero2' },
        h('div', { className: 'hero2-main' },
          h('img', { src: 'assets/campaign/vestuario.jpg', alt: '', fetchpriority: 'high' }),
          h('div', { className: 'hero2-copy' },
            h('div', { className: 'eyebrow' }, 'Outono 2026'),
            h('h1', { className: 'h1' }, 'Feito para ', h('em', null, 'durar.')),
            h('p', null, 'Algodão pesado, pele verdadeira e cortes que não passam de moda. Acabado em Portugal.'),
            h('div', { className: 'actions' }, h('a', { className: 'btn light', href: '#/loja/roupa' }, 'Comprar roupa'), h('a', { className: 'btn glass', href: '#/loja?f=novo' }, 'Ver novidades')))),
        h('div', { className: 'hero2-side' },
          h('a', { className: 'hero2-card', href: '#/personalizar' }, h('img', { src: 'assets/campaign/product-tshirt.jpg', alt: '' }), h('div', null, h('small', null, 'Novo'), h('b', null, 'Personaliza a tua peça'), h('span', null, 'Nome, iniciais ou logótipo · desde 37,99 €'))),
          h('a', { className: 'hero2-card', href: '#/loja/casa' }, h('img', { src: 'assets/campaign/casa.jpg', alt: '' }), h('div', null, h('small', null, 'Casa'), h('b', null, 'Têxteis e aromas'), h('span', null, counts.casa + ' produtos'))))),
      h('div', { className: 'usp' },
        [['truck', 'Envio em 24 h', 'Portes grátis acima de ' + eur(K.CFG.freeShip)], ['ret', 'Devoluções grátis', K.CFG.returnDays + ' dias para mudares de ideias'], ['lock', 'Pagamento seguro', 'MB WAY, Multibanco, cartão'], ['leaf', 'Feito em Portugal', 'Acabamento no Cartaxo']].map(function (u) {
          return h('div', { key: u[1] }, h(Icon, { n: u[0], s: 22 }), h('span', null, h('b', null, u[1]), u[2]));
        })),
      h('a', { href: '#/black-friday', className: 'wrap bf-strip' }, h('div', null, h('b', null, 'Black Friday'), h('span', null, 'Até −25% em peças selecionadas · sem códigos')), h(Countdown), h('span', { className: 'btn light sm' }, 'Ver ofertas')),
      h('section', { className: 'wrap sec', style: { paddingBottom: 20 } },
        h('div', { className: 'sec-h' }, h('h2', { className: 'h2' }, 'Compra por ', h('em', null, 'categoria')), h('a', { className: 'link', href: '#/loja' }, 'Toda a loja')),
        h('div', { className: 'shopcat' }, shop.map(function (c) { var pr = st.byId[c[0]]; if (!pr) return null; return h('a', { key: c[0], href: '#' + shopHref[c[0]] }, h(K.ProductImage, { product: pr }), h('span', null, c[1])); }))),
      h('section', { className: 'wrap sec' },
        h('div', { className: 'sec-h' },
          h('div', { className: 'tabs-h', role: 'tablist' }, [['best', 'Mais vendidos'], ['novo', 'Novidades'], ['promo', 'Promoções']].map(function (t) { return h('button', { key: t[0], role: 'tab', 'aria-selected': tab === t[0], className: tab === t[0] ? 'on' : '', onClick: function () { setTab(t[0]); } }, t[1]); })),
          h('a', { className: 'link', href: tab === 'promo' ? '#/loja?f=promo' : tab === 'novo' ? '#/loja?f=novo' : '#/loja?sort=pop' }, 'Ver todos')),
        h(Rail, { key: tab, items: lists[tab] })),
      h('section', { className: 'wrap' },
        h('div', { className: 'lines4' }, window.KN_LINES.map(function (l) {
          return h('a', { key: l.id, className: 'tile' + (l.prods ? ' prodtile' : ''), href: '#/loja/' + l.id }, l.prods ? h(Collage, { ids: l.prods }) : h('img', { src: l.img, alt: '', loading: 'lazy' }), h('div', null, h('span', null, h('h3', null, l.label), h('span', null, counts[l.id] + ' produtos')), h(Icon, { n: 'chev' })));
        }))),
      h('section', { className: 'sec wrap' },
        h('div', { className: 'feature' },
          h('div', { className: 'feature-img' }, h('img', { src: 'assets/campaign/product-lifestyle.jpg', alt: 'T-shirt Karmic Node personalizada', loading: 'lazy' })),
          h('div', { className: 'feature-copy' },
            h('div', { className: 'eyebrow' }, 'Personalizar'),
            h('h2', { className: 'h2', style: { margin: '10px 0 14px' } }, 'Tua desde ', h('em', null, 'o primeiro ponto.')),
            h('p', { className: 'muted', style: { margin: 0, maxWidth: 440 } }, 'Escreve um nome, desenha um monograma ou carrega o teu logótipo. Vês a peça em tempo real e partilhas o design com um link.'),
            h('ul', { className: 'ticks' }, ['Bordado ou impressão, 8 cores de linha', 'Pré-visualização real na peça', 'Prova por email antes de produzir'].map(function (x) { return h('li', { key: x }, h(Icon, { n: 'check', s: 16 }), x); })),
            h('a', { className: 'btn', href: '#/personalizar' }, 'Abrir o estúdio')))),
      h('section', { className: 'wrap', style: { paddingBottom: 56 } },
        h('div', { className: 'sec-h' }, h('h2', { className: 'h2' }, 'A nossa ', h('em', null, 'promessa'))),
        h('div', { className: 'reviews' }, [
          ['Feito para durar', 'Algodão pesado, costuras reforçadas e pele verdadeira. Se uma peça falhar por defeito em 2 anos, trocamos.'],
          ['Sem letras pequenas', '30 dias para devolver, sem perguntas e sem custos. O reembolso chega em 2 a 5 dias úteis.'],
          ['Perto de ti', 'Embalamos no Cartaxo e respondemos em menos de 24 h úteis. Por email, sem robôs.'],
        ].map(function (r) { return h('figure', { key: r[0], className: 'review', style: { margin: 0 } }, h('b', { style: { fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 500 } }, r[0]), h('p', { style: { fontFamily: 'var(--f)', fontSize: 15, lineHeight: 1.55, color: 'var(--ink2)' } }, r[1])); }))),
      recent.length ? h('section', { className: 'wrap', style: { paddingBottom: 56 } }, h('div', { className: 'sec-h' }, h('h2', { className: 'h2' }, 'Vistos ', h('em', null, 'recentemente'))), h(Rail, { items: recent })) : null,
      h('section', { className: 'wrap', style: { paddingBottom: 24 } }, h(Newsletter)));
  }

  function Newsletter() {
    var st = K.useStore(), eS = useState(''), e = eS[0], setE = eS[1], dS = useState(false), done = dS[0], setDone = dS[1], errS = useState(''), err = errS[0], setErr = errS[1];
    function sub(ev) { ev.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) { setErr(e.indexOf('@') < 0 ? 'Falta o “@” no email.' : 'Confirma o domínio do email (ex.: @gmail.com).'); return; } setErr(''); setDone(true); }
    return h('div', { className: 'news' },
      h('div', null, h('h2', { className: 'h2' }, '10% na primeira encomenda'), h('p', { className: 'muted', style: { margin: '8px 0 0' } }, 'Novidades e promoções, no máximo duas vezes por mês.')),
      done ? h('div', null, h('p', { style: { margin: 0, fontWeight: 600 } }, 'Obrigado! O teu código é ', h('span', { style: { background: '#fff', color: '#8B1E2D', padding: '4px 10px', borderRadius: 6, letterSpacing: '.06em' } }, 'WELCOME10')), h('p', { className: 'muted', style: { margin: '6px 0 0', fontSize: 13 } }, 'Aplica-o no checkout (compras acima de 30 €).')) :
      h('form', { onSubmit: sub, noValidate: true }, h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 } },
        h('input', { className: 'input', type: 'email', value: e, onChange: function (x) { setE(x.target.value); setErr(''); }, placeholder: 'O teu email', 'aria-label': 'Email', autoComplete: 'email', 'aria-invalid': !!err }),
        err ? h('span', { style: { color: 'var(--err)', fontSize: 13, paddingLeft: 16 } }, err) : null),
        h('button', { className: 'btn', type: 'submit' }, 'Subscrever')));
  }

  // ───── Listagem (filtros laterais fixos + estado no URL) ─────
  function setParams(r, patch) {
    var p = Object.assign({}, r.params, patch), q = Object.keys(p).filter(function (k) { return p[k] != null && p[k] !== '' && !(Array.isArray(p[k]) && !p[k].length); }).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(Array.isArray(p[k]) ? p[k].join(',') : p[k]); }).join('&');
    var path = '/' + r.name + (r.id ? '/' + r.id : '') + (q ? '?' + q : '');
    if (location.hash !== '#' + path) history.replaceState(null, '', '#' + path), window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  function arr(v) { return v ? v.split(',').filter(Boolean) : []; }
  var SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', 'A3', 'A2', 'A1', 'Único'];

  function FGroup(p) {
    var oS = useState(p.open !== false), open = oS[0], setOpen = oS[1];
    return h('div', { className: 'fg' },
      h('button', { className: 'fg-h', onClick: function () { setOpen(!open); }, 'aria-expanded': open }, p.title, h('span', null, p.badge ? p.badge + ' · ' : '', open ? '−' : '+')),
      open ? h('div', { className: 'fg-b' }, p.children) : null);
  }

  function Listing(p) {
    var r = p.route, line = r.id, f = r.params.f, q = r.params.q || '';
    var base = useMemo(function () {
      var L = ALL();
      if (line) L = L.filter(function (x) { return x.line === line; });
      if (f === 'novo') L = L.filter(function (x) { return x.isNew; });
      if (f === 'promo') L = L.filter(function (x) { return x.was; });
      if (q) { var w = K.norm(q).split(/\s+/); L = L.filter(function (x) { var t = K.norm(x.name + ' ' + x.cat + ' ' + x.desc + ' ' + x.line + ' ' + x.colors.map(function (c) { return c.name; }).join(' ')); return w.every(function (k) { return t.indexOf(k) >= 0; }); }); }
      return L;
    }, [line, f, q]);
    var cat = r.params.cat || null, cols = arr(r.params.cor), sizes = arr(r.params.tam), sort = r.params.sort || 'rel';
    var pmin = r.params.min ? +r.params.min : null, pmax = r.params.max ? +r.params.max : null;
    var onlyCustom = r.params.pers === '1', onlyStock = r.params.stock === '1', onlySale = r.params.desc === '1';
    var priceBounds = useMemo(function () { var ps = base.map(function (x) { return x.price; }); return [Math.floor(Math.min.apply(null, ps.concat([0])) / 5) * 5, Math.ceil(Math.max.apply(null, ps.concat([10])) / 5) * 5]; }, [base]);
    var lo = pmin != null ? pmin : priceBounds[0], hi = pmax != null ? pmax : priceBounds[1];
    var dnS = useState(false), dense = dnS[0], setDense = dnS[1];
    var shS = useState(12), shown = shS[0], setShown = shS[1];
    var fS = useState(false), fOpen = fS[0], setFOpen = fS[1];
    var qvS = useState(null), qv = qvS[0], setQv = qvS[1];
    function set(patch) { setParams(r, patch); }

    function apply(L, skip) {
      return L.filter(function (x) {
        if (skip !== 'cat' && cat && x.cat !== cat) return false;
        if (skip !== 'cor' && cols.length && !x.colors.some(function (c) { return cols.indexOf(c.name.split('/')[0]) >= 0; })) return false;
        if (skip !== 'tam' && sizes.length && !x.sizes.some(function (z) { return sizes.indexOf(z) >= 0; })) return false;
        if (skip !== 'price' && (x.price < lo || x.price > hi)) return false;
        if (onlyCustom && !x.custom) return false;
        if (onlyStock && x.stock <= 0) return false;
        if (onlySale && !x.was) return false;
        return true;
      });
    }
    var list = useMemo(function () {
      var L = apply(base.slice());
      if (sort === 'asc') L.sort(function (a, b) { return a.price - b.price; });
      if (sort === 'desc') L.sort(function (a, b) { return b.price - a.price; });
      if (sort === 'pop') L.sort(function (a, b) { return b.reviews - a.reviews; });
      if (sort === 'rate') L.sort(function (a, b) { return b.rating - a.rating; });
      if (sort === 'new') L.sort(function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0); });
      return L;
    }, [base, r.params]);
    useEffect(function () { setShown(12); }, [list.length, sort]);
    // contagens facetadas (cada faceta ignora o seu próprio filtro)
    var catCounts = useMemo(function () { var s = {}; apply(base, 'cat').forEach(function (x) { s[x.cat] = (s[x.cat] || 0) + 1; }); return s; }, [base, r.params]);
    var cats = window.KN_SUB_ORDER.filter(function (k) { return base.some(function (x) { return x.cat === k; }); });
    var sizeAll = useMemo(function () { var s = {}; base.forEach(function (x) { x.sizes.forEach(function (z) { s[z] = 1; }); }); return SIZE_ORDER.filter(function (z) { return s[z]; }).concat(Object.keys(s).filter(function (z) { return SIZE_ORDER.indexOf(z) < 0; })); }, [base]);
    var sizeAvail = useMemo(function () { var s = {}; apply(base, 'tam').forEach(function (x) { x.sizes.forEach(function (z) { s[z] = 1; }); }); return s; }, [base, r.params]);
    var colorsAll = useMemo(function () { var s = {}; base.forEach(function (x) { x.colors.forEach(function (c) { var k = c.name.split('/')[0]; if (!s[k]) s[k] = c.hex; }); }); return Object.keys(s).map(function (k) { return { name: k, hex: s[k] }; }); }, [base]);
    var active = (cat ? 1 : 0) + cols.length + sizes.length + (pmin != null || pmax != null ? 1 : 0) + (onlyCustom ? 1 : 0) + (onlyStock ? 1 : 0) + (onlySale ? 1 : 0);
    var lineInfo = line && !q ? window.KN_LINES.find(function (l) { return l.id === line; }) : null;
    var title = q ? 'Resultados para “' + q + '”' : line ? LINE_LABEL[line] : f === 'novo' ? 'Novidades' : f === 'promo' ? 'Promoções' : 'Toda a loja';
    function clear() { set({ cat: null, cor: null, tam: null, min: null, max: null, pers: null, stock: null, desc: null }); }
    function toggleIn(key, list0, v) { var n = list0.indexOf(v) >= 0 ? list0.filter(function (x) { return x !== v; }) : list0.concat([v]); var pt = {}; pt[key] = n.length ? n.join(',') : null; set(pt); }

    var filters = h(R.Fragment, null,
      cats.length > 1 ? h(FGroup, { title: 'Categoria', badge: cat ? 1 : 0 }, h('div', { className: 'flist' },
        h('label', null, h('input', { type: 'radio', name: 'fcat', checked: !cat, onChange: function () { set({ cat: null }); } }), 'Tudo', h('em', null, apply(base, 'cat').length)),
        cats.map(function (c) { var n = catCounts[c] || 0; return h('label', { key: c, className: n ? '' : 'off' }, h('input', { type: 'radio', name: 'fcat', checked: cat === c, onChange: function () { set({ cat: c }); } }), c, h('em', null, n)); }))) : null,
      sizeAll.length > 1 ? h(FGroup, { title: 'Tamanho', badge: sizes.length }, h('div', { className: 'fsizes' }, sizeAll.map(function (z) { var on = sizes.indexOf(z) >= 0; return h('button', { key: z, className: on ? 'on' : '', disabled: !on && !sizeAvail[z], 'aria-pressed': on, onClick: function () { toggleIn('tam', sizes, z); } }, z); }))) : null,
      colorsAll.length > 1 ? h(FGroup, { title: 'Cor', badge: cols.length }, h('div', { className: 'fcolors' }, colorsAll.map(function (c) { var on = cols.indexOf(c.name) >= 0; return h('button', { key: c.name, className: on ? 'on' : '', style: { background: c.hex }, title: c.name, 'aria-label': c.name, 'aria-pressed': on, onClick: function () { toggleIn('cor', cols, c.name); } }); })),
        cols.length ? h('div', { className: 'muted', style: { fontSize: 12, marginTop: 8 } }, cols.join(', ')) : null) : null,
      h(FGroup, { title: 'Preço', badge: pmin != null || pmax != null ? 1 : 0 }, h('div', { className: 'prange' },
        h('div', { className: 'dual' }, h('div', { className: 'track' }, h('i', { style: { left: ((lo - priceBounds[0]) / (priceBounds[1] - priceBounds[0] || 1) * 100) + '%', right: (100 - (hi - priceBounds[0]) / (priceBounds[1] - priceBounds[0] || 1) * 100) + '%' } })),
          h('input', { type: 'range', min: priceBounds[0], max: priceBounds[1], step: 5, value: lo, 'aria-label': 'Preço mínimo', onChange: function (e) { set({ min: Math.min(+e.target.value, hi - 5) }); } }),
          h('input', { type: 'range', min: priceBounds[0], max: priceBounds[1], step: 5, value: hi, 'aria-label': 'Preço máximo', onChange: function (e) { set({ max: Math.max(+e.target.value, lo + 5) }); } })),
        h('div', { className: 'vals' }, h('span', null, eur(lo)), h('span', null, eur(hi))))),
      h(FGroup, { title: 'Disponibilidade' },
        h('label', { className: 'toggle' }, 'Só em stock', h('input', { type: 'checkbox', checked: onlyStock, onChange: function (e) { set({ stock: e.target.checked ? '1' : null }); } })),
        h('label', { className: 'toggle' }, 'Em promoção', h('input', { type: 'checkbox', checked: onlySale, onChange: function (e) { set({ desc: e.target.checked ? '1' : null }); } })),
        h('label', { className: 'toggle' }, 'Personalizável', h('input', { type: 'checkbox', checked: onlyCustom, onChange: function (e) { set({ pers: e.target.checked ? '1' : null }); } }))),
      active ? h('button', { className: 'link clear', onClick: clear }, 'Limpar todos os filtros (' + active + ')') : null);

    var chips = [];
    if (cat) chips.push([cat, function () { set({ cat: null }); }]);
    sizes.forEach(function (z) { chips.push(['Tam. ' + z, function () { toggleIn('tam', sizes, z); }]); });
    cols.forEach(function (c) { chips.push([c, function () { toggleIn('cor', cols, c); }]); });
    if (pmin != null || pmax != null) chips.push([eur(lo) + ' – ' + eur(hi), function () { set({ min: null, max: null }); }]);
    if (onlyStock) chips.push(['Só em stock', function () { set({ stock: null }); }]);
    if (onlySale) chips.push(['Em promoção', function () { set({ desc: null }); }]);
    if (onlyCustom) chips.push(['Personalizável', function () { set({ pers: null }); }]);

    return h('main', { className: 'wrap' },
      h('nav', { className: 'crumbs', 'aria-label': 'Caminho' }, h('a', { href: '#/' }, 'Início'), h('span', null, '/'), line ? h(R.Fragment, null, h('a', { href: '#/loja' }, 'Loja'), h('span', null, '/'), h('span', { style: { color: 'var(--ink)' } }, LINE_LABEL[line])) : h('span', { style: { color: 'var(--ink)' } }, title)),
      lineInfo ? h('div', { className: 'lhero' + (lineInfo.prods ? ' lhero-p' : '') }, lineInfo.prods ? h(Collage, { ids: lineInfo.prods }) : h('img', { src: lineInfo.img, alt: '' }), h('div', null, h('h1', { className: 'h1' }, lineInfo.label), h('p', null, lineInfo.blurb))) :
        h('div', { className: 'list-h' }, h('h1', { className: 'h2' }, title)),
      !line && !q ? h('div', { className: 'subtabs' }, h('a', { href: '#/loja', className: 'chip' + (!f ? ' on' : '') }, 'Tudo'), window.KN_LINES.map(function (l) { return h('a', { key: l.id, href: '#/loja/' + l.id, className: 'chip' }, l.label); })) : null,
      line && cats.length > 1 ? h('div', { className: 'subtabs', role: 'tablist' },
        h('button', { className: !cat ? 'on' : '', onClick: function () { set({ cat: null }); } }, 'Tudo', h('span', null, base.length)),
        cats.map(function (c) { return h('button', { key: c, className: cat === c ? 'on' : '', onClick: function () { set({ cat: c }); } }, c, h('span', null, base.filter(function (x) { return x.cat === c; }).length)); })) : null,
      h('div', { className: 'toolbar' },
        h('button', { className: 'chip only-mobile-f', onClick: function () { setFOpen(true); } }, h(Icon, { n: 'filter', s: 16 }), 'Filtros', active ? h('b', null, '(' + active + ')') : null),
        h('span', { className: 'result-h' }, h('b', { style: { fontSize: 14 } }, list.length), h('span', { className: 'muted', style: { fontSize: 13 } }, list.length === 1 ? 'produto' : 'produtos')),
        chips.map(function (c) { return h('button', { key: c[0], className: 'chip', style: { height: 30, fontSize: 13, background: 'var(--soft)', boxShadow: 'none' }, onClick: c[1] }, c[0], h(Icon, { n: 'x', s: 12 })); }),
        h('span', { className: 'spacer' }),
        h('div', { className: 'density', role: 'group', 'aria-label': 'Tamanho da grelha' },
          h('button', { className: dense ? '' : 'on', onClick: function () { setDense(false); }, 'aria-label': 'Grelha grande', 'aria-pressed': !dense }, h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'currentColor' }, h('rect', { x: 1, y: 1, width: 6, height: 6, rx: 1 }), h('rect', { x: 9, y: 1, width: 6, height: 6, rx: 1 }), h('rect', { x: 1, y: 9, width: 6, height: 6, rx: 1 }), h('rect', { x: 9, y: 9, width: 6, height: 6, rx: 1 }))),
          h('button', { className: dense ? 'on' : '', onClick: function () { setDense(true); }, 'aria-label': 'Grelha compacta', 'aria-pressed': dense }, h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'currentColor' }, [1, 6, 11].map(function (x) { return [1, 6, 11].map(function (y) { return h('rect', { key: x + '-' + y, x: x, y: y, width: 4, height: 4, rx: .8 }); }); })))),
        h('label', { className: 'sr', htmlFor: 'sort' }, 'Ordenar'),
        h('select', { id: 'sort', className: 'select', value: sort, onChange: function (e) { set({ sort: e.target.value === 'rel' ? null : e.target.value }); } },
          h('option', { value: 'rel' }, 'Recomendados'), h('option', { value: 'new' }, 'Novidades'), h('option', { value: 'pop' }, 'Mais vendidos'), h('option', { value: 'asc' }, 'Preço: mais baixo'), h('option', { value: 'desc' }, 'Preço: mais alto'))),
      h('div', { className: 'lst' },
        h('aside', { className: 'fside', 'aria-label': 'Filtros' }, filters),
        h('div', null,
          list.length ? h(R.Fragment, null,
            h('div', { className: 'grid' + (dense ? ' dense' : '') }, list.slice(0, shown).map(function (x) { return h(K.Card, { key: x.id, product: x, onQuick: setQv }); })),
            h('div', { className: 'more' },
              h('span', null, 'A ver ' + Math.min(shown, list.length) + ' de ' + list.length + ' produtos'),
              h('div', { className: 'bar' }, h('i', { style: { width: Math.min(100, shown / list.length * 100) + '%' } })),
              shown < list.length ? h('button', { className: 'btn ghost', onClick: function () { setShown(shown + 12); } }, 'Ver mais produtos') : null)) :
            h('div', { className: 'empty' }, h('p', { className: 'h3' }, 'Nenhum produto com estes filtros.'), h('p', { className: 'muted' }, 'Tira um filtro ou vê toda a loja.'), h('div', { style: { display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 } }, active ? h('button', { className: 'btn ghost', onClick: clear }, 'Limpar filtros') : null, h('a', { className: 'btn', href: '#/loja' }, 'Ver toda a loja'))))),
      h(K.Sheet, { open: fOpen, onClose: function () { setFOpen(false); }, side: 'right', label: 'Filtros' },
        h('div', { className: 'sheet-h' }, h('div', { className: 'h3' }, 'Filtros'), h('button', { className: 'iconbtn', onClick: function () { setFOpen(false); }, 'aria-label': 'Fechar filtros' }, h(Icon, { n: 'x' }))),
        h('div', { className: 'sheet-b fside', style: { position: 'static', maxHeight: 'none', display: 'block' } }, filters),
        h('div', { className: 'sheet-f', style: { display: 'flex', gap: 10 } }, h('button', { className: 'btn ghost', onClick: clear }, 'Limpar'), h('button', { className: 'btn', style: { flex: 1 }, onClick: function () { setFOpen(false); } }, 'Ver ' + list.length + ' produtos'))),
      qv ? h(QuickView, { product: qv, onClose: function () { setQv(null); } }) : null);
  }

  function QuickView(p) {
    var st = K.useStore(), x = p.product;
    var cS = useState(x.colors[0] || null), col = cS[0], setCol = cS[1];
    var sS = useState(x.sizes.length === 1 ? x.sizes[0] : null), size = sS[0], setSize = sS[1];
    var eS = useState(false), err = eS[0], setErr = eS[1];
    useEffect(function () { var k = function (e) { if (e.key === 'Escape') p.onClose(); }; window.addEventListener('keydown', k); document.body.style.overflow = 'hidden'; return function () { window.removeEventListener('keydown', k); document.body.style.overflow = ''; }; }, []);
    return h('div', { className: 'qv', role: 'dialog', 'aria-modal': true, 'aria-label': 'Vista rápida: ' + x.name },
      h('div', { className: 'qv-bg', onClick: p.onClose }),
      h('div', { className: 'qv-box' },
        h('button', { className: 'iconbtn qv-x', onClick: p.onClose, 'aria-label': 'Fechar' }, h(Icon, { n: 'x' })),
        h(K.ProductImage, { product: x, color: col }),
        h('div', { className: 'qv-info' },
          h('div', null, h('div', { className: 'eyebrow' }, x.cat), h('h2', { className: 'h2', style: { marginTop: 6 } }, x.name), h('div', { style: { display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 } }, h('span', { className: 'price', style: { fontSize: 18 } }, eur(x.price)))),
          x.colors.length ? h('div', null, h('div', { className: 'opt-h' }, h('span', null, 'Cor: ', h('b', null, col ? col.name : ''))), h('div', { className: 'colors' }, x.colors.map(function (c) { return h('button', { key: c.name, className: col && c.name === col.name ? 'on' : '', style: { background: c.hex }, 'aria-label': c.name, onClick: function () { setCol(c); } }); }))) : null,
          x.sizes.length > 1 ? h('div', null, h('div', { className: 'opt-h' }, h('span', null, 'Tamanho')), h('div', { className: 'sizes' }, x.sizes.map(function (z) { return h('button', { key: z, className: size === z ? 'on' : '', onClick: function () { setSize(z); setErr(false); } }, z); })), err ? h('div', { className: 'err-txt' }, 'Escolhe um tamanho.') : null) : null,
          h('button', { className: 'btn block', onClick: function () { if (!size) { setErr(true); return; } st.add(x, { color: col && col.name, size: size }); p.onClose(); } }, 'Adicionar ao carrinho · ' + eur(x.price)),
          h('a', { className: 'link', href: '#/p/' + x.id, onClick: p.onClose, style: { fontSize: 14 } }, 'Ver todos os detalhes'))));
  }

  var FIT = { 'T-shirts e polos': [50, 'Corte regular'], 'Hoodies e sweats': [58, 'Ligeiramente largo'], Camisas: [55, 'Ligeiramente largo'], Casacos: [60, 'Espaço para camadas'], Calças: [45, 'Ligeiramente justo'], 'Vestidos e saias': [50, 'Fiel ao tamanho'], Desporto: [44, 'Ajustado'], Ténis: [42, 'Pequeno: escolhe +½'] };

  function seeded(n) { var s = 0; for (var i = 0; i < n.length; i++) s = (s * 31 + n.charCodeAt(i)) >>> 0; return function () { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; }; }
  // Avaliações reais: sem dados inventados. Guardadas neste dispositivo até ligarmos o Supabase.
  function loadRv(id) { try { return JSON.parse(localStorage.getItem('kn5-rv-' + id)) || []; } catch (e) { return []; } }
  function Reviews(p) {
    var x = p.product;
    var lS = useState(function () { return loadRv(x.id); }), list = lS[0], setList = lS[1];
    var oS = useState(false), open = oS[0], setOpen = oS[1];
    var fS = useState({ stars: 5, title: '', text: '', name: '', fit: 'Fiel ao tamanho' }), f = fS[0], setF = fS[1];
    var eS = useState(''), err = eS[0], setErr = eS[1];
    useEffect(function () { setList(loadRv(x.id)); setOpen(false); }, [x.id]);
    function set(k, v) { setF(function (o) { var n = Object.assign({}, o); n[k] = v; return n; }); }
    function submit(ev) {
      ev.preventDefault();
      if (f.text.trim().length < 10) { setErr('Escreve pelo menos uma frase (10 caracteres).'); return; }
      if (!f.name.trim()) { setErr('Diz-nos o teu nome.'); return; }
      var r = Object.assign({}, f, { at: Date.now() }), n = [r].concat(list);
      try { localStorage.setItem('kn5-rv-' + x.id, JSON.stringify(n)); } catch (e2) {}
      setList(n); setOpen(false); setErr(''); setF({ stars: 5, title: '', text: '', name: '', fit: 'Fiel ao tamanho' });
    }
    var avg = list.length ? list.reduce(function (s, r) { return s + r.stars; }, 0) / list.length : 0;
    var form = h('form', { className: 'rv-form', onSubmit: submit, noValidate: true },
      h('div', { className: 'rv-stars-in', role: 'radiogroup', 'aria-label': 'Classificação' }, [1, 2, 3, 4, 5].map(function (n) { return h('button', { key: n, type: 'button', role: 'radio', 'aria-checked': f.stars === n, 'aria-label': n + ' estrelas', className: n <= f.stars ? 'on' : '', onClick: function () { set('stars', n); } }, '★'); })),
      h('input', { className: 'st-in', placeholder: 'Título (opcional)', value: f.title, onChange: function (e) { set('title', e.target.value); }, maxLength: 60 }),
      h('textarea', { className: 'st-in', style: { height: 110, padding: 12, resize: 'vertical' }, placeholder: 'O que achaste da peça? Tecido, corte, entrega…', value: f.text, onChange: function (e) { set('text', e.target.value); }, maxLength: 600 }),
      h('div', { style: { display: 'grid', gridTemplateColumns: x.sizes.length > 1 ? '1fr 1fr' : '1fr', gap: 10 } },
        h('input', { className: 'st-in', placeholder: 'O teu nome', value: f.name, onChange: function (e) { set('name', e.target.value); }, maxLength: 40 }),
        x.sizes.length > 1 ? h('select', { className: 'st-in', value: f.fit, onChange: function (e) { set('fit', e.target.value); } }, ['Veste pequeno', 'Fiel ao tamanho', 'Veste largo'].map(function (o) { return h('option', { key: o }, o); })) : null),
      err ? h('div', { className: 'err-txt' }, err) : null,
      h('div', { style: { display: 'flex', gap: 10 } }, h('button', { className: 'btn', type: 'submit' }, 'Publicar avaliação'), h('button', { className: 'btn ghost', type: 'button', onClick: function () { setOpen(false); setErr(''); } }, 'Cancelar')));
    return h('section', { id: 'reviews', className: 'sec', style: { paddingTop: 20, paddingBottom: 30, borderTop: '1px solid var(--line)' } },
      h('div', { className: 'sec-h' }, h('h2', { className: 'h2' }, 'Avaliações', list.length ? h('span', { className: 'muted', style: { fontFamily: 'var(--f)', fontSize: 15, marginLeft: 10 } }, '(' + list.length + ')') : null),
        !open ? h('button', { className: 'btn ghost sm', onClick: function () { setOpen(true); } }, 'Escrever avaliação') : null),
      open ? form : null,
      !list.length && !open ? h('div', { className: 'rv-empty' }, h('p', { className: 'h3', style: { margin: 0, fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 500 } }, 'Ainda sem avaliações.'), h('p', { className: 'muted', style: { margin: '6px 0 0' } }, 'Compraste esta peça? Conta a quem vem a seguir como é o tecido e o corte.')) : null,
      list.length ? h(R.Fragment, null,
        h('div', { className: 'rv-sum', style: { gridTemplateColumns: 'auto 1fr' } }, h('div', null, h('div', { className: 'rv-big' }, avg.toFixed(1)), h(K.Stars, { v: avg })), h('div', { className: 'muted', style: { fontSize: 14 } }, list.length + (list.length === 1 ? ' avaliação' : ' avaliações') + ' de clientes')),
        h('div', { className: 'rv-list' }, list.map(function (r, i) {
          return h('article', { key: i, className: 'rv' }, h(K.Stars, { v: r.stars }), r.title ? h('h4', null, r.title) : null, h('p', null, r.text),
            h('small', null, r.name + ' · ' + new Date(r.at).toLocaleDateString('pt-PT')), x.sizes.length > 1 ? h('span', { className: 'fitnote' }, r.fit) : null);
        }))) : null);
  }
  KN.loadRv = loadRv;

  // ───── Produto ─────
  function Product(p) {
    var st = K.useStore(), x = st.byId[p.route.id];
    var initColor = x && (x.colors.find(function (c) { return c.name === p.route.params.c; }) || x.colors[0]);
    var cS = useState(initColor || null), col = cS[0], setCol = cS[1];
    var sS = useState(x && x.sizes.length === 1 ? x.sizes[0] : null), size = sS[0], setSize = sS[1];
    var eS = useState(false), sizeErr = eS[0], setSizeErr = eS[1];
    var nS = useState(''), note = nS[0], setNote = nS[1];
    var gS = useState(false), guide = gS[0], setGuide = gS[1];
    var sizesRef = useRef(null), buyRef = useRef(null);
    var nfS = useState(null), notifySize = nfS[0], setNotifySize = nfS[1];
    var neS = useState(''), nEmail = neS[0], setNEmail = neS[1];
    var ndS = useState(false), nDone = ndS[0], setNDone = ndS[1];
    var tbS = useState(false), topBar = tbS[0], setTopBar = tbS[1];
    var lkS = useState({}), lookOff = lkS[0], setLookOff = lkS[1];
    useEffect(function () {
      if (!buyRef.current || !('IntersectionObserver' in window)) return;
      var io = new IntersectionObserver(function (e) { setTopBar(!e[0].isIntersecting && e[0].boundingClientRect.top < 0); }, { threshold: 0 });
      io.observe(buyRef.current); return function () { io.disconnect(); };
    }, [p.route.id]);
    useEffect(function () { if (x) { st.viewed(x.id); setCol(initColor || null); setSize(x.sizes.length === 1 ? x.sizes[0] : null); setNote(''); setSizeErr(false); setNotifySize(null); setNDone(false); setLookOff({}); } }, [p.route.id]);
    if (!x) return h('main', { className: 'wrap empty' }, h('p', { className: 'h3' }, 'Produto não encontrado.'), h('a', { className: 'btn', href: '#/loja' }, 'Voltar à loja'));
    var on = st.wish.indexOf(x.id) >= 0;
    // tamanhos esgotados determinísticos (simulação de stock por tamanho)
    var outSizes = x.stock < 20 && x.sizes.length > 3 ? [x.sizes[0]] : [];
    function addIt() {
      if (!size) { setSizeErr(true); if (sizesRef.current) { sizesRef.current.classList.remove('shake'); void sizesRef.current.offsetWidth; sizesRef.current.classList.add('shake'); sizesRef.current.scrollIntoView ? null : null; } return; }
      st.add(x, { color: col && col.name, size: size, note: note.trim() });
    }
    var pairs = { 'T-shirts e polos': ['Calças', 'Ténis'], 'Hoodies e sweats': ['Calças', 'Bonés'], Camisas: ['Calças', 'Ténis'], Casacos: ['Hoodies e sweats', 'Calças'], Calças: ['T-shirts e polos', 'Ténis'], 'Vestidos e saias': ['Ténis', 'Mochilas e sacos'], Desporto: ['Ténis', 'Bonés'], Ténis: ['Calças', 'Bonés'] };
    var look = (pairs[x.cat] || []).map(function (c) { return ALL().filter(function (y) { return y.cat === c && y.id !== x.id; }).sort(function (a, b) { return b.reviews - a.reviews; })[0]; }).filter(Boolean);
    var related = ALL().filter(function (y) { return y.id !== x.id && (y.cat === x.cat || y.line === x.line); }).slice(0, 4);
    var left = K.cutoffLeft();
    return h('main', { className: 'wrap' },
      h('nav', { className: 'crumbs', 'aria-label': 'Caminho' }, h('a', { href: '#/' }, 'Início'), h('span', null, '/'), h('a', { href: '#/loja/' + x.line }, LINE_LABEL[x.line]), h('span', null, '/'), h('span', { style: { color: 'var(--ink)' } }, x.name)),
      h('div', { className: 'pdp' },
        h('div', { className: 'gal' },
          h(K.ProductImage, { product: x, color: col }),
          x.photo ? h(K.ProductImage, { product: x, color: col, flat: true }) : (x.colors[1] ? h(K.ProductImage, { product: x, color: x.colors[1] }) : null),
          h('div', { className: 'pm' }, h('img', { src: x.line === 'casa' ? 'assets/campaign/product-detail.jpg' : 'assets/campaign/product-detail.jpg', alt: 'Detalhe do tecido', loading: 'lazy' }))),
        h('div', { className: 'buy' },
          h('div', null,
            x.badge ? h('div', { className: 'eyebrow', style: { marginBottom: 8 } }, x.badge) : null,
            h('h1', { className: 'h2' }, x.name),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 } },
              h('span', { className: 'price buy-price' }, x.was ? h(R.Fragment, null, h('span', { className: 'sale' }, eur(x.price)), h('s', null, eur(x.was))) : eur(x.price)),
              h('a', { href: '#reviews', className: 'link', style: { fontSize: 13, color: 'var(--ink3)' }, onClick: function (e) { e.preventDefault(); var el = document.getElementById('reviews'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }); } }, (function () { var rv = loadRv(x.id); return rv.length ? h(K.Stars, { v: rv.reduce(function (s, r) { return s + r.stars; }, 0) / rv.length, n: rv.length }) : 'Escrever avaliação'; })())),
            h('div', { className: 'muted', style: { fontSize: 13, marginTop: 4 } }, 'IVA incluído. Ou 3 × ' + eur(x.price / 3) + ' sem juros com Klarna.')),
          x.colors.length ? h('div', null,
            h('div', { className: 'opt-h' }, h('span', null, 'Cor: ', h('b', null, col ? col.name : '—'))),
            h('div', { className: 'colors', role: 'radiogroup', 'aria-label': 'Cor' }, x.colors.map(function (c) { var o = col && c.name === col.name; return h('button', { key: c.name, role: 'radio', 'aria-checked': o, 'aria-label': c.name, title: c.name, className: o ? 'on' : '', style: { background: c.hex }, onClick: function () { setCol(c); } }); }))) : null,
          x.sizes.length > 1 ? h('div', null,
            h('div', { className: 'opt-h' }, h('span', null, 'Tamanho', size ? h(R.Fragment, null, ': ', h('b', null, size)) : null), h('button', { className: 'link', style: { fontSize: 13 }, onClick: function () { setGuide(true); } }, h('span', { style: { display: 'inline-flex', gap: 6, alignItems: 'center' } }, h(Icon, { n: 'ruler', s: 14 }), 'Guia de tamanhos'))),
            h('div', { className: 'sizes', ref: sizesRef, role: 'radiogroup', 'aria-label': 'Tamanho' }, x.sizes.map(function (z) {
              var out = outSizes.indexOf(z) >= 0;
              return h('button', { key: z, role: 'radio', 'aria-checked': size === z, className: (size === z ? 'on' : '') + (out ? ' out' : ''), title: out ? 'Esgotado — avisa-me' : z, 'aria-label': out ? z + ', esgotado' : z, onClick: function () { if (out) { setNotifySize(z); setNDone(false); return; } setSize(z); setSizeErr(false); setNotifySize(null); } }, z);
            })),
            sizeErr ? h('div', { className: 'err-txt', role: 'alert' }, 'Escolhe um tamanho para continuar.') : null,
            notifySize ? (nDone ? h('div', { style: { fontSize: 13, color: 'var(--ok)', marginTop: 10, fontWeight: 500 } }, '✓ Avisamos-te por email quando o ' + notifySize + ' voltar.') :
              h('form', { onSubmit: function (e) { e.preventDefault(); if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(nEmail)) setNDone(true); }, style: { marginTop: 10 } },
                h('div', { style: { fontSize: 13, marginBottom: 6 } }, 'O tamanho ', h('b', null, notifySize), ' está esgotado. Queres ser avisado?'),
                h('div', { className: 'notify' }, h('input', { className: 'input', style: { height: 42 }, type: 'email', value: nEmail, onChange: function (e) { setNEmail(e.target.value); }, placeholder: 'O teu email', 'aria-label': 'Email para aviso' }), h('button', { className: 'btn sm', type: 'submit', style: { height: 42 } }, 'Avisar-me')))) :
            outSizes.length ? h('div', { className: 'muted', style: { fontSize: 12, marginTop: 6 } }, 'Tamanho ' + outSizes[0] + ' esgotado · toca para ser avisado quando voltar.') : null,
            FIT[x.cat] ? h('div', { className: 'fit', style: { marginTop: 14 } },
              h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 13 } }, h('b', null, 'Como veste'), h('span', { className: 'muted' }, FIT[x.cat][1])),
              h('div', { className: 'fit-scale' }, h('i', { style: { left: FIT[x.cat][0] + '%' } })),
              h('div', { className: 'fit-lbl' }, h('span', null, 'Pequeno'), h('span', null, 'Fiel ao tamanho'), h('span', null, 'Grande'))) : null) : null,
          x.custom ? h('div', null,
            h('div', { className: 'opt-h' }, h('span', null, 'Personalização ', h('span', { className: 'muted' }, '(opcional, grátis)')), h('span', { className: 'muted', style: { fontSize: 12 } }, note.length + '/20')),
            h('input', { className: 'input', style: { borderRadius: 'var(--r-sm)', width: '100%' }, value: note, maxLength: 20, onChange: function (e) { setNote(e.target.value); }, placeholder: 'Nome ou iniciais bordados', 'aria-label': 'Texto a bordar' }),
            h('div', { className: 'muted', style: { fontSize: 12, marginTop: 6 } }, 'Bordado no peito, à mão. Mais opções em ', h('a', { className: 'link', href: '#/personalizar?p=' + x.id }, 'Personalizar'), '.')) : null,
          x.stock <= 10 ? h('div', { className: 'stock-low' }, 'Só restam ' + x.stock + ' unidades') : null,
          h('div', { ref: buyRef, style: { display: 'flex', gap: 10 } },
            h('button', { className: 'btn', style: { flex: 1, height: 54 }, onClick: addIt }, 'Adicionar ao carrinho · ' + eur(x.price)),
            h('button', { className: 'btn ghost', style: { width: 54, height: 54, padding: 0, color: on ? 'var(--sale)' : undefined }, onClick: function () { st.toggleWish(x.id); }, 'aria-label': on ? 'Remover dos favoritos' : 'Guardar nos favoritos', 'aria-pressed': on }, h(Icon, { n: 'heart', fill: on }))),
          h('div', { className: 'deliv' },
            h('div', null, h(Icon, { n: 'truck', s: 18 }), h('span', null, 'Recebe entre ', h('b', null, K.deliveryWindow('std')), left ? h('span', { className: 'muted' }, ' · encomenda em ' + left) : null)),
            h('div', null, h(Icon, { n: 'clock', s: 18 }), h('span', null, 'Expresso: ', h('b', null, K.deliveryWindow('exp')), ' por ' + eur(K.CFG.shipExp))),
            h('div', null, h(Icon, { n: 'ret', s: 18 }), h('span', null, 'Devolução grátis em ' + K.CFG.returnDays + ' dias'))),
          h('div', { className: 'acc' },
            h('details', { open: true }, h('summary', null, 'Descrição'), h('div', { className: 'acc-b' }, x.desc)),
            h('details', null, h('summary', null, 'Detalhes e cuidados'), h('div', { className: 'acc-b' }, h('table', { className: 'specs' }, h('tbody', null, x.specs.map(function (s) { return h('tr', { key: s[0] }, h('td', null, s[0]), h('td', null, s[1])); }))))),
            h('details', null, h('summary', null, 'Envios e devoluções'), h('div', { className: 'acc-b' }, 'Envio standard ' + eur(K.CFG.shipStd) + ' (grátis acima de ' + eur(K.CFG.freeShip) + '), expresso ' + eur(K.CFG.shipExp) + ', recolha grátis no Cartaxo. Devoluções grátis em ' + K.CFG.returnDays + ' dias. Peças personalizadas só são trocadas em caso de defeito.'))))),
      look.length ? h('section', { className: 'sec', style: { paddingTop: 10, paddingBottom: 30 } },
        h('div', { className: 'split', style: { alignItems: 'start' } },
          h('div', null, h('div', { className: 'eyebrow' }, 'Completa o look'), h('h2', { className: 'h2', style: { margin: '8px 0 6px' } }, 'Compra o conjunto'), h('p', { className: 'muted', style: { margin: 0 } }, 'Peças que combinam com ' + x.name + '. Escolhe o tamanho de cada uma no carrinho.')),
          h('div', null,
            h('div', { className: 'look' }, [x].concat(look).map(function (y, i) {
              var off = lookOff[y.id];
              return h('label', { key: y.id, className: off ? '' : 'on' },
                h('input', { type: 'checkbox', checked: !off, disabled: i === 0, onChange: function () { var n = Object.assign({}, lookOff); n[y.id] = !off; setLookOff(n); } }),
                h(K.ProductImage, { product: y, color: i === 0 ? col : null }),
                h('span', { style: { fontSize: 14 } }, h('b', { style: { fontWeight: 500 } }, i === 0 ? 'Este artigo: ' : ''), y.name),
                h('span', { className: 'price', style: { fontSize: 14 } }, eur(y.price)));
            })),
            h('button', { className: 'btn block', style: { marginTop: 12 }, onClick: function () {
              if (!size) { setSizeErr(true); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
              look.forEach(function (y) { if (!lookOff[y.id]) st.add(y, { color: y.colors[0] && y.colors[0].name, size: y.sizes.length === 1 ? y.sizes[0] : y.sizes[Math.min(2, y.sizes.length - 1)] }); });
              st.add(x, { color: col && col.name, size: size, note: note.trim() });
            } }, 'Adicionar ' + (1 + look.filter(function (y) { return !lookOff[y.id]; }).length) + ' artigos · ' + eur(x.price + look.reduce(function (s, y) { return s + (lookOff[y.id] ? 0 : y.price); }, 0)))))) : null,
      h(Reviews, { product: x }),
      h('section', { className: 'sec', style: { paddingTop: 20 } }, h('div', { className: 'sec-h' }, h('h2', { className: 'h2' }, 'Também vais gostar')), h(Row, { items: related })),
      h('div', { className: 'bar-top' + (topBar ? ' show' : ''), 'aria-hidden': !topBar },
        h('div', { className: 'wrap' }, h(K.ProductImage, { product: x, color: col }),
          h('div', { style: { flex: 1, minWidth: 0 } }, h('div', { style: { fontWeight: 600, fontSize: 15 } }, x.name), h('div', { className: 'muted', style: { fontSize: 13 } }, [col && col.name, size ? 'Tam. ' + size : null].filter(Boolean).join(' · '))),
          h('span', { className: 'price', style: { fontSize: 17 } }, eur(x.price)),
          h('button', { className: 'btn', tabIndex: topBar ? 0 : -1, onClick: function () { if (!size) { window.scrollTo({ top: 0, behavior: 'smooth' }); setSizeErr(true); return; } addIt(); } }, size ? 'Adicionar ao carrinho' : 'Escolher tamanho'))),
      h('div', { className: 'sticky-buy' },
        h('div', { style: { minWidth: 0 } }, h('div', { style: { fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, x.name), h('div', { className: 'price' }, eur(x.price))),
        h('button', { className: 'btn', onClick: addIt }, size ? 'Adicionar' : 'Escolher tamanho')),
      h(K.Sheet, { open: guide, onClose: function () { setGuide(false); }, side: 'right', label: 'Guia de tamanhos' },
        h('div', { className: 'sheet-h' }, h('div', { className: 'h3' }, 'Guia de tamanhos'), h('button', { className: 'iconbtn', onClick: function () { setGuide(false); }, 'aria-label': 'Fechar' }, h(Icon, { n: 'x' }))),
        h('div', { className: 'sheet-b' },
          h('p', { className: 'muted', style: { marginTop: 0 } }, 'Medidas do corpo em centímetros. Se estiveres entre dois tamanhos, escolhe o maior para um corte mais solto.'),
          h('table', { className: 'specs' }, h('tbody', null,
            h('tr', null, h('td', null, h('b', null, 'Tam.')), h('td', null, h('b', null, 'Peito')), h('td', null, h('b', null, 'Cintura'))),
            [['XS', '82–86', '66–70'], ['S', '87–92', '71–76'], ['M', '93–98', '77–82'], ['L', '99–104', '83–88'], ['XL', '105–112', '89–96'], ['XXL', '113–120', '97–104']].map(function (r) { return h('tr', { key: r[0] }, h('td', null, r[0]), h('td', null, r[1]), h('td', null, r[2])); }))),
          h('p', { style: { fontSize: 14, marginTop: 18 } }, h('b', null, 'Como medir: '), 'peito na zona mais larga, cintura na zona mais estreita, fita justa mas sem apertar.'))));
  }

  // ───── Black Friday ─────
  var BF_END = (function () { var d = new Date(new Date().getFullYear(), 10, 30, 23, 59, 59); if (d < new Date()) d = new Date(new Date().getFullYear() + 1, 10, 30, 23, 59, 59); return d; })();
  function Countdown() {
    var tS = useState(Date.now()), now = tS[0], setNow = tS[1];
    useEffect(function () { var i = setInterval(function () { setNow(Date.now()); }, 1000); return function () { clearInterval(i); }; }, []);
    var ms = Math.max(0, BF_END - now), d = Math.floor(ms / 864e5), hh = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3);
    return h('div', { className: 'cd', 'aria-label': 'Termina em ' + d + ' dias' }, [[d, 'dias'], [hh, 'horas'], [m, 'min'], [s, 'seg']].map(function (u) { return h('div', { key: u[1] }, h('b', null, String(u[0]).padStart(2, '0')), h('span', null, u[1])); }));
  }
  function BlackFriday() {
    var st = K.useStore();
    var sale = ALL().filter(function (x) { return x.was; }).sort(function (a, b) { return (1 - b.price / b.was) - (1 - a.price / a.was); });
    var tS = useState('all'), tab = tS[0], setTab = tS[1];
    var lines = window.KN_LINES.filter(function (l) { return sale.some(function (x) { return x.line === l.id; }); });
    var shown = tab === 'all' ? sale : sale.filter(function (x) { return x.line === tab; });
    var max = sale.reduce(function (m, x) { return Math.max(m, Math.round((1 - x.price / x.was) * 100)); }, 0);
    return h('main', null,
      h('section', { className: 'bf-hero' },
        h('div', { className: 'wrap bf-in' },
          h('div', null,
            h('div', { className: 'eyebrow', style: { color: 'rgba(255,255,255,.7)' } }, 'Até 30 de novembro'),
            h('h1', { className: 'h1' }, 'Black ', h('em', null, 'Friday')),
            h('p', null, 'Até −' + max + '% em ' + sale.length + ' peças. Sem códigos: o desconto já está no preço. E mais 10% acima de 80 € com ', h('b', null, 'KARMIC15'), '.')),
          h(Countdown))),
      h('section', { className: 'wrap', style: { paddingTop: 28, paddingBottom: 40 } },
        h('div', { className: 'subtabs', role: 'tablist' },
          h('button', { className: tab === 'all' ? 'on' : '', onClick: function () { setTab('all'); } }, 'Tudo', h('span', null, sale.length)),
          lines.map(function (l) { return h('button', { key: l.id, className: tab === l.id ? 'on' : '', onClick: function () { setTab(l.id); } }, l.label, h('span', null, sale.filter(function (x) { return x.line === l.id; }).length)); })),
        h('div', { className: 'grid', style: { marginTop: 22 } }, shown.map(function (x) { return h(K.Card, { key: x.id, product: x }); })),
        h('div', { className: 'bf-terms' }, 'Preços riscados = preço mais baixo praticado nos 30 dias anteriores, conforme a lei portuguesa. Stock limitado. Devoluções grátis em 30 dias também na Black Friday.')));
  }

  Object.assign(window.KN, { Home: Home, Listing: Listing, Product: Product, BlackFriday: BlackFriday, Countdown: Countdown });
})();
