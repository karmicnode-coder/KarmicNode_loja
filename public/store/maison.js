// Karmic Node — "Maison": pele editorial (base: template Apex GT-1) sobre a loja e o estúdio existentes.
(function () {
  'use strict';
  var R = React, h = R.createElement, useState = R.useState, useEffect = R.useEffect, useRef = R.useRef, useMemo = R.useMemo;
  var K = window.KN, E = K.StudioEngine, Icon = K.Icon, eur = K.eur;
  var ALL = function () { return window.KN_PRODUCTS; };
  function byId(id) { return ALL().find(function (p) { return p.id === id; }); }
  function colorOf(p, name) { return p.colors.find(function (c) { return c.name === name; }) || p.colors[0]; }
  function zone(mock, id) { var z = (E.PRESETS[mock] || E.PRESETS.tshirt).front; return z.find(function (q) { return q[0] === id; }) || z[0]; }
  var seq = 0;
  function mk(base, mock) { var z = zone(mock, base.zone); return Object.assign({ id: 'mx' + (seq++), r: 0, spacing: 0, curve: 0 }, base, { x: z[2], y: z[3] + (base.dy || 0), s: base.s || z[4] }); }

  // ───── peça desenhada com o motor do estúdio ─────
  var fontsP = null;
  function whenFonts() {
    if (!fontsP) fontsP = (document.fonts && document.fonts.load) ? Promise.all(E.FONTS.map(function (f) { return document.fonts.load(f.w + ' 60px ' + f.css); })).catch(function () {}) : Promise.resolve();
    return fontsP;
  }
  function Garment(p) {
    var ref = useRef(null), mS = useState(null), mock = mS[0], setMock = mS[1], tS = useState(0), tick = tS[0], setTick = tS[1];
    var prod = byId(p.pid), col = colorOf(prod, p.color);
    var layers = useMemo(function () { return p.layers.map(function (b) { return mk(b, prod.mock); }); }, [prod.id]);
    useEffect(function () {
      var alive = true;
      Promise.all([K.tinted(prod.mock, col.hex), whenFonts()]).then(function (r) { var i = new Image(); i.onload = function () { if (alive) setMock(i); }; i.src = r[0]; });
      return function () { alive = false; };
    }, [prod.id, col.hex]);
    useEffect(function () {
      var cv = ref.current; if (!cv || !mock) return;
      function draw() {
        var W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
        var d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(W * d); cv.height = Math.round(H * d);
        var x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0);
        E.render(x, W, H, { mock: mock, view: 'front', layers: layers, tech: p.tech || 'emb', light: K.lum(col.hex) > .6, redraw: function () { setTick(function (n) { return n + 1; }); } });
      }
      draw(); var ro = new ResizeObserver(draw); ro.observe(cv); return function () { ro.disconnect(); };
    }, [mock, layers, tick]);
    return h('canvas', { ref: ref, className: p.className, role: 'img', 'aria-label': prod.name + ' em ' + col.name + ', personalizada' });
  }

  // ───── marca ─────
  function Brand() {
    return h('a', { className: 'mx-brand', href: '#/', 'aria-label': 'Karmic Node — início' },
      h('span', { className: 'mx-mark' }, h('img', { src: 'assets/logo-mark.png', alt: '' })),
      h('span', { className: 'mx-brand-t' }, h('b', null, 'Karmic Node'), h('small', null, 'Feito em Portugal')));
  }

  // ───── navegação v4 ─────
  // Topo mínimo (Menu · marca · ações). O menu completo vive na gaveta lateral, em todos os ecrãs.
  var MENU = [
    { id: 'home', label: 'Início', href: '#/' },
    { id: 'roupa', label: 'Roupa', href: '#/loja/roupa', sub: true },
    { id: 'acessorios', label: 'Acessórios', href: '#/loja/acessorios', sub: true },
    { id: 'pers', label: 'Personalizar', href: '#/personalizar', star: true },
    { id: 'bf', label: 'Black Friday', href: '#/black-friday', hot: true },
  ];
  function cats(line) { var m = {}; ALL().forEach(function (x) { if (x.line === line) m[x.cat] = (m[x.cat] || 0) + 1; }); return window.KN_SUB_ORDER.filter(function (c) { return m[c]; }).map(function (c) { return [c, m[c]]; }); }
  function countOf(line) { return ALL().filter(function (x) { return x.line === line; }).length; }
  function activeOf(r, st) {
    if (r.name === 'home') return 'home';
    if (r.name === 'black-friday') return 'bf';
    if (r.name === 'personalizar') return 'pers';
    if (r.name === 'loja') return r.id || 'loja';
    if (r.name === 'p' && st.byId[r.id]) return st.byId[r.id].line;
    return '';
  }
  function Nav(p) {
    var st = K.useStore(), r = p.route;
    var sS = useState(false), sc = sS[0], setSc = sS[1];
    useEffect(function () { var f = function () { setSc(window.scrollY > 24); }; f(); window.addEventListener('scroll', f, { passive: true }); return function () { window.removeEventListener('scroll', f); }; }, []);
    var a = activeOf(r, st), solid = sc || r.name !== 'home';
    return h('header', { className: 'mx-nav mx-nav4' + (solid ? ' solid' : '') },
      h('div', { className: 'mx-container mx-nav-row' },
        h('div', { className: 'mx-nav-l' },
          h('button', { className: 'mx-menubtn', onClick: p.onMenu, 'aria-label': 'Abrir menu', 'aria-haspopup': 'dialog' }, h('span', { className: 'bars' }, h('i'), h('i')), h('span', { className: 't' }, 'Menu')),
),
        h(Brand),
        h('div', { className: 'mx-actions' },
          h('button', { className: 'mx-icon mx-sbtn', onClick: p.onSearch, 'aria-label': 'Pesquisar (Ctrl+K)', title: 'Pesquisar  ·  Ctrl K' }, h(Icon, { n: 'search', s: 18 })),
          h('a', { className: 'mx-icon mx-hide-s' + (r.name === 'conta' ? ' on' : ''), href: '#/conta', 'aria-label': 'A minha conta', title: 'Conta' }, h(Icon, { n: 'user', s: 18 })),
          h('a', { className: 'mx-icon mx-hide-s' + (r.name === 'favoritos' ? ' on' : ''), href: '#/favoritos', 'aria-label': 'Favoritos', title: 'Favoritos' }, h(Icon, { n: 'heart', s: 18 }), st.wish.length ? h('i', null, st.wish.length) : null),
          h('button', { className: 'mx-icon', onClick: function () { st.setCartOpen(true); }, 'aria-label': 'Carrinho, ' + st.count + ' artigos', title: 'Carrinho' }, h(Icon, { n: 'bag', s: 18 }), st.count ? h('i', null, st.count) : null))));
  }

  function MobileMenu(p) {
    var st = K.useStore(), a = activeOf(p.route, st);
    var xS = useState(null), ex = xS[0], setEx = xS[1];
    var pvS = useState('home'), pv = pvS[0], setPv = pvS[1];
    useEffect(function () {
      if (!p.open) return;
      setEx(a === 'roupa' || a === 'acessorios' ? a : null);
      setPv(a && a !== 'loja' ? a : 'roupa');
      var k = function (e) { if (e.key === 'Escape') p.onClose(); };
      window.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
      return function () { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
    }, [p.open]);
    var t = p.open ? 0 : -1, featP = byId('kn-005');
    return h('div', { className: 'mx-drawer' + (p.open ? ' open' : ''), role: 'dialog', 'aria-modal': true, 'aria-label': 'Menu', 'aria-hidden': !p.open },
      h('div', { className: 'mx-drawer-bg', onClick: p.onClose }),
      h('div', { className: 'mx-drawer-p' },
        h('div', { className: 'mx-dcol' },
          h('div', { className: 'mx-drawer-h' },
            h(Brand),
            h('button', { className: 'mx-close', onClick: p.onClose, 'aria-label': 'Fechar menu', tabIndex: t }, h('span'), h('span'))),
          h('button', { className: 'mx-dsearch', onClick: function () { p.onClose(); setTimeout(p.onSearch, 120); }, tabIndex: t, style: { '--i': 0 } }, h(Icon, { n: 'search', s: 16 }), h('span', null, 'Pesquisar')),
          h('nav', { className: 'mx-drawer-nav', 'aria-label': 'Principal' }, MENU.map(function (l, i) {
            var isOpen = ex === l.id, on = a === l.id;
            var head = h(R.Fragment, null,
              h('span', { className: 'n' }, '0' + (i + 1)),
              h('b', null, l.hot ? h('span', { className: 'hotdot' }) : null, l.label, l.star ? h('span', { className: 'star' }, '✦') : null, l.sub ? h('sup', null, countOf(l.id)) : null),
              l.sub ? h('span', { className: 'pl' + (isOpen ? ' x' : '') }) : h('span', { className: 'ar' }, '→'));
            return h('div', { key: l.id, className: 'mx-di' + (on ? ' on' : '') + (isOpen ? ' open' : '') + (l.hot ? ' hot' : '') + (pv === l.id ? ' pv' : ''), style: { '--i': i + 1 }, onMouseEnter: function () { setPv(l.id); } },
              l.sub ? h('button', { type: 'button', className: 'mx-dl', onClick: function () { setEx(isOpen ? null : l.id); }, onFocus: function () { setPv(l.id); }, 'aria-expanded': isOpen, tabIndex: t }, head)
                : h('a', { className: 'mx-dl', href: l.href, onFocus: function () { setPv(l.id); }, tabIndex: t, 'aria-current': on ? 'page' : undefined }, head),
              l.sub ? h('div', { className: 'mx-dsub' }, h('div', null,
                h('a', { href: l.href, className: 'all', tabIndex: isOpen ? 0 : -1 }, 'Ver tudo', h('em', null, countOf(l.id))),
                cats(l.id).map(function (c) { return h('a', { key: c[0], href: '#/loja/' + l.id + '?cat=' + encodeURIComponent(c[0]), tabIndex: isOpen ? 0 : -1 }, c[0], h('em', null, c[1])); }),
                ALL().some(function (x) { return x.line === l.id && x.custom; }) ? h('a', { href: '#/loja/' + l.id + '?pers=1', className: 'pers', tabIndex: isOpen ? 0 : -1 }, '✦ Só personalizáveis', h('em', null, ALL().filter(function (x) { return x.line === l.id && x.custom; }).length)) : null)) : null);
          })),
          h('div', { className: 'mx-drawer-f', style: { '--i': 7 } },
            h('div', { className: 'links' },
              h('a', { href: '#/conta', tabIndex: t }, h(Icon, { n: 'user', s: 16 }), 'Conta'),
              h('a', { href: '#/favoritos', tabIndex: t }, h(Icon, { n: 'heart', s: 16 }), 'Favoritos', st.wish.length ? h('em', null, st.wish.length) : null),
              h('a', { href: '#/ajuda', tabIndex: t }, h(Icon, { n: 'truck', s: 16 }), 'Ajuda')),
            h(MThemeSwitch),
            h('div', { className: 'legal' }, 'Feito no Cartaxo, Portugal · Portes grátis acima de 60 €')))));
  }
  function MThemeSwitch() {
    var th = K.useTheme(), t = th[0], set = th[1];
    return h('div', { className: 'mx-tswitch', role: 'group', 'aria-label': 'Aparência' },
      h('button', { className: t === 'light' ? 'on' : '', onClick: function () { set('light'); }, 'aria-pressed': t === 'light' }, h(Icon, { n: 'sun', s: 14 }), 'Claro'),
      h('button', { className: t === 'dark' ? 'on' : '', onClick: function () { set('dark'); }, 'aria-pressed': t === 'dark' }, h(Icon, { n: 'moon', s: 14 }), 'Escuro'),
      h('i', { className: t === 'dark' ? 'r' : '' }));
  }

  // Pesquisa: o ícone abre um campo que se estende no próprio cabeçalho, com resultados num cartão por baixo.
  function Search(p) {
    var qS = useState(''), q = qS[0], setQ = qS[1], ref = useRef(null), aS = useState(-1), act = aS[0], setAct = aS[1];
    var rcS = useState(function () { try { return JSON.parse(localStorage.getItem('kn5-recent-q')) || []; } catch (e) { return []; } }), recent = rcS[0], setRecent = rcS[1];
    var rS = useState(48), right = rS[0], setRight = rS[1];
    useEffect(function () {
      if (p.open) {
        var b = document.querySelector('.mx-sbtn'); if (b) { var r = b.getBoundingClientRect(); setRight(Math.max(16, window.innerWidth - r.right)); }
        setTimeout(function () { if (ref.current) ref.current.focus(); }, 120);
      } else { setQ(''); setAct(-1); var sb = document.querySelector('.mx-sbtn'); if (sb && document.activeElement && document.activeElement.closest && document.activeElement.closest('.mx-s3')) sb.focus(); }
    }, [p.open]);
    useEffect(function () { if (!p.open) return; var k = function (e) { if (e.key === 'Escape') p.onClose(); }; window.addEventListener('keydown', k); return function () { window.removeEventListener('keydown', k); }; }, [p.open]);
    useEffect(function () { var k = function (e) { var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName); if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) { e.preventDefault(); p.onOpen(); } }; window.addEventListener('keydown', k); return function () { window.removeEventListener('keydown', k); }; }, []);
    var n = K.norm(q).trim(), w = n.split(/\s+/);
    var res = n.length < 2 ? [] : ALL().filter(function (x) { var t = K.norm(x.name + ' ' + x.cat + ' ' + x.desc + ' ' + (x.custom ? 'personalizavel personalizar' : '') + ' ' + x.colors.map(function (c) { return c.name; }).join(' ')); return w.every(function (k) { return t.indexOf(k) >= 0; }); });
    var catHits = n.length < 2 ? [] : window.KN_SUB_ORDER.filter(function (c) { return K.norm(c).indexOf(n) >= 0 && ALL().some(function (x) { return x.cat === c; }); }).slice(0, 3);
    var shown = res.slice(0, 5);
    function remember(term) { term = String(term || '').trim(); if (!term) return; var nx = [term].concat(recent.filter(function (r) { return r.toLowerCase() !== term.toLowerCase(); })).slice(0, 5); setRecent(nx); try { localStorage.setItem('kn5-recent-q', JSON.stringify(nx)); } catch (e) {} }
    function openP(x) { remember(q); location.hash = '#/p/' + x.id; p.onClose(); }
    function go(e) { e.preventDefault(); if (act >= 0 && shown[act]) return openP(shown[act]); if (!q.trim()) return; remember(q); location.hash = '#/loja?q=' + encodeURIComponent(q.trim()); p.onClose(); }
    function key(e) { if (!shown.length) return; if (e.key === 'ArrowDown') { e.preventDefault(); setAct(Math.min(shown.length - 1, act + 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setAct(Math.max(-1, act - 1)); } }
    var trending = ['kn-005', 'kn-001', 'kn-016', 'kn-014'].map(byId).filter(Boolean);
    var lineOf = function (c) { var x = ALL().find(function (y) { return y.cat === c; }); return x ? x.line : 'roupa'; };
    var tab = p.open ? 0 : -1;
    var mark = function (txt) { if (n.length < 2) return txt; var i = K.norm(txt).indexOf(w[0]); if (i < 0) return txt; return h(R.Fragment, null, txt.slice(0, i), h('mark', null, txt.slice(i, i + w[0].length)), txt.slice(i + w[0].length)); };
    return h('div', { className: 'mx-s3' + (p.open ? ' open' : '') + (q ? ' typing' : ''), role: 'dialog', 'aria-modal': true, 'aria-label': 'Pesquisa', 'aria-hidden': !p.open, style: { '--sr': right + 'px' } },
      h('div', { className: 'mx-s3-bg', onClick: p.onClose }),
      h('form', { className: 'mx-s3-field', onSubmit: go, role: 'search' },
        h(Icon, { n: 'search', s: 18 }),
        h('input', { ref: ref, value: q, onChange: function (e) { setQ(e.target.value); setAct(-1); }, onKeyDown: key, placeholder: 'Procurar peças, cores, categorias…', 'aria-label': 'Pesquisar produtos', 'aria-controls': 'mx-s3-drop', enterKeyHint: 'search', autoComplete: 'off', spellCheck: false, tabIndex: tab }),
        q ? h('button', { type: 'button', className: 'mx-s3-clear', onClick: function () { setQ(''); if (ref.current) ref.current.focus(); }, 'aria-label': 'Limpar', tabIndex: tab }, h(Icon, { n: 'x', s: 14 })) : h('kbd', null, 'Esc'),
        h('button', { type: 'button', className: 'mx-s3-close', onClick: p.onClose, tabIndex: tab }, 'Fechar')),
      h('div', { className: 'mx-s3-drop', id: 'mx-s3-drop' },
        n.length < 2
          ? h(R.Fragment, null,
              recent.length ? h('div', { className: 'mx-s3-sec' },
                h('div', { className: 'mx-s3-h' }, h('span', { className: 'mx-label' }, 'Recentes'), h('button', { type: 'button', onClick: function () { setRecent([]); try { localStorage.removeItem('kn5-recent-q'); } catch (e) {} }, tabIndex: tab }, 'Limpar')),
                h('div', { className: 'mx-s3-chips' }, recent.map(function (x) { return h('button', { key: x, type: 'button', onClick: function () { setQ(x); if (ref.current) ref.current.focus(); }, tabIndex: tab }, h(Icon, { n: 'clock', s: 12 }), x); }))) : null,
              h('div', { className: 'mx-s3-sec' },
                h('div', { className: 'mx-s3-h' }, h('span', { className: 'mx-label' }, 'Sugestões')),
                h('div', { className: 'mx-s3-chips' }, ['T-shirt', 'Hoodie', 'Boné', 'Ténis', 'Calças', 'Personalizável'].map(function (x) { return h('button', { key: x, type: 'button', onClick: function () { setQ(x); if (ref.current) ref.current.focus(); }, tabIndex: tab }, x); }))),
              h('div', { className: 'mx-s3-sec' },
                h('div', { className: 'mx-s3-h' }, h('span', { className: 'mx-label' }, 'Mais procurados')),
                h('div', { className: 'mx-s3-trend' }, trending.map(function (x) { return h('a', { key: x.id, href: '#/p/' + x.id, onClick: p.onClose, tabIndex: tab }, h('div', { className: 'img' }, h(K.ProductImage, { product: x })), h('b', null, x.name), h('span', null, eur(x.price))); }))))
          : shown.length
            ? h(R.Fragment, null,
                catHits.length ? h('div', { className: 'mx-s3-cats' }, catHits.map(function (c) { return h('a', { key: c, href: '#/loja/' + lineOf(c) + '?cat=' + encodeURIComponent(c), onClick: function () { remember(q); p.onClose(); } }, h(Icon, { n: 'filter', s: 13 }), c, h('em', null, 'categoria')); })) : null,
                h('ul', { className: 'mx-s3-list', role: 'listbox' }, shown.map(function (x, i) {
                  return h('li', { key: x.id, role: 'option', 'aria-selected': act === i }, h('a', { href: '#/p/' + x.id, onClick: function (e) { e.preventDefault(); openP(x); }, className: act === i ? 'act' : '', onMouseEnter: function () { setAct(i); } },
                    h('div', { className: 'img' }, h(K.ProductImage, { product: x })),
                    h('span', { className: 'nm' }, h('b', null, mark(x.name)), h('em', null, x.cat + (x.custom ? ' · personalizável' : ''))),
                    h('span', { className: 'pr' }, x.was ? h('s', null, eur(x.was)) : null, eur(x.price)),
                    h('span', { className: 'go' }, '↵')));
                })),
                h('button', { type: 'button', className: 'mx-s3-all', onClick: go }, h('span', null, 'Ver todos os ' + res.length + ' resultados'), h('span', null, '→')))
            : h('div', { className: 'mx-s3-none' }, h('b', null, 'Nada encontrado para “' + q.trim() + '”.'), h('span', null, 'Experimenta “hoodie”, “boné” ou uma cor, como “preto”.'))));
  }

  // ───── início ─────
  var SLIDES = [
    { pid: 'kn-005', color: 'Bordeaux', label: 'Hoodie Algodão Pesado', note: 'Monograma KN · bordado a ouro', layers: [{ type: 'mono', text: 'KN', style: 'circle', color: '#C9A15B', zone: 'center', s: .2, dy: -.04 }] },
    { pid: 'kn-001', color: 'Branco', label: 'T-Shirt Essencial', note: '“Sofia” · caligrafia bordô', layers: [{ type: 'text', text: 'Sofia', font: 'script', color: '#8B1E2D', zone: 'center', s: .3, dy: -.06 }] },
    { pid: 'kn-004', color: 'Cinzento', label: 'Sweatshirt Cardada', note: 'Est. 2026 · varsity cru', layers: [{ type: 'text', text: 'EST.', font: 'sans', color: '#F4EFE6', zone: 'center', s: .1, dy: -.07, spacing: .35 }, { type: 'text', text: '2026', font: 'varsity', color: '#F4EFE6', zone: 'center', s: .3, dy: .02 }] },
  ];
  function Stat(p) { return h('div', { className: 'mx-stat' }, h('div', { className: 'mx-label' }, p.l), h('div', { className: 'mx-val' }, p.v, h('span', { className: 'mx-unit' }, p.u)), h('div', { className: 'mx-ann' }, p.a)); }
  function Hero() {
    var iS = useState(0), i = iS[0], setI = iS[1], left = K.cutoffLeft();
    useEffect(function () {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var t = setInterval(function () { setI(function (n) { return (n + 1) % SLIDES.length; }); }, 5600);
      return function () { clearInterval(t); };
    }, []);
    var s = SLIDES[i];
    return h('section', { className: 'mx-hero' },
      h('div', { className: 'mx-glow' }), h('div', { className: 'mx-grid-floor' }), h('div', { className: 'mx-stage-floor' }),
      h('div', { className: 'mx-container mx-hero-content' },
        h('div', { className: 'mx-eyebrow' }, h('span', { className: 'mx-dot' }), h('span', null, 'Coleção Outono · Cartaxo, Portugal'), h('span', { className: 'mx-slash' }, '/'), h('span', { className: 'mx-silver' }, left ? 'Envio hoje · ' + left : 'Envio em 24 h')),
        h('h1', { className: 'mx-h1' }, 'Feito ', h('span', { className: 'mx-serif' }, 'para'), h('br'), 'durar', h('span', { className: 'mx-num' }, 'N°01/26')),
        h('p', { className: 'mx-hero-lead' }, 'Algodão pesado, pele verdadeira e o teu nome bordado à mão. Peça a peça, no Cartaxo.')),
      h('div', { className: 'mx-car-stage' }, SLIDES.map(function (sl, k) { return h('div', { key: k, className: 'mx-slide' + (k === i ? ' on' : ''), 'aria-hidden': k !== i }, h(Garment, { pid: sl.pid, color: sl.color, layers: sl.layers, className: 'mx-garment' })); })),
      h('div', { className: 'mx-slide-meta' },
        h('span', null, String(i + 1).padStart(2, '0') + ' / ' + String(SLIDES.length).padStart(2, '0') + ' · exemplo do estúdio'),
        h('b', null, s.label), h('span', { className: 'mx-gold' }, s.note),
        h('div', { className: 'mx-dots' }, SLIDES.map(function (_, k) { return h('button', { key: k, className: k === i ? 'on' : '', onClick: function () { setI(k); }, 'aria-label': 'Ver exemplo ' + (k + 1) }); })),
        h('a', { href: '#/personalizar?p=' + s.pid, className: 'mx-link' }, 'Criar esta peça →')),
      h('div', { className: 'mx-hero-bottom' },
        h(Stat, { l: 'Portes grátis', v: '60', u: '€', a: '— acima de, em Portugal' }),
        h(Stat, { l: 'Devoluções', v: '30', u: 'dias', a: '— grátis, sem perguntas' }),
        h(Stat, { l: 'Personalização desde', v: '+8', u: '€', a: '— bordado ou impressão' }),
        h('div', { className: 'mx-stat mx-cta' }, h('a', { className: 'mx-btn', href: '#/personalizar' }, 'Personalizar a tua peça →'))));
  }

  var TICK = [['algodão pesado', '13 oz'], ['bordado', 'linha de algodão, ponto cheio'], ['envio', '24 h em dias úteis'], ['devoluções', '30 dias grátis'], ['pagamento', 'MB WAY · Multibanco · cartão'], ['feito em', 'Cartaxo, Portugal']];
  function Ticker() {
    var items = TICK.concat(TICK);
    return h('div', { className: 'mx-ticker', 'aria-hidden': true }, h('div', { className: 'mx-track' }, items.map(function (t, i) { return h('span', { key: i, className: 'it' }, h('strong', null, t[0]), ' · ' + t[1]); })));
  }

  function ChHead(p) {
    return h('div', { className: 'mx-chhead' + (p.tight ? ' tight' : '') },
      h('div', { className: 'l' }, h('span', { className: 'n' }, 'CAPÍTULO ' + p.n), h('span', { className: 't' }, '— ' + p.t)),
      p.title ? h('h2', { className: 'mx-h2' }, p.title) : null);
  }

  var LINE_COPY = {
    roupa: ['Básicos que ficam.', 'T-shirts, hoodies, camisas e calças em algodão pesado, com cortes que não passam de moda.'],
    acessorios: ['O detalhe que completa.', 'Ténis em pele, bonés, carteiras e mochilas, feitos para o uso de todos os dias.'],
    pers: ['A tua assinatura.', 'Escolhe a peça, escreve um nome ou desenha um monograma. Bordado ou impressão, feito no Cartaxo.'],
  };
  function Chapter1() {
    return h('section', { className: 'mx-chapter' }, h('div', { className: 'mx-narrow' },
      h(ChHead, { n: '01', t: 'A coleção', title: h(R.Fragment, null, 'Peças ', h('span', { className: 'mx-serif' }, 'pensadas'), ' para durar,', h('br'), 'não para a estação.') }),
      h('div', { className: 'mx-feature' },
        h('img', { src: 'assets/campaign/product-lifestyle.jpg', alt: 'T-shirt Karmic Node em algodão pesado', loading: 'lazy' }),
        h('div', { className: 'hl' }),
        h('div', { className: 'cap' }, h('span', null, h('strong', null, 'FIG. 01'), ' · T-Shirt Essencial · Lisboa, outono 2026'), h('span', null, 'Algodão 100%'))),
      h('div', { className: 'mx-cols' }, window.KN_LINES.map(function (l) {
        var ps = ALL().filter(function (x) { return x.line === l.id; }), min = Math.min.apply(null, ps.map(function (x) { return x.price; })), c = LINE_COPY[l.id] || [l.label, l.blurb];
        return h('div', { key: l.id, className: 'mx-col' },
          h('div', { className: 'lb' }, '— ' + l.label + ' · ' + ps.length + ' peças'),
          h('h4', null, c[0]), h('p', null, c[1]),
          h('a', { href: '#/loja/' + l.id }, h('span', null, 'Desde ' + eur(min)), h('span', null, 'Ver tudo →')));
      }).concat([h('div', { key: 'pers', className: 'mx-col' },
        h('div', { className: 'lb' }, '— Personalizar · ' + ALL().filter(function (x) { return x.custom; }).length + ' peças'),
        h('h4', null, LINE_COPY.pers[0]), h('p', null, LINE_COPY.pers[1]),
        h('a', { href: '#/personalizar' }, h('span', null, 'Desde +8 €'), h('span', null, 'Abrir o estúdio →')))]))));
  }

  function Chapter2() {
    var best = ALL().filter(function (x) { return x.badge === 'Bestseller'; });
    if (best.length < 4) best = best.concat(ALL().slice().sort(function (a, b) { return b.reviews - a.reviews; }).filter(function (x) { return best.indexOf(x) < 0; }));
    return h('section', { className: 'mx-chapter mx-tight' }, h('div', { className: 'mx-narrow' },
      h('div', { className: 'mx-headrow' },
        h(ChHead, { n: '02', t: 'Mais escolhidos', title: h(R.Fragment, null, 'Os ', h('span', { className: 'mx-serif' }, 'eleitos'), '.') }),
        h('a', { className: 'mx-btn outline', href: '#/loja?sort=pop' }, 'Ver toda a loja →')),
      h('div', { className: 'grid' }, best.slice(0, 4).map(function (x) { return h(K.Card, { key: x.id, product: x }); }))));
  }

  var SPECS = [['Técnicas', 'Bordado', 'ou impressão DTG'], ['Vistas', 'Frente + costas', 'boné: frente'], ['Elementos', 'Até 4', 'por vista'], ['Letras', '5 estilos', 'curva e contorno'], ['Gráficos', '17', 'inclui emblema KN'], ['Imagem própria', 'PNG · JPG', 'fundo removido'], ['Prova', 'Por email', 'antes de produzir'], ['Produção', '5–7 dias', 'úteis · bordado']];
  function Chapter3() {
    return h('section', { className: 'mx-spec' }, h('div', { className: 'mx-narrow mx-spec-grid' },
      h('div', null,
        h(ChHead, { n: '03', t: 'O estúdio', tight: true }),
        h('h2', { className: 'mx-h2', style: { margin: '30px 0 34px' } }, 'Uma peça.', h('br'), h('span', { className: 'mx-serif mx-gold' }, 'A tua'), ' assinatura.'),
        h('p', { className: 'lead' }, 'Escreve um nome, desenha um monograma ou carrega o teu logótipo. Vês a peça a mudar em tempo real, de frente e de costas, antes de pagar um cêntimo.'),
        h('p', { className: 'lead' }, 'Cada design passa pelas mãos de quem o borda. Recebes uma prova por email e só depois começamos.'),
        h('div', { style: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 34 } },
          h('a', { className: 'mx-btn', href: '#/personalizar' }, 'Abrir o estúdio →'),
          h('a', { className: 'mx-btn outline', href: '#/ajuda' }, 'Como funciona'))),
      h('div', { className: 'mx-table' }, SPECS.map(function (r) { return h('div', { key: r[0], className: 'mx-row' }, h('span', { className: 'k' }, r[0]), h('span', { className: 'v' }, r[1], h('small', null, r[2]))); }))));
  }

  var TRIMS = [
    { label: '— Essencial', pid: 'kn-001', color: 'Preto', layers: [{ type: 'text', text: 'Sofia', font: 'script', color: '#C9A15B', zone: 'center', s: .28, dy: -.05 }], specs: [['Técnica', 'Bordado a ouro'], ['Posição', 'Centro do peito'], ['Peça', 'Algodão 100%'], ['Prazo', '5–7 dias úteis']] },
    { label: '— Mais escolhido', feat: true, pid: 'kn-005', color: 'Cinzento', layers: [{ type: 'mono', text: 'KN', style: 'circle', color: '#8B1E2D', zone: 'chest-l', s: .15 }], specs: [['Técnica', 'Monograma bordado'], ['Posição', 'Peito esquerdo'], ['Peça', 'Algodão 13 oz'], ['Prazo', '5–7 dias úteis']] },
    { label: '— Acessório', pid: 'kn-016', color: 'Bege', layers: [{ type: 'mono', text: 'KN', style: 'shield', color: '#8B1E2D', zone: 'front', s: .2 }], specs: [['Técnica', 'Bordado 3D'], ['Posição', 'Frente'], ['Peça', 'Sarja de algodão'], ['Prazo', '5–7 dias úteis']] },
  ];
  function Chapter4() {
    return h('section', { className: 'mx-chapter' }, h('div', { className: 'mx-narrow' },
      h('div', { className: 'mx-trims-head' }, h('div', { className: 'eb' }, 'Capítulo 04 — Personalizar'), h('h2', { className: 'mx-h2', style: { margin: '0 auto' } }, 'Três ', h('span', { className: 'mx-serif' }, 'formas'), '.', h('br'), 'Uma assinatura.')),
      h('div', { className: 'mx-trims' }, TRIMS.map(function (t) {
        var p = byId(t.pid);
        return h('article', { key: t.pid, className: 'mx-trim' + (t.feat ? ' feat' : '') },
          h('div', { className: 'lb' }, t.label),
          h('h3', null, p.name.split(' ').slice(0, 2).join(' ')),
          h('div', { className: 'from' }, 'Desde ' + eur(p.price + 12) + ' · com bordado'),
          h('div', { className: 'img' }, h(Garment, { pid: t.pid, color: t.color, layers: t.layers })),
          h('ul', null, t.specs.concat([['Cores', p.colors.length + ' cores']]).map(function (s) { return h('li', { key: s[0] }, h('span', null, s[0]), s[1]); })),
          h('div', { className: 'cta' }, h('a', { href: '#/p/' + p.id }, 'Ver peça'), h('a', { className: 'p', href: '#/personalizar?p=' + p.id }, 'Personalizar →')));
      }))));
  }

  function Reserve() {
    var sale = ALL().filter(function (x) { return x.was; });
    var max = sale.reduce(function (m, x) { return Math.max(m, Math.round((1 - x.price / x.was) * 100)); }, 0);
    return h('section', { className: 'mx-reserve' }, h('div', { className: 'mx-narrow' },
      h('div', { className: 'mx-eyebrow' }, h('span', { className: 'mx-dot' }), h('span', null, 'Black Friday · ' + sale.length + ' peças com desconto')),
      h('h2', { className: 'mx-h2x' }, 'Menos ', h('span', { className: 'mx-serif' }, 'preço'), '.', h('br'), 'A mesma obsessão.'),
      h('p', null, 'Até −' + max + '% em peças selecionadas, sem códigos. Termina a 30 de novembro.'),
      K.Countdown ? h(K.Countdown) : null,
      h('a', { className: 'mx-btn big', href: '#/black-friday' }, 'Ver as ofertas →')));
  }

  function Home() { return h('main', null, h(Hero), h(Ticker), h(Chapter1), h(Chapter2), h(Chapter3), h(Chapter4), h(Reserve)); }

  // ───── rodapé ─────
  function Footer() {
    var eS = useState(''), e = eS[0], setE = eS[1], dS = useState(''), msg = dS[0], setMsg = dS[1];
    function sub(ev) { ev.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) { setMsg('Confirma o teu email.'); return; } setMsg('Obrigado. O teu código: WELCOME10'); setE(''); }
    var col = function (t, ls) { return h('div', null, h('h5', null, t), h('ul', null, ls.map(function (l) { return h('li', { key: l[0] }, h('a', { href: l[1] }, l[0])); }))); };
    return h('footer', { className: 'mx-footer' }, h('div', { className: 'mx-narrow' },
      h('div', { className: 'mx-fgrid' },
        h('div', null, h(Brand),
          h('p', null, 'Karmic Node — roupa e acessórios, lisos ou personalizados por ti, acabados à mão no Cartaxo.'),
          h('form', { className: 'mx-news', onSubmit: sub, noValidate: true }, h('input', { type: 'email', value: e, onChange: function (x) { setE(x.target.value); setMsg(''); }, placeholder: '10% na primeira compra — o teu email', 'aria-label': 'Email para a newsletter' }), h('button', { type: 'submit' }, 'Subscrever')),
          msg ? h('div', { className: 'mx-mono', style: { fontSize: 11, marginTop: 10, color: msg.indexOf('Obrigado') === 0 ? 'var(--gold)' : 'var(--sale)', letterSpacing: '.08em' } }, msg) : null),
        col('Loja', [['Início', '#/'], ['Roupa', '#/loja/roupa'], ['Acessórios', '#/loja/acessorios'], ['Toda a loja', '#/loja'], ['Black Friday', '#/black-friday']]),
        col('Personalizar', [['Estúdio', '#/personalizar'], ['T-shirt', '#/personalizar?p=kn-001'], ['Hoodie', '#/personalizar?p=kn-005'], ['Boné', '#/personalizar?p=kn-016']]),
        col('Ajuda', [['Envios e entregas', '#/ajuda'], ['Devoluções grátis', '#/ajuda'], ['Guia de tamanhos', '#/ajuda'], ['Contactos', '#/ajuda']]),
        col('Conta', [['A minha conta', '#/conta'], ['Encomendas', '#/conta'], ['Favoritos', '#/favoritos'], ['Livro de Reclamações', '#/ajuda']])),
      h('div', { className: 'mx-fbot' }, h('span', null, '© 2026 Karmic Node — Feito no Cartaxo, Portugal'), h('span', null, 'MB WAY · Multibanco · Visa · Mastercard · Apple Pay'))));
  }

  // ───── app ─────
  var TITLES = { home: 'Karmic Node — Roupa personalizada, feita para durar', loja: 'Loja', p: 'Produto', checkout: 'Finalizar compra', confirmacao: 'Encomenda confirmada', conta: 'A minha conta', favoritos: 'Favoritos', ajuda: 'Ajuda', personalizar: 'Personalizar', 'black-friday': 'Black Friday' };
  function Pages() {
    var r = K.useRoute(), st = K.useStore();
    var mS = useState(false), menu = mS[0], setMenu = mS[1], sS = useState(false), search = sS[0], setSearch = sS[1];
    useEffect(function () { var t = r.name === 'p' && st.byId[r.id] ? st.byId[r.id].name : TITLES[r.name]; document.title = r.name === 'home' ? TITLES.home : (t || 'Karmic Node') + ' · Karmic Node'; }, [r.name, r.id]);
    useEffect(function () { st.setCartOpen(false); setMenu(false); setSearch(false); }, [r.name, r.id, r.params.cat, r.params.f, r.params.q]);
    var page;
    switch (r.name) {
      case 'loja': page = h(K.Listing, { route: r }); break;
      case 'p': page = h(K.Product, { route: r }); break;
      case 'checkout': page = h(K.Checkout, { route: r }); break;
      case 'confirmacao': page = h(K.Confirm, { route: r }); break;
      case 'conta': page = h(K.Account, { route: r }); break;
      case 'favoritos': page = h(K.Favorites, { route: r }); break;
      case 'ajuda': page = h(K.Help, { route: r }); break;
      case 'black-friday': page = h(K.BlackFriday, { route: r }); break;
      case 'personalizar': page = h(K.Personalize, { route: r, key: r.params.p || r.params.d || 'x' }); break;
      default: page = h(Home);
    }
    if (r.name === 'checkout') return h(R.Fragment, null, page, h(K.Toast));
    return h(R.Fragment, null,
      h(Nav, { route: r, onMenu: function () { setMenu(true); }, onSearch: function () { setSearch(true); } }),
      h('div', { className: 'kmain mx-main' + (r.name === 'home' ? ' home' : '') + (r.name === 'personalizar' ? ' studio' : '') }, page, r.name === 'personalizar' ? null : h(Footer)),
      h(MobileMenu, { open: menu, onClose: function () { setMenu(false); }, onSearch: function () { setSearch(true); }, route: r }),
      h(Search, { open: search, onOpen: function () { setSearch(true); }, onClose: function () { setSearch(false); } }),
      h(K.CartDrawer), h(K.Toast));
  }
  function App() { return h(K.StoreProvider, null, h(Pages)); }
  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
