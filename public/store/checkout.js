// Karmic Node — Checkout, Confirmação, Conta, Favoritos, Ajuda, Personalizar
(function () {
  'use strict';
  var R = React, h = R.createElement, useState = R.useState, useEffect = R.useEffect, useMemo = R.useMemo;
  var K = window.KN, Icon = K.Icon, eur = K.eur, go = K.go;

  // ───── validação adaptativa ─────
  var V = {
    email: function (v) { if (!v) return 'Escreve o teu email.'; if (v.indexOf('@') < 0) return 'Falta o “@” no email.'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Confirma a parte depois do “@” (ex.: gmail.com).'; return ''; },
    name: function (v) { return v.trim().length < 2 ? 'Escreve o teu nome.' : ''; },
    address: function (v) { if (!v.trim()) return 'Escreve a morada.'; if (!/\d/.test(v)) return 'Acrescenta o número da porta.'; return ''; },
    zip: function (v) { if (!v) return 'Escreve o código postal.'; return /^\d{4}-\d{3}$/.test(v) ? '' : 'Formato 0000-000 (ex.: 2070-001).'; },
    city: function (v) { return v.trim().length < 2 ? 'Escreve a localidade.' : ''; },
    phone: function (v) { var d = v.replace(/\D/g, ''); if (!d) return 'Precisamos do telemóvel para a transportadora.'; return /^9\d{8}$/.test(d.replace(/^351/, '')) ? '' : 'Número português com 9 dígitos, começado por 9.'; },
    nif: function (v) { if (!v) return ''; var d = v.replace(/\D/g, ''); if (d.length !== 9) return 'O NIF tem 9 dígitos.'; var s = 0; for (var i = 0; i < 8; i++) s += +d[i] * (9 - i); var c = 11 - s % 11; if (c >= 10) c = 0; return c === +d[8] ? '' : 'Este NIF não é válido. Confirma os dígitos.'; },
  };
  function fmtZip(v) { var d = v.replace(/\D/g, '').slice(0, 7); return d.length > 4 ? d.slice(0, 4) + '-' + d.slice(4) : d; }
  function fmtPhone(v) { var d = v.replace(/\D/g, '').slice(0, 9); return d.replace(/(\d{3})(\d{0,3})(\d{0,3})/, function (_, a, b, c) { return [a, b, c].filter(Boolean).join(' '); }); }

  function Field(p) {
    var err = p.touched && p.err, good = p.touched && !p.err && p.value;
    return h('div', { className: 'fld' + (err ? ' bad' : good ? ' good' : '') + (p.full ? ' full' : '') },
      h('label', { htmlFor: p.id }, p.label, p.opt ? h('em', null, ' (opcional)') : null),
      h('input', { id: p.id, value: p.value, onChange: function (e) { p.onChange(p.fmt ? p.fmt(e.target.value) : e.target.value); }, onBlur: p.onBlur, type: p.type || 'text', inputMode: p.inputMode, autoComplete: p.ac, placeholder: p.ph, 'aria-invalid': !!err, 'aria-describedby': err ? p.id + '-e' : undefined }),
      err ? h('span', { className: 'msg', id: p.id + '-e', role: 'alert' }, p.err) : null);
  }

  function Summary(p) {
    var st = K.useStore();
    var pcS = useState(''), code = pcS[0], setCode = pcS[1], peS = useState(''), perr = peS[0], setPerr = peS[1];
    function apply(e) { e.preventDefault(); var m = st.applyPromo(code); setPerr(m || ''); if (!m) setCode(''); }
    return h('div', null,
      st.cart.map(function (l, i) { var col = l.p.colors.find(function (c) { return c.name === l.color; }); return h('div', { className: 'co-line', key: i },
        h('div', { className: 'pm' }, l.thumb ? h('img', { src: l.thumb, alt: '', style: { objectFit: 'contain', borderRadius: 8 } }) : h(K.ProductImage, { product: l.p, color: col, style: { position: 'absolute', inset: 0, aspectRatio: 'auto' } }), h('span', { className: 'badge' }, l.qty)),
        h('div', { style: { fontSize: 13 } }, h('div', { style: { fontWeight: 500 } }, l.p.name), h('div', { className: 'muted' }, [l.color, l.size && l.size !== 'Único' ? l.size : null, l.note ? '“' + l.note + '”' : null].filter(Boolean).join(' · '))),
        h('span', { className: 'price', style: { fontSize: 14 } }, eur(l.total))); }),
      st.promo ? h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0', padding: '10px 12px', background: 'var(--surface)', borderRadius: 8, fontSize: 13 } },
        h('span', { style: { display: 'flex', gap: 8, alignItems: 'center' } }, h(Icon, { n: 'tag', s: 15 }), h('b', null, st.promo), st.discount ? null : h('span', { style: { color: 'var(--warn)' } }, '· mínimo ' + eur(st.promoDef.min))),
        h('button', { className: 'link', onClick: st.clearPromo }, 'Remover')) :
      h('form', { onSubmit: apply, noValidate: true }, h('div', { className: 'promo' },
        h('input', { value: code, onChange: function (e) { setCode(e.target.value); setPerr(''); }, placeholder: 'Código de desconto', 'aria-label': 'Código de desconto' }),
        h('button', { className: 'btn ghost sm', style: { height: 44 }, type: 'submit' }, 'Aplicar')),
        perr ? h('div', { className: 'err-txt', style: { marginTop: -6, marginBottom: 10 } }, perr) : null),
      h('div', { className: 'sum-row' }, h('span', null, 'Subtotal'), h('span', { className: 'price' }, eur(st.subtotal))),
      st.discount ? h('div', { className: 'sum-row', style: { color: 'var(--ok)' } }, h('span', null, 'Desconto'), h('span', null, '−' + eur(st.discount))) : null,
      h('div', { className: 'sum-row' }, h('span', null, 'Envio'), h('span', null, p.ship === 0 ? 'Grátis' : eur(p.ship))),
      h('div', { className: 'sum-row tot' }, h('span', null, 'Total'), h('span', { className: 'price' }, eur(p.total))),
      h('div', { className: 'muted', style: { fontSize: 12, textAlign: 'right' } }, 'IVA incluído'));
  }

  function Checkout() {
    var st = K.useStore();
    var fS = useState(function () { try { return JSON.parse(localStorage.getItem('kn5-addr')) || {}; } catch (e) { return {}; } }), f0 = fS[0];
    var dS = useState({ email: f0.email || '', name: f0.name || '', address: f0.address || '', address2: f0.address2 || '', zip: f0.zip || '', city: f0.city || '', phone: f0.phone || '', nif: '' }), d = dS[0], setD = dS[1];
    var tS = useState({}), touched = tS[0], setTouched = tS[1];
    var shS = useState('std'), ship = shS[0], setShip = shS[1];
    var pyS = useState('mbway'), pay = pyS[0], setPay = pyS[1];
    var nfS = useState(false), wantNif = nfS[0], setWantNif = nfS[1];
    var sbS = useState(false), sending = sbS[0], setSending = sbS[1];
    var mS = useState(false), mini = mS[0], setMini = mS[1];
    var ceS = useState(''), checkoutErr = ceS[0], setCheckoutErr = ceS[1];
    useEffect(function () { if (!st.cart.length) go('/'); }, []);
    if (!st.cart.length) return null;
    var after = st.subtotal - st.discount;
    var shipCost = ship === 'exp' ? K.CFG.shipExp : ship === 'pickup' ? 0 : (after >= K.CFG.freeShip ? 0 : K.CFG.shipStd);
    var total = Math.max(0, after + shipCost);
    var needAddr = ship !== 'pickup';
    var keys = ['email', 'name', 'phone'].concat(needAddr ? ['address', 'zip', 'city'] : []).concat(wantNif ? ['nif'] : []);
    var errs = {}; keys.forEach(function (k) { errs[k] = V[k](d[k]); });
    function set(k) { return function (v) { setD(function (x) { var n = Object.assign({}, x); n[k] = v; return n; }); }; }
    function blur(k) { return function () { setTouched(function (t) { var n = Object.assign({}, t); n[k] = true; return n; }); }; }
    function submit(e) {
      e.preventDefault();
      setCheckoutErr('');
      var t = {}; keys.forEach(function (k) { t[k] = true; }); setTouched(t);
      var first = keys.find(function (k) { return errs[k]; });
      if (first) { var el = document.getElementById('f-' + first); if (el) { el.focus(); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' }); } return; }
      setSending(true);
      try { localStorage.setItem('kn5-addr', JSON.stringify({ email: d.email, name: d.name, address: d.address, address2: d.address2, zip: d.zip, city: d.city, phone: d.phone })); } catch (x) {}
      // Guarda os dados de entrega/contacto localmente para associar à encomenda
      // quando o Stripe confirmar o pagamento (ver store/pages.js → página /sucesso).
      try { localStorage.setItem('kn5-pending', JSON.stringify({ info: Object.assign({}, d, { shipping: ship, payment: pay }), lines: st.cart.map(function (l) { return { id: l.id, name: l.p.name, color: l.color, size: l.size, note: l.note, qty: l.qty, price: l.unit, thumb: l.thumb }; }), subtotal: st.subtotal, discount: st.discount, promo: st.promo, ship: shipCost, total: total })); } catch (x) {}
      var country = wantNif || needAddr ? 'PT' : 'PT';
      fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: st.cart.map(function (l) { return { id: l.id, sku: l.p.sku || l.id, name: l.p.name + (l.color ? ' · ' + l.color : '') + (l.size && l.size !== 'Único' ? ' · ' + l.size : ''), price: l.unit, qty: l.qty, image: l.thumb || null }; }),
          customer_email: d.email,
          country: country,
          promo_code: st.promo || undefined,
          success_url: window.location.origin + '/#/sucesso?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: window.location.origin + '/#/checkout',
        }),
      }).then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (res) {
          if (res.ok && res.data && res.data.url) {
            window.location.href = res.data.url;
          } else {
            setSending(false);
            setCheckoutErr((res.data && res.data.error) || 'Não foi possível iniciar o pagamento. Tenta novamente.');
          }
        })
        .catch(function () {
          setSending(false);
          setCheckoutErr('Erro de ligação. Verifica a internet e tenta novamente.');
        });
    }
    function express() { var el = document.getElementById('f-email'); if (el && !d.email) { el.focus(); setTouched({ email: true }); } }
    var F = function (k, label, extra) { return h(Field, Object.assign({ id: 'f-' + k, label: label, value: d[k], onChange: set(k), onBlur: blur(k), err: errs[k], touched: touched[k] }, extra || {})); };
    return h('main', { className: 'wrap' },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 4px' } },
        h('h1', { className: 'h2' }, 'Finalizar compra'),
        h('span', { className: 'muted', style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 } }, h(Icon, { n: 'lock', s: 15 }), 'Pagamento seguro')),
      h('p', { className: 'muted', style: { margin: '0 0 10px', fontSize: 14 } }, 'Não precisas de conta. Podes criar uma no fim, com um clique.'),
      h('div', { className: 'co-mini', style: { margin: '10px 0' } },
        h('button', { onClick: function () { setMini(!mini); }, style: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--soft)', borderRadius: 12, fontSize: 14 }, 'aria-expanded': mini },
          h('span', { style: { display: 'flex', gap: 8, alignItems: 'center' } }, h(Icon, { n: 'bag', s: 18 }), (mini ? 'Esconder' : 'Ver') + ' resumo (' + st.count + ')', h(Icon, { n: 'down', s: 16, style: { transform: mini ? 'rotate(180deg)' : 'none' } })),
          h('b', { className: 'price' }, eur(total))),
        mini ? h('div', { style: { padding: '12px 16px', background: 'var(--soft)', borderRadius: '0 0 12px 12px', marginTop: -6 } }, h(Summary, { ship: shipCost, total: total })) : null),
      h('div', { className: 'co' },
        h('form', { onSubmit: submit, noValidate: true },
          h('div', { style: { paddingBottom: 6 } },
            h('div', { className: 'eyebrow', style: { textAlign: 'center', marginBottom: 10 } }, 'Pagamento expresso'),
            h('div', { className: 'express' },
              h('button', { type: 'button', className: 'ap', onClick: function () { setPay('card'); express(); } }, 'Apple Pay'),
              h('button', { type: 'button', className: 'mbw', onClick: function () { setPay('mbway'); express(); } }, 'MB WAY'),
              h('button', { type: 'button', className: 'pp', onClick: function () { setPay('paypal'); express(); } }, 'PayPal')),
            h('div', { className: 'or' }, 'ou preenche os teus dados')),
          h('section', { className: 'co-sec' }, h('h2', null, h('i', null, '1'), 'Contacto'),
            h('div', { className: 'fields' },
              F('email', 'Email', { full: true, type: 'email', ac: 'email', inputMode: 'email', ph: 'nome@exemplo.pt' }),
              F('phone', 'Telemóvel', { full: true, type: 'tel', ac: 'tel-national', inputMode: 'tel', fmt: fmtPhone, ph: '912 345 678' }))),
          h('section', { className: 'co-sec' }, h('h2', null, h('i', null, '2'), 'Entrega'),
            h('div', { className: 'radio', role: 'radiogroup', 'aria-label': 'Método de entrega', style: { marginBottom: 16 } },
              [['std', 'Standard · CTT', 'Recebe ' + K.deliveryWindow('std'), after >= K.CFG.freeShip ? 0 : K.CFG.shipStd],
               ['exp', 'Expresso · DPD', 'Recebe ' + K.deliveryWindow('exp'), K.CFG.shipExp],
               ['pickup', 'Recolha na loja', 'Cartaxo · pronto em 24 h', 0]].map(function (o) {
                return h('label', { key: o[0], className: ship === o[0] ? 'on' : '' }, h('input', { type: 'radio', name: 'ship', checked: ship === o[0], onChange: function () { setShip(o[0]); } }),
                  h('span', { className: 'r-t' }, h('b', null, o[1]), h('span', null, o[2])), h('span', { className: 'r-p' }, o[3] === 0 ? 'Grátis' : eur(o[3])));
              })),
            h('div', { className: 'fields' },
              F('name', 'Nome completo', { full: true, ac: 'name' }),
              needAddr ? F('address', 'Morada', { full: true, ac: 'address-line1', ph: 'Rua e número' }) : null,
              needAddr ? F('address2', 'Andar, porta', { full: true, ac: 'address-line2', opt: true }) : null,
              needAddr ? F('zip', 'Código postal', { ac: 'postal-code', inputMode: 'numeric', fmt: fmtZip, ph: '0000-000' }) : null,
              needAddr ? F('city', 'Localidade', { ac: 'address-level2' }) : null),
            h('label', { style: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 14, fontSize: 14, cursor: 'pointer' } },
              h('input', { type: 'checkbox', checked: wantNif, onChange: function (e) { setWantNif(e.target.checked); }, style: { width: 18, height: 18, accentColor: 'var(--ink)' } }), 'Quero fatura com NIF'),
            wantNif ? h('div', { className: 'fields', style: { marginTop: 10 } }, F('nif', 'NIF', { inputMode: 'numeric', ph: '123456789' })) : null),
          h('section', { className: 'co-sec', style: { borderBottom: 0 } }, h('h2', null, h('i', null, '3'), 'Pagamento'),
            h('div', { className: 'radio', role: 'radiogroup', 'aria-label': 'Método de pagamento' },
              [['mbway', 'MB WAY', 'Confirma no telemóvel em 4 minutos'], ['card', 'Cartão de crédito ou débito', 'Visa, Mastercard, Apple Pay, Google Pay'], ['mb', 'Referência Multibanco', 'Paga em 48 h no multibanco ou homebanking'], ['paypal', 'PayPal', 'Entras na tua conta PayPal']].map(function (o) {
                return h('label', { key: o[0], className: pay === o[0] ? 'on' : '' }, h('input', { type: 'radio', name: 'pay', checked: pay === o[0], onChange: function () { setPay(o[0]); } }), h('span', { className: 'r-t' }, h('b', null, o[1]), h('span', null, o[2])));
              })),
            pay === 'mbway' ? h('p', { className: 'muted', style: { fontSize: 13, margin: '10px 2px 0' } }, 'Vamos enviar o pedido para ' + (d.phone || 'o teu telemóvel') + '.') : null,
            checkoutErr ? h('div', { className: 'err-txt', role: 'alert', style: { marginTop: 14 } }, checkoutErr) : null,
            h('button', { className: 'btn block', type: 'submit', disabled: sending, style: { height: 56, marginTop: 14, fontSize: 16 } }, sending ? 'A redirecionar para pagamento…' : h(R.Fragment, null, h(Icon, { n: 'lock', s: 17 }), 'Pagar ' + eur(total))),
            h('p', { className: 'muted', style: { fontSize: 12, textAlign: 'center', margin: '12px 0 0' } }, 'Ao pagar aceitas os ', h('a', { className: 'link', href: '#/ajuda' }, 'Termos'), ' e a ', h('a', { className: 'link', href: '#/ajuda' }, 'Política de Privacidade'), '. Devolução grátis em ' + K.CFG.returnDays + ' dias.'))),
        h('aside', { className: 'co-side', 'aria-label': 'Resumo da encomenda' }, h('div', { className: 'h3', style: { marginBottom: 10 } }, 'Resumo'), h(Summary, { ship: shipCost, total: total }),
          h('div', { className: 'secure' }, h(Icon, { n: 'lock', s: 13 }), 'Ligação encriptada · Dados nunca guardados por nós'))));
  }

  // ───── Sucesso — confirma com o Stripe a sério antes de mostrar nada ─────
  // Chamada depois do redirect de /api/checkout. Só regista a encomenda
  // localmente (para aparecer em "A minha conta") DEPOIS de o Stripe confirmar
  // payment_status === 'paid' — nunca antes, ao contrário do antigo placeOrder()
  // que gravava a encomenda só com base no que o formulário continha.
  function Success() {
    var st = K.useStore();
    var sessionId = (function () { var m = (location.hash || '').match(/[?&]session_id=([^&]+)/); return m ? decodeURIComponent(m[1]) : null; })();
    var stS = useState('loading'), status = stS[0], setStatus = stS[1]; // loading | ok | error | unpaid
    var orderS = useState(null), order = orderS[0], setOrder = orderS[1];
    var errS = useState(''), err = errS[0], setErr = errS[1];
    var doneRef = R.useRef(false);

    useEffect(function () {
      if (!sessionId) { setStatus('error'); setErr('Sessão de pagamento em falta.'); return; }
      if (doneRef.current) return;
      doneRef.current = true;
      fetch('/api/checkout-session?session_id=' + encodeURIComponent(sessionId))
        .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (res) {
          if (!res.ok) { setStatus('error'); setErr((res.data && res.data.error) || 'Não foi possível confirmar o pagamento.'); return; }
          if (!res.data.paid) { setStatus('unpaid'); return; }
          // Pagamento confirmado pelo Stripe — agora sim regista a encomenda.
          var pending = (function () { try { return JSON.parse(localStorage.getItem('kn5-pending')); } catch (e) { return null; } })();
          var n = 'KN' + sessionId.slice(-8).toUpperCase();
          var already = st.orders.find(function (x) { return x.n === n; });
          var o = already || {
            n: n,
            at: Date.now(),
            lines: (pending && pending.lines) || [],
            subtotal: (pending && pending.subtotal) || (res.data.amount_subtotal || 0) / 100,
            discount: (pending && pending.discount) || 0,
            ship: (pending && pending.ship) || 0,
            total: (res.data.amount_total || 0) / 100,
            info: Object.assign({}, pending && pending.info, {
              email: res.data.customer_email || (pending && pending.info && pending.info.email) || '',
              name: res.data.customer_name || (pending && pending.info && pending.info.name) || '',
              payment: res.data.payment_method || (pending && pending.info && pending.info.payment) || 'card',
            }),
            eta: K.deliveryWindow((pending && pending.info && pending.info.shipping === 'exp') ? 'exp' : 'std'),
            stripeSessionId: sessionId,
          };
          if (!already) st.recordOrder(o);
          try { localStorage.removeItem('kn5-pending'); } catch (e) {}
          setOrder(o);
          setStatus('ok');
        })
        .catch(function () { setStatus('error'); setErr('Erro de ligação ao confirmar o pagamento.'); });
    }, [sessionId]);

    if (status === 'loading') {
      return h('main', { className: 'wrap empty', style: { textAlign: 'center', paddingTop: 80 } },
        h('p', { className: 'h3' }, 'A confirmar o teu pagamento…'),
        h('p', { className: 'muted' }, 'Um momento, estamos a validar diretamente com o Stripe.'));
    }
    if (status === 'unpaid') {
      return h('main', { className: 'wrap empty', style: { textAlign: 'center', paddingTop: 80 } },
        h('p', { className: 'h3' }, 'Pagamento ainda não confirmado.'),
        h('p', { className: 'muted' }, 'Se completaste o pagamento, aguarda uns segundos e atualiza a página. Caso contrário, a encomenda foi cancelada.'),
        h('a', { className: 'btn', href: '#/checkout', style: { marginTop: 16 } }, 'Voltar ao checkout'));
    }
    if (status === 'error') {
      return h('main', { className: 'wrap empty', style: { textAlign: 'center', paddingTop: 80 } },
        h('p', { className: 'h3' }, 'Não foi possível confirmar a encomenda.'),
        h('p', { className: 'err-txt' }, err),
        h('p', { className: 'muted', style: { marginTop: 8 } }, 'Se o dinheiro saiu da conta, contacta-nos com o número da sessão: ', h('code', null, sessionId || '—'), '.'),
        h('a', { className: 'btn', href: '#/ajuda', style: { marginTop: 16 } }, 'Contactar ajuda'));
    }
    return h(ConfirmBody, { o: order });
  }

  function Confirm(p) {
    var st = K.useStore(), o = st.orders.find(function (x) { return x.n === p.route.id; });
    if (!o) return h('main', { className: 'wrap empty' }, h('p', { className: 'h3' }, 'Encomenda não encontrada.'), h('a', { className: 'btn', href: '#/' }, 'Voltar ao início'));
    return h(ConfirmBody, { o: o });
  }

  function ConfirmBody(p) {
    var o = p.o;
    var aS = useState(false), acc = aS[0], setAcc = aS[1];
    var payTxt = { mbway: 'Pedido MB WAY enviado para ' + o.info.phone + '. Confirma na app nos próximos 4 minutos.', mb: 'Entidade 21 000 · Referência 123 456 789 · ' + eur(o.total) + ' · válida 48 h.', card: 'Pagamento com cartão aprovado.', paypal: 'Pagamento PayPal aprovado.' }[o.info.payment];
    return h('main', { className: 'wrap', style: { maxWidth: 760 } },
      h('div', { className: 'ok-hero' }, h('div', { className: 'ok-ic' }, h(Icon, { n: 'check', s: 30, w: 2.4 })),
        h('h1', { className: 'h2' }, 'Obrigado, ' + o.info.name.split(' ')[0] + '!'),
        h('p', { className: 'muted', style: { margin: '8px 0 0' } }, 'Encomenda ', h('b', { style: { color: 'var(--ink)' } }, '#' + o.n), ' confirmada. Enviámos os detalhes para ', h('b', { style: { color: 'var(--ink)' } }, o.info.email), '.')),
      h('div', { className: 'card-box', style: { marginBottom: 14 } },
        h('div', { style: { display: 'flex', gap: 10, alignItems: 'flex-start' } }, h(Icon, { n: 'card', s: 20 }), h('div', null, h('b', null, 'Pagamento'), h('p', { className: 'muted', style: { margin: '4px 0 0', fontSize: 14 } }, payTxt)))),
      h('div', { className: 'card-box', style: { marginBottom: 14 } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' } }, h('b', null, o.info.shipping === 'pickup' ? 'Recolha na loja, Cartaxo' : 'Entrega prevista: ' + o.eta), h('span', { className: 'muted', style: { fontSize: 14 } }, o.info.shipping === 'pickup' ? 'Avisamos por SMS' : o.info.address + ', ' + o.info.zip + ' ' + o.info.city)),
        h('div', { className: 'timeline' }, [['Confirmada', true], ['Em preparação', false], ['Enviada', false], ['Entregue', false]].map(function (s) { return h('div', { key: s[0], className: s[1] ? 'done' : '' }, h('i'), s[0]); }))),
      h('div', { className: 'card-box', style: { marginBottom: 14 } },
        o.lines.map(function (l, i) { return h('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0' } }, h('span', null, l.qty + ' × ' + l.name, h('span', { className: 'muted' }, ' ' + [l.color, l.size !== 'Único' ? l.size : null].filter(Boolean).join(' · '))), h('span', { className: 'price' }, eur(l.price * l.qty))); }),
        h('div', { style: { borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 } },
          o.discount ? h('div', { className: 'sum-row' }, h('span', null, 'Desconto'), h('span', null, '−' + eur(o.discount))) : null,
          h('div', { className: 'sum-row' }, h('span', null, 'Envio'), h('span', null, o.ship ? eur(o.ship) : 'Grátis')),
          h('div', { className: 'sum-row tot' }, h('span', null, 'Total pago'), h('span', null, eur(o.total))))),
      h('div', { className: 'card-box', style: { marginBottom: 24, background: 'var(--soft)', boxShadow: 'none' } },
        acc ? h('p', { style: { margin: 0, fontWeight: 600 } }, '✓ Conta criada. Enviámos um link de acesso para ' + o.info.email + '.') :
        h(R.Fragment, null, h('b', null, 'Guarda os teus dados para a próxima vez'), h('p', { className: 'muted', style: { margin: '4px 0 12px', fontSize: 14 } }, 'Acompanha encomendas e compra mais rápido. Sem palavra-passe: enviamos um link para o teu email.'),
          h('button', { className: 'btn sm', onClick: function () { setAcc(true); } }, 'Criar conta com ' + o.info.email))),
      h('div', { style: { display: 'flex', gap: 10, justifyContent: 'center', paddingBottom: 30 } }, h('a', { className: 'btn ghost', href: '#/conta' }, 'Ver encomendas'), h('a', { className: 'btn', href: '#/loja' }, 'Continuar a comprar')));
  }

  function Account() {
    var st = K.useStore();
    return h('main', { className: 'wrap', style: { maxWidth: 860, paddingTop: 24, paddingBottom: 40 } },
      h('h1', { className: 'h2' }, 'A minha conta'),
      h('p', { className: 'muted', style: { margin: '6px 0 24px' } }, 'Encomendas feitas neste dispositivo.'),
      st.orders.length === 0 ? h('div', { className: 'card-box empty' }, h('p', { className: 'h3' }, 'Ainda não tens encomendas.'), h('a', { className: 'btn', href: '#/loja', style: { marginTop: 10 } }, 'Começar a comprar')) :
      st.orders.map(function (o) { return h('a', { key: o.n, href: '#/confirmacao/' + o.n, className: 'card-box', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 } },
        h('div', null, h('b', null, '#' + o.n), h('div', { className: 'muted', style: { fontSize: 13 } }, new Date(o.at).toLocaleDateString('pt-PT') + ' · ' + o.lines.reduce(function (s, l) { return s + l.qty; }, 0) + ' artigos · entrega ' + o.eta)),
        h('span', { style: { display: 'flex', alignItems: 'center', gap: 10 } }, h('b', { className: 'price' }, eur(o.total)), h(Icon, { n: 'chev', s: 18 }))); }));
  }

  function Favorites() {
    var st = K.useStore(), items = st.wish.map(function (id) { return st.byId[id]; }).filter(Boolean);
    return h('main', { className: 'wrap', style: { paddingTop: 24, paddingBottom: 40 } },
      h('h1', { className: 'h2' }, 'Favoritos'), h('p', { className: 'muted', style: { margin: '6px 0 22px' } }, items.length ? items.length + ' produtos guardados' : 'Toca no coração de um produto para o guardar aqui.'),
      items.length ? h('div', { className: 'grid' }, items.map(function (x) { return h(K.Card, { key: x.id, product: x }); })) : h('a', { className: 'btn', href: '#/loja' }, 'Explorar a loja'));
  }

  function Help() {
    var Q = [['Quanto custam os portes?', 'Standard ' + eur(K.CFG.shipStd) + ' (grátis acima de ' + eur(K.CFG.freeShip) + '), expresso ' + eur(K.CFG.shipExp) + ' e recolha grátis na loja do Cartaxo.'],
      ['Quando recebo a encomenda?', 'Encomendas feitas em dias úteis até às ' + K.CFG.cutoffHour + 'h saem no mesmo dia. Standard: 2–4 dias úteis. Expresso: 1 dia útil. Peças personalizadas: 5–7 dias úteis.'],
      ['Como devolvo?', 'Tens ' + K.CFG.returnDays + ' dias e a devolução é grátis. Escreve-nos com o número da encomenda e enviamos a etiqueta. O reembolso chega em 2–5 dias úteis.'],
      ['Que métodos de pagamento aceitam?', 'MB WAY, Referência Multibanco, cartão (Visa, Mastercard), Apple Pay, Google Pay e PayPal.'],
      ['Posso trocar uma peça personalizada?', 'Só em caso de defeito, porque é feita para ti. Confirma o tamanho no guia antes de encomendar.'],
      ['Emitem fatura com NIF?', 'Sim. Marca a opção no checkout e a fatura chega por email.']];
    return h('main', { className: 'wrap', style: { maxWidth: 820, paddingTop: 24, paddingBottom: 40 } },
      h('h1', { className: 'h2' }, 'Ajuda'), h('p', { className: 'muted', style: { margin: '6px 0 20px' } }, 'Respostas rápidas. Se precisares de mais, respondemos em menos de 24 h úteis.'),
      h('div', { className: 'acc' }, Q.map(function (q, i) { return h('details', { key: i, open: i === 0 }, h('summary', null, q[0]), h('div', { className: 'acc-b' }, q[1])); })),
      h('div', { className: 'card-box', style: { marginTop: 24, display: 'grid', gap: 6 } }, h('b', null, 'Contactos'), h('span', { className: 'muted' }, 'karmicnode@gmail.com · seg–sex, 9h–18h'), h('span', { className: 'muted' }, 'Loja e oficina: Cartaxo, Portugal')));
  }

  // ───── Personalizar (simples: peça → cor → texto → tamanho) ─────
  var FONTS = [['Inter', 'Moderna'], ['Georgia', 'Clássica'], ['Courier New', 'Máquina']];
  var THREAD = [['#111111', 'Preto'], ['#FFFFFF', 'Branco'], ['#C9A15B', 'Dourado'], ['#8E1B24', 'Vermelho']];
  function Personalize(p) {
    var st = K.useStore();
    var opts = useMemo(function () { return window.KN_PRODUCTS.filter(function (x) { return x.custom && x.mock; }); }, []);
    var start = opts.find(function (x) { return x.id === p.route.params.p; }) || opts[0];
    var pS = useState(start), prod = pS[0], setProd = pS[1];
    var cS = useState(start.colors[0]), col = cS[0], setCol = cS[1];
    var tS = useState('Karmic'), txt = tS[0], setTxt = tS[1];
    var fS = useState(0), font = fS[0], setFont = fS[1];
    var thS = useState(THREAD[1]), thread = thS[0], setThread = thS[1];
    var szS = useState(null), size = szS[0], setSize = szS[1];
    var eS = useState(false), err = eS[0], setErr = eS[1];
    function pick(x) { setProd(x); setCol(x.colors[0]); setSize(x.sizes.length === 1 ? x.sizes[0] : null); }
    var light = (function (hex) { var c = hex.replace('#', ''); return (0.2126 * parseInt(c.substr(0, 2), 16) + 0.7152 * parseInt(c.substr(2, 2), 16) + 0.0722 * parseInt(c.substr(4, 2), 16)) / 255 > 0.6; })(col.hex);
    var price = prod.price + (txt.trim() ? 8 : 0);
    function add() { if (!size) { setErr(true); return; } st.add(prod, { extra: txt.trim() ? 8 : 0, color: col.name, size: size, note: txt.trim() + (txt.trim() ? ' · ' + FONTS[font][1] + ' · linha ' + thread[1].toLowerCase() : '') }); }
    var top = prod.mock === 'cap' ? '44%' : prod.mock === 'hoodie' ? '40%' : '34%';
    return h('main', { className: 'wrap', style: { paddingTop: 20, paddingBottom: 40 } },
      h('h1', { className: 'h2' }, 'Personalizar'), h('p', { className: 'muted', style: { margin: '6px 0 20px' } }, 'Bordado à mão no Cartaxo. Pronto em 5–7 dias úteis.'),
      h('div', { className: 'pdp' },
        h('div', { style: { position: 'relative' } }, h(K.ProductImage, { product: prod, color: col, style: { aspectRatio: '1/1' } }),
          txt.trim() ? h('div', { 'aria-hidden': true, style: { position: 'absolute', left: '50%', top: top, transform: 'translateX(-50%)', fontFamily: FONTS[font][0], fontSize: 'clamp(14px,2.4vw,26px)', fontWeight: font === 0 ? 600 : 400, color: thread[0] === '#FFFFFF' && light ? '#111' : thread[0], letterSpacing: font === 0 ? '.04em' : 0, whiteSpace: 'nowrap', textShadow: '0 1px 0 rgba(0,0,0,.12)', pointerEvents: 'none' } }, txt) : null),
        h('div', { className: 'buy' },
          h('div', null, h('div', { className: 'opt-h' }, h('b', null, '1. Peça')), h('div', { className: 'chiprow' }, opts.map(function (x) { return h('button', { key: x.id, className: 'chip' + (x.id === prod.id ? ' on' : ''), onClick: function () { pick(x); } }, x.name.replace(/ (Essencial|Algodão|Premium|Clássic[oa]).*/, '')); }))),
          h('div', null, h('div', { className: 'opt-h' }, h('span', null, h('b', null, '2. Cor'), ': ' + col.name)), h('div', { className: 'colors' }, prod.colors.map(function (c) { return h('button', { key: c.name, className: c.name === col.name ? 'on' : '', style: { background: c.hex }, 'aria-label': c.name, onClick: function () { setCol(c); } }); }))),
          h('div', null, h('div', { className: 'opt-h' }, h('b', null, '3. Texto'), h('span', { className: 'muted', style: { fontSize: 12 } }, txt.length + '/16 · +8,00 €')),
            h('input', { className: 'input', style: { width: '100%', borderRadius: 'var(--r-sm)' }, value: txt, maxLength: 16, onChange: function (e) { setTxt(e.target.value); }, placeholder: 'Nome, data ou iniciais' }),
            h('div', { className: 'chiprow', style: { marginTop: 10 } }, FONTS.map(function (f, i) { return h('button', { key: f[0], className: 'chip' + (font === i ? ' on' : ''), style: { fontFamily: f[0] }, onClick: function () { setFont(i); } }, f[1]); })),
            h('div', { style: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, fontSize: 14 } }, 'Linha:', THREAD.map(function (t) { return h('button', { key: t[1], title: t[1], 'aria-label': 'Linha ' + t[1], onClick: function () { setThread(t); }, style: { width: 28, height: 28, borderRadius: '50%', background: t[0], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2)', outline: thread[1] === t[1] ? '2px solid var(--ink)' : 'none', outlineOffset: 2 } }); }), h('span', { className: 'muted' }, thread[1]))),
          prod.sizes.length > 1 ? h('div', null, h('div', { className: 'opt-h' }, h('b', null, '4. Tamanho')), h('div', { className: 'sizes' }, prod.sizes.map(function (z) { return h('button', { key: z, className: size === z ? 'on' : '', onClick: function () { setSize(z); setErr(false); } }, z); })), err ? h('div', { className: 'err-txt' }, 'Escolhe um tamanho para continuar.') : null) : null,
          h('button', { className: 'btn block', style: { height: 54 }, onClick: add }, 'Adicionar ao carrinho · ' + eur(price)),
          h('div', { className: 'deliv' }, h('div', null, h(Icon, { n: 'pen', s: 18 }), h('span', null, 'Vês uma prova por email antes do bordado.')), h('div', null, h(Icon, { n: 'truck', s: 18 }), h('span', null, 'Envio em 5–7 dias úteis.')), h('div', null, h(Icon, { n: 'ret', s: 18 }), h('span', null, 'Peças personalizadas só são trocadas em caso de defeito.'))))));
  }

  Object.assign(window.KN, { Checkout: Checkout, Success: Success, Confirm: Confirm, Account: Account, Favorites: Favorites, Help: Help, Personalize: Personalize });
})();
