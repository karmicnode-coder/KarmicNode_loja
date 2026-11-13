// Karmic Node — core: estado, carrinho, router, utilitários, imagens
(function () {
  'use strict';
  var R = React, h = R.createElement;
  var useState = R.useState, useEffect = R.useEffect, useRef = R.useRef, useContext = R.useContext, useMemo = R.useMemo, useCallback = R.useCallback;

  var CFG = { freeShip: 60, shipStd: 4.95, shipExp: 8.95, cutoffHour: 14, returnDays: 30 };

  // ───── formatação ─────
  var eurF = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  function eur(v) { return eurF.format(v || 0); }
  function norm(s) { return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

  // ───── datas de entrega (dias úteis, PT) ─────
  function addBizDays(d, n) { var x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); var w = x.getDay(); if (w !== 0 && w !== 6) n--; } return x; }
  function shipStart(now) { now = now || new Date(); var w = now.getDay(); var past = now.getHours() >= CFG.cutoffHour; if (w === 6 || w === 0 || past) return addBizDays(now, 1); return now; }
  var dF = new Intl.DateTimeFormat('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' });
  function fmtDate(d) { return dF.format(d).replace('.', ''); }
  function deliveryWindow(kind) {
    var s = shipStart();
    if (kind === 'exp') return fmtDate(addBizDays(s, 1));
    return fmtDate(addBizDays(s, 2)) + ' – ' + fmtDate(addBizDays(s, 4));
  }
  function cutoffLeft() {
    var now = new Date(), w = now.getDay();
    if (w === 0 || w === 6) return null;
    var c = new Date(now); c.setHours(CFG.cutoffHour, 0, 0, 0);
    var ms = c - now; if (ms <= 0) return null;
    var hrs = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000);
    return (hrs ? hrs + ' h ' : '') + m + ' min';
  }

  // ───── ícones (SVG inline, sem dependências) ─────
  var P = {
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
    bag: 'M6 7h12l-1 13H7L6 7zM9 7a3 3 0 0 1 6 0',
    heart: 'M12 20s-7-4.4-9-9.2C1.7 7.6 4 4 7.4 4c2 0 3.4 1.1 4.6 2.6C13.2 5.1 14.6 4 16.6 4 20 4 22.3 7.6 21 10.8 19 15.6 12 20 12 20z',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    menu: 'M4 7h16M4 12h16M4 17h16', x: 'M6 6l12 12M18 6L6 18',
    plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', check: 'M5 12.5l4.5 4.5L19 7.5',
    truck: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    ret: 'M4 9h11a5 5 0 0 1 0 10h-3M4 9l4-4M4 9l4 4',
    lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
    star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z',
    chev: 'M9 6l6 6-6 6', chevL: 'M15 6l-6 6 6 6', down: 'M6 9l6 6 6-6',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    pen: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
    leaf: 'M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19l7-7',
    filter: 'M4 6h16M7 12h10M10 18h4', ruler: 'M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2',
    trash: 'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13', card: 'M3 6h18v12H3zM3 10h18',
    pkg: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9',
    spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
    tag: 'M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01',
  };
  function Icon(p) {
    var s = p.s || 20;
    return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: p.fill ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: p.w || 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, style: p.style }, h('path', { d: P[p.n] || '' }));
  }

  // ───── motor de imagem: mockup recolorido ─────
  var MOCK = {
    tshirt: { mask: 'mask-tshirt', shade: 'shade-tshirt', box: [51, 75, 458, 434] },
    hoodie: { mask: 'mask-hoodie', shade: 'shade-hoodie', box: [55, 35, 455, 469] },
    sweatshirt: { mask: 'mask-sweatshirt', shade: 'shade-sweatshirt', box: [61, 85, 451, 427] },
    cap: { mask: 'mask2-cap', shade: 'shade2-cap', box: [108, 129, 397, 389] },
  };
  var imgCache = {}, tintCache = {};
  function loadImg(src) {
    if (!imgCache[src]) imgCache[src] = new Promise(function (res, rej) { var i = new Image(); i.decoding = 'async'; i.onload = function () { res(i); }; i.onerror = rej; i.src = src; });
    return imgCache[src];
  }
  function lum(hex) { var c = hex.replace('#', ''); var r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
  function tinted(mock, hex) {
    var key = mock + hex;
    if (tintCache[key]) return tintCache[key];
    var m = MOCK[mock];
    tintCache[key] = Promise.all([loadImg('assets/atelier/' + m.mask + '.png'), loadImg('assets/atelier/' + m.shade + '.png')]).then(function (r) {
      var b = m.box, w = b[2] - b[0], hh = b[3] - b[1], S = 2;
      var cv = document.createElement('canvas'); cv.width = w * S; cv.height = hh * S;
      var x = cv.getContext('2d');
      x.fillStyle = hex; x.fillRect(0, 0, cv.width, cv.height);
      x.globalCompositeOperation = 'multiply'; x.drawImage(r[1], b[0], b[1], w, hh, 0, 0, cv.width, cv.height);
      if (lum(hex) < 0.12) { x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.16; x.drawImage(r[1], b[0], b[1], w, hh, 0, 0, cv.width, cv.height); x.globalAlpha = 1; }
      x.globalCompositeOperation = 'destination-in'; x.drawImage(r[0], b[0], b[1], w, hh, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/png');
    });
    return tintCache[key];
  }
  // Silhuetas mais realistas (viewBox 24)
  var GLYPH = {
    jacket: 'M9 2.6l3 1.6 3-1.6 4.4 2 1.6 6.4-2.4.6-.6-2.6V21.4H6V9l-.6 2.6L3 11 4.6 4.6zM12 4.2V21.4M9 2.6l3 4.2 3-4.2M8.4 14.5h2M13.6 14.5h2',
    bomber: 'M9 3l3 1.4L15 3l4.4 2 1.6 6.2-2.4.7-.6-2.4V19l-.8 1.6H6.8L6 19V9.5l-.6 2.4L3 11.2 4.6 5zM12 4.4V20.6M6 18.6h12M9 3l3 2 3-2',
    shirt: 'M9 2.8l3 1.8 3-1.8 4.6 2.1 1.4 6-2.4.6-.6-2.4v12.3H6V9.1l-.6 2.4-2.4-.6 1.4-6zM12 4.6v16.8M9 2.8l3 3.6 3-3.6M12 9.2h.01M12 12.6h.01M12 16h.01',
    cargo: 'M7.4 2.5h9.2l1.3 19h-4.1L12 9.8l-1.8 11.7H6.1zM7.4 4.6h9.2M6.9 11.5h3.2v3.2H6.6M17.1 11.5h-3.2v3.2h3.5',
    jeans: 'M7.4 2.5h9.2l1.3 19h-4.1L12 9.8l-1.8 11.7H6.1zM7.4 4.6h9.2M12 4.6v5.2M9.2 4.6c0 1.6-.6 2.6-1.7 3M14.8 4.6c0 1.6.6 2.6 1.7 3',
    dress: 'M9.2 2.5h1.4L12 4.2l1.4-1.7h1.4l.4 5.6-.9 1.3 4.2 12.1H5.5l4.2-12.1-.9-1.3zM8.9 9.4h6.2',
    skirt: 'M7.5 5h9l3.5 15.5c-5 1-11 1-16 0zM7.5 7h9M10 7l-1.4 13.6M14 7l1.4 13.6M12 7v14',
    leggings: 'M7.8 2.5h8.4l-.7 19h-3L12 10.2l-.5 11.3h-3zM7.8 4.4h8.4',
    tracksuit: 'M9 2.6l3 1.6 3-1.6 4.4 2 1.6 6.4-2.4.6-.6-2.6V21.4H6V9l-.6 2.6L3 11 4.6 4.6zM12 4.2V21.4M6.5 9.5v11.9M17.5 9.5v11.9',
    sneaker: 'M2 15.8c0-1.3.6-4.1 1.4-5.3l3.4 1 2.7-2.2 2.2 2.6 5 1.7c2.8.9 5.3 2.3 5.3 4.2v1.2H2zM2 17.6h20M9.5 10.4l1 2M11.3 9.8l1 2M13.2 12.3h2',
    wallet: 'M3.5 6.5h15.2a1.8 1.8 0 0 1 1.8 1.8v9.4a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8zM3.5 6.5l11.4-2.6 1.1 2.6M15.5 11.4h5v3.4h-5a1.7 1.7 0 0 1 0-3.4z',
    bag: 'M7 6.5h10a2.5 2.5 0 0 1 2.5 2.5v11.2a1.3 1.3 0 0 1-1.3 1.3H5.8a1.3 1.3 0 0 1-1.3-1.3V9A2.5 2.5 0 0 1 7 6.5zM9.2 6.5V5a2.8 2.8 0 0 1 5.6 0v1.5M7.4 13.5h9.2v5H7.4zM12 13.5v1.6',
    cushion: 'M4.5 5c2.5 1.2 12.5 1.2 15 0 1.2 4.6 1.2 9.4 0 14-2.5-1.2-12.5-1.2-15 0-1.2-4.6-1.2-9.4 0-14zM8.4 12c2.4-1.6 4.8-1.6 7.2 0-2.4 1.6-4.8 1.6-7.2 0z',
    throw: 'M4 4.5h16v15H4zM4 4.5l-1 1.6M4 19.5l-1-1.6M20 4.5l1 1.6M20 19.5l1-1.6M4 9h16M4 15h16M9 4.5v15M15 4.5v15',
    candle: 'M7 10h10v10.5a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1zM7 13h10M12 10V7.5M12 2.8c1.3 1.4 1.4 3 0 4.3-1.4-1.3-1.3-2.9 0-4.3z',
    robe: 'M8.6 2.8L12 6.6l3.4-3.8 4.6 2.4-1.6 6-1.9-.6V21H7.5v-10.4l-1.9.6-1.6-6zM12 6.6L9.4 21M12 6.6l3 7M8 13.5h8',
    poster: 'M5.5 3h13v18h-13zM7.5 5h9v11h-9zM7.5 13.5l2.6-3.2 2.4 2.4 1.7-1.8 2.3 2.6M14.5 7.8h.01',
    kimono: 'M6 4l6 4 6-4 3 6-4 2v8H7v-8L3 10zM12 8v12',
  };
  var GLYPH0 = {
    jacket: 'M8 4l4 2 4-2 4 4-2 3v9H6v-9L4 8zM12 6v14', bomber: 'M8 4l4 2 4-2 4 4-2 3v9H6v-9L4 8zM6 18h12',
    shirt: 'M8 4l4 3 4-3 4 4-2 3v9H6v-9L4 8zM12 7v13', cargo: 'M8 3h8l1 18h-4l-1-10-1 10H7zM7 11h3M14 11h3',
    jeans: 'M8 3h8l1 18h-4l-1-11-1 11H7zM8 6h8', dress: 'M9 3h6l-1 5 4 13H6l4-13z', skirt: 'M7 6h10l3 14H4z',
    leggings: 'M8 3h8l-1 18h-3l0-11-0 11H9z', sneaker: 'M3 15l2-6 5 2 4-1 7 4v3H3zM3 18h18',
    wallet: 'M4 7h16v11H4zM16 12h4', bag: 'M7 8h10l1 12H6zM9 8a3 3 0 0 1 6 0M8 13h8',
    kimono: 'M6 4l6 4 6-4 3 6-4 2v8H7v-8L3 10zM12 8v12', cushion: 'M5 6c3 1 11 1 14 0 1 4 1 8 0 12-3-1-11-1-14 0-1-4-1-8 0-12z',
    throw: 'M4 5h16v14H4zM4 9h16M4 15h16', candle: 'M8 9h8v11H8zM12 9V6M12 3c1 1 1 2 0 3-1-1-1-2 0-3z',
    robe: 'M8 4l4 4 4-4 3 5-2 1v10H7V10L5 9zM10 13h4', poster: 'M6 3h12v18H6zM9 15l2-3 2 2 2-3 1 4z',
  };

  function ProductImage(p) {
    var prod = p.product, color = p.color || (prod.colors && prod.colors[0]), alt = prod.name;
    var st = useState(null), src = st[0], setSrc = st[1];
    useEffect(function () {
      var alive = true;
      if (prod.mock && color && MOCK[prod.mock]) tinted(prod.mock, color.hex).then(function (u) { if (alive) setSrc(u); }).catch(function () {});
      return function () { alive = false; };
    }, [prod.sku, color && color.hex]);
    if (prod.mock && MOCK[prod.mock]) {
      return h('div', { className: 'pm', style: p.style },
        src ? h('img', { src: src, alt: alt, style: { objectFit: 'contain', padding: '9%' }, loading: 'lazy' }) : null);
    }
    if (prod.photo && !p.flat) return h('div', { className: 'pm', style: p.style }, h('img', { src: prod.photo, alt: alt, loading: 'lazy' }));
    // Silhueta "flat-lay": peça preenchida na cor real sobre fundo neutro (estilo estúdio)
    var fillHex = color ? color.hex : '#D9D6CF';
    var L = lum(fillHex), strokeC = L > 0.8 ? 'rgba(17,17,17,.28)' : 'rgba(0,0,0,.22)';
    var gid = 'g' + prod.id.replace(/\W/g, '') + fillHex.replace('#', '');
    return h('div', { className: 'pm pm-flat', style: p.style },
      h('div', { className: 'glyph' },
        h('svg', { width: '62%', height: '62%', viewBox: '0 0 24 24', style: { overflow: 'visible', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.14))' } },
          h('defs', null, h('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 },
            h('stop', { offset: '0', stopColor: '#fff', stopOpacity: L > 0.8 ? 0 : 0.18 }),
            h('stop', { offset: '1', stopColor: '#000', stopOpacity: 0.12 }))),
          h('path', { d: GLYPH[prod.kind] || GLYPH.bag, fill: fillHex, fillRule: 'nonzero', stroke: 'none' }),
          h('path', { d: GLYPH[prod.kind] || GLYPH.bag, fill: 'url(#' + gid + ')', stroke: 'none' }),
          h('path', { d: GLYPH[prod.kind] || GLYPH.bag, fill: 'none', stroke: L > 0.5 ? 'rgba(20,20,20,.32)' : 'rgba(255,255,255,.22)', strokeWidth: 0.32, strokeLinejoin: 'round', strokeLinecap: 'round' }))));
  }

  // ───── router (hash) ─────
  function parse() {
    var raw = (location.hash || '#/').slice(1);
    var q = raw.split('?'), parts = q[0].split('/').filter(Boolean), params = {};
    (q[1] || '').split('&').forEach(function (kv) { if (!kv) return; var a = kv.split('='); params[decodeURIComponent(a[0])] = decodeURIComponent(a[1] || ''); });
    return { name: parts[0] || 'home', id: parts[1] || null, params: params };
  }
  function go(path) { if (location.hash !== '#' + path) location.hash = path; window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' }); }
  function useRoute() {
    var s = useState(parse()), r = s[0], set = s[1];
    useEffect(function () { var f = function () { set(parse()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', f); return function () { window.removeEventListener('hashchange', f); }; }, []);
    return r;
  }

  // ───── persistência ─────
  function load(k, d) { try { var v = localStorage.getItem('kn5-' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem('kn5-' + k, JSON.stringify(v)); } catch (e) {} }

  // ───── store (contexto) ─────
  var Ctx = R.createContext(null);
  var PROMOS = { WELCOME10: { pct: 10, min: 30, label: '10% de boas-vindas' }, KARMIC15: { pct: 15, min: 80, label: '15% em compras acima de 80 €' } };

  function StoreProvider(props) {
    var cS = useState(function () { return load('cart', []); }), cart = cS[0], setCart = cS[1];
    var wS = useState(function () { return load('wish', []); }), wish = wS[0], setWish = wS[1];
    var rS = useState(function () { return load('recent', []); }), recent = rS[0], setRecent = rS[1];
    var oS = useState(function () { return load('orders', []); }), orders = oS[0], setOrders = oS[1];
    var pS = useState(function () { return load('promo', null); }), promo = pS[0], setPromo = pS[1];
    var cartOpenS = useState(false), cartOpen = cartOpenS[0], setCartOpen = cartOpenS[1];
    var tS = useState(null), toast = tS[0], setToast = tS[1];
    var tRef = useRef(0);

    useEffect(function () { save('cart', cart); }, [cart]);
    useEffect(function () { save('wish', wish); }, [wish]);
    useEffect(function () { save('recent', recent); }, [recent]);
    useEffect(function () { save('orders', orders); }, [orders]);
    useEffect(function () { save('promo', promo); }, [promo]);

    var byId = useMemo(function () { var m = {}; window.KN_PRODUCTS.forEach(function (p) { m[p.id] = p; }); return m; }, []);
    function notify(msg, action) { clearTimeout(tRef.current); setToast({ msg: msg, action: action }); tRef.current = setTimeout(function () { setToast(null); }, 3600); }

    function lineKey(l) { return l.id + '|' + (l.color || '') + '|' + (l.size || '') + '|' + (l.note || '') + '|' + (l.design ? JSON.stringify(l.design) : ''); }
    function add(p, opts, qty) {
      opts = opts || {};
      var line = { id: p.id, color: opts.color || null, size: opts.size || null, note: opts.note || '', extra: opts.extra || 0, thumb: opts.thumb || null, design: opts.design || null, qty: qty || 1 };
      setCart(function (c) {
        var k = lineKey(line), found = false;
        var next = c.map(function (l) { if (lineKey(l) === k) { found = true; return Object.assign({}, l, { qty: Math.min(10, l.qty + line.qty) }); } return l; });
        return found ? next : next.concat([line]);
      });
      setCartOpen(true);
    }
    function setQty(i, q) { setCart(function (c) { return q <= 0 ? c.filter(function (_, j) { return j !== i; }) : c.map(function (l, j) { return j === i ? Object.assign({}, l, { qty: Math.min(10, q) }) : l; }); }); }
    function remove(i) {
      var removed = cart[i];
      setCart(function (c) { return c.filter(function (_, j) { return j !== i; }); });
      notify('Artigo removido.', { label: 'Anular', fn: function () { setCart(function (c) { var n = c.slice(); n.splice(i, 0, removed); return n; }); setToast(null); } });
    }
    function toggleWish(id) {
      var on = wish.indexOf(id) >= 0;
      setWish(function (w) { return on ? w.filter(function (x) { return x !== id; }) : [id].concat(w); });
      notify(on ? 'Removido dos favoritos.' : 'Guardado nos favoritos.', on ? null : { label: 'Ver', fn: function () { go('/favoritos'); setToast(null); } });
    }
    function viewed(id) { setRecent(function (r) { return [id].concat(r.filter(function (x) { return x !== id; })).slice(0, 12); }); }

    var lines = cart.map(function (l) { var p = byId[l.id]; return p ? Object.assign({}, l, { p: p, unit: p.price + (l.extra || 0), total: (p.price + (l.extra || 0)) * l.qty }) : null; }).filter(Boolean);
    var count = lines.reduce(function (s, l) { return s + l.qty; }, 0);
    var subtotal = lines.reduce(function (s, l) { return s + l.total; }, 0);
    var promoDef = promo && PROMOS[promo];
    var discount = promoDef && subtotal >= promoDef.min ? Math.round(subtotal * promoDef.pct) / 100 : 0;

    function applyPromo(code) {
      var c = (code || '').trim().toUpperCase();
      if (!c) return 'Escreve um código.';
      var d = PROMOS[c];
      if (!d) return 'Este código não existe ou já expirou.';
      if (subtotal < d.min) return 'Este código é válido a partir de ' + eur(d.min) + '. Faltam ' + eur(d.min - subtotal) + '.';
      setPromo(c); return null;
    }
    function placeOrder(info) {
      var n = 'KN' + String(Date.now()).slice(-6);
      var ship = info.shipping === 'exp' ? CFG.shipExp : info.shipping === 'pickup' ? 0 : (subtotal - discount >= CFG.freeShip ? 0 : CFG.shipStd);
      var o = { n: n, at: Date.now(), lines: lines.map(function (l) { return { id: l.id, name: l.p.name, color: l.color, size: l.size, note: l.note, qty: l.qty, price: l.unit, thumb: l.thumb }; }),
        subtotal: subtotal, discount: discount, ship: ship, total: Math.max(0, subtotal - discount + ship), info: info, eta: deliveryWindow(info.shipping === 'exp' ? 'exp' : 'std') };
      setOrders(function (x) { return [o].concat(x); });
      setCart([]); setPromo(null);
      return o;
    }

    var api = { cart: lines, count: count, subtotal: subtotal, discount: discount, promo: promo, promoDef: promoDef, add: add, setQty: setQty, remove: remove, applyPromo: applyPromo, clearPromo: function () { setPromo(null); },
      wish: wish, toggleWish: toggleWish, recent: recent, viewed: viewed, orders: orders, placeOrder: placeOrder,
      cartOpen: cartOpen, setCartOpen: setCartOpen, toast: toast, setToast: setToast, notify: notify, byId: byId };
    return h(Ctx.Provider, { value: api }, props.children);
  }
  function useStore() { return useContext(Ctx); }

  function Stars(p) {
    return h('span', { className: 'stars', 'aria-label': p.v + ' de 5 estrelas' }, h(Icon, { n: 'star', s: 14, fill: true, w: 0 }), h('b', null, p.v.toFixed(1)), p.n != null ? h('span', { className: 'muted' }, '(' + p.n + ')') : null);
  }

  window.KN = { tinted: tinted, MOCK: MOCK, loadImg: loadImg, lum: lum, CFG: CFG, eur: eur, norm: norm, deliveryWindow: deliveryWindow, cutoffLeft: cutoffLeft, Icon: Icon, ProductImage: ProductImage, Stars: Stars, go: go, useRoute: useRoute, StoreProvider: StoreProvider, useStore: useStore, PROMOS: PROMOS };
})();
