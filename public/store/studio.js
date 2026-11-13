// Karmic Node — Estúdio de personalização v2 (camadas, frente/costas, alças, ideias prontas)
(function () {
  'use strict';
  var R = React, h = R.createElement, useState = R.useState, useEffect = R.useEffect, useRef = R.useRef, useMemo = R.useMemo, useCallback = R.useCallback;
  var K = window.KN, Icon = K.Icon, eur = K.eur, E = K.StudioEngine;

  var uid = function () { return 'L' + Math.random().toString(36).slice(2, 8); };
  function enc(o) { try { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); } catch (e) { return ''; } }
  function dec(s) { try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { return null; } }

  var TEMPLATES = [
    { id: 'name', label: 'Nome no peito', front: [{ type: 'text', text: 'Sofia', font: 'script', color: '#C9A15B', zone: 'chest-l' }] },
    { id: 'mono', label: 'Monograma', front: [{ type: 'mono', text: 'RS', style: 'circle', color: '#111111', zone: 'chest-l' }] },
    { id: 'est', label: 'Est. + ano', front: [{ type: 'text', text: 'EST.', font: 'sans', color: '#8B1E2D', zone: 'center', s: .14, y: -.04, spacing: .3 }, { type: 'text', text: '2026', font: 'varsity', color: '#8B1E2D', zone: 'center', s: .28, y: .04 }] },
    { id: 'team', label: 'Nome e número', front: [{ type: 'text', text: 'SILVA', font: 'varsity', color: '#F4EFE6', zone: 'chest-l' }], back: [{ type: 'text', text: 'SILVA', font: 'varsity', color: '#F4EFE6', zone: 'back', s: .3, y: -.12, curve: .45 }, { type: 'text', text: '10', font: 'varsity', color: '#F4EFE6', zone: 'back', s: .26, y: .05 }] },
    { id: 'badge', label: 'Emblema', front: [{ type: 'graphic', g: 'emblem', color: '#C9A15B', zone: 'chest-l' }], back: [{ type: 'text', text: 'KARMIC NODE', font: 'serif', color: '#C9A15B', zone: 'nape', spacing: .18 }] },
    { id: 'quote', label: 'Frase', front: [{ type: 'text', text: 'Carpe Diem', font: 'serif', color: '#111111', zone: 'center', curve: .35 }] },
  ];
  var IDEAS = ['Sofia', 'Mãe', '1987', 'Cartaxo', 'Família Silva', 'Est. 2026', 'Carpe Diem', 'Amor'];

  function zoneFor(mock, view, id) { var z = (E.PRESETS[mock] || E.PRESETS.tshirt)[view] || []; return z.find(function (q) { return q[0] === id; }) || z[0]; }
  function mkLayer(base, mock, view) {
    var z = zoneFor(mock, view, base.zone) || ['c', '', .5, .4, .3];
    return Object.assign({ id: uid(), x: z[2], y: z[3] + (base.y || 0), s: base.s || z[4], r: 0, color: '#111111', spacing: 0, curve: 0, outline: false }, base, { zone: undefined, y: z[3] + (base.y || 0) });
  }

  function Studio(p) {
    var st = K.useStore();
    var prods = useMemo(function () { return window.KN_PRODUCTS.filter(function (x) { return x.custom && x.mock && K.MOCK[x.mock]; }); }, []);
    var shared = p.route.params.d ? dec(p.route.params.d) : null;
    var saved = (function () { try { return JSON.parse(localStorage.getItem('kn5-studio')); } catch (e) { return null; } })();
    var start = prods.find(function (x) { return x.id === ((shared && shared.p) || p.route.params.p || (saved && saved.p)); }) || prods[0];
    var pS = useState(start), prod = pS[0], setProd = pS[1];
    var cS = useState(function () { var want = (shared && shared.c) || (saved && saved.p === start.id && saved.c); return (want && start.colors.find(function (c) { return c.name === want; })) || start.colors[0]; }), col = cS[0], setCol = cS[1];
    var initDesign = function () {
      if (shared && shared.views) return { tech: shared.tech || 'emb', views: shared.views };
      if (saved && saved.D && saved.p === start.id) return saved.D;
      return { tech: 'emb', views: { front: [mkLayer(TEMPLATES[0].front[0], start.mock, 'front')], back: [] } };
    };
    var dS = useState(initDesign), D = dS[0], setDRaw = dS[1];
    var vS = useState('front'), view = vS[0], setView = vS[1];
    var selS = useState(function () { return D.views.front[0] ? D.views.front[0].id : null; }), sel = selS[0], setSel = selS[1];
    var tabS = useState('add'), tab = tabS[0], setTab = tabS[1];
    var szS = useState(null), size = szS[0], setSize = szS[1];
    var errS = useState(''), err = errS[0], setErr = errS[1];
    var cpS = useState(false), copied = cpS[0], setCopied = cpS[1];
    var zS = useState(1), zoom = zS[0], setZoom = zS[1];
    var gS = useState(false), guideX = gS[0], setGuideX = gS[1];
    var ovS = useState(false), over = ovS[0], setOver = ovS[1];
    var mkS = useState(null), mock = mkS[0], setMock = mkS[1];
    var tk = useState(0), tick = tk[0], setTick = tk[1];
    var hist = useRef({ past: [], future: [] });
    var cvRef = useRef(null), fileRef = useRef(null), geo = useRef({}), drag = useRef(null);
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var hasBack = !!(E.PRESETS[prod.mock] || {}).back;
    var layers = D.views[view] || [];
    var selL = layers.find(function (l) { return l.id === sel; }) || null;
    var light = K.lum(col.hex) > .6;
    var svS = useState(false), savedAt = svS[0], setSavedAt = svS[1];
    var cmS = useState(false), compare = cmS[0], setCompare = cmS[1];
    var cv2Ref = useRef(null);
    useEffect(function () { var tm = setTimeout(function () { try { var clean = JSON.parse(JSON.stringify(D)); ['front', 'back'].forEach(function (v) { clean.views[v] = (clean.views[v] || []).filter(function (l) { return l.type !== 'image'; }); }); localStorage.setItem('kn5-studio', JSON.stringify({ p: prod.id, c: col.name, D: clean })); setSavedAt(true); } catch (e) {} }, 500); return function () { clearTimeout(tm); }; }, [D, prod.id, col.name]);
    var thm = K.useTheme ? K.useTheme()[0] : 'light';

    function commit(fn, push) {
      setDRaw(function (prev) {
        var next = fn(JSON.parse(JSON.stringify(prev)));
        if (push !== false) { hist.current.past.push(prev); if (hist.current.past.length > 60) hist.current.past.shift(); hist.current.future = []; }
        return next;
      });
    }
    function upd(id, patch, push) { commit(function (d) { d.views[view] = d.views[view].map(function (l) { return l.id === id ? Object.assign(l, patch) : l; }); return d; }, push); }
    function addLayer(base) {
      if (layers.length >= 4) { setErr('Máximo de 4 elementos por vista.'); return; }
      var L = mkLayer(base, prod.mock, view);
      if (layers.length) { L.y = Math.min(.8, L.y + .06 * layers.length); }
      commit(function (d) { d.views[view] = d.views[view].concat([L]); return d; }); setSel(L.id); setTab('edit'); setErr('');
    }
    function removeLayer(id) { commit(function (d) { d.views[view] = d.views[view].filter(function (l) { return l.id !== id; }); return d; }); setSel(null); }
    function dupLayer(id) { var L = layers.find(function (l) { return l.id === id; }); if (!L || layers.length >= 4) return; var n = Object.assign({}, L, { id: uid(), x: Math.min(.8, L.x + .04), y: Math.min(.85, L.y + .04) }); commit(function (d) { d.views[view] = d.views[view].concat([n]); return d; }); setSel(n.id); }
    function moveLayer(id, dir) { commit(function (d) { var a = d.views[view], i = a.findIndex(function (l) { return l.id === id; }), j = i + dir; if (i < 0 || j < 0 || j >= a.length) return d; var t = a[i]; a[i] = a[j]; a[j] = t; return d; }); }
    function undo() { var hp = hist.current; if (!hp.past.length) return; setDRaw(function (cur) { hp.future.push(cur); return hp.past.pop(); }); }
    function redo() { var hp = hist.current; if (!hp.future.length) return; setDRaw(function (cur) { hp.past.push(cur); return hp.future.pop(); }); }
    function fit(b) {
      // garante contraste: cor clara em peça clara passa a tinta escura, e vice-versa
      var c = b.color || '#111111', lc = K.lum(c);
      if (light && lc > .75) c = '#111111'; else if (!light && lc < .2) c = '#F4EFE6';
      return Object.assign({}, b, { color: c });
    }
    function applyTemplate(t) {
      commit(function (d) {
        d.views.front = (t.front || []).map(function (b) { return mkLayer(fit(b), prod.mock, 'front'); });
        d.views.back = hasBack ? (t.back || []).map(function (b) { return mkLayer(fit(b), prod.mock, 'back'); }) : [];
        return d;
      });
      setView('front'); setSel(null); setTab('edit');
      setTimeout(function () { setDRaw(function (d) { setSel(d.views.front[0] ? d.views.front[0].id : null); return d; }); }, 0);
    }

    // teclado
    useEffect(function () {
      var k = function (e) {
        var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
        if (typing || !sel) return;
        var L = layers.find(function (l) { return l.id === sel; }); if (!L) return;
        var step = e.shiftKey ? .02 : .005;
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeLayer(sel); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); upd(sel, { x: L.x - step }); }
        if (e.key === 'ArrowRight') { e.preventDefault(); upd(sel, { x: L.x + step }); }
        if (e.key === 'ArrowUp') { e.preventDefault(); upd(sel, { y: L.y - step }); }
        if (e.key === 'ArrowDown') { e.preventDefault(); upd(sel, { y: L.y + step }); }
        if (e.key === 'Escape') setSel(null);
      };
      window.addEventListener('keydown', k); return function () { window.removeEventListener('keydown', k); };
    });

    // fontes + mockup
    useEffect(function () { if (document.fonts && document.fonts.load) Promise.all(E.FONTS.map(function (f) { return document.fonts.load(f.w + ' 40px ' + f.css); })).then(function () { setTick(function (n) { return n + 1; }); }); }, []);
    useEffect(function () { var alive = true; setMock(null); K.tinted(prod.mock, col.hex).then(function (u) { if (!alive) return; var i = new Image(); i.onload = function () { if (alive) setMock(i); }; i.src = u; }); return function () { alive = false; }; }, [prod.id, col.hex]);

    var draw = useCallback(function (forExport) {
      var cv = cvRef.current; if (!cv) return;
      var W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      var x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
      geo.current = E.render(x, W, H, { mock: mock, view: view, zoom: forExport ? 1 : zoom, layers: layers, tech: D.tech, light: light, area: (E.AREAS[prod.mock] || {})[view], showArea: !forExport && !!drag.current, sel: forExport ? null : sel, handles: !forExport, guideX: !forExport && guideX, redraw: function () { setTick(function (n) { return n + 1; }); } });
    }, [mock, view, zoom, layers, D.tech, light, sel, guideX, tick, prod.mock]);
    useEffect(function () { draw(); }, [draw]);
    useEffect(function () {
      if (!compare || !hasBack) return; var cv = cv2Ref.current; if (!cv || !mock) return;
      var W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); var ov = view === 'front' ? 'back' : 'front';
      E.render(x, W, H, { mock: mock, view: ov, layers: D.views[ov] || [], tech: D.tech, light: light, redraw: function () { setTick(function (n) { return n + 1; }); } });
    }, [compare, mock, view, D, light, tick, hasBack]);
    useEffect(function () { var ro = new ResizeObserver(function () { draw(); }); if (cvRef.current) ro.observe(cvRef.current); return function () { ro.disconnect(); }; }, [draw]);

    // ───── interação no canvas ─────
    function local(e) { var r = cvRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function toBox(pt, b) { var a = -b.r * Math.PI / 180, dx = pt.x - b.cx, dy = pt.y - b.cy; return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) }; }
    function hit(pt) {
      var g = geo.current, hd = g.handles;
      if (hd && sel) {
        var q = toBox(pt, { cx: hd.cx, cy: hd.cy, r: hd.r });
        if (Math.hypot(q.x - hd.hw, q.y - hd.hh) < 13) return { kind: 'scale', id: sel };
        if (Math.hypot(q.x, q.y + hd.hh + 22) < 13) return { kind: 'rot', id: sel };
        if (Math.hypot(q.x - hd.hw, q.y + hd.hh) < 13) return { kind: 'del', id: sel };
      }
      for (var i = layers.length - 1; i >= 0; i--) {
        var L = layers[i], b = g.boxes[L.id]; if (!b || L.hidden) continue;
        var q2 = toBox(pt, b); if (Math.abs(q2.x) <= b.bw / 2 + 8 && Math.abs(q2.y) <= b.bh / 2 + 8) return { kind: 'move', id: L.id };
      }
      return null;
    }
    var pts = useRef({});
    function onDown(e) {
      var pt = local(e), t = hit(pt);
      pts.current[e.pointerId] = pt;
      if (Object.keys(pts.current).length === 2 && sel) { var ks = Object.keys(pts.current), a = pts.current[ks[0]], b = pts.current[ks[1]], L0 = layers.find(function (l) { return l.id === sel; }); drag.current = { kind: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), a0: Math.atan2(b.y - a.y, b.x - a.x), s0: L0.s, r0: L0.r, base: D }; return; }
      if (!t) { setSel(null); return; }
      if (t.kind === 'del') { removeLayer(t.id); return; }
      cvRef.current.setPointerCapture(e.pointerId);
      setSel(t.id); setTab('edit');
      var L = layers.find(function (l) { return l.id === t.id; }), g = geo.current, b = g.boxes[t.id];
      drag.current = { kind: t.kind, id: t.id, sx: pt.x, sy: pt.y, x0: L.x, y0: L.y, s0: L.s, r0: L.r || 0, cx: b.cx, cy: b.cy, d0: Math.hypot(pt.x - b.cx, pt.y - b.cy), a0: Math.atan2(pt.y - b.cy, pt.x - b.cx), base: D };
      draw();
    }
    function onMove(e) {
      if (!pts.current[e.pointerId]) { var t = hit(local(e)); cvRef.current.style.cursor = t ? (t.kind === 'move' ? 'move' : t.kind === 'rot' ? 'grab' : t.kind === 'del' ? 'pointer' : 'nwse-resize') : 'default'; return; }
      var pt = local(e); pts.current[e.pointerId] = pt;
      var dg = drag.current; if (!dg) return; var g = geo.current;
      if (dg.kind === 'pinch') { var ks = Object.keys(pts.current); if (ks.length < 2) return; var a = pts.current[ks[0]], b = pts.current[ks[1]]; upd(sel, { s: Math.max(.05, Math.min(.7, dg.s0 * Math.hypot(a.x - b.x, a.y - b.y) / dg.d0)), r: Math.round(dg.r0 + (Math.atan2(b.y - a.y, b.x - a.x) - dg.a0) * 180 / Math.PI) }, false); return; }
      if (dg.kind === 'move') {
        var nx = dg.x0 + (pt.x - dg.sx) / g.mw, ny = dg.y0 + (pt.y - dg.sy) / g.mh, snap = Math.abs(nx - .5) < .012;
        if (snap) nx = .5; setGuideX(snap);
        upd(dg.id, { x: Math.max(.08, Math.min(.92, nx)), y: Math.max(.08, Math.min(.92, ny)) }, false);
      } else if (dg.kind === 'scale') {
        upd(dg.id, { s: Math.max(.05, Math.min(.7, dg.s0 * Math.hypot(pt.x - dg.cx, pt.y - dg.cy) / (dg.d0 || 1))) }, false);
      } else if (dg.kind === 'rot') {
        var ang = Math.round(dg.r0 + (Math.atan2(pt.y - dg.cy, pt.x - dg.cx) - dg.a0) * 180 / Math.PI);
        [0, 90, -90, 180, -180].forEach(function (s) { if (Math.abs(ang - s) < 4) ang = s; });
        upd(dg.id, { r: ang }, false);
      }
    }
    function onUp(e) {
      delete pts.current[e.pointerId];
      if (drag.current && !Object.keys(pts.current).length) { hist.current.past.push(drag.current.base); hist.current.future = []; drag.current = null; setGuideX(false); draw(); }
    }
    useEffect(function () {
      var c = cvRef.current; if (!c) return;
      var w = function (e) { if (!sel) return; e.preventDefault(); var L = layers.find(function (l) { return l.id === sel; }); if (L) upd(sel, { s: Math.max(.05, Math.min(.7, L.s * (e.deltaY < 0 ? 1.05 : .95))) }, false); };
      c.addEventListener('wheel', w, { passive: false }); return function () { c.removeEventListener('wheel', w); };
    });

    // ───── imagem própria ─────
    function loadFile(f) {
      if (!f || !/^image\//.test(f.type)) { setErr('Escolhe uma imagem (PNG, JPG ou SVG).'); return; }
      if (f.size > 15 * 1024 * 1024) { setErr('A imagem tem mais de 15 MB.'); return; }
      var rd = new FileReader(); rd.onload = function () {
        var im = new Image(); im.onload = function () {
          var max = 1400, s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
          var x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height);
          try { var data = x.getImageData(0, 0, c.width, c.height), px = data.data; for (var i = 0; i < px.length; i += 4) { var m = Math.min(px[i], px[i + 1], px[i + 2]); if (m > 238) px[i + 3] = 0; else if (m > 220) px[i + 3] = Math.round(px[i + 3] * (238 - m) / 18); } x.putImageData(data, 0, 0); } catch (e2) {}
          addLayer({ type: 'image', src: c.toDataURL('image/png'), iw: c.width, ih: c.height, ow: im.width, oh: im.height, name: f.name, zone: 'center' });
        }; im.src = rd.result;
      }; rd.readAsDataURL(f);
    }

    // ───── preço ─────
    var nF = D.views.front.length, nB = hasBack ? D.views.back.length : 0, hasImg = D.views.front.concat(D.views.back).some(function (l) { return l.type === 'image'; });
    var tech = E.TECH[D.tech];
    var costF = nF ? tech.price + Math.max(0, nF - 1) * 3 : 0, costB = nB ? tech.extra + Math.max(0, nB - 1) * 3 : 0;
    var extra = costF + costB + (hasImg ? 4 : 0), total = prod.price + extra;

    function pickProd(x) {
      setProd(x); setCol(x.colors[0]); setSize(x.sizes.length === 1 ? x.sizes[0] : null);
      if (!(E.PRESETS[x.mock] || {}).back) setView('front');
      commit(function (d) { if (!(E.PRESETS[x.mock] || {}).back) d.views.back = []; return d; });
    }
    function snapshot() { try { return cvRef.current.toDataURL('image/png'); } catch (e) { return null; } }
    function exportSnap() { var prev = sel; setSel(null); draw(true); var u = snapshot(); setSel(prev); return u; }
    function download() { var u = exportSnap(); if (!u) return; var a = document.createElement('a'); a.href = u; a.download = 'karmic-node-' + view + '.png'; document.body.appendChild(a); a.click(); a.remove(); }
    function share() {
      var views = { front: D.views.front.filter(function (l) { return l.type !== 'image'; }), back: D.views.back.filter(function (l) { return l.type !== 'image'; }) };
      var url = location.href.split('#')[0] + '#/personalizar?d=' + enc({ p: prod.id, c: col.name, tech: D.tech, views: views });
      var done = function () { setCopied(true); setTimeout(function () { setCopied(false); }, 2200); };
      if (navigator.share && /Mobi/.test(navigator.userAgent)) navigator.share({ title: 'O meu design Karmic Node', url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copia o link:', url); });
      else prompt('Copia o link:', url);
    }
    function describe(l) { return l.type === 'text' ? '“' + l.text + '”' : l.type === 'mono' ? 'Monograma ' + (l.text || '').toUpperCase() : l.type === 'graphic' ? E.gOf(l.g).label : 'Imagem'; }
    function add() {
      if (!size) { setErr('Escolhe um tamanho para continuar.'); setTab('piece'); return; }
      setErr('');
      var parts = [];
      if (nF) parts.push('Frente: ' + D.views.front.map(describe).join(', '));
      if (nB) parts.push('Costas: ' + D.views.back.map(describe).join(', '));
      var note = (parts.length ? parts.join(' · ') + ' · ' + tech.label : '').slice(0, 160);
      st.add(prod, { color: col.name, size: size, note: note, extra: extra, thumb: exportSnap(), design: { tech: D.tech, views: D.views } });
    }

    // ───── painéis ─────
    var TABS = [['piece', 'Peça'], ['add', 'Adicionar'], ['edit', 'Editar'], ['finish', 'Acabamento']];
    var panel;
    if (tab === 'piece') {
      panel = h(R.Fragment, null,
        h('div', { className: 'sx-h' }, 'Peça', h('span', null, eur(prod.price))),
        h('div', { className: 'st-prods' }, prods.map(function (x) { return h('button', { key: x.id, className: x.id === prod.id ? 'on' : '', onClick: function () { pickProd(x); }, 'aria-pressed': x.id === prod.id }, h(Thumb, { prod: x }), x.name.split(' ')[0]); })),
        h('div', { className: 'sx-h' }, 'Cor', h('span', null, col.name)),
        h('div', { className: 'colors' }, prod.colors.map(function (c) { return h('button', { key: c.name, className: c.name === col.name ? 'on' : '', style: { background: c.hex }, 'aria-label': c.name, title: c.name, onClick: function () { setCol(c); } }); })),
        prod.sizes.length > 1 ? h(R.Fragment, null, h('div', { className: 'sx-h' }, 'Tamanho', h('a', { className: 'link', href: '#/ajuda' }, 'Guia')),
          h('div', { className: 'sizes' }, prod.sizes.map(function (z) { return h('button', { key: z, className: size === z ? 'on' : '', onClick: function () { setSize(z); setErr(''); } }, z); }))) : null);
    } else if (tab === 'add') {
      panel = h(R.Fragment, null,
        h('div', { className: 'sx-h' }, 'Adicionar à ' + (view === 'front' ? 'frente' : 'costas'), h('span', null, layers.length + '/4')),
        h('div', { className: 'sx-add' },
          h('button', { onClick: function () { addLayer({ type: 'text', text: 'O teu texto', font: 'serif', color: light ? '#111111' : '#F4EFE6', zone: view === 'front' ? 'chest-l' : 'back' }); } }, h('b', { style: { fontFamily: 'var(--serif)', fontSize: 26 } }, 'Aa'), 'Texto'),
          h('button', { onClick: function () { addLayer({ type: 'mono', text: 'KN', style: 'circle', color: '#C9A15B', zone: view === 'front' ? 'chest-l' : 'nape' }); } }, h('b', { className: 'sx-mono' }, 'KN'), 'Monograma'),
          h('button', { onClick: function () { setTab('graphics'); } }, h('svg', { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: E.GRAPHICS[0].d })), 'Gráfico'),
          h('button', { onClick: function () { fileRef.current && fileRef.current.click(); } }, h(Icon, { n: 'plus', s: 24 }), 'Imagem')),
        h('div', { className: 'drop' + (over ? ' over' : ''), style: { marginTop: 10 }, onClick: function () { fileRef.current && fileRef.current.click(); }, onDragOver: function (e) { e.preventDefault(); setOver(true); }, onDragLeave: function () { setOver(false); }, onDrop: function (e) { e.preventDefault(); setOver(false); loadFile(e.dataTransfer.files[0]); }, role: 'button', tabIndex: 0 },
          h('b', null, 'Arrasta aqui o teu logótipo'), h('span', { className: 'muted', style: { fontSize: 12 } }, 'PNG, JPG ou SVG · o fundo branco sai sozinho')),
        h('input', { ref: fileRef, type: 'file', accept: 'image/*', hidden: true, onChange: function (e) { loadFile(e.target.files[0]); e.target.value = ''; } }),
        h('div', { className: 'sx-h' }, 'Ideias prontas', h('span', null, 'um clique')),
        h('div', { className: 'sx-tpl' }, TEMPLATES.map(function (t) { return h('button', { key: t.id, onClick: function () { applyTemplate(t); } }, h(TplPreview, { t: t }), t.label); })));
    } else if (tab === 'graphics') {
      panel = h(R.Fragment, null,
        h('div', { className: 'sx-h' }, h('button', { className: 'link', onClick: function () { setTab('add'); } }, '← Adicionar'), h('span', null, E.GRAPHICS.length + ' gráficos')),
        h('div', { className: 'sx-gfx' }, E.GRAPHICS.map(function (g) {
          return h('button', { key: g.id, title: g.label, 'aria-label': g.label, onClick: function () { addLayer({ type: 'graphic', g: g.id, color: light ? '#111111' : '#F4EFE6', zone: view === 'front' ? 'chest-l' : 'back', s: view === 'front' ? .14 : .3 }); } },
            g.img ? h('img', { src: g.img, alt: '' }) : h('svg', { width: 30, height: 30, viewBox: '0 0 24 24', fill: g.fill ? 'currentColor' : 'none', stroke: g.fill ? 'none' : 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: g.d })));
        })));
    } else if (tab === 'edit') {
      panel = h(R.Fragment, null,
        h('div', { className: 'sx-h' }, 'Camadas · ' + (view === 'front' ? 'frente' : 'costas'), h('button', { className: 'link', onClick: function () { setTab('add'); } }, '+ Adicionar')),
        layers.length ? h('div', { className: 'sx-layers' }, layers.slice().reverse().map(function (l) {
          var i = layers.indexOf(l);
          return h('div', { key: l.id, className: 'sx-layer' + (l.id === sel ? ' on' : ''), onClick: function () { setSel(l.id); } },
            h('span', { className: 'sx-li', style: { color: l.color } }, l.type === 'text' ? 'Aa' : l.type === 'mono' ? 'M' : l.type === 'graphic' ? '✦' : '▣'),
            h('span', { className: 'sx-ln' }, describe(l)),
            h('button', { onClick: function (e) { e.stopPropagation(); moveLayer(l.id, 1); }, disabled: i === layers.length - 1, 'aria-label': 'Subir camada', title: 'Para a frente' }, '↑'),
            h('button', { onClick: function (e) { e.stopPropagation(); moveLayer(l.id, -1); }, disabled: i === 0, 'aria-label': 'Descer camada', title: 'Para trás' }, '↓'),
            h('button', { onClick: function (e) { e.stopPropagation(); upd(l.id, { hidden: !l.hidden }); }, 'aria-label': l.hidden ? 'Mostrar' : 'Esconder', title: l.hidden ? 'Mostrar' : 'Esconder', style: { opacity: l.hidden ? .4 : 1 } }, '◉'),
            h('button', { onClick: function (e) { e.stopPropagation(); removeLayer(l.id); }, 'aria-label': 'Apagar camada', title: 'Apagar' }, '×'));
        })) : h('p', { className: 'muted', style: { fontSize: 14, margin: '4px 0 0' } }, 'Esta vista ainda está vazia. Adiciona um texto, monograma, gráfico ou imagem.'),
        selL ? h(Editor, { L: selL, upd: function (patch, push) { upd(selL.id, patch, push); }, onDup: function () { dupLayer(selL.id); }, onDel: function () { removeLayer(selL.id); }, onCenter: function () { upd(selL.id, { x: .5 }); }, light: light, tech: D.tech }) : null);
    } else {
      panel = h(R.Fragment, null,
        h('div', { className: 'sx-h' }, 'Técnica'),
        h('div', { className: 'sx-tech' }, ['emb', 'print'].map(function (t) {
          var T = E.TECH[t];
          return h('button', { key: t, className: D.tech === t ? 'on' : '', onClick: function () { commit(function (d) { d.tech = t; return d; }); } },
            h('b', null, T.label), h('span', null, T.desc), h('em', null, 'desde +' + eur(T.price) + ' · ' + T.days));
        })),
        hasImg && D.tech === 'emb' ? h('div', { className: 'warn', style: { marginTop: 10 } }, 'As imagens são sempre impressas, mesmo com bordado escolhido.') : null,
        h('div', { className: 'sx-h' }, 'Como calculamos'),
        h('div', { className: 'st-sum' },
          h('div', null, h('span', null, 'Peça'), h('span', null, eur(prod.price))),
          nF ? h('div', null, h('span', null, 'Frente · ' + nF + (nF > 1 ? ' elementos' : ' elemento')), h('span', null, '+ ' + eur(costF))) : null,
          nB ? h('div', null, h('span', null, 'Costas · ' + nB + (nB > 1 ? ' elementos' : ' elemento')), h('span', null, '+ ' + eur(costB))) : null,
          hasImg ? h('div', null, h('span', null, 'Preparação de imagem'), h('span', null, '+ ' + eur(4))) : null,
          h('div', { className: 'muted', style: { fontSize: 13 } }, h('span', null, 'Prova por email antes de produzir'), h('span', null, 'Incluída')),
          h('div', { className: 'tot' }, h('span', null, 'Total'), h('span', null, eur(total)))));
    }

    var empty = !D.views.front.length && !D.views.back.length;
    var steps = [['piece', 'Peça e cor', true], ['add', 'Design', !empty], ['finish', 'Acabamento', !empty], ['size', 'Tamanho', !!size]];
    var next = !size ? { label: 'Escolher tamanho', go: function () { setTab('piece'); setTimeout(function () { var el = document.querySelector('.sx-body .sizes'), b = document.querySelector('.sx-body'); if (el && b) { b.scrollTop = el.offsetTop - 80; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } }, 60); } } : null;
    return h('main', { className: 'sx' },
      h('div', { className: 'sx-stage' },
        h('div', { className: 'sx-bar' },
          hasBack ? h('div', { className: 'seg sx-views' }, [['front', 'Frente'], ['back', 'Costas']].map(function (v) { var n = (D.views[v[0]] || []).length; return h('button', { key: v[0], className: view === v[0] ? 'on' : '', onClick: function () { setView(v[0]); setSel(null); } }, v[1], n ? h('i', null, n) : null); })) : h('span', { className: 'muted', style: { fontSize: 13 } }, 'Vista frontal'),
          h('div', { className: 'sx-tools' },
            h('button', { onClick: undo, disabled: !hist.current.past.length, title: 'Anular (Ctrl+Z)', 'aria-label': 'Anular' }, h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }, h('path', { d: 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3' }))),
            h('button', { onClick: redo, disabled: !hist.current.future.length, title: 'Refazer', 'aria-label': 'Refazer' }, h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }, h('path', { d: 'M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3' }))),
            h('span', { className: 'sx-sep' }),
            h('button', { onClick: function () { setZoom(zoom > 1 ? 1 : 1.6); }, title: zoom > 1 ? 'Reduzir' : 'Aproximar', 'aria-label': 'Zoom' }, h(Icon, { n: 'search', s: 17 }), h('small', null, zoom > 1 ? '160%' : '100%')),
            hasBack ? h('button', { onClick: function () { setCompare(!compare); }, title: 'Ver frente e costas', 'aria-pressed': compare, className: compare ? 'on' : '' }, h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7 }, h('path', { d: 'M3 5h8v14H3zM13 5h8v14h-8z' }))) : null,
            h('button', { onClick: function () { if (confirm('Começar um design novo? O atual será apagado.')) { commit(function (d) { d.views = { front: [], back: [] }; return d; }); setSel(null); setTab('add'); } }, title: 'Recomeçar', 'aria-label': 'Recomeçar' }, h(Icon, { n: 'trash', s: 17 })),
            h('button', { onClick: download, title: 'Descarregar PNG', 'aria-label': 'Descarregar PNG' }, h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }, h('path', { d: 'M12 4v11M7 10l5 5 5-5M5 20h14' }))),
            h('button', { onClick: share, title: 'Partilhar', 'aria-label': 'Partilhar design', className: copied ? 'ok' : '' }, copied ? '✓' : h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }, h('path', { d: 'M8.6 13.5l6.8 4M15.4 6.5l-6.8 4M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' }))))),
        h('div', { className: 'sx-canvas' },
          h('canvas', { ref: cvRef, onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp, role: 'img', 'aria-label': 'Pré-visualização de ' + prod.name + ' em ' + col.name + ', vista ' + (view === 'front' ? 'de frente' : 'de costas') }),
          empty ? h('div', { className: 'sx-empty' }, h('b', null, 'Começa aqui'), h('span', null, 'Escolhe uma ideia pronta ou adiciona um texto.')) : null,
          selL && selL.type === 'text' ? h('div', { className: 'sx-quick' },
            h('input', { value: selL.text, maxLength: 22, onChange: function (e) { upd(selL.id, { text: e.target.value }, false); }, 'aria-label': 'Editar texto', style: { fontFamily: E.fontOf(selL.font).css } }),
            h('select', { key: selL.id + '-' + (selL.font || 'serif'), value: selL.font || 'serif', onChange: function (e) { upd(selL.id, { font: e.target.value }); }, 'aria-label': 'Letra' }, E.FONTS.map(function (f) { return h('option', { key: f.id, value: f.id }, f.label); })),
            h('div', { className: 'sx-qc' }, E.COLORS.slice(0, 6).map(function (c) { return h('button', { key: c[0], className: selL.color === c[0] ? 'on' : '', style: { background: c[0] }, 'aria-label': c[1], title: c[1], onClick: function () { upd(selL.id, { color: c[0] }); } }); }))) :
          sel ? h('div', { className: 'st-hint' }, 'Arrasta para mover · canto para redimensionar · bolinha de cima para rodar') : null),
        compare && hasBack ? h('div', { className: 'sx-compare' }, h('canvas', { ref: cv2Ref, 'aria-label': 'Outra vista' }), h('span', null, view === 'front' ? 'Costas' : 'Frente')) : null,
        h('div', { className: 'sx-strip' },
          h('div', { className: 'sx-qcol', role: 'radiogroup', 'aria-label': 'Cor da peça' }, prod.colors.map(function (c) { return h('button', { key: c.name, className: c.name === col.name ? 'on' : '', style: { background: c.hex }, title: c.name, 'aria-label': c.name, onClick: function () { setCol(c); } }); }), h('span', null, h('b', null, prod.name.split(' ').slice(0, 2).join(' ')), ' · ' + col.name)),
          h('span', { className: 'sx-meta' }, savedAt ? h('span', { className: 'sx-saved' }, '● Guardado') : null, 'Pronto em ', h('b', null, empty ? '24 h' : tech.days)))),
      h('aside', { className: 'sx-panel' },
        h('div', { className: 'sx-head' }, h('div', { className: 'eyebrow' }, 'Estúdio Karmic Node'), h('h1', { className: 'h2' }, 'Faz-a ', h('em', null, 'tua'))),
        h('div', { className: 'sx-tabs', role: 'tablist' }, TABS.map(function (t, i) {
          var on = tab === t[0] || (t[0] === 'add' && tab === 'graphics');
          return h('button', { key: t[0], role: 'tab', 'aria-selected': on, className: on ? 'on' : '', onClick: function () { setTab(t[0]); } }, h('i', null, i + 1), t[1]);
        })),
        h('div', { className: 'sx-body' }, panel),
        h('div', { className: 'sx-steps' }, steps.map(function (s, i) { return h('span', { key: s[0], className: s[2] ? 'ok' : '' }, h('i', null, s[2] ? '✓' : i + 1), s[1]); })),
        h('div', { className: 'sx-cta' },
          h('div', { className: 'sx-price' }, h('small', null, size ? 'Tamanho ' + size + ' · ' + tech.label : 'Falta o tamanho'), h('b', null, eur(total))),
          next ? h('button', { className: 'btn ghost', onClick: next.go }, next.label) : h('button', { className: 'btn', onClick: add }, 'Adicionar ao carrinho')),
        err ? h('div', { className: 'err-txt', role: 'alert', style: { padding: '0 20px 12px' } }, err) : null));
  }

  function Editor(p) {
    var L = p.L, upd = p.upd;
    var row = function (label, aside, child) { return h('div', { className: 'st-row' }, h('div', { className: 'st-lbl' }, label, aside ? h('em', null, aside) : null), child); };
    return h('div', { className: 'sx-editor' },
      L.type === 'text' ? h(R.Fragment, null,
        row('Texto', (L.text || '').length + '/22', h('input', { className: 'st-in', value: L.text, maxLength: 22, onChange: function (e) { upd({ text: e.target.value }, false); }, style: { fontFamily: E.fontOf(L.font).css, fontSize: L.font === 'script' ? 22 : 17 } })),
        h('div', { className: 'ideas' }, IDEAS.map(function (t) { return h('button', { key: t, onClick: function () { upd({ text: t }); } }, t); })),
        row('Letra', E.fontOf(L.font).label, h('div', { className: 'st-fonts' }, E.FONTS.map(function (f) { return h('button', { key: f.id, className: L.font === f.id ? 'on' : '', onClick: function () { upd({ font: f.id }); }, style: { fontFamily: f.css, fontWeight: f.w }, 'aria-label': f.label }, 'Aa', h('small', null, f.label)); }))),
        h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 } },
          row('Curva', L.curve === 0 ? 'Reto' : L.curve > 0 ? 'Arco' : 'Sorriso', h('input', { type: 'range', className: 'st-range', min: -1, max: 1, step: .05, value: L.curve || 0, onChange: function (e) { upd({ curve: +e.target.value }, false); } })),
          row('Espaço', Math.round((L.spacing || 0) * 100) + '%', h('input', { type: 'range', className: 'st-range', min: -.05, max: .5, step: .01, value: L.spacing || 0, onChange: function (e) { upd({ spacing: +e.target.value }, false); } }))),
        h('label', { className: 'toggle' }, 'Só contorno', h('input', { type: 'checkbox', checked: !!L.outline, onChange: function (e) { upd({ outline: e.target.checked }); } }))) : null,
      L.type === 'mono' ? h(R.Fragment, null,
        row('Iniciais', 'até 3', h('input', { className: 'st-in', value: L.text, maxLength: 3, onChange: function (e) { upd({ text: e.target.value.replace(/[^A-Za-zÀ-ÿ&]/g, '') }, false); }, style: { textTransform: 'uppercase', fontFamily: "'Cormorant Garamond', serif", fontSize: 22, letterSpacing: '.2em' } })),
        row('Moldura', null, h('div', { className: 'seg' }, E.MONO.map(function (m) { return h('button', { key: m[0], className: L.style === m[0] ? 'on' : '', onClick: function () { upd({ style: m[0] }); } }, m[1]); })))) : null,
      L.type === 'graphic' ? h('label', { className: 'toggle' }, 'Preenchido', h('input', { type: 'checkbox', checked: !!L.fill || !!E.gOf(L.g).fill, disabled: !!E.gOf(L.g).fill || !!E.gOf(L.g).img, onChange: function (e) { upd({ fill: e.target.checked }); } })) : null,
      L.type === 'image' ? (Math.min(L.ow || 0, L.oh || 0) < 900 ? h('div', { className: 'warn' }, 'Imagem com pouca resolução (' + L.ow + '×' + L.oh + ' px). Pode sair desfocada. Recomendamos 1200 px ou mais.') : h('div', { className: 'muted', style: { fontSize: 13 } }, '✓ Boa resolução para impressão (' + L.ow + '×' + L.oh + ' px).')) : null,
      L.type !== 'image' ? row(p.tech === 'emb' ? 'Cor da linha' : 'Cor da tinta', (E.COLORS.find(function (c) { return c[0] === L.color; }) || ['', 'Personalizada'])[1],
        h('div', { className: 'threads' }, E.COLORS.map(function (c) { return h('button', { key: c[0], className: L.color === c[0] ? 'on' : '', style: { background: c[0] }, 'aria-label': c[1], title: c[1], onClick: function () { upd({ color: c[0] }); } }); }))) : null,
      h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 } },
        row('Tamanho', Math.round(L.s * 100) + '%', h('input', { type: 'range', className: 'st-range', min: .05, max: .7, step: .01, value: L.s, onChange: function (e) { upd({ s: +e.target.value }, false); } })),
        row('Rotação', (L.r || 0) + '°', h('input', { type: 'range', className: 'st-range', min: -180, max: 180, step: 1, value: L.r || 0, onChange: function (e) { upd({ r: +e.target.value }, false); } }))),
      h('div', { className: 'sx-acts' },
        h('button', { className: 'chip', onClick: p.onCenter }, 'Centrar'),
        h('button', { className: 'chip', onClick: function () { upd({ r: 0 }); } }, 'Endireitar'),
        h('button', { className: 'chip', onClick: p.onDup }, 'Duplicar'),
        h('button', { className: 'chip', style: { color: 'var(--accent)' }, onClick: p.onDel }, 'Apagar')),
      h('p', { className: 'muted', style: { fontSize: 12, margin: '4px 0 0' } }, 'Dica: setas do teclado movem · Shift + setas move mais · Delete apaga.'));
  }

  function TplPreview(p) {
    var l = (p.t.front || [])[0] || {};
    var f = l.type === 'text' ? E.fontOf(l.font) : E.fontOf('serif');
    return h('span', { className: 'sx-tplv' },
      l.type === 'graphic' ? h('img', { src: 'assets/logo-mark.png', alt: '' }) :
      l.type === 'mono' ? h('span', { className: 'sx-mono', style: { width: 34, height: 34, fontSize: 14 } }, l.text) :
      h('span', { style: { fontFamily: f.css, fontWeight: f.w, fontSize: l.font === 'script' ? 20 : 15, color: l.color === '#F4EFE6' ? '#111' : l.color, letterSpacing: l.spacing ? '.15em' : 0 } }, p.t.id === 'est' ? 'EST. 2026' : l.text));
  }

  function Thumb(p) {
    var s = useState(null), src = s[0], set = s[1];
    useEffect(function () { var a = true; K.tinted(p.prod.mock, p.prod.colors[0].hex).then(function (u) { if (a) set(u); }); return function () { a = false; }; }, [p.prod.id]);
    return src ? h('img', { src: src, alt: '' }) : h('span', { style: { aspectRatio: '1', display: 'block' } });
  }

  window.KN.Personalize = Studio;
})();
