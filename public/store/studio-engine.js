// Karmic Node — motor do estúdio (desenho em canvas, sem dependências)
(function () {
  'use strict';
  var K = window.KN;

  var FONTS = [
    { id: 'serif', css: "'Cormorant Garamond', serif", label: 'Clássica', w: 600 },
    { id: 'script', css: "'Pinyon Script', cursive", label: 'Caligrafia', w: 400 },
    { id: 'sans', css: "'Inter', sans-serif", label: 'Moderna', w: 700 },
    { id: 'varsity', css: "'Alfa Slab One', serif", label: 'Varsity', w: 400 },
    { id: 'mono', css: "'DM Mono', monospace", label: 'Máquina', w: 500 },
  ];
  var COLORS = [['#F4EFE6', 'Cru'], ['#111111', 'Preto'], ['#C9A15B', 'Dourado'], ['#A9A9A9', 'Prata'], ['#8B1E2D', 'Bordô'], ['#1F3A5F', 'Marinho'], ['#3E5B3A', 'Verde'], ['#D9A6A1', 'Rosa'], ['#B5651D', 'Caramelo'], ['#FFFFFF', 'Branco']];
  var GRAPHICS = [
    { id: 'spark', label: 'Estrela KN', fill: true, d: 'M12 2c.7 4.8 2.5 7.4 10 10-7.5 2.6-9.3 5.2-10 10-.7-4.8-2.5-7.4-10-10 7.5-2.6 9.3-5.2 10-10z' },
    { id: 'star', label: 'Estrela', d: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z' },
    { id: 'heart', label: 'Coração', d: 'M12 20s-7-4.4-9-9.2C1.7 7.6 4 4 7.4 4c2 0 3.4 1.1 4.6 2.6C13.2 5.1 14.6 4 16.6 4 20 4 22.3 7.6 21 10.8 19 15.6 12 20 12 20z' },
    { id: 'sun', label: 'Sol', d: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1.5V4M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8' },
    { id: 'moon', label: 'Lua', d: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z' },
    { id: 'wave', label: 'Onda', d: 'M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 14c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2' },
    { id: 'mountain', label: 'Montanha', d: 'M2 20L9 7l4 7 2.5-4L22 20zM7.4 10.2L9 12l1.6-1.8' },
    { id: 'crown', label: 'Coroa', d: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5zM5 16h14' },
    { id: 'bolt', label: 'Raio', d: 'M13 2L4 14h7l-1 8 9-12h-7z' },
    { id: 'flower', label: 'Flor', d: 'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM12 9.5C10 6 10 3 12 2c2 1 2 4 0 7.5zM12 14.5c2 3.5 2 6.5 0 7.5-2-1-2-4 0-7.5zM9.5 12C6 14 3 14 2 12c1-2 4-2 7.5 0zM14.5 12c3.5-2 6.5-2 7.5 0-1 2-4 2-7.5 0z' },
    { id: 'anchor', label: 'Âncora', d: 'M12 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 5.5V22M7 9.5h10M4 14a8 8 0 0 0 16 0M4 14l-1.5 1.5M20 14l1.5 1.5' },
    { id: 'leaf', label: 'Folha', d: 'M5 19c0-9 5-14 15-15-1 10-6 15-15 15zM5 19l8-8' },
    { id: 'eye', label: 'Olho', d: 'M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
    { id: 'compass', label: 'Bússola', d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z' },
    { id: 'laurel', label: 'Louros', d: 'M8 20C4 16 3.5 10 6 4M16 20c4-4 4.5-10 2-16M6 8C4 8 3 7 2.5 5.5 4 5 5.5 5.5 6 8zM5.2 12c-2 .3-3.3-.5-4-2 1.6-.3 3.2.2 4 2zM6 16c-1.8.8-3.4.4-4.4-.8 1.4-.8 3-.6 4.4.8zM18 8c2 0 3-1 3.5-2.5C20 5 18.5 5.5 18 8zM18.8 12c2 .3 3.3-.5 4-2-1.6-.3-3.2.2-4 2zM18 16c1.8.8 3.4.4 4.4-.8-1.4-.8-3-.6-4.4.8z' },
    { id: 'arrow', label: 'Seta', d: 'M3 12h17M14 6l6 6-6 6' },
    { id: 'emblem', label: 'Emblema KN', img: 'assets/logo-mark.png' },
  ];
  var MONO = [['circle', 'Selo'], ['diamond', 'Losango'], ['shield', 'Escudo'], ['plain', 'Simples']];
  var AREAS = {
    tshirt: { front: [.30, .20, .70, .82], back: [.30, .16, .70, .82] },
    sweatshirt: { front: [.31, .20, .69, .76], back: [.31, .17, .69, .78] },
    hoodie: { front: [.32, .34, .68, .70], back: [.30, .30, .70, .82] },
    cap: { front: [.33, .27, .67, .56] },
  };
  var PRESETS = {
    tshirt: { front: [['chest-l', 'Peito esq.', .62, .31, .15], ['center', 'Centro', .5, .43, .36], ['chest-r', 'Peito dir.', .38, .31, .15]], back: [['nape', 'Nuca', .5, .21, .15], ['back', 'Costas', .5, .45, .40]] },
    sweatshirt: { front: [['chest-l', 'Peito esq.', .62, .31, .14], ['center', 'Centro', .5, .42, .34], ['chest-r', 'Peito dir.', .38, .31, .14]], back: [['nape', 'Nuca', .5, .22, .14], ['back', 'Costas', .5, .44, .38]] },
    hoodie: { front: [['chest-l', 'Peito esq.', .61, .43, .13], ['center', 'Centro', .5, .50, .30], ['chest-r', 'Peito dir.', .39, .43, .13]], back: [['nape', 'Nuca', .5, .34, .14], ['back', 'Costas', .5, .52, .38]] },
    cap: { front: [['front', 'Frente', .5, .41, .28]] },
  };
  var TECH = { emb: { label: 'Bordado', price: 12, extra: 8, days: '5–7 dias úteis', desc: 'Linha de algodão em ponto cheio, com relevo. Clássico e duradouro.' }, print: { label: 'Impressão', price: 8, extra: 6, days: '3–5 dias úteis', desc: 'Impressão direta em alta definição. Ideal para imagens e detalhe fino.' } };

  function fontOf(id) { return FONTS.find(function (f) { return f.id === id; }) || FONTS[0]; }
  function gOf(id) { return GRAPHICS.find(function (g) { return g.id === id; }) || GRAPHICS[0]; }

  // ───── textura de ponto (bordado) ─────
  var stitchCv = null;
  function stitch(x) {
    if (!stitchCv) {
      stitchCv = document.createElement('canvas'); stitchCv.width = stitchCv.height = 6;
      var c = stitchCv.getContext('2d');
      c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 6); c.lineTo(6, 0); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.7)'; c.beginPath(); c.moveTo(-1, 4); c.lineTo(4, -1); c.moveTo(2, 7); c.lineTo(7, 2); c.stroke();
    }
    return x.createPattern(stitchCv, 'repeat');
  }

  // ───── imagens (cache) ─────
  var imgs = {};
  function img(src, onload) {
    var e = imgs[src];
    if (!e) { e = new Image(); e.onload = function () { e._ok = true; if (onload) onload(); }; e.src = src; imgs[src] = e; }
    return e._ok ? e : null;
  }
  var tintCache = {};
  function tintedImg(src, color, onload) {
    var key = src + color; if (tintCache[key]) return tintCache[key];
    var base = img(src, onload); if (!base) return null;
    var c = document.createElement('canvas'); c.width = base.width; c.height = base.height;
    var x = c.getContext('2d'); x.drawImage(base, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    tintCache[key] = c; return c;
  }

  // ───── texto letra a letra (espaçamento + curva) ─────
  function measure(x, text, px, sp) {
    var cs = Array.from(text), ws = cs.map(function (c) { return x.measureText(c).width; }), gap = (sp || 0) * px;
    return { cs: cs, ws: ws, gap: gap, tot: ws.reduce(function (a, b) { return a + b; }, 0) + gap * Math.max(0, cs.length - 1) };
  }
  function emitText(x, L, px, stroke) {
    var f = fontOf(L.font); x.font = f.w + ' ' + px + 'px ' + f.css; x.textBaseline = 'middle'; x.textAlign = 'center';
    var m = measure(x, L.text, px, L.spacing), c = L.curve || 0;
    var draw = function (ch, a, b) { if (stroke) x.strokeText(ch, a, b); else x.fillText(ch, a, b); };
    if (Math.abs(c) < .02) { var cx = -m.tot / 2; m.cs.forEach(function (ch, i) { draw(ch, cx + m.ws[i] / 2, 0); cx += m.ws[i] + m.gap; }); return; }
    var R = px * (8 - Math.abs(c) * 6.6), a = -(m.tot / R) / 2;
    m.cs.forEach(function (ch, i) {
      var w = m.ws[i]; a += w / 2 / R; x.save();
      if (c > 0) { x.translate(0, R); x.rotate(a); draw(ch, 0, -R); } else { x.translate(0, -R); x.rotate(-a); draw(ch, 0, R); }
      x.restore(); a += (w / 2 + m.gap) / R;
    });
  }

  // forma de cada camada: dimensões + função que a desenha com o estilo atual
  function shapeOf(x, L, W, redraw) {
    if (L.type === 'text') {
      var f = fontOf(L.font); x.font = f.w + ' 100px ' + f.css;
      var m = measure(x, L.text || ' ', 100, L.spacing), px = Math.min(W / (m.tot / 100 || 1), W * .8);
      var c = L.curve || 0, sag = 0;
      if (Math.abs(c) >= .02) { var R = px * (8 - Math.abs(c) * 6.6), mm = m.tot / 100 * px; sag = R * (1 - Math.cos(mm / R / 2)); }
      return { bw: Math.min(W, m.tot / 100 * px), bh: px * 1.15 + sag, emit: function () { if (L.outline) { x.lineWidth = Math.max(1, px * .055); x.lineJoin = 'round'; emitText(x, L, px, true); } else emitText(x, L, px, false); } };
    }
    if (L.type === 'mono') {
      var r = W / 2, letters = (L.text || '').toUpperCase().slice(0, 3), st = L.style || 'circle';
      return { bw: W, bh: W, emit: function () {
        x.lineWidth = Math.max(1, r * .05); x.lineJoin = 'round';
        x.beginPath();
        if (st === 'circle') { x.arc(0, 0, r * .95, 0, Math.PI * 2); x.stroke(); x.lineWidth = Math.max(.8, r * .022); x.beginPath(); x.arc(0, 0, r * .82, 0, Math.PI * 2); x.stroke(); }
        else if (st === 'diamond') { x.moveTo(0, -r * .96); x.lineTo(r * .96, 0); x.lineTo(0, r * .96); x.lineTo(-r * .96, 0); x.closePath(); x.stroke(); }
        else if (st === 'shield') { x.moveTo(-r * .78, -r * .82); x.lineTo(r * .78, -r * .82); x.lineTo(r * .78, -r * .05); x.quadraticCurveTo(r * .74, r * .62, 0, r * .95); x.quadraticCurveTo(-r * .74, r * .62, -r * .78, -r * .05); x.closePath(); x.stroke(); }
        else { x.lineWidth = Math.max(.8, r * .03); x.moveTo(-r * .5, -r * .62); x.lineTo(r * .5, -r * .62); x.moveTo(-r * .5, r * .62); x.lineTo(r * .5, r * .62); x.stroke(); }
        var ff = fontOf('serif'), ms = r * (letters.length > 2 ? .56 : letters.length > 1 ? .72 : .95);
        x.font = ff.w + ' ' + ms + 'px ' + ff.css; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(letters, 0, st === 'shield' ? -r * .02 : r * .04);
      } };
    }
    if (L.type === 'graphic') {
      var g = gOf(L.g);
      if (g.img) return { bw: W, bh: W, raster: true, emit: function (color) { var t = tintedImg(g.img, color, redraw); if (t) x.drawImage(t, -W / 2, -W / 2, W, W); } };
      var path = new Path2D(g.d);
      return { bw: W, bh: W, emit: function () { x.save(); x.scale(W / 24, W / 24); x.translate(-12, -12); x.lineWidth = L.weight || 1.5; x.lineCap = 'round'; x.lineJoin = 'round'; if (g.fill || L.fill) x.fill(path); else x.stroke(path); x.restore(); } };
    }
    if (L.type === 'image') {
      var im = img(L.src, redraw), ih = L.iw ? W * L.ih / L.iw : W;
      return { bw: W, bh: ih, raster: true, image: true, emit: function () { if (im) x.drawImage(im, -W / 2, -ih / 2, W, ih); } };
    }
    return { bw: 10, bh: 10, emit: function () {} };
  }

  function paint(x, sh, L, tech, light) {
    var color = L.color || '#111111', hh = sh.bh;
    if (sh.image) { x.save(); x.globalAlpha = .97; if (light) x.globalCompositeOperation = 'multiply'; sh.emit(); x.restore(); return; }
    if (sh.raster) {
      x.save(); if (tech === 'emb') { x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = Math.max(1, hh * .03); x.shadowOffsetY = Math.max(.6, hh * .02); }
      sh.emit(color); x.restore(); return;
    }
    if (tech === 'emb') {
      x.save(); x.shadowColor = 'rgba(0,0,0,.38)'; x.shadowBlur = Math.max(1, hh * .04); x.shadowOffsetY = Math.max(.6, hh * .03); x.fillStyle = x.strokeStyle = color; sh.emit(); x.restore();
      x.save(); x.globalAlpha = K.lum(color) > .7 ? .14 : .24; x.fillStyle = x.strokeStyle = stitch(x); sh.emit(); x.restore();
      x.save(); var g = x.createLinearGradient(0, -hh / 2, 0, hh / 2); g.addColorStop(0, 'rgba(255,255,255,.3)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); x.fillStyle = x.strokeStyle = g; sh.emit(); x.restore();
    } else {
      x.save(); x.globalAlpha = .94; x.fillStyle = x.strokeStyle = color; sh.emit(); x.restore();
    }
  }

  // desenha tudo; devolve geometria para a interação
  function render(x, W, H, o) {
    x.clearRect(0, 0, W, H);
    if (o.bg) { x.fillStyle = o.bg; x.fillRect(0, 0, W, H); }
    var out = { boxes: {} };
    if (!o.mock) return out;
    var zoom = o.zoom || 1, ar = o.mock.width / o.mock.height;
    var mw = Math.min(W * .86, H * .86 * ar) * zoom, mh = mw / ar, mx = (W - mw) / 2, my = (H - mh) / 2 + (zoom > 1 ? mh * .12 * (zoom - 1) : 0);
    out.mx = mx; out.my = my; out.mw = mw; out.mh = mh;
    x.save(); var sg = x.createRadialGradient(W / 2, my + mh * .98, 4, W / 2, my + mh * .98, mw * .45); sg.addColorStop(0, 'rgba(0,0,0,.13)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = sg; x.fillRect(0, my + mh * .85, W, mh * .3); x.restore();
    if (o.view === 'back') { x.save(); x.translate(mx + mw, my); x.scale(-1, 1); x.drawImage(o.mock, 0, 0, mw, mh); x.restore(); }
    else x.drawImage(o.mock, mx, my, mw, mh);
    var area = o.area;
    if (area && o.showArea) {
      x.save(); x.setLineDash([5, 5]); x.lineWidth = 1; x.strokeStyle = o.light ? 'rgba(20,20,20,.28)' : 'rgba(255,255,255,.4)';
      x.strokeRect(mx + mw * area[0], my + mh * area[1], mw * (area[2] - area[0]), mh * (area[3] - area[1])); x.restore();
    }
    (o.layers || []).forEach(function (L) {
      if (L.hidden) return;
      var cx = mx + mw * L.x, cy = my + mh * L.y, w = mw * L.s;
      x.save(); x.translate(cx, cy); x.rotate((L.r || 0) * Math.PI / 180);
      var sh = shapeOf(x, L, w, o.redraw);
      paint(x, sh, L, L.type === 'image' ? 'print' : o.tech, o.light);
      x.restore();
      out.boxes[L.id] = { cx: cx, cy: cy, bw: sh.bw, bh: sh.bh, r: L.r || 0 };
    });
    if (o.guideX) { x.save(); x.strokeStyle = '#8B1E2D'; x.lineWidth = 1; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(mx + mw / 2, my + mh * .1); x.lineTo(mx + mw / 2, my + mh * .9); x.stroke(); x.restore(); }
    var b = o.sel && out.boxes[o.sel];
    if (b && o.handles) {
      x.save(); x.translate(b.cx, b.cy); x.rotate(b.r * Math.PI / 180);
      var hw = b.bw / 2 + 8, hh = b.bh / 2 + 8;
      x.strokeStyle = '#8B1E2D'; x.lineWidth = 1.2; x.setLineDash([5, 4]); x.strokeRect(-hw, -hh, hw * 2, hh * 2); x.setLineDash([]);
      x.beginPath(); x.moveTo(0, -hh); x.lineTo(0, -hh - 18); x.stroke();
      var dot = function (px, py, fill) { x.beginPath(); x.arc(px, py, 7, 0, Math.PI * 2); x.fillStyle = fill; x.fill(); x.lineWidth = 1.5; x.strokeStyle = '#8B1E2D'; x.stroke(); };
      dot(hw, hh, '#fff'); dot(0, -hh - 22, '#fff');
      x.beginPath(); x.arc(hw, -hh, 8, 0, Math.PI * 2); x.fillStyle = '#8B1E2D'; x.fill();
      x.strokeStyle = '#fff'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(hw - 3, -hh - 3); x.lineTo(hw + 3, -hh + 3); x.moveTo(hw + 3, -hh - 3); x.lineTo(hw - 3, -hh + 3); x.stroke();
      // ícone de rotação
      x.strokeStyle = '#8B1E2D'; x.lineWidth = 1.3; x.beginPath(); x.arc(0, -hh - 22, 3.5, -.4, Math.PI * 1.4); x.stroke();
      x.restore();
      out.handles = { cx: b.cx, cy: b.cy, r: b.r, hw: hw, hh: hh };
    }
    return out;
  }

  window.KN.StudioEngine = { FONTS: FONTS, COLORS: COLORS, GRAPHICS: GRAPHICS, MONO: MONO, AREAS: AREAS, PRESETS: PRESETS, TECH: TECH, fontOf: fontOf, gOf: gOf, render: render, img: img };
})();
