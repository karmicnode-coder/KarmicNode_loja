// Karmic Node — Confirmação, Conta, Favoritos, Ajuda
// Nota: o checkout em si (passo de pagamento) vive em checkout-v3.js;
// a personalização de produtos vive em studio.js. Este ficheiro só
// trata das páginas pós-compra e de apoio que não têm versão própria.
(function () {
  'use strict';
  var R = React, h = R.createElement, useState = R.useState, useEffect = R.useEffect;
  var K = window.KN, Icon = K.Icon, eur = K.eur;

  // ───── Sessão do Clube KN (Supabase) ─────
  // Usa a mesma conta Supabase do login em public/login/kn-auth.jsx (projeto wfqvofnneaewgfwcvqcx).
  // Como esta página não carrega o Babel nem os componentes do /login/, falamos
  // diretamente com o SDK do Supabase só para saber "há sessão?" e "qual o nome/email?".
  var SB_URL = 'https://wfqvofnneaewgfwcvqcx.supabase.co';
  var SB_KEY = 'sb_publishable_qIdt7lw7JKSN9bCrH076gg_UINkj8vW';
  var sbClient = null;
  function getSb() {
    if (sbClient) return sbClient;
    if (window.supabase && window.supabase.createClient) {
      sbClient = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
    }
    return sbClient;
  }
  function useSession() {
    var sS = useState(undefined), session = sS[0], setSession = sS[1]; // undefined = a carregar, null = sem sessão
    useEffect(function () {
      var sb = getSb();
      if (!sb) { setSession(null); return; }
      var alive = true;
      sb.auth.getSession().then(function (r) { if (alive) setSession((r.data && r.data.session) || null); });
      var sub = sb.auth.onAuthStateChange(function (_evt, s) { if (alive) setSession(s || null); });
      return function () { alive = false; sub && sub.data && sub.data.subscription && sub.data.subscription.unsubscribe(); };
    }, []);
    return session;
  }

  function Confirm(p) {
    var st = K.useStore(), o = st.orders.find(function (x) { return x.n === p.route.id; });
    var aS = useState(false), acc = aS[0], setAcc = aS[1];
    if (!o) return h('main', { className: 'wrap empty' }, h('p', { className: 'h3' }, 'Encomenda não encontrada.'), h('a', { className: 'btn', href: '#/' }, 'Voltar ao início'));
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
    var session = useSession();
    var name = session && session.user && session.user.user_metadata && session.user.user_metadata.full_name;
    var email = session && session.user && session.user.email;

    function signOut() {
      var sb = getSb();
      if (sb) sb.auth.signOut();
    }

    // A carregar: ainda não sabemos se há sessão — evita piscar "Entrar" antes de confirmar.
    if (session === undefined) {
      return h('main', { className: 'wrap', style: { maxWidth: 860, paddingTop: 24, paddingBottom: 40 } },
        h('h1', { className: 'h2' }, 'A minha conta'),
        h('p', { className: 'muted', style: { margin: '6px 0 24px' } }, 'A verificar sessão…'));
    }

    // Sem sessão: convite a entrar/criar conta no Clube KN (ver public/login/).
    if (!session) {
      return h('main', { className: 'wrap', style: { maxWidth: 860, paddingTop: 24, paddingBottom: 40 } },
        h('h1', { className: 'h2' }, 'A minha conta'),
        h('p', { className: 'muted', style: { margin: '6px 0 24px' } }, 'Entra no Clube KN para veres as tuas encomendas em qualquer dispositivo.'),
        h('div', { className: 'card-box', style: { display: 'flex', gap: 10, flexWrap: 'wrap' } },
          h('a', { className: 'btn', href: '/login/' }, 'Entrar'),
          h('a', { className: 'btn ghost', href: '/login/#criar' }, 'Criar conta')),
        st.orders.length ? h('div', { style: { marginTop: 28 } },
          h('p', { className: 'muted', style: { fontSize: 13, marginBottom: 10 } }, 'Encomendas feitas neste dispositivo (sem conta):'),
          st.orders.map(function (o) { return h('a', { key: o.n, href: '#/confirmacao/' + o.n, className: 'card-box', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 } },
            h('div', null, h('b', null, '#' + o.n), h('div', { className: 'muted', style: { fontSize: 13 } }, new Date(o.at).toLocaleDateString('pt-PT') + ' · ' + o.lines.reduce(function (s, l) { return s + l.qty; }, 0) + ' artigos · entrega ' + o.eta)),
            h('span', { style: { display: 'flex', alignItems: 'center', gap: 10 } }, h('b', { className: 'price' }, eur(o.total)), h(Icon, { n: 'chev', s: 18 }))); })) : null);
    }

    // Com sessão: nome da cliente e "Terminar sessão". As encomendas mostradas são as deste
    // dispositivo (guardadas em localStorage); a tabela `orders` do Supabase é a fonte oficial
    // assim que o backend de pagamentos (api/checkout.js) estiver configurado com credenciais reais.
    return h('main', { className: 'wrap', style: { maxWidth: 860, paddingTop: 24, paddingBottom: 40 } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 } },
        h('div', null, h('h1', { className: 'h2' }, 'Olá, ' + (name ? name.split(' ')[0] : 'membro') + '.'),
          h('p', { className: 'muted', style: { margin: '6px 0 24px' } }, email)),
        h('button', { className: 'btn ghost sm', onClick: signOut }, 'Terminar sessão')),
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

  Object.assign(window.KN, { Confirm: Confirm, Account: Account, Favorites: Favorites, Help: Help });
})();
