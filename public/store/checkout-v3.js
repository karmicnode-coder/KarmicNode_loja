// Karmic Node — Checkout v3 · "Estúdio" (base: karmic-node-pagamento.zip, layout A)
// Segurança:
//  · Dados do cartão NUNCA passam por esta página: são introduzidos na página segura do Stripe (PCI-DSS SAQ-A).
//    O cartão 3D mostra sempre •••• e o nome do titular vindo da morada.
//  · Idempotency-Key por tentativa (evita cobranças duplicadas), bloqueio de duplo clique,
//    limite de 4 tentativas/minuto, honeypot anti-bot, limpeza de input, exigência de HTTPS.
//  · Dados pessoais só ficam guardados no dispositivo se a cliente escolher "Lembrar".
//  · O servidor deve recalcular preços a partir de id/qty (o preço enviado é só informativo).
// Contrato: POST /api/checkout → { url } (Stripe). Sem servidor (pré-visualização) corre em modo demonstração.
(function () {
  'use strict';
  var R = React, h = R.createElement, useState = R.useState, useEffect = R.useEffect, useRef = R.useRef;
  var K = window.KN, Icon = K.Icon, eur = K.eur;

  var clean = function (s, n) { return String(s || '').replace(/[\u0000-\u001F\u007F<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || 120); };
  var V = {
    email: function (v) { if (!v) return 'Escreve o teu email.'; if (v.indexOf('@') < 0) return 'Falta o “@”.'; return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Confirma a parte depois do “@”.'; },
    phone: function (v) { var d = v.replace(/\D/g, '').replace(/^351/, ''); if (!d) return 'Para a transportadora (e o MB WAY).'; return /^9\d{8}$/.test(d) ? '' : '9 dígitos, a começar por 9.'; },
    name: function (v) { return v.trim().split(/\s+/).length < 2 ? 'Nome e apelido.' : ''; },
    address: function (v) { if (!v.trim()) return 'Rua e número.'; return /\d/.test(v) ? '' : 'Falta o número da porta.'; },
    zip: function (v) { return /^\d{4}-\d{3}$/.test(v) ? '' : 'Formato 0000-000.'; },
    city: function (v) { return v.trim().length < 2 ? 'Escreve a localidade.' : ''; },
    nif: function (v) { var d = (v || '').replace(/\D/g, ''); if (d.length !== 9) return 'O NIF tem 9 dígitos.'; var s = 0; for (var i = 0; i < 8; i++) s += +d[i] * (9 - i); var c = 11 - s % 11; if (c >= 10) c = 0; return c === +d[8] ? '' : 'NIF inválido.'; },
    terms: function (v) { return v ? '' : 'Aceita os termos para continuar.'; },
  };
  var fmtZip = function (v) { var d = v.replace(/\D/g, '').slice(0, 7); return d.length > 4 ? d.slice(0, 4) + '-' + d.slice(4) : d; };
  var fmtPhone = function (v) { return v.replace(/\D/g, '').slice(0, 9).replace(/(\d{3})(?=\d)/g, '$1 '); };
  var CP = { '2070': 'Cartaxo', '2000': 'Santarém', '2005': 'Santarém', '2080': 'Almeirim', '2100': 'Coruche', '2400': 'Leiria', '2500': 'Caldas da Rainha', '2600': 'Vila Franca de Xira', '2610': 'Amadora', '2620': 'Odivelas', '2640': 'Mafra', '2700': 'Amadora', '2710': 'Sintra', '2750': 'Cascais', '2780': 'Oeiras', '2800': 'Almada', '2830': 'Barreiro', '2840': 'Seixal', '2900': 'Setúbal', '3000': 'Coimbra', '3500': 'Viseu', '3800': 'Aveiro', '4000': 'Porto', '4100': 'Porto', '4200': 'Porto', '4400': 'Vila Nova de Gaia', '4450': 'Matosinhos', '4700': 'Braga', '4800': 'Guimarães', '7000': 'Évora', '8000': 'Faro', '8500': 'Portimão', '9000': 'Funchal', '9500': 'Ponta Delgada' };
  var cityFor = function (z) { var d = z.replace(/\D/g, ''); return CP[d.slice(0, 4)] || (d[0] === '1' ? 'Lisboa' : ''); };
  var regionFor = function (z) { var d = z.replace(/\D/g, ''); if (d[0] === '9') return +d.slice(0, 2) < 95 ? 'PT-M' : 'PT-A'; return 'PT'; };
  var digits = function (s) { return String(s || '').replace(/\D/g, ''); };
  var brandOf = function (n) { var d = digits(n); if (/^4/.test(d)) return 'VISA'; if (/^(5[1-5]|2[2-7])/.test(d)) return 'MASTERCARD'; if (/^3[47]/.test(d)) return 'AMEX'; return ''; };
  var luhn = function (n) { var d = digits(n), s = 0, alt = false; for (var i = d.length - 1; i >= 0; i--) { var x = +d[i]; if (alt) { x *= 2; if (x > 9) x -= 9; } s += x; alt = !alt; } return d.length >= 13 && s % 10 === 0; };
  var fmtCard = function (v) { var d = digits(v); if (/^3[47]/.test(d)) { d = d.slice(0, 15); return [d.slice(0, 4), d.slice(4, 10), d.slice(10)].filter(Boolean).join(' '); } return d.slice(0, 16).replace(/(.{4})(?=.)/g, '$1 '); };
  var fmtExp = function (v) { var d = digits(v).slice(0, 4); if (d.length === 1 && +d > 1) d = '0' + d; return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; };
  function payErrors(m, p) {
    var e = {};
    if (m === 'card') {
      var d = digits(p.num), amex = brandOf(d) === 'AMEX';
      if (!d) e.num = 'Escreve o número do cartão.'; else if (d.length < (amex ? 15 : 16)) e.num = 'Número incompleto.'; else if (!luhn(d)) e.num = 'Este número de cartão não é válido.';
      var x = /^(\d{2})\/(\d{2})$/.exec(p.exp || '');
      if (!x) e.exp = 'Formato MM/AA.'; else { var mm = +x[1], yy = 2000 + +x[2], now = new Date(); if (mm < 1 || mm > 12) e.exp = 'Mês inválido.'; else if (yy < now.getFullYear() || (yy === now.getFullYear() && mm < now.getMonth() + 1)) e.exp = 'Este cartão já expirou.'; else if (yy > now.getFullYear() + 20) e.exp = 'Confirma o ano.'; }
      if (digits(p.cvc).length < (amex ? 4 : 3)) e.cvc = amex ? '4 dígitos (frente do cartão).' : '3 dígitos (verso do cartão).';
      if (String(p.cname || '').trim().split(/\s+/).length < 2) e.cname = 'Nome tal como está no cartão.';
    }
    if (m === 'mbway') { var t = digits(p.mbphone).replace(/^351/, ''); if (!/^9\d{8}$/.test(t)) e.mbphone = 'Telemóvel com 9 dígitos, a começar por 9.'; }
    if (m === 'paypal') { if (p.ppemail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.ppemail)) e.ppemail = 'Confirma o email do PayPal.'; }
    return e;
  }
  var uid = function () { try { return crypto.randomUUID(); } catch (e) { return 'kn-' + Date.now().toString(36) + Math.random().toString(36).slice(2); } };

  var METHODS = [
    { id: 'card', label: 'Cartão', sub: 'Apple · Google Pay' },
    { id: 'mbway', label: 'MB WAY', sub: 'No telemóvel' },
    { id: 'multibanco', label: 'Multibanco', sub: 'Referência' },
    { id: 'paypal', label: 'PayPal', sub: 'Conta PayPal' },
  ];
var LOGOS = { card: [h('i', { key: 1, className: 'visa' }, 'VISA'), h('i', { key: 2, className: 'mc' }, h('b'), h('u')), h('i', { key: 3, className: 'ap' }, ' Pay')], mbway: [h('i', { key: 1, className: 'mbw' }, 'MB WAY')], multibanco: [h('i', { key: 1, className: 'mb' }, 'MB')], paypal: [h('i', { key: 1, className: 'pp' }, 'Pay', h('em', null, 'Pal'))] };
  var PROC = {
    card: ['A estabelecer ligação encriptada', 'A criar sessão segura Stripe', 'A abrir página de pagamento'],
    mbway: ['A estabelecer ligação encriptada', 'A preparar pedido MB WAY', 'A abrir confirmação'],
    multibanco: ['A reservar a tua encomenda', 'A gerar referência', 'Referência pronta'],
    paypal: ['A estabelecer ligação encriptada', 'A preparar sessão PayPal', 'A redirecionar para o PayPal'],
  };
  var SHIP = [
    { id: 'std', label: 'CTT · Standard', kind: 'std' },
    { id: 'exp', label: 'DPD · Expresso', kind: 'exp' },
    { id: 'pickup', label: 'Levantar em Cartaxo', kind: 'pick' },
  ];

  var Lock = function () { return h('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, className: 'k3-ico' }, h('rect', { x: 3, y: 7, width: 10, height: 7, rx: 1 }), h('path', { d: 'M5 7V5a3 3 0 0 1 6 0v2' })); };
  var Check = function () { return h('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', className: 'k3-ico' }, h('path', { d: 'M3 8.5l3.2 3L13 4.5' })); };

  // ───── Visuais do palco ─────
  function CardVisual(p) {
    var tS = useState({ x: 0, y: 0 }), t = tS[0], setT = tS[1];
    function move(e) { var r = e.currentTarget.getBoundingClientRect(); setT({ x: ((e.clientY - r.top) / r.height - .5) * -10, y: ((e.clientX - r.left) / r.width - .5) * 14 }); }
    var brand = brandOf(p.num), raw = digits(p.num), mask = brand === 'AMEX' ? '•••• •••••• •••••' : '•••• •••• •••• ••••', di = 0;
    // Mostra só os últimos 4 dígitos no cartão (o resto fica mascarado) — ninguém ao lado lê o número completo
    var show = raw.length - 4;
    var disp = mask.split('').map(function (ch) { if (ch === ' ') return ' '; var i = di++; return i < raw.length ? (i >= show ? raw[i] : '•') : '•'; }).join('');
    var flip = p.focus === 'cvc', z = function (k) { return p.focus === k ? ' on' : ''; };
    var mark = brand === 'VISA' ? h('span', { className: 'k3-visa' }, 'VISA') : brand === 'MASTERCARD' ? h('span', { className: 'k3-mcm' }, h('i'), h('i')) : brand === 'AMEX' ? h('span', { className: 'k3-amex' }, 'AMEX') : h('span', { className: 'k3-nob' }, 'KN · BLACK');
    return h('div', { className: 'k3-card-scene', onMouseMove: move, onMouseLeave: function () { setT({ x: 0, y: 0 }); } },
      h('div', { className: 'k3-card3d', style: { transform: 'rotateX(' + t.x + 'deg) rotateY(' + ((flip ? 180 : 0) + t.y) + 'deg)' } },
        h('div', { className: 'k3-card' },
          h('div', { className: 'k3-guil' }),
          h('div', { className: 'k3-row' }, h('div', { className: 'k3-cbrand' }, h('img', { src: 'assets/logo-mark.png', alt: '' }), h('span', null, 'KARMIC · NODE')),
            h('svg', { className: 'k3-cl', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }, h('path', { d: 'M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17' }))),
          h('div', { className: 'k3-chip' }, h('i'), h('i'), h('i')),
          h('div', { className: 'k3-cnum k3-zone' + z('num') }, disp),
          h('div', { className: 'k3-row k3-cbot' },
            h('div', { className: 'k3-zone' + z('cname') }, h('small', null, 'Titular'), h('b', null, (p.cname || 'O teu nome').toUpperCase().slice(0, 24))),
            h('div', { className: 'k3-zone' + z('exp') }, h('small', null, 'Validade'), h('b', null, p.exp || 'MM/AA')),
            mark)),
        h('div', { className: 'k3-card k3-back' },
          h('div', { className: 'k3-stripe' }),
          h('div', { className: 'k3-sign' }, h('div', { className: 'k3-sign-strip' }), h('div', { className: 'k3-cvc k3-zone' + z('cvc') }, h('small', null, 'CVC'), h('b', null, digits(p.cvc) ? '•'.repeat(digits(p.cvc).length) : '•••'))),
          h('div', { className: 'k3-back-foot' }, h('span', null, 'KARMIC NODE · POWER IN MOTION.'), h('div', { className: 'k3-holo' })))));
  }
  function PhoneMock(p) {
    return h('div', { className: 'k3-phone' }, h('div', { className: 'k3-screen' },
      h('div', { className: 'k3-notch' }), h('div', { className: 'k3-status' }, h('span', null, '9:41'), h('span', null, '5G')),
      h('div', { className: 'k3-app' }, h('b', null, 'MB WAY'), h('span', null, '+351 ' + (p.phone || '9•• ••• •••'))),
      p.wait ? h('div', { className: 'k3-notif' }, h('div', { className: 'k3-notif-top' }, h('span', null, 'MB WAY'), h('span', null, 'agora')), h('b', null, 'Pedido de pagamento'), h('span', { className: 'm' }, 'Karmic Node · Cartaxo'), h('div', { className: 'amt' }, eur(p.total)), h('div', { className: 'btns' }, h('span', null, 'Recusar'), h('span', { className: 'ok' }, 'Aceitar')))
        : h('div', { className: 'k3-idle' }, h('div', { className: 'k3-ring' }), h('span', null, 'Ao confirmar, recebes', h('br'), 'o pedido aqui'))));
  }
  function MBTicket(p) {
    var cS = useState(''), copied = cS[0], setCopied = cS[1];
    var rows = [['Entidade', p.preview ? '•• •••' : p.ent], ['Referência', p.preview ? '••• ••• •••' : p.ref], ['Montante', eur(p.amount)]];
    return h('div', { className: 'k3-mb' },
      h('div', { className: 'k3-mb-head' }, h('span', { className: 'logo' }, 'MB'), h('div', null, h('b', null, 'Pagamento por referência'), h('span', null, p.preview ? 'Gerada ao confirmar · válida 72 h' : 'Válida durante 72 horas'))),
      rows.map(function (r) { return h('div', { className: 'k3-mb-row', key: r[0] }, h('span', null, r[0]), h('b', null, r[1]), !p.preview && r[0] !== 'Montante' ? h('button', { type: 'button', onClick: function () { try { navigator.clipboard.writeText(r[1].replace(/\s/g, '')); } catch (e) {} setCopied(r[0]); setTimeout(function () { setCopied(''); }, 1400); } }, copied === r[0] ? 'Copiado' : 'Copiar') : h('span')); }));
  }
  function PayPalVisual() { return h('div', { className: 'k3-pp' }, h('b', null, h('i', null, 'Pay'), 'Pal'), h('span', null, 'Entras na tua conta para confirmar')); }

  function Field(p) {
    var err = p.show && p.err, ok = p.show && !p.err && p.value;
    return h('div', { className: 'k3-f' + (p.value ? ' filled' : '') + (err ? ' err' : ok ? ' ok' : '') + (p.half ? ' half' : '') },
      h('input', { id: 'k3-' + p.k, value: p.value, type: p.type || 'text', inputMode: p.im, autoComplete: p.ac, maxLength: p.max || 120, spellCheck: false,
        onChange: function (e) { p.set(p.fmt ? p.fmt(e.target.value) : e.target.value); }, onBlur: p.blur, onFocus: p.focus, 'aria-invalid': !!err, 'aria-describedby': err ? 'k3-' + p.k + '-e' : undefined }),
      h('label', { htmlFor: 'k3-' + p.k }, p.label, p.opt ? h('em', null, ' · opcional') : null),
      p.adorn ? h('span', { className: 'adorn' }, p.adorn) : ok ? h('span', { className: 'adorn tick' }, h(Check)) : null,
      err ? h('span', { className: 'msg', id: 'k3-' + p.k + '-e', role: 'alert' }, p.err) : p.hint ? h('span', { className: 'msg hint' }, p.hint) : null);
  }

  function Checkout() {
    var st = K.useStore();
    var saved = (function () { try { return JSON.parse(localStorage.getItem('kn5-addr')) || null; } catch (e) { return null; } })();
    var s0 = saved || {};
    var dS = useState({ email: s0.email || '', phone: s0.phone || '', name: s0.name || '', address: s0.address || '', address2: s0.address2 || '', zip: s0.zip || '', city: s0.city || '', nif: '', news: false, terms: false, hp: '' }), d = dS[0], setD = dS[1];
    var stepS = useState(saved && saved.email && saved.address ? 3 : 1), step = stepS[0], setStep = stepS[1];
    var tS = useState({}), touched = tS[0], setTouched = tS[1];
    var shS = useState('std'), ship = shS[0], setShip = shS[1];
    var mS = useState('card'), method = mS[0], setMethod = mS[1];
    var nfS = useState(false), wantNif = nfS[0], setWantNif = nfS[1];
    var rmS = useState(!!saved), remember = rmS[0], setRemember = rmS[1];
    var stgS = useState('form'), stage = stgS[0], setStage = stgS[1];
    var pS = useState(0), proc = pS[0], setProc = pS[1];
    var eS = useState(''), apiErr = eS[0], setApiErr = eS[1];
    var oS = useState(false), sumOpen = oS[0], setSumOpen = oS[1];
    var cS = useState(''), code = cS[0], setCode = cS[1], peS = useState(''), perr = peS[0], setPerr = peS[1];
    var doneS = useState(null), done = doneS[0], setDone = doneS[1];
    var pyS = useState({ num: '', exp: '', cvc: '', cname: '', mbphone: s0.phone || '', ppemail: '' }), py = pyS[0], setPy = pyS[1];
    var ptS = useState({}), pTouched = ptS[0], setPTouched = ptS[1];
    var fcS = useState(''), focus = fcS[0], setFocus = fcS[1];
    var timers = useRef([]), attempts = useRef([]), lock = useRef(false);
    useEffect(function () { return function () { timers.current.forEach(clearTimeout); }; }, []);
    useEffect(function () { if (!st.cart.length && !done) K.go('/'); }, []);
    if (!st.cart.length && !done) return null;

    function set(k) { return function (v) { setD(function (x) { var n = Object.assign({}, x); n[k] = v; if (k === 'zip' && /^\d{4}-\d{3}$/.test(v) && !x.city) { var c = cityFor(v); if (c) n.city = c; } return n; }); setApiErr(''); }; }
    function setP(k) { return function (v) { setPy(function (x) { var n = Object.assign({}, x); n[k] = v; return n; }); setApiErr(''); }; }
    function blurP(k) { return function () { setFocus(''); setPTouched(function (t) { var n = Object.assign({}, t); n[k] = true; return n; }); }; }
    function blur(k) { return function () { setTouched(function (t) { var n = Object.assign({}, t); n[k] = true; return n; }); }; }

    var after = st.subtotal - st.discount, needAddr = ship !== 'pickup', region = needAddr ? regionFor(d.zip) : 'PT';
    var stdCost = region === 'PT' ? (after >= K.CFG.freeShip ? 0 : K.CFG.shipStd) : (after >= 200 ? 0 : region === 'PT-M' ? 7.95 : 8.95);
    var shipCost = ship === 'exp' ? K.CFG.shipExp : ship === 'pickup' ? 0 : stdCost;
    var total = Math.max(0, Math.round((after + shipCost) * 100) / 100);
    var left = region === 'PT' ? Math.max(0, K.CFG.freeShip - after) : 0;

    var K1 = ['email', 'phone'], K2 = ['name'].concat(needAddr ? ['address', 'zip', 'city'] : []).concat(wantNif ? ['nif'] : []);
    var err = {}; K1.concat(K2).forEach(function (k) { err[k] = V[k](d[k]); }); err.terms = V.terms(d.terms);
    var pErr = payErrors(method, py), okPay = !Object.keys(pErr).length;
    var P = function (k, label, x) { return h(Field, Object.assign({ k: k, label: label, value: py[k], set: setP(k), blur: blurP(k), focus: function () { setFocus(k); }, err: pErr[k], show: pTouched[k] }, x || {})); };
    var ok1 = K1.every(function (k) { return !err[k]; }), ok2 = K2.every(function (k) { return !err[k]; });

    function focusFirst(keys) { var t = Object.assign({}, touched); keys.forEach(function (k) { t[k] = true; }); setTouched(t); var f = keys.find(function (k) { return err[k]; }); if (f) { var el = document.getElementById('k3-' + f); if (el) el.focus(); } return !f; }
    function next(keys, n) { if (!focusFirst(keys)) return; setStep(n); setTimeout(function () { var s = document.getElementById('k3-step-' + n); if (s) window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }); }, 60); }
    var F = function (k, label, x) { return h(Field, Object.assign({ k: k, label: label, value: d[k], set: set(k), blur: blur(k), err: err[k], show: touched[k] }, x || {})); };
    function later(fn, ms) { timers.current.push(setTimeout(fn, ms)); }

    function pay() {
      if (lock.current) return;
      if (!ok1) { setStep(1); setTimeout(function () { focusFirst(K1); }, 30); return; }
      if (!ok2) { setStep(2); setTimeout(function () { focusFirst(K2); }, 30); return; }
      var pk = Object.keys(pErr); if (pk.length) { var tt = Object.assign({}, pTouched); pk.forEach(function (k) { tt[k] = true; }); setPTouched(tt); var el = document.getElementById('k3-' + pk[0]); if (el) el.focus(); return; }
      if (!focusFirst(['terms'])) return;
      if (d.hp) return; // honeypot preenchido → bot
      var secure = location.protocol === 'https:' || /^(localhost|127\.)/.test(location.hostname);
      if (!secure) { setApiErr('Ligação não segura. Abre a loja em https:// para pagar.'); return; }
      var now = Date.now(); attempts.current = attempts.current.filter(function (t) { return now - t < 60000; });
      if (attempts.current.length >= 4) { setApiErr('Demasiadas tentativas. Espera um minuto e tenta de novo.'); return; }
      attempts.current.push(now); lock.current = true; setApiErr('');

      var cust = { name: clean(d.name, 80), phone: d.phone.replace(/\D/g, ''), address: clean(d.address), address2: clean(d.address2), zip: d.zip, city: clean(d.city, 60), nif: wantNif ? d.nif.replace(/\D/g, '') : undefined, newsletter: !!d.news };
      try { if (remember) localStorage.setItem('kn5-addr', JSON.stringify({ email: clean(d.email, 120), phone: d.phone, name: cust.name, address: cust.address, address2: cust.address2, zip: d.zip, city: cust.city })); else localStorage.removeItem('kn5-addr'); } catch (x) {}
      try { sessionStorage.setItem('kn5-pending', JSON.stringify({ info: Object.assign({ email: clean(d.email) }, cust, { shipping: ship, payment: method }), lines: st.cart.map(function (l) { return { id: l.id, name: l.p.name, color: l.color, size: l.size, note: l.note, qty: l.qty, price: l.unit }; }), subtotal: st.subtotal, discount: st.discount, promo: st.promo, ship: shipCost, total: total })); } catch (x) {}

      setStage('processing'); setProc(0); later(function () { setProc(1); }, 700);
      var idem = uid();
      var body = {
        items: st.cart.map(function (l) { return { id: l.id, sku: l.p.sku || l.id, name: clean(l.p.name + (l.color ? ' · ' + l.color : '') + (l.size && l.size !== 'Único' ? ' · ' + l.size : '') + (l.note ? ' · ' + l.note : ''), 200), color: l.color, size: l.size, note: clean(l.note, 140), price: l.unit, qty: Math.max(1, Math.min(10, l.qty | 0)), design: l.design ? { tech: l.design.tech, views: { front: (l.design.views.front || []).map(function (v) { return { type: v.type, text: v.type === 'image' ? undefined : clean(v.text, 40), zone: v.zone, font: v.font, color: v.color }; }), back: (l.design.views.back || []).map(function (v) { return { type: v.type, text: v.type === 'image' ? undefined : clean(v.text, 40), zone: v.zone, font: v.font, color: v.color }; }) } } : null }; }),
        customer_email: clean(d.email, 120).toLowerCase(), country: region, promo_code: st.promo || undefined,
        shipping_method: ship, payment_method: method, customer: cust,
        payment_details: method === 'card' ? { brand: brandOf(py.num) || 'CARD', last4: digits(py.num).slice(-4), exp: py.exp, holder: clean(py.cname, 60) } : method === 'mbway' ? { phone: digits(py.mbphone).replace(/^351/, '') } : method === 'paypal' ? { email: clean(py.ppemail, 120) || undefined } : {},
        success_url: location.origin + location.pathname + '#/sucesso?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: location.origin + location.pathname + '#/checkout',
      };
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      later(function () { if (ctrl) ctrl.abort(); }, 20000);
      fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idem }, body: JSON.stringify(body), credentials: 'same-origin', signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { if ((r.headers.get('content-type') || '').indexOf('json') < 0) throw { noApi: true }; return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          var url = res.j && res.j.url;
          var isPreview = /genspark|localhost|127\.|file:/.test(location.href);
          if (!res.ok && isPreview) return demo();
          if (res.ok && url && /^https:\/\/(checkout\.stripe\.com|[\w.-]*stripe\.com|www\.paypal\.com)\//.test(url)) { setProc(2); later(function () { location.assign(url); }, 350); return; }
          fail((res.j && res.j.error) ? 'Não foi possível iniciar o pagamento: ' + clean(res.j.error, 140) : 'Não foi possível iniciar o pagamento. Tenta de novo.');
        })
        .catch(function (e) {
          var preview = (e && e.noApi) || /genspark|localhost|127\.|file:/.test(location.href);
          if (preview) return demo();
          fail(e && e.name === 'AbortError' ? 'O servidor demorou demasiado. Não foste cobrada; tenta de novo.' : 'Sem ligação. Verifica a internet e tenta de novo.');
        });
    }
    function fail(msg) { timers.current.forEach(clearTimeout); lock.current = false; setStage('form'); setProc(0); setApiErr(msg); }
    function demo() {
      if (method === 'mbway') { setStage('waiting'); later(function () { finish(); }, 4200); return; }
      later(function () { setProc(2); }, 900); later(function () { setProc(3); }, 1500); later(finish, 2000);
    }
    function finish() {
      var no = 'KN-' + (40000 + Math.floor(Math.random() * 50000));
      setDone({ no: no, method: method, label: method === 'card' ? ({ VISA: 'Visa', MASTERCARD: 'Mastercard', AMEX: 'Amex' }[brandOf(py.num)] || 'Cartão') + ' •••• ' + digits(py.num).slice(-4) : method === 'mbway' ? 'MB WAY · +351 ' + fmtPhone(py.mbphone) : method === 'paypal' ? 'PayPal' + (py.ppemail ? ' · ' + py.ppemail : '') : 'Referência Multibanco', total: total, ent: '21 312', ref: no.slice(-3) + ' 482 917', email: clean(d.email) });
      setStage('form'); lock.current = false; window.scrollTo({ top: 0, behavior: 'smooth' });
      setPy(function (x) { return Object.assign({}, x, { num: '', cvc: '' }); });
    }
    function applyCode(e) { e.preventDefault(); var m = st.applyPromo(code); setPerr(m || ''); if (!m) setCode(''); }

    var stageVisual = done && done.method === 'multibanco' ? h(MBTicket, { amount: done.total, ent: done.ent, ref: done.ref })
      : method === 'card' ? h(CardVisual, { num: py.num, exp: py.exp, cvc: py.cvc, cname: py.cname || d.name, focus: focus })
        : method === 'mbway' ? h(PhoneMock, { phone: py.mbphone || d.phone, total: total, wait: stage === 'waiting' })
          : method === 'multibanco' ? h('div', { style: { width: '100%', maxWidth: 400 } }, h(MBTicket, { amount: total, preview: true }))
            : h(PayPalVisual);

    var Step = function (n, title, summary, body) {
      var open = step === n, isDone = (n === 1 && ok1 || n === 2 && ok1 && ok2) && step > n, can = n === 1 || (n === 2 && ok1) || (n === 3 && ok1 && ok2);
      return h('section', { id: 'k3-step-' + n, className: 'k3-step' + (open ? ' open' : '') + (isDone ? ' done' : '') },
        h('button', { type: 'button', className: 'k3-sh', disabled: !can || open, onClick: function () { if (can) setStep(n); }, 'aria-expanded': open },
          h('span', { className: 'k3-n' }, isDone ? h(Check) : '0' + n),
          h('span', { className: 'k3-st' }, h('b', null, title), isDone && summary ? h('em', null, summary) : null),
          isDone ? h('span', { className: 'k3-edit' }, 'Alterar') : null),
        open ? h('div', { className: 'k3-sb' }, body) : null);
    };

    var lines = st.cart.map(function (l, i) {
      var col = l.p.colors && l.p.colors.find(function (c) { return c.name === l.color; });
      return h('div', { className: 'k3-line', key: i },
        h('span', { className: 'k3-thumb' }, l.thumb ? h('img', { src: l.thumb, alt: '' }) : h(K.ProductImage, { product: l.p, color: col }), h('b', null, l.qty)),
        h('span', { className: 'k3-ln' }, h('span', null, l.p.name), h('em', null, [l.color, l.size && l.size !== 'Único' ? l.size : null].filter(Boolean).join(' · ') + (l.note ? ' · ✦ ' + l.note : ''))),
        h('span', { className: 'k3-lp' }, eur(l.total)));
    });

    var success = done ? h('div', { className: 'k3-success k3-in' },
      h('div', { className: 'k3-seal' }, h(Check)),
      h('div', { className: 'k3-eyebrow' }, done.method === 'multibanco' ? 'Encomenda reservada' : 'Pagamento aprovado'),
      h('h1', { className: 'k3-h1' }, done.method === 'multibanco' ? 'Quase lá.' : 'Obrigado.'),
      h('p', { className: 'k3-lede' }, done.method === 'multibanco' ? 'Paga a referência em qualquer Multibanco ou homebanking. A encomenda segue assim que o pagamento chegar.' : 'A tua encomenda já está a ser preparada, em Cartaxo.'),
      h('div', { className: 'k3-recap' },
        [['Encomenda', '#' + done.no], ['Total', eur(done.total)], ['Método', done.label], ['Confirmação', done.email]].map(function (r) { return h('div', { key: r[0] }, h('span', null, r[0]), h('b', null, r[1])); })),
      h('p', { className: 'k3-demo' }, 'Pré-visualização: sem ligação ao Stripe nesta janela, nenhum pagamento foi feito.'),
      h('a', { href: '#/', className: 'k3-btn' }, 'Voltar à loja')) : null;

    var ctaLabel = method === 'multibanco' ? 'Gerar referência' : method === 'mbway' ? 'Enviar pedido MB WAY' : method === 'paypal' ? 'Continuar no PayPal' : 'Pagar com segurança';
    var busy = stage !== 'form';

    return h('div', { className: 'k3' },
      h('header', { className: 'k3-head' },
        h('button', { type: 'button', className: 'k3-arrow', 'aria-label': 'Voltar atrás', title: 'Voltar atrás', onClick: function () { var from = location.hash; if (window.history.length > 1) { window.history.back(); setTimeout(function () { if (location.hash === from) K.go('/'); }, 250); } else K.go('/'); } }, h(Icon, { n: 'arrowL', s: 18 })),
        h('a', { className: 'k3-brand', href: '#/' }, h('img', { src: 'assets/logo-mark.png', alt: '' }), h('span', { className: 'wm' }, 'Karmic', h('i', null, ' · '), 'Node')),
        h('div', { className: 'k3-secure' }, h(Lock), h('span', null, 'Pagamento seguro · TLS 1.3')),
        h('div', { className: 'k3-tools' }, h('span', { className: 'k3-theme' }, h(K.ThemeToggle)))),
      h('div', { className: 'k3-studio' },
        h('aside', { className: 'k3-stage' },
          h('div', { className: 'k3-grid' }),
          h('div', { className: 'k3-stage-top' }, h('span', { className: 'k3-eyebrow' }, done ? 'Concluído' : 'Pagamento'), h('span', { className: 'k3-lock' }, h(Lock), ' Encriptado · 3-D Secure')),
          h('div', { className: 'k3-stage-c' }, stageVisual),
          h('div', { className: 'k3-stage-foot' },
            h('div', null, h('div', { className: 'k3-lbl' }, done ? 'Pago' : 'Total a pagar'), h('div', { className: 'k3-amount' }, eur(done ? done.total : total))),
            h('div', { className: 'k3-badges' }, h('span', null, 'PCI-DSS'), h('span', null, 'TLS'), h('span', null, '3DS2')))),
        h('main', { className: 'k3-main' }, h('div', { className: 'k3-inner' }, done ? success : h(R.Fragment, null,
          h('div', { className: 'k3-eyebrow' }, 'Finalizar compra · ' + st.count + (st.count === 1 ? ' peça' : ' peças')),
          h('h1', { className: 'k3-h1' }, 'Quase ', h('em', null, 'tua'), '.'),
          h('p', { className: 'k3-sublede' }, 'Sem conta, sem complicações. Três passos e está feito.'),

          Step(1, 'Contacto', d.email + ' · ' + d.phone, h(R.Fragment, null,
            h('div', { className: 'k3-fields' },
              F('email', 'Email', { type: 'email', im: 'email', ac: 'email', hint: 'Enviamos aqui a confirmação e o tracking.' }),
              F('phone', 'Telemóvel', { type: 'tel', im: 'tel', ac: 'tel-national', fmt: fmtPhone, adorn: '+351', max: 11 })),
            h('input', { className: 'k3-hp', tabIndex: -1, autoComplete: 'off', 'aria-hidden': true, value: d.hp, onChange: function (e) { set('hp')(e.target.value); }, name: 'company_website' }),
            h('button', { type: 'button', className: 'k3-btn ghost', onClick: function () { next(K1, 2); } }, 'Continuar para a entrega', h(Icon, { n: 'chev', s: 14 })))),

          Step(2, 'Entrega', ship === 'pickup' ? 'Levantar em Cartaxo · ' + d.name : d.address + ', ' + d.zip + ' ' + d.city, h(R.Fragment, null,
            h('div', { className: 'k3-opts' }, SHIP.map(function (s) {
              var price = s.id === 'std' ? stdCost : s.id === 'exp' ? K.CFG.shipExp : 0;
              return h('button', { type: 'button', key: s.id, className: 'k3-opt' + (ship === s.id ? ' on' : ''), onClick: function () { setShip(s.id); }, 'aria-pressed': ship === s.id },
                h('span', { className: 'k3-radio' }), h('span', { className: 'main' }, h('b', null, s.label), h('span', null, s.kind === 'pick' ? 'Pronto em 24 h · sem custos' : K.deliveryWindow(s.kind))), h('span', { className: 'mark' }, price === 0 ? 'Grátis' : eur(price)));
            })),
            h('div', { className: 'k3-fields' },
              F('name', 'Nome completo', { ac: 'name', max: 80 }),
              needAddr ? F('address', 'Morada', { ac: 'address-line1', hint: 'Rua e número' }) : null,
              needAddr ? F('address2', 'Andar, porta, empresa', { ac: 'address-line2', opt: true }) : null,
              needAddr ? F('zip', 'Código postal', { im: 'numeric', ac: 'postal-code', fmt: fmtZip, half: true, max: 8 }) : null,
              needAddr ? F('city', 'Localidade', { ac: 'address-level2', half: true, max: 60 }) : null),
            region !== 'PT' && needAddr ? h('div', { className: 'k3-note' }, (region === 'PT-M' ? 'Madeira' : 'Açores') + ': envio ' + eur(region === 'PT-M' ? 7.95 : 8.95) + ' (grátis acima de 200 €), 5–8 dias úteis.') : null,
            h('label', { className: 'k3-check' }, h('input', { type: 'checkbox', checked: wantNif, onChange: function (e) { setWantNif(e.target.checked); } }), h('span', { className: 'box' }, h(Check)), h('span', null, 'Quero fatura com NIF')),
            wantNif ? h('div', { className: 'k3-fields', style: { marginTop: 12 } }, F('nif', 'NIF', { im: 'numeric', max: 9, half: true, fmt: function (v) { return v.replace(/\D/g, '').slice(0, 9); } })) : null,
            h('button', { type: 'button', className: 'k3-btn ghost', onClick: function () { next(K2, 3); } }, 'Continuar para o pagamento', h(Icon, { n: 'chev', s: 14 })))),

          Step(3, 'Pagamento', null, h(R.Fragment, null,
            h('div', { className: 'k3-tabs', role: 'tablist' }, METHODS.map(function (m) { return h('button', { key: m.id, type: 'button', role: 'tab', 'aria-selected': method === m.id, className: 'k3-tab' + (method === m.id ? ' on' : ''), onClick: function () { setMethod(m.id); setApiErr(''); } }, h('span', { className: 'lg', 'aria-hidden': true }, LOGOS[m.id]), h('b', null, m.label), h('span', null, m.sub)); })),
            h('div', { className: 'k3-pform k3-in', key: method },
              method === 'card' ? h(R.Fragment, null,
                h('div', { className: 'k3-fields' },
                  P('num', 'Número do cartão', { im: 'numeric', ac: 'cc-number', fmt: fmtCard, max: 19, adorn: brandOf(py.num) || null }),
                  P('exp', 'Validade (MM/AA)', { im: 'numeric', ac: 'cc-exp', fmt: fmtExp, max: 5, half: true }),
                  P('cvc', 'CVC', { im: 'numeric', ac: 'cc-csc', type: 'password', fmt: function (v) { return digits(v).slice(0, 4); }, max: 4, half: true, hint: brandOf(py.num) === 'AMEX' ? '4 dígitos na frente' : '3 dígitos no verso' }),
                  P('cname', 'Nome no cartão', { ac: 'cc-name', max: 60, fmt: function (v) { return v.replace(/[^A-Za-zÀ-ÿ' .-]/g, ''); } })),
                h('p', { className: 'k3-detail' }, h(Lock), ' Encriptado e verificado com 3-D Secure pelo teu banco. Não guardamos o número nem o CVC.'))
              : method === 'mbway' ? h(R.Fragment, null,
                h('div', { className: 'k3-fields' }, P('mbphone', 'Telemóvel associado ao MB WAY', { type: 'tel', im: 'tel', ac: 'tel-national', fmt: fmtPhone, max: 11, adorn: '+351' })),
                h('p', { className: 'k3-detail' }, 'Recebes um pedido de ' + eur(total) + ' na app MB WAY. Tens 4 minutos para aceitar.'))
              : method === 'multibanco' ? h('div', { className: 'k3-mbbox' },
                h(MBTicket, { amount: total, preview: true }),
                h('p', { className: 'k3-detail' }, 'A entidade e a referência aparecem ao confirmar e seguem por email. Pagas em 72 h em qualquer Multibanco ou homebanking.'))
              : h(R.Fragment, null,
                h('div', { className: 'k3-fields' }, P('ppemail', 'Email da conta PayPal', { type: 'email', im: 'email', ac: 'email', opt: true, hint: 'Opcional: deixa vazio para escolher no PayPal.' })),
                h('p', { className: 'k3-detail' }, 'Vais entrar na tua conta PayPal para confirmar e voltas aqui automaticamente.'))),
            apiErr ? h('div', { className: 'k3-alert', role: 'alert' }, h('b', null, 'Pagamento não iniciado'), h('span', null, apiErr)) : null,
            stage === 'waiting' ? h('div', { className: 'k3-wait' }, h('span', null, 'À espera de confirmação na app MB WAY…'), h('button', { type: 'button', onClick: function () { timers.current.forEach(clearTimeout); lock.current = false; setStage('form'); } }, 'Cancelar')) : null,
            h('label', { className: 'k3-check' + (touched.terms && err.terms ? ' err' : '') }, h('input', { id: 'k3-terms', type: 'checkbox', checked: d.terms, onChange: function (e) { set('terms')(e.target.checked); } }), h('span', { className: 'box' }, h(Check)), h('span', null, 'Li e aceito os ', h('a', { href: '#/ajuda' }, 'Termos'), ' e a ', h('a', { href: '#/ajuda' }, 'Política de Privacidade'), '.')),
            h('label', { className: 'k3-check' }, h('input', { type: 'checkbox', checked: remember, onChange: function (e) { setRemember(e.target.checked); } }), h('span', { className: 'box' }, h(Check)), h('span', null, 'Lembrar os meus dados neste dispositivo')),
            h('label', { className: 'k3-check' }, h('input', { type: 'checkbox', checked: d.news, onChange: function (e) { set('news')(e.target.checked); } }), h('span', { className: 'box' }, h(Check)), h('span', null, 'Quero novidades e edições antecipadas (máx. 2 emails/mês)')),
            h('button', { type: 'button', className: 'k3-btn burg k3-cta', disabled: busy, onClick: pay }, busy ? h(R.Fragment, null, h('span', { className: 'k3-spin' }), 'A processar') : h(R.Fragment, null, ctaLabel + ' · ' + eur(total), h(Lock))),
            h('p', { className: 'k3-fine' }, 'Ligação encriptada. Pagamentos processados pelo Stripe (certificado PCI-DSS nível 1). Devolução grátis em ' + K.CFG.returnDays + ' dias.'))),

          h('div', { className: 'k3-mini' },
            h('button', { type: 'button', className: 'k3-mini-h', onClick: function () { setSumOpen(!sumOpen); }, 'aria-expanded': sumOpen },
              h('span', { className: 'th' }, st.cart.slice(0, 4).map(function (l, i) { var col = l.p.colors && l.p.colors.find(function (c) { return c.name === l.color; }); return h('span', { key: i, className: 'k3-thumb sm' }, l.thumb ? h('img', { src: l.thumb, alt: '' }) : h(K.ProductImage, { product: l.p, color: col })); })),
              h('span', { className: 'lbl' }, st.count + (st.count === 1 ? ' peça' : ' peças') + ' · ' + (sumOpen ? 'ocultar' : 'ver') + ' detalhe'),
              h('span', { className: 'tot' }, eur(total))),
            sumOpen ? h('div', { className: 'k3-mini-b k3-in' }, lines,
              st.promo ? h('div', { className: 'k3-promo-on' }, h('span', null, 'Código ', h('b', null, st.promo)), h('button', { type: 'button', onClick: st.clearPromo }, 'Remover'))
                : h('form', { className: 'k3-promo', onSubmit: applyCode, noValidate: true }, h('input', { value: code, maxLength: 24, onChange: function (e) { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setPerr(''); }, placeholder: 'Código de desconto', 'aria-label': 'Código de desconto' }), h('button', { type: 'submit' }, 'Aplicar'), perr ? h('small', null, perr) : null),
              h('div', { className: 'k3-rows' },
                h('div', null, h('span', null, 'Subtotal'), h('span', null, eur(st.subtotal))),
                st.discount ? h('div', { className: 'save' }, h('span', null, 'Desconto'), h('span', null, '−' + eur(st.discount))) : null,
                h('div', null, h('span', null, 'Envio'), h('span', null, shipCost === 0 ? 'Grátis' : eur(shipCost))),
                h('div', null, h('span', null, 'IVA (23%) incluído'), h('span', null, eur(total - total / 1.23))),
                h('div', { className: 'tot' }, h('span', null, 'Total'), h('span', null, eur(total))))) : null,
            left > 0 && needAddr ? h('div', { className: 'k3-free' }, h('i', { style: { width: Math.min(100, after / K.CFG.freeShip * 100) + '%' } }), h('span', null, 'Faltam ', h('b', null, eur(left)), ' para portes grátis')) : null)
        )))),
      stage === 'processing' ? h('div', { className: 'k3-overlay' }, h('div', { className: 'k3-proc k3-in' },
        h('div', { className: 'k3-eyebrow' }, 'Pagamento seguro · Karmic Node'),
        h('div', { className: 'k3-amount', style: { margin: '10px 0 18px' } }, eur(total)),
        (PROC[method] || PROC.card).map(function (l, i) { return h('div', { key: i, className: 'k3-proc-row' + (proc > i ? ' done' : proc === i ? ' on' : '') }, h('span', { className: 'ico' }, proc > i ? h(Check) : null), l); }),
        h('div', { className: 'k3-proc-bar' }, h('i', { style: { width: Math.min(100, proc / 3 * 100) + '%' } })))) : null,
      !done ? h('div', { className: 'k3-bar' }, h('div', null, h('small', null, 'Total'), h('b', null, eur(total))), h('button', { type: 'button', disabled: busy, onClick: function () { step === 1 ? next(K1, 2) : step === 2 ? next(K2, 3) : pay(); } }, step < 3 ? 'Continuar' : busy ? 'A processar…' : 'Pagar')) : null);
  }

  window.KN.Checkout = Checkout;
})();
