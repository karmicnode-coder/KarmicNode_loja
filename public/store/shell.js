// Karmic Node — esqueleto v12: barra superior (pesquisa grande + carrinho com total) e menu lateral
(function () {
  'use strict';
  var R = React, h = R.createElement, useState = R.useState, useEffect = R.useEffect, useRef = R.useRef, useMemo = R.useMemo;
  var K = window.KN, Icon = K.Icon, eur = K.eur, go = K.go;

  var SP = {
    roupa: 'M9 3l3 1.6L15 3l4.5 2.2-1.6 4.3-2-.8V21H8.1V8.7l-2 .8L4.5 5.2z',
    acessorios: 'M2.5 15.5c0-1.2.6-3.8 1.3-5l3.2 1 2.5-2 2 2.4 4.7 1.6c2.6.9 5.3 2.2 5.3 4v1.2h-19zM2.5 17.6h19',
    casa: 'M3 11l9-7 9 7M5.5 9.5V20h13V9.5M10 20v-5.5h4V20',
    novo: 'M12 3l2.3 5.2L20 9l-4.3 3.8L17 18.5 12 15.6 7 18.5l1.3-5.7L4 9l5.7-.8z',
    bf: 'M12 3c1 3 4 4.6 4 8.4a4 4 0 0 1-8 0c0-1.6.7-2.7 1.5-3.6.2 1.4 1 2.2 2 2.4-.6-2.6.1-5 .5-7.2zM6 14.5a6 6 0 0 0 12 0',
    pers: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
    best: 'M7 21h10M12 17v4M6 4h12v4a6 6 0 0 1-12 0zM6 6H3v1a3 3 0 0 0 3 3M18 6h3v1a3 3 0 0 1-3 3',
    all: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 16.8h.01',
    collapse: 'M15 6l-6 6 6 6M20 4v16',
  };
  function SI(p) {
    return h('svg', { width: p.s || 20, height: p.s || 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, h('path', { d: SP[p.n] }));
  }

  // ───── tema ─────
  var themeListeners = [];
  function getTheme() { return document.documentElement.getAttribute('data-theme') || 'light'; }
  function setTheme(t) {
    var el = document.documentElement; el.classList.add('theme-anim');
    el.setAttribute('data-theme', t); try { localStorage.setItem('kn5-theme', t); } catch (e) {}
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0F0D0D' : '#FFFFFF');
    themeListeners.forEach(function (f) { f(t); });
    setTimeout(function () { el.classList.remove('theme-anim'); }, 400);
  }
  function useTheme() {
    var s = useState(getTheme()), t = s[0], set = s[1];
    useEffect(function () { themeListeners.push(set); return function () { themeListeners = themeListeners.filter(function (f) { return f !== set; }); }; }, []);
    return [t, setTheme];
  }
  function ThemeToggle() {
    var th = useTheme(), t = th[0];
    return h('button', { className: 'theme-tg', onClick: function () { setTheme(t === 'dark' ? 'light' : 'dark'); }, 'aria-label': t === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro', title: t === 'dark' ? 'Modo claro' : 'Modo escuro' },
      h('svg', { className: 'sun', width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }, h('path', { d: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' })),
      h('svg', { className: 'moon', width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z' })));
  }
  function ThemeSwitch() {
    var th = useTheme(), t = th[0];
    return h('div', { className: 'snav-theme', role: 'group', 'aria-label': 'Tema' },
      h('button', { className: t === 'light' ? 'on' : '', onClick: function () { setTheme('light'); }, 'aria-pressed': t === 'light' }, '☀ Claro'),
      h('button', { className: t === 'dark' ? 'on' : '', onClick: function () { setTheme('dark'); }, 'aria-pressed': t === 'dark' }, '☾ Escuro'));
  }

  function Brand(p) {
    return h('a', { className: 'kbrand', href: '#/', 'aria-label': 'Karmic Node — início' },
      h('img', { src: 'assets/logo-mark.png', alt: '' }),
      h('span', { className: 'kbrand-t' }, h('b', null, 'Karmic Node'), h('small', null, 'Feito em Portugal')));
  }

  var POP = ['T-shirt', 'Hoodie', 'Ténis', 'Calças', 'Boné', 'Manta'];

  function TopBar(p) {
    var st = K.useStore(), r = p.route;
    var qS = useState(''), q = qS[0], setQ = qS[1];
    var fS = useState(false), focus = fS[0], setFocus = fS[1];
    var scS = useState(false), scrolled = scS[0], setScrolled = scS[1];
    var inRef = useRef(null);
    useEffect(function () { setQ(''); setFocus(false); }, [r.name, r.id, r.params.q]);
    useEffect(function () {
      var f = function () { setScrolled(window.scrollY > 4); };
      f(); window.addEventListener('scroll', f, { passive: true });
      return function () { window.removeEventListener('scroll', f); };
    }, []);
    useEffect(function () {
      var k = function (e) {
        var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
        if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) { e.preventDefault(); if (inRef.current) inRef.current.focus(); }
        if (e.key === 'Escape' && document.activeElement === inRef.current) { setFocus(false); inRef.current.blur(); }
      };
      window.addEventListener('keydown', k);
      return function () { window.removeEventListener('keydown', k); };
    }, []);
    var res = useMemo(function () {
      var n = K.norm(q).trim(); if (n.length < 2) return [];
      var w = n.split(/\s+/);
      return window.KN_PRODUCTS.filter(function (x) {
        var t = K.norm(x.name + ' ' + x.cat + ' ' + x.line + ' ' + x.desc + ' ' + x.colors.map(function (c) { return c.name; }).join(' '));
        return w.every(function (k) { return t.indexOf(k) >= 0; });
      }).slice(0, 6);
    }, [q]);
    var cats = useMemo(function () {
      var n = K.norm(q).trim(); if (n.length < 2) return [];
      return window.KN_SUB_ORDER.filter(function (c) { return K.norm(c).indexOf(n) >= 0; }).slice(0, 4);
    }, [q]);
    function submit(e) {
      e.preventDefault();
      if (!q.trim()) return;
      go('/loja?q=' + encodeURIComponent(q.trim()));
      setFocus(false); if (inRef.current) inRef.current.blur();
    }
    var left = K.cutoffLeft();
    var msgs = [left ? 'Encomenda nas próximas ' + left + ' e enviamos hoje' : 'Envio em 24 h em dias úteis', 'Portes grátis acima de ' + eur(K.CFG.freeShip), 'Devoluções grátis em ' + K.CFG.returnDays + ' dias', 'Black Friday: até −25% sem códigos'];

    var drop = null;
    if (focus) {
      var body;
      if (q.trim().length < 2) {
        body = h(R.Fragment, null,
          h('div', { className: 'eyebrow' }, 'Pesquisas populares'),
          h('div', { className: 'chiprow' }, POP.map(function (w) { return h('button', { key: w, type: 'button', className: 'chip', onClick: function () { setQ(w); } }, w); })));
      } else if (res.length || cats.length) {
        body = h(R.Fragment, null,
          cats.length ? h('div', { className: 'kd-cats' }, cats.map(function (c) {
            var ln = (window.KN_PRODUCTS.find(function (x) { return x.cat === c; }) || {}).line;
            return h('a', { key: c, href: '#/loja/' + ln + '?cat=' + encodeURIComponent(c) }, h(Icon, { n: 'search', s: 13 }), c);
          })) : null,
          res.length ? h('div', { className: 'kd-prods' }, res.map(function (x) {
            return h('a', { key: x.id, href: '#/p/' + x.id, className: 'kd-p' },
              h(K.ProductImage, { product: x }),
              h('span', null, h('b', null, x.name), h('em', null, x.cat)),
              h('span', { className: 'price' }, x.was ? h('span', { className: 'sale' }, eur(x.price)) : eur(x.price)));
          })) : null,
          h('button', { type: 'submit', className: 'kd-all' }, 'Ver todos os resultados para “' + q.trim() + '”'));
      } else {
        body = h('p', { className: 'muted', style: { margin: 0 } }, 'Sem resultados para “' + q.trim() + '”. Experimenta “t-shirt”, “ténis” ou “manta”.');
      }
      drop = h('div', { className: 'ksearch-drop', onMouseDown: function (e) { e.preventDefault(); } }, body);
    }

    return h(R.Fragment, null,
      h('div', { className: 'ann' }, h('div', { className: 'ann-track' }, msgs.concat(msgs).map(function (m, i) { return h('span', { key: i }, m); }))),
      h('header', { className: 'ktop' + (scrolled ? ' scrolled' : '') },
        h('div', { className: 'ktop-in' },
          h('button', { className: 'iconbtn kburger', onClick: p.onMenu, 'aria-label': 'Abrir menu' }, h(Icon, { n: 'menu' })),
          h(Brand),
          h('form', { className: 'ksearch' + (focus ? ' on' : ''), onSubmit: submit, role: 'search' },
            h(Icon, { n: 'search', s: 18 }),
            h('input', { ref: inRef, value: q, onChange: function (e) { setQ(e.target.value); }, onFocus: function () { setFocus(true); }, onBlur: function () { setFocus(false); }, placeholder: 'Pesquisar t-shirts, ténis, mantas…', 'aria-label': 'Pesquisar produtos', enterKeyHint: 'search', autoComplete: 'off' }),
            h('kbd', null, '/'),
            h('button', { type: 'submit', className: 'ksearch-go' }, 'Pesquisar'),
            drop),
          h('div', { className: 'ktop-r' },
            h(ThemeToggle),
            h('a', { className: 'kact', href: '#/conta', 'aria-label': 'A minha conta' }, h('span', { className: 'kact-i' }, h(Icon, { n: 'user' })), h('span', null, 'Conta')),
            h('a', { className: 'kact', href: '#/favoritos', 'aria-label': 'Favoritos' }, h('span', { className: 'kact-i' }, h(Icon, { n: 'heart' }), st.wish.length ? h('i', { className: 'dot' }, st.wish.length) : null), h('span', null, 'Favoritos')),
            h('button', { className: 'kcart', onClick: function () { st.setCartOpen(true); }, 'aria-label': 'Carrinho, ' + st.count + ' artigos, ' + eur(st.subtotal - st.discount) },
              h('span', { className: 'kact-i' }, h(Icon, { n: 'bag' }), st.count ? h('i', { className: 'dot' }, st.count) : null),
              h('span', { className: 'kcart-t' }, h('small', null, 'Carrinho'), h('b', null, eur(st.subtotal - st.discount))))))));
  }

  function subsOf(line) {
    var c = {};
    window.KN_PRODUCTS.forEach(function (x) { if (x.line === line) c[x.cat] = (c[x.cat] || 0) + 1; });
    return window.KN_SUB_ORDER.filter(function (k) { return c[k]; }).map(function (k) { return [k, c[k]]; });
  }

  function SideNav(p) {
    var st = K.useStore(), r = p.route, mini = !!p.mini && !p.inSheet;
    var activeLine = r.name === 'loja' ? r.id : (r.name === 'p' && st.byId[r.id] ? st.byId[r.id].line : null);
    var oS = useState(activeLine || 'roupa'), open = oS[0], setOpen = oS[1];
    useEffect(function () { if (activeLine) setOpen(activeLine); }, [activeLine]);
    var loja = r.name === 'loja';
    var quick = [
      ['all', 'Toda a loja', '/loja', loja && !r.id && !r.params.f && !r.params.q && r.params.sort !== 'pop'],
      ['novo', 'Novidades', '/loja?f=novo', loja && r.params.f === 'novo'],
      ['best', 'Mais vendidos', '/loja?sort=pop', loja && !r.id && r.params.sort === 'pop'],
      ['bf', 'Black Friday', '/black-friday', r.name === 'black-friday'],
      ['pers', 'Personalizar', '/personalizar', r.name === 'personalizar'],
    ];
    var left = K.cutoffLeft();
    return h('nav', { className: 'snav' + (mini ? ' mini' : ''), 'aria-label': 'Menu da loja' },
      h('div', { className: 'snav-sec' },
        h('div', { className: 'snav-h' }, 'Explorar'),
        quick.map(function (it) {
          return h('a', { key: it[0], href: '#' + it[2], className: 'snav-a' + (it[3] ? ' on' : '') + (it[0] === 'bf' ? ' hot' : ''), title: mini ? it[1] : undefined, 'aria-current': it[3] ? 'page' : undefined },
            h(SI, { n: it[0] }), h('span', null, it[1]), it[0] === 'bf' ? h('i', { className: 'snav-badge' }, '−25%') : null);
        })),
      h('div', { className: 'snav-sec' },
        h('div', { className: 'snav-h' }, 'Categorias'),
        window.KN_LINES.map(function (l) {
          var ss = subsOf(l.id), isOpen = open === l.id && !mini, on = activeLine === l.id;
          var n = ss.reduce(function (a, b) { return a + b[1]; }, 0);
          return h('div', { key: l.id, className: 'snav-g' + (isOpen ? ' open' : '') },
            h('div', { className: 'snav-row' },
              h('a', { href: '#/loja/' + l.id, className: 'snav-a' + (on && !r.params.cat ? ' on' : ''), title: mini ? l.label : undefined },
                h(SI, { n: l.id }), h('span', null, l.label), h('em', null, n)),
              mini ? null : h('button', { className: 'snav-tg', onClick: function () { setOpen(isOpen ? null : l.id); }, 'aria-expanded': isOpen, 'aria-label': (isOpen ? 'Fechar ' : 'Abrir ') + l.label }, h(Icon, { n: 'down', s: 16 }))),
            isOpen ? h('div', { className: 'snav-sub' }, ss.map(function (s) {
              var a = on && r.params.cat === s[0];
              return h('a', { key: s[0], href: '#/loja/' + l.id + '?cat=' + encodeURIComponent(s[0]), className: a ? 'on' : '' }, s[0], h('em', null, s[1]));
            })) : null);
        })),
      mini ? null : h('div', { className: 'snav-promo' },
        h('b', null, left ? 'Envio hoje' : 'Envio em 24 h'),
        h('span', null, left ? 'Encomenda nas próximas ' + left + '.' : 'Encomendas até às 14h saem no mesmo dia útil.'),
        h('span', null, 'Portes grátis acima de ' + eur(K.CFG.freeShip) + '.')),
      h('div', { className: 'snav-foot' },
        h(ThemeSwitch),
        h('a', { href: '#/ajuda', className: 'snav-a', title: mini ? 'Ajuda' : undefined }, h(SI, { n: 'help' }), h('span', null, 'Ajuda e devoluções')),
        p.inSheet ? null : h('button', { className: 'snav-a snav-col', onClick: p.onToggle, 'aria-label': mini ? 'Expandir menu' : 'Recolher menu', title: mini ? 'Expandir menu' : undefined },
          h('span', { className: 'snav-colic', style: { transform: mini ? 'rotate(180deg)' : 'none' } }, h(SI, { n: 'collapse' })), h('span', null, 'Recolher menu'))));
  }

  Object.assign(window.KN, { TopBar: TopBar, SideNav: SideNav, Brand: Brand, useTheme: useTheme, ThemeToggle: ThemeToggle });
})();
