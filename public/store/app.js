// Karmic Node — app (v12: menu lateral)
(function () {
  'use strict';
  var R = React, h = R.createElement, K = window.KN;
  var TITLES = { home: 'Karmic Node — Roupa, Calçado, Acessórios e Casa', loja: 'Loja', p: 'Produto', checkout: 'Finalizar compra', sucesso: 'Encomenda confirmada', confirmacao: 'Encomenda confirmada', conta: 'A minha conta', favoritos: 'Favoritos', ajuda: 'Ajuda', personalizar: 'Personalizar', 'black-friday': 'Black Friday' };

  function Pages() {
    var r = K.useRoute(), st = K.useStore();
    var mS = R.useState(false), menu = mS[0], setMenu = mS[1];
    var cS = R.useState(function () { try { return localStorage.getItem('kn5-side') === 'mini'; } catch (e) { return false; } }), mini = cS[0], setMini = cS[1];
    R.useEffect(function () {
      var t = r.name === 'p' && st.byId[r.id] ? st.byId[r.id].name : TITLES[r.name];
      document.title = r.name === 'home' ? TITLES.home : (t || 'Karmic Node') + ' · Karmic Node';
    }, [r.name, r.id]);
    R.useEffect(function () { st.setCartOpen(false); setMenu(false); }, [r.name, r.id, r.params.cat, r.params.f]);
    function toggleMini() { setMini(function (v) { try { localStorage.setItem('kn5-side', v ? 'full' : 'mini'); } catch (e) {} return !v; }); }

    var page;
    switch (r.name) {
      case 'loja': page = h(K.Listing, { route: r }); break;
      case 'p': page = h(K.Product, { route: r }); break;
      case 'checkout': page = h(K.Checkout, { route: r }); break;
      case 'sucesso': page = h(K.Success, { route: r }); break;
      case 'confirmacao': page = h(K.Confirm, { route: r }); break;
      case 'conta': page = h(K.Account, { route: r }); break;
      case 'favoritos': page = h(K.Favorites, { route: r }); break;
      case 'ajuda': page = h(K.Help, { route: r }); break;
      case 'black-friday': page = h(K.BlackFriday, { route: r }); break;
      case 'personalizar': page = h(K.Personalize, { route: r, key: r.params.p || r.params.d || 'x' }); break;
      default: page = h(K.Home, { route: r });
    }

    if (r.name === 'checkout' || r.name === 'sucesso') {
      return h(R.Fragment, null,
        h('header', { className: 'ktop' }, h('div', { className: 'ktop-in', style: { justifyContent: 'space-between' } },
          h('a', { href: '#/', className: 'link', style: { fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' } }, h(K.Icon, { n: 'chevL', s: 16 }), 'Continuar a comprar'),
          h(K.Brand),
          h('span', { className: 'muted', style: { fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' } }, h(K.Icon, { n: 'lock', s: 15 }), 'Pagamento seguro'))),
        page, h(K.CartDrawer), h(K.Toast));
    }

    return h(R.Fragment, null,
      h(K.TopBar, { route: r, onMenu: function () { setMenu(true); } }),
      h('div', { className: 'kshell' + (mini ? ' mini' : '') },
        h('aside', { className: 'kside' }, h(K.SideNav, { route: r, mini: mini, onToggle: toggleMini })),
        h('div', { className: 'kmain' }, page, h(K.Footer))),
      h(K.Sheet, { open: menu, onClose: function () { setMenu(false); }, side: 'left', label: 'Menu' },
        h('div', { className: 'sheet-h' }, h(K.Brand), h('button', { className: 'iconbtn', onClick: function () { setMenu(false); }, 'aria-label': 'Fechar menu' }, h(K.Icon, { n: 'x' }))),
        h('div', { className: 'sheet-b', style: { padding: 0 } }, h(K.SideNav, { route: r, inSheet: true }))),
      h(K.CartDrawer), h(K.Toast));
  }

  function App() { return h(K.StoreProvider, null, h(Pages)); }
  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
